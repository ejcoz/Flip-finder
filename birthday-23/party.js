// party.js — "23 People": the party room, the ring of guests, the web of pairs, the cake hero, the chance gauge
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

const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
export const CXR = 135, CYR = 300, RAD = 104;
const SKIN = [C.red, C.orange, C.lime, C.cyan, C.blue, C.rose, C.pink, C.sand, C.green, C.hpink, C.clay, C.silver];
const HAT = [C.cyan, C.white, C.hot, C.blue, C.lime, C.pink, C.red, C.navy, C.orange, C.cyan, C.white, C.rose];

export function room(fb, t) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - CXR) / 150, (y - CYR - 6) / 165);
    const v = clamp(1.15 - d * 1.05 - (y < 110 ? (110 - y) / 110 * .35 : 0), 0, .999) * 3, k = Math.floor(v);
    fb.px(x, y, [C.g0, C.g1, C.g2, C.g3][Math.min(3, k + (bayer(x, y) < v - k ? 1 : 0))]);
  }
  for (let i = 0; i < 46; i++) {       // slow confetti in the air
    const x = Math.round(mod(hash(i, 1) * W + Math.sin(t * .7 + i) * 6, W)), y = Math.round(mod(hash(i, 2) * H + t * (5 + hash(i, 3) * 8), H));
    if (y < 168) continue;
    fb.px(x, y, [C.g4, C.rose, C.cyan, C.g4, C.pink, C.g4][i % 6]); if (i % 5 === 0) fb.px(x + 1, y, C.g4);
  }
}

export const slot = (i, N) => { const a = -Math.PI / 2 + 2 * Math.PI * i / N; return [CXR + Math.cos(a) * RAD, CYR + Math.sin(a) * RAD]; };

// the web: lines[k] = {i, j, t0}; colour by age; `hot` = [i, j] of the matching pair (drawn last, thick)
export function web(fb, t, lines, N, o = {}) {
  for (let k = 0; k < lines.length; k++) {
    const L = lines[k]; if (t < L.t0) continue;
    const [x0, y0] = slot(L.i, N), [x1, y1] = slot(L.j, N), age = t - L.t0;
    let c = age < .12 ? C.white : age < .35 ? C.pink : age < .8 ? C.rose : C.g4;
    if (o.wave !== undefined) { const ph = mod(k / lines.length - o.wave, 1); if (ph < .08) c = C.cyan; else if (ph < .16) c = C.rose; }
    fb.line(x0, y0, x1, y1, c);
  }
  if (o.hot) {
    const [x0, y0] = slot(o.hot[0], N), [x1, y1] = slot(o.hot[1], N), c = ((t * 12) | 0) % 2 ? C.white : C.cyan;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) fb.line(x0 + dx, y0 + dy, x1 + dx, y1 + dy, dx || dy ? C.cyan : c);
  }
}

export function guest(fb, x, y, r, i, t, o = {}) {
  x = Math.round(x); y = Math.round(y - (o.jump || 0));
  const col = SKIN[i % SKIN.length];
  fb.disc(x, y, r + 1, C.ink); fb.disc(x, y, r, col);
  for (let j = 1; j <= r; j++) for (let k = -r; k <= r; k++) if (k * k + j * j <= r * r && j > r * .45 && bayer(x + k, y + j) < .55) fb.px(x + k, y + j, C.hink);
  if (r >= 6) {
    const e = Math.max(1, Math.round(r * .3)), blink = ((t * 1000 + i * 733) % 3300) < 90;
    for (const s of [-1, 1]) { if (blink) fb.rect(x + s * e - 1, y, 2, 1, C.ink); else { fb.rect(x + s * e - 1, y - 1, 2, 3, C.ink); fb.px(x + s * e - 1, y - 1, C.white); } }
    if (o.happy) for (let k = -2; k <= 2; k++) fb.px(x + k, y + 3 + (Math.abs(k) < 2 ? 1 : 0), C.ink); else fb.rect(x - 1, y + 4, 3, 1, C.ink);
    const h = HAT[i % HAT.length];                      // party hat
    for (let j = 0; j < 7; j++) { const w = Math.round(j * .6); fb.rect(x - w - 1, y - r - 7 + j, 2 * w + 3, 1, C.ink); }
    for (let j = 0; j < 7; j++) { const w = Math.round(j * .6); fb.rect(x - w, y - r - 7 + j, 2 * w + 1, 1, j % 3 === 1 ? C.white : h); }
    fb.px(x, y - r - 8, C.white);
  } else { fb.px(x - 1, y, C.ink); fb.px(x + 1, y, C.ink); }
}

