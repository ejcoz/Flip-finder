// "Why Are Homes So Pricey in New Brunswick?" — a 1950s classroom-film cartoon, vertical 1080×1920.
// One coral house is the "product" of the whole film; three numbered medallions are the reasons.
import { PAL, setClock, shape, ink, plane, text, fit, measure, arrow, star, sparkle, rays, ellipse, rect, rrect, spline, xform, move,
  dashed, paperFinish, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, REG } from './engine/toon.js';
import { drawHand } from './engine/chars.js';

export const W = 1080, H = 1920;
let TL = null, BEAT = 0.5357, EVS = [], LINES = {};
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const tint = (c, k) => mix(c, '#FFFFFF', k), shade = (c, k) => mix(c, '#2B2420', k);

export const COL = {
  paper: PAL.paper, ink: PAL.ink, house: PAL.coral, houseD: PAL.coralD, roof: '#7B4B2E', accent: PAL.mustard,
  title: PAL.mustard, r: [PAL.teal, PAL.avocado, PAL.blue], sum: PAL.paperD, pine: '#3E6B52', pineD: '#2C5040',
};
const SHIRTS = [PAL.mustard, PAL.blue, PAL.plum, PAL.tealD, PAL.avocadoD, '#3B4766', PAL.pinkD, PAL.brownL];
const SKINS = [PAL.skin, PAL.skinD, '#C68B5E', '#8D5A3B'];
const REASONS = ['More people', 'Too few homes', 'Higher costs'];
const RTITLE = ['More people', 'Not enough homes', 'Building got expensive'];

export function setup(tl, lines) {
  TL = tl; BEAT = tl.beat;
  for (const l of lines) LINES[l.id] = l;
  buildEvents();
}
export const DUR = () => TL.dur;
const S = id => TL.S.find(s => s.id === id);
export function section(t) { return TL.S.find(s => t >= s.t0 && t < s.t1) || TL.S[TL.S.length - 1]; }
const ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(4), type, ...o });
export const events = () => EVS;
const pop = (t, t0, d = 0.28) => back(seg(t, t0, t0 + d), 1.9);
const B = n => n * BEAT;
const money = v => '$' + Math.round(v).toLocaleString('en-US');

// ---------------------------------------------------------------- captions
export function cues() {
  const V = TL.V;
  return V.map((v, i) => {
    const nx = V[i + 1], t1 = Math.min(Math.max(v.t + v.dur + 0.6, v.t + 1.8), nx ? nx.t - 0.06 : TL.dur);
    return { t0: v.t, t1, text: LINES[v.id].sub };
  });
}
function caption(ctx, t) {
  const cue = cues().find(c => t >= c.t0 && t < c.t1); if (!cue) return;
  const a = Math.min(ss(seg(t, cue.t0, cue.t0 + 0.16)), 1 - ss(seg(t, cue.t1 - 0.16, cue.t1)));
  const f = fit(ctx, cue.text, '500 {px}px Jost', 46, 820, 2, 34);
  const lw = Math.max(...f.lines.map(l => measure(ctx, l, f.font)));
  const w = lw + 130, h = 34 + f.lines.length * f.px * 1.22, x = W / 2 - w / 2, y = 1500 - h / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 10);
  shape(ctx, rrect(x, y, w, h, 16), { fill: COL.paper, line: 3.4, seed: 901, grain: 0.15, breaks: 0.08, off: [5, 5] });
  star(ctx, x + 32, y + h / 2, 15, { n: 8, inner: 0.4, fill: COL.accent, off: [0, 0], rot: t * 0.8 });
  star(ctx, x + w - 32, y + h / 2, 15, { n: 8, inner: 0.4, fill: COL.accent, off: [0, 0], rot: -t * 0.8 });
  f.lines.forEach((l, i) => text(ctx, l, W / 2, y + 17 + f.px * 0.92 + i * f.px * 1.22, { font: f.font, fill: COL.ink, align: 'center' }));
  ctx.restore();
}

