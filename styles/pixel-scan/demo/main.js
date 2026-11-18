// Pixel Scan demo: "10K steps a day". One timeline in bars (120 BPM, 1 bar = 2 s) drives picture, sound events and the score.
// Two layers: the world (lab, booth, body, labels) goes through the camera; the text layer (hook, titles, captions, readout) never does.
import { drawText, textW } from './font.js';
import { bayer } from './pix.js';
import { drawBit, sparkle, C } from './bit.js';
import { buildLab, glassSheen, BOOTH, FW, FH } from './lab.js';

const BAR = 2, BEAT = 0.5;
const HEALTHY = { lung: 1, heart: 1, brain: 1, liver: 1, stomach: 1, muscle: 1, toxins: 0 };
// mood drives the score: groove | stripped | triumph ; dir: 1 better, -1 setback, 0 neutral
// label: { organ, say: [two short lines: what is happening to it], at: [figure cell x, y] } — the line names the organ, the text names the change
const MS = [
  { bars: 2, hook: ['YOU WALK 10K', 'STEPS A DAY.', "HERE'S WHAT HAPPENS"], mood: 'groove', dir: 0, hr: 84, props: ['bang'],
    s: { lung: .25, heart: .3, brain: .3, liver: .45, stomach: .5, muscle: .1, face: 'tired', toxins: 16 } },
  { bars: 2, title: 'WEEK 1', sub: 'SORE LEGS', cap: ['MUSCLES ADAPT TO', 'THE NEW LOAD'], label: { organ: 'LEG MUSCLES', say: ['MICRO-TEARS', 'REBUILDING'], at: [18.5, 47] }, mood: 'stripped', dir: -1, hr: 84, props: ['sweat'], shake: true,
    s: { lung: .3, heart: .35, brain: .35, liver: .5, stomach: .55, muscle: .1, face: 'wide', toxins: 13, sore: true } },
  { bars: 2, title: 'WEEKS 2-8', sub: 'ENERGY BUILDS', cap: ['MORE ENERGY,', 'LESS FATIGUE'], mood: 'groove', dir: 1, hr: 80,
    chart: { label: 'ENERGY', x: 'WEEKS', pts: [.1, .16, .13, .28, .36, .31, .5, .6, .56, .76, .9] },
    s: { lung: .5, heart: .55, brain: .5, liver: .7, stomach: .75, muscle: .5, face: 'flat', toxins: 7 } },
  { bars: 2, title: 'MONTH 2', sub: 'SLEEP DEEPER', cap: ['ACTIVE DAYS,', 'DEEPER SLEEP'], label: { organ: 'BRAIN', say: ['RECOVERS', 'OVERNIGHT'], at: [18, 4] }, mood: 'groove', dir: 1, hr: 76, props: ['zzz'],
    s: { lung: .7, heart: .7, brain: 1, liver: .85, stomach: .9, muscle: .8, face: 'shut', toxins: 3 } },
  { bars: 3, title: 'MONTH 3', sub: 'HEART STRONGER', cap: ['RESTING HEART', 'RATE DROPS'], label: { organ: 'HEART', say: ['PUMPS MORE', 'PER BEAT'], at: [17.5, 24.5] }, mood: 'groove', drop: true, dir: 1, hr: 68, count: true,
    s: { ...HEALTHY, face: 'happy' } },
  { bars: 3, title: 'LEVEL UP!', sub: 'KEEP WALKING', cap: ['SAVE THIS FOR', 'YOUR DAY 1'], mood: 'triumph', dir: 1, hr: 68, final: true,
    s: { ...HEALTHY, face: 'happy' } },
];
let acc = 0; for (const m of MS) { m.t0 = acc; acc += m.bars * BAR; m.t1 = acc; }
window.DUR = acc;

