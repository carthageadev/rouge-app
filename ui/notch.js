const $ = id => document.getElementById(id);
const N = $('notch'), panel = $('panel');
let data = { recent: [], pouch: [], current: null, stats: { total: 0, kinds: {}, smart: [] }, icons: {}, xp: { level: 1, into: 0, need: 60 } };
let open = false, freshId = null, shown = [], total = 0, mode = 'main', page = 0, reqToken = 0, trailing = 0;
const q = { kind: null, source: null, sourceItem: null, pouch: false, text: '' };
let settings = { theme: 'dark', accent: '#ff4d5e', style: 'notch', mascot: 'mo', trail: true, ttl: 30, login: false };
let view = 'grid';
try { view = localStorage.getItem('rouge.view') || 'grid'; } catch {}
const PAGE = 40, CAP = 12;

const TYPES = [
  { key: 'text', label: 'Text', dot: '#b9bcc4' },
  { key: 'link', label: 'Links', dot: '#6aa8ff' },
  { key: 'image', label: 'Images', dot: '#ffd166' },
  { key: 'color', label: 'Colors', dot: 'conic-gradient(#ff4d5e,#ffd166,#4ade80,#6aa8ff,#c084fc,#ff4d5e)' },
  { key: 'code', label: 'Code', dot: '#ff6b7a' },
  { key: 'path', label: 'Paths', dot: '#e8b22d' },
];

const TIPS = [
  { keys: ['Alt', 'V'], t: 'Open the paste menu anywhere, then pick with ↑↓ or 1–9' },
  { keys: ['Alt', 'Scroll'], t: 'Choose what Ctrl V pastes, without leaving your text' },
  { keys: ['Feed'], t: 'Bring copies trailing your cursor here and Rouge keeps them' },
  { keys: ['Click', 'source'], t: 'Click where a clip came from to see everything from there' },
  { keys: ['Shake'], t: 'Wiggle the mouse fast to fling the trail off' },
  { keys: ['Archive'], t: 'Every clip is kept in the archive, searchable and paged' },
  { keys: ['Poke'], t: 'Poke the mascot. Right-click her to dress her up' },
  { keys: ['⚙'], t: 'Themes, accent colour and a floating notch live in settings' },
];
const ACCENTS = ['#ff4d5e', '#ff7a45', '#f5a524', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];

const ICON = {
  x: '<svg width="8" height="8" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>',
  heart: '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 4.5 6.9 4.5c2.2 0 3.7 1.2 5.1 3 1.4-1.8 2.9-3 5.1-3 3.9 0 6 4 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  archive: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg>',
  out: '<svg width="9" height="9" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 5h6"/></svg>',
};

const fmt = n => n.toLocaleString('en-US');
const ago = ts => {
  const s = (Date.now() - ts) / 1000;
  if (s < 45) return 'now';
  if (s < 3600) return Math.round(s / 60) + 'm';
  if (s < 86400) return Math.round(s / 3600) + 'h';
  return Math.round(s / 86400) + 'd';
};
const clock = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function dayLabel(ts) {
  const d = new Date(ts), today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
}
const miniTile = (item, i = 0) => `<div class="t" style="--i:${i}">${Rouge.tile(item)}</div>`;
const luminance = color => {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = color; const v = c.fillStyle;
  const m = v.startsWith('#') ? [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) : (v.match(/\d+/g) || [0, 0, 0]).map(Number);
  return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
};
const kbd = keys => keys.map(k => `<kbd>${k}</kbd>`).join('');
const withIcon = i => (i.icon = data.icons[i.src?.exe] || null, i);
const inPouch = id => data.pouch.some(p => p.id === id);

const mascot = Mascot.mount($('mascot'), settings.mascot, (settings.custom || {})[settings.mascot]);
mascot.pause();
const formName = () => Mascot.FORMS[mascot.form].name;

