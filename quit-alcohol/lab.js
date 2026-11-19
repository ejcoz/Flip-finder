// The lab and the scanner booth, pre-rendered once. Room = dithered; booth = smooth hi-res vector.
import { ditherField, bayer, CELL } from './pix.js';

export const FW = 1080, FH = 1920;
// Booth sits inside the Reels/Shorts safe area; only the base and feet reach the bottom UI band (nothing there needs reading)
export const BOOTH = { x0: 200, x1: 880, capY: 510, glassY0: 590, glassY1: 1560, floorY: 1650, gx0: 250, gx1: 830 };
const ROOM = ['#041417', '#0A2A30', '#0F3A41', '#14505A'];

function band(v) { // v 0..3 → [colA, colB, k] across the room ramp
  v = Math.max(0, Math.min(2.999, v));
  const i = Math.floor(v);
  return [ROOM[i], ROOM[i + 1], v - i];
}

export function buildLab(o = {}) {
  const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  const g = cv.getContext('2d');
  const B = BOOTH, cx = (B.x0 + B.x1) / 2, cy = (B.glassY0 + B.glassY1) / 2;
  // back wall: vertical ramp + a halo around the booth, all ordered dither
  ditherField(g, 0, 0, FW, B.floorY, (x, y) => {
    const halo = Math.max(0, 1 - Math.hypot((x - cx) * 0.85, (y - cy) * 0.6) / 620);
    return band(0.15 + (y / B.floorY) * 1.15 + halo * halo * 1.5);
  });
  // wall panel seams (hi-res hairlines)
  g.strokeStyle = 'rgba(57,224,240,.07)'; g.lineWidth = 2;
  for (let x = 90; x < FW; x += 180) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, B.floorY); g.stroke(); }
  // floor: darker toward the viewer, perspective tile lines
  ditherField(g, 0, B.floorY, FW, FH - B.floorY, (x, y) => {
    const halo = Math.max(0, 1 - Math.hypot((x - cx) * 0.6, (y - B.floorY) * 1.4) / 520);
    return band(1.6 - ((y - B.floorY) / (FH - B.floorY)) * 1.5 + halo * 0.8);
  });
  g.strokeStyle = 'rgba(57,224,240,.08)'; g.lineWidth = 2;
  for (let k = 1; k < 9; k++) { const y = B.floorY + Math.pow(k / 8, 1.8) * (FH - B.floorY); g.beginPath(); g.moveTo(0, y); g.lineTo(FW, y); g.stroke(); }
  for (let k = -8; k <= 8; k++) { g.beginPath(); g.moveTo(cx + k * 60, B.floorY); g.lineTo(cx + k * 260, FH); g.stroke(); }
  g.fillStyle = 'rgba(57,224,240,.25)'; g.fillRect(0, B.floorY - 2, FW, 3);

  if (o.spot) {   // a dithered spotlight cone from the ceiling onto the booth, and a dark vignette at the frame edges
    for (let y = 0; y < FH; y += CELL) for (let x = 0; x < FW; x += CELL) {
      const hw = 150 + (y / B.floorY) * 330, dx = Math.abs(x + CELL / 2 - cx);
      let k = y < B.floorY + 60 && dx < hw ? 0.5 * Math.pow(1 - dx / hw, 1.4) * (0.55 + 0.45 * y / B.floorY) : 0;
      const pool = Math.max(0, 1 - Math.hypot((x - cx) / 430, (y - B.floorY - 30) / 70)); k = Math.max(k, pool * 0.6);
      if (k > bayer(x / CELL, y / CELL)) { g.fillStyle = '#1D6E78'; g.fillRect(x, y, CELL, CELL); continue; }
      const d = Math.hypot((x - cx) / (FW * 0.62), (y - 1000) / (FH * 0.6)), v = Math.min(1, Math.max(0, (d - 0.55) / 0.45));
      if (v * 0.9 > bayer(x / CELL + 2, y / CELL + 1)) { g.fillStyle = '#01080A'; g.fillRect(x, y, CELL, CELL); }
    }
  }
  // ---- booth (smooth) ----
  const metal = (x0, y0, x1, y1, horiz) => {
    const gr = horiz ? g.createLinearGradient(x0, 0, x1, 0) : g.createLinearGradient(0, y0, 0, y1);
    const M = o.dark ? ['#8FA4A8', '#4C6166', '#25363A'] : ['#D5E7EA', '#9DB9BE', '#5D7C82'];
    gr.addColorStop(0, M[0]); gr.addColorStop(.45, M[1]); gr.addColorStop(1, M[2]); return gr;
  };
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  // floor shadow
  const sh = g.createRadialGradient(cx, B.floorY + 6, 10, cx, B.floorY + 6, 420);
  sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(cx, B.floorY + 8, 420, 46, 0, 0, Math.PI * 2); g.fill();
  // glass
  rr(B.gx0, B.glassY0, B.gx1 - B.gx0, B.glassY1 - B.glassY0, 6);
  const gl = g.createLinearGradient(0, B.glassY0, 0, B.glassY1);
  gl.addColorStop(0, 'rgba(20,90,100,.95)'); gl.addColorStop(.25, 'rgba(6,40,46,.96)'); gl.addColorStop(1, 'rgba(4,28,33,.97)');
  g.fillStyle = gl; g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(57,224,240,.08)'; g.lineWidth = 1.5;
  for (let x = B.gx0; x < B.gx1; x += 26) { g.beginPath(); g.moveTo(x, B.glassY0); g.lineTo(x, B.glassY1); g.stroke(); }
  for (let y = B.glassY0; y < B.glassY1; y += 26) { g.beginPath(); g.moveTo(B.gx0, y); g.lineTo(B.gx1, y); g.stroke(); }
  g.restore();
  // pillars
  for (const [x0, x1] of [[B.x0, B.gx0], [B.gx1, B.x1]]) {
    rr(x0, B.capY + 40, x1 - x0, B.glassY1 - B.capY, 14); g.fillStyle = metal(x0, 0, x1, 0, true); g.fill();
    g.strokeStyle = 'rgba(57,224,240,.55)'; g.lineWidth = 2;
    const tickX = x0 === B.x0 ? x1 - 4 : x0 + 4, dir = x0 === B.x0 ? -1 : 1;
    for (let y = B.glassY0 + 20; y < B.glassY1; y += 38) {
      const long = Math.round((y - B.glassY0 - 20) / 38) % 5 === 0;
      g.beginPath(); g.moveTo(tickX, y); g.lineTo(tickX + dir * (long ? 22 : 11), y); g.stroke();
    }
  }
  // cap with its light strip
  rr(B.x0 - 20, B.capY, B.x1 - B.x0 + 40, B.glassY0 - B.capY, 30); g.fillStyle = metal(0, B.capY, 0, B.glassY0); g.fill();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(B.x0 + 10, B.capY + 8, B.x1 - B.x0 - 20, 3);
  const strip = g.createLinearGradient(0, B.glassY0 - 14, 0, B.glassY0 + 70);
  strip.addColorStop(0, '#39E0F0'); strip.addColorStop(.18, 'rgba(57,224,240,.55)'); strip.addColorStop(1, 'rgba(57,224,240,0)');
  g.fillStyle = strip; g.fillRect(B.gx0, B.glassY0 - 12, B.gx1 - B.gx0, 82);
  // base platform
  rr(B.x0 - 20, B.glassY1 - 6, B.x1 - B.x0 + 40, B.floorY - B.glassY1 + 6, 18); g.fillStyle = metal(0, B.glassY1, 0, B.floorY); g.fill();
  g.fillStyle = '#39E0F0'; g.fillRect(B.gx0, B.glassY1 + 8, B.gx1 - B.gx0, 4);
  g.fillStyle = 'rgba(57,224,240,.25)'; g.fillRect(B.gx0 - 10, B.glassY1 + 4, B.gx1 - B.gx0 + 20, 12);
  return cv;
}

// glass reflection, drawn above the mascot
export function glassSheen(ctx) {
  const B = BOOTH;
  ctx.save(); ctx.beginPath(); ctx.rect(B.gx0, B.glassY0, B.gx1 - B.gx0, B.glassY1 - B.glassY0); ctx.clip();
  const gr = ctx.createLinearGradient(B.gx0, B.glassY0, B.gx0 + 260, B.glassY0 + 400);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.07)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr; ctx.beginPath();
  ctx.moveTo(B.gx0 + 60, B.glassY0); ctx.lineTo(B.gx0 + 170, B.glassY0); ctx.lineTo(B.gx0 - 60, B.glassY1); ctx.lineTo(B.gx0 - 170, B.glassY1); ctx.fill();
  ctx.restore();
}