// sound / cue events, read by music.py through events.json
const EV = [];
MS.forEach((m, i) => {
  EV.push({ t: m.t0, type: 'section', i, bars: m.bars, mood: m.mood, drop: !!m.drop, dir: m.dir });
  if (i > 0) EV.push({ t: m.t0, type: m.dir < 0 ? 'fall' : 'sweep' });
  if (m.count) EV.push({ t: m.t0 + 2 * BAR - BEAT, type: 'coin' });
  if (m.final) EV.push({ t: m.t0, type: 'confetti' });
  if (m.chart) for (let k = 0; k < 10; k++) EV.push({ t: m.t0 + BAR / 2 + k * 0.25, type: 'tick', k });
  if (m.hook) m.hook.forEach((_, k) => EV.push({ t: m.t0 + k * BEAT, type: 'blip', k }));
  if (m.cap) EV.push({ t: m.t0 + 0.3, type: 'cap' });
});
window.EV = EV;

const cv = document.getElementById('c'), out = cv.getContext('2d');
const F = document.createElement('canvas'); F.width = FW; F.height = FH;
let ctx = F.getContext('2d');
let LAB;
const B = BOOTH, GH = B.glassY1 - B.glassY0, PX = 16, FOOT = B.glassY1 - 6, CX = (B.gx0 + B.gx1) / 2, TOP = FOOT - 62 * PX;
const at = (cx, cy) => [CX + cx * PX, TOP + cy * PX];   // figure cell offset from centre → frame
const TY = 90;                                           // top of the title block

// ---------- text layer ----------
function bar(text, cy, c, fg, bg, line) {   // a text bar centred at FW/2, top at cy; returns its bottom
  const w = textW(text, c) + 2 * Math.max(28, c * 4), h = 7 * c + 2 * Math.max(12, c * 1.7), x = Math.round((FW - w) / 2);
  out.fillStyle = bg; out.fillRect(x, cy, Math.round(w), Math.round(h));
  if (line) { out.fillStyle = line; out.fillRect(x, cy + Math.round(h), Math.round(w), c); }
  drawText(out, text, FW / 2, cy + (h - 7 * c) / 2, c, fg, { align: 'center', shadow: c >= 8 ? '#03262C' : null });
  return cy + Math.round(h) + (line ? c : 0);
}
function hook(m, lt) {        // stacked opening title, one line per beat
  const [a, b, c3] = m.hook, n = Math.floor(lt / BEAT) + 1;
  let y = TY;
  if (n >= 1) y = bar(a, y, 10, '#F2FBFC', '#03262C', null) + 10;
  if (n >= 2) y = bar(b, y, 12, '#F2FBFC', '#0B8EA0', '#39E0F0') + 16;
  if (n >= 3) bar(c3, y, 6, '#03262C', '#39E0F0', null);
}
function titleBar(m, k = 1) {
  const c = 13, line = m.dir > 0 ? C.lime : m.dir < 0 ? C.amber : '#39E0F0';
  const w = textW(m.title, c) + 110, x = Math.round((FW - w) / 2), h = 7 * c + 44;
  out.fillStyle = m.final ? '#03262C' : '#0B8EA0'; out.fillRect(x, TY, Math.round(w), h);
  out.fillStyle = line; out.fillRect(x, TY + h, Math.round(w), c);
  drawText(out, m.title, FW / 2, TY + 22, c, m.final ? C.lime : '#F2FBFC', { align: 'center', shadow: '#03262C', count: Math.ceil(m.title.length * k) });
  if (m.sub) bar(m.sub, TY + h + c + 18, 6, '#F2FBFC', '#03262C', null);
}
function caption(lines, dir) {  // bottom caption box on the floor: 1–2 short lines
  const c = 7, lh = 7 * c + 18, h = lines.length * lh + 34, w = FW - 80, x = 40, y = FH - 60 - h;
  out.fillStyle = 'rgba(3,24,28,.94)'; out.beginPath(); out.roundRect(x, y, w, h, 16); out.fill();
  out.strokeStyle = dir > 0 ? C.lime : dir < 0 ? C.amber : '#39E0F0'; out.lineWidth = 4; out.stroke();
  lines.forEach((l, i) => drawText(out, l, FW / 2, y + 22 + i * lh, c, '#F2FBFC', { align: 'center' }));
}
function readout(hr, m) {
  const x = 18, y = 980, w = 166, h = 206, good = m.dir > 0 && hr < 84;
  out.fillStyle = 'rgba(3,30,35,.92)'; out.beginPath(); out.roundRect(x, y, w, h, 14); out.fill();
  out.strokeStyle = '#39E0F0'; out.lineWidth = 3; out.stroke();
  drawText(out, 'HR', x + 16, y + 16, 4, '#39E0F0');
  drawText(out, 'BPM', x + w - 16, y + 16, 4, 'rgba(57,224,240,.7)', { align: 'right' });
  drawText(out, hr, x + w / 2, y + 68, 10, good ? C.lime : '#F2FBFC', { align: 'center', shadow: '#03262C' });
  if (good) drawText(out, '-' + (84 - hr), x + w / 2, y + h - 50, 6, C.lime, { align: 'center' });
}

