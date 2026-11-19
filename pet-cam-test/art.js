// Pet Cam art kit: soft flat vector (no outlines). Every function draws on the current context set with setCtx().
export const W = 1080, H = 1920;
export const SAFE = { x0: 60, x1: 920, y0: 250, y1: 1480 };
export const ACC = { good: '#3DDC97', bad: '#FF5C6C', ask: '#FFC94D', fact: '#5AB4FF' };
export const DOG = { coat: ['#FFF8EC', '#F1E4CF', '#CDB898'], patch: ['#A9714A', '#8A5A3B', '#61391F'], dark: '#2A2230' };
let g;
export const setCtx = c => { g = c; };

export function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
export function shade(y0, y1, [hi, base, sh]) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, hi); gr.addColorStop(.45, base); gr.addColorStop(1, sh); return gr;
}
export function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }

// ---------- scene: cool night (calm / curious) ----------
export function scene() {
  const sky = g.createLinearGradient(0, 0, 0, 1350);
  sky.addColorStop(0, '#0A1124'); sky.addColorStop(1, '#1B2C4E'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(220,230,255,.07)'; ell(150, 150, 64, 64); g.fill(); g.fillStyle = 'rgba(220,230,255,.15)'; ell(150, 150, 40, 40); g.fill();
  const R = rng(7);
  for (let i = 0; i < 9; i++) {
    const x = -60 + i * 150 + R() * 60, r = 120 + R() * 90, y = 1330 - R() * 60;
    g.fillStyle = i % 2 ? '#13281F' : '#102219'; ell(x, y, r, r * 1.05); g.fill();
  }
  const ground = g.createLinearGradient(0, 1330, 0, H);
  ground.addColorStop(0, '#1F4B2F'); ground.addColorStop(1, '#0C2014'); g.fillStyle = ground; g.fillRect(0, 1330, W, H - 1330);
  grass(1350, 1560, 140, '#2A6B3D', 3);
}
export function grass(y0, y1, n, col, seed, sway = 0) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = y0 + R() * (y1 - y0), h = 40 + R() * 90, lean = (R() - .5) * 40 + sway * Math.sin(i * 1.7) * 6, w = 5 + R() * 6;
    g.fillStyle = R() > .5 ? col : '#358A4C';
    g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x + lean * .3, y - h * .6, x + lean, y - h); g.quadraticCurveTo(x + lean * .3 + w * .4, y - h * .5, x + w, y); g.fill();
  }
}

