// table.js — "52 Cards": the felt table, playing cards, the deck hero, the digits gauge, landing juice
import { W, H, C, T, bayer, hash, clamp, lerp, mod } from './px.js';
import { lineC } from './font.js';

export function face(fb, cx, cy, s, expr, t, look = 0) {
  const ex = Math.round(10 * s), ey = Math.round(cy), ew = Math.max(3, Math.round(4 * s)), eh = Math.max(4, Math.round(6 * s));
  const blink = ((t * 1000) % 3100) < 90;
  for (const side of [-1, 1]) {
    const x0 = cx + side * ex - (ew >> 1) + Math.round(look * s), y0 = ey - (eh >> 1);
    if (expr === 'sleepy' || blink) { fb.rect(x0 - 1, ey, ew + 2, Math.max(1, Math.round(s)), C.ink); continue; }
    if (expr === 'happy') { // ^ ^
      const k = Math.round(s);
      for (let i = 0; i <= ew + 1; i++) { const yy = ey - Math.round((1 - Math.abs(i / (ew + 1) * 2 - 1)) * 3 * s); fb.rect(x0 - 1 + i, yy, 1, k + 1, C.ink); }
      continue;
    }
    const big = expr === 'wow' ? 1 : 0;
    for (let y = -big; y < eh + big; y++) for (let x = -big; x < ew + big; x++) {
      const u = (x + .5) / ew * 2 - 1, v = (y + .5) / eh * 2 - 1; if (u * u + v * v <= 1.25) fb.px(x0 + x, y0 + y, C.ink);
    }
    fb.rect(x0 + 1, y0 + 1, Math.max(1, Math.round(s * 1.4)), Math.max(1, Math.round(s * 1.4)), C.white);
    if (expr === 'strain' || expr === 'sweat') { // worried brows
      for (let i = 0; i < ew + 2; i++) fb.px(x0 - 1 + i, y0 - Math.round(3 * s) + Math.round((side < 0 ? i : ew + 1 - i) * .4), C.ink);
    }
  }
  // blush
  for (const side of [-1, 1]) for (let y = 0; y < Math.round(3 * s); y++) for (let x = 0; x < Math.round(6 * s); x++)
    if (bayer(x, y) < .5) fb.px(cx + side * Math.round(17 * s) - Math.round(3 * s) + x, ey + Math.round(5 * s) + y, C.pink);
  // mouth
  const my = ey + Math.round(7 * s);
  if (expr === 'wow' || expr === 'wake') fb.disc(cx, my + 1, Math.max(1.5, 2 * s), C.ink);
  else if (expr === 'happy') { const mw = Math.round(6 * s); for (let i = -mw; i <= mw; i++) fb.px(cx + i, my + Math.round((1 - (i / mw) ** 2) * 3 * s), C.ink); fb.rect(cx - Math.round(2*s), my + 1, Math.round(4*s), Math.round(2*s), C.hink); }
  else if (expr === 'strain' || expr === 'sweat') { const mw = Math.round(4 * s); for (let i = -mw; i <= mw; i++) fb.px(cx + i, my + ((i + mw) & 1), C.ink); }
  else if (expr === 'sleepy') { fb.rect(cx - 1, my, 3, 1, C.ink); }
  else { const mw = Math.round(3 * s); for (let i = -mw; i <= mw; i++) fb.px(cx + i, my + Math.round((1 - (i / mw) ** 2) * 1.5 * s), C.ink); }
}

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

const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
export const DX = 135, DY = 352;                                   // the deck hero
export const cardSlot = k => [DX + ((k % 13) - 6) * 16, 190 + Math.floor(k / 13) * 23];

export function felt(fb, t) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - DX) / 160, (y - 300) / 190);
    const v = clamp(1.2 - d * 1.05 - (y < 110 ? (110 - y) / 110 * .35 : 0), 0, .999) * 3, k = Math.floor(v);
    let q = Math.min(3, k + (bayer(x, y) < v - k ? 1 : 0));
    if (y > 168) { const ray = Math.sin(.045 * (x + y) + t * 1.1) + Math.sin(.03 * (x - y) - t * .7); if (ray > 1.35 && bayer(x, y) < (ray - 1.35) * 1.5) q = Math.min(4, q + 1); }   // drifting light
    fb.px(x, y, [C.g0, C.g1, C.g2, C.g3, C.g4][q]);
  }
  for (let i = 0; i < 70; i++) {                                    // dust in the lamp light
    const x = Math.round(mod(hash(i, 1) * W + Math.sin(t * .6 + i) * 8, W)), y = Math.round(mod(hash(i, 2) * H - t * (6 + hash(i, 3) * 12), H));
    if (y > 168) fb.px(x, y, i % 4 ? C.g4 : C.green);
  }
}

