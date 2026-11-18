// Pixel Scan — style frame / test page. Timeline in bars (120 BPM, 1 bar = 2 s).
import { drawText, textW } from './font.js';
import { bayer } from './pix.js';
import { drawBit, sparkle, C } from './bit.js';
import { buildLab, glassSheen, BOOTH, FW, FH } from './lab.js';

const BAR = 2;
const MS = [ // milestones: bars, title, subline, body state, readout
  { bars: 2, title: 'DAY 1', sub: '10K STEPS A DAY', s: { lung: .15, heart: .3, brain: .35, face: 'tired', toxins: 22 }, hr: 84, dir: 0 },
  { bars: 2, title: 'WEEK 2', sub: 'MORE ENERGY', s: { lung: .5, heart: .6, brain: .6, face: 'flat', toxins: 9 }, hr: 78, dir: 1 },
  { bars: 2, title: 'MONTH 3', sub: 'HEART STRONGER', s: { lung: 1, heart: 1, brain: 1, face: 'happy', toxins: 0 }, hr: 68, dir: 1 },
];
let acc = 0; for (const m of MS) { m.t0 = acc; acc += m.bars * BAR; }
window.DUR = acc;

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let LAB;

function titleBar(m, y) {
  const c = 13, w = textW(m.title, c) + 110, x = (FW - w) / 2;
  ctx.fillStyle = '#0B8EA0'; ctx.fillRect(Math.round(x), y, Math.round(w), 7 * c + 44);
  ctx.fillStyle = m.dir > 0 ? C.lime : '#39E0F0'; ctx.fillRect(Math.round(x), y + 7 * c + 44, Math.round(w), c);
  drawText(ctx, m.title, FW / 2, y + 22, c, '#F2FBFC', { align: 'center', shadow: '#03262C' });
  if (m.sub) {
    const c2 = 6, w2 = textW(m.sub, c2) + 36, y2 = y + 7 * c + 44 + c + 18;
    ctx.fillStyle = '#03262C'; ctx.fillRect(Math.round((FW - w2) / 2), y2, Math.round(w2), 7 * c2 + 24);
    drawText(ctx, m.sub, FW / 2, y2 + 12, c2, '#F2FBFC', { align: 'center' });
  }
}

function readout(m, prev) {
  const x = 34, y = 1000, w = 176, h = 214, col = m.dir > 0 ? C.lime : '#F2FBFC';
  ctx.fillStyle = 'rgba(3,30,35,.92)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = '#39E0F0'; ctx.lineWidth = 3; ctx.stroke();
  drawText(ctx, 'HR', x + 18, y + 18, 4, '#39E0F0');
  drawText(ctx, m.hr, x + w / 2, y + 72, 10, col, { align: 'center', shadow: '#03262C' });
  drawText(ctx, 'BPM', x + w - 18, y + 18, 4, 'rgba(57,224,240,.7)', { align: 'right' });
  if (prev && m.dir > 0) drawText(ctx, '-' + (prev.hr - m.hr), x + w / 2, y + h - 52, 6, C.lime, { align: 'center' });
}

window.render = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0));
  const m = MS[i], prev = MS[i - 1];
  const B = BOOTH, gh = B.glassY1 - B.glassY0;
  // scan sweep: first half-bar of every milestone after the first
  const p = prev ? Math.min(1, (t - m.t0) / (BAR / 2)) : 1;
  const ys = B.glassY0 + p * gh;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(LAB, 0, 0);
  // beat idle: one-cell squash on every beat (pixel layers step on twos)
  const tq = Math.floor(t * 15) / 15, beat = (tq % 0.5) / 0.5;
  const px = 22, bob = beat < 0.2 ? px : 0, footY = B.glassY1 - 10;
  const bit = st => drawBit(ctx, { x: (B.gx0 + B.gx1) / 2, y: footY + bob * 0, px, state: { ...st, seed: 3 } });
  ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, B.glassY0, B.gx1 - B.gx0, gh); ctx.clip();
  if (p < 1) {
    ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, ys, B.gx1 - B.gx0, B.glassY1 - ys); ctx.clip(); bit(prev.s); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, B.glassY0, B.gx1 - B.gx0, ys - B.glassY0); ctx.clip(); bit(m.s); ctx.restore();
    // dithered trail above the line
    const cell = 6;
    ctx.fillStyle = '#39E0F0';
    for (let y = ys - 120; y < ys; y += cell) for (let x = B.gx0; x < B.gx1; x += cell) {
      const k = Math.pow(1 - (ys - y) / 120, 2) * 0.55;
      if (k > bayer(x / cell, y / cell)) ctx.fillRect(x, Math.floor(y / cell) * cell, cell, cell);
    }
    const gl = ctx.createLinearGradient(0, ys - 30, 0, ys + 30);
    gl.addColorStop(0, 'rgba(57,224,240,0)'); gl.addColorStop(.5, 'rgba(57,224,240,.6)'); gl.addColorStop(1, 'rgba(57,224,240,0)');
    ctx.fillStyle = gl; ctx.fillRect(B.gx0, ys - 30, B.gx1 - B.gx0, 60);
    ctx.fillStyle = '#E9FDFF'; ctx.fillRect(B.gx0, ys - 2, B.gx1 - B.gx0, 4);
  } else bit(m.s);
  ctx.restore();
  // scan markers on the pillars
  if (p < 1) { ctx.fillStyle = '#39E0F0'; ctx.fillRect(B.x0 - 14, ys - 5, 34, 10); ctx.fillRect(B.x1 - 20, ys - 5, 34, 10); }
  glassSheen(ctx);
  // sparkles on healed parts once revealed
  if (m.dir > 0) {
    const sx = (B.gx0 + B.gx1) / 2, by = footY - 26 * px;
    for (const [dx, dy] of [[-9.5, 14], [10.5, 16], [-4, 6]]) {
      const y = by + dy * px; if (y < ys) sparkle(ctx, sx + dx * px, y, 6);
    }
  }
  titleBar(p >= 0.3 || !prev ? m : prev, 200);
  readout(p >= 0.5 || !prev ? m : prev, p >= 0.5 ? prev : MS[i - 2]);
};

window.TEXTS = (t) => {
  const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i];
  return [{ id: 'title', text: m.title, x0: 300, y0: 200, x1: 780, y1: 340 }, { id: 'sub', text: m.sub, x0: 300, y0: 360, x1: 780, y1: 420 }];
};

LAB = buildLab();
ctx.imageSmoothingEnabled = false;
window.render(0);
window.READY = true;
