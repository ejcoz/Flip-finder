// "You quit vaping" — a Pixel Scan film. One timeline in bars (120 BPM, 1 bar = 2 s) drives picture, sound events and the score.
// Two layers: the world (lab, booth, body, props) goes through the camera; the text layer (hook, titles, captions, callouts, lens, readout) never does.
import { drawText, textW } from './font.js';
import { bayer } from './pix.js';
import { drawBit, sparkle, C } from './bit.js';
import { buildLab, glassSheen, BOOTH, FW, FH } from './lab.js';

const BAR = 2, BEAT = 0.5;
// lungs, liver, stomach, muscle stay unchanged: this film makes no claims about them (FACTS.md)
const BODY = { lung: 1, liver: 1, stomach: 1, muscle: 1 };
const MS = [
  { bars: 2, hook: [['YOU QUIT', 11], ['VAPING.', 14], ["HERE'S WHAT HAPPENS", 6]], mood: 'groove', dir: 0, nic: [100, 100], props: ['vapeX'],
    s: { ...BODY, brain: .3, heart: .45, face: 'flat', toxins: 26 } },
  { bars: 2, title: 'HOUR 2', sub: 'NICOTINE HALVES', cap: ['HALF YOUR', 'NICOTINE IS GONE'], mood: 'groove', dir: 1, nic: [100, 50],
    label: { organ: 'HEART', say: ['NICOTINE', 'WEARING OFF'], at: [17.5, 24.5] },
    s: { ...BODY, brain: .3, heart: .7, face: 'flat', toxins: 13 } },
  { bars: 2, title: 'DAYS 1-3', sub: 'WITHDRAWAL PEAKS', cap: ['CRAVINGS, MOODS,', 'BAD SLEEP'], mood: 'stripped', dir: -1, nic: [50, 0], props: ['sweat'], shake: true,
    label: { organ: 'BRAIN', say: ['CRAVES', 'NICOTINE'], at: [18, 4] },
    s: { ...BODY, brain: .15, heart: .8, face: 'wide', toxins: 0 } },
  { bars: 2, title: 'WHY SO HARD?', sub: 'EXTRA RECEPTORS', cap: ['YOUR BRAIN GREW', 'EXTRA RECEPTORS'], mood: 'groove', dir: -1, nic: [0, 0],
    lens: { n: 18, col: C.amber, head: 'RECEPTORS', foot: 'TOO MANY' },
    s: { ...BODY, brain: .2, heart: .85, face: 'tired', toxins: 0 } },
  { bars: 2, title: 'WEEKS 1-4', sub: 'CRAVINGS EASE', cap: ['SYMPTOMS FADE', 'OVER A MONTH'], mood: 'groove', dir: 1, nic: [0, 0],
    chart: { label: 'URGE', x: 'WEEKS', pts: [.45, .95, .88, .72, .6, .48, .4, .33, .26, .2, .16] },
    s: { ...BODY, brain: .5, heart: .9, face: 'flat', toxins: 0 } },
  { bars: 2, title: 'WEEKS 6-12', sub: 'BRAIN RESETS', cap: ['RECEPTORS BACK', 'TO NORMAL'], mood: 'groove', dir: 1, nic: [0, 0], coin: true,
    lens: { n: 7, col: C.lime, head: 'RECEPTORS', foot: 'NORMAL' },
    s: { ...BODY, brain: .9, heart: 1, face: 'flat', toxins: 0 } },
  { bars: 3, title: 'MONTH 3+', sub: 'CALMER MIND', cap: ['LESS ANXIETY,', 'LESS STRESS'], mood: 'groove', drop: true, dir: 1, nic: [0, 0], punch: true,
    s: { ...BODY, brain: 1, heart: 1, face: 'happy', toxins: 0 } },
  { bars: 3, title: "YOU'RE FREE", sub: 'NICOTINE FREE', cap: ['SEND THIS TO', 'SOMEONE QUITTING'], mood: 'triumph', dir: 1, nic: [0, 0], final: true,
    s: { ...BODY, brain: 1, heart: 1, face: 'happy', toxins: 0 } },
];
let acc = 0; for (const m of MS) { m.t0 = acc; acc += m.bars * BAR; m.t1 = acc; }
window.DUR = acc;
const PUNCH = MS.find(m => m.punch), FINAL = MS.find(m => m.final);

