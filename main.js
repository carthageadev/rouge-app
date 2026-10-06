const { app, BrowserWindow, screen, clipboard, ClipboardItem, ipcMain, Tray, Menu, nativeImage, globalShortcut, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { detect } = require('./detect');

if (!app.requestSingleInstanceLock()) app.quit();

const ARCHIVE_MAX = 5000;
const RECENT = 100;
const MAX_TRAIL = 6;
const MAX_POUCH = 12;
const XP_FEED = 10;
const SMART_MIN = 25;
const NOTCH_W = 540, NOTCH_H = 540;
const PILL_W = 190, PILL_H = 32, OPEN_W = 520, OPEN_H = 510, PAD = 12;
const MENU_W = 360;
const TASKBAR_GAP = 4;
const BROWSERS = /^(chrome|msedge|brave|vivaldi|opera|firefox|arc|thorium|chromium|zen|librewolf|waterfox)$/i;

let STORE, IMG_DIR, THUMB_DIR;
let overlay, notch, menu, tray;
let history = [], trail = [], pouch = [], icons = {}, ficons = {}, xp = 0;
const held = new Set();
const trailAt = new Map();
let currentId = null;
let lastSig = null, hover = false, leaveT = null;
let settings = {
  theme: 'dark', accent: '#ff4d5e', style: 'notch', mascot: 'mo',
  trail: true, ttl: 30, login: false, floatPos: null, custom: {}, boil: false,
};
let layout = null, drag = null, interactive = false, pinned = false;
let hoverAt = 0, feedable = false, overHerAt = 0;
let overlayDisplay = null, quitting = false;

const byId = id => history.find(h => h.id === id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DETECTED = ['lang', 'of', 'url', 'email', 'ext', 'name', 'path', 'dir', 'line', 'count', 'paths', 'hex', 'alpha', 'cname', 'cexact', 'cfmt'];
const thumbPath = id => path.join(THUMB_DIR, id + '.png');
const APP_EXT = new Set(['exe', 'lnk', 'url', 'msi', 'ico', 'cpl', 'scr', 'appref-ms']);
const THUMB_EXT = new Set('png jpg jpeg gif webp bmp tif tiff heic avif ico psd mp4 mov mkv avi webm wmv m4v pdf'.split(' '));
const iconKey = i => i.kind !== 'files' || i.dir0 ? null : APP_EXT.has(i.ext) ? 'p:' + i.paths[0].toLowerCase() : 'e:' + (i.ext || '');
const pub = i => i && ({
  ...i, paths: i.paths && i.paths.slice(0, 50),
  thumb: i.kind === 'image' || i.thumbed ? pathToFileURL(thumbPath(i.id)).href : undefined,
  ficon: i.kind === 'files' ? ficons[iconKey(i)] || null : undefined,
});
const withIcon = i => i && ({ ...pub(i), icon: icons[i.src?.exe] || null });
const kindGroup = i => i.kind === 'email' ? 'link' : i.kind;
const sourceKey = i => i.src ? (i.src.site ? 'site:' + i.src.site : i.src.exe ? 'app:' + i.src.exe.toLowerCase() : null) : null;

function classify(item) {
  if (item.kind === 'image' || item.kind === 'files') return item;
  for (const k of DETECTED) delete item[k];
  return Object.assign(item, detect(item.text || ''));
}

function load() {
  try {
    const d = JSON.parse(fs.readFileSync(STORE, 'utf8'));
    history = d.history || [];
    icons = d.icons || {};
    ficons = d.ficons || {};
    xp = d.xp || 0;
    settings = { ...settings, ...(d.settings || {}) };
    pouch = (d.pouch || []).filter(id => byId(id));
  } catch {}
  let migrated = false;
  for (const item of history) {
    if (typeof item.thumb === 'string' && item.thumb.startsWith('data:')) {
      try { fs.writeFileSync(thumbPath(item.id), Buffer.from(item.thumb.split(',')[1], 'base64')); } catch {}
      delete item.thumb;
      migrated = true;
    }
    classify(item);
  }
  if (migrated) save();
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => fs.writeFile(STORE, JSON.stringify({ history, pouch, icons, ficons, settings, xp }), () => {}), 400);
}

function level() {
  let lvl = 1, need = 60, into = xp;
  while (into >= need) { into -= need; lvl++; need = 60 * lvl; }
  return { xp, level: lvl, into, need };
}

// only ever removes rouge's own cached images, never anything a files clip points at
function forget(item) {
  if (item.kind === 'image') fs.unlink(path.join(IMG_DIR, item.id + '.png'), () => {});
  if (item.kind === 'image' || item.thumbed) fs.unlink(thumbPath(item.id), () => {});
}

let helper = null, helperBuf = '', reqId = 0;

const clog = (...a) => { try { console.error(...a); } catch {} };
const pending = new Map();
function startHelper() {
  helper = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'native', 'helper.ps1')], { windowsHide: true });
  for (const s of [helper.stdin, helper.stdout, helper.stderr]) s.on('error', () => {});
  helper.stdout.setEncoding('utf8');
  helper.stdout.on('data', d => {
    helperBuf += d;
    let i;
    while ((i = helperBuf.indexOf('\n')) >= 0) {
      const line = helperBuf.slice(0, i).trim();
      helperBuf = helperBuf.slice(i + 1);
      if (line) onHelper(line);
    }
  });
  helper.stderr.on('data', d => clog('[helper]', String(d)));
  helper.on('exit', () => {
    helper = null; helperClips = false; filesOnClip = false;
    for (const [id, r] of pending) { pending.delete(id); r(null); }
    if (!quitting) setTimeout(startHelper, 2000);
  });
}
const hsend = cmd => helper?.stdin.write(cmd + '\n');
function foreground() {
  return new Promise(res => {
    if (!helper) return res(null);
    const id = ++reqId;
    pending.set(id, res);
    hsend('fg ' + id);
    setTimeout(() => { if (pending.delete(id)) res(null); }, 1500);
  });
}
function onHelper(line) {
  let m;
  try { m = JSON.parse(line); } catch { return; }
  if (m.type === 'fg') { const r = pending.get(m.id); if (r) { pending.delete(m.id); r(m.info); } }
  else if (m.type === 'wheel') onAltWheel(m.delta);
  else if (m.type === 'key') onMenuKey(m.vk);
  else if (m.type === 'click') onGlobalClick(m.x, m.y);
  else if (m.type === 'clip') onClip(m);
  else if (m.type === 'setfiles') { const r = pending.get(m.id); if (r) { pending.delete(m.id); r(!!m.ok); } }
  else if (m.type === 'error') clog('[helper]', m.msg);
}
function setFiles(paths, effect) {
  return new Promise(res => {
    if (!helper) return res(false);
    const id = ++reqId;
    pending.set(id, ok => res(!!ok));
    hsend(`setfiles ${id} ${effect === 'move' ? 2 : 5} ${paths.join('|')}`);
    setTimeout(() => { if (pending.delete(id)) res(false); }, 6000);
  });
}

