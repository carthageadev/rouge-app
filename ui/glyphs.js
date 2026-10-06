(function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const domain = u => { try { return new URL(/^[a-z][\w+.-]*:\/\//i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, ''); } catch { return u; } };
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

  const svg = (body, cls = 'g-full') => `<svg viewBox="0 0 24 24" class="${cls}">${body}</svg>`;
  const bg = c => `<rect width="24" height="24" fill="${c}"/>`;
  const word = (b, f, t, size = 9, x = 12, y = 15.6, anchor = 'middle', extra = '') =>
    svg(bg(b) + `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Segoe UI Variable Display,Segoe UI,system-ui" font-weight="800" font-size="${size}" letter-spacing="-.3" fill="${f}" ${extra}>${t}</text>`);
  const mono = (b, f, t, size = 9) => svg(bg(b) + `<text x="12" y="15.4" text-anchor="middle" font-family="Cascadia Code,Consolas,monospace" font-weight="700" font-size="${size}" fill="${f}">${t}</text>`);
  const cube = c => svg(bg(c) + '<path d="M12 4.2l6.9 3.9v7.8L12 19.8l-6.9-3.9V8.1z" fill="#fff" fill-opacity=".66"/><path d="M12 4.2l6.9 3.9L12 12 5.1 8.1z" fill="#fff"/><path d="M12 12l6.9-3.9v7.8L12 19.8z" fill="#fff" fill-opacity=".4"/>');
  let sphereN = 0;
  const sphere = (b, light, dark) => { const id = 'g-sp' + (++sphereN); return svg(bg(b) + `<defs><radialGradient id="${id}" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".32" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient></defs><circle cx="12" cy="12" r="7.6" fill="url(#${id})"/>`); };
  const MODEL_TINT = { obj: '#6366f1', fbx: '#2563eb', gltf: '#16a34a', glb: '#16a34a', stl: '#64748b', ply: '#0891b2', usd: '#7c3aed', usda: '#7c3aed', usdc: '#7c3aed', usdz: '#7c3aed',
    dae: '#ea580c', '3ds': '#0e7490', max: '#0e7490', ma: '#0d9488', mb: '#0d9488', abc: '#475569', c4d: '#1e40af', x3d: '#6366f1', '3mf': '#64748b', mtl: '#db2777' };
  const snake = 'M11.8 2.6c-3.4 0-3.8 1.5-3.8 2.5v1.9h4v.7H5.9C4 7.7 2.6 9.1 2.6 12.1s1.4 4.5 3.3 4.5h1.4v-2.3c0-1.7 1.3-3 3-3h4.2c1.4 0 2.5-1.1 2.5-2.5V5.1c0-1.4-1.1-2.5-5.2-2.5z';

  const LANG_ICONS = {
    javascript: () => word('#f7df1e', '#1b1b1b', 'JS', 10, 21.5, 20.5, 'end'),
    typescript: () => word('#3178c6', '#fff', 'TS', 10, 21.5, 20.5, 'end'),
    jsx: () => svg(bg('#20232a') + '<g fill="none" stroke="#61dafb" stroke-width="1.1"><ellipse cx="12" cy="12" rx="8.5" ry="3.3"/><ellipse cx="12" cy="12" rx="8.5" ry="3.3" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="8.5" ry="3.3" transform="rotate(120 12 12)"/></g><circle cx="12" cy="12" r="1.7" fill="#61dafb"/>'),
    python: () => svg(bg('#ffffff') + `<path d="${snake}" fill="#3776ab"/><circle cx="9.8" cy="4.9" r=".9" fill="#fff"/><path d="${snake}" fill="#ffd43b" transform="rotate(180 12 12)"/><circle cx="14.2" cy="19.1" r=".9" fill="#fff"/>`),
    csharp: () => word('#68217a', '#fff', 'C#', 9.5),
    java: () => svg(bg('#ffffff') + '<path d="M6.5 11.5h9.5v3.6a4.4 4.4 0 0 1-4.4 4.4h-.7a4.4 4.4 0 0 1-4.4-4.4z" fill="#5382a1"/><path d="M16 12.6h1.1a2.2 2.2 0 0 1 0 4.4H16" fill="none" stroke="#5382a1" stroke-width="1.4"/><path d="M9.6 9.6c-1.1-1.5 1.3-2.2 0-3.9M13 9.6c-1.1-1.5 1.3-2.2 0-3.9" stroke="#e76f00" stroke-width="1.5" fill="none" stroke-linecap="round"/>'),
    cpp: () => word('#00599c', '#fff', 'C++', 8.2),
    go: () => word('#00add8', '#fff', 'GO', 9.5, 12, 15.6, 'middle', 'font-style="italic"'),
    rust: () => svg(bg('#ffffff') + '<circle cx="12" cy="12" r="8.6" fill="none" stroke="#1b1b1f" stroke-width="2.2" stroke-dasharray="1.35 1.05"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="#1b1b1f" stroke-width="1.3"/><text x="12" y="15.3" text-anchor="middle" font-family="Segoe UI,system-ui" font-weight="900" font-size="8.8" fill="#1b1b1f">R</text>'),
    php: () => svg(bg('#777bb4') + '<text x="12" y="15" text-anchor="middle" font-family="Segoe UI,system-ui" font-weight="800" font-style="italic" font-size="8.6" letter-spacing="-.2" fill="#fff">php</text>'),
    ruby: () => svg(bg('#ffffff') + '<path d="M7 6.5h10l3.2 4.4L12 20.5l-8.2-9.6z" fill="#cc342d"/><path d="M3.8 10.9h16.4M7 6.5l2 4.4 3-4.4 3 4.4 2-4.4M9 10.9l3 9.6 3-9.6" stroke="#fff" stroke-opacity=".5" stroke-width=".8" fill="none" stroke-linejoin="round"/>'),
    kotlin: () => svg(bg('#ffffff') + '<defs><linearGradient id="g-kt" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7f52ff"/><stop offset=".55" stop-color="#c711e1"/><stop offset="1" stop-color="#e44857"/></linearGradient></defs><path d="M5 19V5h14l-7 7 7 7z" fill="url(#g-kt)"/>'),
    swift: () => svg(bg('#f05138') + '<path d="M17.8 15.7c1.4-2.6.5-6.1-2.2-8.5 1.3 2 1.7 4.2 1 5.8C13.8 11.5 9.6 8.4 6.3 5.6c2.3 3 4.7 5.2 6.1 6.5-2.4-1.2-5.6-3.3-7.4-4.8 2.2 3.2 5.5 6.3 9.3 7.8-2.5 1.1-5.3.9-7.8-.6 2.4 2.5 6.3 3.8 9.4 2.3.9-.4 1.7.2 2.3.9.2-.9-.1-1.6-.4-2z" fill="#fff"/>'),
    sql: () => svg(bg('#2f80c2') + '<path d="M6.5 7v10c0 1.3 2.5 2.3 5.5 2.3s5.5-1 5.5-2.3V7" fill="#fff"/><ellipse cx="12" cy="7" rx="5.5" ry="2.3" fill="#fff"/><path d="M6.5 7c0 1.3 2.5 2.3 5.5 2.3s5.5-1 5.5-2.3M6.5 10.6c0 1.3 2.5 2.3 5.5 2.3s5.5-1 5.5-2.3M6.5 14.2c0 1.3 2.5 2.3 5.5 2.3s5.5-1 5.5-2.3" fill="none" stroke="#2f80c2" stroke-width="1"/>'),
    html: () => svg(bg('#e44d26') + '<path d="M5.6 4.2h12.8l-1.17 13.4L12 19.8l-5.23-2.2z" fill="#fff"/><path d="M15.2 7.8H8.8l.33 3.7h5.7l-.4 4.1L12 16.5l-2.4-.8-.16-1.8" fill="none" stroke="#e44d26" stroke-width="1.45" stroke-linejoin="round"/>'),
    css: () => svg(bg('#1572b6') + '<path d="M5.6 4.2h12.8l-1.17 13.4L12 19.8l-5.23-2.2z" fill="#fff"/><path d="M8.8 7.8h6.4l-.33 3.7H9.2m5.67 0-.4 4.1L12 16.5l-2.4-.8-.16-1.8" fill="none" stroke="#1572b6" stroke-width="1.45" stroke-linejoin="round"/>'),
    json: () => mono('#26262e', '#f5c518', '{}', 10.5),
    xml: () => mono('#e37933', '#fff', '&lt;/&gt;', 7.5),
    yaml: () => word('#cb171e', '#fff', 'YML', 7.5),
    markdown: () => svg(bg('#ffffff') + '<rect x="2.6" y="6.2" width="18.8" height="11.6" rx="2" fill="none" stroke="#2b2b33" stroke-width="1.4"/><path d="M5.6 15V9l2.5 3 2.5-3v6M15.6 9v5.6M13.4 12.6l2.2 2.3 2.2-2.3" fill="none" stroke="#2b2b33" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>'),
    shell: () => svg(bg('#1c1d22') + '<path d="M6 8.5l3.5 3.5L6 15.5" fill="none" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 16h6" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>'),
    powershell: () => svg(bg('#012456') + '<path d="M6.5 8.5l4 3.5-4 3.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16h5.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'),
    lua: () => svg(bg('#ffffff') + '<circle cx="11" cy="13" r="7.4" fill="#000080"/><circle cx="14" cy="10" r="2.1" fill="#fff"/><circle cx="19.3" cy="4.7" r="2.1" fill="#000080"/>'),
    dockerfile: () => svg(bg('#2496ed') + '<g fill="#fff"><rect x="5" y="10" width="2.6" height="2.4"/><rect x="8" y="10" width="2.6" height="2.4"/><rect x="11" y="10" width="2.6" height="2.4"/><rect x="8" y="7.2" width="2.6" height="2.4"/><rect x="11" y="7.2" width="2.6" height="2.4"/><rect x="14" y="10" width="2.6" height="2.4"/></g><path d="M3.6 13.2h15.2c.9-1.6 2.2-1.9 2.6-1.7-.4 2.9-2.6 6-8.4 6-5.2 0-8.3-2-9.4-4.3z" fill="#fff"/>'),
    error: () => svg(bg('#ef4444') + '<path d="M12 4.8l7.6 13.4H4.4z" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10.2v3.6" stroke="#ef4444" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="16.2" r="1.05" fill="#ef4444"/>'),
    model: item => (item?.of || '').toLowerCase() === 'mtl' ? sphere('#2a1020', '#f9a8d4', '#9d174d') : cube(MODEL_TINT[(item?.of || '').toLowerCase()] || '#6366f1'),
    unity: () => svg(bg('#1b1b1f') + '<g fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.6l7.3 4.2v8.4L12 20.4l-7.3-4.2V7.8z"/><path d="M12 12v8.4M12 12l7.3-4.2M12 12L4.7 7.8"/></g>'),
    unreal: () => svg(bg('#ffffff') + '<circle cx="12" cy="12" r="9.2" fill="#111"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-width=".9"/><path d="M9.3 8.2v5.1a2.7 2.7 0 0 0 5.4 0V8.2" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>'),
    godot: () => svg(bg('#ffffff') + '<circle cx="7.3" cy="6.4" r="1.6" fill="#478cbf"/><circle cx="16.7" cy="6.4" r="1.6" fill="#478cbf"/><path d="M4.8 9.4c0-2 1.6-3.5 3.5-3.5h7.4c1.9 0 3.5 1.5 3.5 3.5v6.3c0 1.9-1.6 3.4-3.5 3.4H8.3c-1.9 0-3.5-1.5-3.5-3.4z" fill="#478cbf"/><circle cx="9.2" cy="11.8" r="2.4" fill="#fff"/><circle cx="14.8" cy="11.8" r="2.4" fill="#fff"/><circle cx="9.5" cy="12" r="1.15" fill="#414042"/><circle cx="14.5" cy="12" r="1.15" fill="#414042"/><rect x="10.5" y="15.6" width="3" height="1.4" rx=".7" fill="#fff"/>'),
    shader: () => sphere('#17142a', '#d8b4fe', '#5b21b6'),
  };
  LANG_ICONS.gdscript = LANG_ICONS.godot;

  const LANG_NAMES = { javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'React', python: 'Python', csharp: 'C#', java: 'Java', cpp: 'C / C++', go: 'Go', rust: 'Rust',
    php: 'PHP', ruby: 'Ruby', kotlin: 'Kotlin', swift: 'Swift', sql: 'SQL', html: 'HTML', xml: 'XML', css: 'CSS', json: 'JSON', yaml: 'YAML', markdown: 'Markdown',
    shell: 'Shell', powershell: 'PowerShell', lua: 'Lua', dockerfile: 'Dockerfile', gdscript: 'GDScript', godot: 'Godot scene', unity: 'Unity asset', unreal: 'Unreal',
    shader: 'Shader', model: '3D model' };
  const langName = item => item.lang === 'error' ? (LANG_NAMES[item.of] ? LANG_NAMES[item.of] + ' error' : 'Error log')
    : item.lang === 'model' && item.of ? '3D model · ' + item.of : item.lang === 'shader' && item.of ? item.of : LANG_NAMES[item.lang] || 'Code';

  const doc = (label = 'TXT', tint = '#9ea3ad') => svg(`<path d="M6.5 2.5h7.5l4.5 4.5v13a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5z" fill="#fff" stroke="#cfd2d8"/><path d="M14 2.5V7h4.5" fill="#eef0f3" stroke="#cfd2d8" stroke-linejoin="round"/><text x="11.8" y="16.6" text-anchor="middle" font-size="${label.length > 3 ? 4 : 4.8}" font-weight="800" fill="${tint}" font-family="Segoe UI,system-ui">${esc(label)}</text>`, 'g-svg');
  const envelope = svg('<rect x="3" y="6" width="18" height="12.5" rx="2.2" fill="#e8f0fe" stroke="#6f97f2" stroke-width="1.1"/><path d="M3.9 7.2l8.1 6 8.1-6" fill="none" stroke="#6f97f2" stroke-width="1.1" stroke-linejoin="round"/>', 'g-svg');
  const folder = svg('<path d="M3 7a2 2 0 0 1 2-2h4.2l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#e8b22d"/><path d="M3 9.4h18V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#ffd25e"/>', 'g-svg');
  const EXT_TINT = { png: '#e5528a', jpg: '#e5528a', jpeg: '#e5528a', gif: '#e5528a', webp: '#e5528a', svg: '#f08c2a', pdf: '#e0453a', zip: '#a07040', rar: '#a07040', '7z': '#a07040',
    mp4: '#7b61ff', mov: '#7b61ff', mp3: '#18a058', wav: '#18a058', exe: '#4a5568', txt: '#9ea3ad', md: '#2b2b33', json: '#c79a00', cs: '#68217a', js: '#c9a400', ts: '#3178c6', py: '#3776ab' };

  const EXT_CODE = { py: 'python', js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', tsx: 'jsx', jsx: 'jsx', cs: 'csharp', java: 'java',
    c: 'cpp', h: 'cpp', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', go: 'go', rs: 'rust', php: 'php', rb: 'ruby', kt: 'kotlin', swift: 'swift', sql: 'sql', html: 'html', htm: 'html',
    css: 'css', scss: 'css', json: 'json', yml: 'yaml', yaml: 'yaml', md: 'markdown', sh: 'shell', bash: 'shell', ps1: 'powershell', lua: 'lua', xml: 'xml', gd: 'gdscript',
    shader: 'shader', hlsl: 'shader', glsl: 'shader', cginc: 'shader', compute: 'shader', gdshader: 'shader', vert: 'shader', frag: 'shader', dockerfile: 'dockerfile' };
  const UNITY_EXT = new Set('unity prefab asset mat anim controller unitypackage meta shadergraph shadersubgraph physicmaterial overridecontroller playable mask spriteatlas lighting terrainlayer mixer guiskin flare cubemap rendertexture inputactions'.split(' '));
  const UNREAL_EXT = new Set('uasset umap uproject uplugin upk udk'.split(' '));
  const GODOT_EXT = new Set('tscn tres godot escn'.split(' '));
  const blender = svg(bg('#ffffff') + '<path d="M3.6 10.2h6.4M6.2 5.4l5.6 4.4" stroke="#ea7600" stroke-width="2.3" stroke-linecap="round"/><circle cx="13.6" cy="13.4" r="6.4" fill="#ea7600"/><circle cx="13.6" cy="13.4" r="4" fill="#fff"/><circle cx="13.6" cy="13.4" r="2.3" fill="#265787"/>');
  function extGlyph(ext) {
    if (MODEL_TINT[ext]) return LANG_ICONS.model({ of: ext });
    if (/^blend\d?$/.test(ext)) return blender;
    if (UNITY_EXT.has(ext)) return LANG_ICONS.unity();
    if (UNREAL_EXT.has(ext)) return LANG_ICONS.unreal();
    if (GODOT_EXT.has(ext)) return LANG_ICONS.godot();
    if (EXT_CODE[ext]) return LANG_ICONS[EXT_CODE[ext]]();
    return null;
  }

  const GROUPS = {
    image: ['png jpg jpeg gif webp bmp tif tiff heic avif ico svg jfif', () => svg(bg('#ec4899') + '<path d="M4.6 17.6l4.6-5.7 3.2 3.9 2.3-2.8 4.8 4.6z" fill="#fff"/><circle cx="15.6" cy="8.2" r="1.9" fill="#fff"/>')],
    video: ['mp4 mov mkv avi webm wmv m4v flv mpg mpeg', () => svg(bg('#7c3aed') + '<rect x="4.6" y="6.6" width="14.8" height="10.8" rx="2.4" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M10.4 9.5v5l4.2-2.5z" fill="#fff"/>')],
    audio: ['mp3 wav flac ogg m4a aac opus wma aiff mid midi', () => svg(bg('#16a34a') + '<path d="M10 16.4V7.7l7-1.6v8.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.3" cy="16.6" r="2" fill="#fff"/><circle cx="15.3" cy="14.8" r="2" fill="#fff"/>')],
    pdf: ['pdf', () => word('#e0453a', '#fff', 'PDF', 7.4)],
    word: ['doc docx odt rtf pages', () => word('#2b579a', '#fff', 'W', 11)],
    sheet: ['xls xlsx xlsm csv tsv ods numbers', () => word('#217346', '#fff', 'X', 11)],
    slides: ['ppt pptx odp key', () => word('#d24726', '#fff', 'P', 11)],
    archive: ['zip rar 7z tar gz tgz bz2 xz iso dmg cab', () => svg(bg('#a16207') + '<path d="M12 3.6v7.6" stroke="#fff" stroke-width="2.4" stroke-dasharray="1.6 1.4"/><rect x="9.6" y="11.4" width="4.8" height="6" rx="1.2" fill="#fff"/><rect x="11.1" y="13.8" width="1.8" height="1.6" fill="#a16207"/>')],
    font: ['ttf otf woff woff2 fon', () => svg(bg('#334155') + '<text x="12" y="16.2" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" fill="#fff">Aa</text>')],
    text: ['txt log ini cfg conf env toml nfo', () => svg(bg('#ffffff') + '<path d="M6.5 7.5h11M6.5 10.5h11M6.5 13.5h11M6.5 16.5h7" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>')],
    psd: ['psd psb', () => word('#001e36', '#31a8ff', 'Ps', 10)],
    ai: ['ai eps', () => word('#330000', '#ff9a00', 'Ai', 10)],
  };
  const TYPE_OF = {};
  for (const [k, [exts]] of Object.entries(GROUPS)) for (const e of exts.split(' ')) TYPE_OF[e] = k;
  const typeGlyph = ext => TYPE_OF[ext] ? GROUPS[TYPE_OF[ext]][1]() : null;

  function fileTile(item) {
    const n = item.count || item.paths?.length || 1;
    const badge = n > 1 ? `<span class="g-count">${n > 99 ? '99+' : n}</span>` : '';
    if (item.thumb) return `<img class="g-img" src="${item.thumb}" draggable="false" alt="">${badge}`;
    const ext = item.ext || '';
    const one = item.dir0 || !ext ? (item.dir0 === false && item.ficon ? `<div class="g-ficon"><img src="${item.ficon}" alt=""></div>` : folder)
      : extGlyph(ext) || typeGlyph(ext) || (item.ficon ? `<div class="g-ficon"><img src="${item.ficon}" alt=""></div>` : doc(ext.toUpperCase().slice(0, 4), EXT_TINT[ext] || '#6b7280'));
    return one + badge;
  }

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
      case 'color': return `<div class="g-color" style="--c:${esc(item.hex || (item.text || '').trim())}"></div>`;
      case 'link': {
        const d = domain(item.url || (item.text || '').trim()), h = hue(d);
        return `<div class="g-link" style="--h:${h}">${esc(d.charAt(0).toUpperCase())}${favicon(d)}</div>`;
      }
      case 'email': return envelope;
      case 'files': return fileTile(item);
      case 'path': return item.ext ? extGlyph(item.ext) || typeGlyph(item.ext) || doc(item.ext.toUpperCase().slice(0, 4), EXT_TINT[item.ext] || '#6b7280') : folder;
      case 'code': return LANG_ICONS[item.lang] ? LANG_ICONS[item.lang](item) : `<div class="g-code">&lt;/&gt;</div>`;
      default: return doc();
    }
  }

  function colorAlts(item) {
    const h = item.hex;
    if (!h) return [];
    const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), a = item.alpha ?? 1, al = +a.toFixed(2);
    const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    const hue = !d ? 0 : mx === R ? 60 * (((G - B) / d) % 6) : mx === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4);
    const H = Math.round((hue + 360) % 360), S = Math.round(s * 100), L = Math.round(l * 100);
    const f = v => v.toFixed(3);
    return [
      { k: 'HEX', v: h },
      { k: 'RGB', v: a < 1 ? `rgba(${r}, ${g}, ${b}, ${al})` : `rgb(${r}, ${g}, ${b})` },
      { k: 'HSL', v: a < 1 ? `hsla(${H}, ${S}%, ${L}%, ${al})` : `hsl(${H}, ${S}%, ${L}%)` },
      { k: '0–1', v: `${f(R)}, ${f(G)}, ${f(B)}${a < 1 ? ', ' + f(a) : ''}`, fmt: 'FLOAT' },
    ].filter(x => (x.fmt || x.k) !== item.cfmt).slice(0, 3);
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

  const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB';
  function filesLabel(item) {
    const n = item.count || 1, cut = item.effect === 'move' ? 'Cut · ' : '';
    if (n > 1) {
      if (item.nd === undefined || n > 200) return cut + n + ' items';
      const parts = [item.nf && `${item.nf} file${item.nf > 1 ? 's' : ''}`, item.nd && `${item.nd} folder${item.nd > 1 ? 's' : ''}`].filter(Boolean);
      return cut + (parts.join(' · ') || n + ' items');
    }
    if (item.dir0) return cut + 'Folder';
    return cut + (item.size !== undefined && item.nf ? fmtSize(item.size) : 'File');
  }

  function preview(item, n = 60) {
    const t = (item.text || '').replace(/\s+/g, ' ').trim();
    if (item.kind === 'image') return `Image · ${item.w}×${item.h}`;
    if (item.kind === 'files') return (item.name || 'Files') + (item.count > 1 ? ` +${item.count - 1} more` : '');
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

  kw('gdscript', 'func var const extends class_name signal enum static return if elif else for while in match pass break continue self null true false and or not is as await preload load super');
  kw('shader', 'uniform varying attribute in out inout void float int uint bool vec2 vec3 vec4 mat3 mat4 sampler2D float2 float3 float4 half half2 half3 half4 fixed fixed4 return if else for while struct cbuffer Texture2D SamplerState Shader SubShader Pass Properties Tags CGPROGRAM ENDCG HLSLPROGRAM ENDHLSL shader_type render_mode');
  kw('unreal', 'Begin End Object Class Name Map Actor Level CustomProperties Pin');
  kw('godot', 'gd_scene gd_resource ext_resource sub_resource node resource connection type name parent');
  const HASH = new Set(['python', 'shell', 'ruby', 'yaml', 'powershell', 'dockerfile', 'gdscript', 'model', 'unity']);
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

  window.Rouge = { tile, favOn, colorAlts, filesLabel, fmtSize, esc, domain, hue, srcIcon, srcName, srcKey, preview, langName, highlight, LANG_NAMES };
})();
