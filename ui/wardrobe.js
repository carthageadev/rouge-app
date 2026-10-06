(function () {
  const INK = '#161316', W = 3.4, D = 2.2, AX = 605, C = 303;
  const ln = (d, w = W, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sh = (d, c) => `<path d="${d}" fill="${c}"/>`;
  const MIRROR = s => `<g transform="matrix(-1 0 0 1 ${AX} 0)">${s}</g>`;
  let uid = 0;

  function piece() {
    const items = [];
    const api = {
      shape(d, color, w = W, mirror = false) { items.push({ fill: sh(d, color), occl: d, lines: w ? [ln(d, w)] : [], mirror }); return api; },
      both(d, color, w = W) { return api.shape(d, color, w).shape(d, color, w, true); },
      fill(s, mirror = false) { items.push({ fill: s, lines: [], mirror }); return api; },
      line(d, w = D, c = INK) { items[items.length - 1].lines.push(ln(d, w, c)); return api; },
      lines(s) { items[items.length - 1].lines.push(s); return api; },
      out(extra = {}) {
        const defs = [], fill = [], lines = [];
        const wrap = (s, m) => m ? MIRROR(s) : s;
        items.forEach((it, i) => {
          fill.push(wrap(it.fill, it.mirror));
          if (!it.lines.length) return;
          const later = items.slice(i + 1).filter(o => o.occl);
          let body = wrap(it.lines.join(''), it.mirror);
          if (later.length) {
            const id = 'm' + (++uid);
            defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="720" height="970"><rect x="-60" y="-60" width="720" height="970" fill="#fff"/>${later.map(o => wrap(`<path d="${o.occl}" fill="#000"/>`, o.mirror)).join('')}</mask>`);
            body = `<g mask="url(#${id})">${body}</g>`;
          }
          lines.push(body);
        });
        return { fill: fill.join(''), lines: lines.join(''), defs: defs.join(''), ...extra };
      },
    };
    return api;
  }
  const mirrored = L => ({ fill: MIRROR(L.fill), lines: MIRROR(L.lines), defs: L.defs, keep: L.keep });

  const ARM_OUT = 'M206 226 C 186 236 178 270 176 312 C 172 400 154 520 140 600 C 132 650 120 684 112 704';
  const ARM_IN = 'M240 272 C 232 330 222 400 212 460 C 198 540 182 620 160 704';
  const ARM = ARM_OUT + ' L 160 704 C 182 620 198 540 212 460 C 222 400 232 330 240 272 L 262 250 L 250 216 Z';
  const HAND = 'M112 702 C 103 728 101 768 108 788 Q 122 806 140 794 C 153 776 160 736 160 702 Z';
  const HAND_LN = 'M112 704 C 103 728 101 768 108 788 Q 122 806 140 794 C 153 776 160 736 160 704 M154 716 Q 163 736 152 758';
  const SKIN_TOP = 'M281 168 L 324 168 L 326 184 L 329 194 C 339 206 361 214 399 226 C 379 250 369 262 369 274 L 366 384 L 239 384 L 236 274 C 236 262 226 250 206 226 C 244 214 266 206 276 194 L 279 184 Z';
  const SHOULDER = 'M280.8 170 L 279.5 184 C 279 188 278.5 190 278 192 C 268 206 246 214 206 226';
  const CLAV = 'M254 232 C 267 238 283 238 294 234';
  const NECK_FILL = 'M282.5 157 L 322.5 157 L 325.5 184 L 279.5 184 Z';
  const NECK_LN = 'M282.5 157 L 279.5 184';
  const NECK_FRONT = 'M281 168 L 324 168 L 325.5 184 C 327 198 330 206 333 216 L 272 216 C 275 206 278 198 279.5 184 Z';
  const NECK_FRONT_LN = 'M280.8 170 L 279.5 184 C 278 198 275 208 272 216 M324.2 170 L 325.5 184 C 327 198 330 208 333 216';
  const THIGHS = 'M236 640 L 168.5 782 L 292 782 C 294 760 299 740 303 712 L 303 640 Z M369 640 L 441 782 L 311 782 C 309 760 306 740 303 712 L 303 640 Z';
  const THIGH_LN = 'M236 640 L 168.5 782 M303 712 C 299 740 294 760 292 782 M369 640 L 441 782 M303 712 C 306 740 309 760 311 782';
  const HANDS_KEEP = '<rect x="0" y="708" width="600" height="900" fill="#000"/>';

  const skin = (p, tone, clav = false) => {
    p.shape(SKIN_TOP, tone, 0).lines(ln(SHOULDER) + MIRROR(ln(SHOULDER)));
    if (clav) p.lines(ln(CLAV, 1.8) + MIRROR(ln(CLAV, 1.8)));
    return p;
  };
  const bareArm = (p, tone) => p.shape(ARM, tone, 0).lines(ln(ARM_OUT) + ln(ARM_IN)).shape(HAND, tone, 0).lines(ln(HAND_LN));
  const FITTED = (hem, sag = 12) => `M206 224 C 226 250 236 262 236 274 C 242 360 244 430 242 480 C 240 540 236 600 232 ${hem} Q 303 ${hem + sag} 373 ${hem} C 369 600 365 540 363 480 C 361 430 363 360 369 274 C 369 262 379 250 399 224 C 365 212 342 202 337 192 Q 303 222 268 192 C 263 202 240 212 206 224 Z`;

  const hemY = (x, y1, w1, sag) => { const u = (x - (C - w1)) / (2 * w1); return y1 + 4 * sag * u * (1 - u); };
  const skirt = (y0, y1, w0, w1, sag = 8) => `M${C - w0} ${y0} L ${C + w0} ${y0} L ${C + w1} ${y1} Q ${C} ${y1 + sag * 2} ${C - w1} ${y1} Z`;
  const ruffled = (y0, y1, w0, w1, sag = 8, r = 7) => {
    let d = `M${C - w0} ${y0} L ${C + w0} ${y0} L ${C + w1} ${y1}`;
    for (let x = C + w1; x > C - w1 + r; x -= r * 2) d += ` L ${x.toFixed(1)} ${hemY(x, y1, w1, sag).toFixed(1)} a${r} ${r} 0 0 1 ${-r * 2} 0`;
    return d + ' Z';
  };
  const ruffleLine = (y1, w1, sag = 8, r = 7) => {
    let d = '';
    for (let x = C + w1; x > C - w1 + r; x -= r * 2) d += `M${x.toFixed(1)} ${hemY(x, y1, w1, sag).toFixed(1)} a${r} ${r} 0 0 1 ${-r * 2} 0`;
    return d;
  };
  const pleats = (y0, y1, w0, w1, n, sag = 8) => {
    let d = '';
    for (let i = 1; i < n; i++) {
      const t = i / n, xa = C - w0 + 2 * w0 * t, xb = C - w1 + 2 * w1 * t;
      d += `M${xa.toFixed(1)} ${y0 + 6} L ${xb.toFixed(1)} ${hemY(xb, y1, w1, sag).toFixed(1)}`;
    }
    return d;
  };
  const folds = (y0, y1, w0, w1, n, sag = 8) => {
    let d = '';
    for (let i = 1; i < n; i++) {
      const t = i / n, xa = C - w0 + 2 * w0 * t, xb = C - w1 + 2 * w1 * t, k = .4 + (i % 2) * .3;
      const yb = hemY(xb, y1, w1, sag) - 2;
      const x0 = xa + (xb - xa) * (1 - k), y0b = y0 + (yb - y0) * (1 - k);
      d += `M${x0.toFixed(1)} ${y0b.toFixed(1)} Q ${((x0 + xb) / 2 + 3).toFixed(1)} ${((y0b + yb) / 2).toFixed(1)} ${xb.toFixed(1)} ${yb.toFixed(1)}`;
    }
    return d;
  };
  const scallops = (x0, x1, y, r, down = true) => {
    let d = `M${x0} ${y}`;
    for (let x = x0; x < x1 - r; x += r * 2) d += ` a${r} ${r} 0 0 ${down ? 0 : 1} ${r * 2} 0`;
    return d;
  };
  const ribs = (x0, x1, y0, y1, gap = 7) => { let d = ''; for (let x = x0; x <= x1; x += gap) d += `M${x} ${y0}L${x} ${y1}`; return d; };
  const bow = (x, y, s) => `M${x} ${y} C ${x - 10 * s} ${y - 13 * s} ${x - 28 * s} ${y - 11 * s} ${x - 26 * s} ${y + 2 * s} C ${x - 24 * s} ${y + 13 * s} ${x - 10 * s} ${y + 9 * s} ${x} ${y} Z M${x} ${y} C ${x + 10 * s} ${y - 13 * s} ${x + 28 * s} ${y - 11 * s} ${x + 26 * s} ${y + 2 * s} C ${x + 24 * s} ${y + 13 * s} ${x + 10 * s} ${y + 9 * s} ${x} ${y} Z`;
  const tails = (x, y, s) => `M${x - 3 * s} ${y + 2 * s} L ${x - 14 * s} ${y + 30 * s} L ${x - 6 * s} ${y + 26 * s} L ${x - 1 * s} ${y + 33 * s} L ${x + 1 * s} ${y + 3 * s} Z M${x + 3 * s} ${y + 2 * s} L ${x + 14 * s} ${y + 30 * s} L ${x + 6 * s} ${y + 26 * s} L ${x + 1 * s} ${y + 33 * s} L ${x - 1 * s} ${y + 3 * s} Z`;
  const knot = (x, y, s) => `M${x - 5 * s} ${y - 5 * s} L ${x + 5 * s} ${y - 5 * s} L ${x + 4 * s} ${y + 5 * s} L ${x - 4 * s} ${y + 5 * s} Z`;
  const circle = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  const pattern = (id, w, h, body) => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`;
  const flower = (x, y, r, c, mid) => `<g fill="${c}">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="${y - r}" rx="${r * .7}" ry="${r}" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="${r * .45}" fill="${mid}"/>`;

  const pleatsFrom = (y0, y1, w0, w1, n, sag, ys) => {
    let d = '';
    for (let i = 1; i < n; i++) {
      const t = i / n, xa = C - w0 + 2 * w0 * t, xb = C - w1 + 2 * w1 * t, k = (ys - y0) / (y1 - y0);
      d += `M${(xa + (xb - xa) * k).toFixed(1)} ${ys} L ${xb.toFixed(1)} ${hemY(xb, y1, w1, sag).toFixed(1)}`;
    }
    return d;
  };
  const tier = (y0, y1, w0, w1, sag = 8) => `M${C - w0} ${y0} L ${C + w0} ${y0} L ${C + w1} ${y1} Q ${C} ${y1 + sag * 2} ${C - w1} ${y1} Z`;

  const sailor = {
    label: 'Sailor',
    colors: [
      { name: 'Navy', c: { top: '#fbfbfd', col: '#283162', stripe: '#fbfbfd', tie: '#e2475f', skirt: '#283162' } },
      { name: 'Black', c: { top: '#fbfbfd', col: '#1e1d24', stripe: '#fbfbfd', tie: '#c8203a', skirt: '#1e1d24' } },
      { name: 'Sky', c: { top: '#fbfbfd', col: '#7ea7db', stripe: '#fbfbfd', tie: '#f2c14e', skirt: '#6a92c8' } },
      { name: 'Sakura', c: { top: '#fff7f9', col: '#e88aa7', stripe: '#fff7f9', tie: '#c23a5d', skirt: '#e88aa7' } },
    ],
    draw(c, tone) {
      const collar = 'M268 188 C 248 204 222 214 198 228 L 303 362 L 407 228 C 383 214 357 204 337 188 L 322 198 L 303 308 L 283 198 Z';
      const p = skin(piece(), tone)
        .shape(FITTED(646), c.top).line('M242 480 C 240 540 236 600 233 640 M363 480 C 365 540 369 600 372 640', 1.6)
        .shape(collar, c.col)
        .fill(ln('M213 238 L 303 350 L 392 238', 3, c.stripe))
        .shape(tails(303, 358, 1.9), c.tie).shape(knot(303, 358, 2.2), c.tie);
      const k = piece().shape(tier(630, 772, 64, 138), c.skirt).line(pleatsFrom(630, 772, 64, 138, 9, 8, 652), D);
      const s = bareArm(piece(), tone)
        .shape('M206 222 C 186 230 170 256 168 292 C 168 310 176 324 190 326 L 252 318 C 256 294 254 258 244 236 Z', c.top)
        .fill(sh('M170 300 C 172 316 178 324 190 326 L 252 318 C 253 310 253 304 252 298 L 188 306 Z', c.col))
        .fill(ln('M173 310 L 189 315 L 252 307', 2.4, c.stripe))
        .lines(ln('M170 300 L 188 306 L 252 298', D))
        .out();
      return { pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const hoodie = {
    label: 'Hoodie',
    colors: [
      { name: 'Lilac', c: { main: '#cfbcf5', rib: '#b9a3ec', hood: '#bda7ef', string: '#fbfbfd' } },
      { name: 'Heather', c: { main: '#c9cbd3', rib: '#b2b5be', hood: '#bcbfc8', string: '#ff6b8a' } },
      { name: 'Mint', c: { main: '#bdeedc', rib: '#a0dfc8', hood: '#ade6d1', string: '#fbfbfd' } },
      { name: 'Midnight', c: { main: '#30313d', rib: '#26272f', hood: '#2a2b36', string: '#ff7a9a' } },
    ],
    draw(c, tone) {
      const body = 'M200 228 C 184 242 180 272 180 302 L 172 600 C 172 640 176 670 180 698 Q 303 712 426 698 C 430 670 434 640 434 600 L 426 302 C 426 272 422 242 406 228 C 376 214 342 210 303 210 C 264 210 230 214 200 228 Z';
      const hood = 'M212 238 C 210 200 244 168 303 166 C 362 168 396 200 394 238 C 370 224 342 216 303 216 C 264 216 236 224 212 238 Z';
      const p = skin(piece(), tone)
        .shape(hood, c.hood).line('M232 226 C 240 204 256 192 276 186 M374 226 C 366 204 350 192 330 186', D)
        .shape(NECK_FRONT, tone, 0).lines(ln(NECK_FRONT_LN))
        .shape(body, c.main).line('M200 228 C 216 252 222 272 224 302 M406 228 C 390 252 384 272 382 302', D)
        .shape('M230 562 Q 303 550 376 562 L 390 664 Q 303 676 216 664 Z', c.rib).line('M246 572 C 256 598 250 630 234 656 M360 572 C 350 598 356 630 372 656', D)
        .fill(ln('M286 216 C 284 252 282 292 280 320', 3, c.string) + ln('M320 216 C 322 252 324 292 326 320', 3, c.string))
        .lines(ln('M286 216 C 284 252 282 292 280 320 M320 216 C 322 252 324 292 326 320', 1.4))
        .shape('M276 318 h8 v14 h-8 Z', c.string, 1.6).shape('M322 318 h8 v14 h-8 Z', c.string, 1.6);
      const k = piece().shape('M178 684 Q 303 698 428 684 L 430 738 Q 303 752 176 738 Z', c.rib).line(ribs(188, 420, 706, 742, 8), 1.5);
      const s = piece().shape(HAND, tone, 0).lines(ln(HAND_LN))
        .shape('M200 228 C 178 238 164 274 158 324 L 132 640 C 126 680 116 714 108 738 L 182 744 C 184 702 190 650 198 600 L 218 460 L 242 300 L 262 240 Z', c.main)
        .shape('M118 698 L 188 702 L 182 744 L 108 738 Z', c.rib).line(ribs(118, 182, 706, 740, 7), 1.5)
        .out();
      return { pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const maid = {
    label: 'Maid',
    colors: [
      { name: 'Classic', c: { dress: '#211f27', white: '#fbfbfd', bow: '#d6304a' } },
      { name: 'Navy', c: { dress: '#252d4c', white: '#fbfbfd', bow: '#f2c14e' } },
      { name: 'Akiba', c: { dress: '#f29bb9', white: '#fbfbfd', bow: '#d6304a' } },
      { name: 'Wine', c: { dress: '#5b2030', white: '#fbf5ea', bow: '#f2c14e' } },
    ],
    draw(c, tone) {
      const bodice = 'M206 224 C 226 250 236 262 236 274 C 242 360 246 420 246 470 L 359 470 C 359 420 363 360 369 274 C 369 262 379 250 399 224 C 365 212 342 202 337 192 L 268 192 C 263 202 240 212 206 224 Z';
      const lobe = 'M268 188 C 256 200 242 212 240 228 C 242 244 270 248 300 238 L 303 198 C 290 198 276 194 268 188 Z';
      const p = skin(piece(), tone)
        .shape(tier(466, 688, 58, 126, 8), c.dress).line(folds(466, 688, 58, 126, 7, 8), D)
        .shape(bodice, c.dress)
        .shape('M262 330 Q 303 322 344 330 L 340 470 L 266 470 Z', c.white).line(scallops(262, 344, 330, 5, false), 1.6)
        .fill(ln('M266 332 L 242 238 M340 332 L 364 238', 9, c.white)).lines(ln('M261 332 L 237 238 M271 332 L 247 240 M345 332 L 369 238 M335 332 L 359 240', 1.6))
        .shape('M238 462 L 368 462 L 368 480 L 238 480 Z', c.white)
        .shape(ruffled(478, 664, 63, 80, 6, 6), c.white)
        .shape(lobe, c.white).shape(lobe, c.white, W, true)
        .shape(bow(303, 248, .8), c.bow).shape(circle(303, 248, 5), c.bow);
      const k = piece()
        .shape(ruffled(686, 768, 124, 148, 10, 6), c.white)
        .shape(tier(674, 754, 120, 146, 10), c.dress).line(folds(686, 754, 126, 146, 9, 10), D);
      const s = bareArm(piece(), tone)
        .shape('M206 220 C 184 228 168 254 168 288 C 170 306 180 314 192 314 C 206 318 236 314 252 308 C 256 284 254 252 244 232 Z', c.dress)
        .shape('M174 298 C 188 306 230 304 252 296 L 252 312 C 232 320 188 322 172 314 Z', c.white)
        .shape('M110 668 L 162 672 L 162 690 Q 136 698 108 690 Z', c.white).line(scallops(108, 162, 692, 4), 1.6)
        .out();
      return { pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const yukata = {
    label: 'Yukata',
    colors: [
      { name: 'Indigo', c: { base: '#2f3e7a', fl: '#f6a9c3', fl2: '#fbe2ea', obi: '#e2475f', cord: '#f2c14e', eri: '#f4efe6', frill: '#fbfbfd' } },
      { name: 'Crimson', c: { base: '#b8263a', fl: '#f2c14e', fl2: '#fbe7b0', obi: '#2b2433', cord: '#f2c14e', eri: '#f4efe6', frill: '#2b2433' } },
      { name: 'Snow', c: { base: '#f3f5fb', fl: '#5b86d6', fl2: '#a9c4f0', obi: '#3b5fa8', cord: '#e2475f', eri: '#fbfbfd', frill: '#3b5fa8' } },
      { name: 'Night', c: { base: '#1d1c24', fl: '#e2475f', fl2: '#f4efe6', obi: '#c8203a', cord: '#f4efe6', eri: '#f4efe6', frill: '#c8203a' } },
    ],
    draw(c, tone) {
      const id = 'yk' + (++uid);
      const defs = pattern(id, 120, 110, `<rect width="120" height="110" fill="${c.base}"/>${flower(28, 26, 7, c.fl, c.cord)}${flower(88, 72, 6, c.fl2, c.cord)}${flower(18, 94, 4, c.fl, c.cord)}<path d="M58 22q10 -6 20 0q10 6 20 0" stroke="${c.fl2}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`);
      const F = `url(#${id})`;
      const body = 'M200 228 C 230 216 262 206 268 194 L 303 286 L 337 194 C 343 206 375 216 405 228 L 409 300 L 414 688 Q 303 704 191 688 L 196 300 Z';
      const p = skin(piece(), tone)
        .shape(body, F).line('M330 520 L 338 694', D)
        .shape('M337 194 L 303 318 L 318 318 L 345 200 Z', c.eri)
        .shape('M268 192 C 282 262 306 338 340 440 L 360 440 C 326 338 300 262 284 194 Z', c.eri)
        .shape('M284 194 C 300 262 326 338 360 440 L 376 440 C 342 338 316 262 300 196 Z', c.base)
        .shape('M194 432 Q 303 422 412 432 L 412 520 Q 303 530 194 520 Z', c.obi)
        .fill(sh('M196 432 Q 303 422 410 432 L 410 442 Q 303 434 196 442 Z', c.eri))
        .fill(ln('M196 478 Q 303 470 410 478', 3.4, c.cord)).lines(ln('M196 478 Q 303 470 410 478', 1.2))
        .shape(circle(303, 476, 7), c.cord, 2);
      const k = piece().shape(ruffled(672, 744, 108, 126, 6, 7), c.frill).line(ruffleLine(726, 124, 6, 7), 1.4);
      const s = piece()
        .shape('M136 640 C 128 664 126 704 132 726 Q 148 744 166 730 C 176 708 180 670 178 640 Z', tone, 0)
        .lines(ln('M136 642 C 128 664 126 704 132 726 Q 148 744 166 730 C 176 708 180 670 178 642 M172 652 Q 181 674 170 694'))
        .shape('M200 222 L 118 244 C 100 250 94 268 94 292 L 94 600 C 94 628 108 646 134 648 L 216 648 L 228 300 L 262 248 L 250 218 Z', F)
        .line('M114 646 C 146 636 180 636 214 646', D)
        .out();
      return { defs, pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const overalls = {
    label: 'Overalls',
    colors: [
      { name: 'Denim', c: { denim: '#5f86c9', stitch: '#f2c14e', tee: '#fbfbfd', stripe: null } },
      { name: 'Berry', c: { denim: '#ef8fae', stitch: '#fbfbfd', tee: '#fbfbfd', stripe: '#e2475f' } },
      { name: 'Mustard', c: { denim: '#e6b549', stitch: '#7a5a1c', tee: '#2a2a33', stripe: null } },
      { name: 'Olive', c: { denim: '#7d8a52', stitch: '#f4ead6', tee: '#f4ead6', stripe: '#c9673f' } },
    ],
    draw(c, tone) {
      const id = 'st' + (++uid);
      const defs = pattern(id, 600, 26, `<rect width="600" height="26" fill="${c.tee}"/>${c.stripe ? `<rect y="15" width="600" height="8" fill="${c.stripe}"/>` : ''}`);
      const T = `url(#${id})`;
      const tee = 'M206 224 C 226 250 236 262 236 274 C 242 360 244 430 242 488 L 363 488 C 361 430 363 360 369 274 C 369 262 379 250 399 224 C 365 212 345 202 339 194 Q 303 214 266 194 C 260 202 240 212 206 224 Z';
      const shorts = 'M244 470 L 361 470 L 380 600 L 434 692 Q 374 704 312 692 L 303 662 L 294 692 Q 232 704 172 692 L 226 600 Z';
      const p = skin(piece(), tone)
        .shape(tee, T).line('M270 199 Q 303 220 335 199', D)
        .shape(shorts, c.denim)
        .fill(ln('M178 680 Q 234 690 290 680 M316 680 Q 372 690 428 680', 2, c.stitch)).lines(ln('M176 676 Q 234 688 292 676 M314 676 Q 372 688 430 676', D))
        .shape('M254 330 L 352 330 L 356 474 L 250 474 Z', c.denim)
        .fill(`<path d="M260 338 L 346 338 L 349 466 L 257 466 Z" fill="none" stroke="${c.stitch}" stroke-width="1.6" stroke-dasharray="4 3"/>`)
        .shape('M280 362 L 326 362 L 324 404 Q 303 412 282 404 Z', c.denim).line('M282 372 L 324 372', 1.6)
        .both('M254 334 L 236 226 L 252 222 L 270 334 Z', c.denim)
        .shape(circle(262, 340, 6), c.stitch, 2).shape(circle(344, 340, 6), c.stitch, 2);
      const s = bareArm(piece(), tone)
        .shape('M206 220 C 188 228 174 252 170 292 L 250 302 C 252 272 250 246 242 230 Z', T).line('M172 288 L 250 298', D)
        .out();
      return { defs, pieces: { torso: p.out(), skirt: null, sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const sundress = {
    label: 'Sundress',
    colors: [
      { name: 'Daisy', c: { base: '#fbfbfd', a: '#f2c14e', b: '#e6e6ee', sash: '#f2c14e', kind: 'flower' } },
      { name: 'Picnic', c: { base: '#cfe3f7', a: '#fbfbfd', b: '#8cb9ea', sash: '#fbfbfd', kind: 'gingham' } },
      { name: 'Lemon', c: { base: '#ffe48f', a: '#fbfbfd', b: '#fbfbfd', sash: '#fbfbfd', kind: 'dots' } },
      { name: 'Lilac', c: { base: '#d8c9f6', a: '#fbfbfd', b: '#b9a3ec', sash: '#8d6fd6', kind: 'flower' } },
    ],
    draw(c, tone) {
      const id = 'sd' + (++uid);
      const t = c.kind === 'gingham'
        ? `<rect width="40" height="40" fill="${c.base}"/><rect width="20" height="40" fill="${c.b}" opacity=".55"/><rect width="40" height="20" fill="${c.b}" opacity=".55"/>`
        : c.kind === 'dots' ? `<rect width="40" height="40" fill="${c.base}"/><circle cx="10" cy="10" r="4" fill="${c.a}"/><circle cx="30" cy="30" r="4" fill="${c.a}"/>`
          : `<rect width="40" height="40" fill="${c.base}"/>${flower(10, 12, 4, c.b, c.a)}${flower(30, 32, 3, c.b, c.a)}`;
      const defs = pattern(id, 40, 40, t);
      const F = `url(#${id})`;
      const bodice = 'M236 292 C 250 268 286 268 303 294 C 320 268 356 268 369 292 C 365 360 361 420 363 476 L 242 476 C 244 420 240 360 236 292 Z';
      const p = skin(piece(), tone, true)
        .shape(tier(470, 670, 60, 118, 8), F).line(folds(470, 670, 60, 118, 7, 8), D)
        .both('M260 286 L 246 214 L 254 212 L 270 284 Z', F, 2)
        .shape(bodice, F).line('M303 302 L 303 332', 1.6)
        .shape('M240 462 Q 303 454 366 462 L 366 480 Q 303 472 240 480 Z', c.sash)
        .shape(tails(356, 470, .9), c.sash).shape(bow(356, 470, .7), c.sash);
      const k = piece().shape(ruffled(656, 770, 112, 150, 10, 7), F).line(folds(672, 760, 116, 150, 9, 10), D);
      const s = bareArm(piece(), tone).out();
      return { defs, pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const varsity = {
    label: 'Varsity',
    colors: [
      { name: 'Navy', c: { body: '#263b6e', arm: '#f3ead6', rib: '#263b6e', ribline: '#e2475f', tee: '#fbfbfd', patch: '#e2475f', skirt: '#2b2a33' } },
      { name: 'Crimson', c: { body: '#b8263a', arm: '#2a2a30', rib: '#2a2a30', ribline: '#f3ead6', tee: '#fbfbfd', patch: '#f3ead6', skirt: '#2a2a30' } },
      { name: 'Forest', c: { body: '#2f5e46', arm: '#f3ead6', rib: '#2f5e46', ribline: '#f2c14e', tee: '#fbfbfd', patch: '#f2c14e', skirt: '#3d3a33' } },
      { name: 'Bubblegum', c: { body: '#f29bb9', arm: '#fbfbfd', rib: '#f29bb9', ribline: '#fbfbfd', tee: '#fbfbfd', patch: '#fbfbfd', skirt: '#7d6fb8' } },
    ],
    draw(c, tone) {
      const panel = 'M206 224 C 226 250 236 262 236 274 C 242 380 242 520 238 652 L 290 652 L 288 214 C 284 208 278 202 272 194 C 262 204 240 212 206 224 Z';
      const ribL = 'M232 618 L 292 618 L 292 652 L 230 652 Z';
      const p = skin(piece(), tone)
        .shape('M262 196 Q 303 214 344 196 L 352 652 L 254 652 Z', c.tee).line('M266 198 Q 303 216 340 198', D)
        .shape('M303 354 C 291 342 282 326 294 318 C 300 314 303 320 303 324 C 303 320 306 314 312 318 C 324 326 315 342 303 354 Z', c.patch, 1.8)
        .both(panel, c.body)
        .both('M272 194 C 276 204 282 210 290 214 L 290 652 L 280 652 L 278 220 C 270 214 266 206 262 198 Z', c.rib, 2)
        .both(ribL, c.rib)
        .fill(ln('M230 630 L 292 630 M230 641 L 292 641', 3, c.ribline) + MIRROR(ln('M230 630 L 292 630 M230 641 L 292 641', 3, c.ribline)))
        .fill(`<text x="258" y="300" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="46" fill="${c.patch}" stroke="${c.arm}" stroke-width="5" paint-order="stroke">R</text>`);
      const k = piece().shape(tier(636, 772, 64, 138), c.skirt).line(pleatsFrom(636, 772, 64, 138, 9, 8, 654), D);
      const s = piece()
        .shape('M206 222 C 184 234 174 272 170 322 L 140 600 L 104 668 L 182 670 L 198 560 L 224 420 L 242 274 L 262 246 L 250 218 Z', c.arm)
        .shape('M102 668 L 184 670 L 180 708 L 98 706 Z', c.rib)
        .fill(ln('M100 682 L 182 684 M99 694 L 181 696', 3, c.ribline))
        .out({ keep: HANDS_KEEP });
      return { pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const knit = {
    label: 'Off-shoulder',
    colors: [
      { name: 'Cream', c: { knit: '#f3e7d3', cable: '#e2d3ba', skirt: '#6b4a3a', btn: '#f2c14e' } },
      { name: 'Rose', c: { knit: '#ebb0bd', cable: '#dc98a7', skirt: '#4a4a55', btn: '#fbfbfd' } },
      { name: 'Sage', c: { knit: '#bcd2b1', cable: '#a6c09a', skirt: '#f3ead6', btn: '#6b4a3a' } },
      { name: 'Noir', c: { knit: '#2c2c33', cable: '#24242a', skirt: '#9c2a3a', btn: '#f2c14e' } },
    ],
    draw(c, tone) {
      const top = 'M196 250 C 248 240 358 240 410 250 L 412 268 C 410 300 386 340 378 420 L 374 642 Q 303 652 232 642 L 228 420 C 220 340 196 300 194 268 Z';
      const cables = 'M262 280 C 254 300 270 318 262 338 C 254 358 270 376 262 396 C 254 416 270 434 262 454 C 254 474 270 492 262 512 C 254 532 270 550 262 570 M344 280 C 352 300 336 318 344 338 C 352 358 336 376 344 396 C 352 416 336 434 344 454 C 352 474 336 492 344 512 C 352 532 336 550 344 570';
      const btns = [664, 696, 728, 760];
      const p = skin(piece(), tone, true)
        .shape(top, c.knit).fill(ln(cables, 9, c.cable)).line(cables, 1.4)
        .shape('M194 246 C 248 236 358 236 412 246 L 414 268 C 358 258 248 258 192 268 Z', c.cable).line(ribs(202, 406, 248, 264, 7), 1.3)
        .shape('M232 614 Q 303 622 374 614 L 374 642 Q 303 652 232 642 Z', c.cable).line(ribs(236, 370, 620, 642, 7), 1.3);
      const k = piece().shape('M240 626 L 366 626 L 440 776 Q 303 792 166 776 Z', c.skirt).line('M303 650 L 303 782', 1.8)
        .fill(btns.map(y => `<circle cx="312" cy="${y}" r="4.5" fill="${c.btn}"/>`).join('')).lines(btns.map(y => `<circle cx="312" cy="${y}" r="4.5" fill="none" stroke="${INK}" stroke-width="1.6"/>`).join(''));
      const s = piece().shape(ARM, tone, 0).lines(ln(ARM_OUT))
        .shape('M196 248 C 174 260 160 302 154 362 L 124 600 C 116 640 104 662 100 670 L 182 672 L 198 560 L 224 420 L 240 300 L 258 264 L 248 244 Z', c.knit)
        .fill(ln('M174 322 C 166 402 156 482 146 562', 7, c.cable)).lines(ln('M174 322 C 166 402 156 482 146 562', 1.3))
        .shape('M100 668 L 184 670 L 180 708 L 98 706 Z', c.cable).line(ribs(106, 176, 674, 704, 7), 1.3)
        .out({ keep: HANDS_KEEP });
      return { pieces: { torso: p.out(), skirt: k.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const DESIGNS = { sailor, hoodie, maid, yukata, overalls, sundress, varsity, knit };

  function build(key, colorIndex = 0, tone = '#ffffff') {
    const d = DESIGNS[key];
    if (!d) return null;
    const cw = d.colors[Math.max(0, Math.min(d.colors.length - 1, colorIndex | 0))];
    const r = d.draw(cw.c, tone);
    const pieces = {}, defs = [r.defs || ''];
    for (const [k, v] of Object.entries(r.pieces)) {
      if (!v) { pieces[k] = null; continue; }
      defs.push(v.defs || '');
      pieces[k] = { fill: v.fill, lines: v.lines, keep: v.keep };
    }
    pieces.neck = { fill: sh(NECK_FILL, '#ffffff') + ln(NECK_LN, 2.6) + MIRROR(ln(NECK_LN, 2.6)), lines: '', keep: '<rect x="0" y="0" width="600" height="161" fill="#000"/>' };
    pieces.legs = { fill: sh(THIGHS, '#ffffff'), lines: ln(THIGH_LN), keep: '<rect x="0" y="780" width="600" height="900" fill="#000"/>' };
    return { pieces, defs: defs.join('') };
  }

  window.Wardrobe = { DESIGNS, build };
})();
