// The Ponzi File — Halftone Dossier, 1080×1920, 30 fps.
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, hash } from '/core/lib.js';
import { T, VOICE } from './timeline.js';
import { CARDS } from './captions.js';

const W = innerWidth, H = innerHeight;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const TAU = Math.PI * 2, D2R = Math.PI / 180;

// inks: paper + sepia-black + teal (overprint) + mustard (highlight) + vermilion (stamps) + green (money)
const PAPER = '#EEE2C6', INK = '#2A2019', TEAL = '#2F7C83', MUST = '#E9B12F', RED = '#D5402B', GREEN = '#5E8A3A';
const SAFE_BOTTOM = H * .8;   // nothing below this line
const CAP_Y = Math.round(H * .65);

// ───────── helpers ─────────
const ob = (t, d = .38) => back(seg(t, 0, d), 2.2);           // overshoot entry 0→1
function popScale(t, t0, d = .38) { return t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.4); }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function font(f, s, w = '') { ctx.font = `${w} ${s}px ${f}`.trim(); }
function tw(str, f, s, w = '') { font(f, s, w); return ctx.measureText(str).width; }
function boilT(t) { return Math.floor(t * 10); }             // line boil at 10 fps
function boil(t, seed, a = 1.6) { const k = boilT(t) * 13 + seed; return [(hash(k) - .5) * a, (hash(k + 7) - .5) * a, (hash(k + 3) - .5) * .5 * D2R]; }

// halftone: rotated grid of dots inside the current clip; dens(x,y) in 0..1 (screen px)
function halftone(x0, y0, x1, y1, dens, step = 20, ang = 15, color = INK, k = .68) {
  ctx.fillStyle = color; ctx.beginPath();
  const c = Math.cos(ang * D2R), s = Math.sin(ang * D2R), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + step;
  for (let u = -R; u <= R; u += step) for (let v = -R; v <= R; v += step) {
    const x = cx + u * c - v * s, y = cy + u * s + v * c;
    if (x < x0 - step || x > x1 + step || y < y0 - step || y > y1 + step) continue;
    const d = dens(x, y); if (d <= .02) continue;
    const r = Math.min(d, 1.15) * step * k; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
  }
  ctx.fill();
}
const radial = (cx, cy, r0, r1, a = 1) => (x, y) => a * clamp((Math.hypot(x - cx, y - cy) - r0) / (r1 - r0));
const linear = (y0, y1, a = 1) => (x, y) => a * clamp((y - y0) / (y1 - y0));

// headline with per-character pop and a misregistration shadow
function headline(str, x, y, size, t0, t, o = {}) {
  if (t < t0) return 0;
  font(o.font || 'Alfa', size); const out = o.out ?? 1;
  let cx = x; const total = ctx.measureText(str).width; if (o.align === 'center') cx = x - total / 2;
  const st = o.stagger ?? .045, hl = o.hl || [];
  [...str].forEach((ch, i) => {
    const w = ctx.measureText(ch).width; const tt = t - t0 - i * st;
    if (tt > 0 && ch !== ' ') {
      const p = back(seg(tt, 0, .32), 2.6), dy = (1 - eo(seg(tt, 0, .2))) * -70;
      const sq = 1 + .25 * Math.exp(-tt * 12) * Math.cos(tt * 40);
      ctx.save(); ctx.translate(cx + w / 2, y + dy); ctx.scale(p / sq, p * sq * out); ctx.translate(-w / 2, 0);
      const hi = hl.includes(i);
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = TEAL; ctx.fillText(ch, 7, 7);
      ctx.globalCompositeOperation = 'source-over';
      if (hi) { ctx.lineWidth = size * .09; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(ch, 0, 0); ctx.fillStyle = MUST; ctx.fillText(ch, 0, 0); }
      else { ctx.fillStyle = o.color || INK; ctx.fillText(ch, 0, 0); }
      ctx.restore();
    }
    cx += w;
  });
  return total;
}
const idxOf = (str, sub) => { const i = str.indexOf(sub); return i < 0 ? [] : [...Array(sub.length).keys()].map(k => k + i); };