// the helper reports every clipboard change; files are read there, text and images here
function onClip(m) {
  helperClips = true;
  const files = Array.isArray(m.files) ? m.files.filter(f => typeof f === 'string' && f) : [];
  filesOnClip = files.length > 0;
  if (!filesOnClip) return pollClipboard(true);
  const sig = 'f:' + files.join('|').toLowerCase();
  const effect = (m.effect & 2) && !(m.effect & 1) ? 'move' : 'copy';
  const known = history.find(h => h.sig === sig);
  if (m.init || sig === lastSig) {
    lastSig = sig;
    if (known && m.init) currentId = known.id;
    if (known && !m.init && known.effect !== effect) { known.effect = effect; save(); broadcast(); }
    return;
  }
  lastSig = sig;
  addItem({ sig, kind: 'files', paths: files, total: Math.max(files.length, m.total | 0), effect });
}

function fileInfo(paths, total) {
  const p0 = paths[0], name = path.win32.basename(p0) || p0;
  const ext = (name.match(/\.([a-z0-9]{1,10})$/i) || [])[1];
  return { name, dir: path.win32.dirname(p0) === p0 ? '' : path.win32.dirname(p0), ext: ext ? ext.toLowerCase() : '', count: total };
}

async function probeFiles(item) {
  const st = await Promise.all(item.paths.slice(0, 200).map(p => fs.promises.stat(p).catch(() => null)));
  let nd = 0, nf = 0, size = 0;
  for (const s of st) if (s) { if (s.isDirectory()) nd++; else { nf++; size += s.size; } }
  Object.assign(item, { nd, nf, size, dir0: !!st[0]?.isDirectory() });
  if (st[0] && !item.dir0 && THUMB_EXT.has(item.ext)) {
    let img = null;
    try { img = await nativeImage.createThumbnailFromPath(item.paths[0], { width: 320, height: 320 }); } catch {}
    if ((!img || img.isEmpty()) && /^(png|jpe?g|gif|bmp|ico)$/.test(item.ext) && st[0].size < 40e6) {
      img = nativeImage.createFromPath(item.paths[0]);
      if (!img.isEmpty() && img.getSize().width > 320) img = img.resize({ width: 320, quality: 'good' });
    }
    if (img && !img.isEmpty()) {
      try { await fs.promises.writeFile(thumbPath(item.id), img.toPNG()); item.thumbed = true; } catch {}
    }
  }
  const key = iconKey(item);
  if (st[0] && key && !ficons[key]) {
    try {
      const ic = await app.getFileIcon(item.paths[0], { size: 'large' });
      if (!ic.isEmpty()) {
        if (Object.keys(ficons).length > 400) for (const k of Object.keys(ficons)) if (k.startsWith('p:')) delete ficons[k];
        ficons[key] = ic.toDataURL();
      }
    } catch {}
  }
  if (!byId(item.id)) { forget(item); return; }
  save();
  broadcast();
}

