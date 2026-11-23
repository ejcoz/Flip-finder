// who.js — "How Rare Are You?": the hero (a big blob face that tries each test), its hand, the crowd of dots, the room
import { W, H, C, T, bayer, hash, clamp, lerp, mod } from './px.js';
import { lineC } from './font.js';

// landing juice: an expanding ring (white → cyan → pink) and sparks
export function burst(fb, x, y, age, big = 1) {
  if (age < 0 || age > .34) return;
  const r = 4 + age / .3 * 20 * big, c = age < .08 ? C.white : age < .18 ? C.cyan : C.pink;
  for (let a = 0; a < 6.283; a += .09) if (bayer((x + Math.cos(a) * r) | 0, (y + Math.sin(a) * r) | 0) < 1.1 - age / .34) fb.px(x + Math.cos(a) * r, y + Math.sin(a) * r, c);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + .3, d = 8 + age * 90 * big; fb.px(x + Math.cos(a) * d, y + Math.sin(a) * d - 20 * age + 60 * age * age, i % 2 ? C.white : C.cyan); fb.px(x + Math.cos(a) * (d - 2), y + Math.sin(a) * (d - 2) - 20 * age + 60 * age * age, C.pink); }
}
export function shock(fb, x, y, age) {                             // a shockwave across the room
  if (age < 0 || age > .6) return; const r = age / .6 * 170;
  for (let a = 0; a < 6.283; a += .012) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (py > 168 && bayer(px | 0, py | 0) < 1 - age / .6) { fb.px(px, py, C.white); fb.px(px + Math.cos(a) * 2, py + Math.sin(a) * 2, C.cyan); } }
}
export function shift(fb, dx, dy) {                                // screen shake: move the whole picture by whole pixels
  if (!dx && !dy) return; const s = fb.d.slice(), w = fb.w, h = fb.h;
  for (let y = 0; y < h; y++) { const sy = clamp(y - dy, 0, h - 1); for (let x = 0; x < w; x++) fb.d[y * w + x] = s[sy * w + clamp(x - dx, 0, w - 1)]; }
}


export function confetti(fb, t, t0, cx, cy) {
  const a = t - t0; if (a < 0 || a > 2.2) return;
  for (let i = 0; i < 90; i++) {
    const ang = hash(i, 11) * 6.283, sp = 40 + hash(i, 12) * 120, x = cx + Math.cos(ang) * sp * a * (1 - a * .18), y = cy + Math.sin(ang) * sp * a * .8 + 60 * a * a - 30 * a;
    if (y < 168 && hash(i, 14) < .6) continue;
    const c = [C.cyan, C.pink, C.white, C.lime, C.hot, C.blue, C.orange][i % 7];
    if (((t * 10 + i) | 0) % 4 !== 0) { fb.px(x, y, c); fb.px(x + 1, y, c); if (i % 3 === 0) fb.px(x, y + 1, c); }
  }
}

const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
export const HX = 135, HY = 268, HR = 56;

export function stage(fb, t) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - HX) / 160, (y - 290) / 190);
    const v = clamp(1.2 - d * 1.05 - (y < 110 ? (110 - y) / 110 * .35 : 0), 0, .999) * 3, k = Math.floor(v);
    let q = Math.min(3, k + (bayer(x, y) < v - k ? 1 : 0));
    if (y > 168) { const ray = Math.sin(6 * Math.atan2(y - HY, x - HX) + t * 1.7); if (ray > .45 && bayer(x, y) < (ray - .45) * 1.5) q = Math.min(4, q + 1); }
    fb.px(x, y, [C.g0, C.g1, C.g2, C.g3, C.g4][q]);
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.round(mod(hash(i, 1) * W + Math.sin(t * .6 + i) * 8, W)), y = Math.round(mod(hash(i, 2) * H - t * (16 + hash(i, 3) * 26), H));
    if (y > 168) { fb.px(x, y, i % 3 ? C.g4 : C.rose); if (i % 4 === 0) fb.px(x, y + 1, C.g4); }
  }
}

