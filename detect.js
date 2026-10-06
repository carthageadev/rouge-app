const { describe: describeColor } = require('./colors');

const TLDS = new Set(('com net org io dev app ai co me gg xyz edu gov mil int info biz tv fm ly to so cc ws la vc gl re ' +
  'uk us ca de fr it es nl be ch at se no dk fi pl pt br mx ar cl pe jp kr cn tw hk in sg au nz za ru ua tr ir il ae sa eg ma tn dz ng ke ' +
  'tech site online store shop blog page link live news cloud space design art studio games game wiki one top club xyz email chat run ' +
  'gay social zone work works world today digital media network systems solutions agency').split(' '));

const EXT_LANG = {
  py: 'python', js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', tsx: 'jsx', jsx: 'jsx', cs: 'csharp',
  java: 'java', c: 'cpp', h: 'cpp', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', go: 'go', rs: 'rust', php: 'php', rb: 'ruby', kt: 'kotlin',
  swift: 'swift', sql: 'sql', html: 'html', htm: 'html', css: 'css', scss: 'css', json: 'json', yml: 'yaml', yaml: 'yaml',
  md: 'markdown', sh: 'shell', bash: 'shell', ps1: 'powershell', lua: 'lua', xml: 'xml', shader: 'cpp', hlsl: 'cpp',
};

const SHELL_CMDS = 'sudo|apt|apt-get|brew|npm|npx|pnpm|yarn|pip|pip3|git|cd|ls|mkdir|rm|cp|mv|curl|wget|chmod|chown|docker|kubectl|echo|export|source|cat|grep|ssh|scp|make|cargo|node|python|python3|deno|bun|winget|choco|scoop|code|dotnet|flutter|gradle|mvn|go|rustup|conda|ffmpeg|tar|unzip|systemctl|journalctl|nvm|uv';

