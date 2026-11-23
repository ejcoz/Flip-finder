// world.js — "Paper to the Moon": the log-altitude view (tower, sky zones, landmarks, stars), the desk portrait, the Earth–Moon shot
import { W, H, C, T, bayer, hash, clamp, lerp, mod } from './px.js';
import { lineC, line as textLine, textW } from './font.js';

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
export const PPD = 70, YTOP = 300, CX = 135;
const yOf = (la, logH) => Math.round(YTOP + (logH - la) * PPD);

// ——— small pixel icons, centred on (x, y) ———
const R = (fb, x, y, w, h, c) => fb.rect(Math.round(x), Math.round(y), w, h, c);
function box(fb, x, y, w, h, c, ink = C.ink) { R(fb, x - 1, y - 1, w + 2, h + 2, ink); R(fb, x, y, w, h, c); }
const ICON = {
  coin(fb, x, y) { fb.disc(x, y, 6, C.ink); fb.disc(x, y, 5, C.silver); fb.disc(x - 1, y - 1, 3, C.white); fb.px(x, y, C.steel); },
  mug(fb, x, y) { box(fb, x - 6, y - 7, 12, 14, C.white); R(fb, x - 6, y + 3, 12, 4, C.silver); R(fb, x + 7, y - 4, 3, 1, C.ink); R(fb, x + 9, y - 3, 1, 6, C.ink); R(fb, x + 7, y + 3, 3, 1, C.ink); R(fb, x - 5, y - 6, 10, 2, C.dbrown); },
  you(fb, x, y) { fb.disc(x, y - 9, 4, C.ink); fb.disc(x, y - 9, 3, C.skin); box(fb, x - 3, y - 4, 7, 9, C.red); R(fb, x - 3, y + 6, 3, 6, C.navy); R(fb, x + 1, y + 6, 3, 6, C.navy); R(fb, x - 4, y + 5, 9, 1, C.ink); },
  house(fb, x, y) { box(fb, x - 9, y - 2, 18, 12, C.sand); for (let i = 0; i < 11; i++) R(fb, x - 11 + i, y - 3 - i, 22 - 2 * i, 1, i === 0 ? C.ink : C.crimson); R(fb, x - 2, y + 3, 5, 7, C.dbrown); R(fb, x + 4, y + 1, 3, 3, C.cyan); },
  tower(fb, x, y) { box(fb, x - 6, y - 16, 12, 32, C.steel); for (let j = 0; j < 7; j++) for (let i = 0; i < 3; i++) R(fb, x - 5 + i * 4, y - 14 + j * 4, 2, 2, (i + j) % 3 ? C.cyan : C.white); },
  spire(fb, x, y) { for (let j = 0; j < 40; j++) { const w = 1 + Math.floor(j / 5); R(fb, x - w - 1, y - 20 + j, 2 * w + 3, 1, C.ink); } for (let j = 0; j < 40; j++) { const w = 1 + Math.floor(j / 5); R(fb, x - w, y - 20 + j, 2 * w + 1, 1, j % 5 === 4 ? C.steel : C.silver); R(fb, x, y - 20 + j, w + 1, 1, C.steel); } R(fb, x, y - 26, 1, 6, C.ink); },
  everest(fb, x, y) { for (let j = 0; j < 22; j++) { const w = j + 1; R(fb, x - w - 1, y - 10 + j, 2 * w + 3, 1, C.ink); } for (let j = 0; j < 22; j++) { const w = j + 1; R(fb, x - w, y - 10 + j, 2 * w + 1, 1, j < 7 ? C.white : C.slate); R(fb, x + 1, y - 10 + j, w, 1, j < 6 ? C.silver : C.dslate); } },
  jet(fb, x, y) { R(fb, x - 11, y - 1, 22, 4, C.ink); R(fb, x - 10, y, 20, 2, C.white); R(fb, x - 3, y - 5, 5, 12, C.ink); R(fb, x - 2, y - 4, 3, 10, C.silver); R(fb, x - 11, y - 4, 3, 4, C.ink); R(fb, x - 10, y - 3, 1, 3, C.red); R(fb, x + 8, y, 2, 1, C.cyan); },
  iss(fb, x, y) { R(fb, x - 14, y - 1, 28, 3, C.ink); R(fb, x - 13, y, 26, 1, C.silver); for (const s of [-1, 1]) { box(fb, x + s * 10 - 3, y - 7, 6, 5, C.blue); box(fb, x + s * 10 - 3, y + 3, 6, 5, C.blue); } box(fb, x - 3, y - 3, 6, 7, C.white); },
  sun(fb, x, y) { fb.disc(x, y, 13, C.sE); fb.disc(x, y, 12, C.sM); fb.disc(x - 1, y - 1, 9, C.sB); fb.disc(x - 3, y - 3, 4, C.sL); },
  star(fb, x, y) { for (let i = -6; i <= 6; i++) { fb.px(x + i, y, Math.abs(i) < 3 ? C.white : C.cyan); fb.px(x, y + i, Math.abs(i) < 3 ? C.white : C.cyan); } fb.disc(x, y, 2, C.white); },
  galaxy(fb, x, y) { for (let a = 0; a < 40; a += .12) { const r = 1.2 + a * .55; for (const s of [0, Math.PI]) { const px = x + Math.cos(a * .5 + s) * r * 1.5, py = y + Math.sin(a * .5 + s) * r * .7; if (bayer(px | 0, py | 0) < .8) fb.px(px, py, r < 6 ? C.white : r < 13 ? C.cyan : C.rose); } } fb.disc(x, y, 3, C.white); },
  edge(fb, x, y) { for (let a = 0; a < 6.283; a += .02) { const px = x + Math.cos(a) * 20, py = y + Math.sin(a) * 9; fb.px(px, py, C.pink); if (bayer(px | 0, py | 0) < .5) fb.px(x + Math.cos(a) * 23, y + Math.sin(a) * 11, C.plum); } },
};
export const MARKS = [   // [height m, label, icon, side]
  [2e-3, 'A COIN', 'coin', -1], [0.1, 'A MUG', 'mug', 1], [1.7, 'YOU', 'you', -1], [6, 'A HOUSE', 'house', 1],
  [100, '30 FLOORS', 'tower', -1], [828, 'TALLEST BUILDING', 'spire', 1], [8849, 'EVEREST', 'everest', -1], [11000, 'JETS', 'jet', 1],
  [1e5, 'EDGE OF SPACE', null, 0], [4e5, 'SPACE STATION', 'iss', -1], [3.844e8, 'THE MOON', 'moon', 1],
  [1.5e11, 'THE SUN', 'sun', -1], [4e16, 'NEAREST STAR', 'star', 1], [1e21, 'MILKY WAY', 'galaxy', -1], [2.4e22, 'ANDROMEDA', 'galaxy', 1], [8.8e26, 'EDGE OF SIGHT', 'edge', 0],
];
export function moon(fb, x, y, r, expr, t) {
  fb.disc(x, y, r + 1, C.ink); fb.disc(x, y, r, C.silver);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j); if (d > r) continue; if (i + j > r * .55 && bayer(x + i, y + j) < .7) fb.px(x + i, y + j, C.steel); else if (i + j < -r * .5) fb.px(x + i, y + j, C.white); }
  for (const [cx, cy, cr] of [[-.45, -.35, .18], [.4, .45, .22], [.5, -.3, .12], [-.2, .55, .1]]) { fb.disc(x + cx * r, y + cy * r, cr * r, C.steel); fb.disc(x + cx * r + 1, y + cy * r + 1, cr * r * .7, C.slate); }
  if (expr) face(fb, x, y - Math.round(r * .05), r / 40, expr, t);
}