// sound / cue events, read by music.py through events.json
const EV = [];
MS.forEach((m, i) => {
  EV.push({ t: m.t0, type: 'section', i, bars: m.bars, mood: m.mood, drop: !!m.drop, dir: m.dir });
  if (i > 0) EV.push({ t: m.t0, type: m.dir < 0 && MS[i - 1].dir >= 0 ? 'fall' : 'sweep' });
  if (m.coin) EV.push({ t: m.t0 + BAR + BEAT, type: 'coin' });
  if (m.final) EV.push({ t: m.t0, type: 'confetti' });
  if (m.chart) for (let k = 0; k < 10; k++) EV.push({ t: m.t0 + BAR / 2 + k * 0.25, type: 'tick', k: 9 - k });
  if (m.hook) m.hook.forEach((_, k) => EV.push({ t: m.t0 + k * BEAT, type: 'blip', k }));
  if (m.cap) EV.push({ t: m.t0 + 0.3, type: 'cap' });
  if (m.lens) EV.push({ t: m.t0 + BAR / 2, type: 'lens' });
});
window.EV = EV;

const cv = document.getElementById('c'), out = cv.getContext('2d');
const F = document.createElement('canvas'); F.width = FW; F.height = FH;
const ctx = F.getContext('2d');
let LAB;
const B = BOOTH, GH = B.glassY1 - B.glassY0, PX = 16, FOOT = B.glassY1 - 6, CX = (B.gx0 + B.gx1) / 2, TOP = FOOT - 62 * PX;
const at = (cx, cy) => [CX + cx * PX, TOP + cy * PX];   // figure cell offset from centre → world
const TY = 90;
const dirCol = d => d > 0 ? C.lime : d < 0 ? C.amber : '#39E0F0';

