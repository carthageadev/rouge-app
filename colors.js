const CSS = ('Alice Blue f0f8ff|Antique White faebd7|Aqua 00ffff|Aquamarine 7fffd4|Azure f0ffff|Beige f5f5dc|Bisque ffe4c4|Black 000000|' +
  'Blanched Almond ffebcd|Blue 0000ff|Blue Violet 8a2be2|Brown a52a2a|Burly Wood deb887|Cadet Blue 5f9ea0|Chartreuse 7fff00|Chocolate d2691e|' +
  'Coral ff7f50|Cornflower Blue 6495ed|Cornsilk fff8dc|Crimson dc143c|Cyan 00ffff|Dark Blue 00008b|Dark Cyan 008b8b|Dark Goldenrod b8860b|' +
  'Dark Gray a9a9a9|Dark Green 006400|Dark Grey a9a9a9|Dark Khaki bdb76b|Dark Magenta 8b008b|Dark Olive Green 556b2f|Dark Orange ff8c00|' +
  'Dark Orchid 9932cc|Dark Red 8b0000|Dark Salmon e9967a|Dark Sea Green 8fbc8f|Dark Slate Blue 483d8b|Dark Slate Gray 2f4f4f|Dark Slate Grey 2f4f4f|' +
  'Dark Turquoise 00ced1|Dark Violet 9400d3|Deep Pink ff1493|Deep Sky Blue 00bfff|Dim Gray 696969|Dim Grey 696969|Dodger Blue 1e90ff|' +
  'Firebrick b22222|Floral White fffaf0|Forest Green 228b22|Fuchsia ff00ff|Gainsboro dcdcdc|Ghost White f8f8ff|Gold ffd700|Goldenrod daa520|' +
  'Gray 808080|Green 008000|Green Yellow adff2f|Grey 808080|Honeydew f0fff0|Hot Pink ff69b4|Indian Red cd5c5c|Indigo 4b0082|Ivory fffff0|' +
  'Khaki f0e68c|Lavender e6e6fa|Lavender Blush fff0f5|Lawn Green 7cfc00|Lemon Chiffon fffacd|Light Blue add8e6|Light Coral f08080|' +
  'Light Cyan e0ffff|Light Goldenrod Yellow fafad2|Light Gray d3d3d3|Light Green 90ee90|Light Grey d3d3d3|Light Pink ffb6c1|' +
  'Light Salmon ffa07a|Light Sea Green 20b2aa|Light Sky Blue 87cefa|Light Slate Gray 778899|Light Slate Grey 778899|Light Steel Blue b0c4de|' +
  'Light Yellow ffffe0|Lime 00ff00|Lime Green 32cd32|Linen faf0e6|Magenta ff00ff|Maroon 800000|Medium Aquamarine 66cdaa|Medium Blue 0000cd|' +
  'Medium Orchid ba55d3|Medium Purple 9370db|Medium Sea Green 3cb371|Medium Slate Blue 7b68ee|Medium Spring Green 00fa9a|' +
  'Medium Turquoise 48d1cc|Medium Violet Red c71585|Midnight Blue 191970|Mint Cream f5fffa|Misty Rose ffe4e1|Moccasin ffe4b5|' +
  'Navajo White ffdead|Navy 000080|Old Lace fdf5e6|Olive 808000|Olive Drab 6b8e23|Orange ffa500|Orange Red ff4500|Orchid da70d6|' +
  'Pale Goldenrod eee8aa|Pale Green 98fb98|Pale Turquoise afeeee|Pale Violet Red db7093|Papaya Whip ffefd5|Peach Puff ffdab9|Peru cd853f|' +
  'Pink ffc0cb|Plum dda0dd|Powder Blue b0e0e6|Purple 800080|Rebecca Purple 663399|Red ff0000|Rosy Brown bc8f8f|Royal Blue 4169e1|' +
  'Saddle Brown 8b4513|Salmon fa8072|Sandy Brown f4a460|Sea Green 2e8b57|Seashell fff5ee|Sienna a0522d|Silver c0c0c0|Sky Blue 87ceeb|' +
  'Slate Blue 6a5acd|Slate Gray 708090|Slate Grey 708090|Snow fffafa|Spring Green 00ff7f|Steel Blue 4682b4|Tan d2b48c|Teal 008080|' +
  'Thistle d8bfd8|Tomato ff6347|Turquoise 40e0d0|Violet ee82ee|Wheat f5deb3|White ffffff|White Smoke f5f5f5|Yellow ffff00|Yellow Green 9acd32')
  .split('|').map(e => { const i = e.lastIndexOf(' '); return [e.slice(0, i), e.slice(i + 1)]; });