function formOptions(el, cls = 'form-opt') {
  el.innerHTML = Object.entries(Mascot.FORMS).map(([k, f]) =>
    `<div class="${cls}${k === settings.mascot ? ' on' : ''}" data-form="${k}"><div class="pv">${Mascot.svg(k)}</div>${f.name}</div>`).join('');
}
function pickForm(k) {
  if (k === settings.mascot) return;
  rouge.send('settings-set', { mascot: k });
}
$('forms').addEventListener('click', e => { const o = e.target.closest('[data-form]'); if (o) pickForm(o.dataset.form); });

const cust = $('cust');
let custTab = 'Hair', custSaveT;
const myCustom = () => ({ ...((settings.custom || {})[mascot.form] || {}) });
function saveCustom(c) {
  settings.custom = { ...(settings.custom || {}), [mascot.form]: c };
  mascot.setCustom(c);
  renderCustom();
  clearTimeout(custSaveT);
  custSaveT = setTimeout(() => rouge.send('settings-set', { custom: settings.custom }), 250);
}
function renderCustom() {
  const f = mascot.form, c = myCustom();
  $('custTitle').textContent = `Customize ${Mascot.FORMS[f].name}`;
  const tabs = [...Mascot.CUSTOM.map(s => s.section), 'Outfit', 'Colours'];
  $('custTabs').innerHTML = tabs.map(t => `<div class="${t === custTab ? 'on' : ''}" data-tab="${t}">${t}</div>`).join('');
  let html = '';
  const sec = Mascot.CUSTOM.find(s => s.section === custTab);
  if (sec) {
    html = sec.items.map(item => {
      const v = Mascot.valueOf(f, c, item);
      return `<div class="c-row"><div class="c-lbl">${item.label}</div><div class="c-opts">${item.options.map(([val, lbl]) =>
        `<div class="c-opt${val === v ? ' on' : ''}" data-k="${item.key}" data-v="${val}">${lbl}</div>`).join('')}</div></div>`;
    }).join('');
  } else if (custTab === 'Outfit') {
    const cur = Mascot.look(f, c, 'outfit');
    html = `<div class="c-row"><div class="c-lbl">Outfit</div><div class="c-opts">${Object.entries(Mascot.OUTFITS).map(([k, o]) =>
      `<div class="c-fit${k === cur ? ' on' : ''}" data-k="outfit" data-v="${k}"><i style="background-image:url(../assets/live2d/outfits/${k}.png)"></i>${o.label}</div>`).join('')}</div></div>`;
  } else {
    const sw = (key, label, set) => {
      const cur = Mascot.look(f, c, key);
      return `<div class="c-row"><div class="c-lbl">${label}</div><div class="c-opts">${Object.entries(set).map(([k, o]) =>
        `<div class="c-sw${k === cur ? ' on' : ''}" data-k="${key}" data-v="${k}"><i style="background:${o.swatch}"></i>${o.label}</div>`).join('')}</div></div>`;
    };
    html = sw('hair', 'Hair colour', Mascot.HAIR_COLORS) + sw('eye', 'Eye colour', Mascot.EYE_COLORS) + sw('skin', 'Skin', Mascot.SKIN_TONES);
  }
  $('custBody').innerHTML = html;
}
$('mascot').addEventListener('contextmenu', e => {
  e.preventDefault();
  renderCustom();
  cust.classList.add('on');
  syncFeed();
});
$('custTabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { custTab = t.dataset.tab; renderCustom(); } });
$('custBody').addEventListener('click', e => {
  const o = e.target.closest('[data-k]');
  if (!o) return;
  const v = o.dataset.v, c = myCustom();
  c[o.dataset.k] = /^-?\d+$/.test(v) ? +v : v;
  saveCustom(c);
});
$('custReset').onclick = () => saveCustom({});
$('custClose').onclick = () => { cust.classList.remove('on'); syncFeed(); };

function renderMini() {
  const h = data.recent;
  $('miniStack').innerHTML = h.length ? h.slice(0, 4).map(i => miniTile(i)).join('') : '<span class="empty">copy something</span>';
  $('miniCount').textContent = data.pouch.length ? data.pouch.length + ' in pouch' : data.stats.total ? fmt(data.stats.total) : '';
  $('search').placeholder = data.stats.total ? `Search ${fmt(data.stats.total)} clips` : 'Search';
}

let lastFeedable = null;
function syncFeed() {
  const on = open && mode === 'main' && !panel.classList.contains('set') && !cust.classList.contains('on');
  if (on !== lastFeedable) { lastFeedable = on; rouge.send('feedable', on); }
  $('mascot').classList.toggle('hungry', on && trailing > 0 && data.pouch.length < CAP);
  return on;
}

let popT;
function renderPouch(ev = {}) {
  const p = data.pouch, who = formName(), lv = data.xp, full = p.length >= CAP;
  $('meter').innerHTML = Array.from({ length: CAP }, (_, i) => `<i class="${i < p.length ? 'full' : ''}"></i>`).join('') + `<span>${p.length}/${CAP}</span>`;
  $('pouchTitle').textContent = `${who}'s pouch`;
  $('lvl').innerHTML = `Lv ${lv.level}<i style="--p:${(lv.into / lv.need).toFixed(3)}"></i>`;
  $('lvl').title = `Level ${lv.level} · ${lv.into}/${lv.need} xp to the next level. She earns xp for every new clip you feed her.`;
  $('pouchTag').innerHTML = full ? '<span class="tag full">FULL</span>' : '';
  $('pouchSub').textContent = trailing && open && !full ? `Bring your trail onto ${who} to feed her.`
    : !p.length ? 'Copies trail your cursor. Bring them onto her to keep them.'
    : full ? 'Full. Take something out to feed her more.'
    : `${p.length === 1 ? 'One clip' : p.length + ' clips'} kept safe. Carry them out any time.`;
  $('carry').disabled = !p.length;
  $('openPouch').disabled = !p.length && !q.pouch;
  $('openPouch').classList.toggle('on', q.pouch);
  $('openPouch').lastChild.textContent = q.pouch ? 'Back to all' : 'View pouch';
  if (ev.gulp) mascot.gulp();
  if (ev.gain) {
    const pop = $('xpPop');
    pop.textContent = `+${ev.gain} xp`;
    pop.classList.remove('on'); void pop.offsetWidth; pop.classList.add('on');
    clearTimeout(popT); popT = setTimeout(() => pop.classList.remove('on'), 1400);
  }
  if (ev.levelUp) setTimeout(() => { mascot.cheer(); mascot.say(`Level ${ev.levelUp}! ✦`); }, 500);
  else if (ev.full) setTimeout(() => mascot.say("I'm full!"), 450);
  else if (ev.carried) mascot.say(ev.carried === 1 ? 'Here you go!' : `Carry these ${ev.carried}!`);
}

function srcLabel(item, fallback) {
  const name = Rouge.srcName(item), key = Rouge.srcKey(item);
  return name ? `<span class="src" data-src="${Rouge.esc(key)}" title="Show everything from ${Rouge.esc(name)}">${Rouge.srcIcon(item)}<span>${Rouge.esc(name)}</span></span>` : `<span>${fallback}</span>`;
}
const pouchDot = item => inPouch(item.id) ? `<span class="pd" title="In ${Rouge.esc(formName())}'s pouch">${ICON.heart}</span>` : '';
const xBtn = item => q.pouch ? `<div class="x" data-out="${item.id}" title="Take out of the pouch">${ICON.out}</div>` : `<div class="x" data-x="${item.id}" title="Delete">${ICON.x}</div>`;
const codeHead = (item, cls = 'lang') => `<div class="${cls}"><span class="li">${Rouge.tile(item)}</span>${Rouge.esc(Rouge.langName(item))}<span class="ln">${(item.text || '').split('\n').length > 1 ? (item.text || '').split('\n').length + ' lines' : ''}</span></div>`;
const codeBody = (item, n) => Rouge.highlight((item.text || '').replace(/\t/g, '  ').slice(0, n), item.lang === 'error' ? item.of : item.lang);

function card(item, i) {
  const meta = label => `<div class="meta">${srcLabel(item, label)}<span class="tm">${pouchDot(item)}${ago(item.ts)}</span></div>`;
  const done = `<div class="done">Copied</div>`;
  const cv = item.id === data.current ? `<div class="cv" title="This is what Ctrl V pastes">CTRL V</div>` : '';
  const cls = `card c-${item.kind === 'image' ? 'img' : item.kind}${item.id === freshId ? ' fresh' : ''}`;
  const head = `<div class="${cls}" data-id="${item.id}" style="--i:${i}" title="${Rouge.esc(item.src?.title || '')}">${cv}`;
  const t = item.text ?? '';
  switch (item.kind) {
    case 'image':
      return `${head}<img src="${item.thumb}" draggable="false" alt="">${meta(item.w + '×' + item.h)}${xBtn(item)}${done}</div>`;
    case 'color': {
      const light = luminance(t.trim()) > .6;
      return `${head}<div class="sw" style="background:${Rouge.esc(t.trim())}"></div><div class="hex" style="color:${light ? 'rgba(0,0,0,.75)' : 'rgba(255,255,255,.92)'}">${Rouge.esc(t.trim())}</div>${xBtn(item)}${done}</div>`;
    }
    case 'link': {
      let u; try { u = new URL(item.url || t.trim()); } catch {}
      return `${head}<div class="body"><div class="fav">${Rouge.tile(item)}</div><div class="dom">${Rouge.esc(Rouge.domain(item.url || t.trim()))}</div><div class="path">${Rouge.esc(u ? (u.pathname + u.search).replace(/^\/$/, '') || '/' : t)}</div></div>${meta('link')}${xBtn(item)}${done}</div>`;
    }
    case 'email': {
      const [user, host] = (item.email || t.trim()).split('@');
      return `${head}<div class="body"><div class="fav">${Rouge.tile(item)}</div><div class="dom">${Rouge.esc(user)}</div><div class="path">@${Rouge.esc(host || '')}</div></div>${meta('email')}${xBtn(item)}${done}</div>`;
    }
    case 'path': {
      const dir = t.trim().slice(0, Math.max(0, t.trim().length - (item.name || '').length)).replace(/[\\/]+$/, '');
      return `${head}<div class="body"><div class="fav">${Rouge.tile(item)}</div><div class="dom">${Rouge.esc(item.name || t)}</div><div class="path">${Rouge.esc(dir)}</div></div>${meta(item.ext ? 'file' : 'folder')}${xBtn(item)}${done}</div>`;
    }
    case 'code':
      return `${head}<div class="body">${codeHead(item)}<div class="code">${codeBody(item, 500)}</div></div>${meta('code')}${xBtn(item)}${done}</div>`;
    default:
      return `${head}<div class="body">${Rouge.esc(t.slice(0, 300))}</div>${meta(t.length + ' ch')}${xBtn(item)}${done}</div>`;
  }
}
const ghostCard = (tip, i) => `<div class="ghost-card" style="--i:${i}"><div class="gk">${kbd(tip.keys)}</div><div>${tip.t}</div></div>`;

function row(item, i) {
  const t = item.text ?? '';
  let body;
  if (item.kind === 'image') body = `Image · ${item.w}×${item.h}`;
  else if (item.kind === 'color') body = `<span class="swd" style="background:${Rouge.esc(t.trim())}"></span>${Rouge.esc(t.trim())}`;
  else if (item.kind === 'code') body = `<div class="code">${codeBody(item, 1200)}</div>`;
  else body = Rouge.esc(t.slice(0, 1200));
  const name = Rouge.srcName(item);
  const title = item.src?.title && item.src.title !== name ? `<span>·</span><span class="ttl">${Rouge.esc(item.src.title)}</span>` : '';
  const kind = item.kind === 'code' ? `<span class="lk">${Rouge.esc(Rouge.langName(item))}</span><span>·</span>` : '';
  return `<div class="row c-${item.kind}" data-id="${item.id}" style="--i:${Math.min(i, 14)}">
    <div class="rf${item.kind === 'image' ? ' big' : ''}">${Rouge.tile(item)}</div>
    <div class="rb"><div class="rt">${body}</div>
      <div class="rm">${item.id === data.current ? '<span class="cvi">CTRL V</span>' : ''}${kind}${name ? srcLabel(item, '') : `<span>${item.kind}</span>`}${title}<span>·</span>${pouchDot(item)}<span>${ago(item.ts)}</span></div></div>
    ${xBtn(item)}<div class="done">Copied</div></div>`;
}
const tipRow = (tip, i) => `<div class="tip-row" style="--i:${i}">${kbd(tip.keys)}<span>${tip.t}</span></div>`;

function archRow(item) {
  const name = Rouge.srcName(item);
  const txt = item.kind === 'image' ? `<span class="dim">Image · ${item.w}×${item.h}</span>`
    : item.kind === 'code' ? `<span class="lk">${Rouge.esc(Rouge.langName(item))}</span> ${Rouge.esc(Rouge.preview(item, 140))}`
    : Rouge.esc(Rouge.preview(item, 160));
  return `<div class="ar" data-id="${item.id}"><div class="ar-ic">${Rouge.tile(item)}</div><div class="ar-tx">${txt}</div>`
    + `<div class="ar-src">${name ? srcLabel(item, '') : ''}</div><div class="ar-tm">${pouchDot(item)}${clock(item.ts)}</div>${xBtn(item)}<div class="done">Copied</div></div>`;
}

function emptyState() {
  if (q.text) return `<div class="empty-state"><b>No clips match “${Rouge.esc(q.text)}”</b><span>Try fewer words, or search in the archive.</span></div>`;
  if (q.pouch) return `<div class="empty-state"><b>The pouch is empty</b><span>Hover here while copies trail your cursor to feed ${Rouge.esc(formName())}.</span></div>`;
  if (q.source || q.kind) return `<div class="empty-state"><b>Nothing here yet</b><span>Copies that match this filter will show up here.</span></div>`;
  return '';
}

const isDefault = () => !q.kind && !q.source && !q.pouch && !q.text;
const params = () => ({ kind: q.kind, source: q.source, pouch: q.pouch, text: q.text });

async function refresh(animate) {
  const token = ++reqToken;
  N.classList.toggle('archive', mode === 'archive');
  syncFeed();
  if (mode === 'archive') {
    const res = await rouge.invoke('query', { ...params(), offset: page * PAGE, limit: PAGE });
    if (token !== reqToken) return;
    total = res.total;
    if (page > 0 && page * PAGE >= total) { page = Math.max(0, Math.ceil(total / PAGE) - 1); return refresh(animate); }
    shown = res.items.map(withIcon);
    renderArchive(animate);
  } else {
    if (isDefault()) { shown = data.recent; total = data.stats.total; }
    else {
      const res = await rouge.invoke('query', { ...params(), limit: 100 });
      if (token !== reqToken) return;
      shown = res.items.map(withIcon); total = res.total;
    }
    renderGrid(animate);
  }
  renderChips();
}

function renderChips() {
  const k = data.stats.kinds || {};
  const chip = (attrs, on, inner) => `<div class="chip${on ? ' on' : ''}" ${attrs}>${inner}</div>`;
  const parts = [];
  if (q.pouch) parts.push(chip('data-clear="pouch"', true, `<span class="ph">${ICON.heart}</span>Pouch<span class="n">${data.pouch.length}/${CAP}</span><i class="cx">${ICON.x}</i>`));
  if (q.source) {
    const smart = data.stats.smart.find(s => s.key === q.source);
    const it = smart ? { src: { site: smart.site, app: smart.label, exe: smart.exe }, icon: data.icons[smart.exe] || null } : q.sourceItem || {};
    parts.push(chip('data-clear="source"', true, `${Rouge.srcIcon(it)}${Rouge.esc(Rouge.srcName(it))}<span class="n">${fmt(total)}</span><i class="cx">${ICON.x}</i>`));
  }
  parts.push(chip('data-f=""', !q.kind && !q.source && !q.pouch, `All<span class="n">${fmt(data.stats.total || 0)}</span>`));
  for (const t of TYPES) if (k[t.key]) parts.push(chip(`data-f="${t.key}"`, q.kind === t.key, `<span class="dot" style="background:${t.dot}"></span>${t.label}<span class="n">${fmt(k[t.key])}</span>`));
  for (const s of data.stats.smart.filter(s => s.key !== q.source)) {
    const it = { src: { site: s.site, app: s.label, exe: s.exe }, icon: data.icons[s.exe] || null };
    parts.push(chip(`data-src="${Rouge.esc(s.key)}" title="You copy a lot from ${Rouge.esc(s.label)}"`, q.source === s.key, `${Rouge.srcIcon(it)}${Rouge.esc(s.label)}<span class="n">${fmt(s.n)}</span>`));
  }
  const html = parts.join('');
  if ($('chips').innerHTML !== html) { $('chips').innerHTML = html; if (q.pouch || q.source) $('chips').scrollLeft = 0; }
  $('archChip').classList.toggle('on', mode === 'archive');
  document.querySelectorAll('#view div').forEach(d => d.classList.toggle('on', d.dataset.v === view));
}

function renderGrid(animate) {
  const g = $('grid');
  g.classList.toggle('static', !animate);
  g.classList.toggle('list', view === 'list');
  const tips = isDefault() ? TIPS.slice(0, view === 'list' ? Math.max(0, 5 - shown.length) : Math.max(0, 12 - shown.length)) : [];
  const body = view === 'list'
    ? shown.map(row).join('') + tips.map((t, i) => tipRow(t, shown.length + i)).join('')
    : shown.map(card).join('') + tips.map((t, i) => ghostCard(t, shown.length + i)).join('');
  const more = !isDefault() && total > shown.length ? `<div class="more-row">Showing the latest ${shown.length} of ${fmt(total)} · <b data-arch>open the archive</b></div>` : '';
  g.innerHTML = (body || emptyState()) + more;
  if (animate) g.scrollTop = 0;
}

function renderArchive(animate) {
  const list = $('archList');
  let html = '', day = '';
  for (const item of shown) {
    const d = dayLabel(item.ts);
    if (d !== day) { day = d; html += `<div class="ar-day">${d}</div>`; }
    html += archRow(item);
  }
  list.innerHTML = html || emptyState() || '<div class="empty-state"><b>The archive is empty</b><span>Everything you copy is kept here.</span></div>';
  if (animate) list.scrollTop = 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  $('pager').innerHTML = `<span class="pg-total">${fmt(total)} ${total === 1 ? 'clip' : 'clips'}</span>`
    + `<span class="pg-nav"><button class="pg" data-pg="-1" ${page <= 0 ? 'disabled' : ''}>‹</button><span>Page ${page + 1} of ${pages}</span><button class="pg" data-pg="1" ${page >= pages - 1 ? 'disabled' : ''}>›</button></span>`;
}

function renderSettings() {
  document.querySelectorAll('[data-set]').forEach(seg => {
    seg.querySelectorAll('[data-val]').forEach(d => d.classList.toggle('on', String(settings[seg.dataset.set]) === d.dataset.val));
  });
  document.querySelectorAll('[data-toggle]').forEach(t => t.classList.toggle('on', !!settings[t.dataset.toggle]));
  $('swatches').innerHTML = ACCENTS.map(c => `<div class="sw-dot${c === settings.accent ? ' on' : ''}" data-c="${c}" style="background:${c}"></div>`).join('');
  document.querySelectorAll('.style-opt').forEach(o => o.classList.toggle('on', o.dataset.style === settings.style));
  formOptions($('forms'));
}
function applySettings(s) {
  if (!Mascot.FORMS[s.mascot]) { s = { ...s, mascot: 'mo' }; rouge.send('settings-set', { mascot: 'mo' }); }
  settings = s;
  const root = document.documentElement;
  root.dataset.theme = s.dark ? 'dark' : 'light';
  root.style.setProperty('--rouge', s.accent);
  const c = (s.custom || {})[s.mascot];
  if (mascot.form !== s.mascot) { mascot.setForm(s.mascot, c, open); cust.classList.remove('on'); }
  else if (!cust.classList.contains('on')) mascot.setForm(s.mascot, c, false);
  mascot.setBoil(s.boil);
  renderSettings();
  renderPouch();
}
document.querySelectorAll('[data-set]').forEach(seg => seg.addEventListener('click', e => {
  const d = e.target.closest('[data-val]');
  if (!d) return;
  const v = seg.dataset.set === 'ttl' ? +d.dataset.val : d.dataset.val;
  rouge.send('settings-set', { [seg.dataset.set]: v });
}));
document.querySelectorAll('[data-toggle]').forEach(t => t.addEventListener('click', () => rouge.send('settings-set', { [t.dataset.toggle]: !settings[t.dataset.toggle] })));
$('swatches').addEventListener('click', e => { const d = e.target.closest('[data-c]'); if (d) rouge.send('settings-set', { accent: d.dataset.c }); });
let hueT;
$('hue').addEventListener('input', e => {
  const c = `hsl(${e.target.value} 85% 60%)`;
  document.documentElement.style.setProperty('--rouge', c);
  clearTimeout(hueT); hueT = setTimeout(() => rouge.send('settings-set', { accent: c }), 120);
});
$('styles').addEventListener('click', e => { const o = e.target.closest('[data-style]'); if (o) rouge.send('settings-set', { style: o.dataset.style }); });
$('gear').addEventListener('click', () => {
  const on = !panel.classList.contains('set');
  panel.classList.toggle('set', on); $('gear').classList.toggle('on', on);
  syncFeed();
});

rouge.on('layout', l => {
  document.body.classList.toggle('float', l.float);
  document.body.classList.toggle('up', l.dir === 'up');
  N.style.setProperty('--pcx', l.pcx + 'px');
});

const grip = $('grip');
grip.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  grip.setPointerCapture(e.pointerId);
  document.body.classList.add('dragging');
  rouge.send('drag-start');
});
const endDrag = () => { if (!document.body.classList.contains('dragging')) return; document.body.classList.remove('dragging'); rouge.send('drag-end'); };
grip.addEventListener('pointerup', endDrag);
grip.addEventListener('lostpointercapture', endDrag);

