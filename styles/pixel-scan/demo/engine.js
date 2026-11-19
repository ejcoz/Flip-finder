// Pixel Scan engine: a film is data (beats, readout, callouts, lens, chart); this draws it.
// 1080×1920, 120 BPM (1 bar = 2 s). Two layers: the world (lab, booth, body, props) goes through the camera;
// the text layer (hook, title, caption, callout, lens, readout) never moves and stays inside the platform safe area.
import { drawText, textW } from './font.js';
import { bayer } from './pix.js';
import { drawBit, sparkle, C } from './bit.js';
import { buildLab, glassSheen, BOOTH, FW, FH } from './lab.js';
import { drawAway } from './scenes.js';

export const BAR = 2, BEAT = 0.5;
// Reels / Shorts safe area for text and anything that must be read: clear of the top header, the right-hand buttons
// and the bottom caption/username band.
export const SAFE = { x0: 60, x1: 920, y0: 250, y1: 1480 };
const TW = (SAFE.x1 - 540) * 2 - 20;   // widest centred text block that keeps its right edge inside SAFE.x1

// BRAND: the account handle, burned in small on the booth's base plate (visible on downloads and reposts; the apps show the username anyway)
export function film({ MS, READ, BRAND = '@8bitbodyscan' }) {
  let acc = 0; for (const m of MS) { m.t0 = acc; acc += m.bars * BAR; m.t1 = acc; }
  window.DUR = acc;
  const PUNCH = MS.find(m => m.punch), FINAL = MS.find(m => m.final), FIRST = MS[0];
  const REWIND = FINAL.t1 - BAR;   // the last bar rewinds to the opening frame, so the film loops

  // ---------- sound / cue events (music.py reads them via events.json) ----------
  const EV = [];
  MS.forEach((m, i) => {
    EV.push({ t: m.t0, type: 'section', i, bars: m.bars, mood: m.mood, drop: !!m.drop, dir: m.dir, final: !!m.final });
    if (i > 0) EV.push({ t: m.t0, type: m.dir < 0 && MS[i - 1].dir >= 0 ? 'fall' : 'sweep' });
    if (m.coin) EV.push({ t: m.t0 + BAR + BEAT, type: 'coin' });
    if (m.final) { EV.push({ t: m.t0, type: 'confetti' }); EV.push({ t: REWIND, type: 'rewind' }); }
    if (m.chart) for (let k = 0; k < 10; k++) EV.push({ t: m.t0 + BAR / 2 + k * 0.25, type: 'tick', k: m.chart.down ? 9 - k : k });
    if (m.hook) EV.push({ t: m.t0 + BEAT, type: 'blip', k: 2 });
    if (m.hookX) EV.push({ t: m.t0 + 2 * BEAT, type: 'blip', k: 0 });
    if (m.cap) EV.push({ t: m.t0 + 0.3, type: 'cap' });
    if (m.lens) EV.push({ t: m.t0 + BAR / 2, type: 'lens' });
    if (m.away) { EV.push({ t: m.t0 + m.away.at, type: 'away' }); if (MS[i + 1]) EV.push({ t: m.t1, type: 'back' }); }
  });
  window.EV = EV;

  const cv = document.getElementById('c'), out = cv.getContext('2d');
  const F = document.createElement('canvas'); F.width = FW; F.height = FH;
  const ctx = F.getContext('2d');
  const AW = document.createElement('canvas'); AW.width = FW; AW.height = FH; const aw = AW.getContext('2d');
  // look variant: A = original; B = red hook word, gunmetal booth, spotlight + vignette, loud habit on frame 0; C = B + big bright heart
  // default look is E (the chosen one): B + big bright heart + a dimmer body outline. A–D are kept for comparisons (?v=A)
  const V = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('v')) || READ.variant || 'E';
  const LOUD = V !== 'A', BIG = 'CDE'.includes(V), DIM = 'DE'.includes(V), VAPE_AT_MOUTH = V === 'D';
  const LAB = buildLab({ dark: LOUD, spot: LOUD });
  const B = BOOTH, GH = B.glassY1 - B.glassY0, PX = 15, FOOT = B.glassY1 - 6, CX = (B.gx0 + B.gx1) / 2, TOP = FOOT - 62 * PX;
  const at = (cx, cy) => [CX + cx * PX, TOP + cy * PX];
  const TY = SAFE.y0;
  const dirCol = d => d > 0 ? C.lime : d < 0 ? C.amber : '#39E0F0';
  const fit = (s, c) => { while (c > 5 && textW(s, c) + 2 * Math.max(28, c * 4) > TW) c--; return c; };

  // ---------- text layer ----------
  function bar(text, cy, c, fg, bg, line) {
    c = fit(text, c);
    const w = textW(text, c) + 2 * Math.max(28, c * 4), h = 7 * c + 2 * Math.max(12, c * 1.7), x = Math.round((FW - w) / 2);
    out.fillStyle = bg; out.fillRect(x, cy, Math.round(w), Math.round(h));
    if (line) { out.fillStyle = line; out.fillRect(x, cy + Math.round(h), Math.round(w), c); }
    drawText(out, text, FW / 2, cy + (h - 7 * c) / 2, c, fg, { align: 'center', shadow: c >= 8 ? '#03262C' : null, bold: true });
    return cy + Math.round(h) + (line ? c : 0);
  }
  function hook(m, n) {         // lines 1–2 from the first frame; line 3 lands on beat 2
    const [[a, ca], [b, cb], [c3, cc]] = m.hook;
    let y = bar(a, TY, ca, '#F2FBFC', '#03262C', null) + 8;
    y = (LOUD ? bar(b, y, cb, '#FF5A5F', '#03262C', '#FF5A5F') : bar(b, y, cb, '#F2FBFC', '#0B8EA0', '#39E0F0')) + 14;
    if (n >= 3) bar(c3, y, cc, '#03262C', '#39E0F0', null);
  }
  function watermark() {   // fixed on the text layer: the camera, the scan sweeps and the loop never move it
    if (!BRAND) return;
    out.save(); out.globalAlpha = 0.72; drawText(out, BRAND, FW / 2, 1590, 4, '#A8D8E0', { align: 'center', shadow: '#03262C' }); out.restore();   // on the booth's base plate
  }
  function titleBar(m, k = 1) {   // title only when there is a caption; the subline shows only without one
    const c = fit(m.title, 13), w = textW(m.title, c) + 2 * Math.max(28, c * 4), x = Math.round((FW - w) / 2), h = 7 * c + 44;
    out.fillStyle = m.final ? C.lime : '#39E0F0'; out.fillRect(x, TY, Math.round(w), h);
    out.fillStyle = m.final ? '#03262C' : dirCol(m.dir); out.fillRect(x, TY + h, Math.round(w), c);
    drawText(out, m.title, FW / 2, TY + 22, c, '#03262C', { align: 'center', bold: true, count: Math.ceil(m.title.length * k) });
    if (m.sub && !m.cap) bar(m.sub, TY + h + c + 16, 6, '#F2FBFC', '#03262C', null);
    return TY + h + c;
  }
  function caption(lines, dir, y) {   // directly under the title, inside the safe area
    const c = 6, lh = 7 * c + 16, h = lines.length * lh + 26 - 16 + 16, w = Math.max(...lines.map(l => textW(l, c))) + 64, x = Math.round((FW - w) / 2);
    out.fillStyle = '#F2FBFC'; out.beginPath(); out.roundRect(x, y, w, h, 12); out.fill();
    out.strokeStyle = dirCol(dir); out.lineWidth = 7; out.stroke();
    lines.forEach((l, i) => drawText(out, l, FW / 2, y + 13 + i * lh, c, '#06222A', { align: 'center', bold: true }));
  }
  const RD = { x: 40, y: 1276, w: 176, h: 200 };
  function readout(v) {
    const { x, y, w, h } = RD, good = READ.better(v);
    out.fillStyle = 'rgba(3,30,35,.94)'; out.beginPath(); out.roundRect(x, y, w, h, 14); out.fill();
    out.strokeStyle = '#39E0F0'; out.lineWidth = 3; out.stroke();
    drawText(out, READ.label, x + w / 2, y + 16, 3, '#39E0F0', { align: 'center' });
    drawText(out, v + READ.suffix, x + w / 2, y + 66, 7, good ? C.lime : READ.startCol, { align: 'center', shadow: '#03262C' });
    drawText(out, READ.unit, x + w / 2, y + h - 36, 3, 'rgba(57,224,240,.75)', { align: 'center' });
    if (READ.bar) {
      out.fillStyle = 'rgba(57,224,240,.2)'; out.fillRect(x + 20, y + 132, w - 40, 12);
      out.fillStyle = good ? C.lime : READ.startCol; out.fillRect(x + 20, y + 132, Math.round((w - 40) * READ.bar(v) / 4) * 4, 12);
    }
  }
  function callout(lb, dir, cam) {   // left edge: what is happening to one organ; leader line to it through the camera
    const [cx, cy] = lb.at, [wx, wy] = at(cx - 15, cy), ox = wx * cam[0] + cam[1], oy = wy * cam[0] + cam[2], col = dirCol(dir);
    const w = Math.max(textW(lb.organ, 3), ...lb.say.map(l => textW(l, 4))) + 28, h = 14 + 21 + 12 + lb.say.length * 38 - 10 + 14;
    const x = SAFE.x0 - 20, y = Math.round(Math.max(600, Math.min(RD.y - 16 - h, oy - h / 2)));
    out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(ox, oy); out.lineTo(x + w + 18, y + h / 2); out.lineTo(x + w, y + h / 2); out.stroke();
    out.fillStyle = col; out.fillRect(ox - 6, oy - 6, 12, 12);
    out.fillStyle = 'rgba(3,24,28,.95)'; out.fillRect(x, y, w, h);
    out.strokeStyle = col; out.lineWidth = 3; out.strokeRect(x, y, w, h);
    drawText(out, lb.organ, x + 14, y + 14, 3, 'rgba(57,224,240,.75)');
    lb.say.forEach((l, k) => drawText(out, l, x + 14, y + 47 + k * 38, 4, col, { bold: true }));
  }
  const LENS = { cx: 222, cy: 760, r: 168 };
  function lens(L, k, cam, t) {   // left edge: grows out of the brain; receptor (or any) icons, the count is the story
    const [wx, wy] = at(-3, 4), ox = wx * cam[0] + cam[1], oy = wy * cam[0] + cam[2];
    const r = Math.round(LENS.r * k), { cx, cy } = LENS;
    if (r < 6) return;
    out.strokeStyle = L.col; out.lineWidth = 3; out.beginPath(); out.moveTo(ox, oy); out.lineTo(cx + r * .9, cy - r * .4); out.stroke();
    out.save(); out.beginPath(); out.arc(cx, cy, r, 0, Math.PI * 2); out.fillStyle = 'rgba(3,24,28,.97)'; out.fill(); out.clip();
    if (k > .9) {
      drawText(out, L.head, cx, cy - 128, 3, '#39E0F0', { align: 'center' });
      drawText(out, L.foot, cx, cy + 96, 4, L.col, { align: 'center' });
      out.fillStyle = 'rgba(57,224,240,.55)'; out.fillRect(cx - 140, cy + 70, 280, 7);
      const pulse = Math.floor(t / BEAT) % 2, slots = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) slots.push([cx - 128 + i * 46 + (j % 2) * 16, cy - 92 + j * 52]);
      const order = slots.map((s, i) => [Math.abs(Math.sin(i * 12.9898) * 43758.5) % 1, s]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
      out.fillStyle = L.col;
      order.slice(0, L.n).forEach(([x, y], i) => {
        const yy = y + ((i + pulse) % 2 ? 0 : -4);
        for (const [c, rr] of [[0, 0], [2, 0], [0, 1], [2, 1], [1, 2], [1, 3], [1, 4]]) out.fillRect(x + c * 7, yy + rr * 7, 7, 7);
      });
    }
    out.restore();
    out.strokeStyle = L.col; out.lineWidth = 6; out.beginPath(); out.arc(cx, cy, r, 0, Math.PI * 2); out.stroke();
    out.strokeStyle = 'rgba(255,255,255,.18)'; out.lineWidth = 3; out.beginPath(); out.arc(cx, cy, r - 10, Math.PI * 1.1, Math.PI * 1.45); out.stroke();
  }

  // ---------- world layer ----------
  function chart(ch, rv) {
    const cell = 6, L = B.gx0 + 60, R = B.gx1 - 44, T = B.glassY0 + 120, Bo = B.glassY1 - 150;
    ctx.fillStyle = 'rgba(3,24,28,.82)'; ctx.fillRect(B.gx0, B.glassY0, B.gx1 - B.gx0, GH);
    ctx.fillStyle = 'rgba(57,224,240,.35)';
    for (let y = Bo - 110; y > T; y -= 110) for (let x = L; x < R; x += cell * 3) ctx.fillRect(x, y, cell, cell);
    ctx.fillStyle = '#39E0F0'; ctx.fillRect(L - cell, T, cell, Bo - T + cell); ctx.fillRect(L - cell, Bo, R - L + cell, cell);
    drawText(ctx, ch.label, L, T - 60, 7, '#39E0F0');
    drawText(ctx, ch.x, R, Bo + 28, 6, '#39E0F0', { align: 'right' });
    const pc = 14, n = ch.pts.length - 1, cols = Math.floor((R - L) / pc), shown = Math.floor(cols * rv);
    const yAt = k => { const f = k * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return Bo - (ch.pts[i] * (1 - u) + ch.pts[i + 1] * u) * (Bo - T); };
    let py = null;
    for (let c = 0; c < shown; c++) {
      const x = L + c * pc, y = Math.round(yAt(c / (cols - 1)) / pc) * pc;
      const up = py != null && y < py, good = ch.down ? !up : up || py == null;   // ch.down: falling is good (an urge); else rising is good
      ctx.fillStyle = good ? 'rgba(166,240,74,.5)' : 'rgba(255,181,71,.45)';
      for (let yy = y + pc; yy < Bo; yy += cell) if (.28 > bayer(x / cell, yy / cell)) ctx.fillRect(x, yy, pc, cell);
      ctx.fillStyle = good ? C.lime : C.amber;
      const a = py == null ? y : Math.min(py, y), b = py == null ? y : Math.max(py, y);
      for (let yy = a; yy <= b; yy += pc) ctx.fillRect(x, yy, pc, pc);
      py = y;
      if (c === shown - 1 && rv < 1) { ctx.fillStyle = '#F2FBFC'; ctx.fillRect(x, y, pc, pc); }
    }
  }
  function props(list, lt) {
    const step = Math.floor(lt * 15) / 15;
    for (const p of list || []) {
      // held props sit in Bit's right hand (figure cell 12.7, 39) with pixel fingers wrapped over the grip
      const [hx, hy] = at(12.7, 39), c = 10;
      const fingers = (x0, y0, n, w) => { for (let f = 0; f < n; f++) { ctx.fillStyle = '#1597A8'; ctx.fillRect(x0, y0 + f * 14, w, 12); ctx.fillStyle = '#123D45'; ctx.fillRect(x0 + 3, y0 + f * 14 + 3, w - 6, 6); } };
      const cross = (x0, y0, w, h) => { ctx.fillStyle = '#FF5A5F'; for (let k = 0; k <= 12; k++) { const u = k / 12; ctx.fillRect(x0 + u * w - 7, y0 + u * h - 7, 14, 14); ctx.fillRect(x0 + (1 - u) * w - 7, y0 + u * h - 7, 14, 14); } };
      if (p === 'vapeX' || p === 'vape') {        // a pixel vape gripped upright in the fist
        const V = ['.kk.', '.kk.', 'wwww', 'wccw', 'wccw', 'wwww', 'wwww', 'wwww', 'wwww', 'wwww', 'wwww', 'wllw', 'wwww'];
        const pal = { k: '#03262C', w: '#BFD3D6', c: '#39E0F0', l: C.amber }, x0 = hx - 20, y0 = hy + 30 - V.length * c;
        V.forEach((row, r) => [...row].forEach((ch, cc) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x0 + cc * c, y0 + r * c, c, c); } }));
        fingers(hx - 26, hy - 14, 3, 52);
        if (p === 'vapeX' && lt >= 2 * BEAT) cross(x0 - 40, y0 - 10, 120, 150);
      } else if (p === 'drinkX' || p === 'drink') {   // a pixel mug of beer held by its handle, body outward
        const D = ['...wwww.', '..wwwwww', '..aaaaaa', 'kkaaaaaa', 'k.aaaaaa', 'k.aaaaaa', 'kkaaaaaa', '..aaaaaa', '..gggggg'];
        const pal = { w: '#F2FBFC', a: '#FFB547', k: '#BFD3D6', g: '#8FA7AB' }, x0 = hx - 10, y0 = hy - 45;
        D.forEach((row, r) => [...row].forEach((ch, cc) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x0 + cc * c, y0 + r * c, c, c); } }));
        fingers(hx - 18, hy - 16, 3, 30);
        if (p === 'drinkX' && lt >= 2 * BEAT) cross(x0 - 20, y0 - 10, 120, 110);
      } else if (p === 'sodaX' || p === 'soda') {   // a pixel soda can gripped in the fist
        const S2 = ['.kkkk.', 'kssssk', 'rrrrrr', 'rwwwrr', 'rrwwwr', 'rrrrrr', 'rwwwrr', 'rrwwwr', 'rrrrrr', 'kssssk'];
        const pal = { k: '#8FA7AB', s: '#D5E7EA', r: '#E5484D', w: '#F2FBFC' }, x0 = hx - 30, y0 = hy - 70;
        S2.forEach((row, r) => [...row].forEach((ch, cc) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x0 + cc * c, y0 + r * c, c, c); } }));
        fingers(hx - 34, hy - 14, 3, 68);
        if (p === 'sodaX' && lt >= 2 * BEAT) cross(x0 - 30, y0 - 10, 120, 120);
      } else if (p === 'bang') {
        const [x, y] = at(7, 0); drawText(ctx, '!', x, y, 12, C.amber, { shadow: '#03262C' });
      } else if (p === 'sweat') {
        for (const [cx, ph] of [[-10.5, 0], [8, .5]]) {
          const k = ((step / 0.8 + ph) % 1), [x, y] = at(cx, 3 + k * 6);
          ctx.fillStyle = '#BFF4FF';
          for (const [c, r] of [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]]) ctx.fillRect(Math.round(x + c * 11), Math.round(y + r * 11), 11, 11);
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
  function camera(t) {   // world only: slow push-in, punch-in on PUNCH bar 2, pull back to 1.0 before the rewind
    const fyRest = 1075, focus = PUNCH.focus === 'head' ? TOP + 8 * PX : TOP + 25 * PX;
    let z = 1 + 0.04 * Math.min(1, t / PUNCH.t0), fy = fyRest;
    if (t >= PUNCH.t0 + BAR) { const k = Math.min(1, (t - PUNCH.t0 - BAR) / 0.12); z = 1.04 + 0.28 * k; fy = fyRest + (focus - fyRest) * k; }
    if (t >= FINAL.t0) { const k = Math.min(1, (t - FINAL.t0) / 1.2), e = 1 - Math.pow(1 - k, 3); z = 1.32 - 0.32 * e; fy = focus + (fyRest - focus) * e; }
    return [z, CX, fy];
  }
  function readValue(m, lt, p) {
    const [a, b] = m.read;
    if (a === b || p < .5) return a;
    const steps = Math.floor((lt - BAR / 2) / BEAT) + 1;
    return READ.step(a, b, steps);
  }

  window.render = (t) => {
    t = Math.min(t, window.DUR - 1e-6);
    const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1], lt = t - m.t0;
    const p = prev ? Math.min(1, lt / (BAR / 2)) : 1;
    const rew = m.final && t >= REWIND ? Math.min(1, (t - REWIND) / (BAR / 2)) : 0;   // upward rewind sweep
    ctx.drawImage(LAB, 0, 0);
    const dropNow = m.drop && lt >= 2 * BAR;
    const rim = DIM ? ((t % BEAT) < 0.12 && !dropNow ? '#39E0F0' : '#1597A8') : ((t % BEAT) < 0.12 && !dropNow ? '#C8FAFF' : '#39E0F0');
    const bit0 = st => drawBit(ctx, { x: CX, y: FOOT, px: PX, rim, state: { ...st, seed: 5, sore: st.sore && Math.floor(t / BEAT) % 2 === 0,
      ...(LOUD ? { toxins: Math.round((st.toxins || 0) * 1.7), glow: true } : {}), ...(BIG ? { bigHeart: true, heart: Math.max(st.heart ?? 1, .85) } : {}) } });
    const scene = (mm, rv) => {
      if (!mm.chart) return bit0(mm.s);
      ctx.save(); ctx.globalAlpha = .3; bit0(mm.s); ctx.restore(); chart(mm.chart, rv);
    };
    const rv = Math.min(1, Math.floor(Math.max(0, lt - BAR / 2) / 0.25) * 0.25 / (m.bars * BAR - BAR / 2 - 0.5));
    const sweepLine = (ys, col, up) => {
      const cell = 6; ctx.fillStyle = col;
      for (let y = 0; y < 120; y += cell) for (let x = B.gx0; x < B.gx1; x += cell) {
        const k = Math.pow(1 - y / 120, 2) * 0.55, yy = up ? ys + y : ys - y;
        if (k > bayer(x / cell, yy / cell)) ctx.fillRect(x, Math.floor(yy / cell) * cell, cell, cell);
      }
      const gl = ctx.createLinearGradient(0, ys - 30, 0, ys + 30);
      gl.addColorStop(0, 'rgba(57,224,240,0)'); gl.addColorStop(.5, 'rgba(57,224,240,.6)'); gl.addColorStop(1, 'rgba(57,224,240,0)');
      ctx.fillStyle = gl; ctx.fillRect(B.gx0, ys - 30, B.gx1 - B.gx0, 60);
      ctx.fillStyle = '#E9FDFF'; ctx.fillRect(B.gx0, ys - 2, B.gx1 - B.gx0, 4);
    };
    const clipRect = (y0, y1, f) => { ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, y0, B.gx1 - B.gx0, y1 - y0); ctx.clip(); f(); ctx.restore(); };
    ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, B.glassY0, B.gx1 - B.gx0, GH); ctx.clip();
    if (rew > 0) {                       // the last bar: sweep up, back to the opening state (loops into frame 0)
      const ys = B.glassY1 - rew * GH;
      clipRect(ys, B.glassY1, () => scene(FIRST, 1));
      if (rew < 1) { clipRect(B.glassY0, ys, () => scene(m, 1)); sweepLine(ys, '#39E0F0', true); }
    } else if (p < 1) {
      const ys = B.glassY0 + p * GH;
      clipRect(ys, B.glassY1, () => scene(prev, 1));
      clipRect(B.glassY0, ys, () => scene(m, 0));
      sweepLine(ys, m.dir < 0 ? C.amber : '#39E0F0', false);
    } else scene(m, rv);
    ctx.restore();
    if ((p < 1 && !rew) || (rew > 0 && rew < 1)) {
      const ys = rew > 0 ? B.glassY1 - rew * GH : B.glassY0 + p * GH;
      ctx.fillStyle = '#39E0F0'; ctx.fillRect(B.x0 - 14, ys - 5, 34, 10); ctx.fillRect(B.x1 - 20, ys - 5, 34, 10);
    }
    glassSheen(ctx);
    if (rew >= 1) props(FIRST.props.map(q => q.endsWith('X') ? q.slice(0, -1) : q), 0);
    else if (p >= 1 && !m.chart && !rew) props(m.props, lt);
    if (m.dir > 0 && !m.chart && p >= 1 && !rew && m.sparkle) {
      const tw = Math.floor(t / BEAT);
      m.sparkle.forEach(([dx, dy], k) => { if ((tw + k) % 3) sparkle(ctx, CX + dx * PX, TOP + dy * PX, 7); });
    }

    let [z, fx, fy] = camera(t), sx = 0, sy = 0;
    if (m.shake && lt < 2 * BEAT) { const k = Math.floor(t * 30); sx = ((k * 37) % 7) - 3; sy = ((k * 53) % 7) - 3; }
    const tx = Math.min(0, Math.max(FW - FW * z, FW / 2 - fx * z)), ty = Math.min(0, Math.max(FH - FH * z, FH / 2 - fy * z));
    const cam = [z, (z > 1.001 ? tx : 0) + sx, (z > 1.001 ? ty : 0) + sy];
    out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = '#041417'; out.fillRect(0, 0, FW, FH);
    out.imageSmoothingEnabled = z > 1.001;
    out.setTransform(cam[0], 0, 0, cam[0], cam[1], cam[2]);
    out.drawImage(F, 0, 0);
    out.setTransform(1, 0, 0, 1, 0, 0);

    // away shots: the beat leaves the booth at m.away.at for the rest of the beat; full-screen scanline wipes in and out
    const WIPE = .35;
    const drawWipe = (ys, below) => {   // composite AW above (below=false) or below (below=true) the line at ys
      out.save(); out.beginPath(); below ? out.rect(0, ys, FW, FH - ys) : out.rect(0, 0, FW, ys); out.clip(); out.drawImage(AW, 0, 0); out.restore();
      out.fillStyle = 'rgba(57,224,240,.45)'; out.fillRect(0, ys - 22, FW, 44); out.fillStyle = '#E9FDFF'; out.fillRect(0, ys - 3, FW, 6);
    };
    let awayCover = 0;
    if (m.away && lt >= m.away.at && !rew) {
      const al = lt - m.away.at, dur = m.bars * BAR - m.away.at;
      drawAway(aw, m.away, al, dur, t);
      const k = Math.min(1, al / WIPE); awayCover = k;
      if (k < 1) drawWipe(k * FH, false); else out.drawImage(AW, 0, 0);
    } else if (prev && prev.away && lt < WIPE) {   // wipe back from the previous beat's away shot to the booth
      const dur = prev.bars * BAR - prev.away.at;
      drawAway(aw, prev.away, dur + lt, dur, t);
      const k = lt / WIPE; awayCover = 1 - k;
      drawWipe(k * FH, true);
    }

    // text layer (never moved by the camera, always inside SAFE)
    if (rew >= .6) {                     // back to the opening frame: hook lines 1–2, opening readout
      readout(FIRST.read[0]);
      hook(FIRST, 2);
      watermark();
      return;
    }
    if (awayCover < .5) {   // booth-only overlays
      readout(readValue(m, lt, p));
      if (m.label && p >= 1 && !rew) callout(m.label, m.dir, cam);
      if (m.lens && p >= 1) lens(m.lens, Math.min(1, (lt - BAR / 2) / 0.25), cam, t);
    }
    const tm = p >= 0.3 || !prev ? m : prev;
    if (tm.hook) hook(tm, tm === m ? Math.floor(lt / BEAT) + 2 : 3);
    else {
      const yb = titleBar(tm, m.final ? Math.min(1, lt / 0.6) : 1);
      if (tm.cap) caption(tm.cap, tm.dir, yb + 16);
    }
    if (m.final && !rew) confetti(out, lt);
    watermark();
  };

  window.TEXTS = (t) => {
    const i = Math.max(0, MS.findLastIndex(m => t >= m.t0)), m = MS[i], prev = MS[i - 1], T = [];
    const box = (id, text, y0, y1, extra = {}) => T.push({ id, text, x0: SAFE.x0, y0, x1: SAFE.x1, y1, ...extra });
    if (m.final && t >= REWIND + 0.6 * BAR / 2) {   // the loop's last second shows the opening hook again: it carries on at frame 0
      FIRST.hook.slice(0, 2).forEach(([h], k) => box('endhook' + k, h, TY + k * 110, TY + k * 110 + 160, { pass: true }));
      return T;
    }
    const tm = prev && t - m.t0 < 0.3 * BAR / 2 ? prev : m;
    if (tm.hook) {
      const n = tm === m ? Math.floor((t - m.t0) / BEAT) + 2 : 3;
      tm.hook.slice(0, Math.min(3, n)).forEach(([h], k) => box('hook' + k, h, TY + k * 110, TY + k * 110 + 160));
    } else {
      box('title', tm.title, TY, TY + 150);
      if (tm.cap) box('cap', tm.cap.join(' '), TY + 160, TY + 330);
      else if (tm.sub) box('sub', tm.sub, TY + 160, TY + 240);
    }
    if (m.label && t - m.t0 >= BAR / 2 && !(m.final && t >= REWIND)) T.push({ id: 'callout', text: m.label.say.join(' '), x0: 40, y0: 600, x1: 330, y1: 1260 });
    if (m.lens && t - m.t0 >= BAR / 2 + 0.25) T.push({ id: 'lens', text: m.lens.foot, x0: LENS.cx - LENS.r, y0: LENS.cy - LENS.r, x1: LENS.cx + LENS.r, y1: LENS.cy + LENS.r });
    return T;
  };

  window.render(0);
  window.READY = true;
}