// ───────── paper & grain ─────────
let PAPERTEX;
function buildPaper() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const lw = 54, lh = 96, lo = document.createElement('canvas'); lo.width = lw; lo.height = lh; const lg = lo.getContext('2d');
  const id = lg.createImageData(lw, lh), R = mulberry(9);
  for (let i = 0; i < lw * lh; i++) { const v = 236 + R() * 19; id.data[i * 4] = v; id.data[i * 4 + 1] = v - 3; id.data[i * 4 + 2] = v - 9; id.data[i * 4 + 3] = 255; }
  lg.putImageData(id, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(lo, 0, 0, W, H);
  const n = g.getImageData(0, 0, W, H), d = n.data;
  for (let i = 0; i < d.length; i += 4) { const e = (R() - .5) * 16; d[i] += e; d[i + 1] += e; d[i + 2] += e * 1.1; }
  g.putImageData(n, 0, 0);
  const vg = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(70,45,20,.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(90,60,30,.10)'; g.fillRect(0, H * .43, W, 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, H * .43 + 3, W, 2);
  return c;
}
function grain(t) {
  const R = mulberry(1000 + Math.floor(t * 15));
  for (let i = 0; i < 380; i++) { ctx.fillStyle = 'rgba(238,226,198,.85)'; const r = .6 + R() * 1.8; ctx.beginPath(); ctx.arc(R() * W, R() * H, r, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(42,32,25,.55)'; const r = .5 + R() * 1.3; ctx.beginPath(); ctx.arc(R() * W, R() * H, r, 0, TAU); ctx.fill(); }
}

// ───────── stamps ─────────
const STAMPS = {};
function makeStamp(text, w, h, color = RED, size) {
  const S = 2, c = document.createElement('canvas'); c.width = w * S; c.height = h * S; const g = c.getContext('2d'); g.scale(S, S);
  g.strokeStyle = color; g.fillStyle = color;
  g.lineWidth = 12; rrg(g, 8, 8, w - 16, h - 16, 26); g.stroke(); g.lineWidth = 5; rrg(g, 26, 26, w - 52, h - 52, 14); g.stroke();
  g.font = `${size}px Archivo`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + size * .04);
  g.globalCompositeOperation = 'destination-out'; const R = mulberry(text.length * 31 + w);
  for (let i = 0; i < w * h / 55; i++) { g.globalAlpha = .3 + R() * .7; g.beginPath(); g.arc(R() * w, R() * h, .5 + R() * R() * 3.2, 0, TAU); g.fill(); }
  for (let i = 0; i < 9; i++) { g.globalAlpha = .25; g.save(); g.translate(R() * w, R() * h); g.rotate(R() * 3); g.fillRect(-60, -2, 120, 3 + R() * 4); g.restore(); }
  return c;
}
function rrg(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// slam: ~0.09 s from 2.6× to 1×, then a damped bounce. t0 <= 0 means already landed at film start (small bounce only)
function stamp(key, x, y, rot, t0, t, settled = false) {
  if (t < t0) return; const S = STAMPS[key]; const d = t - t0;
  let sc; if (settled) sc = 1 + .1 * Math.exp(-d * 9) * Math.cos(d * 30);
  else sc = d < .09 ? lerp(2.6, 1, ei(d / .09) ) : 1 + .07 * Math.exp(-(d - .09) * 12) * Math.cos((d - .09) * 34);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot * D2R); ctx.scale(sc, sc); ctx.globalAlpha = .93 * (settled ? 1 : clamp(d / .05 + .3));
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(S, -S.width / 4, -S.height / 4, S.width / 2, S.height / 2); ctx.restore();
}

// ───────── characters ─────────
// the 1920s man (generic, not a likeness): boater hat, slick moustache, bow tie
function drawMan(cx, cy, s, t, o = {}) {
  const [bx, by, br] = boil(t, 5); ctx.save(); ctx.translate(cx + bx, cy + by); ctx.rotate(br); ctx.scale(s, s);
  const OUT = 7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = OUT;
  // suit
  ctx.beginPath(); ctx.moveTo(-205, 270); ctx.quadraticCurveTo(-200, 150, -120, 128); ctx.lineTo(120, 128); ctx.quadraticCurveTo(200, 150, 205, 270); ctx.closePath();
  ctx.fillStyle = INK; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); halftone(-210, 120, 210, 280, (x, y) => .25 + .25 * clamp((x + 120) / 300), 13, 45, TEAL, .6); ctx.restore();
  // shirt + lapels
  ctx.beginPath(); ctx.moveTo(-58, 128); ctx.lineTo(0, 232); ctx.lineTo(58, 128); ctx.closePath(); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-58, 128); ctx.lineTo(-30, 270); ctx.moveTo(58, 128); ctx.lineTo(30, 270); ctx.lineWidth = 4; ctx.strokeStyle = PAPER; ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = OUT;
  // neck
  ctx.beginPath(); ctx.moveTo(-42, 80); ctx.lineTo(-40, 140); ctx.lineTo(40, 140); ctx.lineTo(42, 80); ctx.closePath(); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke();
  // collar
  ctx.beginPath(); ctx.moveTo(-50, 118); ctx.lineTo(-6, 150); ctx.lineTo(-30, 168); ctx.closePath(); ctx.moveTo(50, 118); ctx.lineTo(6, 150); ctx.lineTo(30, 168); ctx.closePath(); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke();
  // bow tie
  ctx.beginPath(); ctx.moveTo(0, 158); ctx.lineTo(-40, 140); ctx.lineTo(-40, 178); ctx.closePath(); ctx.moveTo(0, 158); ctx.lineTo(40, 140); ctx.lineTo(40, 178); ctx.closePath(); ctx.fillStyle = TEAL; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 158, 9, 0, TAU); ctx.fill(); ctx.stroke();
  // ears
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 96, -10, 18, 28, 0, 0, TAU); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke(); }
  // head
  ctx.beginPath(); ctx.ellipse(0, -14, 92, 118, 0, 0, TAU); ctx.fillStyle = PAPER; ctx.fill();
  ctx.save(); ctx.clip(); halftone(-100, -140, 100, 110, (x, y) => .55 * clamp((x - 10) / 90) + .35 * clamp((y - 50) / 60), 12, 20, INK, .55); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, -14, 92, 118, 0, 0, TAU); ctx.stroke();
  // hair under the hat
  ctx.beginPath(); ctx.moveTo(-90, -40); ctx.quadraticCurveTo(-92, -100, -40, -112); ctx.lineTo(60, -110); ctx.quadraticCurveTo(92, -96, 90, -40); ctx.quadraticCurveTo(80, -80, 30, -86); ctx.quadraticCurveTo(-20, -90, -60, -78); ctx.quadraticCurveTo(-84, -66, -90, -40); ctx.fillStyle = INK; ctx.fill();
  // eyes: glossy, can squint
  const blink = o.blink && (t % 3.7) > 3.55;
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx * 50, -42); ctx.quadraticCurveTo(sx * 34, -54, sx * 14, -46); ctx.lineWidth = 8; ctx.stroke();
    if (blink || o.smug) { ctx.beginPath(); ctx.arc(sx * 32, -18, 14, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 6; ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(sx * 32, -20, 11, 15, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(sx * 32 + 4, -26, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(sx * 32 - 3, -14, 2, 0, TAU); ctx.fill(); }
  }
  ctx.lineWidth = OUT;
  // nose
  ctx.beginPath(); ctx.moveTo(4, -12); ctx.quadraticCurveTo(14, 22, -4, 26); ctx.lineWidth = 5; ctx.stroke();
  // moustache
  ctx.beginPath(); ctx.moveTo(-40, 46); ctx.quadraticCurveTo(-20, 30, 0, 40); ctx.quadraticCurveTo(20, 30, 40, 46); ctx.quadraticCurveTo(20, 44, 0, 48); ctx.quadraticCurveTo(-20, 44, -40, 46); ctx.fillStyle = INK; ctx.fill(); ctx.stroke();
  // smile
  ctx.beginPath(); ctx.moveTo(-30, 64); ctx.quadraticCurveTo(4, 84, 34, 60); ctx.lineWidth = 6; ctx.stroke(); ctx.lineWidth = OUT;
  // boater hat
  if (!o.noHat) {
    ctx.beginPath(); ctx.ellipse(0, -112, 158, 26, 0, 0, TAU); ctx.fillStyle = MUST; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-96, -112); ctx.lineTo(-92, -186); ctx.quadraticCurveTo(0, -200, 92, -186); ctx.lineTo(96, -112); ctx.quadraticCurveTo(0, -100, -96, -112); ctx.closePath(); ctx.fillStyle = MUST; ctx.fill();
    ctx.save(); ctx.clip(); halftone(-100, -205, 100, -100, (x, y) => .3 * clamp((x + 20) / 120), 10, 30, INK, .5); ctx.restore(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-95, -134); ctx.quadraticCurveTo(0, -122, 95, -134); ctx.lineTo(94, -152); ctx.quadraticCurveTo(0, -140, -94, -152); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  }
  ctx.restore();
}
// a small investor in a bowler hat; coat colour by role
function drawFig(x, y, h, coat = TEAL, t = 0, seed = 0, ang = 0) {
  if (h < 16) { ctx.fillStyle = coat === MUST ? MUST : INK; ctx.beginPath(); ctx.arc(x, y - h * .4, Math.max(2.2, h * .38), 0, TAU); ctx.fill(); return; }
  const [bx, by] = boil(t, seed, Math.min(1.6, h * .02)); const s = h / 100;
  ctx.save(); ctx.translate(x + bx, y + by); ctx.rotate(ang); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
  // coat
  ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-22, -46); ctx.quadraticCurveTo(0, -56, 22, -46); ctx.lineTo(26, 0); ctx.closePath(); ctx.fillStyle = coat; ctx.fill(); ctx.stroke();
  // head
  ctx.beginPath(); ctx.arc(0, -66, 15, 0, TAU); ctx.fillStyle = PAPER; ctx.fill(); ctx.stroke();
  // bowler
  ctx.beginPath(); ctx.ellipse(0, -76, 22, 5, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.arc(0, -78, 14, Math.PI, 0); ctx.fill();
  ctx.restore();
}
function drawBill(x, y, w, ang = 0) {
  const h = w * .5; ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = GREEN; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, w * .07); ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h);
  if (w > 18) { font('Archivo', h * .8); ctx.fillStyle = PAPER; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, h * .04); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  ctx.restore();
}