// ---------- world layer ----------
function callout(lb, dir, cam) {   // text layer: what is happening to one organ, with a leader line to it wherever the camera puts it
  const g = out, [cx, cy] = lb.at, [wx, wy] = at(cx - 15, cy), ox = wx * cam[0] + cam[1], oy = wy * cam[0] + cam[2];
  const col = dir < 0 ? C.amber : dir > 0 ? C.lime : '#39E0F0';
  const w = Math.max(textW(lb.organ, 3), ...lb.say.map(l => textW(l, 4))) + 28, h = 14 + 21 + 12 + lb.say.length * 38 - 10 + 14;
  const x = FW - w - 12, y = Math.round(Math.max(470, Math.min(1560 - h, oy - h / 2)));
  g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(ox, oy); g.lineTo(x - 18, y + h / 2); g.lineTo(x, y + h / 2); g.stroke();
  g.fillStyle = col; g.fillRect(ox - 6, oy - 6, 12, 12);
  g.fillStyle = 'rgba(3,24,28,.95)'; g.fillRect(x, y, w, h);
  g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(x, y, w, h);
  drawText(g, lb.organ, x + 14, y + 14, 3, 'rgba(57,224,240,.75)');
  lb.say.forEach((l, k) => drawText(g, l, x + 14, y + 14 + 21 + 12 + k * 38, 4, col));
}

// monitor mode: the scanner glass turns into a pixel chart; Bit stays faint behind it
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
    ctx.fillStyle = 'rgba(166,240,74,.5)';
    for (let yy = y + pc; yy < Bo; yy += cell) if (.28 > bayer(x / cell, yy / cell)) ctx.fillRect(x, yy, pc, cell);
    ctx.fillStyle = C.lime;
    const a = py == null ? y : Math.min(py, y), b = py == null ? y : Math.max(py, y);
    for (let yy = a; yy <= b; yy += pc) ctx.fillRect(x, yy, pc, pc);
    py = y;
    if (c === shown - 1 && rv < 1) { ctx.fillStyle = '#F2FBFC'; ctx.fillRect(x, y, pc, pc); }
  }
}