const EXTRA = ('Mint 98ff98|Peach ffe5b4|Mustard ffdb58|Burgundy 800020|Rose ff007f|Ruby e0115f|Emerald 50c878|Sapphire 0f52ba|Amber ffbf00|' +
  'Lilac c8a2c8|Mauve e0b0ff|Sage bcb88a|Rust b7410e|Sand c2b280|Cream fffdd0|Cobalt 0047ab|Jade 00a86b|Scarlet ff2400|Cerulean 007ba7|' +
  'Periwinkle ccccff|Mahogany c04000|Terracotta e2725b|Ochre cc7722|Champagne f7e7ce|Vermilion e34234|Charcoal 36454f|Denim 1560bd|' +
  'Coffee 6f4e37|Baby Blue 89cff0|Pastel Pink ffd1dc|Neon Green 39ff14|Electric Blue 7df9ff|Lemon fff700|Taupe 483c32|Off White faf9f6|' +
  'Eggplant 614051|Raspberry e30b5c|Cerise de3163|Wine 722f37')
  .split('|').map(e => { const i = e.lastIndexOf(' '); return [e.slice(0, i), e.slice(i + 1)]; });

const NAMED = new Map(CSS.map(([n, h]) => [n.toLowerCase().replace(/ /g, ''), h]));
const SAME = new Set(['Aqua', 'Fuchsia', 'Dark Grey', 'Dim Grey', 'Grey', 'Light Grey', 'Dark Slate Grey', 'Light Slate Grey', 'Slate Grey']);

const clamp01 = v => Math.min(1, Math.max(0, v));
const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const gam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const mul = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const XYZ_RGB = [[3.2409699419045226, -1.537383177570094, -0.4986107602930034], [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559], [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]];
const D50_D65 = [[0.9554734527042182, -0.023098536874261423, 0.0632593086610217], [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008], [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]];
const P3_XYZ = [[0.4865709486482162, 0.26566769316909306, 0.1982172852343625], [0.2289745640697488, 0.6917385218365064, 0.079286914093745], [0, 0.04511338185890264, 1.043944368900976]];

const fromLinear = ([r, g, b]) => [gam(r), gam(g), gam(b)].map(clamp01);
function labToRgb(L, a, b) {
  const e = 216 / 24389, k = 24389 / 27, fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const xr = fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k, yr = L > k * e ? fy ** 3 : L / k, zr = fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k;
  return fromLinear(mul(XYZ_RGB, mul(D50_D65, [xr * 0.96422, yr, zr * 0.82521])));
}
function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return fromLinear([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]);
}
function rgbToOklab([r, g, b]) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function hslToRgb(h, s, l) {
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)];
}
function hsvToRgb(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)];
}
function hwbToRgb(h, w, bl) {
  if (w + bl >= 1) { const g = w / (w + bl); return [g, g, g]; }
  return hslToRgb(h, 1, .5).map(c => c * (1 - w - bl) + w);
}