// ---------------------------------------------------------------- props
// the house: base centre at (x,y), local width 370 (eaves), height 345
const HOUSE_BODY = rect(-150, -200, 300, 200), ROOF = [[-185, -192], [0, -345], [185, -192]];
export function house(ctx, x, y, s, o = {}) {
  const seed = o.seed ?? 200;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (o.ghost) {
    const k = o.ghost;
    ctx.globalAlpha *= k;
    ctx.save(); ctx.globalAlpha *= 0.45; plane(ctx, HOUSE_BODY, PAL.white); plane(ctx, ROOF, PAL.white); ctx.restore();
    dashed(ctx, [...HOUSE_BODY, HOUSE_BODY[0]], 11, 44, 26, 0, COL.ink);
    dashed(ctx, ROOF, 11, 44, 26, 0, COL.ink);
    ctx.restore(); return;
  }
  if (o.frame) {   // under construction: studs and trusses, then the finished house fills in from the bottom
    for (let i = 0; i <= 6; i++) ink(ctx, [[-150 + i * 50, 0], [-150 + i * 50, -200]], 5, { seed: seed + 40 + i, taper: false });
    ink(ctx, [[-150, -200], [150, -200]], 6, { seed: seed + 50, taper: false });
    ink(ctx, [[-150, 0], [150, 0]], 6, { seed: seed + 51, taper: false });
    ink(ctx, ROOF, 6, { seed: seed + 52, taper: false });
    for (let i = 1; i < 6; i++) { const xx = -185 + i * 61.7, yy = -192 - (185 - Math.abs(xx)) * 153 / 185; ink(ctx, [[xx, -192], [xx, yy]], 4, { seed: seed + 60 + i, taper: false }); }
    const p = o.fill ?? 0; if (p <= 0) { ctx.restore(); return; }
    ctx.beginPath(); ctx.rect(-260, -360 * p, 520, 360 * p + 30); ctx.clip();
  }
  shape(ctx, rect(70, -330, 38, 90), { fill: COL.roof, line: 4, seed: seed + 1 });                 // chimney
  shape(ctx, HOUSE_BODY, { fill: COL.house, line: 4.5, seed: seed + 2, grain: 0.35,
    shade: [{ pts: [[60, -210], [170, -210], [170, 10], [60, 10]], color: COL.houseD, alpha: 0.45 }] });
  shape(ctx, ROOF, { fill: COL.roof, line: 4.5, seed: seed + 3, grain: 0.35,
    shade: [{ pts: [[0, -360], [200, -360], [200, -180], [0, -180]], color: shade(COL.roof, .25), alpha: 0.6 }] });
  shape(ctx, ellipse(0, -255, 22, 22, 24), { fill: PAL.white, line: 3.5, seed: seed + 4 });          // attic round window
  shape(ctx, rrect(-28, -122, 56, 122, 26), { fill: COL.accent, line: 4, seed: seed + 5 });          // door
  shape(ctx, ellipse(14, -58, 4.5, 4.5, 10), { fill: COL.ink, line: 0, grain: 0, off: [0, 0] });
  for (const wx of [-112, 50]) {
    shape(ctx, rect(wx, -160, 62, 58), { fill: PAL.white, line: 4, seed: seed + 6 + wx });
    ink(ctx, [[wx + 31, -160], [wx + 31, -102]], 3, { seed: seed + 8, taper: false }); ink(ctx, [[wx, -131], [wx + 62, -131]], 3, { seed: seed + 9, taper: false });
    shape(ctx, rect(wx - 6, -100, 74, 9), { fill: COL.roof, line: 2.5, seed: seed + 10 });
  }
  ctx.restore();
}
// the price tag: a paper luggage tag, hole at the left end; anchored at its centre
function priceTag(ctx, cx, cy, s, rot, big, small, o = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
  const body = [[-170, 0], [-130, -62], [170, -62], [170, 62], [-130, 62]];
  shape(ctx, body, { fill: o.fill || PAL.white, line: 4.5, seed: 260, grain: 0.2, breaks: 0.1 });
  shape(ctx, ellipse(-128, 0, 11, 11, 16), { fill: o.bg || COL.paper, line: 3.5, seed: 261, grain: 0, off: [0, 0] });
  text(ctx, small, 20, -20, { font: '600 26px Jost', fill: PAL.inkSoft, align: 'center', track: 6 });
  text(ctx, big, 20, 40, { font: '58px Slab', fill: COL.ink, plate: COL.accent, off: [4, 4], align: 'center', maxW: 280 });
  ctx.restore();
}
// a little townsperson: feet at (x,y), ~140 px tall at s=1
function person(ctx, x, y, s, i, walk = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s);
  const sw = walk ? (Math.floor(walk * 12) % 2 ? 9 : -9) : 0, seed = 400 + i * 7;
  ink(ctx, [[-9, -46], [-10 + sw, 0]], 7, { seed, taper: false }); ink(ctx, [[9, -46], [10 - sw, 0]], 7, { seed: seed + 1, taper: false });
  if (o.case) { shape(ctx, rrect(22, -52, 34, 30, 5), { fill: PAL.kraft, line: 3, seed: seed + 6 }); ink(ctx, [[30, -52], [36, -60], [44, -60], [50, -52]], 3, { seed: seed + 7, taper: false }); }
  shape(ctx, rrect(-22, -102, 44, 62, 16), { fill: SHIRTS[i % SHIRTS.length], line: 3.6, seed: seed + 2, grain: 0.3 });
  shape(ctx, ellipse(0, -124, 18, 21, 22), { fill: SKINS[(i * 3 + 1) % SKINS.length], line: 3.4, seed: seed + 3, grain: 0.1 });
  shape(ctx, ellipse(0, -140, 18, 9, 18, Math.PI, TAU), { fill: i % 3 === 0 ? PAL.hair : i % 3 === 1 ? PAL.brown : PAL.mustardD, line: 0, seed: seed + 4, grain: 0.2 });
  const lk = o.look ?? 3;
  shape(ctx, ellipse(-6 + lk, -124, 2.6, 3.6, 8), { fill: COL.ink, line: 0, grain: 0, off: [0, 0] });
  shape(ctx, ellipse(7 + lk, -124, 2.6, 3.6, 8), { fill: COL.ink, line: 0, grain: 0, off: [0, 0] });
  ctx.restore();
}
function pine(ctx, x, y, h, seed) {
  shape(ctx, rect(x - 9, y - h * 0.18, 18, h * 0.18), { fill: PAL.brown, line: 3, seed });
  for (let k = 0; k < 3; k++) {
    const yb = y - h * (0.14 + k * 0.26), w = h * (0.34 - k * 0.07), top = yb - h * 0.42;
    shape(ctx, [[x - w, yb], [x, top], [x + w, yb]], { fill: COL.pine, line: 3.6, seed: seed + k + 1, grain: 0.35,
      shade: [{ pts: [[x, top - 10], [x + w + 10, yb], [x, yb]], color: COL.pineD, alpha: 0.6 }] });
  }
}
function hills(ctx, a = 1) {
  plane(ctx, ellipse(160, 1520, 760, 400, 64), tint(PAL.teal, .5), { alpha: a });
  plane(ctx, ellipse(760, 1660, 900, 470, 64), tint(PAL.avocado, .35), { alpha: a });
  ink(ctx, ellipse(760, 1660, 900, 470, 64, Math.PI * 1.08, Math.PI * 1.92), 4, { seed: 211, breaks: 0.3 });
}
function glove(ctx, x, y, ang, kind = 'point', k = 2.2) {
  const L = 900, sx = x - Math.cos(ang) * L, sy = y - Math.sin(ang) * L, ex = x - Math.cos(ang) * 10, ey = y - Math.sin(ang) * 10;
  ink(ctx, [[sx, sy], [ex, ey]], 60, { seed: 500, taper: false, wob: 0.05 });
  const o = [6, 4]; ink(ctx, [[sx + o[0], sy + o[1]], [ex + o[0] * .6, ey + o[1] * .6]], 46, { seed: 501, taper: false, wob: 0.04, color: '#3B4766' });
  drawHand(ctx, x, y, ang, kind, -1, k, PAL.white);
}
function plane2(ctx, x, y, s) {      // a 1950s airliner, flying left
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  shape(ctx, [[110, -24], [160, -100], [186, -100], [172, -18]], { fill: PAL.white, line: 4, seed: 520 });
  shape(ctx, [[-10, 6], [70, 6], [20, 74], [-14, 74]], { fill: PAL.chrome, line: 4, seed: 521 });
  shape(ctx, rrect(-180, -34, 370, 64, 32), { fill: PAL.white, line: 4.5, seed: 522, grain: 0.2 });
  shape(ctx, rect(-150, -2, 320, 11), { fill: COL.accent, line: 0, seed: 523 });
  for (let i = 0; i < 7; i++) shape(ctx, ellipse(-110 + i * 34, -14, 7, 7, 10), { fill: PAL.blueD, line: 2, seed: 524 + i, grain: 0 });
  shape(ctx, [[-30, -6], [40, -6], [0, -60], [-24, -60]], { fill: PAL.chrome, line: 4, seed: 532 });
  ctx.restore();
}
function lumber(ctx) {
  for (let i = 0; i < 3; i++) {
    const y = 30 - i * 40, x = -90 + (i % 2) * 14;
    shape(ctx, rrect(x, y - 18, 170, 36, 6), { fill: i === 1 ? PAL.kraftL : PAL.kraft, line: 3.6, seed: 540 + i });
    ink(ctx, spline([[x + 14, y - 4], [x + 70, y - 8], [x + 150, y - 3]], false, 6), 2, { seed: 545 + i, color: PAL.kraftD });
    shape(ctx, ellipse(x + 120, y + 5, 8, 5, 10), { fill: PAL.kraftD, line: 0, grain: 0 });
  }
}
function hardhat(ctx) {
  shape(ctx, [...ellipse(0, 20, 78, 76, 32, Math.PI, TAU)], { fill: COL.accent, line: 4, seed: 550, shade: [{ pts: rect(20, -80, 80, 110), color: PAL.mustardD, alpha: 0.5 }] });
  shape(ctx, rrect(-100, 14, 200, 22, 10), { fill: COL.accent, line: 4, seed: 551 });
  shape(ctx, rrect(-12, -58, 24, 72, 8), { fill: PAL.mustardL, line: 3, seed: 552 });
}
function upBadge(ctx, x, y, k) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  shape(ctx, ellipse(0, 0, 34, 34, 28), { fill: COL.accent, line: 3.6, seed: 560 });
  shape(ctx, [[0, -20], [18, 2], [7, 2], [7, 20], [-7, 20], [-7, 2], [-18, 2]], { fill: COL.ink, line: 0, grain: 0, off: [0, 0] });
  ctx.restore();
}

