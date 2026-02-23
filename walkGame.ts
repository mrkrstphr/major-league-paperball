import 'dotenv/config';
import http from 'http';
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { processGameState } from './app/engine/liveGameState';
import { renderToImage } from './app/render';

// ── CLI args ──────────────────────────────────────────────────────────────────

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
const initialAutoSpeed = speedIdx !== -1 ? Number(process.argv[speedIdx + 1]) : 5;

// ── File list ─────────────────────────────────────────────────────────────────

let files = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && f !== 'index.json' && !f.startsWith('.'))
  .sort()
  .map((f) => path.join(dir, f))
  .filter((f) => statSync(f).isFile());

if (files.length === 0) {
  console.log('No JSON files found.');
  process.exit(1);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OUTPUT = 'walkgame.png';
const PORT = 9998;
const INDEX_FILE = path.join(dir, 'index.json');

// ── State ─────────────────────────────────────────────────────────────────────

type IndexEntry = { filename: string; tag: string; label: string };
let fileIndexMap = new Map<string, IndexEntry>();

const cache = { schedule: undefined, gameEnded: {}, team: { teamName: 'Unknown', id: 0 } };

let current = 0;
let rendering = false;
let lastMode = '';
let lastGameState: any = null;
let lastGameData: any = null;

// ── Render ────────────────────────────────────────────────────────────────────

async function render(i: number) {
  if (rendering) {
    console.warn('render() called while already rendering — skipping');
    return;
  }
  rendering = true;

  const file = files[i];
  const name = path.basename(file);
  console.log(`[${i + 1}/${files.length}]  ${name}  →  rendering…`);

  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    const state = await processGameState(raw, cache);
    const png = await renderToImage(state);
    await writeFile(OUTPUT, png);
    lastMode = state.mode;
    lastGameState = state;
    lastGameData = raw;
    console.log(`[${i + 1}/${files.length}]  ${name}  →  ${state.mode}`);
  } catch (e: any) {
    console.log(`[${i + 1}/${files.length}]  ${name}  →  ERROR: ${e.message}`);
  }

  rendering = false;
}

// ── Server state response ─────────────────────────────────────────────────────

function getStateJson() {
  return {
    current: current + 1,
    total: files.length,
    filename: path.basename(files[current] ?? ''),
    mode: lastMode,
    initialAutoSpeed,
  };
}

// ── File analysis (used only during index build) ──────────────────────────────

function analyzeFile(data: any): { tag: string; label: string } {
  try {
    const cp = data?.liveData?.plays?.currentPlay;
    const status = data?.gameData?.status?.abstractGameCode;
    const inningState = data?.liveData?.linescore?.inningState;
    const inningOrdinal = data?.liveData?.linescore?.currentInningOrdinal ?? '';

    if (status === 'F') return { tag: 'final', label: 'Final' };
    if (inningState === 'Middle' || inningState === 'End') return { tag: 'eoi', label: `End ${inningOrdinal}` };
    if (!cp) return { tag: 'unknown', label: '?' };

    const event: string = cp.result?.event ?? '';
    const eventType: string = cp.result?.eventType ?? '';
    const isOut: boolean = cp.result?.isOut === true;
    const isScoringPlay: boolean = cp.about?.isScoringPlay === true;

    if (isScoringPlay) return { tag: 'score', label: event || 'Score' };
    if (isOut && eventType === 'strikeout') return { tag: 'strikeout', label: 'Strikeout' };
    if (isOut) return { tag: 'out', label: event || 'Out' };
    if (['Single', 'Double', 'Triple', 'Home Run'].includes(event)) return { tag: 'hit', label: event };
    if (eventType === 'walk' || event === 'Walk') return { tag: 'walk', label: 'Walk' };
    if (event === 'Hit By Pitch') return { tag: 'hbp', label: 'HBP' };

    const count = cp.count;
    if (count != null) return { tag: 'count', label: `${count.balls ?? 0}-${count.strikes ?? 0}, ${count.outs ?? 0} out` };

    return { tag: 'unknown', label: event || '?' };
  } catch {
    return { tag: 'error', label: 'Error' };
  }
}

// ── Index ─────────────────────────────────────────────────────────────────────

async function buildIndex() {
  // Bail early if index.json is somehow a directory (e.g. from a prior crash)
  if (existsSync(INDEX_FILE) && statSync(INDEX_FILE).isDirectory()) {
    console.log(`Warning: ${INDEX_FILE} is a directory — skipping index creation.`);
    return;
  }

  // Load existing index from disk
  if (existsSync(INDEX_FILE)) {
    try {
      const entries: IndexEntry[] = JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
      fileIndexMap = new Map(entries.map((e) => [e.filename, e]));
      return;
    } catch {
      console.log('index.json is corrupted — rebuilding…');
    }
  }

  // Build from scratch
  console.log(`Creating index.json… (${files.length} files)`);
  const BAR = 40;
  const entries: IndexEntry[] = files.map((f, i) => {
    const filled = Math.round(((i + 1) / files.length) * BAR);
    process.stdout.write(`\r  [${'█'.repeat(filled)}${'░'.repeat(BAR - filled)}] ${i + 1}/${files.length}`);
    try {
      const data = JSON.parse(readFileSync(f, 'utf8'));
      const { tag, label } = analyzeFile(data);
      return { filename: path.basename(f), tag, label };
    } catch {
      return { filename: path.basename(f), tag: 'error', label: 'Parse Error' };
    }
  });
  process.stdout.write('\n');

  await writeFile(INDEX_FILE, JSON.stringify(entries, null, 2));
  fileIndexMap = new Map(entries.map((e) => [e.filename, e]));
}

