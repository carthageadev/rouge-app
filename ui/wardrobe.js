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

  const ARM_OUT = 'M214 222 C 194 232 188 268 186 310 C 182 400 160 520 146 600 C 138 650 126 684 120 702';
  const ARM_IN = 'M238 272 C 228 330 214 400 202 460 C 186 540 172 620 160 702';
  const ARM = ARM_OUT + ' L 160 702 C 172 620 186 540 202 460 C 214 400 228 330 238 272 L 256 248 L 244 220 Z';
  const HAND = 'M120 700 C 110 726 108 768 114 790 Q 128 806 146 794 C 156 774 160 732 160 700 Z';
  const HAND_LN = 'M120 702 C 110 726 108 768 114 790 Q 128 806 146 794 C 156 774 160 732 160 702 M154 714 Q 162 734 152 754';
  const SKIN_TOP = 'M283 154 L 322 154 C 322 172 325 186 331 194 C 341 206 361 212 391 220 C 373 250 365 262 365 274 L 362 360 L 243 360 L 240 274 C 240 262 232 250 214 220 C 244 212 264 206 274 194 C 280 186 283 172 283 154 Z';
  const SHOULDER = 'M283 152 C 283 172 280 186 274 194 C 264 206 244 212 214 222';
  const NECK_FRONT = 'M283 154 L 322 154 C 322 178 324 198 330 214 L 275 214 C 281 198 283 178 283 154 Z';
  const NECK_LN = 'M283 152 C 283 178 281 198 275 214 M322 152 C 322 178 324 198 330 214';
  const CLAV = 'M258 228 C 270 234 284 234 294 230';
  const NO_NECK = 'M-60 -60 H 660 V 910 H -60 Z M 276 -60 V 160 H 329 V -60 Z';
  const THIGHS = 'M234 590 C 212 636 182 690 171 732 L 168.5 782 L 292 782 L 298 660 L 303 600 Z M372 590 C 394 636 424 690 436 732 L 441 782 L 311 782 L 308 660 L 303 600 Z';
  const THIGH_LN = 'M234 590 C 212 636 182 690 171 732 L 168.5 782 M298 664 L 292 782 M308 664 L 311 782 M372 590 C 394 636 424 690 436 732 L 441 782';
  const HANDS_KEEP = '<rect x="0" y="708" width="600" height="900" fill="#000"/>';

  const skin = (p, tone, clav = false) => {
    p.shape(SKIN_TOP, tone, 0).lines(ln(SHOULDER) + MIRROR(ln(SHOULDER)));
    if (clav) p.lines(ln(CLAV, 1.8) + MIRROR(ln(CLAV, 1.8)));
    return p;
  };
  const bareArm = (p, tone) => p.shape(ARM, tone, 0).lines(ln(ARM_OUT) + ln(ARM_IN)).shape(HAND, tone, 0).lines(ln(HAND_LN));

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

  const sailor = {
    label: 'Sailor',
    colors: [
      { name: 'Navy', c: { top: '#fbfbfd', col: '#283162', stripe: '#fbfbfd', tie: '#e2475f', skirt: '#283162' } },
      { name: 'Black', c: { top: '#fbfbfd', col: '#1e1d24', stripe: '#fbfbfd', tie: '#c8203a', skirt: '#1e1d24' } },
      { name: 'Sky', c: { top: '#fbfbfd', col: '#7ea7db', stripe: '#fbfbfd', tie: '#f2c14e', skirt: '#6a92c8' } },
      { name: 'Sakura', c: { top: '#fff7f9', col: '#e88aa7', stripe: '#fff7f9', tie: '#c23a5d', skirt: '#e88aa7' } },
    ],
    draw(c, tone) {
      const top = 'M214 220 C 232 250 240 262 240 274 C 248 360 250 430 248 480 C 246 530 240 570 236 608 Q 303 618 369 608 C 365 570 359 530 357 480 C 355 430 357 360 365 274 C 365 262 373 250 391 220 C 361 208 341 198 337 188 L 268 188 C 264 198 244 208 214 220 Z';
      const collar = 'M268 186 C 250 204 226 214 204 226 L 303 356 L 401 226 C 379 214 355 204 337 186 L 322 196 L 303 304 L 283 196 Z';
      const p = skin(piece(), tone)
        .shape(skirt(596, 772, 70, 132), c.skirt).line(pleats(596, 772, 70, 132, 9), D)
        .shape(top, c.top).line('M248 480 C 246 530 240 570 236 604 M357 480 C 359 530 365 570 369 604', 1.6)
        .shape(collar, c.col)
        .fill(ln('M218 236 L 303 344 L 387 236', 3, c.stripe))
        .shape(tails(303, 352, 1.9), c.tie).shape(knot(303, 352, 2.2), c.tie);
      const s = bareArm(piece(), tone)
        .shape('M214 218 C 194 226 178 252 176 288 C 176 306 184 320 198 322 L 248 314 C 252 290 250 256 240 234 Z', c.top)
        .fill(sh('M178 298 C 180 312 186 320 198 322 L 248 314 C 249 306 249 300 248 294 L 196 302 Z', c.col))
        .fill(ln('M181 306 L 197 311 L 248 303', 2.4, c.stripe))
        .lines(ln('M178 298 L 196 302 L 248 294', D))
        .out();
      return { pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      const body = 'M206 226 C 192 240 188 270 188 300 L 178 600 C 178 650 180 700 184 740 Q 303 752 422 740 C 426 700 428 650 428 600 L 418 300 C 418 270 414 240 400 226 C 372 212 340 208 303 208 C 266 208 234 212 206 226 Z';
      const hood = 'M216 236 C 214 200 246 168 303 166 C 360 168 392 200 390 236 C 368 222 342 214 303 214 C 264 214 238 222 216 236 Z';
      const p = skin(piece(), tone)
        .shape(hood, c.hood).line('M236 224 C 244 200 270 184 303 182 C 336 184 362 200 370 224', D)
        .shape(NECK_FRONT, tone, 0).lines(ln(NECK_LN))
        .shape(body, c.main).line('M206 226 C 222 250 228 270 230 300 M400 226 C 384 250 378 270 376 300', D)
        .shape('M184 700 Q 303 712 422 700 L 422 740 Q 303 752 184 740 Z', c.rib).line(ribs(194, 414, 708, 742, 8), 1.5)
        .shape('M232 566 Q 303 554 374 566 L 388 664 Q 303 676 218 664 Z', c.rib).line('M248 576 C 258 600 252 632 236 656 M358 576 C 348 600 354 632 370 656', D)
        .fill(ln('M286 214 C 284 250 282 290 280 318', 3, c.string) + ln('M320 214 C 322 250 324 290 326 318', 3, c.string))
        .lines(ln('M286 214 C 284 250 282 290 280 318 M320 214 C 322 250 324 290 326 318', 1.4))
        .shape('M276 316 h8 v14 h-8 Z', c.string, 1.6).shape('M322 316 h8 v14 h-8 Z', c.string, 1.6);
      const s = piece().shape(HAND, tone, 0).lines(ln(HAND_LN))
        .shape('M206 226 C 184 236 170 272 164 322 L 138 640 C 132 680 122 714 116 736 L 182 742 C 184 700 188 650 194 600 L 214 460 L 236 300 L 254 240 Z', c.main)
        .shape('M126 696 L 188 700 L 182 742 L 116 736 Z', c.rib).line(ribs(126, 180, 704, 738, 7), 1.5)
        .out();
      return { pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      const bodice = 'M214 220 C 232 250 240 262 240 274 C 246 360 250 420 250 470 L 356 470 C 356 420 359 360 365 274 C 365 262 373 250 391 220 C 361 208 341 198 337 190 L 268 190 C 264 198 244 208 214 220 Z';
      const lobe = 'M268 188 C 256 200 242 212 240 226 C 242 242 270 246 300 236 L 303 198 C 290 198 276 194 268 188 Z';
      const p = skin(piece(), tone)
        .shape(ruffled(470, 768, 58, 150, 10, 6), c.white)
        .shape(skirt(466, 756, 56, 146, 10), c.dress).line(folds(466, 756, 56, 146, 9, 10), D)
        .shape(bodice, c.dress)
        .shape('M262 330 Q 303 322 344 330 L 340 470 L 266 470 Z', c.white).line(scallops(262, 344, 330, 5, false), 1.6)
        .fill(ln('M266 332 L 244 236 M340 332 L 362 236', 9, c.white)).lines(ln('M261 332 L 239 236 M271 332 L 249 238 M345 332 L 367 236 M335 332 L 357 238', 1.6))
        .shape('M238 462 L 368 462 L 368 480 L 238 480 Z', c.white)
        .shape(ruffled(478, 690, 63, 82, 6, 6), c.white)
        .shape(lobe, c.white).shape(lobe, c.white, W, true)
        .shape(bow(303, 246, .8), c.bow).shape(circle(303, 246, 5), c.bow);
      const s = bareArm(piece(), tone)
        .shape('M214 218 C 192 226 176 252 176 286 C 178 304 188 312 200 312 C 214 316 236 312 248 306 C 252 282 250 252 240 232 Z', c.dress)
        .shape('M182 296 C 196 304 230 302 248 294 L 248 310 C 232 318 196 320 180 312 Z', c.white)
        .shape('M118 668 L 164 672 L 164 690 Q 141 696 116 690 Z', c.white).line(scallops(116, 164, 692, 4), 1.6)
        .out();
      return { pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
    },
  };

  const yukata = {
    label: 'Yukata',
    colors: [
      { name: 'Indigo', c: { base: '#2f3e7a', fl: '#f6a9c3', fl2: '#fbe2ea', obi: '#e2475f', cord: '#f2c14e', eri: '#f4efe6' } },
      { name: 'Crimson', c: { base: '#b8263a', fl: '#f2c14e', fl2: '#fbe7b0', obi: '#2b2433', cord: '#f2c14e', eri: '#f4efe6' } },
      { name: 'Snow', c: { base: '#f3f5fb', fl: '#5b86d6', fl2: '#a9c4f0', obi: '#3b5fa8', cord: '#e2475f', eri: '#fbfbfd' } },
      { name: 'Night', c: { base: '#1d1c24', fl: '#e2475f', fl2: '#f4efe6', obi: '#c8203a', cord: '#f4efe6', eri: '#f4efe6' } },
    ],
    draw(c, tone) {
      const id = 'yk' + (++uid);
      const defs = pattern(id, 120, 110, `<rect width="120" height="110" fill="${c.base}"/>${flower(28, 26, 7, c.fl, c.cord)}${flower(88, 72, 6, c.fl2, c.cord)}${flower(18, 94, 4, c.fl, c.cord)}<path d="M58 22q10 -6 20 0q10 6 20 0" stroke="${c.fl2}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>`);
      const F = `url(#${id})`;
      const body = 'M204 226 C 232 214 262 204 268 192 L 337 192 C 343 204 373 214 401 226 L 405 300 L 412 772 Q 303 786 194 772 L 201 300 Z';
      const p = skin(piece(), tone)
        .shape(body, F).line('M330 520 L 340 776', D)
        .shape('M337 194 L 303 318 L 318 318 L 345 200 Z', c.eri)
        .shape('M268 192 C 282 262 306 338 340 440 L 360 440 C 326 338 300 262 284 194 Z', c.eri)
        .shape('M284 194 C 300 262 326 338 360 440 L 376 440 C 342 338 316 262 300 196 Z', c.base)
        .shape('M198 432 Q 303 422 408 432 L 408 520 Q 303 530 198 520 Z', c.obi)
        .fill(sh('M200 432 Q 303 422 406 432 L 406 442 Q 303 434 200 442 Z', c.eri))
        .fill(ln('M200 478 Q 303 470 406 478', 3.4, c.cord)).lines(ln('M200 478 Q 303 470 406 478', 1.2))
        .shape(circle(303, 476, 7), c.cord, 2);
      const s = piece()
        .shape('M140 640 C 132 664 130 704 136 724 Q 150 740 166 728 C 174 708 178 670 176 640 Z', tone, 0)
        .lines(ln('M140 642 C 132 664 130 704 136 724 Q 150 740 166 728 C 174 708 178 670 176 642 M170 652 Q 178 672 168 690'))
        .shape('M206 222 L 124 244 C 106 250 100 268 100 292 L 100 600 C 100 628 114 646 140 648 L 214 648 L 224 300 L 256 248 L 244 220 Z', F)
        .line('M120 646 C 150 636 180 636 212 646', D)
        .out();
      return { defs, pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      const tee = 'M214 220 C 232 250 240 262 240 274 C 246 360 248 430 246 486 L 360 486 C 358 430 359 360 365 274 C 365 262 373 250 391 220 C 361 208 343 198 337 194 Q 303 214 268 194 C 262 198 244 208 214 220 Z';
      const shorts = 'M246 470 L 360 470 L 380 600 L 446 718 Q 380 730 312 718 L 303 680 L 294 718 Q 226 730 160 718 L 226 600 Z';
      const p = skin(piece(), tone)
        .shape(tee, T).line('M272 199 Q 303 220 333 199', D)
        .shape(shorts, c.denim)
        .fill(ln('M168 704 Q 230 714 292 704 M314 704 Q 376 714 438 704', 2, c.stitch)).lines(ln('M166 700 Q 230 712 294 700 M312 700 Q 376 712 440 700', D))
        .shape('M256 330 L 350 330 L 354 474 L 252 474 Z', c.denim)
        .fill(`<path d="M262 338 L 344 338 L 347 466 L 259 466 Z" fill="none" stroke="${c.stitch}" stroke-width="1.6" stroke-dasharray="4 3"/>`)
        .shape('M280 362 L 326 362 L 324 404 Q 303 412 282 404 Z', c.denim).line('M282 372 L 324 372', 1.6)
        .both('M256 334 L 240 226 L 254 222 L 270 334 Z', c.denim)
        .shape(circle(263, 340, 6), c.stitch, 2).shape(circle(343, 340, 6), c.stitch, 2);
      const s = bareArm(piece(), tone)
        .shape('M214 218 C 196 226 182 250 178 290 L 246 300 C 248 270 246 246 238 230 Z', T).line('M180 286 L 246 296', D)
        .out();
      return { defs, pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      const tile = c.kind === 'gingham'
        ? `<rect width="40" height="40" fill="${c.base}"/><rect width="20" height="40" fill="${c.b}" opacity=".55"/><rect width="40" height="20" fill="${c.b}" opacity=".55"/>`
        : c.kind === 'dots' ? `<rect width="40" height="40" fill="${c.base}"/><circle cx="10" cy="10" r="4" fill="${c.a}"/><circle cx="30" cy="30" r="4" fill="${c.a}"/>`
          : `<rect width="40" height="40" fill="${c.base}"/>${flower(10, 12, 4, c.b, c.a)}${flower(30, 32, 3, c.b, c.a)}`;
      const defs = pattern(id, 40, 40, tile);
      const F = `url(#${id})`;
      const bodice = 'M240 292 C 252 270 286 270 303 294 C 320 270 354 270 366 292 C 362 360 358 420 360 474 L 246 474 C 248 420 244 360 240 292 Z';
      const p = skin(piece(), tone, true)
        .shape(ruffled(468, 770, 60, 150, 10, 7), F).line(folds(468, 760, 60, 150, 9, 10), D).line(ruffleLine(744, 147, 10, 7), 1.6)
        .both('M262 284 L 250 214 L 256 213 L 270 282 Z', F, 2)
        .shape(bodice, F).line('M303 300 L 303 330', 1.6)
        .shape('M244 460 Q 303 452 362 460 L 362 478 Q 303 470 244 478 Z', c.sash)
        .shape(tails(352, 468, .9), c.sash).shape(bow(352, 468, .7), c.sash);
      const s = bareArm(piece(), tone).out();
      return { defs, pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      const panel = 'M214 220 C 232 250 238 262 238 274 C 244 380 244 500 240 604 L 288 604 L 286 214 C 282 208 276 202 272 194 C 262 204 244 212 214 220 Z';
      const ribL = 'M236 592 L 290 592 L 290 630 L 232 630 Z';
      const p = skin(piece(), tone)
        .shape(skirt(600, 772, 70, 130), c.skirt).line(pleats(600, 772, 70, 130, 9), D)
        .shape('M262 196 Q 303 214 344 196 L 352 608 L 254 608 Z', c.tee).line('M266 198 Q 303 216 340 198', D)
        .shape('M303 352 C 291 340 282 324 294 316 C 300 312 303 318 303 322 C 303 318 306 312 312 316 C 324 324 315 340 303 352 Z', c.patch, 1.8)
        .both(panel, c.body)
        .both('M272 194 C 276 204 282 210 288 214 L 288 604 L 278 604 L 276 220 C 270 214 266 206 262 198 Z', c.rib, 2)
        .both(ribL, c.rib)
        .fill(ln('M234 604 L 290 604 M234 616 L 290 616', 3, c.ribline) + MIRROR(ln('M234 604 L 290 604 M234 616 L 290 616', 3, c.ribline)))
        .fill(`<text x="256" y="300" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="46" fill="${c.patch}" stroke="${c.arm}" stroke-width="5" paint-order="stroke">R</text>`);
      const s = piece()
        .shape('M214 220 C 192 232 182 270 178 320 L 148 600 L 110 668 L 180 670 L 196 560 L 222 420 L 240 274 L 256 246 L 244 218 Z', c.arm)
        .shape('M108 668 L 182 670 L 178 708 L 102 706 Z', c.rib)
        .fill(ln('M106 682 L 180 684 M105 694 L 179 696', 3, c.ribline))
        .out({ keep: HANDS_KEEP });
      return { pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      const top = 'M202 248 C 250 238 356 238 404 248 L 406 266 C 404 300 380 340 372 420 L 368 560 Q 303 568 238 560 L 234 420 C 226 340 202 300 200 266 Z';
      const cables = 'M262 280 C 254 300 270 318 262 338 C 254 358 270 376 262 396 C 254 416 270 434 262 454 C 254 474 270 492 262 512 M344 280 C 352 300 336 318 344 338 C 352 358 336 376 344 396 C 352 416 336 434 344 454 C 352 474 336 492 344 512';
      const btns = [600, 640, 680, 720, 760];
      const p = skin(piece(), tone, true)
        .shape('M246 540 L 360 540 L 410 772 Q 303 786 196 772 Z', c.skirt).line('M303 548 L 303 776', 1.8)
        .fill(btns.map(y => `<circle cx="312" cy="${y}" r="4.5" fill="${c.btn}"/>`).join('')).lines(btns.map(y => `<circle cx="312" cy="${y}" r="4.5" fill="none" stroke="${INK}" stroke-width="1.6"/>`).join(''))
        .shape(top, c.knit).fill(ln(cables, 9, c.cable)).line(cables, 1.4)
        .shape('M200 244 C 250 234 356 234 406 244 L 408 266 C 356 256 250 256 198 266 Z', c.cable).line(ribs(206, 400, 246, 262, 7), 1.3)
        .shape('M236 540 Q 303 548 370 540 L 370 564 Q 303 572 236 564 Z', c.cable).line(ribs(240, 366, 546, 564, 7), 1.3);
      const s = piece().shape(ARM, tone, 0).lines(ln(ARM_OUT))
        .shape('M200 246 C 178 258 164 300 158 360 L 128 600 C 120 640 106 662 102 670 L 182 672 L 196 560 L 222 420 L 238 300 L 256 262 L 246 244 Z', c.knit)
        .fill(ln('M178 320 C 170 400 160 480 150 560', 7, c.cable)).lines(ln('M178 320 C 170 400 160 480 150 560', 1.3))
        .shape('M104 668 L 182 670 L 178 708 L 102 706 Z', c.cable).line(ribs(110, 174, 674, 704, 7), 1.3)
        .out({ keep: HANDS_KEEP });
      return { pieces: { torso: p.out(), skirt: p.out(), sleeveL: s, sleeveR: mirrored(s) } };
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
      defs.push(v.defs || '');
      pieces[k] = { fill: v.fill, lines: v.lines, keep: v.keep };
    }
    pieces.neck = { fill: '', lines: '', keep: '<rect x="0" y="0" width="600" height="161" fill="#000"/>' };
    pieces.legs = { fill: sh(THIGHS, '#ffffff'), lines: ln(THIGH_LN), keep: '<rect x="0" y="780" width="600" height="900" fill="#000"/>' };
    if (!('collar' in pieces)) {
      const clip = 'nn' + (++uid);
      defs.push(`<clipPath id="${clip}"><path d="${NO_NECK}" clip-rule="evenodd"/></clipPath>`);
      pieces.collar = { fill: `<g clip-path="url(#${clip})">${pieces.torso.fill}</g>`, lines: `<g clip-path="url(#${clip})">${pieces.torso.lines}</g>` };
    }
    return { pieces, defs: defs.join('') };
  }

  window.Wardrobe = { DESIGNS, build };
})();
