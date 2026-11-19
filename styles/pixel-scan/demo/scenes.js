// Pixel Scan "away" scenes: full-screen shots that leave the booth (organ dives, life scenes, full-screen charts).
// All pixel art on a cell grid; the engine wipes to and from them with a full-screen scanline.
import { drawText, textW } from './font.js';
import { bayer, ditherField } from './pix.js';
import { drawBit, C } from './bit.js';

const FW = 1080, FH = 1920;
const room = (g, a, b) => ditherField(g, 0, 0, FW, FH, (x, y) => [a, b, Math.min(.999, y / FH * .9 + .05)]);

// ---------- procedural pixel organs: unions of ellipses on a grid, top-lit, health fills bottom-up ----------
const ORGANS = {
  liver: { parts: [[-3, 0, 10, 6.5, -.15], [6.5, -1.5, 5.5, 4.2, .2]], cols: ['#F29A8E', '#E0675E', '#A9434A'] },
  heart: { parts: [[-4.2, -3, 5.4, 5.4, 0], [4.2, -3, 5.4, 5.4, 0], [0, 1.5, 7.5, 7.5, .785]], cols: ['#FFD0D2', '#FF5A5F', '#C23A46'] },
  brain: { parts: [[0, 0, 11, 7.5, 0]], cols: ['#FFC3D0', '#FF9BB0', '#D86A86'], folds: true },
  lungs: { parts: [[-6, 0, 5, 9.5, .08], [6, 0, 5, 9.5, -.08]], cols: ['#FFD6CE', '#F4A196', '#C7766C'] },
};
const GREY = ['#A9BBBE', '#6F8A8E', '#4E6569'];
function inside(o, x, y) {
  return o.parts.some(([cx, cy, rx, ry, rot]) => { const dx = x - cx, dy = y - cy, c = Math.cos(rot), s = Math.sin(rot), u = dx * c + dy * s, v = -dx * s + dy * c; return (u / rx) ** 2 + (v / ry) ** 2 <= 1; });
}
export function organBig(g, name, cx, cy, cell, health = 1) {
  const o = ORGANS[name], R = 13, cells = [];
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (inside(o, i + .5, j + .5)) cells.push([i, j]);
  const ys = cells.map(c => c[1]), top = Math.min(...ys), bot = Math.max(...ys), h = bot - top + 1;
  for (const [i, j] of cells) {
    const good = health > (1 - (j - top + .5) / h) * .92 + bayer(i, j) * .08, pal = good ? o.cols : GREY;
    const edge = !inside(o, i + 1.5, j + .5) || !inside(o, i - .5, j + .5) || !inside(o, i + .5, j + 1.5) || !inside(o, i + .5, j - .5);
    const f = (j - top) / h, tone = edge ? 2 : f < .25 && .6 > bayer(i, j) ? 0 : f > .7 && .5 > bayer(i + 1, j) ? 2 : 1;
    let col = pal[tone];
    if (o.folds && good && ((i * 3 + j * 5) % 7 === 0) && !edge) col = pal[2];
    g.fillStyle = col; g.fillRect(cx + i * cell, cy + j * cell, cell, cell);
  }
  return { top: cy + top * cell, bot: cy + (bot + 1) * cell };
}