// ───────── HUD ─────────
function hud(t, chip) {
  font('JBM', 26, '800');
  const a = 'CASE No. 1920-PZ'; const w1 = ctx.measureText(a).width + 36;
  rr(40, 44, w1, 50, 25); ctx.fillStyle = INK; ctx.fill(); ctx.fillStyle = PAPER; ctx.fillText(a, 58, 78);
  if (chip) { const w2 = ctx.measureText(chip).width + 36; rr(52 + w1, 44, w2, 50, 25); ctx.fillStyle = MUST; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = INK; ctx.fillText(chip, 70 + w1, 78); }
  const b = 'BOSTON · 1920'; const w3 = ctx.measureText(b).width;
  ctx.fillStyle = INK; ctx.fillText(b, W - 44 - w3, 78);
  if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(W - 64 - w3, 69, 10, 0, TAU); ctx.fill(); }
}

// ───────── dot wipe ─────────
function dotWipe(t, tc, color = INK, dur = .44) {
  const d = t - (tc - dur / 2); if (d < 0 || d > dur) return;
  const cell = 96; ctx.fillStyle = color; ctx.beginPath();
  for (let y = cell / 2; y < H + cell; y += cell) for (let x = cell / 2; x < W + cell; x += cell) {
    const delay = ((x / W) + (y / H)) * .08; const p = clamp((d - delay) / (dur / 2 - .08));
    const q = d < dur / 2 ? p : clamp(1 - (d - dur / 2 - delay) / (dur / 2 - .08));
    const r = Math.max(0, (d < dur / 2 ? ss(p) : ss(q))) * cell * .75; if (r > .5) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  }
  ctx.fill();
}

