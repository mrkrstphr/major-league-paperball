import { CronJob } from 'cron';
import 'dotenv/config';
import fs from 'fs';
import { equals } from 'ramda';
import getNextState from './app/engine/index';
import { renderToImage } from './app/render';
import { sendToDisplay } from './app/display/index';
import { getState, setState } from './app/state';
import {
  consoleDebug,
  withoutPaper,
} from './app/utils/env';

const fileName = 'screenshot.png';

async function runTick() {
  const currentState = getState();
  const nextState = await getNextState(currentState);

  const hasStateChanged =
    !equals(nextState.data, currentState.data) ||
    nextState.mode !== currentState.mode;

  if (hasStateChanged) {
    consoleDebug('State changed:', nextState.mode);

    setState(nextState);

    const { png, pixels, width, height } = await renderToImage(nextState);
    await fs.promises.writeFile(fileName, png);

    if (withoutPaper()) {
      consoleDebug('Skipping sendToDisplay, WITHOUT_PAPER');
      return;
    }

    await sendToDisplay(pixels, width, height);
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
