// The lab and the scanner booth, pre-rendered once. Room = dithered; booth = smooth hi-res vector.
import { ditherField } from './pix.js';

export const FW = 1080, FH = 1920;
export const BOOTH = { x0: 200, x1: 880, capY: 470, glassY0: 550, glassY1: 1590, floorY: 1680, gx0: 250, gx1: 830 };
const ROOM = ['#041417', '#0A2A30', '#0F3A41', '#14505A'];

function band(v) { // v 0..3 → [colA, colB, k] across the room ramp
  v = Math.max(0, Math.min(2.999, v));
  const i = Math.floor(v);
  return [ROOM[i], ROOM[i + 1], v - i];
}

export function buildLab() {
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

  // ---- booth (smooth) ----
  const metal = (x0, y0, x1, y1, horiz) => {
    const gr = horiz ? g.createLinearGradient(x0, 0, x1, 0) : g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, '#D5E7EA'); gr.addColorStop(.45, '#9DB9BE'); gr.addColorStop(1, '#5D7C82'); return gr;
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
