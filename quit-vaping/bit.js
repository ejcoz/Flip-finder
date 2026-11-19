// "Bit", the Pixel Scan figure: a human body seen in a full-body x-ray scan.
// 30×62 cell grid (head, neck, shoulders, arms, torso, legs, feet), organs inside.
import { bayer } from './pix.js';

export const C = {
  body: 'rgba(18,61,69,.9)', rim: '#39E0F0', eye: '#F2FBFC',
  lung: '#F4A196', lungHi: '#FFD6CE', grey: '#6F8A8E', greyD: '#4E6569',
  heart: '#FF5A5F', heartD: '#C23A46', heartHi: '#FFD0D2',
  brain: '#FF9BB0', brainD: '#D86A86', liver: '#E0675E', liverD: '#A9434A',
  stomach: '#FFB0A3', muscle: '#F07F74', amber: '#FFB547', lime: '#A6F04A',
};
export const W = 30, H = 62;

// body geometry in cell units; x measured from the centre line
const armX = y => 11.4 + (y - 17.5) * 0.06;
const legX = y => 3.7 - (y - 38) * 0.03, legW = y => 3.3 - (y - 38) * 0.05;
function torsoHW(y) {
  if (y < 18.5) return 6 + 2.6 * Math.sqrt(Math.max(0, 1 - ((18.5 - y) / 2.6) ** 2));
  if (y < 30) return 8.6 - (y - 18.5) * 0.17;
  return 6.6 + (y - 30) * 0.13;
}
export function inBody(c, r) { return inBodyXY(c + .5 - W / 2, r + .5); }
// body shapes for the clear look (x from the centre line, y from the top, cell units). Organs keep their places in all of them.
const se = (x, y, cx, cy, rx, ry, n = 4) => Math.abs((x - cx) / rx) ** n + Math.abs((y - cy) / ry) ** n <= 1;   // superellipse
const headIn = (x, y, rx = 6.3, ry = 7.2, cy = 7.6) => (x / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const SHAPES = {
  human: null,   // the original figure (inBodyXY below)
  bust: (x, y) => headIn(x, y) || (Math.abs(x) <= 2.4 && y >= 13.5 && y <= 17.5)
    || (y >= 16.2 && y <= 41 && se(x, y, 0, 30, 10.4, 13.8, 3.2) && (y > 20 || Math.abs(x) <= 10.4 - (20 - y) ** 2 * .45))
    || (y > 38 && y <= 60.5 && Math.abs(Math.abs(x) - 4.3) <= 3.9 - (y - 38) * .055 && !(y > 41 && Math.abs(x) < .45 + (y - 41) * .02))   // legs: rounded, a small gap between
    || (y > 59 && y <= 61.8 && se(Math.abs(x), y, 5.2, 60.6, 3.6, 1.3, 3)),   // feet
  chibi: (x, y) => headIn(x, y, 7.2, 7.4, 7.3) || (Math.abs(x) <= 2.6 && y >= 13.5 && y <= 17.5)
    || se(x, y, 0, 28.5, 8.6, 12.4, 4) || se(Math.abs(x), y, 9.6, 27, 2.2, 7.2, 2.6),
  hero: (x, y) => headIn(x, y, 6, 7, 7.6) || (Math.abs(x) <= 2.6 && y >= 13.5 && y <= 17.5)
    || (y >= 16.4 && se(x, y, 0, 21.5, 11.4, 5.2, 3)) || (y >= 20 && y <= 42 && Math.abs(x) <= (y < 33 ? 10.6 - (y - 20) * .22 : 7.75 + (y - 33) * .1))
    || se(Math.abs(x), y, 11.2, 28, 1.7, 9.5, 2.6),
  capsule: (x, y) => headIn(x, y) || (Math.abs(x) <= 2.4 && y >= 13.5 && y <= 17.5) || se(x, y, 0, 30.5, 10.6, 14.6, 5),
};
let SHAPE = 'human';
export function setShape(name) { if (name in SHAPES) SHAPE = name; }
// continuous version: x from the centre line, y from the top, in cell units
export function inBodyXY(x, y) {
  if (SHAPES[SHAPE]) return SHAPES[SHAPE](x, y);
  const ax = Math.abs(x);
  if ((x / 6.3) ** 2 + ((y - 7.6) / 7.2) ** 2 <= 1) return true;                    // head
  if (ax <= 2.1 && y >= 14 && y <= 17) return true;                                // neck
  if (y >= 15.9 && y <= 38.5 && ax <= torsoHW(y)) return true;                     // torso
  if (y >= 17.5 && y <= 40.5) {                                                    // arms + hands
    const hw = y > 37.5 ? 1.9 : 1.55;
    if (Math.abs(ax - armX(y)) <= hw && !(y > 40 && Math.abs(ax - armX(y)) > 1.2)) return true;
    if (y < 19.6 && ax <= armX(y) + 1.4 && Math.hypot(Math.max(0, ax - armX(y) + 0.2), 19.6 - y) <= 2.4) return true;  // shoulder cap
  }
  if (y >= 38 && y <= 59.5) {                                                      // legs
    if (Math.abs(ax - legX(y)) <= legW(y)) return true;
    if (y < 40.5 && ax <= legX(y) + legW(y)) return true;                          // pelvis
  }
  if (y > 59.5 && y <= 61.6 && ax >= 1.2 && ax <= legX(59) + 3.4) return true;      // feet
  return false;
}

const BRAIN = ['...bbbb...', '.bbdbbdbb.', 'bbbbdbbbdb', 'bdbbbbbdbb', '.bbbdbbbb.'];
const LUNG = ['..ooo', '.hooo', 'ooooo', 'ooooo', 'ooooo', 'ooooo', 'ooooo', 'ooooo', 'ooooo', 'oooo.', '.ooo.'];
const HEART = ['.rr.rr.', 'rhrrrrr', 'rrrrrrd', '.rrrrd.', '..rrd..', '...d...'];
const HEART_BIG = ['.rrr.rrr.', 'rhhrrrrrr', 'rhrrrrrrd', 'rrrrrrrrd', '.rrrrrrd.', '..rrrrd..', '...rrd...', '....d....'];
const LIVER = ['llllll', 'llllll', '.llll.', '..ll..'];
const STOMACH = ['.ss.', 'ssss', 'ssss', '.sss', '..ss'];
const FACES = {
  flat: { e: [[12, 9], [12, 10], [17, 9], [17, 10]], m: [[14, 12], [15, 12]] },
  tired: { e: [[11, 10], [12, 10], [17, 10], [18, 10]], m: [[14, 12], [15, 12], [16, 13]] },
  wide: { e: [[12, 8], [12, 9], [12, 10], [17, 8], [17, 9], [17, 10]], m: [[14, 12], [15, 12], [14, 13], [15, 13]] },
  happy: { e: [[11, 10], [12, 9], [13, 10], [16, 10], [17, 9], [18, 10]], m: [[13, 12], [14, 13], [15, 13], [16, 12]] },
  shut: { e: [[11, 10], [12, 10], [13, 10], [16, 10], [17, 10], [18, 10]], m: [[14, 12], [15, 12]] },
};

// Only the organs a film talks about are drawn (the rest of the body stays empty, so the scan reads cleanly).
// showOnly(['liver', 'heart']) in main.js; null = every organ.
let SHOWN = null;
export function showOnly(list) { SHOWN = list ? new Set(list) : null; }
const shown = k => !SHOWN || SHOWN.has(k);

// ---------- the "clear" look: the same body, drawn smooth and solid, organs on a finer grid with real detail ----------
let LOOK = 'pixel';
export function setLook(l) { LOOK = l; }
const SIL = new Map();
function silhouette(px, rim, f) {   // cached: the body on a fine grid (f px cells), a solid fill and a 2-cell rim
  const key = px + rim + f + SHAPE; if (SIL.has(key)) return SIL.get(key);
  const cv = document.createElement('canvas'); cv.width = W * px; cv.height = H * px; const g = cv.getContext('2d');
  const d = f / px, inn = (x, y) => inBodyXY(x, y);
  for (let fy = 0; fy < H * px; fy += f) for (let fx = 0; fx < W * px; fx += f) {
    const x = (fx + f / 2) / px - W / 2, y = (fy + f / 2) / px;
    if (!inn(x, y)) continue;
    const e = 2.6 * d, edge = !inn(x - e, y) || !inn(x + e, y) || !inn(x, y - e) || !inn(x, y + e);
    g.fillStyle = edge ? rim : '#061419'; g.fillRect(fx, fy, f, f);
  }
  SIL.set(key, cv); return cv;
}
const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const heartIn = (x, y, cx, cy, s) => { const u = (x - cx) / s, v = (y - cy) / s; return ell(u, v, -1, -.9, 1.15, 1.15) || ell(u, v, 1, -.9, 1.15, 1.15) || (v > -.9 && v < 2.1 && Math.abs(u) < 2.1 - (v + .9) * .7); };
// organs in body-cell units (x from the centre line, y from the top); pal = [highlight, base, shadow], grey when unhealthy
const ORG = {
  brain: { box: [-5.6, 5.6, 1.2, 8.2], test: (x, y) => ell(x, y, 0, 4.9, 5.4, 3.4) && y < 8, pal: ['#FFD3DD', '#FF9BB0', '#C95C7A'],
    detail: (x, y) => Math.abs(x) < .22 || Math.abs(Math.sin(x * 2.2 + Math.sin(y * 2.6) * 1.6 + y * .9)) < .24 },
  lung: { box: [-8, 8, 17.2, 31.5], test: (x, y) => (ell(Math.abs(x), y, 4.4, 24.6, 3.3, 6.6) && y > 18) , pal: ['#FFD6CE', '#F4A196', '#B9675E'],
    detail: (x, y) => { const ax = Math.abs(x); return (ax > .9 && Math.abs(y - (19.5 + (ax - .9) * 1.15)) < .2 && ax < 4.4) || (ax > 3 && ax < 5.8 && Math.abs(ax - 3 - (y - 21.9) * .45) < .17 && y > 21.9 && y < 27) || (ax > 2.4 && ax < 3.8 && Math.abs(ax - 3.4 + (y - 22.4) * .5) < .17 && y > 22.4 && y < 26); } },
  trachea: { box: [-1, 1, 13.6, 20], test: (x, y) => Math.abs(x) < .85 && y > 13.8 && y < 19.8, pal: ['#F7C1B8', '#E8A39A', '#B9675E'], detail: (x, y) => (y * 1.4) % 1 < .22, k: 'lung' },
  heart: { box: [-5, 6, 20.5, 31.5], test: (x, y) => heartIn(x, y, .5, 25.2, 2.0), pal: ['#FFD0D2', '#FF4F58', '#B32C3B'], detail: () => false },
  liver: { box: [-7, 1.5, 30, 35.5], test: (x, y) => ell(x, y, -3, 32.2, 4, 2.2) || ell(x, y, .2, 31.6, 1.8, 1.5), pal: ['#F29A8E', '#E0675E', '#9E3D44'], detail: () => false },
  muscle: { box: [-8, 8, 41.5, 57], test: (x, y) => se(Math.abs(x), y, 4.3, 45.5, 2.3, 4, 2.4) || se(Math.abs(x), y, 4.3, 52.6, 1.8, 3.6, 2.4), pal: ['#FFB3A8', '#F07F74', '#B4534C'],
    detail: (x, y) => Math.abs(Math.abs(x) - 4.3 - (y - 44) * .04) < .12 },
  stomach: { box: [1.5, 7, 30.2, 36], test: (x, y) => ell(x, y, 4.1, 32.8, 2.3, 2.3), pal: ['#FFD2C8', '#FFB0A3', '#D27C70'], detail: () => false },
};
const GREYP = ['#A9BBBE', '#6F8A8E', '#4E6569'];
function drawClear(ctx, { x, y, px, state, rim }) {
  const { face = 'flat', toxins = 0, seed = 1, glow = false } = state;
  const ox = Math.round(x - (W * px) / 2), oy = Math.round(y - H * px), f = Math.max(3, Math.round(px / 3.5)), d = f / px;
  ctx.drawImage(silhouette(px, rim, f), ox, oy);
  let s = seed * 9301; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < toxins; i++) {   // particles: small and round-ish, inside the torso
    const tx = (rnd() - .5) * 14, ty = 18 + rnd() * 18;
    if (!inBodyXY(tx - 1, ty) || !inBodyXY(tx + 1, ty)) continue;
    const X = ox + (tx + W / 2) * px, Y = oy + ty * px;
    if (glow) { ctx.fillStyle = 'rgba(255,181,71,.3)'; ctx.fillRect(X - 2 * f, Y - 2 * f, 4 * f, 4 * f); }
    ctx.fillStyle = glow ? '#FFD27A' : C.amber; ctx.fillRect(X - f, Y - f, 2 * f, 2 * f);
  }
  for (const name of ['lung', 'trachea', 'liver', 'stomach', 'heart', 'brain', 'muscle']) {
    const o = ORG[name], key = o.k || name; if (!shown(key)) continue;
    const k = state[key] ?? 1, [x0, x1, y0, y1] = o.box;
    for (let yy = Math.floor(y0 / d) * d; yy < y1; yy += d) for (let xx = Math.floor(x0 / d) * d; xx < x1; xx += d) {
      const cx = xx + d / 2, cy = yy + d / 2;
      if (!o.test(cx, cy)) continue;
      const good = k > (1 - (cy - y0) / (y1 - y0)) * .92 + bayer(Math.round(xx / d), Math.round(yy / d)) * .08, pal = good ? o.pal : GREYP;
      const edge = !o.test(cx - 1.5 * d, cy) || !o.test(cx + 1.5 * d, cy) || !o.test(cx, cy - 1.5 * d) || !o.test(cx, cy + 1.5 * d);
      const lit = !o.test(cx - 2.5 * d, cy - 2.5 * d) && !edge;   // top-left light
      ctx.fillStyle = edge || o.detail(cx, cy) ? pal[2] : lit ? pal[0] : pal[1];
      ctx.fillRect(ox + Math.round((xx + W / 2) * px), oy + Math.round(yy * px), Math.ceil(d * px), Math.ceil(d * px));
    }
  }
  const fc = FACES[face] || FACES.flat;   // HD face: one dash per eye, a thin mouth
  ctx.fillStyle = C.eye;
  for (const side of [fc.e.filter(([c]) => c < 15), fc.e.filter(([c]) => c >= 15)]) {
    if (!side.length) continue;
    if (face === 'wide') {   // worried: round eyes with a dark pupil
      const cs = side.map(q => q[0]), rs = side.map(q => q[1]), ex = ox + (Math.min(...cs) + .5) * px, ey = oy + (rs.reduce((p, q) => p + q, 0) / rs.length + .5) * px, R = px * .75;
      ctx.fillStyle = C.eye; ctx.fillRect(Math.round(ex - R), Math.round(ey - R), Math.round(2 * R), Math.round(2 * R));
      ctx.fillStyle = '#061419'; ctx.fillRect(Math.round(ex - R * .45), Math.round(ey - R * .45), Math.round(R * .9), Math.round(R * .9)); ctx.fillStyle = C.eye; continue;
    }
    const cs = side.map(q => q[0]), rs = side.map(q => q[1]), c0 = Math.min(...cs), c1 = Math.max(...cs) + 1, r = rs.reduce((a, b) => a + b, 0) / rs.length;
    const w = Math.max(1.3, c1 - c0) * px; ctx.fillRect(Math.round(ox + (c0 + c1) / 2 * px - w / 2), Math.round(oy + (r + .3) * px), Math.round(w), Math.round(px * .42));
  }
  if (face === 'wide') { const cs = fc.m.map(q => q[0]), rs = fc.m.map(q => q[1]); ctx.fillRect(ox + Math.min(...cs) * px + px * .3, oy + Math.min(...rs) * px + px * .2, (Math.max(...cs) - Math.min(...cs) + 1) * px - px * .6, px * 1.1); }   // worried: a small open mouth
  else for (const [c, r] of fc.m) ctx.fillRect(ox + c * px, Math.round(oy + (r + .35) * px), px, Math.round(px * .3));
  return { ox, oy, w: W * px, h: H * px };
}