// ───────── scenes ─────────
// A / F: the closed folder with portrait. flap: 0 closed … 1 open (cover flipped up)
const FOLD = { x: 110, y: 560, w: 860, h: 880 };
function folderBack() { // the back half + inside page
  const { x, y, w, h } = FOLD;
  rr(x, y - 20, w, h + 20, 18); ctx.fillStyle = MUST; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
}
function insidePage(t) {
  const { x, y, w, h } = FOLD;
  ctx.save(); ctx.translate(x + 26, y + 10); ctx.rotate(-1.2 * D2R);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w - 52, h - 40); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(0, 0, w - 52, h - 40);
  ctx.strokeStyle = 'rgba(47,124,131,.35)'; ctx.lineWidth = 2; for (let yy = 80; yy < h - 60; yy += 46) { ctx.beginPath(); ctx.moveTo(30, yy); ctx.lineTo(w - 82, yy); ctx.stroke(); }
  ctx.restore();
}
function folderFront(t, o = {}) {
  const { x, y, w, h } = FOLD;
  // tab
  rr(x, y - 70, 380, 100, 16); ctx.fillStyle = MUST; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  font('JBM', 34, '800'); ctx.fillStyle = INK; ctx.fillText('CASE 1920-PZ', x + 30, y - 12);
  // cover
  rr(x, y, w, h, 18); ctx.fillStyle = MUST; ctx.fill();
  ctx.save(); rr(x, y, w, h, 18); ctx.clip(); halftone(x, y, x + w, y + h, (px, py) => .55 * clamp(1 - Math.min(px - x, x + w - px, py - y, y + h - py) / 170), 22, 15, INK, .62); ctx.restore();
  rr(x, y, w, h, 18); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  // photo with corners, portrait inside
  const px = 270, py = 640, pw = 540, ph = 640;
  ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(-2.2 * D2R); ctx.translate(-pw / 2, -ph / 2);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, pw, ph); ctx.lineWidth = 6; ctx.strokeRect(0, 0, pw, ph);
  ctx.save(); ctx.beginPath(); ctx.rect(22, 22, pw - 44, ph - 120); ctx.clip();
  halftone(22, 22, pw - 22, ph - 98, radial(pw / 2, ph * .4, 120, 420, .9), 20, 45, TEAL, .68);
  drawMan(pw / 2, 300, .98, t, { smug: true });
  ctx.restore(); ctx.lineWidth = 5; ctx.strokeRect(22, 22, pw - 44, ph - 120);
  font('JBM', 28, '800'); ctx.fillStyle = INK; ctx.fillText('EXHIBIT A · 1920', 30, ph - 40);
  for (const [cx, cy, a] of [[0, 0, 0], [pw, 0, 90], [pw, ph, 180], [0, ph, 270]]) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(a * D2R); ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(56, -8); ctx.lineTo(-8, 56); ctx.closePath(); ctx.fillStyle = INK; ctx.fill(); ctx.restore(); }
  ctx.restore();
  // paper clip
  ctx.save(); ctx.translate(700, 610); ctx.rotate(12 * D2R); ctx.lineWidth = 9; ctx.strokeStyle = TEAL; rr(-18, -10, 36, 120, 18); ctx.stroke(); rr(-8, 8, 16, 80, 8); ctx.stroke(); ctx.restore();
}
function drawFolder(t, flap) {
  const { x, y, w, h } = FOLD;
  folderBack(); insidePage(t);
  if (flap < 1) {
    // flip the cover upward around its top edge
    const s = Math.cos(flap * Math.PI);
    ctx.save(); ctx.translate(0, y); ctx.scale(1, s); ctx.translate(0, -y);
    if (s > 0) folderFront(t); else { rr(x, y, w, h, 18); ctx.fillStyle = MUST; ctx.fill(); ctx.save(); ctx.clip(); halftone(x, y, x + w, y + h, () => .38, 22, 15, INK, .62); ctx.restore(); rr(x, y, w, h, 18); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
  }
}

function sceneOpening(t) {
  const flap = eio(seg(t, T.open, T.open + .45));
  drawFolder(t, flap);
  if (t < T.open + .25) {
    stamp('closed', 540, 950, -11, 0, t, true);
    // hook
    const hook1 = '50% profit', hook2 = 'in 45 days?';
    const a = 1 - seg(t, T.open, T.open + .2);
    ctx.save(); ctx.globalAlpha = a;
    headline(hook1, 64, 300, 146, -1, t, { hl: idxOf(hook1, '50%') });
    headline(hook2, 64, 456, 146, -1, t, { hl: idxOf(hook2, '45') });
    ctx.restore();
  }
}
// B: exhibit 1, the promise
function scenePromise(t) {
  const push = 1 + .05 * ss(seg(t, T.open + .4, T.exC));
  ctx.save(); ctx.translate(W / 2, 900); ctx.scale(push, push); ctx.translate(-W / 2, -900);
  drawFolder(t, 1);
  // radial bloom of dots behind the number
  const t50 = VOICE.l1 + 3.94;
  const bloom = popScale(t, t50 - .1, .5);
  if (bloom > 0) { ctx.save(); ctx.beginPath(); ctx.rect(150, 590, 780, 820); ctx.clip(); halftone(150, 590, 930, 1410, (x, y) => bloom * (1 - radial(540, 900, 60, 420)(x, y)) * .8, 24, 15, MUST, .7); ctx.restore(); }
  // $100 going in
  const sb = popScale(t, T.open + .55, .35);
  if (sb > 0) { const mv = eio(seg(t, t50 - .15, t50 + .25)); drawBill(lerp(540, 300, mv), lerp(900, 660, mv), lerp(360, 150, mv) * sb, lerp(-6, -14, mv) * D2R);
    if (mv < .5) { font('Bagel', 110); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.globalAlpha = 1 - mv * 2; ctx.fillText('$100', 540, 1110); ctx.globalAlpha = 1; ctx.textAlign = 'left'; } }
  // giant 50%
  const s50 = popScale(t, t50, .4);
  if (s50 > 0) {
    ctx.save(); ctx.translate(540, 1000); ctx.rotate(-4 * D2R); ctx.scale(s50, s50);
    font('Bagel', 380); ctx.textAlign = 'center';
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = TEAL; ctx.fillText('50%', 12, 12); ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.strokeText('50%', 0, 0); ctx.fillStyle = MUST; ctx.fillText('50%', 0, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(-400, -300, 800, 330); ctx.clip();
    // dots overprinted inside the glyphs only
    ctx.globalCompositeOperation = 'source-atop'; ctx.restore();
    ctx.textAlign = 'left'; ctx.restore();
    // overprint dots clipped to glyphs via an offscreen mask
    glyphDots('50%', 540, 1000, 380 * s50, -4, MUST);
  }
  // calendar flipping to 45
  const t45 = VOICE.l1 + 5.06; const sc = popScale(t, t45 - .15, .35);
  if (sc > 0) {
    const day = Math.max(1, Math.min(45, Math.floor(1 + 44 * ei(seg(t, t45, t45 + 1.1)) ** .7)));
    ctx.save(); ctx.translate(800, 1180); ctx.rotate(6 * D2R); ctx.scale(sc, sc);
    rr(-120, -110, 240, 230, 16); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = RED; ctx.save(); rr(-120, -110, 240, 62, 16); ctx.clip(); ctx.fillRect(-120, -110, 240, 62); ctx.restore(); rr(-120, -110, 240, 230, 16); ctx.stroke();
    font('JBM', 30, '800'); ctx.fillStyle = PAPER; ctx.textAlign = 'center'; ctx.fillText('DAY', 0, -66);
    font('Bagel', 120); ctx.fillStyle = INK; ctx.fillText(String(day), 0, 80); ctx.textAlign = 'left';
    ctx.restore();
  }
  ctx.restore();
  headline('THE PROMISE', 64, 330, 118, T.open + .3, t, { hl: [] });
  font('JBM', 34, '800'); if (t > T.open + .9) { ctx.fillStyle = INK; ctx.fillText('$100 IN  →  $150 OUT', 70, 410); }
}
let MASK; // offscreen for glyph-clipped dots
function glyphDots(str, x, y, size, rot, base) {
  if (!MASK) { MASK = document.createElement('canvas'); MASK.width = W; MASK.height = H; }
  const g = MASK.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.translate(x, y); g.rotate(rot * D2R); g.font = `${size}px Bagel`; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(str, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-in';
  // dots in a darker ink: radial density from the lower right
  const save = ctx; const tmp = g; // draw dots into the mask
  tmp.fillStyle = TEAL; tmp.beginPath(); const step = 22, ang = 45 * D2R, c = Math.cos(ang), s = Math.sin(ang);
  for (let u = -1200; u < 1200; u += step) for (let v = -1200; v < 1200; v += step) {
    const px = x + u * c - v * s, py = y + u * s + v * c; if (px < 0 || px > W || py < y - size || py > y + size * .3) continue;
    const d = .2 + .5 * clamp((py - (y - size * .7)) / (size * .8)); const r = d * step * .62; tmp.moveTo(px + r, py); tmp.arc(px, py, r, 0, TAU);
  }
  tmp.fill(); g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(MASK, 0, 0); ctx.restore();
}
// C: exhibit 2, the man and his coupon
function sceneMan(t) {
  const tCoupon = VOICE.l2 + 2.0, tName = VOICE.l2 + .28;
  const push = 1 + .04 * seg(t, T.exC, T.crowd);
  ctx.save(); ctx.translate(W / 2, 800); ctx.scale(push, push); ctx.translate(-W / 2, -800);
  // height chart
  const hc = popScale(t, T.exC + .05, .3);
  ctx.save(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.rect(60, 430, 960, 700); ctx.clip();
  halftone(60, 430, 1020, 1130, linear(430, 1130, .45), 22, 15, TEAL, .66);
  for (let i = 0; i <= 8; i++) { const yy = 470 + i * 80; ctx.fillStyle = INK; ctx.fillRect(60, yy, 960 * hc, i % 2 ? 4 : 8); if (i % 2 === 0) { font('JBM', 30, '800'); ctx.fillText(`${6 - i / 2}'0"`, 76, yy - 12); } }
  ctx.restore(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeRect(60, 430, 960, 700);
  // the man: slides left and shrinks when the coupon arrives
  const mv = eio(seg(t, tCoupon - .1, tCoupon + .45));
  const ms = popScale(t, T.exC + .15, .4);
  if (ms > 0) { ctx.save(); ctx.beginPath(); ctx.rect(60, 430, 960, 700); ctx.clip(); drawMan(lerp(540, 330, mv), lerp(820, 800, mv) + (1 - ms) * 300, lerp(1.3, 1.02, mv), t, { blink: true }); ctx.restore(); }
  // name plate
  const np = popScale(t, tName, .35);
  if (np > 0) {
    ctx.save(); ctx.translate(lerp(540, 330, mv), 1062); ctx.scale(np, np);
    const txt = 'CHARLES PONZI'; const w = tw(txt, 'Archivo', 54) + 60;
    rr(-w / 2, -50, w, 96, 12); ctx.fillStyle = INK; ctx.fill(); ctx.fillStyle = PAPER; ctx.textAlign = 'center'; font('Archivo', 54); ctx.fillText(txt, 0, 18); ctx.textAlign = 'left';
    ctx.restore();
  }
  // coupon
  const cp = t < tCoupon ? 0 : eo(seg(t, tCoupon, tCoupon + .4));
  if (cp > 0) {
    ctx.save(); ctx.translate(lerp(1400, 740, cp), 740); ctx.rotate(lerp(20, 5, cp) * D2R);
    const w = 420, h = 280;
    // perforated edge
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath();
    const R = 9; ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPER; for (let x = -w / 2; x <= w / 2; x += 24) for (const y of [-h / 2, h / 2]) { ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44); ctx.clip(); halftone(-w / 2, -h / 2, w / 2, h / 2, () => .28, 14, 15, GREEN, .6); ctx.restore();
    // globe
    ctx.beginPath(); ctx.arc(-100, 10, 62, 0, TAU); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.beginPath(); ctx.ellipse(-100, 10, 26, 62, 0, 0, TAU); ctx.moveTo(-162, 10); ctx.lineTo(-38, 10); ctx.stroke();
    font('Archivo', 34); ctx.fillStyle = INK; ctx.fillText('POSTAL', -20, -26); ctx.fillText('REPLY', -20, 14); ctx.fillText('COUPON', -20, 54);
    font('JBM', 22, '800'); ctx.fillText('INTERNATIONAL · 1920', -170, 108);
    ctx.restore();
  }
  ctx.restore();
  // headlines
  if (t < tCoupon) headline('THE MAN', 64, 330, 118, T.exC + .1, t);
  else headline('THE STORY', 64, 330, 118, tCoupon, t);
  // FAKE
  stamp('fake', 740, 745, 14, T.fake, t);
}
// D: the line outside the office
function sceneCrowd(t) {
  const d = t - T.crowd, pan = -60 * ss(seg(t, T.crowd, T.chain));
  ctx.save(); ctx.translate(pan, 0);
  // sky dots
  halftone(-100, 420, W + 120, 1110, linear(1100, 420, .55), 22, 15, TEAL, .66);
  // office building
  const bx = 560, by = 470;
  ctx.fillStyle = PAPER; ctx.fillRect(bx, by, 520, 640); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeRect(bx, by, 520, 640);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, 520, 640); ctx.clip(); halftone(bx, by, bx + 520, by + 640, (x, y) => .2 + .25 * clamp((x - bx) / 520), 18, 45, INK, .55); ctx.restore();
  // sign board
  rr(bx + 20, by + 30, 400, 150, 10); ctx.fillStyle = INK; ctx.fill(); font('Archivo', 40); ctx.fillStyle = MUST; ctx.fillText('SECURITIES', bx + 44, by + 90); ctx.fillText('EXCHANGE CO.', bx + 44, by + 146);
  // windows + door
  for (let i = 0; i < 2; i++) { ctx.fillStyle = MUST; ctx.fillRect(bx + 40 + i * 200, by + 230, 150, 150); ctx.strokeRect(bx + 40 + i * 200, by + 230, 150, 150); ctx.beginPath(); ctx.moveTo(bx + 115 + i * 200, by + 230); ctx.lineTo(bx + 115 + i * 200, by + 380); ctx.stroke(); }
  ctx.fillStyle = INK; rr(bx + 60, by + 430, 150, 210, 70); ctx.fill();
  // sidewalk
  ctx.fillStyle = INK; ctx.fillRect(-100, 1110, W + 200, 10);
  // the line: figures shuffle right toward the door, more keep arriving from the left
  for (let i = 0; i < 16; i++) {
    const x = 610 - i * 104 + d * 30 - ((i * 37) % 13); const step = Math.abs(Math.sin((d * 5 + i * .7))) * 10;
    const coat = i % 5 === 2 ? MUST : (i % 3 === 0 ? INK : TEAL);
    if (x > -80) drawFig(x, 1108 - step, 225 + (i % 3) * 14, coat, t, i);
  }
  ctx.restore();
  headline('THE LINE', 64, 330, 118, T.crowd + .2, t);
}
// E: the chain
const TIER_T = [17.75, 18.15, 18.65, 19.2, 19.75, 20.3, 20.85, 21.5];
function chainLayout(t) {
  const n = TIER_T.filter(x => t >= x).length; if (!n) return { n, rows: [] };
  // animated tier count for the pull-back
  let nEff = 0; TIER_T.forEach(x => nEff += eio(seg(t, x, x + .45)));
  nEff = Math.max(2, nEff);
  const top = 470, bot = 1130, gap = (bot - top) / nEff;
  const rows = [];
  for (let k = 0; k < n; k++) {
    const cnt = 2 ** k, sp = Math.min(300, 980 / cnt);
    const fs = Math.min(160, sp * .86, gap * .74);
    const y = top + (k + .82) * gap;
    const pop = popScale(t, TIER_T[k], .35);
    rows.push({ k, cnt, sp, fs, y, pop, x: i => 540 + (i - (cnt - 1) / 2) * sp });
  }
  return { n, rows };
}
function sceneChain(t) {
  const L = chainLayout(t); const strain = seg(t, 21.8, T.snap);
  const R = mulberry(77);
  const fallD = t - T.snap;
  // jitter from strain
  const jit = (k, i) => strain > 0 && fallD < 0 ? (hash(boilT(t) * 7 + k * 31 + i) - .5) * strain * 9 : 0;
  const fall = (k, i) => { if (fallD < 0) return [0, 0, 0]; const d = Math.max(0, fallD - .04 * k); const r = hash(k * 100 + i); return [(r - .5) * 300 * d, 2600 * d * d + (r * 200 - 60) * d, (r - .5) * 6 * d]; };
  // links (drawn first)
  for (let k = 1; k < L.rows.length; k++) {
    const row = L.rows[k], par = L.rows[k - 1]; if (row.pop <= 0) continue;
    const lw = Math.max(5, row.fs * .26);
    for (let i = 0; i < row.cnt; i++) {
      const p = Math.floor(i / 2);
      const [fx, fy] = fall(k, i), [px2, py2] = fall(k - 1, p);
      const x0 = row.x(i) + fx + jit(k, i), y0 = row.y - row.fs * .9 + fy, x1 = par.x(p) + px2, y1 = par.y + 4 + py2;
      if (k === 1 && fallD >= 0) continue; // the top link is the one that snaps
      chainLine(x0, y0, lerp(x0, x1, row.pop), lerp(y0, y1, row.pop), lw, strain);
      // money flows up: from new ones to old ones
      if (k <= 6 && t > TIER_T[k] + .25 && fallD < 0) {
        const per = .95, flow = 1 - .7 * seg(t, 24.5, 27.8);  // the flow dries up
        for (let b = 0; b < 2; b++) { const ph = ((t - TIER_T[k]) / per + b * .5 + hash(k * 9 + i) * .3) % 1;
          if (hash(k * 13 + i * 7 + b + Math.floor((t - TIER_T[k]) / per)) > flow) continue;
          drawBill(lerp(x0, x1, ph), lerp(y0, y1, ph), Math.max(12, Math.min(70, row.fs * .5)), Math.sin(ph * 6 + i) * .3); }
      }
    }
  }
  // snapped top link pieces
  if (fallD >= 0 && L.rows.length > 1) {
    const r1 = L.rows[1], r0 = L.rows[0];
    for (const [i, s] of [[0, -1], [1, 1]]) {
      const d = fallD; const x0 = r1.x(i), y0 = r1.y - r1.fs * .9, x1 = r0.x(0), y1 = r0.y + 4;
      ctx.save(); ctx.translate(lerp(x0, x1, .55) + s * 420 * d, lerp(y0, y1, .55) - 500 * d + 2400 * d * d); ctx.rotate(s * d * 9);
      chainLine(-60, 0, 60, 0, 14, 0); ctx.restore();
    }
  }
  // figures
  L.rows.forEach(row => {
    if (row.pop <= 0) return;
    for (let i = 0; i < row.cnt; i++) {
      const [fx, fy, fr] = fall(row.k, i);
      const coat = row.k === 0 ? MUST : (row.k % 2 ? TEAL : INK);
      ctx.save(); ctx.translate(row.x(i) + fx + jit(row.k, i), row.y + fy); ctx.scale(row.pop, row.pop);
      drawFig(0, 0, row.fs, coat, t, row.k * 50 + i, fr); ctx.restore();
    }
  });
  // scatter of bills at the snap
  if (fallD >= 0) for (let i = 0; i < 26; i++) {
    const r = hash(i * 3.3), a = -Math.PI * (.1 + .8 * r), sp = 600 + 900 * hash(i * 5.1);
    const x = 540 + Math.cos(a) * sp * fallD + Math.sin(fallD * 8 + i) * 30, y = 620 + Math.sin(a) * sp * fallD + 1500 * fallD * fallD;
    drawBill(x, y, 60, fallD * (4 + r * 6) * (i % 2 ? 1 : -1));
  }
  // top panel
  const tRep = VOICE.l5, tNeed = VOICE.l5 + .35;
  if (t < tRep) headline('THE CHAIN', 64, 250, 112, TIER_T[0], t);
  else headline('THE MATH', 64, 250, 112, tRep, t);
  if (t > TIER_T[0] && t < tNeed) {
    const n = L.n; const inv = 2 ** n - 1;
    font('JBM', 40, '800'); ctx.fillStyle = INK; ctx.fillText(`INVESTORS: ${inv.toLocaleString('en-US')}`, 70, 330);
  }
  if (t >= tNeed) {
    const p = eo(seg(t, tNeed, tNeed + .6)), q = eo(seg(t, tNeed + .45, tNeed + .9));
    font('JBM', 38, '800'); ctx.fillStyle = INK;
    ctx.fillText('NEEDED   160,000,000', 70, 318);
    ctx.fillStyle = GREEN; ctx.fillRect(70, 330, 940 * p, 36); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(70, 330, 940 * p, 36);
    if (q > 0) { ctx.fillStyle = INK; ctx.fillText('EXISTED   ~27,000', 70, 414);
    ctx.fillStyle = MUST; ctx.fillRect(70, 424, 9 * q, 36); ctx.strokeRect(70, 424, 9 * q, 36); }
  }
}
function chainLine(x0, y0, x1, y1, lw, strain) {
  const L = Math.hypot(x1 - x0, y1 - y0); if (L < 2) return; const a = Math.atan2(y1 - y0, x1 - x0);
  const linkL = Math.max(10, lw * 2.6), n = Math.max(1, Math.floor(L / (linkL * .78)));
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(a); ctx.strokeStyle = INK;
  for (let j = 0; j < n; j++) { const cx = (j + .5) * L / n; const side = j % 2;
    ctx.lineWidth = Math.max(2, lw * .34);
    if (side) { ctx.beginPath(); ctx.moveTo(cx - linkL * .5, 0); ctx.lineTo(cx + linkL * .5, 0); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(cx, 0, linkL * .55 * (1 + strain * .25), lw * .55, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}
// F: clippings pile on the closed folder, then CLOSED
const CLIPS = [
  { t: 29.0, x: 230, y: 700, r: -9, mast: 'THE EVENING LEDGER', head: 'COUPON PLAN DOUBTED' },
  { t: 29.32, x: 860, y: 820, r: 7, mast: 'DAILY COURIER', head: 'RUN ON THE OFFICE' },
  { t: 29.64, x: 220, y: 1120, r: 5, mast: 'THE MORNING STAR', head: 'AUDITORS FIND HOLE' },
  { t: 29.96, x: 850, y: 1250, r: -6, mast: 'THE EVENING LEDGER', head: 'PONZI ARRESTED' },
];
function clipping(c, t) {
  if (t < c.t) return; const d = t - c.t, sc = d < .08 ? lerp(1.5, 1, ei(d / .08)) : 1 + .04 * Math.exp(-d * 14) * Math.cos(d * 40);
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r * D2R); ctx.scale(sc * .78, sc * .78);
  const w = 470, h = 330;
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
  for (let x = -w / 2; x <= w / 2; x += 18) ctx.lineTo(x, -h / 2 + (hash(x + c.t) - .5) * 8);
  ctx.lineTo(w / 2, h / 2); for (let x = w / 2; x >= -w / 2; x -= 18) ctx.lineTo(x, h / 2 + (hash(x * 2 + c.t) - .5) * 8); ctx.closePath();
  ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  font('Alfa', 26); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(c.mast, 0, -h / 2 + 46); ctx.fillRect(-w / 2 + 24, -h / 2 + 58, w - 48, 5);
  font('Archivo', 46); const words = c.head.split(' '); const mid = Math.ceil(words.length / 2);
  ctx.fillText(words.slice(0, mid).join(' '), 0, -h / 2 + 120); ctx.fillText(words.slice(mid).join(' '), 0, -h / 2 + 170);
  ctx.textAlign = 'left';
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 24, -h / 2 + 196, 170, 110); ctx.clip(); halftone(-w / 2 + 24, -h / 2 + 196, -w / 2 + 194, -h / 2 + 306, radial(-w / 2 + 109, -h / 2 + 240, 10, 90, .9), 11, 45, INK, .62); ctx.restore();
  ctx.strokeRect(-w / 2 + 24, -h / 2 + 196, 170, 110);
  ctx.fillStyle = 'rgba(42,32,25,.6)'; for (let i = 0; i < 6; i++) ctx.fillRect(-w / 2 + 214, -h / 2 + 204 + i * 17, w - 240 - (i === 5 ? 80 : 0), 7);
  ctx.restore();
}
function sceneEnd(t) {
  const push = lerp(1.1, 1.0, eio(seg(t, T.closed, T.closed + .8)));
  ctx.save(); ctx.translate(W / 2, 960); ctx.scale(push, push); ctx.translate(-W / 2, -960);
  drawFolder(t, 0);
  CLIPS.forEach(c => clipping(c, t));
  stamp('closed', 540, 950, -11, T.closed, t);
  ctx.restore();
  headline('THE PONZI', 64, 300, 146, VOICE.l6 + 2.07, t, { stagger: .04 });
  headline('SCHEME', 64, 456, 146, VOICE.l6 + 2.4, t, { stagger: .04, hl: [0, 1, 2, 3, 4, 5] });
}

// ───────── captions: 2–4 words, bold sans, centred at 65 % height ─────────
function captions(t) {
  const c = CARDS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const size = 82, padX = 46, maxW = 940;
  font('Archivo', size);
  // wrap into at most two lines
  const words = c.text.split(' '); let lines = [c.text];
  if (ctx.measureText(c.text).width > maxW - padX * 2) { let best = null; for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width); if (!best || m < best[0]) best = [m, [a, b]]; } lines = best[1]; }
  const wMax = Math.max(...lines.map(l => ctx.measureText(l).width)); const bw = wMax + padX * 2, lh = size * 1.12, bh = lines.length * lh + 44;
  const p = back(seg(t, c.t0, c.t0 + .18), 2.2);
  ctx.save(); ctx.translate(W / 2, CAP_Y); ctx.scale(.86 + .14 * p, .86 + .14 * p);
  rr(-bw / 2 + 9, -bh / 2 + 9, bw, bh, 34); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = TEAL; ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  rr(-bw / 2, -bh / 2, bw, bh, 34); ctx.fillStyle = INK; ctx.fill();
  // keyword highlight
  lines.forEach((ln, j) => {
    const y = -bh / 2 + 22 + (j + .8) * lh; let x = -ctx.measureText(ln).width / 2;
    const ki = c.kw ? ln.indexOf(c.kw) : -1;
    const parts = ki >= 0 ? [[ln.slice(0, ki), PAPER], [c.kw, MUST], [ln.slice(ki + c.kw.length), PAPER]] : [[ln, PAPER]];
    parts.forEach(([s, col]) => { ctx.fillStyle = col; ctx.fillText(s, x, y); x += ctx.measureText(s).width; });
  });
  ctx.restore();
}

// ───────── camera shake / flash ─────────
const HITS = [[0, 10], [T.fake, 14], [T.snap, 26], [T.closed, 20], [29.0, 5], [29.32, 5], [29.64, 5], [29.96, 6]];
function shake(t) { let x = 0, y = 0; for (const [th, a] of HITS) { const d = t - th; if (d >= 0 && d < .45) { const e = a * (1 - d / .45) ** 2; x += Math.sin(d * 87 + th) * e; y += Math.cos(d * 73 + th) * e; } } return [x, y]; }
const FLASH = [[VOICE.l2 + .28, .5], [T.fake, .35], [T.snap, .5], [T.closed, .4]];
function flash(t) { let a = 0; for (const [tf, m] of FLASH) { const d = t - tf; if (d >= 0 && d < .25) a = Math.max(a, m * (1 - d / .25)); } return a; }

// ───────── frame ─────────
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const [sx, sy] = shake(t); ctx.translate(sx, sy);
  // keep the bottom 20 % clear
  ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, SAFE_BOTTOM + 50); ctx.clip();
  let chip = '';
  if (t < T.open + .5) { sceneOpening(t); chip = 'CLOSED'; }
  else if (t < T.exC) { scenePromise(t); chip = 'EXHIBIT 1'; }
  else if (t < T.crowd + .22) { sceneMan(t); chip = 'EXHIBIT 2'; }
  else if (t < T.chain + .22) { sceneCrowd(t); chip = 'EXHIBIT 3'; }
  else if (t < T.clips - .05) { sceneChain(t); chip = 'EXHIBIT 4'; }
  else { sceneEnd(t); chip = t < T.closed ? 'EXHIBIT 5' : 'CLOSED'; }
  ctx.restore();
  hud(t, chip);
  captions(t);
  // wipes (cover the cut)
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SAFE_BOTTOM); ctx.clip();
  dotWipe(t, T.exC, TEAL); dotWipe(t, T.crowd + .22, INK); dotWipe(t, T.chain + .22, MUST);
  ctx.restore();
  // paper multiply + grain + flash
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(PAPERTEX, 0, 0); ctx.globalCompositeOperation = 'source-over';
  grain(t);
  const f = flash(t); if (f > 0) { ctx.fillStyle = `rgba(255,252,240,${f})`; ctx.fillRect(0, 0, W, H); }
}

