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
let lastMode = '';
let renderCount = 0;

async function render(i: number) {
  if (rendering) return;
  rendering = true;

  const file = files[i];
  const name = path.basename(file);
  console.log(`[${i + 1}/${files.length}]  ${name}  →  rendering…`);

  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const state = await processGameState(data, cache);
    const png = await renderToImage(state);
    await writeFile(OUTPUT, png);
    lastMode = state.mode;
    renderCount++;
    console.log(`[${i + 1}/${files.length}]  ${name}  →  ${state.mode}`);
  } catch (e: any) {
    console.log(`[${i + 1}/${files.length}]  ${name}  →  ERROR: ${e.message}`);
  }

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
      console.log('Auto: reached end.');
    }
  }, AUTO_SPEED);
}

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>walkGame</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { display: flex; flex-direction: column; height: 100vh; background: #1a1a1a; font-family: monospace; color: #fff; }
#toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #111; border-bottom: 1px solid #333; flex-shrink: 0; }
button { padding: 6px 16px; border: none; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; }
#btn-prev, #btn-next { background: #333; color: #fff; }
#btn-prev:hover:not(:disabled), #btn-next:hover:not(:disabled) { background: #555; }
#btn-prev:disabled, #btn-next:disabled { opacity: 0.35; cursor: not-allowed; }
#btn-auto { background: #1a7a3a; color: #fff; }
#btn-auto:hover { background: #2a9a4a; }
#btn-auto.active { background: #b03020; }
#btn-auto.active:hover { background: #c04030; }
#btn-delete { background: #5a1a1a; color: #fff; }
#btn-delete:hover { background: #7a2a2a; }
#status { flex: 1; font-size: 13px; color: #aaa; padding: 0 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#status.rendering { color: #f0a030; }
#hint { font-size: 11px; color: #555; flex-shrink: 0; }
#image-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; min-height: 0; background: #fff; }
img { max-width: 100%; max-height: 100%; object-fit: contain; border: 1px solid #ccc; }
</style>
</head>
<body>
<div id="toolbar">
  <button id="btn-prev" onclick="action('prev')">&#8592; Prev</button>
  <button id="btn-next" onclick="action('next')">Next &#8594;</button>
  <button id="btn-auto" onclick="action('auto')">&#9654; Auto</button>
  <button id="btn-delete" onclick="action('delete')">Delete</button>
  <span id="status">Loading&hellip;</span>
  <span id="hint">&#8592;&#8594; / n p a d</span>
</div>
<div id="image-wrap">
  <img id="img" src="/img">
</div>
<script>
function action(a) { fetch('/' + a, { method: 'POST' }); }

let lastRenderCount = -1;

async function poll() {
  try {
    const s = await (await fetch('/state')).json();
    const status = document.getElementById('status');
    const autoBtn = document.getElementById('btn-auto');

    status.textContent = s.rendering
      ? '[' + s.current + '/' + s.total + ']  ' + s.filename + '  \u2192  rendering\u2026'
      : '[' + s.current + '/' + s.total + ']  ' + s.filename + '  \u2192  ' + s.mode;
    status.className = s.rendering ? 'rendering' : '';

    document.getElementById('btn-prev').disabled = s.rendering;
    document.getElementById('btn-next').disabled = s.rendering;

    autoBtn.textContent = s.autoOn ? '\u23f9 Stop' : '\u25b6 Auto';
    autoBtn.className = s.autoOn ? 'active' : '';

    if (s.renderCount !== lastRenderCount) {
      lastRenderCount = s.renderCount;
      document.getElementById('img').src = '/img?t=' + Date.now();
    }
  } catch(e) {}
}

setInterval(poll, 300);
poll();

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight' || e.key === 'n') action('next');
  else if (e.key === 'ArrowLeft' || e.key === 'p') action('prev');
  else if (e.key === 'a') action('auto');
  else if (e.key === 'd') action('delete');
});
</script>
</body>
</html>`;

(async () => {
  console.log(`\n${files.length} files in ${dir}\n`);

  const server = http.createServer((req, res) => {
    const url = req.url ?? '/';

    if (url.startsWith('/img')) {
      if (existsSync(OUTPUT)) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        res.end(readFileSync(OUTPUT));
      } else {
        res.writeHead(404);
        res.end();
      }
      return;
    }

    if (url === '/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        current: current + 1,
        total: files.length,
        filename: path.basename(files[current] ?? ''),
        mode: lastMode,
        rendering,
        autoOn: autoTimer !== null,
        autoSpeed: AUTO_SPEED / 1000,
        renderCount,
      }));
      return;
    }

    if (req.method === 'POST') {
      res.writeHead(200);
      res.end();

      if (url === '/next') {
        stopAuto();
        if (current < files.length - 1) { current++; render(current); }
      } else if (url === '/prev') {
        stopAuto();
        if (current > 0) { current--; render(current); }
      } else if (url === '/auto') {
        if (autoTimer) { stopAuto(); } else { startAuto(); }
      } else if (url === '/delete') {
        stopAuto();
        const file = files[current];
        try {
          unlinkSync(file);
          files.splice(current, 1);
          console.log(`Deleted: ${path.basename(file)}`);
          if (files.length === 0) {
            server.close();
            console.log('No files remaining.');
            process.exit(0);
          }
          if (current >= files.length) current = files.length - 1;
          render(current);
        } catch (e: any) {
          console.log(`Delete failed: ${e.message}`);
        }
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  });

  process.on('SIGINT', () => { server.close(); process.exit(0); });

  server.listen(PORT, async () => {
    await render(current);
    execSync(`open http://localhost:${PORT}`);
  });
})();
