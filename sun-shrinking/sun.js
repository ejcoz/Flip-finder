// sun.js — hero (the Sun with a face), its cut-away, Earth, pyramids, the night-sky ground
import { W, H, C, T, bayer, hash, clamp, lerp, mod } from './px.js';

// Face. expr: calm | sleepy | wake | happy | sweat | strain | wow
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

// Night sky: dithered indigo gradient + twinkling stars + faint dust band
export function sky(fb, t, drift = 0) {
  const G = [C.g0, C.g1, C.g2, C.g3];
  for (let y = 0; y < H; y++) {
    const v = clamp(.15 + .7 * Math.sin(Math.PI * y / H) - (y < 110 ? (110 - y) / 110 * .3 : 0), 0, .999) * 3;
    const k = Math.floor(v), f = v - k;
    for (let x = 0; x < W; x++) fb.px(x, y, G[Math.min(3, k + (bayer(x, y) < f ? 1 : 0))]);
  }
  for (let i = 0; i < 150; i++) {
    const x = Math.round(mod(hash(i, 1) * W - drift * (.3 + hash(i, 4)), W)), y = Math.round(hash(i, 2) * H);
    const tw = ((t * 4 + hash(i, 3) * 9) | 0) % 5;
    if (hash(i, 5) < .12) { const c = tw ? C.white : C.silver; fb.px(x, y, c); if (tw !== 2) { fb.px(x + 1, y, C.steel); fb.px(x - 1, y, C.steel); fb.px(x, y + 1, C.steel); fb.px(x, y - 1, C.steel); } }
    else if (tw) fb.px(x, y, hash(i, 6) < .5 ? C.steel : C.g4);
  }
}

// The Sun: wobbling disc, shaded from the upper left, granulation, ink outline, flame corona. pulse 0..1
export function sun(fb, cx, cy, r, t, expr, pulse = 0, opt = {}) {
  cx = Math.round(cx); cy = Math.round(cy);
  const R = th => r * (1 + .02 * Math.sin(6 * th + t * 3) + .012 * Math.sin(11 * th - t * 5) + pulse * .05);
  const RC = r * 1.32;
  for (let y = Math.floor(cy - RC); y <= cy + RC; y++) for (let x = Math.floor(cx - RC); x <= cx + RC; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx), rr = R(th);
    if (d > rr + .5) {
      // corona flames: noisy tongues, dithered
      if (d > RC) continue;
      const fl = .13 + .045 * Math.sin(5 * th + t * 2.3) + .04 * Math.sin(13 * th - t * 4.1) + .03 * Math.sin(23 * th + t * 7) + .03 * (hash(Math.round(th * 40), (t * 8) | 0) - .5) + pulse * .06;
      const q = (d - rr) / (r * fl); if (q > 1) continue;
      const c = q < .3 ? C.sB : q < .62 ? C.sM : C.sD;
      if (bayer(x, y) < 1 - q * .55) fb.px(x, y, c);
      continue;
    }
    if (d > rr - 1.2) { fb.px(x, y, C.sE); continue; }
    const nx = dx / r, ny = dy / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let li = clamp(-nx * .5 - ny * .55 + nz * .7, 0, 1) + (bayer(x, y) - .5) * .14;
    const gran = hash(Math.floor((x + t * 2) / 3), Math.floor(y / 3), 7);
    if (gran < .18) li -= .12;
    let c = li > .86 ? C.sL : li > .55 ? C.sB : li > .3 ? C.sM : C.sD;
    if (opt.cut && dx > 0) c = null;
    if (c !== null) fb.px(x, y, c);
  }
  // specular
  if (!opt.cut) { fb.rect(cx - Math.round(r * .5), cy - Math.round(r * .55), Math.round(r * .14), Math.round(r * .09), C.white); fb.px(cx - Math.round(r * .32), cy - Math.round(r * .6), C.white); }
  if (expr) face(fb, cx - (opt.cut ? Math.round(r * .45) : 0), cy + Math.round(r * .05), r / 52 * (opt.cut ? .7 : 1), expr, t, opt.look || 0);
}

// Cut-away (right half): core → radiative zone → convection zone, then a photon's random walk out of the core
export function cutaway(fb, cx, cy, r, prog, t) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = cx; x <= cx + r; x++) {
    const d = Math.hypot(x - cx, y - cy); if (d > r - 1) continue;
    const q = d / r;
    let c = q < .25 ? (bayer(x, y) < .6 ? C.white : C.sL) : q < .7 ? (bayer(x, y) < (q - .25) / .45 ? C.sM : C.sB) : C.sD;
    if (q >= .7) { // convection cells
      const a = Math.atan2(y - cy, x - cx), cell = Math.sin(a * 18 + t) * Math.sin((q - .7) * 30);
      if (cell > .3) c = C.sM;
    }
    if (Math.abs(q - .25) < .012 || Math.abs(q - .7) < .01) c = C.sE;
    fb.px(x, y, c);
  }
  for (let y = Math.floor(cy - r); y <= cy + r; y++) fb.px(cx, y, Math.abs(y - cy) < r ? C.sE : T);
  // random walk path, seeded; drawn up to prog (0..1)
  let x = cx + r * .05, y = cy, n = 900, shown = Math.floor(n * prog), last = [x, y];
  for (let i = 0; i < n; i++) {
    const a = hash(i, 77) * Math.PI * 2, step = 2.2;
    let nx = x + Math.cos(a) * step + .012 * step * 5, ny = y + Math.sin(a) * step;   // slight outward drift
    if (nx < cx + 1) nx = cx + 1;
    if (Math.hypot(nx - cx, ny - cy) > r * .93) break;
    if (i < shown) { fb.line(x, y, nx, ny, i > shown - 40 ? C.white : C.cyan); last = [nx, ny]; }
    x = nx; y = ny;
  }
  if (prog > 0) { fb.disc(last[0], last[1], 2, ((t * 10) | 0) % 2 ? C.white : C.cyan); }
  return last;
}

export function earth(fb, cx, cy, r, t) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y); if (d > r) continue;
    if (d > r - 1) { fb.px(cx + x, cy + y, C.ink); continue; }
    const land = Math.sin((x + t * 3) * .5) + Math.sin(y * .7 + (x + t * 3) * .2) > .9;
    let c = land ? C.earthG : C.earthB;
    if (hash(Math.floor(x + t * 4), y >> 1, 3) < .12) c = C.cloud;
    if (x + y > r * .5 && bayer(cx + x, cy + y) < .6) c = C.navy;    // night side
    fb.px(cx + x, cy + y, c);
  }
}

// Pixel pyramid (14×9), lit face left
export function pyramid(fb, x, y, s = 1) {
  const w = 14 * s, h = 9 * s;
  for (let j = 0; j < h; j++) {
    const half = Math.round((j + 1) / h * w / 2);
    for (let i = -half; i <= half; i++) {
      const edge = i === -half || i === half || j === h - 1;
      fb.px(x + i, y - h + 1 + j, edge ? C.ink : i < 0 ? C.sand : i === 0 ? C.tan : (bayer(x + i, y + j) < .5 ? C.tan : C.brown));
    }
  }
  fb.px(x, y - h, C.ink);
}