const NUM = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i;
function tok(s) {
  if (/^none$/i.test(s)) return { v: 0, unit: '' };
  const m = s.match(NUM);
  if (!m) return null;
  const unit = s.slice(m[0].length).toLowerCase().replace(/f$/, '');
  if (!/^(%|deg|rad|grad|turn|)$/.test(unit)) return null;
  return { v: parseFloat(m[0]), unit };
}
const hue = t => t.unit === 'rad' ? t.v * 180 / Math.PI : t.unit === 'grad' ? t.v * .9 : t.unit === 'turn' ? t.v * 360 : t.v;
const pct = (t, max = 1) => t.unit === '%' ? t.v / 100 * max : t.v;
const ok = (...vs) => vs.every(v => Number.isFinite(v));

function args(inner) {
  const [main, slash] = inner.split('/');
  const parts = main.split(/\s*,\s*|\s+/).filter(Boolean).map(tok);
  if (parts.some(p => !p)) return null;
  let alpha = null;
  if (slash !== undefined) { alpha = tok(slash.trim()); if (!alpha) return null; }
  return { parts, alpha };
}
const alphaOf = (t, max = 1) => t == null ? 1 : t.unit === '%' ? t.v / 100 : t.v / max;

function parseFunc(fn, inner) {
  const a = args(inner);
  if (!a) return null;
  let { parts: p, alpha } = a;
  const n = p.length;
  const take4 = () => { if (n === 4 && alpha == null) { alpha = p[3]; p = p.slice(0, 3); } return p.length === 3; };
  switch (fn) {
    case 'rgb': case 'rgba': {
      if (!take4()) return null;
      const unit = p.every(t => t.unit !== '%' && t.v <= 1) && /\d\.\d/.test(inner) ? 1 : 255;
      return { rgb: p.map(t => t.unit === '%' ? t.v / 100 : t.v / unit), a: alphaOf(alpha), fmt: 'RGB' };
    }
    case 'hsl': case 'hsla':
      if (!take4()) return null;
      return { rgb: hslToRgb(((hue(p[0]) % 360) + 360) % 360, pct(p[1], 100) / 100, pct(p[2], 100) / 100), a: alphaOf(alpha), fmt: 'HSL', s: [p[1], p[2]] };
    case 'hsv': case 'hsb': case 'hsva':
      if (!take4()) return null;
      return { rgb: hsvToRgb(((hue(p[0]) % 360) + 360) % 360, pct(p[1], 100) / 100, pct(p[2], 100) / 100), a: alphaOf(alpha), fmt: 'HSV' };
    case 'hwb':
      if (!take4()) return null;
      return { rgb: hwbToRgb(((hue(p[0]) % 360) + 360) % 360, pct(p[1], 100) / 100, pct(p[2], 100) / 100), a: alphaOf(alpha), fmt: 'HWB' };
    case 'lab': if (!take4()) return null; return { rgb: labToRgb(pct(p[0], 100), pct(p[1], 125), pct(p[2], 125)), a: alphaOf(alpha), fmt: 'LAB' };
    case 'lch': {
      if (!take4()) return null;
      const C = pct(p[1], 150), h = hue(p[2]) * Math.PI / 180;
      return { rgb: labToRgb(pct(p[0], 100), C * Math.cos(h), C * Math.sin(h)), a: alphaOf(alpha), fmt: 'LCH' };
    }
    case 'oklab': if (!take4()) return null; return { rgb: oklabToRgb(pct(p[0], 1), pct(p[1], .4), pct(p[2], .4)), a: alphaOf(alpha), fmt: 'OKLAB' };
    case 'oklch': {
      if (!take4()) return null;
      const C = pct(p[1], .4), h = hue(p[2]) * Math.PI / 180;
      return { rgb: oklabToRgb(pct(p[0], 1), C * Math.cos(h), C * Math.sin(h)), a: alphaOf(alpha), fmt: 'OKLCH' };
    }
    case 'cmyk': case 'device-cmyk': {
      if (n !== 4 && n !== 5) return null;
      const big = p.some(t => t.unit !== '%' && t.v > 1);
      const [c, m, y, k] = p.slice(0, 4).map(t => t.unit === '%' ? t.v / 100 : big ? t.v / 100 : t.v);
      return { rgb: [c, m, y].map(x => (1 - x) * (1 - k)), a: alphaOf(n === 5 ? p[4] : alpha), fmt: 'CMYK' };
    }
    default: return null;
  }
}

