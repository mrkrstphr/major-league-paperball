import 'dotenv/config';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { processGameState } from './app/engine/liveGameState';
import { renderToImage } from './app/render';
import { State } from './app/state';

const mockFile = process.argv[2];
const outputFile = process.argv[3] ?? 'output.png';

if (!mockFile) {
  console.log(`Usage: npx ts-node fakeRender.ts <mockFile.json> [output.png]`);
  process.exit(1);
}

if (!existsSync(mockFile)) {
  console.log(`File not found: ${mockFile}`);
  process.exit(1);
}

const cache = {
  schedule: undefined,
  gameEnded: {},
  team: { teamName: 'Detroit Tigers', id: 116, league: { id: 103 }, division: { id: 202 } },
};

(async () => {
  const raw = await readFile(mockFile, 'utf8');
  const data = JSON.parse(raw);

  let state: State;

  // If the JSON has liveData it's a live game feed; otherwise treat as a pre-shaped state
  if (data.liveData) {
    state = await processGameState(data, cache);
  } else {
    // Assume it's already a { mode, data } state object
    state = data as State;
  }

  console.log(`Rendering mode: ${state.mode}`);

  const png = await renderToImage(state);
  await writeFile(outputFile, png);

  console.log(`Wrote ${outputFile} (${png.length} bytes)`);
})();
