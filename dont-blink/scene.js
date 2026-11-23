// scene.js — mood ground (teal-navy, dithered), drifting cell rings, floating sparkles, ECG paper plane (mode-7)
import { W, H, C, bayer, hash, clamp, mod } from './px.js';

const GROUND = [C.g0, C.g1, C.g2, C.g3];
// Vertical dithered gradient: darker top (caption zone stays quiet), lighter around the hero
export function ground(fb, t, yOff = 0) {
  for (let y = 0; y < H; y++) {
    const v = clamp(.35 + .55 * Math.sin(Math.PI * clamp((y + yOff) / H, 0, 1)) - (y < 110 ? (110 - y) / 110 * .45 : 0), 0, .999) * 3;
    const k = Math.floor(v), f = v - k;
    for (let x = 0; x < W; x++) fb.px(x, y, GROUND[Math.min(3, k + (bayer(x, y) < f ? 1 : 0))]);
  }
  // cell rings: big dithered circles drifting slowly upward (blood-cell pattern)
  for (let i = 0; i < 14; i++) {
    const r = 9 + hash(i, 3) * 16, sp = 3 + hash(i, 5) * 4;
    const cx = Math.round(hash(i, 1) * (W + 40) - 20 + Math.sin(t * .4 + i) * 3);
    const cy = Math.round(mod(hash(i, 2) * (H + 80) - t * sp - yOff * .6, H + 80) - 40);
    if (cy < 95) continue;
    for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y);
      if (d <= r && d > r - 3.2) { if (bayer(cx + x, cy + y) < .55) fb.px(cx + x, cy + y, C.g4); }
      else if (d <= r * .45 && bayer(cx + x, cy + y) < .3) fb.px(cx + x, cy + y, C.g3);
    }
  }
  // twinkling motes
  for (let i = 0; i < 40; i++) {
    const x = Math.round(hash(i, 7) * W), y = Math.round(mod(hash(i, 8) * H - t * 2 - yOff * .3, H));
    if (y < 100) continue;
    if (((t * 4 + hash(i, 9) * 8) | 0) % 3 === 0) fb.px(x, y, C.g4); else if (hash(i, 10) < .25) fb.px(x, y, C.steel);
  }
}

// Soft dithered floor shadow under the hero
export function shadow(fb, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue;
    if (bayer(cx + x, cy + y) < (1 - d) * .9) fb.px(cx + x, cy + y, C.g0);
  }
}

// ECG trace: a P-QRS-T beat every `period` world units
export function ecg(z, period = 6) {
  const p = mod(z, period) / period;
  const g = (c, w, a) => a * Math.exp(-(((p - c) / w) ** 2));
  return g(.18, .03, .35) - g(.30, .008, .5) + g(.33, .012, 2.6) - g(.36, .01, .9) + g(.6, .05, .6);
}
// Mode-7 ECG paper plane below a horizon. camH = camera height, f = focal length (px), scroll = world z offset
export function ecgPlane(fb, horizon, t, camH = 1.6, f = 150, scroll = 0) {
  const cx = W / 2;
  for (let y = Math.max(0, Math.ceil(horizon) + 1); y < H; y++) {
    const dz = camH * f / (y - horizon);           // distance along the floor
    const z = dz + scroll;
    const fog = clamp((dz - 4) / 30, 0, 1);
    for (let x = 0; x < W; x++) {
      const wx = (x - cx) * dz / f;
      // grid: minor 0.5, major 2.5 world units
      const mx = Math.abs(mod(wx + .25, .5) - .25), mz = Math.abs(mod(z + .25, .5) - .25);
      const Mx = Math.abs(mod(wx + 1.25, 2.5) - 1.25), Mz = Math.abs(mod(z + 1.25, 2.5) - 1.25);
      const lw = .022 * dz * 1.4 / camH;
      let c = C.e0;
      if (mx < lw || mz < lw) c = C.e1;
      if (Mx < lw * 1.6 || Mz < lw * 1.6) c = C.e2;
      // the trace runs along z (toward the horizon) at wx ≈ ecg(z)
      const tr = ecg(z) * 1.1 - .2;
      if (Math.abs(wx - tr) < Math.max(.06, lw * 2.2)) c = C.eT;
      if (bayer(x, y) < fog) c = fog > .7 && bayer(x + 1, y) < fog ? C.g0 : C.g1;
      fb.px(x, y, c);
    }
  }
}