const LANGS = {
  python: [[/^\s*def\s+\w+\s*\(.*\)\s*(->\s*[^:]+)?:\s*$/m, 4], [/^\s*class\s+\w+(\(.*\))?:\s*$/m, 3], [/^\s*from\s+[\w.]+\s+import\s+[\w*, ]+$/m, 4],
    [/^\s*import\s+[\w.]+(\s+as\s+\w+)?\s*$/m, 2], [/\bself\.\w+/, 2], [/\bprint\(/, 1], [/^\s*(elif|except|finally|with)\b.*:\s*$/m, 3], [/\b(None|True|False)\b/, 1],
    [/^\s*@\w+/m, 1], [/\blambda\s+\w*\s*:/, 2], [/\bf["'][^"']*\{/, 2], [/__name__\s*==\s*['"]__main__['"]/, 6], [/^\s*for\s+\w+(,\s*\w+)*\s+in\s+.+:\s*$/m, 3]],
  typescript: [[/\binterface\s+\w+(<[^>]+>)?\s*(extends\s+[\w, <>]+)?\s*\{/, 4], [/\btype\s+\w+(<[^>]+>)?\s*=\s*/, 3], [/[\w)\]]\s*:\s*(string|number|boolean|any|void|unknown|never|Record<|Promise<)/, 3],
    [/\b(public|private|protected|readonly)\s+\w+\s*[:(=]/, 2], [/\bas\s+(const|string|number|any|unknown)\b/, 2], [/\benum\s+\w+\s*\{/, 3], [/\bimport\s+type\b/, 5], [/\)\s*:\s*[\w<>[\]|]+\s*(=>|\{)/, 3]],
  javascript: [[/\b(const|let|var)\s+[\w{}[\], ]+\s*=/, 2], [/\bfunction\s*\w*\s*\(/, 2], [/=>/, 1], [/\bconsole\.(log|error|warn|info)\(/, 3], [/\brequire\(['"]/, 3],
    [/\bimport\s+.+\s+from\s+['"]/, 3], [/\bexport\s+(default|const|function|class|async)\b/, 3], [/\b(document|window)\.\w+/, 2], [/===|!==/, 2], [/\bawait\s+\w/, 1], [/\.then\(/, 2], [/;\s*$/m, .5]],
  csharp: [[/\busing\s+(System|UnityEngine|Microsoft)[\w.]*;/, 5], [/\bnamespace\s+[\w.]+/, 3], [/\b(public|private|protected|internal)\s+(static\s+|override\s+|async\s+|virtual\s+)*(class|void|int|string|bool|float|Task|IEnumerator)\b/, 3],
    [/\bConsole\.Write(Line)?\(/, 4], [/\b(MonoBehaviour|SerializeField|GameObject|Vector[23]|Debug\.Log|Quaternion|Transform|Rigidbody)\b/, 4], [/\{\s*get;\s*(private\s+)?set;\s*\}/, 4], [/\bvar\s+\w+\s*=\s*new\b/, 2], [/\bforeach\s*\(\s*var\b/, 3]],
  java: [[/\bpublic\s+static\s+void\s+main\s*\(\s*String/, 6], [/\bSystem\.out\.print(ln)?\(/, 5], [/^\s*package\s+[\w.]+;/m, 4], [/^\s*import\s+(java|javax|android)\./m, 5], [/@Override\b/, 2], [/\bextends\s+\w+\s+implements\b/, 2]],
  cpp: [[/^\s*#include\s*[<"]/m, 5], [/\bstd::\w+/, 4], [/\b(cout|cin)\s*(<<|>>)/, 4], [/\bint\s+main\s*\(/, 3], [/\btemplate\s*</, 3], [/\bprintf\s*\(/, 2], [/\bnullptr\b/, 3], [/^\s*#(define|pragma|ifndef)\b/m, 4]],
  go: [[/^\s*package\s+\w+\s*$/m, 4], [/\bfunc\s+(\(\w+\s+\*?\w+\)\s*)?\w+\s*\(/, 4], [/:=/, 2], [/\bfmt\.\w+\(/, 4], [/\berr\s*!=\s*nil\b/, 5], [/^\s*import\s*\(/m, 2]],
  rust: [[/\bfn\s+\w+\s*(<[^>]*>)?\s*\(/, 4], [/\blet\s+mut\b/, 4], [/\b(println|format|vec|panic|assert_eq)!\s*[([]/, 5], [/\bimpl\b(\s*<[^>]*>)?\s+\w+/, 2], [/^\s*use\s+(std|crate|super)::/m, 5], [/\bmatch\s+\w+\s*\{/, 2], [/&mut\s+\w+/, 3]],
  php: [[/<\?php/, 8], [/\$\w+\s*=.*;/, 2], [/\becho\s+/, 1], [/\$this->\w+/, 4], [/\bfunction\s+\w+\s*\(\s*\$/, 4], [/^\s*namespace\s+[\w\\]+;/m, 3]],
  ruby: [[/^\s*def\s+\w+[?!]?(\(.*\))?\s*$/m, 3], [/^\s*end\s*$/m, 2], [/\bputs\s+/, 3], [/^\s*require\s+['"]/m, 2], [/\bdo\s*\|\w+(,\s*\w+)*\|/, 4], [/\battr_(accessor|reader|writer)\b/, 5]],
  kotlin: [[/\bfun\s+\w+\s*\(/, 4], [/\bval\s+\w+(\s*:\s*\w+)?\s*=/, 3], [/\bdata\s+class\b/, 5], [/\bwhen\s*\(.*\)\s*\{/, 3]],
  swift: [[/^\s*import\s+(SwiftUI|UIKit|Foundation|Combine)\b/m, 6], [/\bguard\s+let\b/, 5], [/\bfunc\s+\w+\s*\(.*\)\s*(->\s*[\w?]+)?\s*\{/, 3], [/\bsome\s+View\b/, 6], [/\b@State\b/, 4]],
  sql: [[/^\s*(SELECT|WITH)\b[\s\S]*\bFROM\b/i, 6], [/^\s*INSERT\s+INTO\b/i, 6], [/^\s*UPDATE\s+[\w.`"[\]]+\s+SET\b/i, 6], [/^\s*DELETE\s+FROM\b/i, 6],
    [/^\s*CREATE\s+(TABLE|INDEX|VIEW|DATABASE|SCHEMA|OR\s+REPLACE|UNIQUE)\b/i, 6], [/^\s*ALTER\s+TABLE\b/i, 6], [/^\s*DROP\s+(TABLE|INDEX|VIEW|DATABASE)\b/i, 6], [/\b(INNER|LEFT|RIGHT)\s+JOIN\b|\bGROUP\s+BY\b|\bORDER\s+BY\b/i, 2]],
  html: [[/^\s*<!doctype html/i, 8], [/<\/?(html|head|body|div|span|p|a|ul|ol|li|section|nav|header|footer|main|script|style|meta|link|button|input|img|form|table|svg)\b[^>]*>/i, 3], [/<\/[a-z][\w-]*>/i, 2], [/\s(class|href|src|id|style)="[^"]*"/, 1]],
  xml: [[/^\s*<\?xml/, 8], [/\sxmlns(:\w+)?="/, 4]],
  css: [[/^\s*[.#@:]?[\w-]+([\s,>+~:.#[\]="'\w()-]*)\{\s*$/m, 2], [/^\s*[\w-]+\s*:\s*[^;{}]+;\s*$/m, 2], [/@(media|keyframes|import|font-face|supports|tailwind|apply)\b/, 4],
    [/:\s*(#[0-9a-f]{3,8}|-?\d*\.?\d+(px|rem|em|%|vh|vw|s|ms|deg))\b/i, 3], [/!important/, 3], [/\bvar\(--[\w-]+\)/, 4]],
  yaml: [[/^---\s*$/m, 2], [/^\s*[\w-]+:\s+[^{};]+$/m, 1], [/^\s*-\s+[\w-]+:\s/m, 3], [/^\s*[\w-]+:\s*$/m, 1], [/^\s*-\s+(name|uses|run|image):/m, 4]],
  markdown: [[/^#{1,6}\s+\S/m, 3], [/^\s*[-*]\s+\[[ xX]\]\s/m, 4], [/\*\*[^*\n]+\*\*/, 2], [/^```/m, 4], [/\[[^\]\n]+\]\([^)\n]+\)/, 3], [/^>\s+\S/m, 1], [/^\s*[-*+]\s+\S/m, 1]],
  shell: [[/^#!\/(usr\/)?bin\/(env\s+)?(ba|z)?sh/m, 8], [/^\s*\$\s+\w/m, 4], [new RegExp(`^\\s*(${SHELL_CMDS})\\s+\\S`, 'm'), 5], [/\s--?[a-z][\w-]*(=\S+)?/, 1], [/\s(&&|\|\|)\s|\s\|\s*\w/, 2], [/\$\{?\w+\}?/, .5]],
  powershell: [[/\b(Get|Set|New|Remove|Start|Stop|Write|Invoke|Test|Import|Export|Add|Select|Where|ForEach|Out|Format|Copy|Move)-[A-Z]\w+/, 5], [/\$env:\w+/, 5], [/\s-(ErrorAction|Force|Recurse|Path|Filter)\b/, 3], [/\|\s*(Where|Select|ForEach|Sort)-Object\b/, 4]],
  lua: [[/^\s*local\s+\w+\s*=/m, 3], [/\bfunction\s+[\w.:]+\s*\(.*\)\s*$/m, 2], [/^\s*end\s*$/m, 1], [/^\s*--(\[\[|\s)/m, 2], [/\bthen\b/, 2], [/~=/, 3]],
  dockerfile: [[/^\s*FROM\s+[\w./-]+(:[\w.-]+)?(\s+AS\s+\w+)?\s*$/mi, 5], [/^\s*(RUN|COPY|ADD|WORKDIR|ENV|EXPOSE|CMD|ENTRYPOINT)\s+/m, 3]],
};

const ERRORS = [/\berror\s+[A-Z]{1,4}\d{3,5}\b/, /^Traceback \(most recent call last\):/m, /^\s+at\s+[\w$.<>[\]]+\s*\(.*:\d+(:\d+)?\)/m, /\b(TypeError|ReferenceError|SyntaxError|RangeError|ValueError|KeyError|IndexError|AttributeError|ImportError|ModuleNotFoundError|NullReferenceException|InvalidOperationException|NullPointerException|[A-Z]\w*Exception|[A-Z]\w*Error):\s/,
  /\(\d+,\d+\)\s*:\s*(error|warning)\b/i, /^\s*File ".*", line \d+/m, /\bUncaught\b/, /\b(failed|exited) with (exit )?code \d+/i, /^\s*(ERROR|FATAL|ERR!)\b/m, /\bnpm ERR!/];

function scoreLangs(t) {
  const out = [];
  for (const [lang, rules] of Object.entries(LANGS)) {
    let s = 0;
    for (const [re, w] of rules) if (re.test(t)) s += w;
    if (s) out.push([lang, s]);
  }
  return out.sort((a, b) => b[1] - a[1]);
}

function codeLang(t) {
  const trimmed = t.trim(), multi = trimmed.includes('\n');
  if (/^[[{]/.test(trimmed) && /[\]}]$/.test(trimmed)) { try { JSON.parse(trimmed); return 'json'; } catch {} }
  const lines = trimmed.split('\n').filter(l => l.trim());
  if (multi && lines.length >= 3 && !/[{};]/.test(trimmed)) {
    const yamlish = lines.filter(l => /^\s*(-\s+)?[\w.-]+:(\s|$)/.test(l) || /^\s*-\s+\S/.test(l) || /^\s*#/.test(l)).length;
    if (yamlish / lines.length >= .7 && lines.filter(l => /^\s*[\w.-]+:/.test(l)).length >= 2) return 'yaml';
  }
  const ranked = scoreLangs(trimmed);
  if (!ranked.length) return null;
  let [lang, score] = ranked[0];
  const of = k => (ranked.find(r => r[0] === k) || [k, 0])[1];
  if (lang === 'javascript' && of('typescript') >= 3) lang = 'typescript', score += of('typescript');
  if (lang === 'typescript' && of('javascript') < 1 && of('typescript') < 4) return null;
  if ((lang === 'javascript' || lang === 'typescript') && (/return\s*\(\s*</.test(trimmed) || /\sclassName=/.test(trimmed) || /<\/[A-Z]\w*>|<[A-Z]\w*\s*\/>/.test(trimmed))) lang = 'jsx';
  if (lang === 'yaml' && (!multi || /[{};]/.test(trimmed) || trimmed.split('\n').filter(l => /^\s*[\w-]+:\s/.test(l)).length < 2)) return null;
  if (lang === 'markdown' && score < 4) return null;
  const words = trimmed.split(/\s+/).length;
  if (lang === 'shell' && !multi && words >= 4 && !/[-./=@:"'|&$~*\\]/.test(trimmed.split(/\s+/).slice(1).join(' '))) return null;
  const symbolic = (trimmed.match(/[{}();=<>[\]$]/g) || []).length / Math.max(1, trimmed.length);
  if (!multi) return score >= 5 || (score >= 4 && symbolic > .04) ? lang : null;
  if (score >= 4) return lang;
  if (score >= 2 && symbolic > .05 && words < 400) return lang;
  return null;
}

function errorLang(t) {
  const hits = ERRORS.filter(re => re.test(t)).length;
  if (!hits) return null;
  const file = t.match(/[\w./\\-]+\.([a-z]{1,6})\b(?:\(\d+,\d+\)|:\d+|", line)/i);
  if (file && EXT_LANG[file[1].toLowerCase()]) return EXT_LANG[file[1].toLowerCase()];
  if (/^Traceback|File ".*", line/m.test(t)) return 'python';
  if (/\b(TypeError|ReferenceError|Uncaught)\b|npm ERR!/.test(t)) return 'javascript';
  if (/Exception\b.*\n\s+at\s/.test(t)) return /\.java:\d+/.test(t) ? 'java' : 'csharp';
  return '';
}

function asEmail(t) {
  const m = t.match(/^(?:mailto:)?([^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,})$/i) || t.match(/^[^<>@\n]{1,60}<([^\s@<>]+@[^\s@<>]+\.[a-z]{2,})>$/i);
  return m ? m[1] : null;
}

function asUrl(t) {
  if (/\s/.test(t)) return null;
  if (/^(https?|ftp|file):\/\/\S+$/i.test(t)) return t;
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)(\/\S*)?$/i.test(t)) return 'http://' + t;
  const m = t.match(/^(www\.)?((?:[a-z0-9-]+\.)+)([a-z]{2,12})(:\d+)?([/?#]\S*)?$/i);
  if (m && TLDS.has(m[3].toLowerCase()) && (m[1] || m[5] || m[2].split('.').length <= 3)) return 'https://' + t;
  return null;
}

const OPEN_Q = '"\'`“‘«', CLOSE_Q = '"\'`”’»';
function unquote(t) {
  let s = t.trim(), quoted = false;
  for (let k = 0; k < 3 && s.length > 1; k++) {
    const a = OPEN_Q.indexOf(s[0]), b = CLOSE_Q.indexOf(s[s.length - 1]);
    if (a >= 0 && b >= 0) s = s.slice(1, -1).trim();
    else if (a >= 0) s = s.slice(1).trim();
    else if (b >= 0 && /^([a-z]:|\\\\|%\w+%|~?\/)/i.test(s)) s = s.slice(0, -1).trim();
    else break;
    quoted = true;
  }
  return { s, quoted };
}

function fromFileUrl(t) {
  const m = t.match(/^file:\/\/([^/]*)(\/.*)$/i);
  if (!m) return null;
  let p;
  try { p = decodeURIComponent(m[2]); } catch { p = m[2]; }
  if (m[1] && m[1].toLowerCase() !== 'localhost') return '\\\\' + m[1] + p.replace(/\//g, '\\');
  return /^\/[a-z]:/i.test(p) ? p.slice(1) : p;
}

function onePath(raw) {
  if (raw.length > 400) return null;
  let { s: t, quoted } = unquote(raw);
  if (/^file:\/\//i.test(t)) { t = fromFileUrl(t); quoted = true; if (!t) return null; }
  if (/^\\\\\?\\[a-z]:\\/i.test(t)) t = t.slice(4);
  const win = /^[a-z]:([\\/]|$)/i.test(t) || /^\\\\[^\\/\s]+[\\/][^\\/]/.test(t) || /^%\w+%([\\/]|$)/.test(t);
  const nix = !win && (quoted ? /^(~|\.{1,2})?\/[^/]+(\/[^/]*)+$/.test(t) : /^(~|\.{1,2})?\/[^\s/]+(\/[^\s/]*)+$/.test(t) || /^~\/\S*$/.test(t));
  if (!win && !nix) return null;
  if (win && /[<>"|?*\t]/.test(t.slice(2))) return null;
  const at = t.match(/\.[a-z0-9]{1,8}(:\d+(:\d+)?|\(\d+(,\d+)?\))$/i);
  const p = at ? t.slice(0, t.length - at[1].length) : t;
  const bare = /^[a-z]:[\\/]?$/i.test(p) ? p.slice(0, 2) : p.replace(/[\\/]+$/, '');
  const name = bare.split(/[\\/]/).pop() || bare;
  const ext = bare.length > 2 ? (name.match(/\.([a-z0-9]{1,8})$/i) || [])[1] : '';
  const out = { path: p, name, dir: bare.slice(0, bare.length - name.length).replace(/[\\/]+$/, ''), ext: ext ? ext.toLowerCase() : '' };
  if (at) out.line = at[1].replace(/[^\d,:]/g, '').replace(/^:/, '').replace(',', ':');
  return out;
}

function asPath(t) {
  if (!t.includes('\n')) return onePath(t);
  const lines = t.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 200) return null;
  const all = lines.map(onePath);
  if (all.some(p => !p)) return null;
  return all.length === 1 ? all[0] : { ...all[0], count: all.length, paths: all.map(p => p.path) };
}

function detect(text) {
  const t = text.trim();
  if (!t) return { kind: 'text' };
  const color = describeColor(t);
  if (color) return { kind: 'color', ...color };
  const single = !t.includes('\n');
  if (single) {
    const email = asEmail(t);
    if (email) return { kind: 'email', email };
    const p = asPath(t);
    if (p) return { kind: 'path', ...p };
    const url = asUrl(t);
    if (url) return { kind: 'link', url };
  } else {
    const p = asPath(t);
    if (p) return { kind: 'path', ...p };
  }
  const err = errorLang(t);
  if (err !== null) return { kind: 'code', lang: 'error', of: err };
  const lang = codeLang(t);
  if (lang) return { kind: 'code', lang };
  return { kind: 'text' };
}

module.exports = { detect };