// ---------- text layer ----------
function bar(text, cy, c, fg, bg, line) {
  const w = textW(text, c) + 2 * Math.max(28, c * 4), h = 7 * c + 2 * Math.max(12, c * 1.7), x = Math.round((FW - w) / 2);
  out.fillStyle = bg; out.fillRect(x, cy, Math.round(w), Math.round(h));
  if (line) { out.fillStyle = line; out.fillRect(x, cy + Math.round(h), Math.round(w), c); }
  drawText(out, text, FW / 2, cy + (h - 7 * c) / 2, c, fg, { align: 'center', shadow: c >= 8 ? '#03262C' : null });
  return cy + Math.round(h) + (line ? c : 0);
}
function hook(m, lt) {
  const n = Math.floor(lt / BEAT) + 1, [[a, ca], [b, cb], [c3, cc]] = m.hook;
  let y = TY;
  if (n >= 1) y = bar(a, y, ca, '#F2FBFC', '#03262C', null) + 10;
  if (n >= 2) y = bar(b, y, cb, '#F2FBFC', '#0B8EA0', '#39E0F0') + 16;
  if (n >= 3) bar(c3, y, cc, '#03262C', '#39E0F0', null);
}
function titleBar(m, k = 1) {
  const c = 13, w = textW(m.title, c) + 110, x = Math.round((FW - w) / 2), h = 7 * c + 44;
  out.fillStyle = m.final ? '#03262C' : '#0B8EA0'; out.fillRect(x, TY, Math.round(w), h);
  out.fillStyle = dirCol(m.dir); out.fillRect(x, TY + h, Math.round(w), c);
  drawText(out, m.title, FW / 2, TY + 22, c, m.final ? C.lime : '#F2FBFC', { align: 'center', shadow: '#03262C', count: Math.ceil(m.title.length * k) });
  if (m.sub) bar(m.sub, TY + h + c + 18, 6, '#F2FBFC', '#03262C', null);
}
function caption(lines, dir) {
  const c = 7, lh = 7 * c + 18, h = lines.length * lh + 34, w = FW - 80, x = 40, y = FH - 60 - h;
  out.fillStyle = 'rgba(3,24,28,.94)'; out.beginPath(); out.roundRect(x, y, w, h, 16); out.fill();
  out.strokeStyle = dirCol(dir); out.lineWidth = 4; out.stroke();
  lines.forEach((l, i) => drawText(out, l, FW / 2, y + 22 + i * lh, c, '#F2FBFC', { align: 'center' }));
}
function readout(v) {   // nicotine in the blood, halving on a 2-hour clock
  const x = 14, y = 980, w = 176, h = 206, good = v < 100;
  out.fillStyle = 'rgba(3,30,35,.92)'; out.beginPath(); out.roundRect(x, y, w, h, 14); out.fill();
  out.strokeStyle = '#39E0F0'; out.lineWidth = 3; out.stroke();
  drawText(out, 'NICOTINE', x + w / 2, y + 18, 3, '#39E0F0', { align: 'center' });
  drawText(out, v + '%', x + w / 2, y + 74, 7, v === 0 ? C.lime : good ? '#F2FBFC' : C.amber, { align: 'center', shadow: '#03262C' });
  drawText(out, 'IN BLOOD', x + w / 2, y + h - 40, 3, 'rgba(57,224,240,.75)', { align: 'center' });
  // a small level bar
  out.fillStyle = 'rgba(57,224,240,.2)'; out.fillRect(x + 20, y + 140, w - 40, 12);
  out.fillStyle = v === 0 ? C.lime : C.amber; out.fillRect(x + 20, y + 140, Math.round((w - 40) * v / 100 / 4) * 4, 12);
}
function callout(lb, dir, cam) {   // what is happening to one organ, leader line to it wherever the camera puts it
  const [cx, cy] = lb.at, [wx, wy] = at(cx - 15, cy), ox = wx * cam[0] + cam[1], oy = wy * cam[0] + cam[2], col = dirCol(dir);
  const w = Math.max(textW(lb.organ, 3), ...lb.say.map(l => textW(l, 4))) + 28, h = 14 + 21 + 12 + lb.say.length * 38 - 10 + 14;
  const x = FW - w - 12, y = Math.round(Math.max(470, Math.min(1560 - h, oy - h / 2)));
  out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(ox, oy); out.lineTo(x - 18, y + h / 2); out.lineTo(x, y + h / 2); out.stroke();
  out.fillStyle = col; out.fillRect(ox - 6, oy - 6, 12, 12);
  out.fillStyle = 'rgba(3,24,28,.95)'; out.fillRect(x, y, w, h);
  out.strokeStyle = col; out.lineWidth = 3; out.strokeRect(x, y, w, h);
  drawText(out, lb.organ, x + 14, y + 14, 3, 'rgba(57,224,240,.75)');
  lb.say.forEach((l, k) => drawText(out, l, x + 14, y + 47 + k * 38, 4, col));
}
// zoom lens: grows out of the brain, shows receptors as pixel icons; count is the story
function lens(L, k, cam, t) {
  const [wx, wy] = at(0, 4), ox = wx * cam[0] + cam[1], oy = wy * cam[0] + cam[2];
  const r = Math.round(196 * k), cx = 870, cy = 660;
  if (r < 6) return;
  out.strokeStyle = L.col; out.lineWidth = 3; out.beginPath(); out.moveTo(ox + 70, oy); out.lineTo(cx - r * .96, cy + r * .2); out.stroke();
  out.save(); out.beginPath(); out.arc(cx, cy, r, 0, Math.PI * 2); out.fillStyle = 'rgba(3,24,28,.97)'; out.fill(); out.clip();
  if (k > .9) {
    drawText(out, L.head, cx, cy - 150, 4, '#39E0F0', { align: 'center' });
    drawText(out, L.foot, cx, cy + 112, 5, L.col, { align: 'center' });
    // receptors: big pixel "Y" icons standing on a membrane line; they bob on beats
    out.fillStyle = 'rgba(57,224,240,.55)'; out.fillRect(cx - 170, cy + 82, 340, 8);
    const pulse = Math.floor(t / BEAT) % 2, slots = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) slots.push([cx - 150 + i * 54 + (j % 2) * 20, cy - 100 + j * 60]);
    const order = slots.map((s, i) => [Math.abs(Math.sin(i * 12.9898) * 43758.5) % 1, s]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
    out.fillStyle = L.col;
    order.slice(0, L.n).forEach(([x, y], i) => {
      const yy = y + ((i + pulse) % 2 ? 0 : -4);
      for (const [c, rr] of [[0, 0], [2, 0], [0, 1], [2, 1], [1, 2], [1, 3], [1, 4]]) out.fillRect(x + c * 8, yy + rr * 8, 8, 8);
    });
  }
  out.restore();
  out.strokeStyle = L.col; out.lineWidth = 6; out.beginPath(); out.arc(cx, cy, r, 0, Math.PI * 2); out.stroke();
  out.strokeStyle = 'rgba(255,255,255,.18)'; out.lineWidth = 3; out.beginPath(); out.arc(cx, cy, r - 10, Math.PI * 1.1, Math.PI * 1.45); out.stroke();
}