// ——— the log-altitude view: every row is an altitude; the tower top stays at YTOP ———
export function logScene(fb, t, logH, o = {}) {
  for (let y = 0; y < H; y++) {
    const la = logH + (YTOP - y) / PPD;
    for (let x = 0; x < W; x++) {
      const bx = bayer(x, y); let c;
      if (la < .4) c = bx < clamp((la + 4.5) / 6, 0, 1) * .7 ? C.dbrown : C.umber;                     // the room
      else if (la < 4) { const k = (la - .4) / 3.6; c = k < .12 ? (bx < k / .12 ? C.blue : C.cyan) : bx < (k - .12) / .88 ? C.navy : C.blue; }   // day sky
      else if (la < 5) { const k = la - 4; c = k < .5 ? (bx < k * 2 ? C.night : C.navy) : (bx < (k - .5) * 2 ? C.ink : C.night); }
      else { c = C.ink; if (la > 9) { const n = Math.sin(x * .05 + la * 3) + Math.sin(x * .021 - la * 5.1); if (n > 1.25 && bx < .3) c = C.g2; } }
      fb.px(x, y, c);
    }
  }
  // room wallpaper dots + clouds + stars (all live in log-altitude space, so they scroll with the folds)
  for (let i = 0; i < 60; i++) { const la = -4.6 + hash(i, 31) * 5, y = yOf(la, logH); if (y > -4 && y < H && la < .35) fb.rect(Math.round(hash(i, 32) * W), y, 2, 2, C.dbrown); }
  for (let i = 0; i < 16; i++) {
    const la = 2.6 + hash(i, 41) * 1.35, y = yOf(la, logH); if (y < 176 || y > H + 12) continue;
    const x0 = hash(i, 42) * W + Math.sin(t * .3 + i) * 4, rw = 12 + hash(i, 43) * 12;
    for (let j = -4; j <= 4; j++) for (let k = -rw; k <= rw; k++) if ((k / rw) ** 2 + (j / 4.5) ** 2 < 1 && bayer(x0 + k | 0, y + j) < .85) fb.px(x0 + k, y + j, j > 1 ? C.silver : C.white);
  }
  for (let i = 0; i < 800; i++) {
    const la = 4.7 + hash(i, 51) * 23.5, y = yOf(la, logH); if (y < 0 || y >= H) continue;
    const x = Math.round(hash(i, 52) * W), tw = ((t * 4 + hash(i, 53) * 9) | 0) % 5;
    fb.px(x, y, tw ? (hash(i, 54) < .3 ? C.white : C.steel) : C.dslate);
    if (hash(i, 55) < .06 && tw !== 2) { fb.px(x + 1, y, C.steel); fb.px(x - 1, y, C.steel); fb.px(x, y + 1, C.steel); fb.px(x, y - 1, C.steel); }
  }
  // speed streaks
  if (o.speed > 0) for (let i = 0; i < 14; i++) {
    const x = Math.round(hash(i, 61) * W), y = mod(hash(i, 62) * H + t * (500 + 500 * o.speed), H), len = 8 + o.speed * 22;
    if (Math.abs(x - CX) < 26) continue;
    for (let k = 0; k < len; k++) if (bayer(x, (y + k) | 0) < .6) fb.px(x, y + k, logH > 4.6 ? C.dslate : C.white);
  }
  // landmarks
  for (const [h, label, icon, side] of MARKS) {
    const y = yOf(Math.log10(h), logH); if (y < (icon === 'moon' ? 196 : 182) || y > H + 40) continue;
    if (side === 0) {
      for (let x = 0; x < W; x++) if ((x >> 2) & 1) fb.px(x, y, icon ? C.pink : C.cyan);
      if (icon) ICON[icon](fb, CX, y);
      textLine(fb, label, 6, y - 10, 1, PAL);
    } else {
      const x = CX + side * 76;
      for (let k = CX + side * 10; side > 0 ? k < x - 16 : k > x + 16; k += side * 3) fb.px(k, y, C.silver);
      if (icon === 'moon') moon(fb, x - 14, y, 30, o.moonExpr || 'calm', t); else ICON[icon](fb, x, y);
      lineC(fb, label, clamp(x - (icon === 'moon' ? 14 : 0), textW(label, 1) / 2 + 3, W - textW(label, 1) / 2 - 3), y + (icon === 'moon' ? 36 : icon === 'spire' || icon === 'everest' ? 24 : 20), 1, PAL);
    }
  }
  // the paper tower
  for (let y = YTOP; y < H; y++) for (let i = -8; i <= 8; i++) fb.px(CX + i, y, Math.abs(i) === 8 ? C.ink : i > 4 ? C.silver : C.white);
  const L0 = -4, D = Math.log10(2);
  for (let k = Math.floor((logH - (H - YTOP) / PPD - L0) / D); k <= (logH - L0) / D + 1e-6; k++) { const y = yOf(L0 + k * D, logH); if (y > YTOP + 1 && y < H) for (let i = -7; i <= 7; i++) fb.px(CX + i, y, i > 4 ? C.steel : C.silver); }
  for (let i = -8; i <= 8; i++) fb.px(CX + i, YTOP, C.ink);
  // the hero: the top sheet, riding the tower
  const sq = Math.round((o.pump || 0) * 4), hw = 19 + Math.round((o.pump || 0) * 2), hh = 28 - sq, x0 = CX - hw, y0 = YTOP - hh;
  for (let j = -1; j <= hh; j++) for (let i = -1; i <= 2 * hw; i++) {
    const edge = j === -1 || j === hh || i === -1 || i === 2 * hw; const corner = i > 2 * hw - 8 && j < 7 && (i - (2 * hw - 8)) + (7 - j) > 7;
    if (corner) { if ((i - (2 * hw - 8)) + (7 - j) === 8) fb.px(x0 + i, y0 + j, C.ink); continue; }
    fb.px(x0 + i, y0 + j, edge ? C.ink : (i > 2 * hw - 5 || j > hh - 4) ? C.silver : C.white);
  }
  for (let k = 0; k < 7; k++) fb.px(x0 + 2 * hw - 8 + k, y0 + 7 - k - 1 + 1, C.steel);
  face(fb, CX, y0 + Math.round(hh * .48), .62, o.expr || 'happy', t, 0);
  if (logH > 4.9) { // a bubble helmet in space
    for (let a = 0; a < 6.283; a += .03) { const px = CX + Math.cos(a) * 27, py = y0 + hh / 2 + Math.sin(a) * 22; if (py < YTOP + 2) fb.px(px, py, a > 3.6 && a < 4.6 ? C.white : C.cyan); }
  }
}

