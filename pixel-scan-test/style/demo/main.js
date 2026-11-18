// Pixel Scan demo: "10K steps a day". One timeline in bars (120 BPM, 1 bar = 2 s) drives picture, sound events and the score.
import { drawText, textW } from './font.js';
import { bayer } from './pix.js';
import { drawBit, sparkle, C } from './bit.js';
import { buildLab, glassSheen, BOOTH, FW, FH } from './lab.js';

const BAR = 2, BEAT = 0.5;
const HEALTHY = { lung: 1, heart: 1, brain: 1, liver: 1, stomach: 1, muscle: 1, toxins: 0 };
// mood drives the score: groove | stripped | triumph ; dir: 1 better, -1 setback, 0 neutral
const MS = [
  { bars: 2, title: 'DAY 1', sub: '10K STEPS A DAY', mood: 'groove', dir: 0, hr: 84, props: ['bang'],
    s: { lung: .25, heart: .3, brain: .3, liver: .45, stomach: .5, muscle: .1, face: 'tired', toxins: 16 } },
  { bars: 2, title: 'WEEK 1', sub: 'SORE LEGS', mood: 'stripped', dir: -1, hr: 84, props: ['sweat'], shake: true,
    s: { lung: .3, heart: .35, brain: .35, liver: .5, stomach: .55, muscle: .1, face: 'wide', toxins: 13, sore: true } },
  { bars: 2, title: 'WEEKS 2-8', sub: 'ENERGY BUILDS', mood: 'groove', dir: 1, hr: 80,
    chart: { label: 'ENERGY', x: 'WEEKS', pts: [.1, .16, .13, .28, .36, .31, .5, .6, .56, .76, .9] },
    s: { lung: .5, heart: .55, brain: .5, liver: .7, stomach: .75, muscle: .5, face: 'flat', toxins: 7 } },
  { bars: 2, title: 'MONTH 2', sub: 'SLEEP DEEPER', mood: 'groove', dir: 1, hr: 76, props: ['zzz'],
    s: { lung: .7, heart: .7, brain: 1, liver: .85, stomach: .9, muscle: .8, face: 'shut', toxins: 3 } },
  { bars: 3, title: 'MONTH 3', sub: 'HEART STRONGER', mood: 'groove', drop: true, dir: 1, hr: 68, count: true,
    s: { ...HEALTHY, face: 'happy' } },
  { bars: 3, title: 'LEVEL UP!', sub: 'KEEP WALKING', mood: 'triumph', dir: 1, hr: 68, final: true,
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
});
window.EV = EV;

const cv = document.getElementById('c'), ctx0 = cv.getContext('2d');
const F = document.createElement('canvas'); F.width = FW; F.height = FH;
const ctx = F.getContext('2d');
let LAB;
const B = BOOTH, GH = B.glassY1 - B.glassY0, PX = 12, FOOT = B.glassY1 - 4, CX = (B.gx0 + B.gx1) / 2, TOP = FOOT - 62 * PX;
const at = (cx, cy) => [CX + cx * PX, TOP + cy * PX];   // figure cell offset from centre → frame

function titleBar(m, y, k = 1) {
  const c = 13, w = textW(m.title, c) + 110, x = (FW - w) / 2;
  const bar = m.final ? '#03262C' : '#0B8EA0', line = m.dir > 0 ? C.lime : m.dir < 0 ? C.amber : '#39E0F0';
  ctx.fillStyle = bar; ctx.fillRect(Math.round(x), y, Math.round(w), 7 * c + 44);
  ctx.fillStyle = line; ctx.fillRect(Math.round(x), y + 7 * c + 44, Math.round(w), c);
  drawText(ctx, m.title, FW / 2, y + 22, c, m.final ? C.lime : '#F2FBFC', { align: 'center', shadow: '#03262C', count: Math.ceil(m.title.length * k) });
  if (m.sub) {
    const c2 = 6, w2 = textW(m.sub, c2) + 36, y2 = y + 7 * c + 44 + c + 18;
    ctx.fillStyle = '#03262C'; ctx.fillRect(Math.round((FW - w2) / 2), y2, Math.round(w2), 7 * c2 + 24);
    drawText(ctx, m.sub, FW / 2, y2 + 12, c2, '#F2FBFC', { align: 'center' });
  }
}

function readout(hr, m) {
  const x = 34, y = 1000, w = 176, h = 214, good = m.dir > 0 && hr < 84;
  ctx.fillStyle = 'rgba(3,30,35,.92)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = '#39E0F0'; ctx.lineWidth = 3; ctx.stroke();
  drawText(ctx, 'HR', x + 18, y + 18, 4, '#39E0F0');
  drawText(ctx, 'BPM', x + w - 18, y + 18, 4, 'rgba(57,224,240,.7)', { align: 'right' });
  drawText(ctx, hr, x + w / 2, y + 72, 10, good ? C.lime : '#F2FBFC', { align: 'center', shadow: '#03262C' });
  if (good) drawText(ctx, '-' + (84 - hr), x + w / 2, y + h - 52, 6, C.lime, { align: 'center' });
}

