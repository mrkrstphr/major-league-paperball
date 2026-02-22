import 'dotenv/config';
import { execSync } from 'child_process';
import http from 'http';
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { processGameState } from './app/engine/liveGameState';
import { renderToImage } from './app/render';

const dir = process.argv[2];

if (!dir) {
  console.log('Usage: npx ts-node walkGame.ts <directory> [--auto-speed <seconds>]');
  process.exit(1);
}

if (!existsSync(dir)) {
  console.log(`Directory not found: ${dir}`);
  process.exit(1);
}

const speedIdx = process.argv.indexOf('--auto-speed');
const AUTO_SPEED = speedIdx !== -1 ? Number(process.argv[speedIdx + 1]) * 1000 : 5000;

let files = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => path.join(dir, f));

if (files.length === 0) {
  console.log('No JSON files found.');
  process.exit(1);
}

const OUTPUT = 'walkgame.png';
const PORT = 9998;

const cache = {
  schedule: undefined,
  gameEnded: {},
  team: { teamName: 'Unknown', id: 0 },
};

let current = 0;
let autoTimer: ReturnType<typeof setInterval> | null = null;
let rendering = false;
let server: http.Server;

function clearLine() {
  process.stdout.write('\r\x1b[K');
}

function printStatus(msg: string) {
  clearLine();
  process.stdout.write(msg + '\n');
}

function printControls() {
  clearLine();
  const autoLabel = autoTimer ? ' \x1b[32m[AUTO ON]\x1b[0m' : '';
  process.stdout.write(`  n next  p prev  d delete  a auto${autoLabel}  q quit `);
}

async function render(i: number) {
  if (rendering) return;
  rendering = true;

  const file = files[i];
  const name = path.basename(file);

  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const state = await processGameState(data, cache);
    const png = await renderToImage(state);
    await writeFile(OUTPUT, png);
    printStatus(`[${i + 1}/${files.length}]  ${name}  →  ${state.mode}`);
  } catch (e: any) {
    printStatus(`[${i + 1}/${files.length}]  ${name}  →  ERROR: ${e.message}`);
  }

  printControls();
  rendering = false;
}

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
}

function startAuto() {
  autoTimer = setInterval(async () => {
    if (current < files.length - 1) {
      current++;
      await render(current);
    } else {
      stopAuto();
      printStatus('  Auto: reached end.');
      printControls();
    }
  }, AUTO_SPEED);
}

async function handleKey(buf: Buffer) {
  const ch = buf.toString();

  if (buf[0] === 3 || ch === 'q') {
    stopAuto();
    server.close();
    clearLine();
    console.log('Bye.');
    process.exit(0);
  }

  if (ch === 'n') {
    stopAuto();
    if (current < files.length - 1) {
      current++;
      await render(current);
    } else {
      clearLine();
      process.stdout.write('  Already at last file. ');
    }
    return;
  }

  if (ch === 'p') {
    stopAuto();
    if (current > 0) {
      current--;
      await render(current);
    } else {
      clearLine();
      process.stdout.write('  Already at first file. ');
    }
    return;
  }

  if (ch === 'd') {
    stopAuto();
    const file = files[current];
    try {
      unlinkSync(file);
      files.splice(current, 1);
      printStatus(`  Deleted: ${path.basename(file)}`);
      if (files.length === 0) {
        server.close();
        console.log('No files remaining.');
        process.exit(0);
      }
      if (current >= files.length) current = files.length - 1;
      await render(current);
    } catch (e: any) {
      printStatus(`  Delete failed: ${e.message}`);
      printControls();
    }
    return;
  }

  if (ch === 'a') {
    if (autoTimer) {
      stopAuto();
      printStatus('  Auto stopped.');
      printControls();
    } else {
      startAuto();
      printStatus(`  Auto started — advancing every ${AUTO_SPEED / 1000}s. Press a to stop.`);
      printControls();
    }
    return;
  }
}

const HTML = `<!DOCTYPE html>
<html>
<head><style>
  body { margin: 0; background: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; border: 1px solid #ccc; }
</style></head>
<body>
  <img id="i" src="/img">
  <script>setInterval(() => { document.getElementById('i').src = '/img?t=' + Date.now(); }, 300);</script>
</body>
</html>`;

(async () => {
  console.log(`\n${files.length} files in ${dir}\n`);

  server = http.createServer((req, res) => {
    if (req.url?.startsWith('/img')) {
      if (existsSync(OUTPUT)) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        res.end(readFileSync(OUTPUT));
      } else {
        res.writeHead(404);
        res.end();
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  });

  server.listen(PORT, async () => {
    await render(current);
    execSync(`open http://localhost:${PORT}`);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', handleKey);
  });
})();
