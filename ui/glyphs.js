(function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const domain = u => { try { return new URL(/^[a-z][\w+.-]*:\/\//i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

  const svg = (body, cls = 'g-full') => `<svg viewBox="0 0 24 24" class="${cls}">${body}</svg>`;
  const bg = c => `<rect width="24" height="24" fill="${c}"/>`;
  const word = (b, f, t, size = 9, x = 12, y = 15.6, anchor = 'middle', extra = '') =>
    svg(bg(b) + `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Segoe UI Variable Display,Segoe UI,system-ui" font-weight="800" font-size="${size}" letter-spacing="-.3" fill="${f}" ${extra}>${t}</text>`);
  const mono = (b, f, t, size = 9) => svg(bg(b) + `<text x="12" y="15.4" text-anchor="middle" font-family="Cascadia Code,Consolas,monospace" font-weight="700" font-size="${size}" fill="${f}">${t}</text>`);
  const snake = 'M11.8 2.6c-3.4 0-3.8 1.5-3.8 2.5v1.9h4v.7H5.9C4 7.7 2.6 9.1 2.6 12.1s1.4 4.5 3.3 4.5h1.4v-2.3c0-1.7 1.3-3 3-3h4.2c1.4 0 2.5-1.1 2.5-2.5V5.1c0-1.4-1.1-2.5-5.2-2.5z';
  const shield = (a, b) => `<path d="M5 3h14l-1.3 15L12 21l-5.7-3z" fill="${a}"/><path d="M12 4.6v15l4.4-1.3L17.5 4.6z" fill="${b}"/>`;

  const LANG_ICONS = {
    javascript: () => word('#f7df1e', '#1b1b1b', 'JS', 10, 21.5, 20.5, 'end'),
    typescript: () => word('#3178c6', '#fff', 'TS', 10, 21.5, 20.5, 'end'),
    jsx: () => svg(bg('#20232a') + '<g fill="none" stroke="#61dafb" stroke-width="1.1"><ellipse cx="12" cy="12" rx="8.5" ry="3.3"/><ellipse cx="12" cy="12" rx="8.5" ry="3.3" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8.5" ry="3.3" transform="rotate(120 12 12)"/></g><circle cx="12" cy="12" r="1.7" fill="#61dafb"/>'),
    python: () => svg(bg('#eef3f9') + `<path d="${snake}" fill="#3776ab"/><circle cx="9.8" cy="4.9" r=".9" fill="#fff"/><path d="${snake}" fill="#ffd43b" transform="rotate(180 12 12)"/><circle cx="14.2" cy="19.1" r=".9" fill="#fff"/>`),
    csharp: () => word('#68217a', '#fff', 'C#', 9.5),
    java: () => svg(bg('#fdf3ea') + '<path d="M6.5 11.5h9.5v3.6a4.4 4.4 0 0 1-4.4 4.4h-.7a4.4 4.4 0 0 1-4.4-4.4z" fill="#5382a1"/><path d="M16 12.6h1.1a2.2 2.2 0 0 1 0 4.4H16" fill="none" stroke="#5382a1" stroke-width="1.4"/><path d="M9.6 9.6c-1.1-1.5 1.3-2.2 0-3.9M13 9.6c-1.1-1.5 1.3-2.2 0-3.9" stroke="#e76f00" stroke-width="1.5" fill="none" stroke-linecap="round"/>'),
    cpp: () => word('#00599c', '#fff', 'C++', 8.2),
    go: () => word('#00add8', '#fff', 'GO', 9.5, 12, 15.6, 'middle', 'font-style="italic"'),
    rust: () => svg(bg('#2a2522') + '<circle cx="12" cy="12" r="7.2" fill="none" stroke="#f0a070" stroke-width="1.4" stroke-dasharray="1.6 1.2"/><text x="12" y="15.6" text-anchor="middle" font-family="Segoe UI,system-ui" font-weight="800" font-size="9.5" fill="#f0a070">R</text>'),
    php: () => svg(bg('#eef0fa') + '<ellipse cx="12" cy="12" rx="10" ry="6" fill="#777bb4"/><text x="12" y="14.6" text-anchor="middle" font-family="Segoe UI,system-ui" font-weight="800" font-size="7" fill="#fff">php</text>'),
    ruby: () => svg(bg('#fdeeed') + '<path d="M7 6.5h10l3.2 4.4L12 20.5l-8.2-9.6z" fill="#cc342d"/><path d="M3.8 10.9h16.4M7 6.5l2 4.4 3-4.4 3 4.4 2-4.4M9 10.9l3 9.6 3-9.6" stroke="#fff" stroke-opacity=".5" stroke-width=".8" fill="none" stroke-linejoin="round"/>'),
    kotlin: () => svg(bg('#f4f0ff') + '<defs><linearGradient id="g-kt" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7f52ff"/><stop offset=".55" stop-color="#c711e1"/><stop offset="1" stop-color="#e44857"/></linearGradient></defs><path d="M5 19V5h14l-7 7 7 7z" fill="url(#g-kt)"/>'),
    swift: () => svg(bg('#f05138') + '<path d="M17.8 15.7c1.4-2.6.5-6.1-2.2-8.5 1.3 2 1.7 4.2 1 5.8C13.8 11.5 9.6 8.4 6.3 5.6c2.3 3 4.7 5.2 6.1 6.5-2.4-1.2-5.6-3.3-7.4-4.8 2.2 3.2 5.5 6.3 9.3 7.8-2.5 1.1-5.3.9-7.8-.6 2.4 2.5 6.3 3.8 9.4 2.3.9-.4 1.7.2 2.3.9.2-.9-.1-1.6-.4-2z" fill="#fff"/>'),
    sql: () => svg(bg('#e9f4fb') + '<path d="M6 6.5v11c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-11" fill="#3a9ad9"/><ellipse cx="12" cy="6.5" rx="6" ry="2.5" fill="#2f80c2"/><path d="M6 10.4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5M6 14.2c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".9"/>'),
    html: () => svg(bg('#fff1eb') + shield('#e34f26', '#ef652a') + '<path d="M15.6 8.2H8.6l.3 3.6h6.4l-.4 4.3-2.9.9-2.9-.9-.2-1.9" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>'),
    css: () => svg(bg('#ebf1fd') + shield('#264de4', '#2965f1') + '<path d="M8.6 8.2h7l-.3 3.6H9m6.3 0-.4 4.3-2.9.9-2.9-.9-.2-1.9" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>'),
    json: () => mono('#26262e', '#f5c518', '{}', 10.5),
    xml: () => mono('#fdf2e9', '#e37933', '&lt;/&gt;', 7.5),
    yaml: () => word('#cb171e', '#fff', 'YML', 7.5),
    markdown: () => svg(bg('#f2f3f5') + '<rect x="2.6" y="6.2" width="18.8" height="11.6" rx="2" fill="none" stroke="#2b2b33" stroke-width="1.4"/><path d="M5.6 15V9l2.5 3 2.5-3v6M15.6 9v5.6M13.4 12.6l2.2 2.3 2.2-2.3" fill="none" stroke="#2b2b33" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>'),
    shell: () => svg(bg('#1c1d22') + '<path d="M6 8.5l3.5 3.5L6 15.5" fill="none" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 16h6" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>'),
    powershell: () => svg(bg('#012456') + '<path d="M6.5 8.5l4 3.5-4 3.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16h5.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'),
    lua: () => svg(bg('#eef0fa') + '<circle cx="11" cy="13" r="7.4" fill="#000080"/><circle cx="14" cy="10" r="2.1" fill="#fff"/><circle cx="19.3" cy="4.7" r="2.1" fill="#000080"/>'),
    dockerfile: () => svg(bg('#2496ed') + '<g fill="#fff"><rect x="5" y="10" width="2.6" height="2.4"/><rect x="8" y="10" width="2.6" height="2.4"/><rect x="11" y="10" width="2.6" height="2.4"/><rect x="8" y="7.2" width="2.6" height="2.4"/><rect x="11" y="7.2" width="2.6" height="2.4"/><rect x="14" y="10" width="2.6" height="2.4"/></g><path d="M3.6 13.2h15.2c.9-1.6 2.2-1.9 2.6-1.7-.4 2.9-2.6 6-8.4 6-5.2 0-8.3-2-9.4-4.3z" fill="#fff"/>'),
    error: () => svg(bg('#fff0ef') + '<path d="M12 4.2l8.8 15.3H3.2z" fill="#ef4444" stroke="#ef4444" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 10v4.4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="17" r="1.05" fill="#fff"/>'),
  };

  const LANG_NAMES = { javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'React', python: 'Python', csharp: 'C#', java: 'Java', cpp: 'C / C++', go: 'Go', rust: 'Rust',
    php: 'PHP', ruby: 'Ruby', kotlin: 'Kotlin', swift: 'Swift', sql: 'SQL', html: 'HTML', xml: 'XML', css: 'CSS', json: 'JSON', yaml: 'YAML', markdown: 'Markdown',
    shell: 'Shell', powershell: 'PowerShell', lua: 'Lua', dockerfile: 'Dockerfile' };
  const langName = item => item.lang === 'error' ? (LANG_NAMES[item.of] ? LANG_NAMES[item.of] + ' error' : 'Error log') : LANG_NAMES[item.lang] || 'Code';

  const doc = (label = 'TXT', tint = '#9ea3ad') => svg(`<path d="M6.5 2.5h7.5l4.5 4.5v13a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5z" fill="#fff" stroke="#cfd2d8"/><path d="M14 2.5V7h4.5" fill="#eef0f3" stroke="#cfd2d8" stroke-linejoin="round"/><text x="11.8" y="16.6" text-anchor="middle" font-size="${label.length > 3 ? 4 : 4.8}" font-weight="800" fill="${tint}" font-family="Segoe UI,system-ui">${esc(label)}</text>`, 'g-svg');
  const envelope = svg('<rect x="3" y="6" width="18" height="12.5" rx="2.2" fill="#e8f0fe" stroke="#6f97f2" stroke-width="1.1"/><path d="M3.9 7.2l8.1 6 8.1-6" fill="none" stroke="#6f97f2" stroke-width="1.1" stroke-linejoin="round"/>', 'g-svg');
  const folder = svg('<path d="M3 7a2 2 0 0 1 2-2h4.2l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#e8b22d"/><path d="M3 9.4h18V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#ffd25e"/>', 'g-svg');
  const EXT_TINT = { png: '#e5528a', jpg: '#e5528a', jpeg: '#e5528a', gif: '#e5528a', webp: '#e5528a', svg: '#f08c2a', pdf: '#e0453a', zip: '#a07040', rar: '#a07040', '7z': '#a07040',
    mp4: '#7b61ff', mov: '#7b61ff', mp3: '#18a058', wav: '#18a058', exe: '#4a5568', txt: '#9ea3ad', md: '#2b2b33', json: '#c79a00', cs: '#68217a', js: '#c9a400', ts: '#3178c6', py: '#3776ab' };

  function favicon(host) {
    if (!host || /^(localhost|\d+\.\d+\.\d+\.\d+)(:\d+)?$/.test(host)) return '';
    const alt = `https://${esc(host)}/favicon.ico`;
    return `<img class="g-fav" src="https://${esc(host)}/apple-touch-icon.png" data-alt="${alt}" alt="" draggable="false" onload="Rouge.favOn(this)" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt=''}else this.remove()">`;
  }

  function favOn(img) {
    img.parentNode.classList.add('fav-on');
    if (img.dataset.alt && img.naturalWidth >= 57 && Math.abs(img.naturalWidth - img.naturalHeight) < 4) img.classList.add('full');
  }

  function tile(item) {
    switch (item.kind) {
      case 'image': return item.thumb ? `<img class="g-img" src="${item.thumb}" draggable="false" alt="">` : doc('IMG', '#e5528a');
      case 'color': return `<div class="g-color" style="background:${esc((item.text || '').trim())}"></div>`;
      case 'link': {
        const d = domain(item.url || (item.text || '').trim()), h = hue(d);
        return `<div class="g-link" style="--h:${h}">${esc(d.charAt(0).toUpperCase())}${favicon(d)}</div>`;
      }
      case 'email': return envelope;
      case 'path': return item.ext ? doc(item.ext.toUpperCase().slice(0, 4), EXT_TINT[item.ext] || '#6b7280') : folder;
      case 'code': return LANG_ICONS[item.lang] ? LANG_ICONS[item.lang]() : `<div class="g-code">&lt;/&gt;</div>`;
      default: return doc();
    }
  }

  function srcIcon(item, cls = 'src-ic') {
    const s = item.src;
    if (!s) return '';
    const app = item.icon || '';
    if (s.site) {
      const fb = app ? `this.onerror=null;this.src='${app}'` : `this.style.display='none'`;
      return `<img class="${cls}" src="https://${esc(s.site)}/favicon.ico" onerror="${fb}" alt="">`;
    }
    return app ? `<img class="${cls}" src="${app}" alt="">` : '';
  }
  const srcName = item => item.src ? (item.src.site || item.src.app || '') : '';
  const srcKey = item => item.src ? (item.src.site ? 'site:' + item.src.site : item.src.exe ? 'app:' + item.src.exe.toLowerCase() : '') : '';

  function preview(item, n = 60) {
    const t = (item.text || '').replace(/\s+/g, ' ').trim();
    if (item.kind === 'image') return `Image · ${item.w}×${item.h}`;
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  const KW = {};
  const kw = (name, words) => { KW[name] = new Set(words.split(' ')); };
  kw('javascript', 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this super null undefined true false yield static get set delete void');
  kw('typescript', [...KW.javascript].join(' ') + ' interface type enum implements private public protected readonly as declare namespace abstract keyof any number string boolean unknown never');
  KW.jsx = KW.typescript;
  kw('python', 'def class return if elif else for while in not and or is import from as with try except finally raise pass break continue lambda yield None True False self global nonlocal async await assert del');
  kw('csharp', 'using namespace class struct interface public private protected internal static void int float double bool string var new return if else for foreach while do switch case break continue try catch finally throw null true false this base override virtual abstract async await get set readonly const enum out ref in is as typeof sealed partial');
  kw('java', 'package import class interface extends implements public private protected static final void int long double float boolean char new return if else for while do switch case break continue try catch finally throw throws null true false this super');
  kw('cpp', 'include define int long char float double bool void auto const static struct class public private protected return if else for while do switch case break continue new delete nullptr true false namespace using template typename std unsigned');
  kw('go', 'package import func var const type struct interface map chan go defer return if else for range switch case break continue select nil true false');
  kw('rust', 'fn let mut pub struct enum impl trait use mod crate self Self super return if else for while loop match in as ref move async await const static where true false Some None Ok Err');
  kw('php', 'function return if else elseif foreach for while echo new class public private protected static namespace use null true false array');
  kw('ruby', 'def end class module if elsif else unless while do return yield require puts nil true false self attr_accessor');
  kw('kotlin', 'fun val var class object data return if else when for while in is as null true false import package');
  kw('swift', 'func let var struct class enum protocol extension import return if else guard for in while switch case nil true false self some');
  kw('sql', 'select from where and or not insert into values update set delete create table index view drop alter join inner left right outer on as group by order having limit offset distinct union all null is in like between exists case when then else end primary key foreign references default');
  kw('shell', 'if then else elif fi for in do done while case esac function return export local echo sudo cd');
  kw('powershell', 'function param if else elseif foreach for while return switch try catch finally');
  kw('lua', 'local function end if then else elseif for in do while repeat until return nil true false and or not');
  kw('css', 'important');
  kw('dockerfile', 'from run copy add workdir env expose cmd entrypoint arg as');

  const HASH = new Set(['python', 'shell', 'ruby', 'yaml', 'powershell', 'dockerfile']);
  const DASH = new Set(['sql', 'lua']);
  const RE_C = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\b0x[\da-f]+\b|\b\d[\d_]*(?:\.\d+)?[a-z]*\b|#[0-9a-f]{3,8}\b)|([A-Za-z_$@][\w$-]*)/gi;
  const RE_HASH = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_$@][\w$-]*)/g;
  const RE_DASH = /(--[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:''|[^'\n])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)/g;
  const RE_ML = /(<!--[\s\S]*?-->)|("[^"\n]*"|'[^'\n]*')|(\b\d+\b)|(<\/?[A-Za-z][\w:-]*|\/?>|[A-Za-z_:][\w:.-]*(?==))/g;

  function highlight(src, lang) {
    const code = String(src);
    const fam = lang === 'html' || lang === 'xml' ? RE_ML : HASH.has(lang) ? RE_HASH : DASH.has(lang) ? RE_DASH : RE_C;
    const words = KW[lang] || KW.javascript;
    const lower = lang === 'sql' || lang === 'dockerfile';
    fam.lastIndex = 0;
    let out = '', last = 0, m;
    while ((m = fam.exec(code))) {
      out += esc(code.slice(last, m.index));
      const t = m[0];
      let cls = '';
      if (m[1]) cls = 'c';
      else if (m[2]) cls = /^\s*:/.test(code.slice(fam.lastIndex)) ? 'p' : 's';
      else if (m[3]) cls = 'n';
      else if (fam === RE_ML) cls = t.startsWith('<') || t.endsWith('>') ? 'k' : 'p';
      else if (words.has(lower ? t.toLowerCase() : t)) cls = 'k';
      else if (lang === 'css' && /^\s*:/.test(code.slice(fam.lastIndex)) && !/^\s*:\s*[\w-]+\s*[{,(]/.test(code.slice(fam.lastIndex))) cls = 'p';
      else if (/^\s*\(/.test(code.slice(fam.lastIndex))) cls = 'f';
      else if (/^[A-Z][a-z]/.test(t) && !lower) cls = 't';
      out += cls ? `<i class="tk-${cls}">${esc(t)}</i>` : esc(t);
      last = fam.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  window.Rouge = { tile, favOn, esc, domain, hue, srcIcon, srcName, srcKey, preview, langName, highlight, LANG_NAMES };
})();