// ---------------------------------------------------------------- shared pieces
function bg(ctx, col) { ctx.fillStyle = col; ctx.fillRect(-3000, -3000, 7080, 7920); }
function room(ctx, col, floorY) {
  bg(ctx, tint(col, .42));
  plane(ctx, rect(-200, floorY, W + 400, 1400), col);
  ink(ctx, [[-20, floorY], [W + 20, floorY]], 5, { seed: 600 + floorY, breaks: 0.35, taper: false });
}
function header(ctx, t, s, n) {
  const k = eo(seg(twos(t), s.t0 + 0.05, s.t0 + 0.4)); if (k <= 0) return;
  ctx.save(); ctx.translate(-(1 - k) * 700, 0);
  shape(ctx, ellipse(116, 236, 58, 58, 40), { fill: COL.ink, line: 0, seed: 700, grain: 0.1, off: [0, 0] });
  text(ctx, String(n), 116, 262, { font: '70px Slab', fill: COL.paper, align: 'center' });
  text(ctx, `REASON ${n} OF 3`, 200, 206, { font: '600 26px Jost', fill: COL.ink, track: 6 });
  const f = fit(ctx, RTITLE[n - 1], '{px}px Slab', 70, 840, 1, 44);
  text(ctx, f.lines[0], 198, 280, { font: f.font, fill: COL.ink, plate: PAL.white, off: [4, 4] });
  ctx.restore();
}
function tag(ctx, t, t0, str, x, y, o = {}) {
  const k = pop(t, t0) * (o.out ? 1 - ss(seg(t, o.out, o.out + 0.2)) : 1); if (k <= 0) return;
  const f = fit(ctx, str, '500 {px}px Jost', o.px || 38, o.maxW || 760, 2, 26);
  const w = Math.max(...f.lines.map(l => measure(ctx, l, f.font))) + 100, h = 32 + f.lines.length * f.px * 1.2;
  const X = x - w / 2;
  ctx.save(); ctx.translate(x, y + h / 2); ctx.scale(k, k); ctx.translate(-x, -(y + h / 2));
  shape(ctx, rrect(X, y, w, h, 14), { fill: COL.paper, line: 3.6, seed: 710, grain: 0.15, off: [6, 5] });
  star(ctx, X + 38, y + h / 2, 17, { n: 8, inner: 0.42, fill: COL.accent, off: [0, 0], rot: t * 0.6 });
  f.lines.forEach((l, i) => text(ctx, l, X + 66, y + 16 + f.px * 0.92 + i * f.px * 1.2, { font: f.font, fill: COL.ink }));
  ctx.restore();
}
function callout(ctx, t, t0, cx, cy, r, inner, bgc, leader) {
  const k = back(seg(t, t0, t0 + 0.32), 1.5); if (k <= 0) return;
  const R = r * k;
  if (leader) { const a = Math.atan2(leader[1] - cy, leader[0] - cx); dashed(ctx, [[cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16)], leader], 4, 14, 10, -t * 40, COL.ink, clamp(k)); shape(ctx, ellipse(leader[0], leader[1], 9, 9, 12), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 }); }
  shape(ctx, ellipse(cx, cy, R + 16, R + 16, 72), { fill: COL.paper, line: 4.5, seed: 720 + Math.round(cx), grain: 0.15, breaks: 0.05 });
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = bgc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.translate(cx, cy); ctx.scale(k, k); inner(ctx); ctx.restore();
  ink(ctx, ellipse(cx, cy, R, R, 72), 4, { closed: true, seed: 721, breaks: 0.1 });
}
function medallion(ctx, x, y, i, r, k) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - k) * 0.4);
  star(ctx, 0, 0, r * 1.2, { n: 16, inner: 0.84, fill: PAL.white, off: [0, 0], rot: i * 0.2 });
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: COL.r[i], line: 5, seed: 730 + i, grain: 0.3 });
  text(ctx, String(i + 1), 0, r * 0.38, { font: `${Math.round(r * 1.1)}px Slab`, fill: COL.ink, plate: PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}
function writeOn(ctx, str, cx, y, font, u, o = {}) {
  if (u <= 0) return;
  const w = measure(ctx, str, font) + 40;
  ctx.save(); ctx.beginPath(); ctx.rect(cx - w / 2 - 10, y - 300, (w + 20) * clamp(u), 420); ctx.clip();
  text(ctx, str, cx, y, { font, fill: COL.ink, plate: o.plate || PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}
function cam(ctx, cx, cy, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }

// ---------------------------------------------------------------- scenes
const HX = 540, HY = 1250, HS = 1.6;           // the hero house in the hook and the ending
const TAGP = [770, 560];
function homeScene(ctx, t, u, s, o) {
  bg(ctx, COL.paper);
  rays(ctx, HX, 1020, 30, 1500, PAL.mustardL, { rot: t * 0.03, alpha: 0.4 });
  hills(ctx);
  pine(ctx, 120, 1300, 300, 230); pine(ctx, 960, 1250, 260, 240); pine(ctx, 1040, 1330, 200, 250);
  const hk = o.housePop ?? 1;
  ctx.save(); ctx.translate(HX, HY); ctx.scale(hk, hk); ctx.translate(-HX, -HY);
  house(ctx, HX, HY, HS);
  ctx.restore();
  // string from the chimney to the tag's hole, the tag swings like a kite
  const sw = o.swing ?? 0, tk = o.tagK ?? 1;
  if (tk > 0) {
    const ts = (o.tagS ?? 1.1) * tk, rot = -0.08 + sw;
    const hole = [TAGP[0] + Math.cos(rot) * -128 * ts, TAGP[1] + Math.sin(rot) * -128 * ts];
    ink(ctx, spline([[HX + 89 * HS, HY - 330 * HS], [lerp(HX + 89 * HS, hole[0], .5) - 20, lerp(HY - 330 * HS, hole[1], .5)], hole], false, 8), 3.4, { seed: 270, taper: false });
    if (o.burst) { ctx.save(); ctx.globalAlpha = o.burst; star(ctx, TAGP[0] + 20, TAGP[1], 250 * o.burst, { n: 18, inner: 0.72, fill: PAL.white, off: [0, 0], rot: t * 0.2 }); ctx.restore(); }
    priceTag(ctx, TAGP[0], TAGP[1], ts, rot, o.price, o.year);
  }
}
function sceneHook(ctx, t, s) {
  const u = t - s.t0, sw0 = 6.43;
  const z = lerp(1, 1.035, ss(u / 6)) + 0.05 * eo(seg(u, sw0, sw0 + 0.6));
  ctx.save(); cam(ctx, lerp(540, 600, eo(seg(u, sw0, sw0 + 0.6))), lerp(960, 900, eo(seg(u, sw0, sw0 + 0.6))), z);
  const up = eo(seg(u, sw0, sw0 + 0.9));
  const swing = Math.sin((u - 0.6) * 6) * 0.25 * Math.exp(-(u - 0.6) * 1.6) * (u > 0.6 ? 1 : 0) + Math.sin((u - sw0) * 7) * 0.12 * Math.exp(-(u - sw0) * 2) * (u > sw0 ? 1 : 0);
  homeScene(ctx, t, u, s, {
    housePop: back(seg(u, 0, 0.35), 1.6), tagK: back(seg(u, 0.55, 0.85), 1.8), swing,
    tagS: 1.1 + 0.25 * back(seg(u, sw0, sw0 + 0.35), 2.2) - 0.0 * up, burst: ss(seg(u, sw0, sw0 + 0.3)),
    price: money(Math.round(lerp(172200, 352200, up) / 100) * 100), year: u < sw0 + 0.45 ? '2019' : '2026',
  });
  if (u > sw0 + 0.1) arrow(ctx, [430, 640], [560, 480], { u: eo(seg(u, sw0 + 0.1, sw0 + 0.6)), bend: -0.35, fill: COL.accent, w: 8, head: 40, bob: (u / BEAT) % 1 });
  // the ×2 stamp
  const k2 = pop(u, 8.85, 0.26);
  if (k2 > 0) { ctx.save(); ctx.translate(250, 760); ctx.rotate(-0.18); ctx.scale(k2, k2);
    star(ctx, 0, 0, 120, { n: 16, inner: 0.82, fill: PAL.white, off: [0, 0] });
    shape(ctx, ellipse(0, 0, 96, 96, 48), { fill: COL.ink, line: 0, seed: 280, off: [0, 0], grain: 0.1 });
    text(ctx, '×2', 0, 32, { font: '92px Slab', fill: COL.paper, align: 'center', plate: COL.house, off: [5, 4] }); ctx.restore(); }
  ctx.restore();
  // titles (not in the camera)
  writeOn(ctx, 'New Brunswick', W / 2, 330, '700 120px Oleo', ss(seg(u, 0.2, 1.1)));
  const k = ss(seg(u, 1.0, 1.3));
  if (k > 0) text(ctx, 'THE TYPICAL HOME', W / 2, 410, { font: '600 34px Jost', fill: COL.ink, align: 'center', track: 10, alpha: k });
  return { focus: [W / 2, H / 2] };
}
const ROWS = [880, 1100, 1320];
function sceneTitle(ctx, t, s) {
  const u = t - s.t0;
  bg(ctx, COL.title);
  rays(ctx, W / 2, 330, 30, 1300, PAL.mustardL, { rot: -t * 0.02, alpha: 0.5 });
  const k1 = pop(u, 0.15, 0.3);
  if (k1 > 0) { ctx.save(); ctx.translate(W / 2, 320); ctx.scale(k1, k1); text(ctx, 'It doubled.', 0, 0, { font: '104px Slab', fill: COL.ink, plate: PAL.white, off: [6, 5], align: 'center' }); ctx.restore(); }
  writeOn(ctx, 'So, why?', W / 2, 560, '700 170px Oleo', ss(seg(u, 0.75, 1.3)));
  for (let i = 0; i < 3; i++) {
    const ts = B(4 + i), k = pop(u, ts, 0.24);
    medallion(ctx, 190, ROWS[i], i, 90, k);
    const kt = ss(seg(u, ts + 0.06, ts + 0.3));
    if (kt > 0) {
      ctx.save(); ctx.globalAlpha = kt; ctx.translate((1 - kt) * 40, 0);
      text(ctx, `REASON ${i + 1}`, 316, ROWS[i] - 36, { font: '600 26px Jost', fill: COL.ink, track: 6 });
      text(ctx, REASONS[i], 312, ROWS[i] + 40, { font: '72px Slab', fill: COL.ink, plate: PAL.white, off: [4, 4], maxW: 700 });
      ctx.restore();
    }
  }
  return { focus: [190, ROWS[0]] };
}
// reason 1: more people
const FLOOR1 = 1150;
const WALKERS = [[470, 1210, 1.0], [560, 1175, .92], [380, 1240, 1.05], [640, 1225, 1.0], [300, 1190, .95], [720, 1260, 1.06]];
function crowdSpots() {
  const out = [], R = [[1300, .95], [1360, 1.0], [1420, 1.05]];
  let n = 0;
  R.forEach(([y, s], r) => { for (let i = 0; i < 9; i++) { const x = 70 + i * 117 + (r % 2) * 55; if (x > 1040) continue; out.push([x, y + ((i * 37) % 23) - 11, s * 0.92, n++]); } });
  return out;
}
const CROWD = crowdSpots();
function sceneR1(ctx, t, s) {
  const u = t - s.t0;
  const z = lerp(1, 0.94, ss(seg(u, 9, 13))), cy = lerp(960, 990, ss(seg(u, 9, 13)));
  ctx.save(); cam(ctx, 540, cy, z);
  room(ctx, COL.r[0], FLOOR1);
  // signpost
  const kp = pop(u, B(7), 0.3);
  if (kp > 0) {
    ctx.save(); ctx.translate(150, FLOOR1); ctx.scale(1, kp); ctx.translate(-150, -FLOOR1);
    shape(ctx, rect(138, 880, 24, FLOOR1 - 880), { fill: PAL.brown, line: 3.5, seed: 610 });
    shape(ctx, [[30, 935], [70, 895], [330, 895], [330, 975], [70, 975]], { fill: PAL.paper, line: 4, seed: 611 });
    text(ctx, 'ONTARIO', 195, 948, { font: '600 36px Jost', fill: COL.ink, align: 'center', track: 4 });
    shape(ctx, [[40, 1035], [76, 1000], [300, 1000], [300, 1070], [76, 1070]], { fill: PAL.paper, line: 4, seed: 612 });
    text(ctx, '& BEYOND', 182, 1047, { font: '600 30px Jost', fill: COL.ink, align: 'center', track: 3 });
    ctx.restore();
  }
  house(ctx, 820, FLOOR1 + 10, 0.85, { seed: 230 });
  // out-of-province buyers walk in from the left, suitcases in hand
  WALKERS.forEach(([x, y, sc], i) => {
    const t0 = 4.3 + i * 0.42, p = eo(seg(u, t0, t0 + 2.0)); if (u < t0) return;
    const X = lerp(-90, x, p);
    person(ctx, X, y, sc, i, p < 1 ? u : 0, { case: true, look: p < 1 ? 4 : 2 });
  });
  tag(ctx, u, B(11), 'Buyers “from away”, 2020–21', W / 2, 400, { out: 7.5 });
  // immigration: a plane crosses, then a crowd arrives
  if (u > 7.9 && u < 11) { const p = seg(u, 7.9, 10.6); plane2(ctx, lerp(1300, -300, p), 520 - Math.sin(p * Math.PI) * 30, 1.0); }
  CROWD.forEach(([x, y, sc, n]) => {
    const t0 = 9.0 + n * 0.11, k = back(seg(u, t0, t0 + 0.22), 2); if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, k); ctx.translate(-x, -y); person(ctx, x, y, sc, n + 3, 0, { look: (n % 3) - 1 }); ctx.restore();
  });
  ctx.restore();
  // the +25,000 counter in a call-out
  callout(ctx, u, 11.0, 560, 760, 190, g => {
    const c = Math.round(lerp(0, 25000, eo(seg(u, 11.1, 11.9))) / 50) * 50;
    text(g, '+' + c.toLocaleString('en-US'), 0, 6, { font: '78px Slab', fill: COL.ink, plate: COL.accent, off: [4, 4], align: 'center', maxW: 330 });
    text(g, 'PEOPLE IN', 0, 62, { font: '600 28px Jost', fill: COL.ink, align: 'center', track: 5 });
    text(g, 'ONE YEAR', 0, 98, { font: '600 28px Jost', fill: COL.ink, align: 'center', track: 5 });
    for (let i = 0; i < 5; i++) person(g, -110 + i * 55, -62, 0.42, i + 1);
  }, tint(COL.r[0], .7), [560, 1180]);
  header(ctx, t, s, 1);
  return { focus: [820, 1000] };
}
// reason 2: not enough homes
const COLX = [290, 790], BASE2 = 1350, STEP2 = 148, HS2 = 0.42;
function sceneR2(ctx, t, s) {
  const u = t - s.t0;
  room(ctx, COL.r[1], BASE2 + 4);
  for (let i = 0; i < 6; i++) { const ts = B(5) + i * BEAT * 0.5, k = pop(u, ts, 0.22); if (k <= 0) continue;
    const y = BASE2 - i * STEP2; ctx.save(); ctx.translate(COLX[0], y); ctx.scale(k, k); ctx.translate(-COLX[0], -y); house(ctx, COLX[0], y, HS2, { seed: 240 + i }); ctx.restore(); }
  // the built column: 4 full houses + 0.68 of the fifth
  for (let i = 0; i < 5; i++) {
    const ts = 6.43 + i * BEAT * 0.5, k = pop(u, ts, 0.22); if (k <= 0) continue;
    const y = BASE2 - i * STEP2;
    ctx.save(); ctx.translate(COLX[1], y); ctx.scale(k, k); ctx.translate(-COLX[1], -y);
    if (i === 4) { ctx.beginPath(); ctx.rect(COLX[1] - 120, y - 345 * HS2 * 0.68, 240, 345 * HS2 * 0.68 + 10); ctx.clip(); }
    house(ctx, COLX[1], y, HS2, { seed: 250 + i }); ctx.restore();
    if (i === 4 && k > 0.9) ink(ctx, [[COLX[1] - 90, y - 345 * HS2 * 0.68], [COLX[1] + 90, y - 345 * HS2 * 0.68]], 4, { seed: 259, taper: false, breaks: 0.3 });
  }
  const kg = ss(seg(u, 9.1, 9.4));
  if (kg > 0) { house(ctx, COLX[1], BASE2 - 5 * STEP2, HS2, { ghost: kg });
    ctx.save(); ctx.beginPath(); ctx.rect(COLX[1] - 120, BASE2 - 4 * STEP2 - 160, 240, 160 - 345 * HS2 * 0.68); ctx.clip(); house(ctx, COLX[1], BASE2 - 4 * STEP2, HS2, { ghost: kg }); ctx.restore(); }
  // numbers and labels
  const k6 = pop(u, 4.3, 0.26);
  if (k6 > 0) { ctx.save(); ctx.translate(COLX[0], 420); ctx.scale(k6, k6); text(ctx, '6,000', 0, 0, { font: '84px Slab', fill: COL.ink, plate: PAL.white, off: [5, 4], align: 'center' }); ctx.restore(); }
  if (u > 8.0) { const c = Math.round(lerp(0, 4680, eo(seg(u, 8.0, 8.7))) / 10) * 10;
    text(ctx, c.toLocaleString('en-US'), COLX[1], 420, { font: '84px Slab', fill: COL.ink, plate: PAL.white, off: [5, 4], align: 'center' }); }
  const kl = ss(seg(u, 2.4, 2.8)), kr = ss(seg(u, 6.0, 6.4));
  if (kl > 0) text(ctx, 'NEEDED / YEAR', COLX[0], 1405, { font: '600 28px Jost', fill: COL.ink, align: 'center', track: 5, alpha: kl });
  if (kr > 0) text(ctx, 'STARTED IN 2022', COLX[1], 1405, { font: '600 28px Jost', fill: COL.ink, align: 'center', track: 5, alpha: kr });
  tag(ctx, u, 9.65, '1,320 short', 540, 560, { px: 40 });
  // the finger leads the eye to the gap
  const kh = eo(seg(twos(u), 9.4, 9.75));
  if (kh > 0) { const bob = Math.sin(u * 2 * Math.PI / (BEAT * 2)) * 6; glove(ctx, lerp(1250, 985, kh) + bob, 640, Math.PI * 1.08, 'point', 2.0); }
  header(ctx, t, s, 2);
  return { focus: [COLX[1], BASE2 - 5 * STEP2 + 20] };
}
// reason 3: building got expensive
const CALL3 = [[200, 600], [540, 520], [880, 600]];
function sceneR3(ctx, t, s) {
  const u = t - s.t0;
  room(ctx, COL.r[2], 1340);
  const p = ss(seg(u, 2.2, 7.6));
  house(ctx, 540, 1340, 1.2, { frame: true, fill: p, seed: 260 });
  // three costs, each in its own call-out circle, each with an "up" badge
  const ts = [2.95, 3.48, 4.02], lab = ['LUMBER', 'LABOUR', 'BORROWING'];
  const inners = [lumber, hardhat, g => text(g, '%', 0, 52, { font: '150px Slab', fill: COL.ink, plate: COL.accent, off: [6, 5], align: 'center' })];
  CALL3.forEach(([x, y], i) => {
    callout(ctx, u, ts[i], x, y, 118, inners[i], tint(COL.r[2], .65), [lerp(x, 540, .55), 960]);
    const kl = ss(seg(u, ts[i] + 0.1, ts[i] + 0.3));
    if (kl > 0) text(ctx, lab[i], x, y + 178, { font: '600 28px Jost', fill: COL.ink, align: 'center', track: 5, alpha: kl });
    upBadge(ctx, x + 96, y - 96, pop(u, ts[i] + 0.25, 0.24));
  });
  const kc = pop(u, 5.9, 0.26);
  if (kc > 0) { ctx.save(); ctx.translate(840, 1010); ctx.scale(kc, kc); priceTag(ctx, 0, 0, 0.62, 0.12, '+ $$$', 'COST TO BUILD', { bg: tint(COL.r[2], .42) }); ctx.restore(); }
  header(ctx, t, s, 3);
  return { focus: [540, 1000] };
}
// summary: the see-saw
const PIV = [540, 1220];
function sceneSum(ctx, t, s) {
  const u = t - s.t0;
  bg(ctx, COL.sum);
  rays(ctx, PIV[0], PIV[1], 30, 1500, PAL.paper, { rot: t * 0.02, alpha: 0.45 });
  const ts = [0.2, 1.15, 2.1];
  for (let i = 0; i < 3; i++) {
    const x = 200 + i * 340; medallion(ctx, x, 400, i, 74, pop(u, ts[i], 0.24));
    const kt = ss(seg(u, ts[i] + 0.06, ts[i] + 0.3));
    if (kt > 0) text(ctx, REASONS[i], x, 545, { font: '600 36px Jost', fill: COL.ink, align: 'center', alpha: kt, maxW: 320 });
  }
  const kb = pop(u, 2.0, 0.3);
  if (kb > 0) {
    const tip = u < B(6) ? 0 : -0.2 * back(seg(u, B(6), B(6) + 0.35), 2.4);
    ctx.save(); ctx.translate(PIV[0], PIV[1] + 170); ctx.scale(kb, kb); ctx.translate(-PIV[0], -PIV[1] - 170);
    shape(ctx, [[PIV[0], PIV[1]], [PIV[0] + 95, PIV[1] + 170], [PIV[0] - 95, PIV[1] + 170]], { fill: PAL.inkSoft, line: 4, seed: 800 });
    ink(ctx, [[60, PIV[1] + 172], [1020, PIV[1] + 172]], 5, { seed: 801, breaks: 0.3, taper: false });
    ctx.save(); ctx.translate(PIV[0], PIV[1]); ctx.rotate(tip);
    shape(ctx, rrect(-460, -12, 920, 26, 10), { fill: PAL.kraft, line: 4, seed: 802 });
    for (let i = 0; i < 7; i++) { const k = pop(u, 2.1 + i * 0.07, 0.2); if (k <= 0) continue;
      ctx.save(); ctx.translate(-420 + i * 50, -12); ctx.scale(k, k); person(ctx, 0, 0, 0.85, i + 2, 0, { look: -2 }); ctx.restore(); }
    const kh = pop(u, 2.65, 0.24);
    if (kh > 0) { ctx.save(); ctx.translate(330, -12); ctx.scale(kh, kh); house(ctx, 0, 0, 0.42, { seed: 290 }); ctx.restore(); }
    text(ctx, 'DEMAND', -270, -210, { font: '46px Slab', fill: COL.ink, plate: PAL.white, off: [4, 3], align: 'center', alpha: ss(seg(u, 2.3, 2.5)) });
    text(ctx, 'SUPPLY', 330, -210, { font: '46px Slab', fill: COL.ink, plate: PAL.white, off: [4, 3], align: 'center', alpha: ss(seg(u, 2.7, 2.9)) });
    ctx.restore(); ctx.restore();
  }
  // prices only go one way
  const kt = pop(u, 4.8, 0.3);
  if (kt > 0) { ctx.save(); ctx.translate(640, 760); ctx.scale(kt, kt); priceTag(ctx, 0, 0, 0.95, -0.06, '$352,200', 'TODAY', { bg: COL.sum }); ctx.restore(); }
  if (u > 5.9) arrow(ctx, [940, 1020], [945, 690], { u: eo(seg(u, 5.9, 6.4)), bend: 0.12, fill: COL.accent, w: 9, head: 46, bob: (u / BEAT) % 1 });
  return { focus: [W / 2, H / 2] };
}
function sceneEnd(ctx, t, s) {
  const u = t - s.t0;
  homeScene(ctx, t, u, s, { price: '$352,200', year: '2026', tagS: 1.1 });
  writeOn(ctx, 'How do we', W / 2, 300, '700 116px Oleo', ss(seg(u, 0.3, 0.9)));
  writeOn(ctx, 'build faster?', W / 2, 440, '700 116px Oleo', ss(seg(u, 0.95, 1.7)));
  sparkle(ctx, 905, 330, 34 * ss(seg(u, 1.7, 1.9)), { rot: 0.2, fill: PAL.white });
  return { focus: [W / 2, H / 2] };
}

function drawSection(ctx, t, s) {
  ctx.save(); let r = {};
  r = ({ hook: sceneHook, title: sceneTitle, r1: sceneR1, r2: sceneR2, r3: sceneR3, sum: sceneSum, end: sceneEnd })[s.id](ctx, t, s) || {};
  ctx.restore(); return r;
}
const isReason = s => s && /^r\d$/.test(s.id);
export function renderFilm(ctx, t, Q) {
  setClock(t);
  const L = TL.S, i = L.indexOf(section(t)), s = L[i], nx = L[i + 1], pv = L[i - 1];
  ctx.save();
  const irisOut = isReason(nx) && t >= nx.t0 - BEAT * 0.5 ? nx : null;
  const irisIn = isReason(s) && pv && t < s.t0 + BEAT * 0.4 ? s : null;
  const wipe = (s.id === 'title' && t < s.t0 + 0.25) || (s.id === 'sum' && t < s.t0 + 0.3) || (s.id === 'end' && t < s.t0 + 0.3);
  if (irisOut || irisIn) {
    const inc = irisOut || irisIn, prev = L[L.indexOf(inc) - 1], n = +inc.id[1] - 1;
    const k = eio(seg(t, inc.t0 - BEAT * 0.5, inc.t0 + BEAT * 0.4));
    const f = drawSection(ctx, Math.min(t, inc.t0 - 1e-3), prev).focus;
    if (prev.id !== 'title') medallion(ctx, f[0], f[1], n, 90, 1);
    const cx = lerp(f[0], W / 2, k), cy = lerp(f[1], H / 2, k), r = lerp(90, 1200, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); drawSection(ctx, Math.max(t, inc.t0 + 1e-3), inc); ctx.restore();
    ink(ctx, ellipse(cx, cy, r, r, 90), 7, { closed: true, seed: 960 });
    if (k < 0.5) { ctx.save(); ctx.globalAlpha = 1 - k * 2; ctx.translate(cx, cy); ctx.scale(1 + k * 3, 1 + k * 3);
      text(ctx, String(n + 1), 0, 34, { font: '96px Slab', fill: COL.ink, plate: PAL.white, off: [5, 5], align: 'center' }); ctx.restore(); }
  } else if (wipe) {
    const d = s.id === 'title' ? 0.25 : 0.3, k = eio(seg(t, s.t0, s.t0 + d));
    drawSection(ctx, pv.t1 - 1e-3, pv);
    ctx.save(); ctx.beginPath();
    if (s.id === 'title') ctx.rect(0, H * (1 - k), W, H); else if (s.id === 'sum') ctx.rect(W * (1 - k), 0, W, H); else ctx.rect(0, 0, W, H * k);
    ctx.clip(); drawSection(ctx, t, s); ctx.restore();
    if (s.id === 'title') ink(ctx, [[-10, H * (1 - k)], [W + 10, H * (1 - k)]], 6, { seed: 962 });
    else if (s.id === 'sum') ink(ctx, [[W * (1 - k), -10], [W * (1 - k), H + 10]], 6, { seed: 963 });
    else ink(ctx, [[-10, H * k], [W + 10, H * k]], 6, { seed: 964 });
  } else {
    // a medallion stamps onto the outgoing reason's subject one beat before its iris
    drawSection(ctx, t, s);
  }
  if (isReason(s) && isReason(nx) && t >= nx.t0 - BEAT && t < nx.t0 - BEAT * 0.5) {
    const f = ({ r1: [820, 1000], r2: [COLX[1], BASE2 - 5 * STEP2 + 20] })[s.id];
    medallion(ctx, f[0], f[1], +nx.id[1] - 1, 90, pop(t, nx.t0 - BEAT, 0.2));
  }
  ctx.restore();
  // iris-out at the very end, onto the house
  if (s.id === 'end') {
    const u = t - s.t0, k1 = eio(seg(u, 4.9, 5.6)), k2 = eio(seg(u, 5.85, 6.25));
    if (k1 > 0) {
      const r = lerp(1200, 330, k1) * (1 - k2);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(HX, 1060, Math.max(0.1, r), 0, TAU, true); ctx.fillStyle = COL.ink; ctx.fill('evenodd'); ctx.restore();
      if (r > 1) ink(ctx, ellipse(HX, 1060, r, r, 90), 6, { closed: true, seed: 965, color: PAL.inkSoft });
    }
  }
  paperFinish(ctx, W, H, 1);
  if (!(Q && Q.has('nosubs'))) caption(ctx, t);
}

// ---------------------------------------------------------------- sound events (the same times drive the pictures)
function buildEvents() {
  EVS = [];
  TL.V.forEach(v => ev(v.t, 'vo', { id: v.id }));
  const h = S('hook').t0, ti = S('title').t0, r1 = S('r1').t0, r2 = S('r2').t0, r3 = S('r3').t0, su = S('sum').t0, en = S('end').t0;
  ev(h + 0.0, 'pop', { gain: 0.8 }); ev(h + 0.2, 'pen_write', { dur: 0.9 }); ev(h + 0.55, 'paper_swish', { gain: 0.6 });
  ev(h + 6.43, 'whistle_up', {}); ev(h + 6.43, 'ding', { gain: 0.6 }); ev(h + 6.5, 'ticker', { dur: 0.85 }); ev(h + 8.85, 'stamp', {});
  ev(ti, 'paper_swish', {}); ev(ti + 0.15, 'stamp', { gain: 0.7 }); ev(ti + 0.75, 'pen_write', { dur: 0.55 });
  [0, 1, 2].forEach(i => ev(ti + B(4 + i), 'stamp', { gain: 0.9 }));
  [r1, r2, r3].forEach((t0, i) => { if (i) ev(t0 - BEAT, 'stamp', {}); ev(t0 - BEAT * 0.5, 'iris', { dur: BEAT * 0.9 }); ev(t0 + 0.05, 'slide', { gain: 0.5 }); });
  ev(r1 + B(7), 'wood_knock', {});
  WALKERS.forEach((_, i) => { const t0 = r1 + 4.3 + i * 0.42; for (let k = 0; k < 4; k++) ev(t0 + k * 0.5, 'step', { gain: 0.35, pan: -0.6 + k * 0.2 }); });
  ev(r1 + B(11), 'pop', {}); ev(r1 + 7.9, 'plane', { dur: 2.7 });
  CROWD.forEach(([, , , n]) => { if (n % 2 === 0) ev(r1 + 9.0 + n * 0.11, 'pip', { n, gain: 0.35 }); });
  ev(r1 + 11.0, 'pop', {}); ev(r1 + 11.1, 'ticker', { dur: 0.8 });
  for (let i = 0; i < 6; i++) ev(r2 + B(5) + i * BEAT * 0.5, 'celesta_pip', { n: i });
  ev(r2 + 4.3, 'stamp', { gain: 0.6 });
  for (let i = 0; i < 5; i++) ev(r2 + 6.43 + i * BEAT * 0.5, 'celesta_pip', { n: i });
  ev(r2 + 8.0, 'ticker', { dur: 0.7 }); ev(r2 + 9.1, 'tock', {}); ev(r2 + 9.3, 'tock', { gain: 0.7 }); ev(r2 + 9.4, 'whoosh', { dur: 0.3 }); ev(r2 + 9.65, 'pop', {});
  ev(r3 + 2.95, 'wood_knock', {}); ev(r3 + 3.48, 'clank', {}); ev(r3 + 4.02, 'ding', { gain: 0.6 });
  [2.95, 3.48, 4.02].forEach(x => ev(r3 + x + 0.25, 'whistle_up', { gain: 0.5, short: 1 }));
  for (let k = 0; k < 8; k++) ev(r3 + 2.4 + k * 0.67, 'hammer', { gain: 0.35 });
  ev(r3 + 5.9, 'pop', {});
  ev(su, 'paper_swish', {}); [0.2, 1.15, 2.1].forEach(x => ev(su + x, 'stamp', { gain: 0.8 }));
  ev(su + 2.0, 'wood_knock', { gain: 0.6 }); ev(su + B(6), 'thump', {}); ev(su + 4.8, 'pop', {}); ev(su + 5.9, 'whistle_up', {});
  ev(en, 'paper_swish', { gain: 0.6 }); ev(en + 0.3, 'pen_write', { dur: 1.4 }); ev(en + 1.7, 'pop', { gain: 0.4 });
  ev(en + 4.9, 'iris', { dur: 0.7 }); ev(en + 5.85, 'iris', { dur: 0.4 });
  EVS.sort((a, b) => a.t - b.t);
}