const exists = p => new Promise(res => {
  const t = setTimeout(() => res(true), 1500);
  fs.access(p, e => { clearTimeout(t); res(!e); });
});
async function writeFiles(item) {
  if (!helper) return 'Give me a second, still waking up';
  if ((item.total || 0) > item.paths.length) return 'That was too many files to keep';
  const alive = await Promise.all(item.paths.map(exists));
  const live = item.paths.filter((_, k) => alive[k]);
  if (!live.length) return item.paths.length > 1 ? 'Those files moved or were deleted' : 'That file moved or was deleted';
  const prev = lastSig;
  lastSig = 'f:' + live.join('|').toLowerCase();
  if (await setFiles(live, item.effect)) { filesOnClip = true; return true; }
  lastSig = prev;
  return 'Could not put the files on the clipboard';
}
function notice(text) { notch?.webContents.send('notice', text); }

async function readClip() {
  const [entry] = await clipboard.read();
  if (!entry) return null;
  if (entry.types.includes('text/plain')) {
    const text = await (await entry.getType('text/plain')).text();
    if (text.trim()) return { sig: 't:' + text, kind: 'text', text: text.slice(0, 20000) };
  }
  const type = entry.types.find(t => t.startsWith('image/'));
  if (type) {
    const buf = Buffer.from(await (await entry.getType(type)).arrayBuffer());
    const sig = 'i:' + crypto.createHash('md5').update(buf).digest('hex');
    if (sig === lastSig) return { sig };
    const img = nativeImage.createFromBuffer(buf);
    if (!img.isEmpty()) return { sig, kind: 'image', img };
  }
  return null;
}

async function captureSource() {
  const fg = await foreground();
  if (!fg || !fg.exe) return null;
  if (fg.exe.toLowerCase() === process.execPath.toLowerCase()) return null;
  const base = path.basename(fg.exe, path.extname(fg.exe));
  const src = { app: fg.name || base, exe: fg.exe };
  if (BROWSERS.test(base)) {
    src.browser = true;
    let u = (fg.url || '').trim();
    if (u && !/\s/.test(u)) {
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = 'https://' + u;
      try { const U = new URL(u); src.url = U.href; src.site = U.hostname.replace(/^www\./, ''); } catch {}
    }
    src.title = fg.title.replace(/\s[-\u2014\u2013]\s[^-\u2014\u2013]*$/, '').trim();
  } else {
    src.title = fg.title;
  }
  if (!icons[fg.exe]) {
    try { icons[fg.exe] = (await app.getFileIcon(fg.exe, { size: 'normal' })).toDataURL(); } catch {}
  }
  return src;
}

function addItem(clip) {
  let item = history.find(h => h.sig === clip.sig);
  if (item) {
    history = history.filter(h => h !== item);
    item.ts = Date.now();
    if (clip.kind === 'files') item.effect = clip.effect;
  } else {
    item = { id: crypto.randomUUID(), sig: clip.sig, kind: clip.kind, ts: Date.now() };
    if (clip.kind === 'files') {
      Object.assign(item, { paths: clip.paths, total: clip.total, effect: clip.effect }, fileInfo(clip.paths, clip.total));
      probeFiles(item);
    } else if (clip.kind === 'image') {
      const { width, height } = clip.img.getSize();
      item.w = width; item.h = height;
      const small = width > 320 ? clip.img.resize({ width: 320, quality: 'best' }) : clip.img;
      fs.writeFileSync(thumbPath(item.id), small.toPNG());
      fs.writeFile(path.join(IMG_DIR, item.id + '.png'), clip.img.toPNG(), () => {});
    } else {
      item.text = clip.text;
      classify(item);
    }
  }
  history.unshift(item);
  for (const old of history.splice(ARCHIVE_MAX)) {
    if (pouch.includes(old.id)) { history.push(old); continue; }
    forget(old);
  }
  currentId = item.id;
  if (settings.trail) pushTrail(item.id);
  save();
  broadcast({ fresh: item.id });

  captureSource().then(src => {
    if (!src) return;
    item.src = src;
    save();
    broadcast();
  });
}

