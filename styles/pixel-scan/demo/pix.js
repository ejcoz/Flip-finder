// Pixel helpers: 4×4 Bayer ordered dither on a 6 px cell grid, colour mixing.
export const CELL = 6;
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
export const bayer = (i, j) => B4[(j & 3) * 4 + (i & 3)];

export const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
export const rgb = ([r, g, b]) => `rgb(${r | 0},${g | 0},${b | 0})`;

// fill a rect with a dithered field: f(x,y) returns [colourA, colourB, amount 0..1]
export function ditherField(ctx, x0, y0, w, h, f, cell = CELL) {
  for (let y = y0; y < y0 + h; y += cell) for (let x = x0; x < x0 + w; x += cell) {
    const [a, b, k] = f(x + cell / 2, y + cell / 2);
    ctx.fillStyle = k > bayer(x / cell, y / cell) ? b : a;
    ctx.fillRect(x, y, cell, cell);
  }
}

// dithered glow: draws only the cells where the glow wins (transparent elsewhere)
export function ditherGlow(ctx, cx, cy, r, col, strength = 1, cell = CELL, clip = null) {
  const x0 = Math.floor((cx - r) / cell) * cell, y0 = Math.floor((cy - r) / cell) * cell;
  ctx.fillStyle = col;
  for (let y = y0; y < cy + r; y += cell) for (let x = x0; x < cx + r; x += cell) {
    if (clip && !clip(x, y)) continue;
    const d = Math.hypot(x + cell / 2 - cx, y + cell / 2 - cy) / r;
    if (d >= 1) continue;
    const k = Math.pow(1 - d, 1.6) * strength;
    if (k > bayer(x / cell, y / cell)) ctx.fillRect(x, y, cell, cell);
  }
}