// ---------- world layer ----------
function chart(ch, rv) {
  const cell = 6, L = B.gx0 + 60, R = B.gx1 - 44, T = B.glassY0 + 130, Bo = B.glassY1 - 170;
  ctx.fillStyle = 'rgba(3,24,28,.82)'; ctx.fillRect(B.gx0, B.glassY0, B.gx1 - B.gx0, GH);
  ctx.fillStyle = 'rgba(57,224,240,.35)';
  for (let y = Bo - 110; y > T; y -= 110) for (let x = L; x < R; x += cell * 3) ctx.fillRect(x, y, cell, cell);
  ctx.fillStyle = '#39E0F0'; ctx.fillRect(L - cell, T, cell, Bo - T + cell); ctx.fillRect(L - cell, Bo, R - L + cell, cell);
  drawText(ctx, ch.label, L, T - 64, 7, '#39E0F0');
  drawText(ctx, ch.x, R, Bo + 30, 6, '#39E0F0', { align: 'right' });
  const pc = 14, n = ch.pts.length - 1, cols = Math.floor((R - L) / pc), shown = Math.floor(cols * rv);
  const yAt = k => { const f = k * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return Bo - (ch.pts[i] * (1 - u) + ch.pts[i + 1] * u) * (Bo - T); };
  let py = null;
  for (let c = 0; c < shown; c++) {
    const x = L + c * pc, y = Math.round(yAt(c / (cols - 1)) / pc) * pc;
    const rising = py != null && y < py, col = rising ? C.amber : C.lime;      // the urge climbing is bad, falling is good
    ctx.fillStyle = rising ? 'rgba(255,181,71,.45)' : 'rgba(166,240,74,.5)';
    for (let yy = y + pc; yy < Bo; yy += cell) if (.28 > bayer(x / cell, yy / cell)) ctx.fillRect(x, yy, pc, cell);
    ctx.fillStyle = col;
    const a = py == null ? y : Math.min(py, y), b = py == null ? y : Math.max(py, y);
    for (let yy = a; yy <= b; yy += pc) ctx.fillRect(x, yy, pc, pc);
    py = y;
    if (c === shown - 1 && rv < 1) { ctx.fillStyle = '#F2FBFC'; ctx.fillRect(x, y, pc, pc); }
  }
}
function props(list, t) {
  const step = Math.floor(t * 15) / 15;
  for (const p of list || []) {
    if (p === 'vapeX') {        // a pixel vape beside Bit's hand, crossed out
      const [x, y] = at(11.5, 30), c = 10;
      const V = ['.kk.', '.kk.', 'wwww', 'wccw', 'wccw', 'wwww', 'wwww', 'wwww', 'wwww', 'wwww', 'wwww', 'wllw', 'wwww'];
      const pal = { k: '#03262C', w: '#BFD3D6', c: '#39E0F0', l: C.amber };
      V.forEach((row, r) => [...row].forEach((ch, cc) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x + cc * c, y + r * c, c, c); } }));
      if (step % 1 > .25 || t > 1) {   // the X lands on beat 2
        ctx.fillStyle = '#FF5A5F';
        for (let i = 0; i < 13; i++) { ctx.fillRect(x - 40 + i * 9.2, y - 10 + i * 11, 14, 14); ctx.fillRect(x + 70 - i * 9.2, y - 10 + i * 11, 14, 14); }
      }
    } else if (p === 'sweat') {
      for (const [cx, ph] of [[-10.5, 0], [8, .5]]) {
        const k = ((step / 0.8 + ph) % 1), [x, y] = at(cx, 3 + k * 6);
        ctx.fillStyle = '#BFF4FF';
        for (const [c, r] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]]) ctx.fillRect(Math.round(x + c * 12), Math.round(y + r * 12), 12, 12);
      }
    }
  }
}
function confetti(g, t) {
  const step = Math.floor(t * 15) / 15, cols = ['#A6F04A', '#39E0F0', '#FF7A6B', '#F2FBFC', '#FFB0A3'];
  for (let i = 0; i < 70; i++) {
    const h1 = Math.abs(Math.sin(i * 91.7) * 43758.5 % 1), h2 = Math.abs(Math.sin(i * 17.3) * 12731.1 % 1);
    const x = h1 * FW, y = -40 - h2 * 700 + step * (260 + h1 * 220);
    if (y < -10 || y > FH) continue;
    g.fillStyle = cols[i % 5];
    const s = i % 3 ? 8 : 12; g.fillRect(Math.round((x + Math.sin(step * 3 + i) * 24) / 4) * 4, Math.round(y / 4) * 4, s, s);
  }
}
// camera (world layer only): slow push-in, punch-in to the head on PUNCH bar 2, pull back for the finale
function camera(t) {
  const headY = TOP + 8 * PX;
  let z = 1 + 0.04 * Math.min(1, t / PUNCH.t0), fy = 1060;
  if (t >= PUNCH.t0 + BAR) { const k = Math.min(1, (t - PUNCH.t0 - BAR) / 0.12); z = 1.04 + 0.3 * k; fy = 1060 + (headY - 1060) * k; }
  if (t >= FINAL.t0) { const k = Math.min(1, (t - FINAL.t0) / 1.2), e = 1 - Math.pow(1 - k, 3); z = 1.34 - 0.34 * e; fy = headY + (1060 - headY) * e; }
  return [z, CX, fy];
}