// with the helper watching, the clipboard is only read when it actually changed (plus a slow safety net)
let clipBusy = false, clipDirty = true, lastRead = 0, helperClips = false, filesOnClip = false;
async function pollClipboard(force = false) {
  if (clipBusy) { clipDirty = true; return; }
  if (!force && helperClips && !clipDirty && Date.now() - lastRead < 3000) return;
  clipDirty = false;
  if (filesOnClip) return;
  clipBusy = true; lastRead = Date.now();
  try {
    const clip = await readClip();
    if (clip && clip.sig !== lastSig) { lastSig = clip.sig; addItem(clip); }
  } catch { clipDirty = true; } finally { clipBusy = false; }
}

async function writeItem(item, promote = true) {
  for (let i = 0; clipBusy && i < 100; i++) await new Promise(r => setTimeout(r, 20));
  if (clipBusy) return false;
  clipBusy = true;
  try {
    if (item.kind === 'files') {
      const r = await writeFiles(item);
      if (r !== true) { notice(r); return false; }
    } else {
      if (item.kind === 'image') {
        const png = fs.readFileSync(path.join(IMG_DIR, item.id + '.png'));
        await clipboard.write([new ClipboardItem({ 'image/png': new Blob([png], { type: 'image/png' }) })]);
      } else await clipboard.writeText(item.text);
      lastSig = (await readClip())?.sig ?? lastSig;
      filesOnClip = false;
    }
  } catch { return false; } finally { clipBusy = false; }
  currentId = item.id;
  if (promote) {
    history = [item, ...history.filter(h => h !== item)];
    item.ts = Date.now();
    save();
  }
  broadcast();
  return true;
}

function sendTrail() {
  overlay?.webContents.send('trail', trail.map(byId).filter(Boolean).map(withIcon));
  notch?.webContents.send('trailing', trail.length);
}

function stats() {
  const kinds = {}, sources = new Map();
  for (const i of history) {
    const k = kindGroup(i);
    kinds[k] = (kinds[k] || 0) + 1;
    const key = sourceKey(i);
    if (!key) continue;
    const e = sources.get(key) || { key, n: 0, label: i.src.site || i.src.app, site: i.src.site || null, exe: i.src.exe || null };
    e.n++;
    sources.set(key, e);
  }
  const smart = [...sources.values()].filter(e => e.n >= SMART_MIN && e.n >= history.length * .08).sort((a, b) => b.n - a.n).slice(0, 3);
  return { total: history.length, kinds, smart };
}

const hay = new WeakMap();
function haystack(i) {
  let h = hay.get(i);
  if (!h) {
    h = [i.text, i.kind, i.lang, i.of, i.src?.app, i.src?.site, i.src?.title, i.name, i.cname, i.hex, i.kind === 'image' ? `image ${i.w}x${i.h}` : '',
      i.kind === 'files' ? 'file ' + (i.paths || []).join('\n') : ''].filter(Boolean).join('\n').toLowerCase();
    hay.set(i, h);
  }
  return h;
}

function query(q = {}) {
  let list = q.pouch ? pouch.map(byId).filter(Boolean) : history;
  if (q.kind) list = list.filter(i => kindGroup(i) === q.kind);
  if (q.source) list = list.filter(i => sourceKey(i) === q.source);
  const terms = String(q.text || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length) list = list.filter(i => { const h = haystack(i); return terms.every(t => h.includes(t)); });
  const offset = Math.max(0, q.offset || 0), limit = Math.min(RECENT, q.limit || RECENT);
  return { total: list.length, offset, items: list.slice(offset, offset + limit).map(pub) };
}

function broadcast(extra = {}) {
  notch?.webContents.send('state', {
    recent: history.slice(0, RECENT).map(pub), pouch: pouch.map(byId).filter(Boolean).map(pub), current: currentId,
    stats: stats(), icons, xp: level(), ...extra,
  });
  sendTrail();
}

