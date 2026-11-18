// "Bit", the Pixel Scan mascot, seen in x-ray: 22×26 cell grid, organs inside.
import { bayer } from './pix.js';

export const C = {
  body: 'rgba(18,61,69,.9)', rim: '#39E0F0', eye: '#F2FBFC',
  lung: '#FF7A6B', lungHi: '#FFB0A3', grey: '#6F8A8E', greyD: '#4E6569',
  heart: '#FF5A5F', heartD: '#C23A46', heartHi: '#FFD0D2',
  brain: '#FF9BB0', brainD: '#D86A86', amber: '#FFB547', lime: '#A6F04A',
};
export const W = 22, H = 26;

function inBody(c, r) {
  const x = c + .5, y = r + .5;
  if (r >= 24) return (c >= 4 && c <= 7) || (c >= 14 && c <= 17);       // feet
  if (r < 0 || r > 23 || c < 0 || c > 21) return false;
  const rt = 8, rb = 4;
  if (y < rt && (x < rt || x > W - rt)) return Math.hypot(x - (x < rt ? rt : W - rt), y - rt) <= rt;
  if (y > 24 - rb && (x < rb || x > W - rb)) return Math.hypot(x - (x < rb ? rb : W - rb), y - (24 - rb)) <= rb;
  return true;
}

const BRAIN = ['..bbbbbb..', '.bbdbbdbb.', 'bbbbdbbbdb', 'bdbbbbdbbb', '.bbbdbbbb.'];
const LUNG = ['..oooo', '.hoooo', 'oooooo', 'oooooo', 'oooooo', 'oooooo', 'oooooo', 'oooooo', '.oooo.'];
const HEART = ['.rr.rr.', 'rhrrrrr', 'rrrrrrd', '.rrrrd.', '..rrd..', '...d...'];
const FACES = {
  flat: { e: [[7, 8], [8, 8], [7, 9], [8, 9], [13, 8], [14, 8], [13, 9], [14, 9]], m: [[10, 10], [11, 10]] },
  tired: { e: [[7, 9], [8, 9], [13, 9], [14, 9]], m: [[10, 10], [11, 10], [12, 11]] },
  wide: { e: [[7, 7], [8, 7], [7, 8], [8, 8], [7, 9], [8, 9], [13, 7], [14, 7], [13, 8], [14, 8], [13, 9], [14, 9]], m: [[10, 10], [11, 10], [10, 11], [11, 11]] },
  happy: { e: [[6, 9], [7, 8], [8, 9], [13, 9], [14, 8], [15, 9]], m: [[9, 10], [10, 11], [11, 11], [12, 10]] },
  shut: { e: [[6, 9], [7, 9], [8, 9], [13, 9], [14, 9], [15, 9]], m: [[10, 10], [11, 10]] },
};

// state: { lung, heart, brain } health 0..1, face, toxins (count), seed
// x,y = midpoint under the feet; px = cell size
export function drawBit(ctx, { x, y, px = 16, state = {}, rim = C.rim }) {
  const { lung = 1, heart = 1, brain = 1, face = 'flat', toxins = 0, seed = 1 } = state;
  const ox = Math.round(x - (W * px) / 2), oy = Math.round(y - H * px);
  const cell = (c, r, col) => { ctx.fillStyle = col; ctx.fillRect(ox + c * px, oy + r * px, px, px); };
  // silhouette + one-cell rim
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (!inBody(c, r)) continue;
    const edge = !inBody(c - 1, r) || !inBody(c + 1, r) || !inBody(c, r - 1) || !inBody(c, r + 1);
    cell(c, r, edge ? rim : C.body);
  }
  // toxins: seeded single cells drifting inside the silhouette
  let s = seed * 9301;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < toxins; i++) {
    const c = 2 + Math.floor(rnd() * 18), r = 6 + Math.floor(rnd() * 17);
    if (inBody(c, r)) cell(c, r, C.amber);
  }
  // health mixes by ordered dither, cell by cell: the change itself looks like pixels
  const mix = (k, c, r, good, bad, top = 0, h = 1) => (k > (1 - (r - top + .5) / h) * .92 + bayer(c, r) * .08 ? good : bad);
  BRAIN.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const cc = c + 6, rr = r + 1;
    cell(cc, rr, ch === 'd' ? mix(brain, cc, rr, C.brainD, C.greyD, 1, 5) : mix(brain, cc, rr, C.brain, C.grey, 1, 5));
  }));
  for (let r = 13; r <= 15; r++) { cell(10, r, mix(lung, 10, r, '#E8A39A', C.grey, 13, 10)); cell(11, r, mix(lung, 11, r, '#E8A39A', C.grey, 13, 10)); }
  for (const side of [0, 1]) LUNG.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const cc = side ? 18 - c : c + 3, rr = r + 14;
    cell(cc, rr, ch === 'h' ? mix(lung, cc, rr, C.lungHi, '#8FA7AB', 14, 9) : mix(lung, cc, rr, C.lung, C.grey, 14, 9));
  }));
  HEART.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const cc = c + 7, rr = r + 16;
    cell(cc, rr, ch === 'h' ? C.heartHi : ch === 'd' ? C.heartD : mix(heart, cc, rr, C.heart, C.heartD, 16, 6));
  }));
  const f = FACES[face] || FACES.flat;
  for (const [c, r] of f.e) cell(c, r, C.eye);
  for (const [c, r] of f.m) cell(c, r, C.eye);
  return { ox, oy, w: W * px, h: H * px };
}

// small pixel sparkle (lime = healed)
export function sparkle(ctx, x, y, px, col = C.lime) {
  for (const [c, r] of [[2, 0], [2, 1], [0, 2], [1, 2], [3, 2], [4, 2], [2, 3], [2, 4]]) {
    ctx.fillStyle = col; ctx.fillRect(Math.round(x + (c - 2) * px), Math.round(y + (r - 2) * px), px, px);
  }
}