function props(list, t) {
  const step = Math.floor(t * 15) / 15;
  for (const p of list || []) {
    if (p === 'bang') {
      const [x, y] = at(7.5, 0); drawText(ctx, '!', x, y, 12, C.amber, { shadow: '#03262C' });
    } else if (p === 'sweat') {
      for (const [cx, ph] of [[-10.5, 0], [8, .5]]) {
        const k = ((step / 0.8 + ph) % 1), [x, y] = at(cx, 3 + k * 6);
        ctx.fillStyle = '#BFF4FF';
        for (const [c, r] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]]) ctx.fillRect(Math.round(x + c * 12), Math.round(y + r * 12), 12, 12);
      }
    } else if (p === 'zzz') {
      for (let i = 0; i < 3; i++) {
        const k = (step / 1.5 + i / 3) % 1, [x, y] = at(6.5 + k * 3, 1 - k * 5);
        drawText(ctx, 'Z', x, y, 5 + i * 2, k > .8 ? 'rgba(191,244,255,.4)' : '#BFF4FF');
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

// camera on the world layer only: slow push-in, punch-in on the chest, pull back
function camera(t) {
  const m4 = MS[4], m5 = MS[5], chestY = TOP + 25 * PX;
  let z = 1 + 0.04 * Math.min(1, t / m4.t0), fy = 1060;
  if (t >= m4.t0 + BAR) { const k = Math.min(1, (t - m4.t0 - BAR) / 0.12); z = 1.04 + 0.24 * k; fy = 1060 + (chestY - 1060) * k; }
  if (t >= m5.t0) { const k = Math.min(1, (t - m5.t0) / 1.2), e = 1 - Math.pow(1 - k, 3); z = 1.28 - 0.28 * e; fy = chestY + (1060 - chestY) * e; }
  return [z, CX, fy];
}

window.render = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1], lt = t - m.t0;
  const p = prev ? Math.min(1, lt / (BAR / 2)) : 1, ys = B.glassY0 + p * GH;
  ctx.drawImage(LAB, 0, 0);
  const dropNow = m.drop && lt >= 2 * BAR;
  const rim = (t % BEAT) < 0.12 && !dropNow ? '#C8FAFF' : '#39E0F0';
  const bit0 = st => drawBit(ctx, { x: CX, y: FOOT, px: PX, state: { ...st, seed: 3, sore: st.sore && Math.floor(t / BEAT) % 2 === 0 }, rim });
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
  if (p >= 1 && !m.chart) props(m.props, t);
  if (m.dir > 0 && !m.chart && p >= 1 && i >= 3) {
    const tw = Math.floor(t / BEAT);
    [[-9, 25], [9, 47], [-8, 52], [7, 3]].forEach(([dx, dy], k) => { if ((tw + k) % 3) sparkle(ctx, CX + dx * PX, TOP + dy * PX, 7); });
  }

  // world through the camera (+ setback shake)
  let [z, fx, fy] = camera(t), sx = 0, sy = 0;
  if (m.shake && lt < 2 * BEAT) { const k = Math.floor(t * 30); sx = ((k * 37) % 7) - 3; sy = ((k * 53) % 7) - 3; }
  const tx = Math.min(0, Math.max(FW - FW * z, FW / 2 - fx * z)), ty = Math.min(0, Math.max(FH - FH * z, FH / 2 - fy * z));
  out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = '#041417'; out.fillRect(0, 0, FW, FH);
  out.imageSmoothingEnabled = z > 1.001;
  out.setTransform(z, 0, 0, z, (z > 1.001 ? tx : 0) + sx, (z > 1.001 ? ty : 0) + sy);
  out.drawImage(F, 0, 0);
  out.setTransform(1, 0, 0, 1, 0, 0);

  // text layer: never moved by the camera
  let hr = (p >= .5 || !prev ? m : prev).hr;
  if (m.count && p >= .5) hr = Math.max(m.hr, prev.hr - Math.floor((lt - BAR / 2) / BEAT) * 2);
  readout(hr, m);
  if (m.label && p >= 1) callout(m.label, m.dir, [z, (z > 1.001 ? tx : 0) + sx, (z > 1.001 ? ty : 0) + sy]);
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
    tm.hook.slice(0, n).forEach((h, k) => T.push({ id: 'hook' + k, text: h, x0: 60, y0: TY + k * 120, x1: 1020, y1: TY + k * 120 + 110 }));
  } else {
    T.push({ id: 'title', text: tm.title, x0: 200, y0: TY, x1: 880, y1: TY + 150 });
    T.push({ id: 'sub', text: tm.sub, x0: 200, y0: TY + 170, x1: 880, y1: TY + 240 });
  }
  if (m.label && t - m.t0 >= BAR / 2) T.push({ id: 'callout', text: m.label.say.join(' '), x0: 740, y0: 470, x1: 1080, y1: 1560 });
  if (tm.cap) T.push({ id: 'cap', text: tm.cap.join(' '), x0: 40, y0: 1650, x1: 1040, y1: 1860 });
  return T;
};

LAB = buildLab();
window.render(0);
window.READY = true;