// readcheck: on-screen texts that must be read (captions are checked through the .srt)
window.TEXTS = t => {
  const o = [];
  const add = (id, text, t0, t1, x0, y0, x1, y1, pass = false) => { if (t >= t0 && t < t1) o.push({ id, text, x0, y0, x1, y1, pass }); };
  add('hook', '50% profit in 45 days?', 0, T.open + .05, 60, 180, 1000, 480);
  add('promise', 'THE PROMISE', T.open + .3, T.exC, 60, 230, 900, 350);
  add('name', 'CHARLES PONZI', VOICE.l2 + .28, T.crowd, 100, 1010, 980, 1110);
  add('coupon', 'POSTAL REPLY COUPON', VOICE.l2 + 2.0, T.crowd, 500, 580, 980, 910, true);
  add('fake', 'FAKE', T.fake, T.crowd + .1, 480, 610, 1000, 880);
  add('office', 'SECURITIES EXCHANGE CO.', T.crowd, T.chain + .1, 520, 490, 1000, 660, true);
  add('needed', 'NEEDED 160,000,000 · EXISTED ~27,000', VOICE.l5 + .35, T.snap, 60, 280, 1010, 465);
  add('clips', 'clippings', 29.0, T.end, 60, 560, 1020, 1440, true);
  add('closed', 'CLOSED', T.closed, T.end, 220, 820, 860, 1080);
  return o;
};

