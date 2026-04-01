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
  path.join(__dirname, '../assets/silkscreen-regular.ttf'),
);
const fontBold = fs.readFileSync(
  path.join(__dirname, '../assets/silkscreen-bold.ttf'),
);

export async function renderToImage(state: State): Promise<{ png: Buffer; pixels: Uint8Array; width: number; height: number }> {
  const w = screenWidth();
  const h = screenHeight();
  const Component = COMPONENTS[state.mode] ?? Offline;
  const element = (
    <div style={{ display: 'flex', flexDirection: 'column', width: w, height: h }}>
      <Component {...(state.data ?? {})} />
    </div>
  );

  const svg = await satori(element, {
    width: screenWidth(),
    height: screenHeight(),
    fonts: [
      { name: 'Silkscreen', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Silkscreen', data: fontBold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: screenWidth() },
  });

  const rendered = resvg.render();
  return {
    png: rendered.asPng(),
    pixels: rendered.pixels,
    width: rendered.width,
    height: rendered.height,
  };
}

export type RenderedFrame = Awaited<ReturnType<typeof renderToImage>>;