function resetView() {
  Object.assign(q, { kind: null, source: null, sourceItem: null, pouch: false, text: '' });
  mode = 'main'; page = 0;
  $('search').value = '';
  $('searchBox').classList.remove('has');
}

rouge.on('settings', applySettings);
rouge.on('hover', v => {
  open = v;
  N.classList.toggle('open', v);
  syncFeed();
  renderPouch();
  if (v) { refresh(true); mascot.resume?.(); }
  else {
    panel.classList.remove('set'); $('gear').classList.remove('on'); cust.classList.remove('on');
    $('search').blur();
    setTimeout(() => { if (!open) { mascot.pause?.(); resetView(); renderPouch(); N.classList.remove('archive'); } }, 700);
  }
});
rouge.on('search-blur', () => $('search').blur());
rouge.on('trailing', n => { trailing = n; syncFeed(); renderPouch(); });

let bumpT;
rouge.on('state', s => {
  data = { ...data, ...s };
  data.recent.forEach(withIcon); data.pouch.forEach(withIcon);
  if (s.fresh) {
    freshId = s.fresh;
    N.classList.add('bump'); clearTimeout(bumpT);
    bumpT = setTimeout(() => N.classList.remove('bump'), 520);
  }
  if (q.pouch && !data.pouch.length) q.pouch = false;
  renderMini();
  renderPouch(s);
  if (open) refresh(false); else renderChips();
});