// ---------- the dog: cream coat, brown ears, brown saddle, one brown eye patch, teal collar ----------
// sitting, three-quarter front view. o = { tilt, blink 0..1, perk 0..1 (lifts one ear), brow 0..1 (curious) }
export function dog(x, y, o = {}) {
  const { tilt = 0, blink = 0, perk = 0, brow = .5 } = o;
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.3)'; ell(30, 4, 220, 24); g.fill();
  g.fillStyle = shade(-60, 0, DOG.patch);
  g.beginPath(); g.moveTo(150, -30); g.bezierCurveTo(240, -20, 270, -60, 250, -110); g.bezierCurveTo(235, -70, 210, -45, 150, -55); g.closePath(); g.fill();
  g.fillStyle = shade(-260, 0, DOG.coat); ell(95, -110, 135, 115, -0.2); g.fill();
  g.save(); ell(95, -110, 135, 115, -0.2); g.clip(); g.fillStyle = shade(-240, -140, DOG.patch); ell(120, -230, 120, 70, -0.3); g.fill(); g.restore();
  g.fillStyle = shade(-30, 0, ['#F7EEDD', '#E8D9BF', '#CDB898']); ell(150, -10, 55, 16); g.fill();
  g.fillStyle = shade(-380, 0, DOG.coat);
  g.beginPath(); g.moveTo(-95, -40); g.bezierCurveTo(-125, -180, -110, -300, -60, -350); g.lineTo(70, -350); g.bezierCurveTo(115, -290, 120, -170, 95, -40); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.16)'; ell(-15, -270, 55, 60); g.fill();
  for (const lx of [-55, 45]) {
    g.fillStyle = shade(-200, 0, DOG.coat); g.beginPath(); g.roundRect(lx - 28, -190, 56, 188, 26); g.fill();
    g.fillStyle = '#FBF4E6'; ell(lx, -8, 36, 15); g.fill();
    g.strokeStyle = 'rgba(160,130,90,.45)'; g.lineWidth = 3; g.lineCap = 'round';
    for (const d of [-10, 10]) { g.beginPath(); g.moveTo(lx + d, -14); g.lineTo(lx + d, -4); g.stroke(); }
  }
  g.fillStyle = '#21B3A6'; g.beginPath(); g.roundRect(-78, -372, 156, 30, 14); g.fill();
  g.fillStyle = '#FFC94D'; ell(0, -330, 15, 15); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; ell(0, -326, 6, 6); g.fill();
  g.save(); g.translate(0, -470); g.rotate(tilt);
  const ear = (sx, up) => {
    g.save(); g.scale(sx, 1);
    g.fillStyle = shade(-90, 110, DOG.patch);
    g.beginPath();
    // blend every control point between the hanging ear (0) and the perked ear (1)
    const HANG = [-80, -75, -140, -95, -165, -20, -150, 50, -140, 100, -110, 110, -95, 70, -90, 20, -85, -30, -80, -75];
    const PERK = [-70, -80, -120, -150, -190, -120, -175, -50, -165, -10, -130, 10, -100, -10, -90, -40, -80, -60, -70, -80];
    const P = HANG.map((v, i) => v + (PERK[i] - v) * up);
    g.moveTo(P[0], P[1]);
    g.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]);
    g.bezierCurveTo(P[8], P[9], P[10], P[11], P[12], P[13]);
    g.bezierCurveTo(P[14], P[15], P[16], P[17], P[18], P[19]);
    g.fill(); g.restore();
  };
  ear(1, 0); ear(-1, perk);
  g.fillStyle = shade(-110, 100, DOG.coat); ell(0, 0, 112, 104); g.fill();
  g.save(); ell(0, 0, 112, 104); g.clip();
  g.fillStyle = shade(-80, 20, DOG.patch); ell(48, -22, 50, 44, 0.2); g.fill();
  g.restore();
  g.fillStyle = shade(10, 110, ['#FFFDF6', '#F6ECDA', '#DCCAAA']); ell(0, 52, 70, 50); g.fill();
  g.fillStyle = DOG.dark; g.beginPath(); g.moveTo(-26, 18); g.quadraticCurveTo(0, 8, 26, 18); g.quadraticCurveTo(20, 40, 0, 44); g.quadraticCurveTo(-20, 40, -26, 18); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(-9, 20, 7, 4); g.fill();
  g.strokeStyle = '#6E5444'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 44); g.lineTo(0, 60); g.quadraticCurveTo(-14, 74, -28, 64); g.moveTo(0, 60); g.quadraticCurveTo(14, 74, 28, 64); g.stroke();
  for (const ex of [-46, 46]) {
    const ry = 18 * (1 - blink * .9);
    g.fillStyle = DOG.dark; ell(ex, -18, 15, Math.max(2, ry)); g.fill();
    if (blink < .5) { g.fillStyle = '#FFFFFF'; ell(ex + 5, -25, 5.5, 5.5); g.fill(); }
  }
  g.strokeStyle = '#4A3226'; g.lineWidth = 5;
  const by = 8 * brow;
  g.beginPath(); g.moveTo(-64, -50 - by * .4); g.quadraticCurveTo(-46, -64 - by, -28, -54 - by * .6); g.stroke();
  g.beginPath(); g.moveTo(28, -46); g.quadraticCurveTo(46, -54, 64, -44); g.stroke();
  g.restore();
  g.restore();
}