// ── Browser UI ────────────────────────────────────────────────────────────────

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
#tab-content { flex: 1; overflow: auto; padding: 10px 14px; font-size: 12px; line-height: 1.5; color: #ccc; }
#tab-content.json { white-space: pre; }
.file-row { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 3px; cursor: pointer; white-space: nowrap; }
.file-row:hover { background: #2a2a2a; }
.file-row.current { background: #333; }
.file-idx { color: #555; width: 32px; text-align: right; flex-shrink: 0; }
.file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; color: #aaa; }
.file-tag { padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: bold; flex-shrink: 0; }
.tag-score    { background: #3a3000; color: #ffd055; }
.tag-hit      { background: #002a40; color: #55ccff; }
.tag-strikeout{ background: #3a0000; color: #ff7070; }
.tag-out      { background: #2a1500; color: #ff9944; }
.tag-walk     { background: #002a10; color: #55ee88; }
.tag-hbp      { background: #2a0030; color: #cc88ff; }
.tag-eoi      { background: #002a2a; color: #55ddcc; }
.tag-final    { background: #1a1a00; color: #ddcc55; }
.tag-count    { background: #1e1e1e; color: #777; }
.tag-unknown  { background: #1e1e1e; color: #555; }
.tag-error    { background: #300; color: #f66; }
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
    <button class="tab-btn" onclick="switchTab('file-list', this)">Files</button>
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
var activeTab = 'game-state';
var currentFileIdx = 1;
var autoOn = false;
var autoTimer = null;
var autoSpeed = 5;

// ── UI state ──────────────────────────────────────────────────────────────────

function setRendering(r) {
  document.getElementById('btn-prev').disabled = r;
  document.getElementById('btn-next').disabled = r;
  document.getElementById('btn-delete').disabled = r;
  document.getElementById('status').className = r ? 'rendering' : '';
}

function onStateUpdate(s, refreshFileList) {
  currentFileIdx = s.current;
  document.getElementById('status').textContent =
    '[' + s.current + '/' + s.total + ']  ' + s.filename + '  \u2192  ' + s.mode;
  setRendering(false);
  document.getElementById('img').src = '/img?t=' + Date.now();
  document.getElementById('jump-max').textContent = '/ ' + s.total;
  document.getElementById('jump-input').max = s.total;
  if (activeTab === 'file-list' && !refreshFileList) {
    updateFileListCurrent();
  } else {
    loadTab();
  }
}

// ── Auto mode ─────────────────────────────────────────────────────────────────

function stopAuto() {
  autoOn = false;
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  document.getElementById('btn-auto').textContent = '\u25b6 Auto';
  document.getElementById('btn-auto').className = '';
}

function startAuto() {
  autoOn = true;
  document.getElementById('btn-auto').textContent = '\u23f9 Stop';
  document.getElementById('btn-auto').className = 'active';
  scheduleAuto();
}

function toggleAuto() {
  if (autoOn) { stopAuto(); } else { startAuto(); }
}

function scheduleAuto() {
  autoTimer = setTimeout(async function() {
    if (!autoOn) return;
    setRendering(true);
    try {
      var s = await (await fetch('/next', { method: 'POST' })).json();
      if (s.current >= s.total) { stopAuto(); }
      onStateUpdate(s, false);
    } catch(e) {
      stopAuto();
      setRendering(false);
    }
    if (autoOn) scheduleAuto();
  }, autoSpeed * 1000);
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function action(a) {
  if (a === 'auto') { toggleAuto(); return; }
  stopAuto();
  setRendering(true);
  try {
    var s = await (await fetch('/' + a, { method: 'POST' })).json();
    onStateUpdate(s, a === 'delete');
  } catch(e) {
    setRendering(false);
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function updateFileListCurrent() {
  var el = document.getElementById('tab-content');
  el.querySelectorAll('.file-row').forEach(function(row) {
    var idx = parseInt(row.getAttribute('data-index'));
    row.className = 'file-row' + (idx === currentFileIdx ? ' current' : '');
  });
  var active = el.querySelector('.current');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

async function loadTab() {
  var tab = activeTab;
  var el = document.getElementById('tab-content');
  el.className = tab === 'file-list' ? '' : 'json';
  el.innerHTML = '<span style="color:#555">Loading\u2026</span>';

  if (tab === 'file-list') {
    try {
      var list = await (await fetch('/file-list')).json();
      if (activeTab !== tab) return;
      var html = '';
      list.forEach(function(f) {
        var cls = 'file-row' + (f.index === currentFileIdx ? ' current' : '');
        html += '<div class="' + cls + '" data-index="' + f.index + '">';
        html += '<span class="file-idx">' + f.index + '</span>';
        html += '<span class="file-name">' + f.filename + '</span>';
        html += '<span class="file-tag tag-' + f.tag + '">' + f.label + '</span>';
        html += '</div>';
      });
      el.innerHTML = html;
      var active = el.querySelector('.current');
      if (active) active.scrollIntoView({ block: 'nearest' });
    } catch(e) {
      if (activeTab === tab) el.innerHTML = '<span style="color:#f66">Error loading file list</span>';
    }
  } else {
    try {
      var data = await (await fetch('/' + tab)).json();
      if (activeTab !== tab) return;
      el.textContent = JSON.stringify(data, null, 2);
    } catch(e) {
      if (activeTab === tab) el.innerHTML = '<span style="color:#f66">Error loading data</span>';
    }
  }
}

function switchTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.className = 'tab-btn'; });
  btn.className = 'tab-btn active';
  loadTab();
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.getElementById('tab-content').addEventListener('click', function(e) {
  var row = e.target.closest('[data-index]');
  if (row) action('jump?i=' + row.getAttribute('data-index'));
});

document.getElementById('speed-input').addEventListener('change', function() {
  var s = parseInt(this.value);
  if (s >= 1) autoSpeed = s;
});

document.getElementById('jump-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var i = parseInt(this.value);
    if (i >= 1) { action('jump?i=' + i); this.value = ''; }
  }
});

document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === 'n') action('next');
  else if (e.key === 'ArrowLeft' || e.key === 'p') action('prev');
  else if (e.key === 'a') action('auto');
  else if (e.key === 'd') action('delete');
});

// ── Resize handle ─────────────────────────────────────────────────────────────

(function() {
  var handle = document.getElementById('resize-handle');
  var panel = document.getElementById('data-section');
  var STORAGE_KEY = 'walkgame-panel-height';
  var dragging = false;
  var startY, startHeight;

  panel.style.height = (parseInt(localStorage.getItem(STORAGE_KEY)) || 220) + 'px';

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
    var h = Math.max(60, Math.min(window.innerHeight * 0.8, startHeight + (startY - e.clientY)));
    panel.style.height = h + 'px';
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

// ── Init ──────────────────────────────────────────────────────────────────────

(async function() {
  var s = await (await fetch('/state')).json();
  autoSpeed = s.initialAutoSpeed;
  document.getElementById('speed-input').value = s.initialAutoSpeed;
  onStateUpdate(s);
})();
</script>
</body>
</html>`;

// ── HTTP server ───────────────────────────────────────────────────────────────

function respond(res: http.ServerResponse, body: object) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

(async () => {
  console.log(`\n${files.length} files in ${dir}\n`);

  await buildIndex();

  const server = http.createServer(async (req, res) => {
    const parsed = new URL(req.url ?? '/', 'http://localhost');
    const pathname = parsed.pathname;

    // ── GET endpoints ────────────────────────────────────────────────────────

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

    if (pathname === '/state') { respond(res, getStateJson()); return; }
    if (pathname === '/game-state') { respond(res, lastGameState ?? {}); return; }
    if (pathname === '/game-data') { respond(res, lastGameData ?? {}); return; }

    if (pathname === '/file-list') {
      const list = files.map((f, i) => {
        const filename = path.basename(f);
        const entry = fileIndexMap.get(filename);
        return { index: i + 1, filename, tag: entry?.tag ?? 'unknown', label: entry?.label ?? '?' };
      });
      respond(res, list);
      return;
    }

    // ── POST endpoints ───────────────────────────────────────────────────────

    if (req.method === 'POST') {
      if (pathname === '/next') {
        if (current < files.length - 1) { current++; await render(current); }
        respond(res, getStateJson());
      } else if (pathname === '/prev') {
        if (current > 0) { current--; await render(current); }
        respond(res, getStateJson());
      } else if (pathname === '/jump') {
        const i = Number(parsed.searchParams.get('i'));
        if (i >= 1 && i <= files.length) { current = i - 1; await render(current); }
        respond(res, getStateJson());
      } else if (pathname === '/delete') {
        const file = files[current];
        try {
          unlinkSync(file);
          files.splice(current, 1);
          console.log(`Deleted: ${path.basename(file)}`);
          if (files.length === 0) {
            respond(res, { done: true });
            server.close();
            process.exit(0);
          }
          if (current >= files.length) current = files.length - 1;
          await render(current);
        } catch (e: any) {
          console.log(`Delete failed: ${e.message}`);
        }
        respond(res, getStateJson());
      } else {
        res.writeHead(200);
        res.end();
      }
      return;
    }

    // ── HTML ─────────────────────────────────────────────────────────────────

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
  });

  process.on('SIGINT', () => {
    (server as any).closeAllConnections?.();
    server.close();
    process.exit(0);
  });

  server.listen(PORT, async () => {
    await render(current);
    console.log(`\nReady → http://localhost:${PORT}\n`);
  });
})();
