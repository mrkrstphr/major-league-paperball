import { spawn } from 'child_process';
import { CronJob } from 'cron';
import 'dotenv/config';
import puppeteer from 'puppeteer-core';
import { equals } from 'ramda';
import server from './app/server.js';
import { getState, setState } from './app/state.js';
import getNextState from './engine.js';

const fileName = 'screenshot.png';
const port = 3000;

const takeScreenshot = async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.BROWSER_BIN,
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: parseInt(process.env.PAPER_WIDTH ?? 800, 10),
    height: parseInt(process.env.PAPER_HEIGHT ?? 480, 10),
  });

  await page.goto(`http://localhost:${port}`, {
    waitUntil: 'networkidle0',
  });
  await page.screenshot({ path: fileName });
  await browser.close();
};

const publishScreenshot = async () => {
  const pythonProcess = spawn('.venv/bin/python3', [
    'display.py',
    'screenshot.png',
  ]);

  return new Promise((resolve) => {
    pythonProcess.on('exit', (code) => {
      resolve(code);
    });
  });
};

async function runTick() {
  const currentState = getState();
  const nextState = await getNextState(currentState);

  const hasStateChanged =
    !equals(nextState.data, currentState.data) ||
    nextState.mode !== currentState.mode;

  if (hasStateChanged) {
    console.info('State changed:', nextState.mode);

    setState(nextState);

    await takeScreenshot();

    if (process.env.WITHOUT_PAPER) {
      console.info('Skipping publishScreenshot, WITHOUT_PAPER');
      return;
    }

    await publishScreenshot();
  }
}

runTick();

CronJob.from({
  cronTime: '*/20 * * * * *',
  onTick: runTick,
  start: true,
  timeZone: 'America/Los_Angeles',
});

server.listen(port, () => {
  console.log(`🤖 listening on port ${port}`);
});