const SUIT = [   // 7×7 pips: heart, diamond, club, spade
  ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
  ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
  ['..###..', '..###..', '#######', '#######', '##.#.##', '...#...', '..###..'],
  ['...#...', '..###..', '.#####.', '#######', '##.#.##', '...#...', '..###..'],
];
// one playing card, centred on (x, y); w is its current width (flipping), k its index (fixes the suit)
export function card(fb, x, y, k, o = {}) {
  const w = Math.max(2, Math.round(o.w ?? 13)), h = Math.round(o.h ?? 19), x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2), s = Math.floor(hash(k, 91) * 4), red = s < 2;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w; if (edge && (i === -1 || i === w) && (j === -1 || j === h)) continue;
    fb.px(x0 + i, y0 + j, edge ? C.ink : o.back ? ((i + j) % 4 < 2 ? C.blue : C.navy) : o.lit ? C.yL : (i > w - 3 || j > h - 3) ? C.silver : C.white);
  }
  if (!o.back && w >= 11) {
    const g = SUIT[s], c = red ? C.red : C.ink;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (g[j][i] === '#') fb.px(x0 + 3 + i, y0 + 8 + j, c);
    fb.rect(x0 + 2, y0 + 2, 2, 2, c); fb.px(x0 + 4, y0 + 2, c); fb.rect(x0 + w - 4, y0 + h - 4, 2, 2, c);
  }
}

// the hero: the deck, seen from the front, with a face on its top card; it gets thinner as cards leave
export function deck(fb, x, y, left, expr, t, o = {}) {
  const sq = Math.round((o.pump || 0) * 4), w = 48 + sq * 2, h = 62 - sq, th = Math.max(1, Math.round(left / 52 * 12));
  const x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2 + sq);
  for (let l = 1; l <= th; l++) {                                   // the stack under the top card
    for (let i = 0; i < w; i++) fb.px(x0 + i, y0 + h + l, l % 2 ? C.silver : C.white);
    fb.px(x0 - 1, y0 + h + l, C.ink); fb.px(x0 + w, y0 + h + l, C.ink);
  }
  for (let i = 0; i < w; i++) fb.px(x0 + i, y0 + h + th + 1, C.ink);
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w; if (edge && (i === -1 || i === w) && (j === -1 || j === h)) continue;
    const border = i < 3 || i > w - 4 || j < 3 || j > h - 4, inner = i > 4 && i < w - 5 && j > 4 && j < h - 5;
    let c = border ? C.white : ((i + j) % 6 < 3) !== ((i - j + 60) % 6 < 3) ? C.blue : C.navy;
    if (inner && Math.abs(j - h * .5) < 15 && Math.abs(i - w / 2) < 19) c = C.cloud;      // a clear oval for the face
    fb.px(x0 + i, y0 + j, edge ? C.ink : c);
  }
  face(fb, Math.round(x), y0 + Math.round(h * .5), .9, expr, t, 0);
}

// the measuring prop: how many digits the number has, with the landmarks it beats
export function digitsGauge(fb, cx, y, w, digits, t, marks, label) {
  lineC(fb, label, cx, y - 12, 1, PAL);
  const x0 = Math.round(cx - w / 2), h = 10, frac = clamp(digits / 68, 0, 1);
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w;
    if (edge) { if (!((i === -1 || i === w) && (j === -1 || j === h))) fb.px(x0 + i, y + j, C.ink); continue; }
    fb.px(x0 + i, y + j, i < frac * w ? (j < 3 ? C.white : j < 6 ? C.cyan : C.blue) : (bayer(x0 + i, y + j) < .5 ? C.g0 : C.g1));
  }
  for (const [d, name] of marks) { const mx = x0 + Math.round(d / 68 * w); for (let j = -3; j <= h + 2; j++) fb.px(mx, y + j, j < 0 || j >= h ? C.white : C.ink); }
  const gx = x0 + Math.round(mod(t * 70, w)); if (gx < x0 + frac * w - 1) { fb.px(gx, y + 1, C.white); fb.px(gx + 1, y + 1, C.white); fb.px(gx, y + 2, C.white); }
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
