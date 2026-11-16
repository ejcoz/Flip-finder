// Tacoma Narrows — Blueprint style, 1080×1920, 24 fps.
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from '/core/lib.js';
import { T, CUES, VOICE } from './timeline.js';

const W = innerWidth, H = innerHeight;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');

const SW = 1000, SH = 1900;           // sheet units
const BASE = W / SW;                  // px per unit at zoom 1
const TS = 2.0;                       // texture px per sheet unit
const INK = '#E7F0F9';
const RED = '#D0342C';
const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

// ───────────────────────── paper ─────────────────────────
function n2(x, y) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a, b) => hash(a * 157.31 + b * 311.7 + 0.5);
  return lerp(lerp(h(i, j), h(i + 1, j), u), lerp(h(i, j + 1), h(i + 1, j + 1), u), v); }
function fbm(x, y) { let s = 0, a = .5, f = 1; for (let o = 0; o < 5; o++) { s += a * n2(x * f, y * f); a *= .5; f *= 2.03; } return s; }
function mixHex(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
  return A.map((v, i) => Math.round(lerp(v, B[i], t))); }

function makePaper() {
  const tex = document.createElement('canvas'); tex.width = SW * TS; tex.height = SH * TS;
  const g = tex.getContext('2d');
  // low-frequency coating
  const lw = 250, lh = 475, low = document.createElement('canvas'); low.width = lw; low.height = lh;
  const lg = low.getContext('2d'), id = lg.createImageData(lw, lh);
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
    let v = fbm(x / 38, y / 38) * .75 + fbm(x / 9 + 40, y / 9) * .25;
    v += (n2(x / 3, y / 90) - .5) * .18;                  // coating streaks (vertical brush)
    const c = mixHex('#17306A', '#2B5AA8', clamp((v - .25) * 1.6));
    const k = (y * lw + x) * 4; id.data[k] = c[0]; id.data[k + 1] = c[1]; id.data[k + 2] = c[2]; id.data[k + 3] = 255;
  }
  lg.putImageData(id, 0, 0);
  g.imageSmoothingQuality = 'high'; g.drawImage(low, 0, 0, tex.width, tex.height);
  g.scale(TS, TS);
  const R = mulberry(11);
  // fibres
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = R() * SW, y = R() * SH, a = R() * TAU, l = 3 + R() * 9;
    g.strokeStyle = R() < .6 ? 'rgba(190,215,255,0.07)' : 'rgba(8,20,50,0.10)'; g.lineWidth = .35;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // specks
  for (let i = 0; i < 1400; i++) {
    const x = R() * SW, y = R() * SH, r = .2 + R() * R() * 1.1;
    g.fillStyle = R() < .7 ? `rgba(210,230,255,${.08 + R() * .18})` : `rgba(5,15,40,${.15 + R() * .2})`;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  // fold creases (one horizontal, one vertical)
  const crease = (x0, y0, x1, y1, nx, ny) => {
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(200,225,255,0.10)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.lineWidth = 1.0; g.strokeStyle = 'rgba(5,15,40,0.22)'; g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx, y1 + ny); g.stroke();
    g.lineWidth = 6; g.strokeStyle = 'rgba(160,195,240,0.035)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  };
  crease(0, 1080, SW, 1078, 0, 1.2); crease(503, 0, 499, SH, 1.2, 0);
  // bleached edges
  const edge = 34;
  for (const [x0, y0, x1, y1, w, h] of [[0, 0, edge, 0, edge, SH], [SW, 0, SW - edge, 0, edge, SH], [0, 0, 0, edge, SW, edge], [0, SH, 0, SH - edge, SW, edge]]) {
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(120,165,225,0.42)'); gr.addColorStop(1, 'rgba(120,165,225,0)');
    g.fillStyle = gr; g.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h);
  }
  // a couple of old water stains
  for (const [x, y, r] of [[860, 420, 70], [140, 1500, 90]]) {
    const gr = g.createRadialGradient(x, y, r * .2, x, y, r); gr.addColorStop(0, 'rgba(10,25,70,0.10)'); gr.addColorStop(.92, 'rgba(10,25,70,0.06)'); gr.addColorStop(.97, 'rgba(170,200,240,0.10)'); gr.addColorStop(1, 'rgba(170,200,240,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  return tex;
}

// ───────────────────────── camera ─────────────────────────
const keys = [ // [t, cx, cy, z, ease-to-this-key]
];
function camAt(t) {
  let c;
  if (t < T.S2) { const p = eio(seg(t, 0, T.S2)); c = { x: 500, y: lerp(640, 560, p), z: lerp(0.98, 1.12, p) }; }
  else if (t < T.S3) { const p = eio(seg(t, T.S2, T.S2 + 4.6)); c = { x: lerp(650, 345, p), y: 480, z: 1.45 }; }
  else if (t < T.snap + .25) { const p = ss(seg(t, T.S3, T.snap)); c = { x: 500, y: lerp(700, 690, p), z: lerp(1.6, 1.74, p) }; }
  else if (t < T.fig + .3) { const p = eio(seg(t, T.snap + .25, T.snap + 1.6)); c = { x: 500, y: lerp(690, 640, p), z: lerp(1.74, 1.34, p) }; }
  else if (t < T.pull) { const p = eio(seg(t, T.fig + .3, T.fig + 1.9)); c = { x: 500, y: lerp(640, 1330, p), z: lerp(1.34, 1.32, p) }; }
  else { const p = eio(seg(t, T.pull, T.pull + 2.7)); c = { x: 500, y: lerp(1330, 950, p), z: lerp(1.32, 0.935, p) }; }
  // impact bumps
  for (const [tb, a] of [[T.snap, 7], [T.stamp, 4.5]]) {
    const d = t - tb; if (d >= 0 && d < .5) { const e = Math.exp(-d * 9) * a; c.x += Math.sin(d * 63) * e / c.z / BASE; c.y += Math.cos(d * 51) * e / c.z / BASE; }
  }
  return c;
}
let CAM = { x: 500, y: 600, z: 1 }, K = 1;
const toS = (x, y) => [(x - CAM.x) * K + W / 2, (y - CAM.y) * K + H / 2];
const lwU = w => w * Math.pow(CAM.z, .65) / CAM.z; // screen-px weight at z=1 → units

// ───────────────────────── ink primitives ─────────────────────────
let PAPER = null;
const WT = { out: 2.7, det: 1.9, thin: 1.25, hair: .85 };
function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function cut(p, f) { // truncate polyline at fraction f of its arc length
  if (f >= 1) return p; if (f <= 0) return [p[0]];
  const L = polyLen(p) * f; let acc = 0; const out = [p[0]];
  for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (acc + d >= L) { const k = (L - acc) / d; out.push([lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]); return out; }
    acc += d; out.push(p[i]); }
  return out;
}
function trace(p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); }
function nib(x, y, a = 1) {
  const r = 7 / K; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${.95 * a})`); g.addColorStop(.35, `rgba(220,240,255,${.45 * a})`); g.addColorStop(1, 'rgba(220,240,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
// stroke a polyline, drawn on to fraction f
function line(p, f = 1, w = WT.det, o = {}) {
  if (f <= 0 || p.length < 2) return;
  const q = cut(p, f); if (q.length < 2) return;
  const lw = lwU(w), a = o.a ?? 1;
  ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash(o.dash || []); ctx.lineDashOffset = o.off || 0;
  trace(q); if (o.close && f >= 1) ctx.closePath();
  ctx.strokeStyle = `rgba(200,225,255,${.10 * a})`; ctx.lineWidth = lw * 2.8; ctx.stroke();
  ctx.strokeStyle = INK; ctx.globalAlpha = .93 * a; ctx.lineWidth = lw; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  if (f < 1 && !o.noNib) { const e = q[q.length - 1]; nib(e[0], e[1], a); }
}
function paperFill(p) { ctx.fillStyle = PAPER; trace(p); ctx.closePath(); ctx.fill(); }
function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]; }
const DASH = { centre: [22, 5, 4, 5], hidden: [6, 4], phantom: [24, 4, 4, 4, 4, 4] };
// 45° hatch inside a polygon (closed) — drawn on progressively
function hatch(poly, sp, f = 1, w = WT.hair, ang = 45) {
  if (f <= 0) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  ctx.save(); trace(poly); ctx.closePath(); ctx.clip();
  const c = Math.cos(ang * D2R), s = Math.sin(ang * D2R), R = Math.hypot(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const n = Math.ceil(2 * R / sp), m = Math.floor(n * f);
  ctx.strokeStyle = INK; ctx.globalAlpha = .8; ctx.lineWidth = lwU(w); ctx.beginPath();
  for (let i = 0; i <= m; i++) { const d = -R + i * sp; const px = cx - s * d, py = cy + c * d;
    ctx.moveTo(px - c * R, py - s * R); ctx.lineTo(px + c * R, py + s * R); }
  ctx.stroke(); ctx.globalAlpha = 1; ctx.restore();
}
// text, lettered on left→right
function text(str, x, y, size, f = 1, o = {}) {
  if (f <= 0) return;
  ctx.font = `${size}px ${o.font || 'AD'}`; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(str).width; let x0 = x;
  if (o.align === 'center') x0 = x - w / 2; else if (o.align === 'right') x0 = x - w;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 2, y - size * 1.2, (w + 4) * clamp(f), size * 1.8); ctx.clip();
  ctx.fillStyle = o.color || INK; ctx.globalAlpha = (o.a ?? 1) * .95; ctx.fillText(str, x0, y); ctx.restore();
  if (f < 1) nib(x0 + w * f, y - size * .3, o.a ?? 1);
  return w;
}
function textW(str, size, font = 'AD') { ctx.font = `${size}px ${font}`; return ctx.measureText(str).width; }
function arrowHead(x, y, ang, s, a = 1) {
  ctx.fillStyle = INK; ctx.globalAlpha = .93 * a; ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(ang - .32) * s, y - Math.sin(ang - .32) * s); ctx.lineTo(x - Math.cos(ang + .32) * s, y - Math.sin(ang + .32) * s); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
}
// a dimension line between two points at height y with extension lines
function dimH(x0, x1, y, yRef0, yRef1, label, f, size = 16) {
  if (f <= 0) return;
  const fe = seg(f, 0, .35), fd = seg(f, .3, .7), ft = seg(f, .65, 1);
  line([[x0, yRef0], [x0, y - 8]], fe, WT.hair); line([[x1, yRef1], [x1, y - 8]], fe, WT.hair);
  const m = (x0 + x1) / 2, tw = textW(label, size) + 16;
  line([[m, y], [x0, y]], fd, WT.thin); line([[m, y], [x1, y]], fd, WT.thin);
  if (fd >= 1) { arrowHead(x0, y, Math.PI, 9); arrowHead(x1, y, 0, 9); }
  // paper gap behind the label
  if (ft > 0) { ctx.fillStyle = PAPER; ctx.fillRect(m - tw / 2, y - size * .8, tw, size * 1.2); text(label, m, y + size * .35, size, ft, { align: 'center' }); }
}

// ───────────────────────── bridge model ─────────────────────────
const B = { a1: 40, t1: 250, t2: 750, a2: 960, top: 320, deck: 480, water: 560, foot: 612, cmid: 456, hw: 30, g: 6 };
const OB = { dx: Math.cos(-33 * D2R), dy: Math.sin(-33 * D2R) };
let OBF = 0; // oblique factor
const P3 = (x, y, z) => [x + OBF * z * OB.dx, y + OBF * z * OB.dy]; // z positive = away
const cableY = x => { if (x >= B.t1 && x <= B.t2) { const u = (x - B.t1) / (B.t2 - B.t1); return B.top + (B.cmid - B.top) * (1 - (2 * u - 1) ** 2); }
  if (x < B.t1) { const s = (B.t1 - x) / (B.t1 - B.a1); return lerp(B.top, B.deck + 8, s) + 14 * Math.sin(Math.PI * s); }
  const s = (x - B.t2) / (B.a2 - B.t2); return lerp(B.top, B.deck + 8, s) + 14 * Math.sin(Math.PI * s); };

// motion state of the main span at time t
function motion(t) {
  const amp = t < T.twist0 ? 0 : (1.5 + 22.5 * Math.pow(seg(t, T.twist0, T.snap), 1.5)) * D2R;
  const vam = t < T.S3 ? 0 : 5 * seg(t, T.S3, T.twist0 + 2) * (1 - .6 * seg(t, T.twist0 + 2, T.snap));
  const ph = TAU * .56 * (t - T.twist0);
  return { amp, vam, ph };
}
function deckState(u, t) { // twist θ (rad), vertical up (units)
  const tt = Math.min(t, T.snap); const m = motion(tt);
  let th = m.amp * Math.sin(TAU * u) * Math.sin(m.ph), v = m.vam * Math.sin(TAU * u) * Math.cos(TAU * .5 * (tt - T.S3));
  if (t > T.snap) { // after the break the stubs sag and the twist dies away
    const d = t - T.snap, decay = Math.exp(-d * 1.6) * Math.cos(d * 7);
    th *= decay; v *= decay;
    const droop = 34 * eo(seg(d, 0, .9)) + 3 * Math.sin(d * 9) * Math.exp(-d * 3);
    if (u < .5) v -= droop * Math.pow(clamp(u / .3), 1.6); else v -= droop * Math.pow(clamp((1 - u) / .3), 1.6);
  }
  return { th, v };
}
function edgePt(x, th, v, s, bottom = false) { // s = +1 far edge, -1 near edge
  let z = s * B.hw * Math.cos(th), up = s * B.hw * Math.sin(th) + v;
  if (bottom) { z += B.g * Math.sin(th); up -= B.g * Math.cos(th); }
  return P3(x, B.deck - up, z);
}
const BREAK = [.3, .7];
const CHUNKS = [{ u0: .3, u1: .44, dl: 0.00, rot: -22, dx: -6 }, { u0: .44, u1: .57, dl: .14, rot: 9, dx: 2 }, { u0: .57, u1: .7, dl: .06, rot: 26, dx: 7 }];
const FALLG = 260;

// build deck band polygons for span segment [ua, ub] of the main span (or a side span with static state)
function deckBand(xa, xb, n, stateFn) {
  const topN = [], topF = [], botN = [];
  for (let i = 0; i <= n; i++) { const x = lerp(xa, xb, i / n); const { th, v } = stateFn(x);
    topN.push(edgePt(x, th, v, -1)); topF.push(edgePt(x, th, v, 1)); botN.push(edgePt(x, th, v, -1, true)); }
  return { topN, topF, botN };
}
function drawBand(b, f, beams = true) {
  const surf = [...b.topN, ...b.topF.slice().reverse()];
  const face = [...b.topN, ...b.botN.slice().reverse()];
  if (OBF > .01) { paperFill(surf); line(b.topF, f, WT.det); }
  paperFill(face);
  if (OBF > .01 && beams && f >= 1) for (let i = 0; i < b.topN.length; i += 3) line([b.topN[i], b.topF[i]], 1, WT.hair, { a: .7 });
  line(b.topN, f, WT.out); line(b.botN, f, WT.det);
  if (f >= 1) { line([b.topN[0], b.botN[0]], 1, WT.det); line([b.topN[b.topN.length - 1], b.botN[b.botN.length - 1]], 1, WT.det); }
}
const xOf = u => lerp(B.t1, B.t2, u);
const mainState = t => x => { const u = (x - B.t1) / (B.t2 - B.t1); return deckState(u, t); };
const sideState = t => x => { const m = motion(Math.min(t, T.snap)); const k = x < B.t1 ? (B.t1 - x) / (B.t1 - B.a1) : (x - B.t2) / (B.a2 - B.t2);
  let th = m.amp * .22 * Math.sin(Math.PI * k) * Math.sin(m.ph + 1), v = 0;
  if (t > T.snap) th *= Math.exp(-(t - T.snap) * 1.6);
  return { th, v }; };
// main cable y with rise after the break (load released)
function mainCableY(x, t) { let y = cableY(x); if (x > B.t1 && x < B.t2 && t > T.snap) { const u = (x - B.t1) / (B.t2 - B.t1); y -= 26 * eo(seg(t, T.snap, T.snap + 1.4)) * (1 - (2 * u - 1) ** 2); }
  if (x > B.t1 && x < B.t2 && t > T.S3) { const u = (x - B.t1) / (B.t2 - B.t1); y -= deckState(u, t).v * .55; }
  return y; }

function drawBridge(t) {
  const F = (a, b) => seg(t, a, b);
  // shore lines and water
  const fw = F(0.05, .75);
  line([[60, 486], [16, 486]], seg(fw, 0, .2), WT.det); line([[60, 486], [84, 520], [104, 560]], seg(fw, 0, .25), WT.det);
  line([[940, 486], [984, 486]], seg(fw, .7, 1), WT.det); line([[940, 486], [916, 520], [896, 560]], seg(fw, .75, 1), WT.det);
  // water line drawn like a T-square slide
  line([[104, B.water], [896, B.water]], seg(fw, .1, .9), WT.det);
  const fwt = F(4.0, 4.7);
  for (let i = 0; i < 26; i++) { const x = 130 + i * 30 + (i % 2) * 8; if (i / 26 < fwt) line([[x, B.water + 9], [x + 14, B.water + 9]], 1, WT.hair, { a: .7 }); }
  // bank hatch
  hatch([[16, 486], [60, 486], [84, 520], [104, 560], [104, 600], [16, 600]], 10, F(4.0, 4.6));
  hatch([[984, 486], [940, 486], [916, 520], [896, 560], [896, 600], [984, 600]], 10, F(4.0, 4.6));
  // tower centre lines
  for (const x of [B.t1, B.t2]) line([[x, 288], [x, 640]], F(.67, 1.33), WT.hair, { dash: DASH.centre, a: .8 });

  const draw1 = F(1.33, 2.0);
  // pier footings
  for (const x of [B.t1, B.t2]) {
    const pr = [[x - 14, B.water - 14], [x + 14, B.water - 14], [x + 14, B.foot], [x - 14, B.foot], [x - 14, B.water - 14]];
    paperFill(pr); line(pr, draw1, WT.det);
    hatch(pr, 7, F(4.1, 4.6));
  }
  // far legs (oblique) first
  const leg = (x, z) => { const a = P3(x - 5, B.top - 10, z), b = P3(x + 5, B.top - 10, z), c = P3(x + 5, B.water - 14, z), d = P3(x - 5, B.water - 14, z); return [a, b, c, d, a]; };
  if (OBF > .01) for (const x of [B.t1, B.t2]) { const l = leg(x, B.hw); paperFill(l); line(l, 1, WT.det, { a: .8 }); }
  // far cable + far hangers (oblique only)
  const cablePts = (z) => { const p = []; for (let x = B.a1; x <= B.a2; x += 6) p.push(P3(x, mainCableY(x, t), z)); return p; };
  const fc = F(2.0, 2.9), fh = F(3.33, 4.4);
  const ms = mainState(t);
  const hangerXs = []; for (let x = B.t1 + 20; x < B.t2 - 5; x += 20) hangerXs.push(x);
  const broken = x => { const u = (x - B.t1) / (B.t2 - B.t1); const dm = Math.abs(u - .5); const tb = T.snap + (dm / .25) * .45; return u > BREAK[0] - .06 && u < BREAK[1] + .06 ? tb : 1e9; };
  const hanger = (x, s, a) => {
    const { th, v } = ms(x); const ct = P3(x, mainCableY(x, t), s * B.hw); const tb = broken(x);
    if (t < tb) { const de = edgePt(x, th, v, s); line([ct, de], 1, WT.hair, { a }); }
    else { const d = t - tb, rec = eo(seg(d, 0, .35)) * .85; if (d < 1.4) { const de = edgePt(x, th, v, s); const L = de[1] - ct[1];
      const wob = Math.sin(d * 40) * 6 * Math.exp(-d * 5);
      line([ct, [ct[0] + wob, ct[1] + L * (1 - rec)]], 1, WT.hair, { a: a * (1 - seg(d, .6, 1.4)) }); } }
  };
  if (OBF > .01) { line(cablePts(B.hw), 1, WT.det, { a: .75 }); hangerXs.forEach(x => hanger(x, 1, .6)); }

  // deck: side spans and main span
  const fd = F(2.67, 3.33);
  const st = sideState(t);
  drawBand(deckBand(B.a1 + 18, B.t1, 12, st), seg(fd, 0, .3));
  drawBand(deckBand(B.t2, B.a2 - 18, 12, st), seg(fd, .7, 1));
  if (t < T.snap) drawBand(deckBand(B.t1, B.t2, 60, ms), seg(fd, .25, .75));
  else {
    drawBand(deckBand(B.t1, xOf(BREAK[0]), 22, ms), 1, true);
    drawBand(deckBand(xOf(BREAK[1]), B.t2, 22, ms), 1, true);
    drawChunks(t);
  }
  // near legs + portal struts
  for (const x of [B.t1, B.t2]) {
    const l = leg(x, -B.hw); paperFill(l); line(l, draw1, WT.out);
    for (const yy of [B.top + 18, B.deck + 22]) { const a = P3(x - 5, yy, -B.hw), b = P3(x + 5, yy, -B.hw);
      if (OBF > .01) line([a, P3(x - 5, yy, B.hw)], 1, WT.thin); line([[a[0], a[1]], [b[0], b[1]]], draw1, WT.thin); }
    const cap = [P3(x - 8, B.top - 10, -B.hw), P3(x + 8, B.top - 10, -B.hw), P3(x + 8, B.top - 16, -B.hw), P3(x - 8, B.top - 16, -B.hw)];
    paperFill(cap); line([...cap, cap[0]], draw1, WT.det);
  }
  // near cable
  line(cablePts(-B.hw), fc, WT.out);
  // anchorages
  for (const x of [B.a1, B.a2]) { const r = [[x - 16, B.deck + 2], [x + 16, B.deck + 2], [x + 16, B.deck + 30], [x - 16, B.deck + 30], [x - 16, B.deck + 2]];
    paperFill(r); line(r, F(2.6, 3.0), WT.det); hatch(r, 6, F(4.2, 4.6)); }
  // near hangers, staggered left→right
  hangerXs.forEach((x, i) => { const k = i / hangerXs.length; if (fh > k) hanger(x, -1, 1); });
  // side span hangers
  for (let x = B.a1 + 30; x < B.t1 - 5; x += 22) { const k = (x - B.a1) / 900; if (fh > k) { const { th, v } = st(x); line([P3(x, cableY(x), -B.hw), edgePt(x, th, v, -1)], 1, WT.hair); } }
  for (let x = B.t2 + 22; x < B.a2 - 25; x += 22) { const k = (x - B.a1) / 900; if (fh > k) { const { th, v } = st(x); line([P3(x, cableY(x), -B.hw), edgePt(x, th, v, -1)], 1, WT.hair); } }
}

function chunkGeom(c, t) { // rigid chunk: frozen at the snap, then falls and rotates
  const n = 8, pts = [];
  const ms = mainState(T.snap - 1e-3);
  const b = deckBand(xOf(c.u0), xOf(c.u1), n, ms);
  const d = Math.max(0, t - T.snap - c.dl);
  const cx = (xOf(c.u0) + xOf(c.u1)) / 2, cy = B.deck;
  const dy = .5 * FALLG * d * d, rot = c.rot * D2R * eo(seg(d, 0, 1.1)) * (1 + d * .3), dx = c.dx * d * 4;
  const tf = p => { const x = p[0] - cx, y = p[1] - cy; const cs = Math.cos(rot), sn = Math.sin(rot); return [cx + dx + x * cs - y * sn, cy + dy + x * sn + y * cs]; };
  return { topN: b.topN.map(tf), topF: b.topF.map(tf), botN: b.botN.map(tf), d };
}
function drawChunks(t) {
  for (const c of CHUNKS) {
    const g = chunkGeom(c, t); if (g.d > 2.2) continue;
    // above water: solid
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, SW, B.water); ctx.clip(); drawBand(g, 1, true); ctx.restore();
    // below water: hidden lines, fading
    const a = 1 - seg(g.d, .7, 1.8);
    if (a > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, B.water + 1, SW, 120); ctx.clip();
      line(g.topN, 1, WT.thin, { dash: DASH.hidden, a }); line(g.botN, 1, WT.thin, { dash: DASH.hidden, a }); if (OBF > .01) line(g.topF, 1, WT.thin, { dash: DASH.hidden, a: a * .7 }); ctx.restore(); }
  }
}
function splashT(c) { // time the chunk reaches the water
  const drop = B.water - B.deck - 4; return T.snap + c.dl + Math.sqrt(2 * drop / FALLG);
}
function drawSplash(t) {
  for (const c of CHUNKS) {
    const ts = splashT(c), d = t - ts; if (d < 0 || d > 1.8) continue;
    const x = (xOf(c.u0) + xOf(c.u1)) / 2 + c.dx * (ts - T.snap - c.dl) * 4, a = 1 - seg(d, .9, 1.8);
    const R = mulberry(Math.round(c.u0 * 100));
    for (let i = 0; i < 9; i++) { // droplet arcs
      const ang = lerp(-2.6, -.55, i / 8) + (R() - .5) * .2, sp = 70 + R() * 70;
      const pts = []; for (let k = 0; k <= 8; k++) { const tt = Math.min(d, 1.0) * k / 8; pts.push([x + Math.cos(ang) * sp * tt * 1.3, B.water + Math.sin(ang) * sp * tt * 1.6 + 140 * tt * tt]); }
      line(pts.filter(p => p[1] <= B.water + 1), 1, WT.hair, { a: a * .9 });
    }
    // rings on the water line
    for (let k = 0; k < 3; k++) { const r = 20 + (d - k * .15) * 110; if (r > 20) line([[x - r, B.water + 4 + k * 4], [x - r * .55, B.water + 4 + k * 4]], 1, WT.hair, { a: a * .8 }), line([[x + r * .55, B.water + 4 + k * 4], [x + r, B.water + 4 + k * 4]], 1, WT.hair, { a: a * .8 }); }
  }
}

// wind streaks over the main span (oblique: travelling toward the viewer, down-left)
function drawWindBridge(t) {
  const on = seg(t, T.S3, T.S3 + 1.0) * (1 - seg(t, T.snap + 1.5, T.snap + 3.5)); if (on <= 0) return;
  const R = mulberry(5), N = 34, spd = 150 + 140 * seg(t, T.twist0, T.snap);
  for (let i = 0; i < N; i++) {
    const x0 = 240 + R() * 560, y0 = 300 + R() * 240, ph = R(), len = 40 + R() * 40;
    const life = 1.6, k = ((t * spd / 400 + ph) % 1);
    const sx = x0 + 90 * OB.dx - k * 180 * OB.dx, sy = y0 + 90 * OB.dy - k * 180 * OB.dy;
    const a = Math.sin(Math.PI * k) * on * .75;
    const ex = sx - OB.dx * len, ey = sy - OB.dy * len;
    line([[sx, sy], [ex, ey]], 1, WT.hair, { a, dash: [10, 6], cap: 'butt' });
    arrowHead(ex, ey, Math.atan2(-OB.dy, -OB.dx), 6, a);
  }
}

// ───────────────────────── section A-A ─────────────────────────
const SEC = { x: 404, y: 880 };
function sectionTheta(t) { const s = deckState(.25, t); return s.th; }
function drawSection(t) {
  const f0 = seg(t, T.secDraw, T.secDraw + .5), fh = seg(t, T.secDraw + .4, T.secDraw + .8), fl = seg(t, T.secDraw + .8, T.secDraw + 1.7);
  if (f0 <= 0) return;
  const th = sectionTheta(t);
  // wind streamlines (behind the section)
  drawSectionWind(t, th);
  ctx.save(); ctx.translate(SEC.x, SEC.y); ctx.rotate(-th);
  const L = 136;
  const slab = [[-L + 4, -8], [L - 4, -8], [L - 4, 0], [-L + 4, 0], [-L + 4, -8]];
  const girder = s => { const x = s * L; return [[x - 4, -14], [x + 4, -14], [x + 4, 46], [x - 4, 46], [x - 4, -14]]; };
  const flange = (s, y) => { const x = s * L; return [[x - 9, y], [x + 9, y], [x + 9, y + 4], [x - 9, y + 4], [x - 9, y]]; };
  for (const p of [slab, girder(-1), girder(1), flange(-1, -16), flange(1, -16), flange(-1, 44), flange(1, 44)]) { paperFill(p); }
  line(slab, f0, WT.out); for (const s of [-1, 1]) { line(girder(s), f0, WT.out); line(flange(s, -16), f0, WT.det); line(flange(s, 44), f0, WT.det); }
  hatch(slab, 5, fh); hatch(girder(-1), 5, fh); hatch(girder(1), 5, fh);
  line([[-L + 6, 28], [L - 6, 28]], f0, WT.thin, { dash: DASH.hidden }); // floor beam
  line([[0, -40], [0, 70]], f0, WT.hair, { dash: DASH.centre });
  ctx.restore();
  // live angle annotation
  if (fl > 0 && t > T.twist0 + .4 && t < T.snap + 2) {
    const a = 1 - seg(t, T.snap + .8, T.snap + 2);
    const r = 120; line([[SEC.x + 40, SEC.y], [SEC.x + 175, SEC.y]], 1, WT.hair, { dash: DASH.centre, a });
    const arc = []; for (let k = 0; k <= 16; k++) { const aa = -th * k / 16; arc.push([SEC.x + Math.cos(aa) * r, SEC.y + Math.sin(aa) * r]); }
    line(arc, 1, WT.thin, { a });
    const deg = Math.abs(th / D2R);
    text(`θ = ${deg.toFixed(0)}°`, SEC.x + r + 18, SEC.y - Math.sign(th || 1) * 12 + 6, 17, 1, { a });
  }
  // labels
  text('SECTION A-A', SEC.x, SEC.y + 118, 20, fl, { align: 'center' });
  text('DECK 39 FT · SOLID PLATE GIRDER 8 FT DEEP', SEC.x, SEC.y + 142, 13, seg(fl, .2, 1), { align: 'center', font: 'B612' });
}
function drawSectionWind(t, th) {
  const on = seg(t, T.secDraw, T.secDraw + .8) * (1 - seg(t, T.snap + 1.5, T.snap + 3.6)); if (on <= 0) return;
  // body extents after rotation
  const corners = [[-136, -16], [136, -16], [-136, 48], [136, 48]].map(([x, y]) => [x * Math.cos(-th) - y * Math.sin(-th), x * Math.sin(-th) + y * Math.cos(-th)]);
  const top = Math.min(...corners.map(c => c[1])), bot = Math.max(...corners.map(c => c[1])), mid = (top + bot) / 2;
  const strength = .35 + .65 * seg(t, T.twist0, T.snap);
  for (let i = 0; i < 9; i++) {
    const y0 = -84 + i * 22; const pts = [];
    for (let x = -322; x <= 400; x += 8) {
      let dy = 0; const gx = x < 0 ? Math.exp(-(((x + 10) / 150) ** 2)) : Math.exp(-((x / 260) ** 2));
      if (y0 <= mid) dy = (y0 > top - 16 ? (top - 16 - y0) : -10 * Math.exp(-(top - 16 - y0) / 30)) * gx;
      else dy = (y0 < bot + 16 ? (bot + 16 - y0) : 10 * Math.exp(-(y0 - bot - 16) / 30)) * gx;
      // wake waviness behind the deck, grows with the twist
      if (x > 120) { const wk = Math.exp(-(((y0 - mid) / 70) ** 2)) * strength; dy += wk * 16 * Math.sin((x - t * 140) / 34) * seg(x, 120, 220); }
      pts.push([SEC.x + x, SEC.y + y0 + dy]);
    }
    line(pts, 1, WT.hair, { a: on * .6, dash: [14, 8], off: -t * 90, cap: 'butt' });
  }
  // shed vortices behind the deck, alternating top/bottom
  const per = .9;
  for (let k = 0; k < 6; k++) {
    const t0 = Math.floor(t / per) * per - k * per * .5; const age = t - t0; if (age < 0) continue;
    const side = (Math.round(t0 / (per * .5)) % 2) ? 1 : -1;
    const cx = SEC.x + 170 + age * 120, cy = SEC.y + (side < 0 ? top : bot) + side * 6;
    if (cx > SEC.x + 420) continue;
    const a = on * strength * (1 - seg(age, 1.6, 2.4)) * .8; if (a <= 0) continue;
    const sp = []; for (let j = 0; j <= 30; j++) { const aa = j / 30 * TAU * 1.6 * side + age * 3, r = 3 + j * .45; sp.push([cx + Math.cos(aa) * r, cy + Math.sin(aa) * r * .8]); }
    line(sp, 1, WT.hair, { a });
  }
  // wind label + arrow, left of the section
  const fa = seg(t, T.secDraw + .3, T.secDraw + 1.2);
  if (fa > 0) { line([[42, SEC.y - 112], [128, SEC.y - 112]], fa, WT.det, { a: on }); if (fa >= 1) arrowHead(132, SEC.y - 112, 0, 10, on); text('WIND ≈ 40 MPH', 42, SEC.y - 124, 15, fa, { font: 'B612', a: on }); }
}

// ───────────────────────── wind tunnel (FIG. 2) ─────────────────────────
const TUN = { x0: 140, x1: 862, y0: 1222, y1: 1438, mx: 515, my: 1330 };
function modelPoly() { return [[-112, -1], [-92, -13], [92, -13], [112, -1], [68, 15], [-68, 15], [-112, -1]]; }
function drawTunnel(t) {
  const t0 = T.tunDraw, F = (a, b) => seg(t, t0 + a, t0 + b);
  if (t < t0) return;
  const { x0, x1, y0, y1, mx, my } = TUN;
  // walls (thick, hatched outside), with a contraction at the inlet
  const wTop = [[60, y0 - 40], [140, y0 - 40], [230, y0], [x1, y0]], wBot = [[60, y1 + 40], [140, y1 + 40], [230, y1], [x1, y1]];
  const fw = F(0, .7);
  line(wTop, fw, WT.out); line(wBot, fw, WT.out);
  const outTop = [...wTop, [x1, y0 - 12], [230, y0 - 12], [140, y0 - 52], [60, y0 - 52]], outBot = [...wBot, [x1, y1 + 12], [230, y1 + 12], [140, y1 + 52], [60, y1 + 52]];
  line([[230, y0 - 12], [x1, y0 - 12]], fw, WT.thin); line([[230, y1 + 12], [x1, y1 + 12]], fw, WT.thin);
  hatch(outTop, 7, F(.5, .9)); hatch(outBot, 7, F(.5, .9));
  // honeycomb flow straightener
  const fh = F(.6, 1.0);
  if (fh > 0) for (let i = 0; i < 11; i++) { const yy = lerp(y0 + 6, y1 - 6, i / 10); line([[244, yy], [268, yy]], seg(fh, i / 14, i / 14 + .3), WT.hair); }
  line([[244, y0], [244, y1]], fh, WT.thin); line([[268, y0], [268, y1]], fh, WT.thin);
  // fan at the outlet
  const ff = F(.9, 1.3);
  if (ff > 0) { const fx = 820, fy = my, spin = t * 7;
    line([[fx - 6, y0 + 10], [fx - 6, y1 - 10]], ff, WT.hair, { dash: DASH.centre });
    for (let b = 0; b < 2; b++) { const a = spin + b * Math.PI; const p = [[fx, fy], [fx + Math.cos(a) * 6, fy + Math.sin(a) * 92]];
      const e = [[fx - 7, fy + Math.sin(a) * 92 * .5 - 0], [fx + 7, fy + Math.sin(a) * 92 * .5]];
      line([[fx, fy], [fx, fy + Math.sin(a) * 92]], ff, WT.det); line(e, ff, WT.hair); }
    const hub = []; for (let k = 0; k <= 20; k++) hub.push([fx + Math.cos(k / 20 * TAU) * 9, fy + Math.sin(k / 20 * TAU) * 9]); paperFill(hub); line(hub, ff, WT.det);
    const mot = rect(fx + 14, fy - 18, 30, 36); paperFill(mot); line(mot, ff, WT.det); }
  // airflow
  if (t > T.flow - .2) drawTunnelFlow(t);
  // model on springs
  const fm = F(1.1, 1.6), fs = F(1.5, 1.9);
  const wob = (t > T.flow ? .5 * Math.exp(-(t - T.flow) * 1.2) * Math.sin((t - T.flow) * 9) : 0) * D2R;
  ctx.save(); ctx.translate(mx, my); ctx.rotate(wob);
  const m = modelPoly(); paperFill(m); line(m, fm, WT.out); hatch(m, 5, seg(fm, .6, 1));
  line([[-58, -13], [-58, -18], [58, -18], [58, -13]], seg(fm, .5, 1), WT.hair);
  const pv = []; for (let k = 0; k <= 16; k++) pv.push([Math.cos(k / 16 * TAU) * 5, Math.sin(k / 16 * TAU) * 5]); paperFill(pv); line(pv, fm, WT.thin);
  ctx.restore();
  // springs (zig-zag) from model to walls
  for (const sx of [-70, 70]) {
    const zz = (ya, yb) => { const p = []; const n = 10; for (let k = 0; k <= n; k++) { const y = lerp(ya, yb, k / n); p.push([mx + sx + ((k > 0 && k < n) ? (k % 2 ? 6 : -6) : 0), y]); } return p; };
    line(zz(y0, my - 14 + sx * Math.sin(wob)), fs, WT.thin); line(zz(my + 15 + sx * Math.sin(wob), y1), fs, WT.thin);
  }
  // labels
  const fl = F(1.6, 2.4);
  text('FIG. 2 — WIND TUNNEL TEST', 500, 1150, 24, F(0.1, 1.0), { align: 'center' });
  text('SECTION MODEL 1:50 ON SPRINGS · STREAMLINED DECK', 500, 1176, 13, F(.5, 1.4), { align: 'center', font: 'B612' });
  text('AIR FLOW', 150, y0 - 66, 14, fl, { font: 'B612' });
  if (fl > 0) { line([[150, y0 - 58], [220, y0 - 58]], fl, WT.thin); if (fl >= 1) arrowHead(224, y0 - 58, 0, 8); }
  // twist readout
  if (t > T.flow) { const tw = Math.abs(wob / D2R); const a = seg(t, T.flow, T.flow + .6);
    line([[mx + 60, my - 13], [mx + 150, y0 - 30]], a, WT.hair); text(`TWIST ${tw.toFixed(1)}°`, mx + 156, y0 - 26, 16, a, { font: 'B612' }); }
}
function drawTunnelFlow(t) {
  const { y0, y1, mx, my } = TUN; const on = seg(t, T.flow - .2, T.flow + .8);
  const top = -15, bot = 17;
  for (let i = 0; i < 9; i++) {
    const yy = lerp(y0 + 14, y1 - 14, i / 8) - my; const pts = [];
    for (let x = 270; x <= 800; x += 8) {
      const dx = x - mx, g = Math.exp(-((dx / 150) ** 2));
      let dy; if (yy <= 0) dy = (yy > top - 14 ? (top - 14 - yy) : -8 * Math.exp(-(top - 14 - yy) / 25)) * g;
      else dy = (yy < bot + 14 ? (bot + 14 - yy) : 8 * Math.exp(-(yy - bot - 14) / 25)) * g;
      pts.push([x, my + yy + dy]);
    }
    // draws on from the left the first time, then flows
    const fin = seg(t, T.flow - .2 + i * .04, T.flow + .9 + i * .04);
    line(pts, fin, WT.thin, { a: on * .85, dash: [18, 9], off: -t * 110, cap: 'butt', noNib: false });
  }
}

// ───────────────────────── sheet furniture ─────────────────────────
function drawSheetFrame(t) {
  line(rect(18, 18, SW - 36, SH - 36), 1, WT.out, { cap: 'butt' });
  line(rect(26, 26, SW - 52, SH - 52), 1, WT.hair, { cap: 'butt' });
  // header
  text('TACOMA NARROWS BRIDGE', 500, 96, 46, seg(t, .3, 2.2), { align: 'center' });
  text('PUGET SOUND, WASHINGTON · SUSPENSION BRIDGE · VERT. SCALE EXAGGERATED', 500, 128, 12.5, seg(t, 1.6, 3.2), { align: 'center', font: 'B612' });
  line([[60, 148], [940, 148]], seg(t, .2, 1.0), WT.det); line([[60, 153], [940, 153]], seg(t, .3, 1.1), WT.hair);
  // title block (pre-printed)
  const tb = [600, 1648, 360, 222];
  line(rect(...tb), 1, WT.det, { cap: 'butt' });
  const rows = ['PROJECT', 'OPENED', 'STATUS', 'SHEET']; const rh = tb[3] / rows.length;
  rows.forEach((r, i) => { if (i) line([[tb[0], tb[1] + i * rh], [tb[0] + tb[2], tb[1] + i * rh]], 1, WT.hair, { cap: 'butt' }); text(r, tb[0] + 8, tb[1] + i * rh + 16, 10, 1, { font: 'B612', a: .75 }); });
  text('TACOMA NARROWS BRIDGE', tb[0] + 14, tb[1] + 44, 16, seg(t, 2.4, 3.6), { font: 'B612' });
  text('JULY 1, 1940', tb[0] + 14, tb[1] + rh + 44, 16, seg(t, T.openNote, T.openNote + 1), { font: 'B612' });
  if (t > T.stamp) text('COLLAPSED NOV. 7, 1940', tb[0] + 14, tb[1] + 2 * rh + 44, 16, seg(t, T.stamp + .4, T.stamp + 1.6), { font: 'B612' });
  text('1 OF 1', tb[0] + 14, tb[1] + 3 * rh + 44, 16, seg(t, 3.0, 3.6), { font: 'B612' });
  // general notes column
  const nx = 60, ny = 1660; line(rect(48, 1648, 532, 222), 1, WT.hair, { cap: 'butt' });
  text('GENERAL NOTES', nx, ny + 14, 15, 1, { font: 'B612B', a: .9 });
  let y = ny + 38;
  CUES.forEach((c, i) => {
    const lines = wrap(c.text, 11.5, 470, 'AD');
    const f = seg(t, c.t0, c.t0 + 1.6);
    lines.forEach((ln, j) => { text((j ? '     ' : `${i + 1}.  `) + ln, nx, y + j * 15, 11.5, seg(f, j / lines.length, (j + 1) / lines.length)); });
    y += lines.length * 15 + 4;
  });
}
const _wrap = new Map();
function wrap(str, size, maxW, font) {
  const key = str + size + maxW + font; if (_wrap.has(key)) return _wrap.get(key);
  ctx.font = `${size}px ${font}`; const words = str.split(' '), out = []; let cur = '';
  for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { out.push(cur); cur = w; } else cur = tst; }
  if (cur) out.push(cur); _wrap.set(key, out); return out;
}

function drawFig1Labels(t) {
  // FIG. 1 label, struck through later
  text('FIG. 1 — ELEVATION, AS BUILT', 232, 676, 24, seg(t, 7.8, 8.7));
  text('OPENED JULY 1, 1940', 232, 704, 17, seg(t, T.openNote, T.openNote + 1.1), { font: 'B612' });
  const fs = seg(t, T.fig, T.fig + .35);
  if (fs > 0) { const w = textW('FIG. 1 — ELEVATION, AS BUILT', 24); line([[228, 668], [236 + w, 664]], fs, WT.det); }
  const fsee = seg(t, T.fig + .3, T.fig + 1.0);
  if (fsee > 0) { const w = textW('FIG. 1 — ELEVATION, AS BUILT', 24); text('→ SEE FIG. 2', 250 + w, 676, 18, fsee); }
  // section cut marker A-A at u = 0.25 on the elevation
  const fa = seg(t, 4.9, 5.4), xa = xOf(.25);
  if (fa > 0) {
    line([[xa, 418], [xa, 545]], fa, WT.thin, { dash: DASH.phantom });
    if (fa >= 1) { line([[xa, 418], [xa - 16, 418]], 1, WT.det); arrowHead(xa - 18, 418, Math.PI, 9); line([[xa, 545], [xa - 16, 545]], 1, WT.det); arrowHead(xa - 18, 545, Math.PI, 9);
      text('A', xa + 6, 414, 15, 1); text('A', xa + 6, 556, 15, 1); }
  }
  // dimensions
  dimH(B.t1, B.t2, 268, B.top - 18, B.top - 18, 'MAIN SPAN 2,800 FT', seg(t, T.S2 + .55, T.S2 + 1.9));
  dimH(B.t2, B.a2, 268, B.top - 18, B.deck - 4, '1,100 FT', seg(t, T.S2 + 1.9, T.S2 + 2.9), 15);
  dimH(B.a1, B.t1, 268, B.deck - 4, B.top - 18, '1,100 FT', seg(t, T.S2 + 3.0, T.S2 + 4.0), 15);
}

// ───────────────────────── stamp (the one red) ─────────────────────────
let STAMP = null;
function makeStamp() {
  const s = document.createElement('canvas'); const w = 300, h = 118, S = 3; s.width = w * S; s.height = h * S;
  const g = s.getContext('2d'); g.scale(S, S);
  g.strokeStyle = RED; g.fillStyle = RED; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8); g.lineWidth = 1.6; g.strokeRect(11, 11, w - 22, h - 22);
  g.font = '44px B612B'; g.textAlign = 'center'; g.fillText('COLLAPSED', w / 2, 64);
  g.font = '19px B612B'; g.font = '22px B612B'; g.fillText('NOV. 7, 1940', w / 2, 95);
  // ink breakup
  g.globalCompositeOperation = 'destination-out'; const R = mulberry(77);
  for (let i = 0; i < 900; i++) { g.globalAlpha = .25 + R() * .6; g.beginPath(); g.arc(R() * w, R() * h, .4 + R() * R() * 2.2, 0, TAU); g.fill(); }
  for (let i = 0; i < 6; i++) { g.globalAlpha = .35; g.fillRect(R() * w, 0, 1 + R() * 3, h); }
  return s;
}
function drawStamp(t) {
  if (t < T.stamp - .08) return;
  const d = t - T.stamp, sc = d < 0 ? 1.25 : 1 + .06 * Math.exp(-d * 30), a = d < 0 ? .0 : 1;
  ctx.save(); ctx.translate(705, 768); ctx.rotate(-7 * D2R); ctx.scale(sc, sc);
  ctx.globalAlpha = .9 * a; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(STAMP, -150, -59, 300, 118); ctx.restore(); ctx.globalAlpha = 1;
}

// ───────────────────────── subtitles (drawing notes, overlay) ─────────────────────────
const CAP = { size: 44, maxW: 760, pad: 22, cell: 104 };
function capLayout(c) {
  const lines = wrap(c.text, CAP.size, CAP.maxW, 'AD');
  ctx.font = `${CAP.size}px AD`; const tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = CAP.cell + CAP.pad * 2 + tw, h = CAP.pad * 2 + lines.length * CAP.size * 1.22;
  return { lines, w, h, x: (W - w) / 2, y: c.y - h / 2 };
}
function drawCaptions(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  CUES.forEach((c, i) => {
    if (t < c.t0 || t > c.t1 + .25) return;
    const L = capLayout(c), a = seg(t, c.t0, c.t0 + .15) * (1 - seg(t, c.t1, c.t1 + .25));
    const { x, y, w, h } = L;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(214,232,252,0.13)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(12,30,70,0.38)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.strokeRect(x, y, w, h); ctx.lineWidth = 1; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.beginPath(); ctx.moveTo(x + CAP.cell, y + 6); ctx.lineTo(x + CAP.cell, y + h - 6); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = '17px B612'; ctx.textAlign = 'center'; ctx.fillText('NOTE', x + CAP.cell / 2 + 3, y + h / 2 - 6); ctx.font = '28px B612B'; ctx.fillText(String(i + 1), x + CAP.cell / 2 + 3, y + h / 2 + 26); ctx.textAlign = 'left';
    // leader tick
    ctx.lineWidth = 2; ctx.beginPath(); const lx = x + w - 40; if (c.lead < 0) { ctx.moveTo(lx, y); ctx.lineTo(lx + 22, y - 26); } else { ctx.moveTo(lx, y + h); ctx.lineTo(lx + 22, y + h + 26); } ctx.stroke();
    // lettered on
    const total = L.lines.join('').length, f = seg(t, c.t0 + .05, c.t0 + .05 + Math.min(.9, .35 + total * .006));
    let done = 0;
    L.lines.forEach((ln, j) => {
      const s0 = done / total, s1 = (done + ln.length) / total; done += ln.length;
      const lf = seg(f, s0, s1); if (lf <= 0) return;
      const tx = x + CAP.cell + CAP.pad, ty = y + CAP.pad + (j + .82) * CAP.size * 1.22 - CAP.size * .14;
      ctx.font = `${CAP.size}px AD`; const lw = ctx.measureText(ln).width;
      ctx.save(); ctx.beginPath(); ctx.rect(tx - 4, ty - CAP.size * 1.2, (lw + 8) * lf, CAP.size * 1.8); ctx.clip(); ctx.fillStyle = INK; ctx.fillText(ln, tx, ty); ctx.restore();
      if (lf < 1) { const g = ctx.createRadialGradient(tx + lw * lf, ty - 14, 0, tx + lw * lf, ty - 14, 12); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(220,240,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx + lw * lf, ty - 14, 12, 0, TAU); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
  });
}

// ───────────────────────── frame ─────────────────────────
function render(t) {
  CAM = camAt(t); K = CAM.z * BASE;
  OBF = .55 * ss(seg(t, T.S3 + .2, T.S3 + 2.0));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // drafting table
  const bg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1300); bg.addColorStop(0, '#141a22'); bg.addColorStop(1, '#0a0d11');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(K, 0, 0, K, W / 2 - CAM.x * K, H / 2 - CAM.y * K);
  // sheet shadow + paper
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * K; ctx.shadowOffsetY = 10 * K; ctx.fillStyle = '#1d3f80'; ctx.fillRect(0, 0, SW, SH); ctx.restore();
  ctx.drawImage(PAPER_TEX, 0, 0, SW, SH);

  drawSheetFrame(t);
  drawFig1Labels(t);
  drawSection(t);
  drawBridge(t);
  drawWindBridge(t);
  drawSplash(t);
  drawTunnel(t);
  drawStamp(t);
  // gentle vignette
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  drawCaptions(t);
}

// texts on screen for readcheck
function screenBox(x0, y0, x1, y1) { const a = toS(x0, y0), b = toS(x1, y1); return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] }; }
window.TEXTS = t => {
  CAM = camAt(t); K = CAM.z * BASE; const out = [];
  const add = (id, txt, t0, x0, y0, x1, y1, pass = false) => { if (t >= t0) out.push({ id, text: txt, ...screenBox(x0, y0, x1, y1), pass }); };
  add('title', 'TACOMA NARROWS BRIDGE', .3, 230, 50, 770, 106);
  add('fig1', 'FIG. 1 — ELEVATION, AS BUILT', 7.8, 232, 652, 562, 684);
  add('opened', 'OPENED JULY 1, 1940', T.openNote, 232, 688, 452, 710);
  add('main', 'MAIN SPAN 2,800 FT', T.S2 + .55, 400, 250, 600, 275);
  add('sec', 'SECTION A-A', T.secDraw + .8, 344, 980, 464, 1004);
  add('stamp', 'COLLAPSED NOV. 7, 1940', T.stamp, 553, 706, 857, 830);
  add('fig2', 'FIG. 2 — WIND TUNNEL TEST', T.tunDraw + .1, 330, 1128, 670, 1156);
  if (t > T.fig) add('see', '→ SEE FIG. 2', T.fig + .3, 570, 656, 700, 684, true);
  add('sub', 'DECK 39 FT · SOLID PLATE GIRDER 8 FT DEEP', T.secDraw + 1.0, 254, 1010, 554, 1028, true);
  add('notes', 'GENERAL NOTES', 0, 48, 1648, 580, 1870, true);
  add('tb', 'TITLE BLOCK', 0, 600, 1648, 960, 1870, true);
  return out.filter(o => o.pass || (o.x0 > -4000));
};

// ───────────────────────── sound events ─────────────────────────
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(0.05, 'tsquare', { dur: .7 });
ev(.3, 'letter', { dur: 1.9 }); ev(.67, 'pen', { dur: .6 }); ev(1.33, 'pen', { dur: .65 }); ev(1.6, 'letter', { dur: 1.5 });
ev(2.0, 'pen', { dur: .9 }); ev(2.67, 'pen', { dur: .66 });
for (let i = 0; i < 16; i++) ev(3.33 + i * .066, 'tick', { v: .35 });
ev(4.0, 'hatch', { dur: .6 }); ev(7.8, 'letter', { dur: .9 }); ev(4.9, 'pen', { dur: .5 });
ev(T.S2 + .55, 'pen', { dur: .5 }); ev(T.S2 + 1.3, 'letter', { dur: .6 }); ev(T.S2 + 1.9, 'pen', { dur: .5 }); ev(T.S2 + 2.5, 'letter', { dur: .4 });
ev(T.S2 + 3.0, 'pen', { dur: .5 }); ev(T.S2 + 3.6, 'letter', { dur: .4 }); ev(T.openNote, 'letter', { dur: 1.0 });
ev(T.secDraw, 'pen', { dur: .5 }); ev(T.secDraw + .4, 'hatch', { dur: .4 }); ev(T.secDraw + .8, 'letter', { dur: .9 });
ev(T.S3, 'wind_on', { until: T.snap + 3.5 });
for (let k = 0; ; k++) { const tc = T.twist0 + .9 + k / (2 * .56); if (tc > T.snap - .1) break; ev(tc, 'creak', { v: .25 + .75 * seg(tc, T.twist0, T.snap) }); }
ev(T.snap, 'snap'); for (let i = 0; i < 9; i++) ev(T.snap + i * .05 + (i % 3) * .013, 'twang', { v: 1 - i * .07 });
ev(T.snap + .05, 'tear', { dur: 1.2 });
for (const c of CHUNKS) ev(splashT(c), 'splash', { v: .8 + c.u0 * .3 });
ev(T.stamp, 'stamp');
ev(T.stamp + .4, 'letter', { dur: 1.1 });
ev(T.fig, 'strike', { dur: .35 }); ev(T.fig + .3, 'letter', { dur: .7 });
ev(T.tunDraw, 'pen', { dur: .7 }); ev(T.tunDraw + .5, 'hatch', { dur: .4 }); ev(T.tunDraw + .6, 'pen', { dur: .4 }); ev(T.tunDraw + 1.1, 'pen', { dur: .5 }); ev(T.tunDraw + 1.5, 'pen', { dur: .4 });
ev(T.tunDraw + .1, 'letter', { dur: .9 }); ev(T.tunDraw + 1.6, 'letter', { dur: .8 });
ev(T.flow, 'flow_on');
CUES.forEach(c => ev(c.t0 + .05, 'letter', { dur: .5, v: .5 }));
Object.entries(VOICE).forEach(([id, t]) => ev(t, 'voice', { id }));
window.EV = EV;
window.DUR = T.end;

let PAPER_TEX;
(async () => {
  await Promise.all(['44px AD', '20px B612', '20px B612B'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  PAPER_TEX = makePaper();
  PAPER = ctx.createPattern(PAPER_TEX, 'no-repeat'); PAPER.setTransform(new DOMMatrix().scale(1 / TS));
  STAMP = makeStamp();
  window.render = render;
  render(0);
  window.READY = true;
})();
