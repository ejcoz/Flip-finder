// eye.js — the setting (a giant eye with lids, lashes, iris, drying cornea), the hero (a tear drop with a face), the TEAR FILM gauge
import { W, H, C, T, bayer, hash, clamp, lerp } from './px.js';

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

const shape = u => Math.pow(Math.max(0, 1 - u * u), .75);
// Eye centred (ex, ey), half-width a, half-height b. open 0..1, dry 0..1 (veins, cracks), look = iris x offset, tremble px
export function eye(fb, ex, ey, a, b, open, dry, t, look = 0) {
  ex = Math.round(ex); ey = Math.round(ey);
  const lowY = x => ey + b * .72 * shape((x - ex) / a);
  const upOpen = x => ey - b * shape((x - ex) / a);
  const upY = x => lerp(lowY(x) - 1, upOpen(x), open);
  // lid skin (socket ring) around the eye
  const sa = a + 10, sb = b + 16;
  for (let y = Math.floor(ey - sb - 4); y <= ey + sb; y++) for (let x = Math.floor(ex - sa); x <= ex + sa; x++) {
    const u = (x - ex) / sa, top = ey - sb * shape(u) - 2, bot = ey + (sb * .8) * shape(u);
    if (y < top || y > bot) continue;
    const v = (y - top) / Math.max(1, bot - top);
    let c = v < .18 ? C.plum : v < .5 ? C.rose : C.plum;
    if (y >= bot - 1 || y <= top + 1) c = C.ink;
    else if (bayer(x, y) < .35 && (v < .1 || v > .9)) c = C.hink;
    fb.px(x, y, c);
  }
  // eyeball inside the lids
  const R = b * .8, ix = ex + look, iy = ey + Math.round(b * .02);
  for (let x = Math.ceil(ex - a); x <= ex + a; x++) {
    const y0 = Math.ceil(upY(x)), y1 = Math.floor(lowY(x));
    for (let y = y0; y <= y1; y++) {
      const dxE = (x - ex) / a, dyE = (y - ey) / b, rim = dxE * dxE * 1.1 + dyE * dyE * .6;
      let v = 1 - rim + (bayer(x, y) - .5) * .15;
      let c = v > .55 ? C.white : v > .25 ? C.silver : C.steel;
      // iris + pupil
      const dx = x - ix, dy = y - iy, d = Math.hypot(dx, dy);
      if (d <= R) {
        const ang = Math.atan2(dy, dx), streak = hash(Math.round(ang * 14 + 100)) > .55;
        const rr = d / R;
        c = rr > .9 ? C.navy : rr > .68 ? (streak ? C.blue : C.teal) : (streak ? C.cyan : C.blue);
        if (rr > .97) c = C.ink;
        if (d <= R * (.42 + dry * .1)) c = C.ink;
      }
      // glints (fade when dry)
      if (dry < .6) {
        if (Math.hypot(x - (ix - R * .42), y - (iy - R * .42)) < R * .2) c = C.white;
        if (Math.hypot(x - (ix + R * .3), y - (iy + R * .32)) < R * .08) c = C.white;
      }
      // lid shadow under the upper lid
      if (y - y0 < 3 && open > .3 && bayer(x, y) < .5) c = c === C.white ? C.silver : C.steel;
      fb.px(x, y, c);
    }
  }
  // veins: seeded branching walks from both corners, length grows with dryness (clipped to the white)
  if (dry > .05) {
    const inWhite = (x, y) => y > upY(x) + 1 && y < lowY(x) && Math.hypot(x - ix, y - iy) > R + 1;
    for (let side of [-1, 1]) for (let v = 0; v < 7; v++) {
      let x = ex + side * a * .97, y = ey + (hash(v, side, 3) - .5) * b * .9, dir = (hash(v, side, 4) - .5) * .9;
      const len = a * .55 * dry * (.5 + hash(v, side, 5) * .7);
      for (let s2 = 0; s2 < len; s2++) {
        x -= side; dir += (hash(v * 97 + s2, side, 6) - .5) * .6; dir = clamp(dir, -1.1, 1.1); y += dir * .7;
        if (inWhite(x, y)) fb.px(x, y, s2 < len * .5 ? C.crimson : C.red);
        if (s2 > 6 && hash(v, s2, side) < .05) { // twig
          let bx = x, by = y, bd = dir + (hash(s2, v) > .5 ? .9 : -.9);
          for (let q = 0; q < len * .25; q++) { bx -= side; by += bd * .8; if (inWhite(bx, by)) fb.px(bx, by, C.pink); }
        }
      }
    }
  }
  // dry cornea: dull patches + a few jagged cracks over the iris
  if (dry > .35) {
    const k = (dry - .35) / .65;
    for (let p = 0; p < Math.round(k * 6); p++) {
      const pa = hash(p, 11) * 6.28, pr = R * (.3 + hash(p, 12) * .5), px0 = ix + Math.cos(pa) * pr, py0 = iy + Math.sin(pa) * pr, rr = R * (.12 + hash(p, 13) * .1);
      for (let y = Math.floor(py0 - rr); y <= py0 + rr; y++) for (let x = Math.floor(px0 - rr); x <= px0 + rr; x++)
        if (Math.hypot(x - px0, y - py0) < rr && bayer(x, y) < .5 && y > upY(x) + 1 && y < lowY(x)) fb.px(x, y, C.steel);
    }
    for (let c = 0; c < Math.round(k * 4); c++) {
      let x = ix + (hash(c, 21) - .5) * R * .8, y = iy + (hash(c, 22) - .5) * R * .8, ang = hash(c, 23) * 6.28;
      for (let s2 = 0; s2 < R * .9 * k; s2++) {
        ang += (hash(c, s2, 24) - .5) * 1.2; x += Math.cos(ang); y += Math.sin(ang);
        if (Math.hypot(x - ix, y - iy) < R && y > upY(x) + 1 && y < lowY(x)) fb.px(x, y, C.white);
      }
    }
  }
  // upper lid: skin between socket top and the lid line, then a thick ink edge + lashes
  for (let x = Math.ceil(ex - a); x <= ex + a; x++) {
    const yU = Math.round(upY(x)), top = Math.round(ey - sb * shape((x - ex) / sa) - 1);
    for (let y = top + 2; y < yU; y++) fb.px(x, y, (yU - y) < 4 ? C.plum : bayer(x, y) < .5 ? C.rose : C.pink);
    fb.px(x, yU, C.ink); fb.px(x, yU - 1, C.ink);
    const yL = Math.round(lowY(x)); fb.px(x, yL, C.ink); if (open > .05) fb.px(x, yL - 1, C.pink);
  }
  // lashes on the upper lid
  for (let i = -6; i <= 6; i++) {
    const x0 = ex + i * a / 7, y0 = upY(x0) - 1, dir = i / 7;
    const len = 9 + (1 - Math.abs(dir)) * 4;
    for (let s = 0; s < len; s++) {
      const p = s / len;
      fb.px(x0 + dir * s * .9 + Math.sign(dir) * p * p * 3, y0 - s * (1 - Math.abs(dir) * .4) + p * p * 2, C.ink);
      if (s < len * .5) fb.px(x0 + dir * s * .9 + 1, y0 - s * (1 - Math.abs(dir) * .4), C.ink);
    }
  }
  return { lowY, upY, R, ix, iy };
}