// ───────── sound events ─────────
const EV = []; const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(0, 'stamp', { big: 1 }); ev(T.open, 'flap'); ev(T.open + .3, 'pops', { n: 11 }); ev(T.open + .55, 'boing');
ev(VOICE.l1 + 3.94, 'boing'); ev(VOICE.l1 + 5.06, 'flip', { dur: 1.1 });
ev(T.exC - .22, 'whoosh'); ev(T.exC + .1, 'pops', { n: 7 }); ev(VOICE.l2 + .28, 'shutter');
ev(VOICE.l2 + 2.0, 'slide'); ev(VOICE.l2 + 2.0, 'pops', { n: 9 }); ev(T.fake, 'stamp');
ev(T.crowd, 'whoosh'); ev(T.crowd + .2, 'pops', { n: 8 }); ev(T.crowd, 'murmur', { dur: 2.6 });
ev(T.chain, 'whoosh'); TIER_T.forEach((x, k) => ev(x, 'clink', { k })); ev(TIER_T[0], 'pops', { n: 9 });
ev(TIER_T[1] + .3, 'money', { until: 27.8 }); ev(21.8, 'strain', { until: T.snap - .05 });
ev(VOICE.l5, 'pops', { n: 8 }); ev(VOICE.l5 + .35, 'typing', { dur: .9 });
ev(T.snap, 'snap'); ev(T.snap + .05, 'flutter', { dur: 1.2 });
CLIPS.forEach(c => ev(c.t, 'slap'));
ev(T.closed, 'stamp', { big: 1 });
ev(VOICE.l6 + 2.07, 'pops', { n: 15 });
Object.entries(VOICE).forEach(([id, t]) => ev(t, 'voice', { id }));
window.EV = EV; window.DUR = T.end;

(async () => {
  await Promise.all(['146px Alfa', '82px Archivo', '380px Bagel', '800 30px JBM'].map(f => document.fonts.load(f, 'ABC50%$0123456789·→~')));
  await document.fonts.ready;
  PAPERTEX = buildPaper();
  STAMPS.closed = makeStamp('CLOSED', 640, 220, RED, 140);
  STAMPS.fake = makeStamp('FAKE', 520, 230, RED, 160);
  window.render = render; render(0); window.READY = true;
})();