// the hero: a birthday cake with a face and one candle
export function cake(fb, x, y, expr, t, o = {}) {
  const sq = Math.round((o.pump || 0) * 3), w = 54 + sq * 2, h = 34 - sq, x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2 + sq);
  for (let j = -3; j <= 3; j++) for (let k = -w / 2 - 8; k <= w / 2 + 8; k++) if ((k / (w / 2 + 8)) ** 2 + (j / 3.5) ** 2 <= 1) fb.px(x + k, y0 + h + j, Math.abs(j) === 3 || Math.abs(k) > w / 2 + 6 ? C.ink : j > 0 ? C.steel : C.silver);   // plate
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w; if (edge && (i === -1 || i === w) && (j === -1 || j === h)) continue;
    const drip = 9 + Math.round(Math.sin(i * .55) * 3 + Math.sin(i * 1.3) * 1.5);
    let c = j < drip ? (j < 3 ? C.hpink : C.pink) : (i > w - 7 ? C.tan : (j - drip) % 9 === 4 ? C.skinS : C.sand);
    if (j === drip) c = C.rose;
    fb.px(x0 + i, y0 + j, edge ? C.ink : c);
  }
  for (let i = 4; i < w - 4; i += 8) fb.rect(x0 + i, y0 + 3, 2, 2, [C.cyan, C.white, C.lime, C.blue][(i >> 3) % 4]);   // sprinkles
  // candle + flame
  const cx = Math.round(x), cy0 = y0 - 13;
  for (let j = 0; j < 13; j++) { fb.px(cx - 2, cy0 + j, C.ink); fb.px(cx + 2, cy0 + j, C.ink); for (let i = -1; i <= 1; i++) fb.px(cx + i, cy0 + j, (j + i) % 4 < 2 ? C.white : C.red); }
  fb.rect(cx - 1, cy0 - 1, 3, 1, C.ink);
  const fl = ((t * 12) | 0) % 3;
  if (!o.out) { fb.disc(cx + (fl === 1 ? 1 : 0), cy0 - 5, 3, C.orange); fb.disc(cx, cy0 - 4, 2, C.sL); fb.px(cx + (fl === 2 ? -1 : 0), cy0 - 9, C.orange); fb.px(cx, cy0 - 4, C.white); }
  face(fb, Math.round(x), y0 + Math.round(h * .62), .78, expr, t, 0);
}

export function gauge(fb, cx, y, w, frac, t, label) {
  lineC(fb, label, cx, y - 12, 1, PAL);
  const x0 = Math.round(cx - w / 2), h = 10;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w;
    if (edge) { if (!((i === -1 || i === w) && (j === -1 || j === h))) fb.px(x0 + i, y + j, C.ink); continue; }
    const fill = i < frac * w;
    fb.px(x0 + i, y + j, fill ? (j < 3 ? C.white : j < 6 ? C.cyan : C.blue) : (bayer(x0 + i, y + j) < .5 ? C.g0 : C.g1));
  }
  const mx = x0 + Math.round(w / 2);                       // the 50 % mark
  for (let j = -4; j <= h + 3; j++) fb.px(mx, y + j, j < 0 || j >= h ? C.white : C.ink);
  lineC(fb, '50%', mx, y + h + 6, 1, PAL);
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