function flash(id) {
  setTimeout(() => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 700); }
  }, 40);
}
function setSource(key, el) {
  const it = shown.find(i => Rouge.srcKey(i) === key) || data.recent.find(i => Rouge.srcKey(i) === key);
  q.source = q.source === key ? null : key;
  q.sourceItem = it ? { src: it.src, icon: it.icon } : null;
  page = 0;
  refresh(true);
}
function onListClick(e) {
  const s = e.target.closest('[data-src]');
  if (s) { e.stopPropagation(); setSource(s.dataset.src); return; }
  if (e.target.closest('[data-arch]')) { mode = 'archive'; page = 0; refresh(true); return; }
  const out = e.target.closest('[data-out]');
  if (out) { rouge.send('unpouch', out.dataset.out); return; }
  const x = e.target.closest('[data-x]');
  if (x) { rouge.send('remove', x.dataset.x); return; }
  const c = e.target.closest('.card, .row, .ar');
  if (!c) return;
  rouge.send('copy', c.dataset.id);
  flash(c.dataset.id);
}
$('grid').addEventListener('click', onListClick);
$('archList').addEventListener('click', onListClick);
$('pager').addEventListener('click', e => {
  const b = e.target.closest('[data-pg]');
  if (!b || b.disabled) return;
  page += +b.dataset.pg;
  refresh(true);
});