function blobDisc(fb, cx, cy, rx, ry, light = true) {            // shaded orange blob part with an ink outline
  for (let j = -ry - 1; j <= ry + 1; j++) for (let i = -rx - 1; i <= rx + 1; i++) {
    const d = (i / rx) ** 2 + (j / ry) ** 2; if (d > 1 + 2.4 / Math.min(rx, ry)) continue;
    if (d > 1) { fb.px(cx + i, cy + j, C.ink); continue; }
    const li = (-i / rx * .5 - j / ry * .6 + Math.sqrt(Math.max(0, 1 - d)) * .7) + (bayer(cx + i, cy + j) - .5) * .14;
    fb.px(cx + i, cy + j, light && li > .92 ? C.sL : li > .5 ? C.sB : li > .22 ? C.sM : C.sD);
  }
}
function tongueRect(fb, x0, y0, w, h, groove) {
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w; const corner = (i < 2 || i > w - 3) && j > h - 3;
    if (corner && edge) continue;
    let c = (i < 2 || i > w - 3) ? C.hpink : C.pink; if (groove && Math.abs(i - (w - 1) / 2) < w * .22) c = C.rose; if (j > h - 3) c = C.rose;
    fb.px(x0 + i, y0 + j, edge ? C.ink : c);
  }
}
// The hero. o: { test: 0..4 | -1, k: 0..1 how far it has managed the move, strain: bool, expr, earDy, shake }
export function hero(fb, t, o = {}) {
  const sx = o.shake ? Math.round((hash((t * 30) | 0, 7) - .5) * 2 * o.shake) : 0, s = o.scale ?? 1;
  const cx = Math.round((o.x ?? HX) + sx), cy = Math.round((o.y ?? HY) + Math.sin(t * 4.2) * 3), R = Math.round(HR * s), k = o.k || 0;
  if (R < 6) { fb.disc(cx, cy, Math.max(1, R), C.sB); return; }
  // ears (behind), wiggling on test 2
  const ed = o.test === 2 ? Math.round(Math.sin(t * 26) * (2 + 5 * k)) : 0;
  blobDisc(fb, cx - R - 2, cy - 4 - ed, Math.round(12 * s), Math.round(13 * s)); blobDisc(fb, cx + R + 2, cy - 4 + ed, Math.round(12 * s), Math.round(13 * s));
  if (o.test === 2 && k > .5) for (const sd of [-1, 1]) for (let q = 0; q < 3; q++) fb.px(cx + sd * (R + 18 + q * 3), cy - 10 + ((t * 20 + q) | 0) % 3 * 5, C.white);   // wiggle marks
  blobDisc(fb, cx, cy, R, Math.round(R * .96));
  // eyes
  const ey = cy - Math.round(14 * s), ex = Math.round(20 * s), blink = ((t * 1000) % 3400) < 100;
  const look = o.test === 4 ? [0, -3] : o.test === 1 ? [3, 2] : [Math.round(Math.sin(t * .9) * 2), 0];
  for (const sd of [-1, 1]) {
    const x = cx + sd * ex;
    if (o.strain || blink) {                                        // squeezed shut: > <
      for (let q = 0; q < 6; q++) { fb.rect(x - sd * (3 - q) - (sd > 0 ? 0 : 1), ey - 3 + (q < 3 ? q : 5 - q) * 1 + (q < 3 ? 0 : 0), 2, 2, C.ink); }
      for (let q = -5; q <= 5; q++) fb.rect(x + q, ey + (o.strain ? Math.round(Math.abs(q) * .5) - 2 : 0), 1, 2, C.ink);
    } else if (o.expr === 'happy') {
      for (let q = -6; q <= 6; q++) fb.rect(x + q, ey - Math.round((1 - (q / 6) ** 2) * 5) + 2, 1, 2, C.ink);
    } else {
      const big = o.expr === 'wow' ? 2 : 0;
      for (let j = -8 - big; j <= 8 + big; j++) for (let i = -6 - big; i <= 6 + big; i++) { const d = (i / (6 + big)) ** 2 + (j / (8 + big)) ** 2; if (d <= 1.25) fb.px(x + i, ey + j, d > 1 ? C.ink : C.white); }
      for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) if ((i / 3) ** 2 + (j / 4) ** 2 <= 1.1) fb.px(x + i + look[0], ey + j + look[1], C.ink);
      fb.rect(x - 2 + look[0], ey - 3 + look[1], 2, 2, C.white);
    }
    if (o.strain) for (let q = 0; q < 7; q++) fb.rect(x - 3 + q - sd, ey - 12 + Math.round((sd < 0 ? q : 6 - q) * .5), 1, 2, C.ink);   // brows
  }
  for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) if (bayer(i, j) < .5) fb.px(cx + sd * Math.round(34 * s) - 4 + i, cy + 4 + j, C.pink);   // blush
  // nose
  const ny = cy - 2; fb.disc(cx, ny, 4, C.ink); fb.disc(cx, ny, 3, C.sM); fb.px(cx - 1, ny - 1, C.sL);
  // mouth + tongue, by test
  const my = cy + Math.round(22 * s);
  const openMouth = (w, h) => { for (let j = -h; j <= h; j++) for (let i = -w; i <= w; i++) { const d = (i / w) ** 2 + (j / h) ** 2; if (d <= 1.15) fb.px(cx + i, my + j, d > 1 ? C.ink : C.hink); } };
  if (o.test === 0) {                                               // roll your tongue: a tube
    openMouth(15, 9); const w = Math.round(lerp(20, 14, k)), h = Math.round(lerp(8, 20, k));
    tongueRect(fb, cx - (w >> 1), my - 2, w, h, k > .5);
    if (k > .5) { for (let j = 2; j < h - 2; j++) { fb.px(cx - (w >> 1) + 1, my - 2 + j, C.white); fb.px(cx + (w >> 1) - 2, my - 2 + j, C.white); } fb.disc(cx, my + h - 3, Math.max(2, w * .22), C.hink); }
  } else if (o.test === 3) {                                        // clover tongue: three lobes
    openMouth(15, 9); const h = Math.round(lerp(8, 15, k)); tongueRect(fb, cx - 9, my - 2, 18, h, false);
    if (k > .5) for (const dx of [-8, 0, 8]) { fb.disc(cx + dx, my + h, 6, C.ink); fb.disc(cx + dx, my + h, 5, C.pink); fb.disc(cx + dx - 1, my + h - 1, 2, C.hpink); }
    else fb.disc(cx, my + h, 4, C.pink);
  } else if (o.test === 4) {                                        // tongue to nose: it stretches up
    openMouth(13, 8); const top = Math.round(lerp(my - 4, ny + 1, k)), bend = Math.round(Math.sin(t * 20) * (o.strain ? 1 : 0));
    for (let y = my; y >= top; y--) { const w = 5 - Math.round((my - y) / (my - ny + 1) * 1.5); for (let i = -w - 1; i <= w + 1; i++) fb.px(cx + i + bend, y, Math.abs(i) > w ? C.ink : i < -w + 2 ? C.hpink : C.pink); }
    for (let i = -4; i <= 4; i++) fb.px(cx + i + bend, top - 1, C.ink);
    if (k >= 1) for (let q = 0; q < 4; q++) fb.px(cx - 9 + q * 6, ny - 9 - ((t * 12 + q) | 0) % 3, C.white);
  } else if (o.test === 1 || o.test === 2) {
    if (o.strain) { for (let i = -10; i <= 10; i++) fb.rect(cx + i, my + ((i + 10) % 4 < 2 ? 0 : 2), 1, 2, C.ink); }             // gritted
    else { for (let i = -12; i <= 12; i++) fb.rect(cx + i, my + Math.round((1 - (i / 12) ** 2) * 6), 1, 2, C.ink); }
  } else {
    if (o.expr === 'wow') openMouth(7, 8);
    else { for (let i = -13; i <= 13; i++) fb.rect(cx + i, my + Math.round((1 - (i / 13) ** 2) * 7), 1, 2, C.ink); for (let i = -9; i <= 9; i++) for (let j = 1; j < Math.round((1 - (i / 13) ** 2) * 7); j++) fb.px(cx + i, my + j, j > 3 ? C.pink : C.hink); }
  }
  if (o.strain) for (let q = 0; q < 2; q++) { const dx = cx + (q ? -1 : 1) * (R - 6), dy = cy - R + 14 + (((t * 10) | 0) + q * 3) % 8; fb.rect(dx, dy, 2, 4, C.cyan); fb.px(dx, dy - 1, C.cyan); }
  // the hand, for the thumb test
  if (o.test === 1) {
    const hx = cx + R + 6, hy = cy + R - 2, ang = lerp(-Math.PI / 2, -Math.PI / 2 + 1.25, k) + (o.strain ? Math.sin(t * 30) * .06 : 0);
    for (let q = 22; q >= 0; q--) { const px = hx - 6 + Math.cos(ang) * q, py = hy - 10 + Math.sin(ang) * q; fb.disc(px, py, 6, C.ink); }
    for (let q = 22; q >= 0; q--) { const px = hx - 6 + Math.cos(ang) * q, py = hy - 10 + Math.sin(ang) * q; fb.disc(px, py, 5, q > 18 ? C.sL : C.sB); }
    blobDisc(fb, hx, hy + 4, 15, 14);
    for (let q = 0; q < 3; q++) fb.rect(hx - 9 + q * 7, hy + 2, 1, 9, C.sD);
  }
}