// small dog-head icon for survey grids; long = long muzzle, tilt in radians
export function dogIcon(x, y, s, { long = true, tilt = 0, col = '#F1E4CF' } = {}) {
  g.save(); g.translate(x, y); g.rotate(tilt); g.scale(s, s);
  g.fillStyle = '#8A5A3B'; ell(-20, -6, 9, 16, 0.3); g.fill(); ell(20, -6, 9, 16, -0.3); g.fill();
  g.fillStyle = col; ell(0, 0, 18, 17); g.fill();
  if (long) { g.beginPath(); g.roundRect(-9, 4, 18, 18, 9); g.fill(); }
  else { ell(0, 9, 11, 7); g.fill(); }
  g.fillStyle = '#2A2230'; ell(-6, -3, 2.5, 3); g.fill(); ell(6, -3, 2.5, 3); g.fill(); ell(0, long ? 20 : 11, 4, 3); g.fill();
  g.restore();
}

// a cartoon owner face (for the dog's-eye view)
export function ownerFace(cx, cy, r) {
  g.save(); g.translate(cx, cy);
  g.fillStyle = '#3A2A24'; ell(0, -r * .35, r * 1.02, r * .85); g.fill();
  g.fillStyle = shade(-r, r, ['#FFD9C2', '#F2B99A', '#D9967A']); ell(0, 0, r * .86, r); g.fill();
  g.fillStyle = '#3A2A24'; g.beginPath(); g.ellipse(0, -r * .62, r * .9, r * .45, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#2A2230'; ell(-r * .32, -r * .08, r * .07, r * .09); g.fill(); ell(r * .32, -r * .08, r * .07, r * .09); g.fill();
  g.strokeStyle = '#8A4A3A'; g.lineWidth = r * .05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * .3, r * .42); g.quadraticCurveTo(0, r * .62, r * .3, r * .42); g.stroke();
  g.restore();
}

export function ball(x, y, r) {
  g.fillStyle = 'rgba(0,0,0,.3)'; ell(x, y + r * .95, r * 1.1, r * .22); g.fill();
  g.fillStyle = shade(y - r, y + r, ['#FF8A8A', '#E5484D', '#A8262C']); ell(x, y, r, r); g.fill();
  g.strokeStyle = '#FFF1E0'; g.lineWidth = r * .18; g.beginPath(); g.arc(x - r * .1, y + r * .1, r * .78, -1.2, 1.4); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; ell(x - r * .35, y - r * .4, r * .22, r * .14, -0.6); g.fill();
}