window.render = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1], lt = t - m.t0;
  const p = prev ? Math.min(1, lt / (BAR / 2)) : 1, ys = B.glassY0 + p * GH;
  ctx.drawImage(LAB, 0, 0);
  const dropNow = m.drop && lt >= 2 * BAR;
  const rim = (t % BEAT) < 0.12 && !dropNow ? '#C8FAFF' : '#39E0F0';
  const bit0 = st => drawBit(ctx, { x: CX, y: FOOT, px: PX, state: { ...st, seed: 5 }, rim });
  const scene = (mm, rv) => {
    if (!mm.chart) return bit0(mm.s);
    ctx.save(); ctx.globalAlpha = .3; bit0(mm.s); ctx.restore(); chart(mm.chart, rv);
  };
  const rv = Math.min(1, Math.floor(Math.max(0, lt - BAR / 2) / 0.25) * 0.25 / (m.bars * BAR - BAR / 2 - 0.5));
  ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, B.glassY0, B.gx1 - B.gx0, GH); ctx.clip();
  if (p < 1) {
    ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, ys, B.gx1 - B.gx0, B.glassY1 - ys); ctx.clip(); scene(prev, 1); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, B.glassY0, B.gx1 - B.gx0, ys - B.glassY0); ctx.clip(); scene(m, 0); ctx.restore();
    const cell = 6;
    ctx.fillStyle = m.dir < 0 ? C.amber : '#39E0F0';
    for (let y = ys - 120; y < ys; y += cell) for (let x = B.gx0; x < B.gx1; x += cell) {
      const k = Math.pow(1 - (ys - y) / 120, 2) * 0.55;
      if (k > bayer(x / cell, y / cell)) ctx.fillRect(x, Math.floor(y / cell) * cell, cell, cell);
    }
    const gl = ctx.createLinearGradient(0, ys - 30, 0, ys + 30);
    gl.addColorStop(0, 'rgba(57,224,240,0)'); gl.addColorStop(.5, 'rgba(57,224,240,.6)'); gl.addColorStop(1, 'rgba(57,224,240,0)');
    ctx.fillStyle = gl; ctx.fillRect(B.gx0, ys - 30, B.gx1 - B.gx0, 60);
    ctx.fillStyle = '#E9FDFF'; ctx.fillRect(B.gx0, ys - 2, B.gx1 - B.gx0, 4);
  } else scene(m, rv);
  ctx.restore();
  if (p < 1) { ctx.fillStyle = '#39E0F0'; ctx.fillRect(B.x0 - 14, ys - 5, 34, 10); ctx.fillRect(B.x1 - 20, ys - 5, 34, 10); }
  glassSheen(ctx);
  if (p >= 1 && !m.chart) props(m.props, lt);
  if (m.dir > 0 && !m.chart && p >= 1 && i >= 5) {
    const tw = Math.floor(t / BEAT);
    [[-6, 3], [7, 2], [-8, 9], [6, 10]].forEach(([dx, dy], k) => { if ((tw + k) % 3) sparkle(ctx, CX + dx * PX, TOP + dy * PX, 7); });
  }

  // world through the camera (+ setback shake)
  let [z, fx, fy] = camera(t), sx = 0, sy = 0;
  if (m.shake && lt < 2 * BEAT) { const k = Math.floor(t * 30); sx = ((k * 37) % 7) - 3; sy = ((k * 53) % 7) - 3; }
  const tx = Math.min(0, Math.max(FW - FW * z, FW / 2 - fx * z)), ty = Math.min(0, Math.max(FH - FH * z, FH / 2 - fy * z));
  const cam = [z, (z > 1.001 ? tx : 0) + sx, (z > 1.001 ? ty : 0) + sy];
  out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = '#041417'; out.fillRect(0, 0, FW, FH);
  out.imageSmoothingEnabled = z > 1.001;
  out.setTransform(cam[0], 0, 0, cam[0], cam[1], cam[2]);
  out.drawImage(F, 0, 0);
  out.setTransform(1, 0, 0, 1, 0, 0);

  // text layer
  const [n0, n1] = m.nic;
  let nic = n0;
  if (n1 !== n0 && p >= .5) {     // halves step by step on beats
    const steps = Math.floor((lt - BAR / 2) / BEAT) + 1;
    nic = n1 === 0 ? (steps >= 6 ? 0 : Math.round(n0 / Math.pow(2, steps))) : Math.max(n1, Math.round(n0 - (n0 - n1) * steps / 3));
  }
  readout(nic);
  if (m.label && p >= 1) callout(m.label, m.dir, cam);
  if (m.lens && p >= 1) lens(m.lens, Math.min(1, (lt - BAR / 2) / 0.25), cam, t);
  const tm = p >= 0.3 || !prev ? m : prev;
  if (tm.hook) hook(tm, tm === m ? lt : 9); else titleBar(tm, m.final ? Math.min(1, lt / 0.6) : 1);
  if (tm.cap) caption(tm.cap, tm.dir);
  if (m.final) confetti(out, lt);
};