// Tear drop hero centred on its round body (cx, cy), radius r
export function tear(fb, cx, cy, r, expr, t, opt = {}) {
  cx = Math.round(cx); cy = Math.round(cy);
  const tipY = cy - r * 1.75;
  for (let y = Math.floor(tipY); y <= cy + r; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const dx = x - cx, dy = y - cy;
    let inside = dx * dx + dy * dy <= r * r;
    if (!inside && y < cy) { const p = (y - tipY) / (cy - tipY); inside = Math.abs(dx) <= r * Math.pow(Math.max(0, p), 1.1) * .98; }
    if (!inside) continue;
    // edge test
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
      const X = dx + a, Y = dy + b, yy = y + b;
      let ins = X * X + Y * Y <= r * r;
      if (!ins && yy < cy) { const p = (yy - tipY) / (cy - tipY); ins = Math.abs(X) <= r * Math.pow(Math.max(0, p), 1.1) * .98; }
      return !ins;
    });
    if (nb) { fb.px(x, y, C.ink); continue; }
    const nx = dx / r, ny = dy / r, nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)));
    const li = clamp(-nx * .55 - ny * .55 + nz * .6, 0, 1) + (bayer(x, y) - .5) * .15;
    fb.px(x, y, li > .72 ? C.cyan : li > .38 ? C.blue : C.navy);
  }
  // specular
  fb.rect(cx - Math.round(r * .55), cy - Math.round(r * .55), Math.max(2, Math.round(r * .18)), Math.max(3, Math.round(r * .28)), C.white);
  fb.px(cx - Math.round(r * .5), Math.round(cy - r * 1.1), C.white);
  const s = r / 34;
  const e = expr === 'wink' ? 'happy' : expr;
  face(fb, cx, cy + Math.round(r * .05), s, e, opt.noBlink ? 1 : t + (opt.blinkOff || 0), opt.look || 0);
  if (expr === 'sweat' || expr === 'strain') {
    for (let k = 0; k < 2; k++) {
      const dx2 = Math.round(cx + (k ? -1 : 1) * r * .95), dy2 = Math.round(cy - r * .6 + (((t * 10) | 0) + k * 3) % 7);
      fb.rect(dx2, dy2, 2, 3, C.cyan); fb.px(dx2, dy2 - 1, C.cyan);
    }
  }
}

// Horizontal TEAR FILM gauge
export function filmGauge(fb, cx, y, w, frac, t, label) {
  const x0 = Math.round(cx - w / 2), h = 10;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    const edge = j === -1 || j === h || i === -1 || i === w;
    if (edge) { if (!((i === -1 || i === w) && (j === -1 || j === h))) fb.px(x0 + i, y + j, C.ink); continue; }
    const fill = i < frac * w;
    const low = frac < .3 && ((t * 6) | 0) % 2 === 0;
    let c = fill ? (j < 3 ? (low ? C.pink : C.cyan) : (low ? C.red : C.blue)) : (bayer(x0 + i, y + j) < .5 ? C.night : C.dslate);
    if (fill && i > frac * w - 2 && j > 2) c = C.navy;
    fb.px(x0 + i, y + j, c);
  }
  for (let i = 1; i < 4; i++) for (let j = 0; j < h; j++) if (j % 2) fb.px(x0 + Math.round(w * i / 4), y + j, C.ink);
  return { x0 };
}