// state: health 0..1 per organ { brain, lung, heart, liver, stomach, muscle }, face, toxins, seed
// x,y = midpoint under the feet; px = cell size
export function drawBit(ctx, { x, y, px = 11, state = {}, rim = C.rim }) {
  if (LOOK === 'clear') return drawClear(ctx, { x, y, px, state, rim });
  const { lung = 1, heart = 1, brain = 1, liver = 1, stomach = 1, muscle = 1, face = 'flat', toxins = 0, seed = 1, sore = false, glow = false, bigHeart = false } = state;
  const ox = Math.round(x - (W * px) / 2), oy = Math.round(y - H * px);
  const cell = (c, r, col) => { ctx.fillStyle = col; ctx.fillRect(ox + c * px, oy + r * px, px, px); };
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (!inBody(c, r)) continue;
    const edge = !inBody(c - 1, r) || !inBody(c + 1, r) || !inBody(c, r - 1) || !inBody(c, r + 1);
    cell(c, r, edge ? rim : C.body);
  }
  // toxins first, so organs stay readable on top
  let s = seed * 9301;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < toxins; i++) {
    const c = 8 + Math.floor(rnd() * 14), r = 17 + Math.floor(rnd() * 20);
    if (!(inBody(c - 1, r) && inBody(c + 1, r))) continue;
    if (glow) { ctx.fillStyle = 'rgba(255,181,71,.28)'; ctx.fillRect(ox + (c - 1) * px, oy + (r - 1) * px, 3 * px, 3 * px); }
    cell(c, r, glow ? '#FFD27A' : C.amber);
  }
  // healing fills each organ from the bottom up
  const mix = (k, c, r, good, bad, top, h) => (k > (1 - (r - top + .5) / h) * .92 + bayer(c, r) * .08 ? good : bad);
  const organ = (rows, c0, r0, k, pal) => rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const [good, bad] = pal[ch]; const cc = c0 + c, rr = r0 + r;
    cell(cc, rr, bad == null ? good : mix(k, cc, rr, good, bad, r0, rows.length));
  }));
  if (shown('brain')) organ(BRAIN, 10, 2, brain, { b: [C.brain, C.grey], d: [C.brainD, C.greyD] });
  if (shown('lung')) for (let r = 15; r <= 19; r++) for (const c of [14, 15]) cell(c, r, mix(lung, c, r, '#E8A39A', C.grey, 14, 6));
  if (shown('lung')) organ(LUNG, 9, 19, lung, { o: [C.lung, C.grey], h: [C.lungHi, '#8FA7AB'] });
  if (shown('lung')) organ(LUNG.map(row => [...row].reverse().join('')), 16, 19, lung, { o: [C.lung, C.grey], h: [C.lungHi, '#8FA7AB'] });
  if (!shown('heart')) {}
  else if (bigHeart) organ(HEART_BIG, 11, 21, heart, { r: [C.heart, C.heartD], h: [C.heartHi], d: [C.heartD] });
  else organ(HEART, 12, 22, heart, { r: [C.heart, C.heartD], h: [C.heartHi], d: [C.heartD] });
  if (shown('liver')) organ(LIVER, 9, 31, liver, { l: [C.liver, C.greyD] });
  if (shown('stomach')) organ(STOMACH, 16, 31, stomach, { s: [C.stomach, C.grey] });
  // leg muscles: a two-cell strip down each thigh and calf
  if (shown('muscle')) for (let r = 41; r <= 56; r++) for (const side of [-1, 1]) {
    const cx = W / 2 + side * legX(r + .5);
    for (const c of [Math.floor(cx - 1), Math.floor(cx)]) if (inBody(c - 1, r) && inBody(c + 1, r)) cell(c, r, sore ? C.amber : mix(muscle, c, r, C.muscle, C.greyD, 41, 16));
  }
  const f = FACES[face] || FACES.flat;
  for (const [c, r] of [...f.e, ...f.m]) cell(c, r, C.eye);
  return { ox, oy, w: W * px, h: H * px };
}

// small pixel sparkle (lime = healed)
export function sparkle(ctx, x, y, px, col = C.lime) {
  for (const [c, r] of [[2, 0], [2, 1], [0, 2], [1, 2], [3, 2], [4, 2], [2, 3], [2, 4]]) {
    ctx.fillStyle = col; ctx.fillRect(Math.round(x + (c - 2) * px), Math.round(y + (r - 2) * px), px, px);
  }
}