window.TEXTS = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1];
  const tm = prev && t - m.t0 < 0.3 * BAR / 2 ? prev : m, T = [];
  if (tm.hook) {
    const n = tm === m ? Math.floor((t - m.t0) / BEAT) + 1 : 3;
    tm.hook.slice(0, n).forEach(([h], k) => T.push({ id: 'hook' + k, text: h, x0: 60, y0: TY + k * 120, x1: 1020, y1: TY + k * 120 + 110 }));
  } else {
    T.push({ id: 'title', text: tm.title, x0: 20, y0: TY, x1: 1060, y1: TY + 150 });
    T.push({ id: 'sub', text: tm.sub, x0: 200, y0: TY + 170, x1: 880, y1: TY + 240 });
  }
  if (tm.cap) T.push({ id: 'cap', text: tm.cap.join(' '), x0: 40, y0: 1650, x1: 1040, y1: 1860 });
  if (m.label && t - m.t0 >= BAR / 2) T.push({ id: 'callout', text: m.label.say.join(' '), x0: 740, y0: 470, x1: 1080, y1: 1560 });
  if (m.lens && t - m.t0 >= BAR / 2 + 0.25) T.push({ id: 'lens', text: m.lens.foot, x0: 674, y0: 464, x1: 1066, y1: 856 });
  return T;
};

LAB = buildLab();
window.render(0);
window.READY = true;
