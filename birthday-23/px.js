// px.js — 270×480 indexed framebuffer ×4 → 1080×1920 (adapted from Lemo-Opuscar pixel-rpg demo px.js, MIT)
export const W = 270, H = 480, SCALE = 4;
export const T = 255;

// ENDESGA-32 (0–31) + extra grounds + protected yellow ramp
const HEX = [
  '#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633',
  '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e',
  '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466',
  '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569',
  // 32–39 deep-violet ground ramp + extras
  '#170a22', '#261036', '#38174c', '#4d2163', '#683080', '#ff8a8a', '#7a1f33', '#4a1226',
  // 40–43 protected yellow (counter / key words): light, body, shade, deep
  '#fff6b0', '#fee761', '#feae34', '#b8701c',
  // 44–47 ECG paper (mode-7 plane)
  '#2a0f22', '#4a1a3a', '#7a2e5a', '#3dff9a',
  // 48–52 sun ramp (deliberately not yellow): peach, orange, flame, deep, ember
  '#ffc58a', '#ff8c2e', '#e8571d', '#b8361a', '#7a1f14',
  // 53–55 earth
  '#3a7bd5', '#2f9e5a', '#e8f4ff',
];
export const C = {
  rust: 0, clay: 1, sand: 2, tan: 3, brown: 4, dbrown: 5, umber: 6, crimson: 7, red: 8, orange: 9, amber: 10, yellow: 11,
  lime: 12, green: 13, dgreen: 14, teal: 15, navy: 16, blue: 17, cyan: 18, white: 19, silver: 20, steel: 21, slate: 22,
  dslate: 23, night: 24, ink: 25, hot: 26, plum: 27, rose: 28, pink: 29, skin: 30, skinS: 31,
  g0: 32, g1: 33, g2: 34, g3: 35, g4: 36, hpink: 37, hdeep: 38, hink: 39,
  yL: 40, yB: 41, yS: 42, yD: 43, e0: 44, e1: 45, e2: 46, eT: 47,
  sL: 48, sB: 49, sM: 50, sD: 51, sE: 52, earthB: 53, earthG: 54, cloud: 55,
};
export const NPAL = HEX.length;
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const RGB = HEX.map(rgb);
const pack = ([r, g, b]) => (255 << 24) | (b << 16) | (g << 8) | r;
export function lutFrom(fn) { const L = new Uint32Array(256); for (let i = 0; i < NPAL; i++) L[i] = pack(fn(i)); return L; }
export const LUT = { full: lutFrom(i => RGB[i]) };
export function whiten(L, f) {
  const q = Math.round(f * 4) / 4, O = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { const v = L[i]; if (!v) continue; const r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255;
    O[i] = pack([r + (255 - r) * q | 0, g + (255 - g) * q | 0, b + (255 - b) * q | 0]); }
  return O;
}
export function darken(L, f) {
  const q = Math.round(f * 4) / 4, O = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { const v = L[i]; if (!v) continue; const r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255;
    O[i] = pack([r * (1 - q) | 0, g * (1 - q) | 0, b * (1 - q) | 0]); }
  return O;
}

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (B4[(y & 3) * 4 + (x & 3)] + .5) / 16;
export function hash(x, y = 0, z = 0) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const eo = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const eio = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const mod = (n, m) => ((n % m) + m) % m;

export class FB {
  constructor(w = W, h = H) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  clear(c = 0) { this.d.fill(c); }
  px(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === T) return; this.d[y * this.w + x] = c; }
  get(x, y) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T; return this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  disc(cx, cy, r, c) { for (let y = Math.floor(-r); y <= r; y++) for (let x = Math.floor(-r); x <= r; x++) if (x * x + y * y <= r * r + r * .8) this.px(cx + x, cy + y, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // Dithered glow rings around (cx,cy): radii r0<r1, tones from inner to outer; only paints over `under` set (or anything if null)
  glow(cx, cy, r0, r1, tones, phase = 0, under = null) {
    const n = tones.length;
    for (let y = Math.floor(cy - r1); y <= cy + r1; y++) for (let x = Math.floor(cx - r1); x <= cx + r1; x++) {
      const d = Math.hypot(x - cx, (y - cy) * .92); if (d < r0 || d > r1) continue;
      if (under && !under.has(this.get(x, y))) continue;
      const v = clamp((1 - (d - r0) / (r1 - r0)) * n + phase, 0, n);   // tones listed outer → inner
      const k = Math.floor(v), f = v - k;
      const idx = Math.min(n - 1, k + (bayer(x, y) < f ? 1 : 0) - 1);
      if (idx >= 0) this.px(x, y, tones[idx]);
    }
  }
  blitFrom(src, sx, sy, sw, sh, dx, dy, z = 1) {   // integer-zoom copy (nearest) of a region
    for (let y = 0; y < sh * z; y++) for (let x = 0; x < sw * z; x++) { const c = src.get(sx + Math.floor(x / z), sy + Math.floor(y / z)); if (c !== T) this.px(dx + x, dy + y, c); }
  }
}

// Output: index → RGB (+ optional bloom on the brightest tones) → ×4 nearest
export function makeOut(canvas) {
  const lo = document.createElement('canvas'); lo.width = W; lo.height = H;
  const g = lo.getContext('2d'); const img = g.createImageData(W, H); const u32 = new Uint32Array(img.data.buffer);
  const o = canvas.getContext('2d'); o.imageSmoothingEnabled = false;
  const bl = document.createElement('canvas'); bl.width = W; bl.height = H; const bg = bl.getContext('2d');
  return {
    present(fb, lut) { const d = fb.d; for (let i = 0; i < d.length; i++) u32[i] = lut[d[i]]; g.putImageData(img, 0, 0); },
    // bloom: copy only pixels whose palette index is in `set`, blur, add at strength s (≤ .2)
    show(fb, set = null, s = 0) {
      o.globalCompositeOperation = 'source-over'; o.imageSmoothingEnabled = false;
      o.drawImage(lo, 0, 0, W * SCALE, H * SCALE);
      if (set && s > 0) {
        const bi = bg.createImageData(W, H), b32 = new Uint32Array(bi.data.buffer), d = fb.d;
        for (let i = 0; i < d.length; i++) if (set.has(d[i])) b32[i] = u32[i];
        bg.putImageData(bi, 0, 0);
        o.save(); o.globalCompositeOperation = 'lighter'; o.globalAlpha = s; o.imageSmoothingEnabled = true;
        o.filter = 'blur(28px)'; o.drawImage(bl, 0, 0, W * SCALE, H * SCALE); o.restore();
      }
    },
  };
}
