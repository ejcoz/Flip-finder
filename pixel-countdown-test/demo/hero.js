// hero.js — the demo's hero: a heart with a face. Implicit shape → distance field → 3-tone shading from the upper left, rim, ink outline, hard specular.
import { C, T, bayer, clamp } from './px.js';

const cache = new Map();
// Heart mask for a box w×h (classic implicit heart, flipped)
function heartMask(w, h) {
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = ((x + .5) / w * 2 - 1) * 1.18, Y = -(((y + .5) / h) * 2.3 - 1.25);
    const a = X * X + Y * Y - 1; if (a * a * a - X * X * Y * Y * Y <= 0) m[y * w + x] = 1;
  }
  return m;
}
// Chamfer distance to the outside (inside pixels only)
function distField(m, w, h) {
  const D = new Float32Array(w * h).fill(1e9);
  for (let i = 0; i < w * h; i++) if (!m[i]) D[i] = 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : D[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!m[i]) continue;
    D[i] = Math.min(D[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414); }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!m[i]) continue;
    D[i] = Math.min(D[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414); }
  return D;
}
function shapeSprite(w, h) {
  const key = w + 'x' + h; if (cache.has(key)) return cache.get(key);
  const m = heartMask(w, h), D = distField(m, w, h);
  let mx = 0; for (const v of D) if (v < 1e8 && v > mx) mx = v;
  const H = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) H[i] = m[i] ? Math.sqrt(Math.min(1, D[i] / (mx * .85))) : 0;
  const d = new Uint8Array(w * h).fill(T);
  const L = [-.55, -.62, .56];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!m[i]) continue;
    const hx = (H[i + 1] ?? 0) - (H[i - 1] ?? 0), hy = (H[i + w] ?? 0) - (H[i - w] ?? 0);
    const k = Math.max(w, h) * .055;
    let nx = -hx * k, ny = -hy * k, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const li = clamp(nx * L[0] + ny * L[1] + nz * L[2], 0, 1) * .85 + H[i] * .25;
    const v = li + (bayer(x, y) - .5) * .12;
    let c = v > .9 ? C.hpink : v > .55 ? C.red : v > .36 ? C.crimson : C.hdeep;
    if (D[i] <= 1.5) c = C.ink; else if (D[i] <= 2.5) c = (y > h * .45 || x > w * .6) ? C.hink : C.hdeep;
    d[i] = c;
  }
  // hard specular blob, upper-left lobe
  const sx = Math.round(w * .24), sy = Math.round(h * .17), r = Math.max(2, Math.round(w * .035));
  for (let y = -r; y <= r; y++) for (let x = -Math.round(r * 1.4); x <= Math.round(r * 1.4); x++)
    if ((x / 1.4) ** 2 + y * y <= r * r && d[(sy + y) * w + sx + x] !== T) d[(sy + y) * w + sx + x] = C.white;
  const s = { w, h, d }; cache.set(key, s); return s;
}

// Face. expr: calm | sleepy | wake | happy | sweat | strain | wow
function face(fb, cx, cy, s, expr, t, look = 0) {
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

// Draw heart centred at (cx, cy) with base width bw. pump 0..1 (1 = squeezed). expr, t for blink.
export function heart(fb, cx, cy, bw, pump, expr, t, opt = {}) {
  const sq = pump * .09;
  const w = Math.round(bw * (1 - sq)), h = Math.round(bw * .92 * (1 + sq * .6));
  const spr = shapeSprite(w, h);
  const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = spr.d[y * w + x]; if (c !== T) fb.px(x0 + x, y0 + y, c); }
  const s = bw / 82;
  face(fb, Math.round(cx), Math.round(y0 + h * .5), s, expr, t + (opt.blinkOff || 0), opt.look || 0);
  if (expr === 'sweat' || expr === 'strain') { // sweat drop
    const dx = Math.round(cx + w * .36), dy = Math.round(y0 + h * .18 + ((t * 12) | 0) % 6);
    fb.rect(dx, dy, 2, 3, C.cyan); fb.px(dx, dy - 1, C.cyan); fb.px(dx + 1, dy + 1, C.white);
  }
  return { x0, y0, w, h };
}