function parseEngine(t) {
  let m = t.match(/^(?:new\s+)?(color32|fcolor|color\.fromargb|color\.rgb|color8)\s*\(([^()]*)\)\s*;?$/i);
  if (m) {
    const v = m[2].split(',').map(s => tok(s.trim()));
    if (v.some(x => !x || x.unit) || v.length < 3 || v.length > 4) return null;
    const n = v.map(x => x.v);
    if (n.some(x => x < 0 || x > 255)) return null;
    const argb = /fromargb/i.test(m[1]) && n.length === 4;
    const [r, g, b, a = 255] = argb ? [n[1], n[2], n[3], n[0]] : n;
    return { rgb: [r, g, b].map(x => x / 255), a: a / 255, fmt: 'RGB' };
  }
  m = t.match(/^(?:new\s+)?(color|rgba|flinearcolor|vec[34]|float[34]|half[34]|fixed[34])\s*\(([^()]*)\)\s*;?$/i);
  if (m) {
    const v = m[2].split(',').map(s => tok(s.trim()));
    if (v.some(x => !x || x.unit) || v.length < 3 || v.length > 4) return null;
    const n = v.map(x => x.v);
    if (n.some(x => x < 0 || x > 1.0001)) return null;
    return { rgb: n.slice(0, 3), a: n.length === 4 ? n[3] : 1, fmt: 'FLOAT' };
  }
  m = t.match(/^\(\s*R\s*=\s*([\d.]+)\s*,\s*G\s*=\s*([\d.]+)\s*,\s*B\s*=\s*([\d.]+)\s*(?:,\s*A\s*=\s*([\d.]+)\s*)?\)$/i);
  if (m) {
    const n = m.slice(1, 4).map(Number), a = m[4] === undefined ? null : Number(m[4]);
    const unit = n.every(x => x <= 1) && (a === null || a <= 1) ? 1 : 255;
    if (n.some(x => x > unit)) return null;
    return { rgb: n.map(x => x / unit), a: a === null ? 1 : a / unit, fmt: unit === 1 ? 'FLOAT' : 'RGB' };
  }
  return null;
}

function parseBare(t) {
  let m = t.match(/^c\s*:?\s*(\d+(?:\.\d+)?)%?\s*,?\s*m\s*:?\s*(\d+(?:\.\d+)?)%?\s*,?\s*y\s*:?\s*(\d+(?:\.\d+)?)%?\s*,?\s*k\s*:?\s*(\d+(?:\.\d+)?)%?$/i);
  if (m) {
    const v = m.slice(1).map(Number);
    if (v.some(x => x > 100)) return null;
    const [c, mm, y, k] = v.map(x => x / 100);
    return { rgb: [c, mm, y].map(x => (1 - x) * (1 - k)), a: 1, fmt: 'CMYK' };
  }
  m = t.match(/^r\s*:?\s*(\d{1,3})\s*,?\s*g\s*:?\s*(\d{1,3})\s*,?\s*b\s*:?\s*(\d{1,3})$/i);
  if (m) { const v = m.slice(1).map(Number); return v.every(x => x <= 255) ? { rgb: v.map(x => x / 255), a: 1, fmt: 'RGB' } : null; }
  const wrapped = /^\(.*\)$/.test(t), inner = t.replace(/^\((.*)\)$/, '$1').trim();
  if (!inner.includes(',')) return null;
  const v = inner.split(/\s*,\s*/).map(tok);
  if (v.some(x => !x) || v.length < 3 || v.length > 4) return null;
  const units = v.map(x => x.unit);
  if (v.length === 3 && !units[0] && units[1] === '%' && units[2] === '%' && v[0].v <= 360) return parseFunc('hsl', inner);
  if (v.length === 4 && units.every(u => u === '%')) return parseFunc('cmyk', inner);
  if (units.some(u => u)) return null;
  const n = v.map(x => x.v);
  const floats = n.slice(0, 3).every(x => x <= 1) && (inner.match(/\d\.\d/g) || []).length >= 2;
  if (floats) return n.every(x => x <= 1) ? { rgb: n.slice(0, 3), a: n.length === 4 ? n[3] : 1, fmt: 'FLOAT' } : null;
  if (n.slice(0, 3).some(x => x > 255 || !Number.isInteger(x))) return null;
  if (!wrapped && Math.max(...n.slice(0, 3)) < 64) return null;
  const a = n.length === 4 ? (n[3] <= 1 ? n[3] : n[3] <= 255 && Number.isInteger(n[3]) ? n[3] / 255 : NaN) : 1;
  return Number.isFinite(a) ? { rgb: n.slice(0, 3).map(x => x / 255), a, fmt: 'RGB' } : null;
}