// ---------- dive: the camera is inside the body; one organ fills the screen ----------
// o = { organ, health:[from,to], clear: number of particles cleared over the shot, gauge: [from,to] 0..1 (heart pressure) }
export function dive(g, o, lt, dur) {
  room(g, '#041417', '#0A2A30');
  g.strokeStyle = 'rgba(57,224,240,.08)'; g.lineWidth = 2;
  for (let x = 0; x < FW; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, FH); g.stroke(); }
  for (let y = 0; y < FH; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(FW, y); g.stroke(); }
  const k = Math.min(1, lt / Math.max(.5, dur - .4)), health = o.health[0] + (o.health[1] - o.health[0]) * k;
  const pulse = o.organ === 'heart' ? 1 + .04 * Math.max(0, Math.sin(lt * 7.5)) : 1;
  g.save(); g.translate(540, 1000); g.scale(pulse, pulse); g.translate(-540, -1000);
  const box = organBig(g, o.organ, 528, o.gauge ? 930 : 1000, o.organ === 'liver' ? 38 : 30, health);
  g.restore();
  // particles: amber specks leave the organ one after another
  const n = o.clear || 0;
  for (let i = 0; i < n; i++) {
    const ct = (i + .5) / n * Math.max(.6, dur - .6), a = (i * 2.399) % (Math.PI * 2), r0 = 60 + (i * 37) % 200;
    const away = Math.max(0, lt - ct), x = 540 + Math.cos(a) * (r0 + away * 900), y = 1000 + Math.sin(a) * (r0 * .6 + away * 900);
    if (away > .8) continue;
    g.globalAlpha = 1 - away / .8; g.fillStyle = '#FFD27A'; g.fillRect(Math.round(x / 12) * 12, Math.round(y / 12) * 12, 24, 24); g.globalAlpha = 1;
  }
  if (o.gauge) {
    const [a0, a1] = o.gauge, v = a0 + (a1 - a0) * k, cx = 540, cy = 1490, gr = 165;
    for (let s = 0; s < 12; s++) {
      const ang = Math.PI + s / 11 * Math.PI, col = s < 4 ? C.lime : s < 8 ? '#FFB547' : '#FF5A5F', on = s / 11 <= v + .001;
      g.fillStyle = on ? col : 'rgba(57,224,240,.15)'; g.fillRect(Math.round(cx + Math.cos(ang) * gr - 16), Math.round(cy + Math.sin(ang) * gr - 16), 32, 32);
    }
    drawText(g, 'PRESSURE', cx, cy - 60, 5, v < .4 ? C.lime : '#FFB547', { align: 'center', bold: true });
  } else drawText(g, o.organ.toUpperCase(), 540, box.bot + 40, 6, '#39E0F0', { align: 'center', bold: true });
}

// ---------- bed: 3 a.m., wide awake ----------
export function bed(g, lt, state) {
  room(g, '#070C1C', '#12204A');
  g.fillStyle = '#0B1530'; g.fillRect(120, 620, 360, 420); g.fillStyle = '#1A2B5C'; g.fillRect(132, 632, 336, 396);
  g.fillStyle = 'rgba(220,230,255,.85)'; for (const [x, y] of [[210, 700], [380, 760], [300, 900], [420, 680]]) g.fillRect(x, y, 10, 10);
  g.fillStyle = '#F2F5FF'; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 17 && !((i - 2) ** 2 + (j + 1) ** 2 <= 10)) g.fillRect(380 + i * 10, 730 + j * 10, 10, 10);
  g.fillStyle = '#2A3A6E'; g.fillRect(292, 632, 16, 396); g.fillRect(132, 822, 336, 16);
  // bed
  g.fillStyle = '#3A2A24'; g.fillRect(90, 1300, 840, 60); g.fillRect(90, 1150, 48, 330); g.fillRect(882, 1240, 48, 240);
  g.fillStyle = '#D5E7EA'; g.fillRect(138, 1240, 744, 70);
  g.fillStyle = '#F2FBFC'; g.fillRect(150, 1170, 200, 80);
  // Bit lying on its back, head on the pillow (rotated: feet to the right)
  g.save(); g.translate(170, 1225); g.rotate(-Math.PI / 2);
  drawBit(g, { x: 0, y: 62 * 13, px: 13, state });
  g.restore();
  g.fillStyle = '#3B5BA8'; g.fillRect(420, 1110, 480, 230); g.fillStyle = '#4C6EC0';
  for (let x = 420; x < 900; x += 48) g.fillRect(x, 1110, 24, 230);
  g.fillStyle = '#2E4A8E'; g.fillRect(420, 1110, 480, 18);
  // nightstand + clock
  g.fillStyle = '#4A3A30'; g.fillRect(700, 880, 280, 24); g.fillStyle = '#1B2238'; g.fillRect(740, 780, 200, 100);
  drawText(g, (Math.floor(lt * 2) % 2 ? '3:07' : '3 07'), 840, 806, 8, '#FF5A5F', { align: 'center', bold: true });
}

