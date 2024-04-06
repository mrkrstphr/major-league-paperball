import { spawn } from 'child_process';
import { CronJob } from 'cron';
import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import fs from 'fs';
import handlebars from 'handlebars';
import handlebarsRepeat from 'handlebars-helper-repeat';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { equals } from 'ramda';
import getNextState from './engine.js';

const fileName = 'screenshot.png';
const port = 3000;

const partialsDir = 'views/partials';

const config = {
  bin: '/opt/homebrew/bin/chromium',
  display_width: 800,
  display_height: 480,
  wait: 8,
};

const takeScreenshot = async () => {
  const browser = await puppeteer.launch({
    executablePath: config.bin,
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: config.display_width,
    height: config.display_height,
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

  return new Promise(() => {
    pythonProcess.on('exit', (code) => {
      resolve(code);
    });
  });
};

handlebars.registerHelper('repeat', handlebarsRepeat);
handlebars.registerHelper('gte', function (a, b) {
  var next = arguments[arguments.length - 1];
  return a >= b ? next.fn(this) : next.inverse(this);
});
handlebars.registerHelper('includes', function (a, b) {
  var next = arguments[arguments.length - 1];
  return a.includes(b) ? next.fn(this) : next.inverse(this);
});

fs.readdirSync(partialsDir).forEach((filename) => {
  if (filename.endsWith('.hbs')) {
    const name = path.parse(filename).name;

    handlebars.registerPartial(
      name,
      fs.readFileSync(path.join(partialsDir, filename), 'utf-8')
    );
  }
});

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

let lastState = { mode: 'offline' };

app.get('/', (_, res) => {
  res.render(lastState.mode, lastState.data);
});

app.listen(port, () => {
  console.log(`🤖 listening on port ${port}`);
});

async function runTick() {
  const nextState = await getNextState(lastState);

  // console.log('nextState', JSON.stringify(nextState, null, 2));

  if (!equals(nextState, lastState)) {
    lastState = nextState;

    await takeScreenshot();
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