function pushTrail(id) {
  let free = 0;
  trail = [id, ...trail.filter(x => x !== id)].filter(x => held.has(x) || ++free <= MAX_TRAIL);
  trailAt.set(id, Date.now());
}
function expireTrail() {
  const now = Date.now();
  const kept = trail.filter(id => held.has(id) || now - (trailAt.get(id) || 0) < settings.ttl * 1000);
  if (kept.length !== trail.length) { trail = kept; sendTrail(); }
}

function shakeOff() {
  if (!trail.length) return;
  overlay.webContents.send('shake');
  trail = [];
  held.clear();
  sendTrail();
}

const shake = { x: { dir: 0, seg: 0, rev: [] }, y: { dir: 0, seg: 0, rev: [] } };
let prevP = null, lastShake = 0;
function detectShake(p) {
  const now = Date.now();
  let hit = false;
  if (prevP) for (const ax of ['x', 'y']) {
    const s = shake[ax], d = p[ax] - prevP[ax], sg = Math.sign(d);
    if (sg && sg !== s.dir) {
      if (s.seg > 45) s.rev.push(now);
      s.dir = sg; s.seg = 0;
    }
    s.seg += Math.abs(d);
    s.rev = s.rev.filter(t => now - t < 750);
    if (s.rev.length >= 4) hit = true;
  }
  prevP = p;
  if (hit && now - lastShake > 900) {
    lastShake = now;
    shake.x.rev = []; shake.y.rev = [];
    return true;
  }
  return false;
}

const scrub = { active: false, sel: 0, wT: null, endT: null };
function onAltWheel(delta) {
  if (!history.length || menuOpen) return;
  if (!scrub.active) { scrub.active = true; scrub.sel = Math.max(0, history.findIndex(h => h.id === currentId)); }
  scrub.sel = clamp(scrub.sel + (delta < 0 ? 1 : -1), 0, history.length - 1);
  const sel = scrub.sel, item = history[sel];
  const from = Math.max(0, sel - 4);
  overlay.webContents.send('scrub', {
    sel, total: history.length,
    items: history.slice(from, sel + 5).map((it, k) => ({ ...withIcon(it), idx: from + k })),
  });
  clearTimeout(scrub.wT);
  scrub.wT = setTimeout(() => writeItem(item, false), 90);
  clearTimeout(scrub.endT);
  scrub.endT = setTimeout(() => {
    scrub.active = false;
    overlay.webContents.send('scrub', null);
    if (settings.trail) { pushTrail(item.id); sendTrail(); }
  }, 1100);
}

let menuOpen = false;
function openMenu() {
  if (menuOpen) return closeMenu();
  if (!history.length) return;
  const p = screen.getCursorScreenPoint();
  const wa = screen.getDisplayNearestPoint(p).workArea;
  const h = 460;
  menu.setBounds({
    x: Math.round(clamp(p.x + 10, wa.x + 8, wa.x + wa.width - MENU_W - 8)),
    y: Math.round(clamp(p.y + 10, wa.y + 8, wa.y + wa.height - h - 8)),
    width: MENU_W, height: h,
  });
  menu.webContents.send('open', { items: history.slice(0, 40).map(withIcon), current: currentId });
  menu.showInactive();
  menuOpen = true;
  hsend('keys 1');
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  hsend('keys 0');
  menu.webContents.send('close');
  setTimeout(() => { if (!menuOpen) menu.hide(); }, 170);
}
async function pasteItem(item) {
  closeMenu();
  if (!item) return;
  if (await writeItem(item)) setTimeout(() => hsend('paste'), 60);
}
function onMenuKey(vk) {
  if (!menuOpen) return;
  if (vk === 0x26) menu.webContents.send('move', -1);
  else if (vk === 0x28) menu.webContents.send('move', 1);
  else if (vk === 0x0D) menu.webContents.send('enter');
  else if (vk === 0x1B) closeMenu();
  else if (vk >= 0x31 && vk <= 0x39) pasteItem(history[vk - 0x31]);
}
function onGlobalClick(x, y) {
  if (!menuOpen) return;
  const d = screen.screenToDipPoint({ x, y }), b = menu.getBounds();
  if (d.x < b.x || d.x > b.x + b.width || d.y < b.y || d.y > b.y + b.height) closeMenu();
}

function overlayRect(d) {
  const wa = d.workArea;
  return { x: wa.x, y: wa.y, width: wa.width, height: Math.max(1, wa.height - TASKBAR_GAP) };
}