// ---------- CAM-feed card ----------
export function card(x, y, w, h, title, sub, cam, timer = 0) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 40; g.shadowOffsetY = 12;
  g.fillStyle = '#111A2E'; g.beginPath(); g.roundRect(x, y, w, h, 28); g.fill();
  g.restore();
  g.strokeStyle = 'rgba(120,150,210,.28)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, w, h, 28); g.stroke();
  g.textBaseline = 'top'; g.textAlign = 'left';
  g.fillStyle = '#F2F5FF'; g.font = 'italic 700 34px Inter'; g.fillText(title, x + 32, y + 26);
  g.fillStyle = '#8B95AD'; g.font = 'italic 400 25px Inter'; g.fillText(sub, x + 32, y + 68);
  g.fillStyle = '#9AA6C2'; g.font = '500 24px JetBrains Mono'; g.textAlign = 'right'; g.fillText(cam, x + w - 82, y + 32); g.textAlign = 'left';
  g.strokeStyle = '#C9D2E8'; g.lineWidth = 3; ell(x + w - 48, y + 46, 17, 17); g.stroke();
  const a = -Math.PI / 2 + timer * Math.PI * 2;
  g.beginPath(); g.moveTo(x + w - 48, y + 46); g.lineTo(x + w - 48 + Math.cos(a) * 12, y + 46 + Math.sin(a) * 12); g.stroke();
}
export function pill(text, cx, cy, col, size = 26) {
  g.font = `600 ${size}px JetBrains Mono`; const tw = g.measureText(text).width, w = tw + 40, h = size * 1.9;
  g.fillStyle = 'rgba(10,16,30,.9)'; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, 10); g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, cy + 1); g.textAlign = 'left'; g.textBaseline = 'top';
}
// x-ray of the same dog's head (front view, same tilt); wave = 0..1 phase of incoming sound; glow = 0..1 listening area
export function xrayHead(cx, cy, tilt, wave = 0, glowK = 1) {
  g.save(); g.translate(cx, cy); g.rotate(tilt);
  const glow = (f) => { g.save(); g.shadowColor = '#5AB4FF'; g.shadowBlur = 18; g.strokeStyle = '#9FD0FF'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; f(); g.restore(); };
  g.fillStyle = 'rgba(40,70,130,.35)'; ell(0, 0, 135, 125); g.fill();
  glow(() => {
    ell(0, 0, 135, 125); g.stroke();
    for (const sx of [1, -1]) { g.save(); g.scale(sx, 1); g.beginPath(); g.moveTo(-95, -88); g.bezierCurveTo(-165, -110, -195, -20, -178, 60); g.bezierCurveTo(-166, 118, -130, 128, -112, 82); g.stroke(); g.restore(); }
    ell(0, 62, 80, 56); g.stroke();
    ell(-54, -20, 22, 24); g.stroke(); ell(54, -20, 22, 24); g.stroke();
  });
  const br = g.createRadialGradient(0, -70, 10, 0, -60, 110);
  br.addColorStop(0, '#FFE3A3'); br.addColorStop(1, '#F2A65A');
  g.fillStyle = br; ell(0, -62, 92, 46); g.fill();
  g.strokeStyle = 'rgba(160,90,40,.55)'; g.lineWidth = 4;
  for (const [a, b] of [[-60, -70], [-25, -82], [10, -66], [42, -80]]) { g.beginPath(); g.moveTo(a, b + 10); g.quadraticCurveTo(a + 15, b - 12, a + 32, b + 6); g.stroke(); }
  g.globalAlpha = glowK;
  g.fillStyle = 'rgba(90,180,255,.35)'; ell(-40, -55, 34 + 8 * glowK, 22 + 5 * glowK); g.fill(); g.fillStyle = '#5AB4FF'; ell(-40, -55, 13, 9); g.fill();
  g.globalAlpha = 1;
  g.strokeStyle = '#5AB4FF'; g.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    const r = 40 + ((i + 1 - wave) % 3) * 36;
    g.globalAlpha = Math.max(0, 1 - (r - 40) / 110); g.beginPath(); g.arc(-180, 10, r, Math.PI * .72, Math.PI * 1.28); g.stroke();
  }
  g.globalAlpha = 1; g.restore();
}

// ---------- two-tier caption: lead words (grey), key phrase in a selection box, follow words (grey) ----------
// lead/key/follow are already cut to what has been spoken; pop = 0..1 box entrance
export function caption(lead, key, follow, kind, pop = 1) {
  const col = ACC[kind], cx = 540;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const fitFont = (txt, weight, size, max) => { do { g.font = `${weight} ${size}px Inter`; size -= 2; } while (g.measureText(txt).width > max && size > 20); };
  if (lead) { fitFont(lead, 400, 44, 760); g.fillStyle = '#A7B0C4'; g.fillText(lead, cx, 318); }
  if (key) {
    fitFont(key, 800, 84, 700);
    const tw = g.measureText(key).width, s = 0.9 + 0.1 * Math.min(1, pop) + Math.sin(Math.min(1, pop) * Math.PI) * .04;
    const bw = tw + 64, bh = 118, by = 344;
    g.save(); g.translate(cx, by + bh / 2); g.scale(s, s); g.translate(-cx, -(by + bh / 2));
    const bx = cx - bw / 2;
    g.fillStyle = 'rgba(10,16,30,.55)'; g.fillRect(bx, by, bw, bh);
    g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(bx, by, bw, bh);
    for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) { g.fillStyle = '#FFFFFF'; ell(hx, hy, 9, 9); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); }
    g.fillStyle = '#FFFFFF'; g.fillText(key, cx, by + 86);
    g.restore();
  }
  if (follow) { fitFont(follow, 400, 40, 760); g.fillStyle = '#A7B0C4'; g.fillText(follow, cx, 344 + 118 + 52); }
  g.textAlign = 'left'; g.textBaseline = 'top';
}
