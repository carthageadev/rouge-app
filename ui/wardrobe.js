(function () {
  const INK = '#2b1d27';
  const ln = (d, w = 3.4, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sh = (d, c) => `<path d="${d}" fill="${c}"/>`;
  const all = c => `<rect width="600" height="850" fill="${c}"/>`;
  const upTo = (y, c) => `<rect width="600" height="${y}" fill="${c}"/>`;
  const band = (y0, y1, c) => `<rect y="${y0}" width="600" height="${y1 - y0}" fill="${c}"/>`;
  const mx = (side, x) => side === 'L' ? x : 600 - x;
  const HAND = 704;

  const scallops = (x0, x1, y, r, down = true, move = true) => {
    const step = x1 > x0 ? 1 : -1, sweep = (step > 0) === down ? 0 : 1;
    let d = move ? `M${x0} ${y}` : '';
    for (let x = x0; Math.abs(x1 - x) > r; x += step * r * 2) d += ` a${r} ${r} 0 0 ${sweep} ${step * r * 2} 0`;
    return d;
  };
  const ribs = (x0, x1, y0, y1, gap = 9) => {
    let d = '';
    for (let x = x0; x <= x1; x += gap) d += `M${x} ${y0}L${x} ${y1}`;
    return ln(d, 2.2);
  };
  const pleats = (c = INK, w = 3) => ln('M207 692L200 768M246 694L242 770M286 695L285 771M320 695L322 771M356 694L360 770M395 692L402 768', w, c);
  const cuff = (side, c, top = 668) => {
    const a = mx(side, 70), b = mx(side, 190);
    return `<rect x="${Math.min(a, b)}" y="${top}" width="120" height="${HAND - top}" fill="${c}"/>`;
  };
  const cuffLine = (side, top = 668) => ln(`M${mx(side, 82)} ${top + 2}Q${mx(side, 128)} ${top - 4} ${mx(side, 174)} ${top + 2}`);
  const cuffRibs = (side, top = 668) => {
    let d = '';
    for (let x = 90; x <= 168; x += 9) d += `M${mx(side, x)} ${top + 7}L${mx(side, x)} ${HAND - 4}`;
    return ln(d, 2.2);
  };
  const sakura = (x, y, s = 1, r = 0, c = '#f6a9c3') =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" fill="${c}">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-6" rx="4.2" ry="6" transform="rotate(${a})"/>`).join('')}<circle r="2.4" fill="#fff6d6"/></g>`;
  const star = (x, y, r, c) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
    }
    return d + 'Z';
  };
  const heart = (x, y, s) => `M${x} ${y + 10 * s}C${x - 16 * s} ${y}, ${x - 10 * s} ${y - 12 * s}, ${x} ${y - 4 * s}C${x + 10 * s} ${y - 12 * s}, ${x + 16 * s} ${y}, ${x} ${y + 10 * s}Z`;
  const bow = (x, y, s, c, tails = true) =>
    sh(`M${x} ${y}C${x - 10 * s} ${y - 14 * s} ${x - 30 * s} ${y - 12 * s} ${x - 28 * s} ${y + 2 * s}C${x - 26 * s} ${y + 14 * s} ${x - 10 * s} ${y + 10 * s} ${x} ${y}ZM${x} ${y}C${x + 10 * s} ${y - 14 * s} ${x + 30 * s} ${y - 12 * s} ${x + 28 * s} ${y + 2 * s}C${x + 26 * s} ${y + 14 * s} ${x + 10 * s} ${y + 10 * s} ${x} ${y}Z`, c) +
    (tails ? sh(`M${x - 3 * s} ${y + 3 * s}L${x - 14 * s} ${y + 34 * s}L${x - 6 * s} ${y + 30 * s}L${x - 2 * s} ${y + 36 * s}L${x + 2 * s} ${y + 4 * s}ZM${x + 3 * s} ${y + 3 * s}L${x + 14 * s} ${y + 34 * s}L${x + 6 * s} ${y + 30 * s}L${x + 2 * s} ${y + 36 * s}L${x - 2 * s} ${y + 4 * s}Z`, c) : '') +
    `<circle cx="${x}" cy="${y}" r="${5 * s}" fill="${c}"/>`;
  const bowLines = (x, y, s, tails = true) =>
    ln(`M${x} ${y}C${x - 10 * s} ${y - 14 * s} ${x - 30 * s} ${y - 12 * s} ${x - 28 * s} ${y + 2 * s}C${x - 26 * s} ${y + 14 * s} ${x - 10 * s} ${y + 10 * s} ${x} ${y}M${x} ${y}C${x + 10 * s} ${y - 14 * s} ${x + 30 * s} ${y - 12 * s} ${x + 28 * s} ${y + 2 * s}C${x + 26 * s} ${y + 14 * s} ${x + 10 * s} ${y + 10 * s} ${x} ${y}` +
      (tails ? `M${x - 3 * s} ${y + 3 * s}L${x - 14 * s} ${y + 34 * s}L${x - 6 * s} ${y + 30 * s}L${x - 2 * s} ${y + 36 * s}M${x + 3 * s} ${y + 3 * s}L${x + 14 * s} ${y + 34 * s}L${x + 6 * s} ${y + 30 * s}L${x + 2 * s} ${y + 36 * s}` : ''), 2.8) +
    `<circle cx="${x}" cy="${y}" r="${5 * s}" fill="none" stroke="${INK}" stroke-width="2.6"/>`;

  const V_OUT = 'M196 192L300 336L404 192';
  const V_IN = 'M234 190L300 300L366 190';
  const inV = c => sh('M228 150L372 150L366 190L300 300L234 190Z', c);
  const sleeves = make => ({ sleeveL: make('L'), sleeveR: make('R') });
  const keepHands = `<rect y="${HAND - 6}" width="600" height="${850 - HAND + 6}" fill="#000"/>`;
  const plainSleeves = (base, cuffCol, extraFill = () => '', extraLines = () => '', withRibs = true) => sleeves(s => ({
    fill: upTo(HAND, base) + extraFill(s) + (cuffCol ? cuff(s, cuffCol) : ''),
    lines: extraLines(s) + (cuffCol ? cuffLine(s) + (withRibs ? cuffRibs(s) : '') : ''),
    keep: keepHands,
  }));

  const DESIGNS = {
    sailor: {
      label: 'Sailor', swatch: '#2b3263', accent: '#e2475f',
      pieces: {
        body: {
          fill: all('#fbfbfd') + sh('M176 192L300 374L424 192L366 190L300 300L234 190Z', '#2b3263') + ln('M190 198L300 358L410 198', 3.4, '#fbfbfd')
            + sh('M300 372L284 452L296 446L302 458L312 376Z', '#e2475f') + sh('M300 372L320 448L308 444L300 456L290 376Z', '#e2475f') + sh('M284 352L316 352L322 372L278 372Z', '#e2475f'),
          lines: ln('M176 192L300 374L424 192') + ln('M284 352L316 352L322 372L278 372Z', 2.8) + ln('M292 372L284 452L296 446L302 458L304 374M308 372L320 448L308 444L300 456', 2.8),
        },
        rib: { fill: all('#2b3263') + ln('M218 196L300 318L382 196', 3, '#fbfbfd'), lines: '' },
        placket: { lines: '' },
        skirt: { fill: all('#2b3263') + pleats('#3d4680', 9), lines: pleats() },
        ...plainSleeves('#fbfbfd', '#2b3263', () => '', s => '', false),
      },
    },
    hoodie: {
      label: 'Hoodie', swatch: '#c9b5f3', accent: '#9b7fe0',
      pieces: {
        body: {
          fill: all('#cdb9f5') + band(648, 720, '#b29ae8') + sh('M228 548Q300 536 372 548L384 636L216 636Z', '#c3adf2')
            + `<rect x="268" y="398" width="10" height="18" rx="3" fill="#fbfbfd"/><rect x="322" y="402" width="10" height="18" rx="3" fill="#fbfbfd"/>`,
          lines: ln('M228 548Q300 536 372 548L384 636L216 636Z') + ln('M246 560Q262 592 236 626M354 560Q338 592 364 626', 2.8)
            + ln('M284 334Q278 366 273 400M316 334Q322 368 327 404', 2.8) + ln('M268 398L278 398L278 416L268 416ZM322 402L332 402L332 420L322 420Z', 2) + ln('M210 648Q300 656 390 648') + ribs(214, 386, 656, 690),
        },
        rib: { fill: all('#b29ae8'), lines: ln('M214 198L300 322L386 198', 2.4) },
        placket: { lines: '' },
        skirt: { fill: all('#3b3646') + pleats('#4a4456', 9), lines: pleats() },
        ...plainSleeves('#cdb9f5', '#b29ae8'),
      },
    },
    maid: {
      label: 'Maid', swatch: '#26232c', accent: '#fbfbfd',
      pieces: {
        body: {
          fill: all('#26232c') + inV('#fbfbfd') + ln('M274 330L250 196M326 330L350 196', 12, '#fbfbfd')
            + sh('M268 330Q300 318 332 330L328 436Q300 446 272 436Z', '#fbfbfd') + sh(scallops(264, 336, 330, 6, false) + 'L336 340L264 340Z', '#fbfbfd')
            + sh('M224 520Q300 506 376 520L390 682' + scallops(390, 210, 682, 7.5, true, false) + 'L210 682Z', '#fbfbfd')
            + band(512, 524, '#26232c') + bow(300, 246, .8, '#e2475f', false),
          lines: ln('M268 330Q300 318 332 330L328 436Q300 446 272 436Z', 2.6) + ln(scallops(264, 336, 330, 6, false), 2.2)
            + ln('M224 520Q300 506 376 520L390 682M210 682L224 520', 2.6) + ln(scallops(210, 390, 682, 7.5), 2.2)
            + ln('M268 532Q266 610 262 676M332 532Q334 610 338 676', 1.8, '#c8c3cf') + bowLines(300, 246, .8, false),
        },
        rib: { fill: all('#fbfbfd') + ln(scallops(196, 404, 199, 6), 2.6, '#26232c'), lines: ln('M226 196L300 312L374 196', 2, '#c8c3cf') },
        placket: { lines: '' },
        skirt: { fill: all('#26232c') + band(746, 790, '#fbfbfd') + sh(scallops(150, 460, 746, 6, false) + 'L460 760L150 760Z', '#fbfbfd'), lines: ln(scallops(150, 460, 742, 6), 2.4) + pleats('#5a5466', 2.4) },
        ...plainSleeves('#26232c', '#fbfbfd', () => '', s => ln(scallops(mx(s, 74) < 300 ? 74 : 406, mx(s, 74) < 300 ? 194 : 526, 668, 6), 2.2), false),
      },
    },
    marine: {
      label: 'Marine', swatch: '#fbf3e4', accent: '#2e3a6e',
      defs: '<pattern id="st" width="600" height="40" patternUnits="userSpaceOnUse"><rect width="600" height="40" fill="#fbf3e4"/><rect y="24" width="600" height="14" fill="#2e3a6e"/></pattern>',
      pieces: {
        body: {
          fill: '<rect width="600" height="850" fill="url(#st)"/>' + band(648, 720, '#2e3a6e') + sh(heart(258, 392, 1.6), '#e2475f'),
          lines: ln(heart(258, 392, 1.6), 2.6) + ln('M210 648Q300 656 390 648'),
        },
        rib: { fill: all('#2e3a6e'), lines: '' },
        placket: { lines: '' },
        skirt: { fill: all('#5b7fbf') + band(692, 700, '#4c6dab'), lines: ln('M300 712L300 770', 2.6) + ln('M210 708L390 708', 1.8, '#e9d9a8') + `<circle cx="300" cy="712" r="5" fill="#e9d9a8" stroke="${INK}" stroke-width="2"/>` },
        ...plainSleeves('url(#st)', '#2e3a6e', () => '', () => '', false),
      },
    },
    yukata: {
      label: 'Yukata', swatch: '#2f3e7a', accent: '#e2475f',
      defs: `<pattern id="sk" width="120" height="110" patternUnits="userSpaceOnUse"><rect width="120" height="110" fill="#2f3e7a"/>${sakura(28, 26, 1.1, 10)}${sakura(88, 70, .9, 40)}${sakura(18, 92, .7, 70, '#fbe2ea')}<path d="M60 20q10 -6 20 0q10 6 20 0" stroke="#4e5da0" stroke-width="2.5" fill="none" stroke-linecap="round"/></pattern>`,
      pieces: {
        body: {
          fill: '<rect width="600" height="850" fill="url(#sk)"/>' + sh('M234 190L300 300L352 480L376 480L392 190Z', 'url(#sk)') + band(474, 548, '#e2475f') + band(506, 514, '#ffd166')
            + `<rect x="284" y="488" width="32" height="46" rx="6" fill="#c9364d"/>`,
          lines: ln('M300 300L352 476') + ln('M200 474L400 474M200 548L400 548') + ln('M284 488L316 488L316 534L284 534Z', 2.6),
        },
        rib: { fill: all('#fbfbfd'), lines: '' },
        placket: { lines: '' },
        skirt: { fill: '<rect width="600" height="850" fill="url(#sk)"/>', lines: ln('M342 690L352 770', 3) },
        ...plainSleeves('url(#sk)', null),
      },
    },
    cardigan: {
      label: 'Cardigan', swatch: '#f0dfbf', accent: '#c9364d',
      defs: '<pattern id="pl" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#c9364d"/><rect x="0" y="18" width="48" height="12" fill="#8f1f33" opacity=".7"/><rect x="18" y="0" width="12" height="48" fill="#8f1f33" opacity=".7"/><rect x="0" y="23" width="48" height="2" fill="#ffd166" opacity=".9"/><rect x="23" y="0" width="2" height="48" fill="#ffd166" opacity=".9"/></pattern>',
      pieces: {
        body: {
          fill: all('#f2e3c6') + sh('M284 300L316 300L318 720L282 720Z', '#fbfbfd') + band(648, 720, '#e3cfa9') + sh('M282 648L318 648L318 720L282 720Z', '#fbfbfd')
            + `<rect x="226" y="520" width="46" height="56" rx="6" fill="#e9d6b2"/><rect x="328" y="520" width="46" height="56" rx="6" fill="#e9d6b2"/>`
            + [360, 420, 480, 540, 600].map(y => `<circle cx="330" cy="${y}" r="6" fill="#8a5a3c"/>`).join('') + bow(300, 230, .5, '#c9364d'),
          lines: ln('M284 300L282 720M316 300L318 720') + ln('M226 520L272 520L272 576L226 576ZM328 520L374 520L374 576L328 576Z', 2.6)
            + [360, 420, 480, 540, 600].map(y => `<circle cx="330" cy="${y}" r="6" fill="none" stroke="${INK}" stroke-width="2.2"/>`).join('')
            + ln('M210 648L282 650M318 650L390 648') + ribs(216, 278, 656, 690) + ribs(324, 386, 656, 690) + bowLines(300, 230, .5),
        },
        rib: { fill: all('#e3cfa9'), lines: ln('M216 198L300 320L384 198', 2.2) },
        placket: { lines: '' },
        skirt: { fill: '<rect width="600" height="850" fill="url(#pl)"/>', lines: pleats() },
        ...plainSleeves('#f2e3c6', '#e3cfa9'),
      },
    },
    varsity: {
      label: 'Varsity', swatch: '#263b6e', accent: '#f3ead6',
      defs: '<pattern id="rb" width="600" height="16" patternUnits="userSpaceOnUse"><rect width="600" height="16" fill="#263b6e"/><rect y="5" width="600" height="6" fill="#f3ead6"/></pattern>',
      pieces: {
        body: {
          fill: all('#263b6e') + `<rect y="648" width="600" height="72" fill="url(#rb)"/>` + `<text x="258" y="420" font-family="Georgia,serif" font-weight="900" font-size="64" text-anchor="middle" fill="#e2475f" stroke="#f3ead6" stroke-width="5" paint-order="stroke">R</text>`
            + [350, 410, 470, 530, 590].map(y => `<circle cx="300" cy="${y}" r="5" fill="#f3ead6"/>`).join(''),
          lines: ln('M300 330L300 648', 2.4, '#4d6299') + ln('M210 648Q300 656 390 648', 3, '#4d6299'),
        },
        rib: { fill: '<rect width="600" height="850" fill="url(#rb)"/>', lines: '' },
        placket: { lines: '' },
        skirt: { fill: all('#24232a') + pleats('#34323c', 9), lines: pleats('#4d4a57', 2.6) },
        ...sleeves(s => ({ fill: upTo(HAND, '#f3ead6') + `<rect x="${Math.min(mx(s, 70), mx(s, 190))}" y="668" width="120" height="${HAND - 668}" fill="url(#rb)"/>`, lines: cuffLine(s), keep: keepHands })),
      },
    },
    idol: {
      label: 'Idol', swatch: '#ffc4d8', accent: '#ff5e7e',
      pieces: {
        body: {
          fill: all('#ffc4d8') + band(640, 720, '#fbfbfd') + sh(scallops(200, 400, 640, 8) + 'L400 600L200 600Z', '#ffc4d8')
            + bow(300, 350, 1.5, '#ff5e7e') + sh(star(300, 350, 12), '#ffd166') + sh(heart(244, 470, 1.4), '#ff8fb0') + sh(heart(362, 540, 1.1), '#ff8fb0')
            + [440, 500, 560].map(y => `<circle cx="300" cy="${y}" r="6" fill="#ffd166"/>`).join(''),
          lines: ln(scallops(200, 400, 640, 8), 2.6) + bowLines(300, 350, 1.5) + ln(star(300, 350, 12), 2.2) + ln(heart(244, 470, 1.4) + heart(362, 540, 1.1), 2)
            + [440, 500, 560].map(y => `<circle cx="300" cy="${y}" r="6" fill="none" stroke="${INK}" stroke-width="2"/>`).join('') + ln('M206 690Q300 698 394 690', 2.2, '#e9b6c8'),
        },
        rib: { fill: all('#fbfbfd') + ln(scallops(196, 404, 200, 6), 2.6, '#ffc4d8'), lines: '' },
        placket: { lines: '' },
        skirt: { fill: all('#ff9fbe') + band(752, 790, '#fbfbfd') + sh(scallops(150, 460, 752, 7) + 'L460 740L150 740Z', '#ff9fbe'), lines: ln(scallops(150, 460, 744, 7), 2.4) + pleats('#e57c9f', 2.4) },
        ...plainSleeves('#ffc4d8', '#fbfbfd', () => '', s => ln(scallops(mx(s, 74) < 300 ? 74 : 406, mx(s, 74) < 300 ? 194 : 526, 670, 6), 2.2), false),
      },
    },
  };

  window.Wardrobe = { DESIGNS };
})();