function makeWindow(opts, file, show = true) {
  const w = new BrowserWindow({
    frame: false, transparent: true, resizable: false, movable: false, skipTaskbar: true,
    alwaysOnTop: true, focusable: false, hasShadow: false, show: false, backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
    ...opts,
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.loadFile(path.join(__dirname, 'ui', file));
  if (show) w.once('ready-to-show', () => w.showInactive());
  return w;
}

function createWindows() {
  const primary = screen.getPrimaryDisplay();
  overlayDisplay = primary;
  overlay = makeWindow(overlayRect(primary), 'overlay.html');

  overlay.setBounds(overlayRect(primary));
  overlay.setIgnoreMouseEvents(true);

  notch = makeWindow({ width: NOTCH_W, height: NOTCH_H, x: 0, y: 0 }, 'notch.html');
  notch.setIgnoreMouseEvents(true, { forward: true });
  notch.on('blur', unpin);
  computeLayout();

  menu = makeWindow({ width: MENU_W, height: 460 }, 'paste.html', false);

  for (const w of [notch, overlay, menu]) w.webContents.on('did-finish-load', () => { sendSettings(); broadcast(); });
  notch.webContents.on('did-finish-load', () => computeLayout());
}

function clampPill(x, y) {
  const wa = screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) }).workArea;
  return {
    wa,
    x: clamp(x, wa.x + PILL_W / 2 + 6, wa.x + wa.width - PILL_W / 2 - 6),
    y: clamp(y, wa.y + 6, wa.y + wa.height - PILL_H - 6),
  };
}

function computeLayout() {
  if (!notch) return;
  const float = settings.style === 'float';
  const primary = screen.getPrimaryDisplay();
  let wx, wy, dir = 'down', pillTop, pcx;
  if (!float) {
    wx = primary.bounds.x + (primary.bounds.width - NOTCH_W) / 2;
    wy = primary.bounds.y;
    pillTop = 0; pcx = NOTCH_W / 2;
  } else {
    const start = settings.floatPos || { x: primary.workArea.x + primary.workArea.width / 2, y: primary.workArea.y + 18 };
    const c = clampPill(start.x, start.y);
    const wa = c.wa, p = { x: c.x, y: c.y };
    settings.floatPos = p;
    dir = p.y > wa.y + wa.height / 2 ? 'up' : 'down';
    const slack = (NOTCH_W - OPEN_W) / 2;
    wx = clamp(p.x - NOTCH_W / 2, wa.x - slack, wa.x + wa.width - NOTCH_W + slack);
    wy = dir === 'down' ? p.y - PAD : p.y + PILL_H + PAD - NOTCH_H;
    pillTop = dir === 'down' ? PAD : NOTCH_H - PAD - PILL_H;
    pcx = p.x - wx;
  }
  const openTop = dir === 'down' ? pillTop : pillTop + PILL_H - OPEN_H;
  const ox = (NOTCH_W - OPEN_W) / 2;
  layout = {
    float, dir, pcx, pillTop, x: Math.round(wx), y: Math.round(wy),
    body: float ? { x: pcx - PILL_W / 2, y: pillTop, w: PILL_W - 36, h: PILL_H } : { x: (NOTCH_W - 214) / 2, y: 0, w: 214, h: 40 },
    handle: float ? { x: pcx + PILL_W / 2 - 36, y: pillTop, w: 36, h: PILL_H } : null,
    open: { x: ox, y: openTop, w: OPEN_W, h: OPEN_H + (float ? 0 : 12) },
    bag: { x: ox + 72, y: openTop + 100 },
    her: { x: ox + 8, y: openTop + 46, w: 122, h: 122 },
  };
  notch.setBounds({ x: layout.x, y: layout.y, width: NOTCH_W, height: NOTCH_H });
  notch.webContents.send('layout', { float, dir, pcx, pillTop });
}

const isDark = () => settings.theme === 'system' ? nativeTheme.shouldUseDarkColors : settings.theme !== 'light';
function sendSettings() {
  const payload = { ...settings, dark: isDark() };
  for (const w of [notch, overlay, menu]) w?.webContents.send('settings', payload);
}
function applySettings(patch) {
  const prev = settings;
  settings = { ...settings, ...patch };
  if (patch.style !== undefined && patch.style !== prev.style) computeLayout();
  if (patch.trail === false) shakeOff();
  if (patch.login !== undefined) {
    try { app.setLoginItemSettings({ openAtLogin: !!settings.login, path: process.execPath, args: app.isPackaged ? [] : [app.getAppPath()] }); } catch {}
  }
  save();
  sendSettings();
  buildTrayMenu?.();
}

