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
export function inBody(c, r) {
  const x = c + .5 - W / 2, y = r + .5, ax = Math.abs(x);
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
const LIVER = ['llllll', 'llllll', '.llll.', '..ll..'];
const STOMACH = ['.ss.', 'ssss', 'ssss', '.sss', '..ss'];
const FACES = {
  flat: { e: [[12, 9], [12, 10], [17, 9], [17, 10]], m: [[14, 12], [15, 12]] },
  tired: { e: [[11, 10], [12, 10], [17, 10], [18, 10]], m: [[14, 12], [15, 12], [16, 13]] },
  wide: { e: [[12, 8], [12, 9], [12, 10], [17, 8], [17, 9], [17, 10]], m: [[14, 12], [15, 12], [14, 13], [15, 13]] },
  happy: { e: [[11, 10], [12, 9], [13, 10], [16, 10], [17, 9], [18, 10]], m: [[13, 12], [14, 13], [15, 13], [16, 12]] },
  shut: { e: [[11, 10], [12, 10], [13, 10], [16, 10], [17, 10], [18, 10]], m: [[14, 12], [15, 12]] },
};

// state: health 0..1 per organ { brain, lung, heart, liver, stomach, muscle }, face, toxins, seed
// x,y = midpoint under the feet; px = cell size
export function drawBit(ctx, { x, y, px = 11, state = {}, rim = C.rim }) {
  const { lung = 1, heart = 1, brain = 1, liver = 1, stomach = 1, muscle = 1, face = 'flat', toxins = 0, seed = 1, sore = false } = state;
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
    if (inBody(c - 1, r) && inBody(c + 1, r)) cell(c, r, C.amber);
  }
  // healing fills each organ from the bottom up
  const mix = (k, c, r, good, bad, top, h) => (k > (1 - (r - top + .5) / h) * .92 + bayer(c, r) * .08 ? good : bad);
  const organ = (rows, c0, r0, k, pal) => rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const [good, bad] = pal[ch]; const cc = c0 + c, rr = r0 + r;
    cell(cc, rr, bad == null ? good : mix(k, cc, rr, good, bad, r0, rows.length));
  }));
  organ(BRAIN, 10, 2, brain, { b: [C.brain, C.grey], d: [C.brainD, C.greyD] });
  for (let r = 15; r <= 19; r++) for (const c of [14, 15]) cell(c, r, mix(lung, c, r, '#E8A39A', C.grey, 14, 6));
  organ(LUNG, 9, 19, lung, { o: [C.lung, C.grey], h: [C.lungHi, '#8FA7AB'] });
  organ(LUNG.map(row => [...row].reverse().join('')), 16, 19, lung, { o: [C.lung, C.grey], h: [C.lungHi, '#8FA7AB'] });
  organ(HEART, 12, 22, heart, { r: [C.heart, C.heartD], h: [C.heartHi], d: [C.heartD] });
  organ(LIVER, 9, 31, liver, { l: [C.liver, C.greyD] });
  organ(STOMACH, 16, 31, stomach, { s: [C.stomach, C.grey] });
  // leg muscles: a two-cell strip down each thigh and calf
  for (let r = 41; r <= 56; r++) for (const side of [-1, 1]) {
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