$('chips').addEventListener('click', e => {
  const c = e.target.closest('.chip');
  if (!c) return;
  if (c.dataset.clear === 'pouch') q.pouch = false;
  else if (c.dataset.clear === 'source') q.source = null;
  else if (c.dataset.src !== undefined) return setSource(c.dataset.src);
  else if (c.dataset.f !== undefined) {
    if (!c.dataset.f) { q.kind = null; q.source = null; q.pouch = false; }
    else q.kind = q.kind === c.dataset.f ? null : c.dataset.f;
  }
  page = 0;
  renderPouch();
  refresh(true);
});
$('chips').addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { $('chips').scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
$('archChip').addEventListener('click', () => { mode = mode === 'archive' ? 'main' : 'archive'; page = 0; refresh(true); });

$('view').addEventListener('click', e => {
  const d = e.target.closest('[data-v]');
  if (!d || d.dataset.v === view) return;
  view = d.dataset.v;
  try { localStorage.setItem('rouge.view', view); } catch {}
  refresh(true);
});

const search = $('search');
let searchT;
search.addEventListener('pointerdown', () => { rouge.send('pin', true); setTimeout(() => search.focus(), 60); });
search.addEventListener('input', () => {
  $('searchBox').classList.toggle('has', !!search.value);
  clearTimeout(searchT);
  searchT = setTimeout(() => { q.text = search.value.trim(); page = 0; refresh(true); }, 140);
});
search.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (search.value) { search.value = ''; search.dispatchEvent(new Event('input')); } else search.blur(); }
  if (e.key === 'Enter' && shown[0]) { rouge.send('copy', shown[0].id); flash(shown[0].id); }
});
search.addEventListener('blur', () => rouge.send('pin', false));
$('searchClear').addEventListener('click', () => { search.value = ''; search.dispatchEvent(new Event('input')); });

$('carry').onclick = () => { mascot.cheer(); rouge.send('carry'); };
$('openPouch').onclick = () => { q.pouch = !q.pouch; mode = 'main'; page = 0; renderPouch(); refresh(true); };
let armed = false, armT;
$('clearAll').onclick = () => {
  const b = $('clearAll');
  if (!armed) { armed = true; b.classList.add('armed'); b.title = 'Click again to clear history (the pouch is kept)'; clearTimeout(armT); armT = setTimeout(() => { armed = false; b.classList.remove('armed'); b.title = 'Clear history'; }, 2200); return; }
  armed = false; b.classList.remove('armed'); rouge.send('clear');
};

document.addEventListener('mousemove', e => {
  const r = $('mascot').getBoundingClientRect();
  mascot.look(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height * .65));
});

setInterval(() => { if (open && mode === 'main') renderGrid(false); }, 30000);
renderMini(); renderPouch(); renderChips(); renderSettings();