function setHover(v) {
  hover = v;
  if (v) rememberFg();
  hoverAt = v ? Date.now() : 0;
  overHerAt = 0;
  notch.webContents.send('hover', v);
  if (!v && pinned) unpin();
}

function absorb() {
  const fresh = trail.filter(id => !pouch.includes(id));
  const eat = fresh.slice(0, Math.max(0, MAX_POUCH - pouch.length));
  const eaten = trail.filter(id => pouch.includes(id) || eat.includes(id));
  const full = eat.length < fresh.length;
  if (!eaten.length) { if (full) broadcast({ full: true }); return; }
  const nb = notch.getBounds(), ob = overlay.getBounds();
  overlay.webContents.send('absorb', { x: nb.x + layout.bag.x - ob.x, y: nb.y + layout.bag.y - ob.y, ids: eaten });
  pouch = [...eat, ...pouch];
  const before = level().level;
  let gain = 0;
  for (const id of eat) { const it = byId(id); if (it && !it.fed) { it.fed = true; gain += XP_FEED; } }
  xp += gain;
  const up = level().level > before ? level().level : 0;
  trail = trail.filter(id => !eaten.includes(id));
  for (const id of eaten) held.delete(id);
  sendTrail();
  save();
  setTimeout(() => broadcast({ gulp: eat.length || true, gain, levelUp: up, full }), 420);
}

let prevFg = null;
function rememberFg() {
  if (pinned) return;
  foreground().then(fg => { if (!pinned && fg?.hwnd && fg.exe?.toLowerCase() !== process.execPath.toLowerCase()) prevFg = fg.hwnd; });
}
function pin() {
  if (pinned) return;
  pinned = true;
  notch.setFocusable(true);
  notch.focus();
  notch.webContents.focus();
}
function unpin() {
  if (!pinned) return;
  pinned = false;
  notch.webContents.send('search-blur');
  notch.setFocusable(false);
  if (prevFg) hsend('activate ' + prevFg);
}

let tickN = 0;
function tick() {
  if (!overlay || !notch) return;
  const p = screen.getCursorScreenPoint();

  const d = screen.getDisplayNearestPoint(p);
  let jump = false;
  if (d.id !== overlayDisplay.id) {
    overlayDisplay = d;
    overlay.setBounds(overlayRect(d));
    jump = true;
  }
  const ob = overlayRect(overlayDisplay);
  overlay.webContents.send('cursor', { x: p.x - ob.x, y: p.y - ob.y, jump });

  if (detectShake(p)) shakeOff();
  if (++tickN % 15 === 0) expireTrail();

  if (!layout) return;

  if (drag) {
    const c = clampPill(p.x - drag.dx + layout.pcx, p.y - drag.dy + layout.pillTop);
    notch.setPosition(Math.round(c.x - layout.pcx), Math.round(c.y - layout.pillTop));
    setInteractive(true);
    return;
  }

  const nb = notch.getBounds();
  const inRect = r => r && p.x >= nb.x + r.x && p.x <= nb.x + r.x + r.w && p.y >= nb.y + r.y && p.y <= nb.y + r.y + r.h;
  const inside = inRect(hover ? layout.open : layout.body);
  if (inside) {
    clearTimeout(leaveT); leaveT = null;
    if (!hover) setHover(true);
  } else if (hover && !leaveT) {
    leaveT = setTimeout(() => { leaveT = null; setHover(false); }, pinned ? 650 : 220);
  }
  setInteractive(hover || !!inRect(layout.handle));

  if (hover && feedable && trail.length && Date.now() - hoverAt > 450 && inRect(layout.her)) {
    if (!overHerAt) overHerAt = Date.now();
    else if (Date.now() - overHerAt > 160) { overHerAt = 0; absorb(); }
  } else overHerAt = 0;
}

function setInteractive(v) {
  if (v === interactive) return;
  interactive = v;
  notch.setIgnoreMouseEvents(!v, { forward: true });
}

function trayIcon() {
  const s = 16, buf = Buffer.alloc(s * s * 4);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5), a = Math.max(0, Math.min(1, 6.8 - d));
    const i = (y * s + x) * 4;
    buf[i] = 0x5e; buf[i + 1] = 0x4d; buf[i + 2] = 0xff; buf[i + 3] = Math.round(a * 255);
  }
  return nativeImage.createFromBitmap(buf, { width: s, height: s });
}

