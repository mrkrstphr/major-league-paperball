import { spawn } from 'child_process';
import { CronJob } from 'cron';
import 'dotenv/config';
import fs from 'fs';
import { equals } from 'ramda';
import getNextState from './app/engine/index';
import { renderToImage } from './app/render';
import { getState, setState } from './app/state';
import {
  consoleDebug,
  withoutPaper,
} from './app/utils/env';

const fileName = 'screenshot.png';

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

    const png = await renderToImage(nextState);
    await fs.promises.writeFile(fileName, png);

    if (withoutPaper()) {
      consoleDebug('Skipping publishScreenshot, WITHOUT_PAPER');
      return;
    }

    await publishScreenshot();
  }
}

(async () => {
  console.log('⚾ major-league-paperball starting');

  runTick();

  CronJob.from({
    cronTime: '*/20 * * * * *',
    onTick: runTick,
    start: true,
    timeZone: 'America/Los_Angeles',
  });
})();
