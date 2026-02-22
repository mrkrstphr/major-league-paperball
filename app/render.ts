import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { State } from './state';
import { screenWidth, screenHeight } from './utils/env';

import LiveGame from './components/LiveGame';
import EndOfInning from './components/EndOfInning';
import EndOfGame from './components/EndOfGame';
import Preview from './components/Preview';
import Standings from './components/Standings';
import MissingTeam from './components/MissingTeam';
import Offline from './components/Offline';

const COMPONENTS: Record<string, React.FC<any>> = {
  'live-game': LiveGame,
  'end-of-inning': EndOfInning,
  'end-of-game': EndOfGame,
  preview: Preview,
  standings: Standings,
  'missing-team': MissingTeam,
  offline: Offline,
};

// Load fonts once at module init
const fontRegular = fs.readFileSync(
  path.join(__dirname, '../assets/inter-regular.woff'),
);
const fontBold = fs.readFileSync(
  path.join(__dirname, '../assets/inter-bold.woff'),
);

export async function renderToImage(state: State): Promise<Buffer> {
  const w = screenWidth();
  const h = screenHeight();
  const Component = COMPONENTS[state.mode] ?? Offline;
  const element = React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', width: w, height: h } },
    React.createElement(Component, state.data ?? {}),
  );

  const svg = await satori(element, {
    width: screenWidth(),
    height: screenHeight(),
    fonts: [
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: screenWidth() },
  });

  return Buffer.from(resvg.render().asPng());
}