// the crowd: 100 people as dots (20 × 5); the first `lit` light up
export function crowd(fb, t, lit, popAt) {
  for (let k = 0; k < 100; k++) {
    const x = 135 + ((k % 20) - 9.5) * 9, y = 388 + Math.floor(k / 20) * 9 + Math.round(Math.sin(t * 5 - (k % 20) * .55) * 1.6), on = k < lit;
    const fresh = on && popAt && t - popAt(k) < .1;
    fb.disc(x, y, fresh ? 4 : 3, C.ink); fb.disc(x, y, fresh ? 3 : 2, on ? (fresh ? C.white : C.cyan) : C.g4);
    if (on) fb.px(x - 1, y - 1, C.white);
  }
}
// 1,600 people (40 × 40); `prog` 0..1 sweeps them in; one of them is you
export function bigCrowd(fb, t, prog) {
  const YOU = 40 * 17 + 23;
  for (let k = 0; k < 1600; k++) {
    const c = k % 40, r = Math.floor(k / 40), ph = (c + r) / 78; if (ph > prog) continue;
    const x = 37 + c * 5, y = 190 + r * 5, fresh = prog - ph < .04;
    fb.rect(x, y, 2, 2, k === YOU ? C.white : fresh ? C.cyan : ((t * 3 + hash(k, 3) * 9) | 0) % 7 ? C.g4 : C.rose);
  }
  if (prog >= 1) { const x = 37 + 23 * 5 + 1, y = 190 + 17 * 5 + 1; for (let a = 0; a < 6.283; a += .1) { const rr = 7 + Math.sin(t * 8) * 2; fb.px(x + Math.cos(a) * rr, y + Math.sin(a) * rr, ((t * 10) | 0) % 2 ? C.white : C.cyan); } fb.rect(x - 2, y - 2, 4, 4, C.white); lineC(fb, 'YOU', x, y - 20, 1, PAL); }
}
export function pips(fb, t, done, cur) {
  lineC(fb, 'TEST', 96, 458, 1, PAL);
  for (let i = 0; i < 5; i++) { const x = 118 + i * 13; fb.rect(x - 1, 457, 10, 10, C.ink); fb.rect(x, 458, 8, 8, i < done ? C.cyan : i === cur && ((t * 4) | 0) % 2 ? C.white : C.g1); if (i < done) { fb.px(x + 2, 462, C.ink); fb.px(x + 3, 463, C.ink); fb.px(x + 4, 462, C.ink); fb.px(x + 5, 461, C.ink); } }
}
