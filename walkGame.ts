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
let autoSpeed = speedIdx !== -1 ? Number(process.argv[speedIdx + 1]) * 1000 : 5000;

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
let lastGameState: any = null;
let lastGameData: any = null;
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
    lastGameState = state;
    lastGameData = data;
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
  }, autoSpeed);
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
#image-wrap { flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 12px; background: #fff; }
#image-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; border: 1px solid #ccc; }
#resize-handle { height: 6px; background: #2a2a2a; cursor: ns-resize; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
#resize-handle:hover, #resize-handle.dragging { background: #3a3a3a; }
#resize-handle::after { content: ''; width: 32px; height: 2px; background: #555; border-radius: 1px; }
#data-section { flex-shrink: 0; display: flex; flex-direction: column; border-top: 1px solid #333; }
#tab-bar { display: flex; align-items: center; background: #111; border-bottom: 1px solid #333; flex-shrink: 0; }
.tab-btn { background: none; border: none; border-bottom: 2px solid transparent; border-radius: 0; color: #666; padding: 8px 20px; cursor: pointer; font: inherit; font-size: 12px; }
.tab-btn:hover { color: #aaa; }
.tab-btn.active { color: #fff; border-bottom-color: #fff; }
#tab-controls { margin-left: auto; display: flex; align-items: center; gap: 16px; padding: 0 12px; }
.ctrl { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #666; }
.ctrl input[type=number] { background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; padding: 3px 6px; font: inherit; font-size: 12px; width: 52px; -moz-appearance: textfield; }
.ctrl input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
.ctrl input[type=number]:focus { outline: none; border-color: #777; color: #fff; }
#tab-content { flex: 1; overflow: auto; padding: 10px 14px; font-size: 12px; line-height: 1.5; white-space: pre; color: #ccc; }
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
<div id="resize-handle"></div>
<div id="data-section">
  <div id="tab-bar">
    <button class="tab-btn active" onclick="switchTab('game-state', this)">Game State</button>
    <button class="tab-btn" onclick="switchTab('game-data', this)">Raw Game Data</button>
    <div id="tab-controls">
      <div class="ctrl">
        <span>Speed</span>
        <input id="speed-input" type="number" min="1" max="60" step="1" title="Autoplay speed in seconds">
        <span>s</span>
      </div>
      <div class="ctrl">
        <span>Jump</span>
        <input id="jump-input" type="number" min="1" placeholder="#" title="Jump to file number, press Enter">
        <span id="jump-max">/ ?</span>
      </div>
    </div>
  </div>
  <div id="tab-content">Loading&hellip;</div>
</div>
<script>
function action(a) { fetch('/' + a, { method: 'POST' }); }

let lastRenderCount = -1;
let activeTab = 'game-state';
let speedInitialized = false;

async function loadTab() {
  try {
    const data = await (await fetch('/' + activeTab)).json();
    document.getElementById('tab-content').textContent = JSON.stringify(data, null, 2);
  } catch(e) {}
}

function switchTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.className = 'tab-btn'; });
  btn.className = 'tab-btn active';
  loadTab();
}

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

    if (!speedInitialized) {
      document.getElementById('speed-input').value = s.autoSpeed;
      speedInitialized = true;
    }

    document.getElementById('jump-max').textContent = '/ ' + s.total;
    document.getElementById('jump-input').max = s.total;

    if (s.renderCount !== lastRenderCount) {
      lastRenderCount = s.renderCount;
      document.getElementById('img').src = '/img?t=' + Date.now();
      loadTab();
    }
  } catch(e) {}
}

setInterval(poll, 300);
poll();

document.getElementById('speed-input').addEventListener('change', function() {
  var s = parseInt(this.value);
  if (s >= 1) fetch('/set-speed?s=' + s, { method: 'POST' });
});

document.getElementById('jump-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var i = parseInt(this.value);
    if (i >= 1) {
      fetch('/jump?i=' + i, { method: 'POST' });
      this.value = '';
    }
  }
});

document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'n') action('next');
  else if (e.key === 'ArrowLeft' || e.key === 'p') action('prev');
  else if (e.key === 'a') action('auto');
  else if (e.key === 'd') action('delete');
});

(function() {
  var handle = document.getElementById('resize-handle');
  var panel = document.getElementById('data-section');
  var STORAGE_KEY = 'walkgame-panel-height';
  var dragging = false;
  var startY, startHeight;

  var saved = localStorage.getItem(STORAGE_KEY);
  panel.style.height = (saved ? parseInt(saved) : 220) + 'px';

  handle.addEventListener('mousedown', function(e) {
    dragging = true;
    startY = e.clientY;
    startHeight = panel.offsetHeight;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var newHeight = Math.max(60, Math.min(window.innerHeight * 0.8, startHeight + (startY - e.clientY)));
    panel.style.height = newHeight + 'px';
  });

  document.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem(STORAGE_KEY, panel.offsetHeight);
  });
})();
</script>
</body>
</html>`;

(async () => {
  console.log(`\n${files.length} files in ${dir}\n`);

  const server = http.createServer((req, res) => {
    const parsed = new URL(req.url ?? '/', 'http://localhost');
    const pathname = parsed.pathname;

    if (pathname === '/img') {
      if (existsSync(OUTPUT)) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        res.end(readFileSync(OUTPUT));
      } else {
        res.writeHead(404);
        res.end();
      }
      return;
    }

    if (pathname === '/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        current: current + 1,
        total: files.length,
        filename: path.basename(files[current] ?? ''),
        mode: lastMode,
        rendering,
        autoOn: autoTimer !== null,
        autoSpeed: autoSpeed / 1000,
        renderCount,
      }));
      return;
    }

    if (pathname === '/game-state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(lastGameState ?? {}));
      return;
    }

    if (pathname === '/game-data') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(lastGameData ?? {}));
      return;
    }

    if (req.method === 'POST') {
      res.writeHead(200);
      res.end();

      if (pathname === '/next') {
        stopAuto();
        if (current < files.length - 1) { current++; render(current); }
      } else if (pathname === '/prev') {
        stopAuto();
        if (current > 0) { current--; render(current); }
      } else if (pathname === '/auto') {
        if (autoTimer) { stopAuto(); } else { startAuto(); }
      } else if (pathname === '/delete') {
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
      } else if (pathname === '/set-speed') {
        const s = Number(parsed.searchParams.get('s'));
        if (s > 0) {
          autoSpeed = s * 1000;
          if (autoTimer) { stopAuto(); startAuto(); }
          console.log(`Auto speed set to ${s}s`);
        }
      } else if (pathname === '/jump') {
        const i = Number(parsed.searchParams.get('i'));
        if (i >= 1 && i <= files.length) {
          stopAuto();
          current = i - 1;
          render(current);
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