function parseColor(text) {
  const t = String(text).trim().replace(/;$/, '').trim();
  if (!t || t.length > 90 || t.includes('\n')) return null;
  let m = t.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i) || t.match(/^([0-9a-f]{6})$/i);
  if (m && (t[0] === '#' || (/[a-f]/i.test(m[1]) && /\d/.test(m[1])))) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map(c => c + c).join('');
    const n = [0, 2, 4, 6].map(i => parseInt(h.slice(i, i + 2) || 'ff', 16) / 255);
    return { rgb: n.slice(0, 3), a: n[3], fmt: 'HEX' };
  }
  m = t.match(/^0x([0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    const h = m[1].length === 8 ? m[1].slice(2) + m[1].slice(0, 2) : m[1] + 'ff';
    const n = [0, 2, 4, 6].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    return { rgb: n.slice(0, 3), a: n[3], fmt: 'HEX' };
  }
  m = t.match(/^([a-z-]+)\(\s*(.*?)\s*\)$/i);
  if (m) {
    const fn = m[1].toLowerCase();
    if (fn === 'color') {
      const [space, ...rest] = m[2].split(/\s+/);
      const a = args(rest.join(' '));
      if (!a || a.parts.length !== 3) return parseEngine(t);
      const v = a.parts.map(x => pct(x, 1));
      const s = space.toLowerCase();
      const rgb = s === 'srgb' ? v : s === 'srgb-linear' ? fromLinear(v) : s === 'display-p3' ? fromLinear(mul(XYZ_RGB, mul(P3_XYZ, v.map(lin)))) : null;
      return rgb ? { rgb, a: alphaOf(a.alpha), fmt: 'RGB' } : null;
    }
    return parseFunc(fn, m[2]) || parseEngine(t);
  }
  const named = NAMED.get(t.toLowerCase());
  if (named && /^[a-z]+$/i.test(t)) return { rgb: [0, 2, 4].map(i => parseInt(named.slice(i, i + 2), 16) / 255), a: 1, fmt: 'NAME' };
  return parseEngine(t) || parseBare(t);
}

const NAMES = [...CSS.filter(([n]) => !SAME.has(n)), ...EXTRA].map(([n, h]) => {
  const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return { n, lab: rgbToOklab(rgb) };
});
function nameOf(rgb) {
  const L = rgbToOklab(rgb);
  let best = null, bd = Infinity;
  for (const c of NAMES) {
    const d = (c.lab[0] - L[0]) ** 2 + (c.lab[1] - L[1]) ** 2 + (c.lab[2] - L[2]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return { name: best.n, exact: Math.sqrt(bd) < 0.004 };
}

const hex2 = v => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');
function describe(text) {
  const c = parseColor(text);
  if (!c || !ok(...c.rgb, c.a)) return null;
  const rgb = c.rgb.map(clamp01), a = clamp01(c.a);
  const nm = nameOf(rgb);
  return { hex: '#' + rgb.map(hex2).join('') + (a < 0.999 ? hex2(a) : ''), alpha: +a.toFixed(3), cname: nm.name, cexact: nm.exact, cfmt: c.fmt };
}

module.exports = { describe, parseColor };