// monitor mode: the scanner glass turns into a pixel chart; Bit stays faint behind it
function chart(ch, rv) {
  const cell = 6, L = B.gx0 + 56, R = B.gx1 - 40, T = B.glassY0 + 110, Bo = B.glassY1 - 150;
  ctx.fillStyle = 'rgba(3,24,28,.82)'; ctx.fillRect(B.gx0, B.glassY0, B.gx1 - B.gx0, GH);
  ctx.fillStyle = 'rgba(57,224,240,.35)';
  for (let y = Bo - 90; y > T; y -= 90) for (let x = L; x < R; x += cell * 3) ctx.fillRect(x, y, cell, cell);
  ctx.fillStyle = '#39E0F0'; ctx.fillRect(L - cell, T, cell, Bo - T + cell); ctx.fillRect(L - cell, Bo, R - L + cell, cell);
  drawText(ctx, ch.label, L, T - 58, 6, '#39E0F0');
  drawText(ctx, ch.x, R, Bo + 28, 5, '#39E0F0', { align: 'right' });
  const pc = 12, n = ch.pts.length - 1, cols = Math.floor((R - L) / pc), shown = Math.floor(cols * rv);
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

// status props on the figure's grid
function props(list, t) {
  const step = Math.floor(t * 15) / 15;
  for (const p of list || []) {
    if (p === 'bang') {
      const [x, y] = at(8, 0); drawText(ctx, '!', x, y, 10, C.amber, { shadow: '#03262C' });
    } else if (p === 'sweat') {
      for (const [cx, ph] of [[-11, 0], [8.5, .5]]) {
        const k = ((step / 0.8 + ph) % 1), [x, y] = at(cx, 3 + k * 6);
        ctx.fillStyle = '#BFF4FF';
        for (const [c, r] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]]) ctx.fillRect(Math.round(x + c * 10), Math.round(y + r * 10), 10, 10);
      }
    } else if (p === 'zzz') {
      for (let i = 0; i < 3; i++) {
        const k = (step / 1.5 + i / 3) % 1, [x, y] = at(7 + k * 4, 2 - k * 8);
        drawText(ctx, 'Z', x, y, 4 + i * 2, k > .8 ? 'rgba(191,244,255,.4)' : '#BFF4FF');
      }
    }
  }
}

function confetti(t) {
  const step = Math.floor(t * 15) / 15, cols = ['#A6F04A', '#39E0F0', '#FF7A6B', '#F2FBFC', '#FFB0A3'];
  for (let i = 0; i < 70; i++) {
    const h1 = Math.abs(Math.sin(i * 91.7) * 43758.5 % 1), h2 = Math.abs(Math.sin(i * 17.3) * 12731.1 % 1);
    const x = h1 * FW, y = -40 - h2 * 700 + step * (260 + h1 * 220);
    if (y < -10 || y > FH) continue;
    ctx.fillStyle = cols[i % 5];
    const s = i % 3 ? 8 : 12; ctx.fillRect(Math.round((x + Math.sin(step * 3 + i) * 24) / 4) * 4, Math.round(y / 4) * 4, s, s);
  }
}

// camera: zoom and focus, smooth every frame; the frame never shows past its edges
function camera(t) {
  const m4 = MS[4], m5 = MS[5];
  let z = 1 + 0.04 * Math.min(1, t / m4.t0), fy = 1000;
  if (t >= m4.t0 + BAR) { const k = Math.min(1, (t - m4.t0 - BAR) / 0.12); z = 1.04 + 0.16 * k; fy = 1000 - 40 * k; }  // punch-in on the chest
  if (t >= m5.t0) { const k = Math.min(1, (t - m5.t0) / 1.2), e = 1 - Math.pow(1 - k, 3); z = 1.2 - 0.2 * e; fy = 960 + (1 - e) * 0; } // pull back
  return [z, t >= m4.t0 + BAR && t < m5.t0 + 1.2 ? CX - 75 * Math.min(1, z - 1.04 > 0 ? (z - 1.04) / .16 : 0) : CX, fy];
}

window.render = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1], lt = t - m.t0;
  const p = prev ? Math.min(1, lt / (BAR / 2)) : 1, ys = B.glassY0 + p * GH;
  ctx.drawImage(LAB, 0, 0);
  const dropNow = m.drop && lt >= 2 * BAR;
  const rim = (t % BEAT) < 0.12 && !dropNow ? '#C8FAFF' : '#39E0F0';        // the rim breathes on every beat
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
    [[-9, 25], [9, 47], [-8, 52], [7, 3]].forEach(([dx, dy], k) => { if ((tw + k) % 3) sparkle(ctx, CX + dx * PX, TOP + dy * PX, 6); });
  }
  let hr = (p >= .5 || !prev ? m : prev).hr;
  if (m.count && p >= .5) hr = Math.max(m.hr, prev.hr - Math.floor((lt - BAR / 2) / BEAT) * 2);  // counts down on beats
  readout(hr, m);
  titleBar(p >= 0.3 || !prev ? m : prev, 200, m.final ? Math.min(1, lt / 0.6) : 1);
  if (m.final) confetti(lt);

  let [z, fx, fy] = camera(t), sx = 0, sy = 0;
  if (m.shake && lt < 2 * BEAT) { const k = Math.floor(t * 30); sx = ((k * 37) % 7) - 3; sy = ((k * 53) % 7) - 3; }
  const tx = Math.min(0, Math.max(FW - FW * z, FW / 2 - fx * z)) + sx, ty = Math.min(0, Math.max(FH - FH * z, FH / 2 - fy * z)) + sy;
  ctx0.setTransform(1, 0, 0, 1, 0, 0); ctx0.fillStyle = '#041417'; ctx0.fillRect(0, 0, FW, FH);
  ctx0.imageSmoothingEnabled = z > 1.001;
  ctx0.setTransform(z, 0, 0, z, z > 1.001 ? tx : sx, z > 1.001 ? ty : sy);
  ctx0.drawImage(F, 0, 0);
};

window.TEXTS = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1];
  const tm = prev && t - m.t0 < 0.3 * BAR / 2 ? prev : m;
  return [{ id: 'title', text: tm.title, x0: 230, y0: 200, x1: 850, y1: 340 }, { id: 'sub', text: tm.sub, x0: 230, y0: 360, x1: 850, y1: 420 }];
};

LAB = buildLab();
window.render(0);
window.READY = true;