let buildTrayMenu = null;
function buildTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip('Rouge - clipboard');
  const menuTpl = () => Menu.buildFromTemplate([
    { label: 'Trail follows cursor', type: 'checkbox', checked: settings.trail, click: m => applySettings({ trail: m.checked }) },
    { label: 'Floating pill', type: 'checkbox', checked: settings.style === 'float', click: m => applySettings({ style: m.checked ? 'float' : 'notch' }) },
    { label: 'Shake off trail   Ctrl+Shift+X', click: shakeOff },
    { label: 'Paste menu   Alt+V', click: openMenu },
    { type: 'separator' },
    { label: 'Clear history', click: clearAll },
    { label: 'Quit Rouge', click: () => app.exit(0) },
  ]);
  tray.setContextMenu(menuTpl());
  buildTrayMenu = () => tray.setContextMenu(menuTpl());
}

ipcMain.on('copy', (_e, id) => { const it = byId(id); if (it) writeItem(it); });
ipcMain.on('copy-text', (_e, text) => { if (typeof text === 'string' && text.trim() && text.length <= 200) clipboard.writeText(text); });
ipcMain.on('menu-pick', (_e, id) => pasteItem(byId(id)));
ipcMain.on('menu-height', (_e, h) => {
  if (!menu) return;
  const b = menu.getBounds();
  menu.setBounds({ ...b, height: Math.round(clamp(h, 80, 460)) });
});
function clearAll() {
  for (const h of history) if (!pouch.includes(h.id)) forget(h);
  history = history.filter(h => pouch.includes(h.id));
  trail = [];
  held.clear();
  save(); broadcast(); sendTrail();
}

ipcMain.handle('query', (_e, q) => query(q));
ipcMain.on('pin', (_e, on) => on ? pin() : unpin());
ipcMain.on('feedable', (_e, on) => { feedable = !!on; });
ipcMain.on('remove', (_e, id) => {
  const it = byId(id);
  if (it) forget(it);
  history = history.filter(h => h.id !== id);
  pouch = pouch.filter(p => p !== id);
  trail = trail.filter(t => t !== id);
  held.delete(id);
  save(); broadcast();
});
ipcMain.on('settings-set', (_e, patch) => applySettings(patch));
ipcMain.on('drag-start', () => {
  if (!layout?.float) return;
  const p = screen.getCursorScreenPoint(), nb = notch.getBounds();
  drag = { dx: p.x - nb.x, dy: p.y - nb.y };
});
ipcMain.on('drag-end', () => {
  if (!drag) return;
  drag = null;
  const nb = notch.getBounds();
  settings.floatPos = { x: nb.x + layout.pcx, y: nb.y + layout.pillTop };
  computeLayout();
  save();
});
ipcMain.on('empty-pouch', () => { pouch = []; save(); broadcast(); });
ipcMain.on('unpouch', (_e, id) => { pouch = pouch.filter(p => p !== id); save(); broadcast(); });
ipcMain.on('carry', () => {
  const items = pouch.map(byId).filter(Boolean);
  if (!items.length) return;
  const now = Date.now();
  items.forEach((it, k) => { it.ts = now - k; });
  history = [...items, ...history.filter(h => !items.includes(h))];
  for (const it of [...items].reverse()) { held.add(it.id); pushTrail(it.id); }
  pouch = [];
  save(); broadcast({ carried: items.length });
});
ipcMain.on('clear', clearAll);

app.whenReady().then(async () => {
  STORE = path.join(app.getPath('userData'), 'rouge-history.json');
  IMG_DIR = path.join(app.getPath('userData'), 'images');
  THUMB_DIR = path.join(app.getPath('userData'), 'thumbs');
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  load();
  const now = await readClip().catch(() => null);
  lastSig = now?.sig ?? null;
  currentId = history.find(h => h.sig === lastSig)?.id ?? null;
  startHelper();
  createWindows();
  buildTray();
  globalShortcut.register('CommandOrControl+Shift+X', shakeOff);
  globalShortcut.register('Alt+V', openMenu);
  setInterval(pollClipboard, 350);
  setInterval(tick, 16);
  screen.on('display-metrics-changed', () => { computeLayout(); overlayDisplay = { id: -1 }; });
  nativeTheme.on('updated', sendSettings);
});

app.on('window-all-closed', e => e.preventDefault());
app.on('will-quit', () => { quitting = true; globalShortcut.unregisterAll(); helper?.kill(); });