// Ribcage behind the hero: curved bone bands from each edge toward the centre, a dim sternum. breathe = 0..1 (ribs lift 1–2 px)
export function ribs(fb, cx, top, n = 5, gap = 44, breathe = 0) {
  const tone = (v) => v < .22 ? C.skinS : v < .7 ? C.brown : C.dbrown;
  for (let i = 0; i < n; i++) {
    const y0 = top + i * gap - Math.round(breathe * (2 - i * .3)), th = 8 - (i > 2 ? 1 : 0);
    for (const side of [-1, 1]) {
      const xa = cx + side * 7, xb = side < 0 ? -6 : W + 6, len = Math.abs(xb - xa);
      for (let s = 0; s <= len; s++) {
        const x = xa + side * s, u = s / len;
        const yc = y0 + Math.round(34 * Math.pow(u, 1.4) - 10 * u * (1 - u));
        for (let k = -1; k <= th; k++) {
          const y = yc + k;
          if (k === -1 || k === th) { fb.px(x, y, C.ink); continue; }
          fb.px(x, y, tone(k / (th - 1) + (bayer(x, y) - .5) * .25));
        }
      }
    }
  }
  // sternum
  for (let y = top - 12; y < top + (n - 1) * gap + 30; y++) for (let x = cx - 8; x <= cx + 8; x++) {
    if (x === cx - 8 || x === cx + 8) fb.px(x, y, C.ink); else fb.px(x, y, (x - cx) < -4 ? C.skinS : bayer(x, y) < .6 ? C.brown : C.dbrown);
  }
}

// Pulse gauge on a post (the measuring prop). frac 0..1, labels every `step` beats from 0..max
export function gauge(fb, x, top, bottom, frac, max = 20, step = 5, flash = 0) {
  const w = 22, x0 = x - (w >> 1);
  // post
  for (let y = top - 10; y < H; y++) for (let i = -15; i <= 15; i++) {
    const v = (i + 15) / 30; const X = x + i;
    if (i === -15 || i === 15) { fb.px(X, y, C.ink); continue; }
    fb.px(X, y, v < .2 ? C.clay : v < .7 ? C.brown : v < .9 ? C.dbrown : C.umber);
    if (((y * 7 + i * 13) % 37) === 0) fb.px(X, y, C.dbrown);
  }
  for (let i = -15; i <= 15; i++) { fb.px(x + i, top - 11, C.ink); }
  // glass panel
  for (let y = top; y <= bottom; y++) for (let i = 0; i < w; i++) {
    const X = x0 + i, edge = i === 0 || i === w - 1 || y === top || y === bottom;
    const round = (y - top < 3 || bottom - y < 3) && (i < 2 || i > w - 3);
    if (round) continue;
    fb.px(X, y, edge ? C.ink : (i < 3 ? C.white : C.sand));
  }
  // tube + fill
  const tx = x + 5, t0 = top + 8, t1 = bottom - 14, fillY = Math.round(t1 - frac * (t1 - t0));
  for (let y = t0; y <= t1; y++) { fb.px(tx - 2, y, C.ink); fb.px(tx + 2, y, C.ink); for (let i = -1; i <= 1; i++) fb.px(tx + i, y, y >= fillY ? (i < 0 ? C.hpink : C.red) : C.silver); }
  fb.disc(tx, t1 + 5, 4.5, C.ink); fb.disc(tx, t1 + 5, 3.5, flash ? C.hpink : C.red); fb.px(tx - 1, t1 + 3, C.white);
  // ticks + labels
  for (let n = 0; n <= max; n++) {
    const y = Math.round(t1 - n / max * (t1 - t0)), big = n % step === 0;
    for (let i = 0; i < (big ? 3 : 2); i++) fb.px(tx - 3 - i, y, C.dbrown);
    if (big) tiny(fb, String(n), x - 6 - (n >= 10 ? 4 : 0), y - 2);
  }
  return { tx, fillY };
}
// 3×5 digits for gauge labels
const TD = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
function tiny(fb, s, x, y) { for (const ch of s) { const g = TD[ch]; for (let j = 0; j < 15; j++) if (g[j] === '1') fb.px(x + j % 3, y + (j / 3 | 0), C.ink); x += 4; } }
