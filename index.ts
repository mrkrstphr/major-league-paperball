import { spawn } from 'child_process';
import { CronJob } from 'cron';
import 'dotenv/config';
import puppeteer from 'puppeteer-core';
import { equals } from 'ramda';
import getNextState from './app/engine/index';
import server from './app/server';
import { getState, setState } from './app/state';
import {
  browserBin,
  consoleDebug,
  screenHeight,
  screenWidth,
  withoutPaper,
} from './app/utils/env';

const fileName = 'screenshot.png';
const port = 3000;

const takeScreenshot = async () => {
  const browser = await puppeteer.launch({
    executablePath: browserBin(),
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: screenWidth(),
    height: screenHeight(),
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
    consoleDebug('State changed:', nextState.mode);

    setState(nextState);

    await takeScreenshot();

    if (withoutPaper()) {
      consoleDebug('Skipping publishScreenshot, WITHOUT_PAPER');
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
  console.log(`⚾ listening on port ${port}`);
});
