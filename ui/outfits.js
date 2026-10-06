(function () {
  const X0 = -0.3, Y1 = 0.7, PPU = 1000, DW = 600, DH = 850;

  const PIECES = {
    body: ['Part131'],
    rib: ['Part128'],
    placket: ['Part129'],
    collar: ['Part124'],
    bow: ['Part125'],
    collarBack: ['Part135'],
    skirt: ['Part132'],
    sleeveL: ['ArtMesh403_Skinning', 'ArtMesh404_Skinning', 'ArtMesh405_Skinning', 'ArtMesh406_Skinning'],
    sleeveR: ['ArtMesh399_Skinning', 'ArtMesh400_Skinning', 'ArtMesh401_Skinning', 'ArtMesh402_Skinning2', 'ArtMesh402_Skinning'],
    legs: ['Part134'],
    neck: ['Part126'],
  };
  const FRAMES = [{ Param28: 1, Param29: 0, Param33: 0 }, { Param28: 0, Param29: 1, Param33: 0 }, { Param28: 0, Param29: 0, Param33: 1 }];

  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  function affine(s, d) {
    const [x0, y0, x1, y1, x2, y2] = s, [u0, v0, u1, v1, u2, v2] = d;
    const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
    if (Math.abs(den) < 1e-9) return null;
    const row = (p0, p1, p2) => [
      (p0 * (y1 - y2) + p1 * (y2 - y0) + p2 * (y0 - y1)) / den,
      (p0 * (x2 - x1) + p1 * (x0 - x2) + p2 * (x1 - x0)) / den,
      (p0 * (x1 * y2 - x2 * y1) + p1 * (x2 * y0 - x0 * y2) + p2 * (x0 * y1 - x1 * y0)) / den,
    ];
    const [a, c, e] = row(u0, u1, u2), [b, dd, f] = row(v0, v1, v2);
    return [a, b, c, dd, e, f];
  }

  function triPath(ctx, t, grow) {
    const cx = (t[0] + t[2] + t[4]) / 3, cy = (t[1] + t[3] + t[5]) / 3;
    for (let i = 0; i < 6; i += 2) {
      const dx = t[i] - cx, dy = t[i + 1] - cy, l = Math.hypot(dx, dy) || 1;
      ctx[i ? 'lineTo' : 'moveTo'](t[i] + dx / l * grow, t[i + 1] + dy / l * grow);
    }
    ctx.closePath();
  }

  function mapTri(ctx, src, sTri, dTri, op = 'source-over', grow = 0.9) {
    const m = affine(sTri, dTri);
    if (!m) return;
    ctx.save();
    ctx.beginPath();
    triPath(ctx, dTri, grow);
    ctx.clip();
    ctx.globalCompositeOperation = op;
    ctx.setTransform(...m);
    ctx.drawImage(src, 0, 0);
    ctx.restore();
  }

  const svgImage = markup => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img); img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  });
  const KH = 1600;
  const doc = (inner, defs = '', h = DH) => `<svg xmlns="http://www.w3.org/2000/svg" width="${DW}" height="${h}" viewBox="0 0 ${DW} ${h}"><defs>${defs}</defs>${inner}</svg>`;
  const wobble = seed => `<filter id="w" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>`;

  async function render(markup, h = DH) {
    const c = canvas(DW, h);
    if (markup) c.getContext('2d').drawImage(await svgImage(markup), 0, 0);
    return c;
  }

  const loadImage = url => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

  async function prepare(model, renderer) {
    const core = model.internalModel.coreModel, raw = core.getModel();
    const pIds = Array.from(raw.parts.ids), pPar = raw.parts.parentIndices, dPar = raw.drawables.parentPartIndices;
    const texIdx = raw.drawables.textureIndices;
    const pieceOf = d => {
      for (let q = dPar[d]; q >= 0; q = pPar[q]) for (const k in PIECES) if (PIECES[k].includes(pIds[q])) return k;
      return null;
    };
    const members = {};
    for (let d = 0; d < dPar.length; d++) { const k = pieceOf(d); if (k) (members[k] = members[k] || []).push(d); }

    const orig = {}, work = {}, bases = {};
    for (const list of Object.values(members)) for (const d of list) {
      const t = texIdx[d];
      if (work[t]) continue;
      const settings = model.internalModel.settings;
      const src = await loadImage(settings.resolveURL(settings.textures[t]));
      orig[t] = canvas(src.width, src.height); orig[t].getContext('2d').drawImage(src, 0, 0);
      work[t] = canvas(src.width, src.height); work[t].getContext('2d').drawImage(src, 0, 0);
      bases[t] = new PIXI.BaseTexture(work[t]);
      model.textures[t] = new PIXI.Texture(bases[t]);
    }
    const upload = () => {
      const gl = renderer.gl;
      for (const t in bases) {
        bases[t].update();
        if (!bases[t]._glTextures[renderer.CONTEXT_UID]) continue;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        renderer.texture.bind(bases[t], 0);
      }
    };

    const nP = core.getParameterCount();
    const setP = o => { for (const k in o) { const i = core.getParameterIndex(k); if (i >= 0) core.setParameterValueByIndex(i, o[k]); } };

    const coverage = {};
    function cover(d, tris) {
      if (coverage[d] !== undefined) return coverage[d];
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, area = 0;
      for (const { tex: t } of tris) {
        for (let i = 0; i < 6; i += 2) { x0 = Math.min(x0, t[i]); x1 = Math.max(x1, t[i]); y0 = Math.min(y0, t[i + 1]); y1 = Math.max(y1, t[i + 1]); }
        area += Math.abs((t[2] - t[0]) * (t[5] - t[1]) - (t[4] - t[0]) * (t[3] - t[1])) / 2;
      }
      const w = Math.max(1, Math.ceil(x1 - x0)), h = Math.max(1, Math.ceil(y1 - y0));
      const c = canvas(w, h), ctx = c.getContext('2d');
      ctx.translate(-x0, -y0);
      ctx.beginPath();
      for (const { tex } of tris) triPath(ctx, tex, 0);
      ctx.clip();
      ctx.drawImage(orig[texIdx[d]], 0, 0);
      const px = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      for (let i = 3; i < px.length; i += 4) sum += px[i];
      return (coverage[d] = sum / 255 / Math.max(1, area));
    }

    function geometry(d) {
      const W = work[texIdx[d]].width, H = work[texIdx[d]].height;
      const pos = raw.drawables.vertexPositions[d], uv = raw.drawables.vertexUvs[d], ind = raw.drawables.indices[d];
      const tris = [];
      let cx = 0, cy = 0;
      for (let i = 0; i < ind.length; i += 3) {
        const des = [], tex = [];
        for (let j = 0; j < 3; j++) {
          const v = ind[i + j];
          des.push((pos[v * 2] - X0) * PPU, (Y1 - pos[v * 2 + 1]) * PPU);
          tex.push(uv[v * 2] * W, (1 - uv[v * 2 + 1]) * H);
          cx += des[j * 2]; cy += des[j * 2 + 1];
        }
        tris.push({ des, tex });
      }
      const n = Math.max(1, tris.length * 3);
      return { tris, cx: cx / n, cy: cy / n };
    }

    function snapshot(style) {
      const saved = Array.from({ length: nP }, (_, i) => core.getParameterValueByIndex(i));
      const shots = FRAMES.map(fr => {
        for (let i = 0; i < nP; i++) core.setParameterValueByIndex(i, core.getParameterDefaultValue(i));
        setP({ Param156: 1 }); setP(style); setP(fr); core.update();
        const g = {};
        for (const list of Object.values(members)) for (const d of list) g[d] = geometry(d);
        return g;
      });
      saved.forEach((v, i) => core.setParameterValueByIndex(i, v));
      core.update();
      const geo = {}, pieces = {};
      for (const [k, list] of Object.entries(members)) {
        const fill = list.filter(d => cover(d, shots[0][d].tris) > 0.55);
        const lines = list.filter(d => !fill.includes(d));
        let fx = 0, fy = 0;
        for (const d of fill) { fx += shots[0][d].cx; fy += shots[0][d].cy; geo[d] = shots[0][d].tris; }
        fx /= Math.max(1, fill.length); fy /= Math.max(1, fill.length);
        for (const d of lines) {
          const best = shots.reduce((a, s) => Math.hypot(s[d].cx - fx, s[d].cy - fy) < Math.hypot(a[d].cx - fx, a[d].cy - fy) ? s : a);
          geo[d] = best[d].tris;
        }
        const parents = [...new Set(lines.map(d => dPar[d]))];
        pieces[k] = { all: list, fill, lines, seed: d => parents.length > 1 ? parents.indexOf(dPar[d]) : lines.indexOf(d) };
      }
      return { geo, pieces };
    }

    function restore(d, geo) {
      const t = texIdx[d], ctx = work[t].getContext('2d');
      ctx.save();
      ctx.beginPath();
      for (const tri of geo[d]) { triPath(ctx, tri.tex, 1.2); }
      ctx.clip();
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(orig[t], 0, 0);
      ctx.restore();
    }

    function silhouette(ids, geo) {
      const m = canvas(DW, DH), ctx = m.getContext('2d');
      for (const d of ids) for (const tri of geo[d]) mapTri(ctx, orig[texIdx[d]], tri.tex, tri.des);
      return m;
    }

    let busy = Promise.resolve();
    function clearTris(ctx, tris) {
      ctx.save();
      ctx.beginPath();
      for (const tri of tris) triPath(ctx, tri.tex, 2.6);
      ctx.clip();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
    function keepOriginal(d, tris, keepImg) {
      const t = texIdx[d], ctx = work[t].getContext('2d');
      ctx.save();
      ctx.beginPath();
      for (const tri of tris) triPath(ctx, tri.tex, 2.2);
      ctx.clip();
      ctx.drawImage(orig[t], 0, 0);
      ctx.restore();
      for (const tri of tris) mapTri(ctx, keepImg, tri.des, tri.tex, 'destination-in', 2.6);
    }

    async function apply(design, style = {}) {
      const { geo, pieces } = snapshot(style);
      for (const p of Object.values(pieces)) for (const d of p.all) restore(d, geo);
      if (design) {
        const defs = design.defs || '';
        const cache = new Map();
        const img = async (key, markup, h) => {
          if (!markup) return null;
          if (!cache.has(key)) cache.set(key, await render(markup, h));
          return cache.get(key);
        };
        const jobs = [];
        for (const [k, p] of Object.entries(pieces)) {
          if ((k === 'legs' || k === 'neck') && !design.pieces[k]) continue;
          const spec = k in design.pieces ? design.pieces[k] : k === 'body' ? design.pieces.torso : null;
          const key = spec && spec === design.pieces.torso ? 'torso' : k;
          jobs.push({ p, spec, key, fill: spec && await img(key + ':fill', spec.fill && doc(spec.fill, defs)), keep: spec && await img(key + ':keep', spec.keep && doc(spec.keep, defs, KH), KH) });
        }
        for (const j of jobs) for (const d of j.p.all) clearTris(work[texIdx[d]].getContext('2d'), geo[d]);
        const touches = (d, keep) => {
          const x = keep.getContext('2d'), data = x.getImageData(0, 0, keep.width, keep.height).data;
          return geo[d].some(t => [0, 2, 4].some(i => { const px = Math.round(t.des[i]), py = Math.round(t.des[i + 1]); return px >= 0 && py >= 0 && px < keep.width && py < keep.height && data[(py * keep.width + px) * 4 + 3] > 0; }));
        };
        for (const j of jobs) if (j.keep) for (const d of j.p.all) if (touches(d, j.keep)) keepOriginal(d, geo[d], j.keep);
        for (const j of jobs) {
          if (!j.spec) continue;
          for (const d of j.p.all) {
            const isFill = j.p.fill.includes(d), seed = isFill ? -1 : j.p.seed(d) % 3;
            const art = isFill ? j.fill
              : await img(j.key + ':lines' + seed, j.spec.lines && doc(`<g filter="url(#w)">${j.spec.lines}</g>`, defs + wobble(seed * 7 + 3)));
            if (art) for (const tri of geo[d]) mapTri(work[texIdx[d]].getContext('2d'), art, tri.des, tri.tex, 'source-over', 2.2);
          }
        }
      }
      upload();
    }

    return {
      apply: (design, style) => (busy = busy.then(() => apply(design, style)).catch(e => console.error('[outfit]', e))),
      async reference(style = {}) {
        const { geo, pieces } = snapshot(style);
        const out = canvas(DW, DH), ctx = out.getContext('2d');
        const tint = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f1c', '#2ec4b6', '#e71d36'];
        let i = 0;
        for (const [k, p] of Object.entries(pieces)) {
          const s = silhouette(p.fill, geo), sx = s.getContext('2d');
          sx.globalCompositeOperation = 'source-in'; sx.fillStyle = tint[i++ % tint.length]; sx.fillRect(0, 0, DW, DH);
          ctx.globalAlpha = .55; ctx.drawImage(s, 0, 0); ctx.globalAlpha = 1;
          ctx.drawImage(silhouette(p.lines.filter(d => p.seed(d) === 0), geo), 0, 0);
        }
        return { url: out.toDataURL(), pieces: Object.fromEntries(Object.entries(pieces).map(([k, p]) => [k, { fill: p.fill.length, lines: p.lines.length, seeds: p.lines.map(p.seed), cov: p.all.map(d => +coverage[d].toFixed(2)) }])) };
      },
    };
  }

  window.Outfits = { prepare, DW, DH };
})();