// ——— the desk portrait: hook, record (12 folds) and CTA ———
export function deskScene(fb, t, o = {}) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = clamp(.25 + .6 * Math.sin(Math.PI * y / 420) - (y < 110 ? (110 - y) / 110 * .3 : 0), 0, .999) * 3, k = Math.floor(v);
    fb.px(x, y, [C.g0, C.g1, C.g2, C.g3][Math.min(3, k + (bayer(x, y) < v - k ? 1 : 0))]);
  }
  for (let i = 0; i < 40; i++) { const x = Math.round(hash(i, 71) * W), y = 110 + Math.round(hash(i, 72) * 230); if (((t * 3 + i) | 0) % 4) fb.px(x, y, C.g4); }
  const dy = 352;                                              // desk top
  for (let y = dy; y < H; y++) for (let x = 0; x < W; x++) {
    let c = y === dy ? C.ink : y < dy + 4 ? C.clay : bayer(x, y) < .45 ? C.brown : C.dbrown;
    if (y > dy + 4 && ((y * 3 + Math.round(Math.sin(x * .07 + y * .5) * 2)) % 17 === 0)) c = C.dbrown;
    fb.px(x, y, c);
  }
  const sh = o.shake ? Math.round((hash((t * 30) | 0, 9) - .5) * 2 * o.shake) : 0;
  if (o.mode === 'block') {
    const w = 34, h = 46, x0 = CX - w / 2 + sh, y0 = dy - h + 2;
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
      const bulge = Math.round(Math.sin((j / h) * Math.PI) * 3); const xi = x0 + i + (i < w / 2 ? -bulge : bulge);
      const edge = j === -1 || j === h || i === -1 || i === w;
      fb.px(xi, y0 + j, edge ? C.ink : (j % 3 === 2 ? C.steel : i > w - 6 ? C.silver : C.white));
    }
    for (let j = 0; j < h; j++) { const bulge = Math.round(Math.sin((j / h) * Math.PI) * 3); for (let i = -bulge; i < w + bulge; i++) if (j % 3 !== 2 && i >= 6 && i < w - 6 && j > 10 && j < 34) fb.px(x0 + i, y0 + j, C.white); }
    face(fb, CX + sh, y0 + 22, .6, 'strain', t, 0);
    for (let k = 0; k < 2; k++) { const dx = CX + (k ? -26 : 26), dyy = y0 + 4 + ((((t * 10) | 0) + k * 3) % 7); fb.rect(dx, dyy, 2, 3, C.cyan); fb.px(dx, dyy - 1, C.cyan); }
    // a ruler beside it
    for (let j = 0; j < 70; j++) { fb.px(CX + 44, dy - j, C.ink); fb.px(CX + 52, dy - j, C.ink); for (let i = 45; i < 52; i++) fb.px(CX + i, dy - j, C.sand); if (j % 5 === 0) for (let i = 45; i < (j % 10 ? 48 : 50); i++) fb.px(CX + i, dy - j, C.dbrown); }
    for (let i = 44; i <= 52; i++) fb.px(CX + i, dy - 70, C.ink);
  } else {
    const k = o.foldK || 0, w = Math.round(104 * (1 - .5 * k)), h = 132, x0 = Math.round(CX - w / 2), y0 = dy - h + 4 + Math.round(Math.sin(t * 2.2) * 2);
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
      const edge = j === -1 || j === h || i === -1 || i === w; const corner = i > w - 14 && j < 13 && (i - (w - 14)) + (13 - j) > 13;
      if (corner) { if ((i - (w - 14)) + (13 - j) === 14) fb.px(x0 + i, y0 + j, C.ink); continue; }
      fb.px(x0 + i, y0 + j, edge ? C.ink : (i > w - 5 || j > h - 5) ? C.silver : C.white);
    }
    for (let q = 0; q < 13; q++) fb.px(x0 + w - 14 + q, y0 + 13 - q, C.steel);
    if (k < .05) for (let j = 6; j < h - 6; j++) if ((j >> 2) & 1) fb.px(x0 + (w >> 1), y0 + j, C.silver);          // the crease to fold along
    if (k > 0) for (let j = 0; j < h; j++) { fb.px(x0 + w + 1, y0 + j + 2, C.ink); fb.px(x0 + w, y0 + j + 2, C.silver); }  // doubled layer
    face(fb, CX, y0 + Math.round(h * .46), 1.15, o.expr || 'happy', t, 0);
  }
}