// ---------- phone: calling the doctor ----------
export function phone(g, lt) {
  room(g, '#041417', '#0F3A41');
  const ring = Math.floor(lt * 4) % 2;
  g.strokeStyle = '#39E0F0'; g.lineWidth = 12;
  for (let i = 0; i < 3; i++) if (ring || i < 2) { g.globalAlpha = .7 - i * .2; g.beginPath(); g.arc(540, 1000, 330 + i * 70, -0.6, 0.6); g.stroke(); g.beginPath(); g.arc(540, 1000, 330 + i * 70, Math.PI - .6, Math.PI + .6); g.stroke(); }
  g.globalAlpha = 1;
  g.save(); g.translate(540, 1000); g.rotate(ring ? .03 : -.03); g.translate(-540, -1000);
  g.fillStyle = '#1B2238'; g.fillRect(360, 640, 360, 720); g.fillStyle = '#0B8EA0'; g.fillRect(384, 690, 312, 600);
  g.fillStyle = '#F2FBFC'; g.fillRect(480, 760, 120, 120); g.fillStyle = '#FF5A5F'; g.fillRect(522, 776, 36, 88); g.fillRect(496, 802, 88, 36);
  drawText(g, 'DOCTOR', 540, 930, 8, '#F2FBFC', { align: 'center', bold: true });
  drawText(g, 'CALLING' + '...'.slice(0, 1 + Math.floor(lt * 3) % 3), 540, 1010, 4, '#D5F6FA', { align: 'center' });
  const pr = 1 + .12 * Math.max(0, Math.sin(lt * 8));
  g.fillStyle = C.lime; g.fillRect(540 - 48 * pr, 1150 - 48 * pr, 96 * pr, 96 * pr);
  g.restore();
}

// ---------- full-screen chart (the whole frame becomes the monitor) ----------
export function fullChart(g, ch, rv) {
  room(g, '#03161A', '#082A30');
  const cell = 6, L = 150, R = 940, T = 700, Bo = 1420;
  g.fillStyle = 'rgba(57,224,240,.35)';
  for (let y = Bo - 120; y > T; y -= 120) for (let x = L; x < R; x += cell * 3) g.fillRect(x, y, cell, cell);
  g.fillStyle = '#39E0F0'; g.fillRect(L - 12, T, 12, Bo - T + 12); g.fillRect(L - 12, Bo, R - L + 12, 12);
  drawText(g, ch.label, L, T - 90, 10, '#39E0F0', { bold: true });
  drawText(g, ch.x, R, Bo + 40, 7, '#39E0F0', { align: 'right', bold: true });
  const pc = 20, n = ch.pts.length - 1, cols = Math.floor((R - L) / pc), shown = Math.floor(cols * rv);
  const yAt = k => { const f = k * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return Bo - (ch.pts[i] * (1 - u) + ch.pts[i + 1] * u) * (Bo - T); };
  let py = null;
  for (let c = 0; c < shown; c++) {
    const x = L + c * pc, y = Math.round(yAt(c / (cols - 1)) / pc) * pc;
    const up = py != null && y < py, good = ch.down ? !up : up || py == null;
    g.fillStyle = good ? 'rgba(166,240,74,.5)' : 'rgba(255,181,71,.45)';
    for (let yy = y + pc; yy < Bo; yy += cell) if (.28 > bayer(x / cell, yy / cell)) g.fillRect(x, yy, pc, cell);
    g.fillStyle = good ? C.lime : '#FFB547';
    const a = py == null ? y : Math.min(py, y), b = py == null ? y : Math.max(py, y);
    for (let yy = a; yy <= b; yy += pc) g.fillRect(x, yy, pc, pc);
    py = y;
    if (c === shown - 1 && rv < 1) { g.fillStyle = '#F2FBFC'; g.fillRect(x, y, pc, pc); }
  }
}

export function drawAway(g, a, lt, dur, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#041417'; g.fillRect(0, 0, FW, FH);   // solid first: zoomed cells leave seams
  const z = 1 + .06 * Math.min(1, lt / Math.max(.5, dur));   // slow push on every away shot
  g.setTransform(z, 0, 0, z, 540 - 540 * z, 1000 - 1000 * z);
  if (a.kind === 'dive') dive(g, a, lt, dur);
  else if (a.kind === 'bed') bed(g, lt, a.state || { face: 'wide' });
  else if (a.kind === 'phone') phone(g, lt);
  else if (a.kind === 'chart') fullChart(g, a.chart, Math.min(1, Math.floor(Math.max(0, lt - .2) / .25) * .25 / Math.max(.5, dur - .6)));
  g.setTransform(1, 0, 0, 1, 0, 0);
}