// ——— the pay-off portrait: Earth, the Moon, and a line of paper between them ———
export function moonShot(fb, t, k) {
  fb.clear(C.ink);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = Math.sin(x * .03 + y * .011) + Math.sin(y * .027 - x * .013); if (n > 1.3 && bayer(x, y) < .3) fb.px(x, y, C.g2); }
  for (let i = 0; i < 220; i++) { const x = Math.round(hash(i, 81) * W), y = Math.round(hash(i, 82) * H), tw = ((t * 4 + hash(i, 83) * 9) | 0) % 5; fb.px(x, y, tw ? (hash(i, 84) < .3 ? C.white : C.steel) : C.dslate); }
  const ex = 58, ey = 418, er = 44, mx = 198, my = 222, mr = 34;
  for (let j = -er; j <= er; j++) for (let i = -er; i <= er; i++) {
    const d = Math.hypot(i, j); if (d > er) continue;
    if (d > er - 1.2) { fb.px(ex + i, ey + j, C.ink); continue; }
    const land = Math.sin((i + t * 3) * .16) + Math.sin(j * .21 + (i + t * 3) * .07) > .8;
    let c = land ? C.earthG : C.earthB; if (hash(Math.floor((i + t * 4) / 2), j >> 1, 3) < .1) c = C.cloud;
    if (i + j > er * .55 && bayer(ex + i, ey + j) < .65) c = C.navy;
    fb.px(ex + i, ey + j, c);
  }
  // the paper: from Earth's top to the Moon's edge
  const x0 = ex + 22, y0 = ey - 38, x1 = mx - 27, y1 = my + 22, n = Math.round(Math.hypot(x1 - x0, y1 - y0) * clamp(k, 0, 1));
  for (let s = 0; s <= n; s++) { const u = s / Math.hypot(x1 - x0, y1 - y0), x = lerp(x0, x1, u), y = lerp(y0, y1, u); fb.rect(Math.round(x) - 1, Math.round(y) - 1, 4, 4, C.ink); }
  for (let s = 0; s <= n; s++) { const u = s / Math.hypot(x1 - x0, y1 - y0), x = lerp(x0, x1, u), y = lerp(y0, y1, u); fb.rect(Math.round(x), Math.round(y), 2, 2, (s >> 2) & 1 ? C.white : C.silver); }
  moon(fb, mx, my, mr, k >= 1 ? (t % 3 < 2.6 ? 'wow' : 'happy') : 'calm', t);
  if (k >= 1) { lineC(fb, '384,400 KM', 118, 338, 1, PAL); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + t * 1.2, r = mr + 9 + Math.sin(t * 6 + i) * 2; if (((t * 12 + i) | 0) % 2) fb.px(mx + Math.cos(a) * r, my + Math.sin(a) * r, C.yL); } }
}
