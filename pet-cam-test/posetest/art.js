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

// ---------- dogs: one rig, several breeds ----------
// the star: cream coat, brown ears, brown saddle, one brown eye patch, teal collar. Others for lineups and split screens.
export const BREEDS = {
  cream: { coat: DOG.coat, patch: DOG.patch, ear: DOG.patch, saddle: true, eyePatch: true, collar: '#21B3A6', head: [112, 104], muzzle: [0, 52, 70, 50], muzzleCol: ['#FFFDF6', '#F6ECDA', '#DCCAAA'], nose: 18, slim: 1, mask: null, earLen: 1 },
  hound: { coat: ['#EDEAF2', '#C9C5D3', '#9C97AA'], patch: ['#8E8A9C', '#6E6A7E', '#4E4A5C'], ear: ['#8E8A9C', '#6E6A7E', '#4E4A5C'], saddle: true, eyePatch: false, collar: '#E5484D', head: [90, 112], muzzle: [0, 74, 46, 66], muzzleCol: ['#F7F5FA', '#E4E1EA', '#BDB8C8'], nose: 44, slim: .86, mask: null, earLen: 1.25 },
  pug: { coat: ['#F6DDB0', '#E2BE82', '#B8925A'], patch: ['#E2BE82', '#C9A06A', '#9A7444'], ear: ['#3A3038', '#2A2230', '#1A141E'], saddle: false, eyePatch: false, collar: '#FFC94D', head: [116, 100], muzzle: [0, 34, 64, 34], muzzleCol: ['#4A3E46', '#2E252E', '#1A141E'], nose: 10, slim: 1.08, mask: true, earLen: .55 },
  black: { coat: ['#5A6076', '#2A2B34', '#15151B'], patch: ['#5A6076', '#2A2B34', '#15151B'], ear: ['#4A4F63', '#24252E', '#111117'], saddle: false, eyePatch: false, collar: '#3DDC97', head: [104, 104], muzzle: [0, 54, 62, 48], muzzleCol: ['#6A7086', '#3A3C48', '#24252E'], nose: 22, slim: .95, mask: null, earLen: 1 },
};
// sitting, three-quarter front view. o = { breed, tilt, blink 0..1, perk 0..1, brow 0..1, wag (radians), breath 0..1 }
export function dog(x, y, o = {}) {
  const { tilt = 0, blink = 0, perk = 0, brow = .5, wag = 0, breath = 0, breed = 'cream' } = o;
  const B = BREEDS[breed];
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.3)'; ell(30, 4, 220, 24); g.fill();
  // tail (wags around its base)
  g.save(); g.translate(150, -42); g.rotate(wag);
  g.fillStyle = shade(-60, 20, B.patch);
  if (breed === 'pug') { g.lineWidth = 22; g.strokeStyle = B.coat[1]; g.lineCap = 'round'; g.beginPath(); g.arc(30, -40, 26, Math.PI * .8, Math.PI * 2.4); g.stroke(); }
  else { g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(90, 22, 120, -18, 100, -68); g.bezierCurveTo(85, -28, 60, -3, 0, -13); g.closePath(); g.fill(); }
  g.restore();
  g.save(); g.scale(B.slim, 1);
  g.fillStyle = shade(-260, 0, B.coat); ell(95, -110, 135, 115, -0.2); g.fill();
  if (B.saddle) { g.save(); ell(95, -110, 135, 115, -0.2); g.clip(); g.fillStyle = shade(-240, -140, B.patch); ell(120, -230, 120, 70, -0.3); g.fill(); g.restore(); }
  g.fillStyle = shade(-30, 0, B.coat); ell(150, -10, 55, 16); g.fill();
  // chest breathes a little
  g.save(); g.translate(0, -40); g.scale(1 + breath * .012, 1 + breath * .02); g.translate(0, 40);
  g.fillStyle = shade(-380, 0, B.coat);
  g.beginPath(); g.moveTo(-95, -40); g.bezierCurveTo(-125, -180, -110, -300, -60, -350); g.lineTo(70, -350); g.bezierCurveTo(115, -290, 120, -170, 95, -40); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.14)'; ell(-15, -270, 55, 60); g.fill();
  g.restore();
  for (const lx of [-55, 45]) {
    g.fillStyle = shade(-200, 0, B.coat); g.beginPath(); g.roundRect(lx - 28, -190, 56, 188, 26); g.fill();
    g.fillStyle = shade(-24, 0, B.coat); ell(lx, -8, 36, 15); g.fill();
    g.strokeStyle = 'rgba(60,40,30,.3)'; g.lineWidth = 3; g.lineCap = 'round';
    for (const d of [-10, 10]) { g.beginPath(); g.moveTo(lx + d, -14); g.lineTo(lx + d, -4); g.stroke(); }
  }
  g.fillStyle = B.collar; g.beginPath(); g.roundRect(-78, -372, 156, 30, 14); g.fill();
  g.fillStyle = '#FFC94D'; ell(0, -330, 15, 15); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; ell(0, -326, 6, 6); g.fill();
  g.restore();
  // head
  g.save(); g.translate(0, -470); g.rotate(tilt);
  const [hx, hy] = B.head;
  const ear = (sx, up) => {
    g.save(); g.scale(sx, 1); g.translate(-(hx - 112) * .6, 0); g.scale(1, B.earLen);
    g.fillStyle = shade(-90, 110, B.ear);
    g.beginPath();
    const HANG = [-80, -75, -140, -95, -165, -20, -150, 50, -140, 100, -110, 110, -95, 70, -90, 20, -85, -30, -80, -75];
    const PERK = [-70, -80, -120, -150, -190, -120, -175, -50, -165, -10, -130, 10, -100, -10, -90, -40, -80, -60, -70, -80];
    const P = HANG.map((v, i) => v + (PERK[i] - v) * up);
    g.moveTo(P[0], P[1]); g.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]); g.bezierCurveTo(P[8], P[9], P[10], P[11], P[12], P[13]); g.bezierCurveTo(P[14], P[15], P[16], P[17], P[18], P[19]);
    g.fill(); g.restore();
  };
  ear(1, 0); ear(-1, perk);
  g.fillStyle = shade(-110, 100, B.coat); ell(0, 0, hx, hy); g.fill();
  if (B.eyePatch) { g.save(); ell(0, 0, hx, hy); g.clip(); g.fillStyle = shade(-80, 20, B.patch); ell(48, -22, 50, 44, 0.2); g.fill(); g.restore(); }
  const [mx, my, mrx, mry] = B.muzzle;
  g.fillStyle = shade(my - mry, my + mry, B.muzzleCol); ell(mx, my, mrx, mry); g.fill();
  if (B.mask) {   // pug wrinkles
    g.strokeStyle = 'rgba(120,80,40,.45)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-40, -66); g.quadraticCurveTo(0, -78, 40, -66); g.moveTo(-30, -52); g.quadraticCurveTo(0, -60, 30, -52); g.stroke();
  }
  const ny = B.nose;
  g.fillStyle = DOG.dark; g.beginPath(); g.moveTo(-26, ny); g.quadraticCurveTo(0, ny - 10, 26, ny); g.quadraticCurveTo(20, ny + 22, 0, ny + 26); g.quadraticCurveTo(-20, ny + 22, -26, ny); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(-9, ny + 2, 7, 4); g.fill();
  g.strokeStyle = B.mask ? '#120E14' : '#6E5444'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, ny + 26); g.lineTo(0, ny + 40); g.quadraticCurveTo(-14, ny + 54, -28, ny + 44); g.moveTo(0, ny + 40); g.quadraticCurveTo(14, ny + 54, 28, ny + 44); g.stroke();
  const ex = breed === 'pug' ? 52 : 46, ey = breed === 'hound' ? -30 : -18, er = breed === 'pug' ? 1.25 : 1;
  for (const s2 of [-1, 1]) {
    const ry = 18 * er * (1 - blink * .9);
    g.fillStyle = DOG.dark; ell(s2 * ex, ey, 15 * er, Math.max(2, ry)); g.fill();
    if (blink < .5) { g.fillStyle = '#FFFFFF'; ell(s2 * ex + 5, ey - 7, 5.5, 5.5); g.fill(); }
  }
  g.strokeStyle = breed === 'black' ? 'rgba(150,160,190,.5)' : '#4A3226'; g.lineWidth = 5;
  const by = 8 * brow;
  g.beginPath(); g.moveTo(-ex - 18, ey - 32 - by * .4); g.quadraticCurveTo(-ex, ey - 46 - by, -ex + 18, ey - 36 - by * .6); g.stroke();
  g.beginPath(); g.moveTo(ex - 18, ey - 28); g.quadraticCurveTo(ex, ey - 36, ex + 18, ey - 26); g.stroke();
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
  // a soft dark plate behind the whole caption block, so grey words read on bright scenes too
  if (lead || key || follow) {
    const bottom = follow ? 530 : key ? 476 : 336;
    g.save(); g.fillStyle = 'rgba(8,12,26,.6)'; g.filter = 'blur(18px)'; g.beginPath(); g.roundRect(120, 262, 840, bottom - 262, 40); g.fill(); g.restore();
  }
  const fitFont = (txt, weight, size, max) => { do { g.font = `${weight} ${size}px Inter`; size -= 2; } while (g.measureText(txt).width > max && size > 20); };
  if (lead) { fitFont(lead, 400, 44, 760); g.fillStyle = '#C3CAD9'; g.fillText(lead, cx, 318); }
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
  if (follow) { fitFont(follow, 400, 40, 760); g.fillStyle = '#C3CAD9'; g.fillText(follow, cx, 344 + 118 + 52); }
  g.textAlign = 'left'; g.textBaseline = 'top';
}

// ---------- people ----------
// owner kneeling at the left, three-quarter view facing right; talk 0..1 opens the mouth; reach 0..1 raises the near arm
export function owner(x, y, { talk = 0, reach = 0, blink = 0 } = {}) {
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.25)'; ell(20, 6, 190, 22); g.fill();
  g.fillStyle = shade(-160, 0, ['#5B6CA8', '#3F4E86', '#2C3864']); g.beginPath(); g.roundRect(-150, -150, 300, 150, 60); g.fill();   // knees / legs
  g.fillStyle = shade(-520, -120, ['#F29A7E', '#E07A5F', '#B85A42']);                                                              // sweater torso
  g.beginPath(); g.moveTo(-120, -130); g.bezierCurveTo(-140, -330, -100, -460, -10, -480); g.bezierCurveTo(90, -470, 130, -350, 120, -130); g.closePath(); g.fill();
  // far arm resting, near arm reaching toward the dog
  g.fillStyle = shade(-400, -100, ['#E8886C', '#CC6A50', '#A8503A']); g.beginPath(); g.roundRect(-110, -400, 60, 260, 30); g.fill();
  g.save(); g.translate(80, -420); g.rotate(-0.2 - reach * .9);
  g.fillStyle = shade(-40, 260, ['#F29A7E', '#E07A5F', '#B85A42']); g.beginPath(); g.roundRect(-30, 0, 62, 250, 30); g.fill();
  g.fillStyle = shade(240, 310, ['#FFD9C2', '#F2B99A', '#D9967A']); ell(0, 270, 34, 38); g.fill();
  g.restore();
  // neck + head
  g.fillStyle = '#E9A98A'; g.beginPath(); g.roundRect(-30, -530, 60, 70, 20); g.fill();
  g.save(); g.translate(10, -620);
  g.fillStyle = '#3A2A24'; ell(-10, -30, 108, 96); g.fill();
  g.fillStyle = shade(-100, 100, ['#FFD9C2', '#F2B99A', '#D9967A']); ell(8, 4, 86, 98); g.fill();
  g.fillStyle = '#3A2A24'; g.beginPath(); g.ellipse(-4, -58, 96, 52, -0.15, Math.PI * 1.02, Math.PI * 2.02); g.fill();
  g.fillStyle = '#D9967A'; ell(-70, 10, 16, 24); g.fill();                       // ear
  for (const ex2 of [10, 54]) { g.fillStyle = '#2A2230'; ell(ex2, -6, 7, 9 * (1 - blink * .85)); g.fill(); }
  g.strokeStyle = '#8A4A3A'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(4, -32); g.quadraticCurveTo(14, -38, 24, -32); g.moveTo(44, -32); g.quadraticCurveTo(54, -38, 64, -32); g.stroke();
  g.fillStyle = '#8A3A3A'; ell(40, 50, 18, 4 + talk * 12); g.fill();               // mouth
  g.restore();
  g.restore();
}
export function bubble(text, x, y, tailX, tailY, k = 1) {   // speech bubble anchored at (x,y) centre
  if (k <= 0) return;
  g.save(); g.font = '700 40px Inter'; const w = g.measureText(text).width + 56, h = 84;
  g.translate(x, y); g.scale(.85 + .15 * k, .85 + .15 * k); g.globalAlpha = Math.min(1, k * 1.5);
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 40); g.fill();
  g.beginPath(); g.moveTo(-20, h / 2 - 4); g.lineTo(tailX - x, tailY - y); g.lineTo(14, h / 2 - 4); g.fill();
  g.fillStyle = '#1B2238'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2);
  g.restore(); g.textAlign = 'left'; g.textBaseline = 'top';
}

// ---------- sets ----------
export function livingRoom() {   // warm evening interior
  const wall = g.createLinearGradient(0, 0, 0, 1420); wall.addColorStop(0, '#221B33'); wall.addColorStop(1, '#3B2F52'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  // window with the night outside
  g.fillStyle = '#16203A'; g.beginPath(); g.roundRect(90, 520, 330, 430, 18); g.fill();
  g.fillStyle = 'rgba(220,230,255,.18)'; ell(300, 640, 34, 34); g.fill();
  g.fillStyle = '#4A3C62'; g.fillRect(250, 520, 12, 430); g.fillRect(90, 730, 330, 12);
  g.fillStyle = '#6A4E7E'; g.beginPath(); g.roundRect(70, 500, 370, 26, 10); g.fill();
  // lamp glow on the right
  const glow = g.createRadialGradient(930, 900, 20, 930, 900, 520); glow.addColorStop(0, 'rgba(255,184,107,.38)'); glow.addColorStop(1, 'rgba(255,184,107,0)');
  g.fillStyle = glow; g.fillRect(300, 300, 780, 1200);
  g.fillStyle = '#2A2238'; g.fillRect(920, 950, 14, 470); g.fillStyle = '#FFC98A'; g.beginPath(); g.moveTo(860, 950); g.lineTo(1000, 950); g.lineTo(965, 860); g.lineTo(895, 860); g.closePath(); g.fill();
  // sofa behind the owner
  g.fillStyle = shade(1080, 1420, ['#5E6EA0', '#45548A', '#2E3A66']); g.beginPath(); g.roundRect(-40, 1100, 600, 330, 50); g.fill();
  // floor + rug
  const floor = g.createLinearGradient(0, 1400, 0, H); floor.addColorStop(0, '#6A4A36'); floor.addColorStop(1, '#3A2820'); g.fillStyle = floor; g.fillRect(0, 1400, W, H - 1400);
  g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { const yy = 1430 + k * k * 14; g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); }
  g.fillStyle = '#2E8C86'; ell(560, 1690, 470, 120); g.fill(); g.fillStyle = '#3AA79F'; ell(560, 1680, 400, 92); g.fill();
}
export function park() {           // bright day park
  const sky = g.createLinearGradient(0, 0, 0, 1300); sky.addColorStop(0, '#6EC1EC'); sky.addColorStop(1, '#CFEAF6'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,240,190,.5)'; ell(860, 760, 110, 110); g.fill(); g.fillStyle = '#FFF4C9'; ell(860, 760, 70, 70); g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)'; for (const [cx, cy, r] of [[180, 700, 60], [250, 680, 75], [320, 710, 55], [600, 900, 45], [660, 885, 60]]) { ell(cx, cy, r, r * .7); g.fill(); }
  const R = rng(21);
  for (let i = 0; i < 9; i++) { const x = -60 + i * 150 + R() * 60, r = 110 + R() * 80, y = 1320 - R() * 40; g.fillStyle = i % 2 ? '#4C9A5A' : '#3F8A4E'; ell(x, y, r, r * 1.05); g.fill(); }
  const gr = g.createLinearGradient(0, 1320, 0, H); gr.addColorStop(0, '#86CC72'); gr.addColorStop(1, '#4E9A48'); g.fillStyle = gr; g.fillRect(0, 1320, W, H - 1320);
  g.fillStyle = '#E8D7B0'; g.beginPath(); g.moveTo(420, 1320); g.lineTo(660, 1320); g.lineTo(980, H); g.lineTo(100, H); g.closePath(); g.fill();
}

// ---------- props ----------
export function toy(kind, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 34, 60, 12); g.fill();
  if (kind === 'duck') {
    g.fillStyle = shade(-40, 40, ['#FFE17A', '#FFC94D', '#E0A21C']); ell(0, 8, 54, 34); g.fill(); ell(26, -26, 28, 26); g.fill();
    g.fillStyle = '#FF8A3D'; g.beginPath(); g.moveTo(48, -26); g.lineTo(74, -20); g.lineTo(48, -14); g.fill();
    g.fillStyle = '#2A2230'; ell(34, -32, 5, 5); g.fill();
  } else if (kind === 'rope') {
    g.strokeStyle = '#E5484D'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, 20); g.bezierCurveTo(-20, -30, 20, 50, 60, 0); g.stroke();
    g.strokeStyle = '#F2F5FF'; g.lineWidth = 8; g.setLineDash([14, 16]); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#5AB4FF'; ell(-66, 24, 18, 18); g.fill(); ell(66, -2, 18, 18); g.fill();
  } else { ball(0, 0, 40); }
  g.restore();
}

// ================= side-view dog: stand / walk / trot =================
// Faces right. (x, y) = the point on the ground under the middle of the body. o = { gait: 'stand'|'walk'|'trot',
// phase 0..1 (one full stride), breed, tilt, blink, wag, look 0..1 (turns the head toward the camera) }.
// The caller advances phase with distance travelled (phase = distance / stride), so planted paws never slide.
export const GAIT = { walk: { stride: 170, duty: .62, bob: 6, offs: [0, .25, .5, .75] }, trot: { stride: 260, duty: .5, bob: 12, offs: [0, .5, .5, 0] } };
const LEG = { up: 112, low: 118 };
function ik(px, py, fx, fy, bendBack) {   // two-bone leg from hip/shoulder to paw; returns the joint
  const dx = fx - px, dy = fy - py, d = Math.min(LEG.up + LEG.low - 1, Math.hypot(dx, dy));
  const a = Math.atan2(dy, dx), c = (LEG.up ** 2 + d * d - LEG.low ** 2) / (2 * LEG.up * d), k = Math.acos(Math.max(-1, Math.min(1, c)));
  const ang = a + (bendBack ? k : -k);
  return [px + Math.cos(ang) * LEG.up, py + Math.sin(ang) * LEG.up];
}
function footAt(p, G, lift) {   // paw offset from straight-under-the-joint at stride phase p
  const S = G.stride, d = G.duty;
  if (p < d) return [S * (.5 - p / d), 0];                       // stance: planted, sliding back relative to the body
  const u = (p - d) / (1 - d), e = u * u * (3 - 2 * u);
  return [-S / 2 + S * e, -lift * Math.sin(Math.PI * u)];        // swing: lifts and reaches forward
}
export function dogSide(x, y, o = {}) {
  const { gait = 'stand', phase = 0, breed = 'cream', tilt = 0, blink = 0, wag = 0, look = 0 } = o;
  const B = BREEDS[breed], G = GAIT[gait] || GAIT.walk, moving = gait !== 'stand';
  const bob = moving ? (gait === 'trot' ? -G.bob * Math.abs(Math.sin(2 * Math.PI * phase)) : -G.bob * Math.sin(4 * Math.PI * phase)) : 0;
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 6, 290, 24); g.fill();
  // legs: [pivot x, front?, near?, phase offset index]  LH, LF, RH, RF — L = near side
  const legs = [[-150, false, true, 0], [135, true, true, 1], [-150, false, false, 2], [135, true, false, 3]];
  const drawLeg = ([px, front, near, oi]) => {
    const p = ((phase + (moving ? G.offs[oi] : 0)) % 1 + 1) % 1, py = -232 + bob;
    const [fx, fy] = moving ? footAt(p, G, front ? 70 : 60) : [front ? 8 : -6, 0];
    const ax = px + fx + (near ? 0 : -18), ay = fy - 14;
    const [jx, jy] = ik(px, py, ax, ay, !front);
    const cols = near ? B.coat : B.coat.map((c, i) => B.coat[Math.min(2, i + 1)]);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = shade(py, 0, cols); g.lineWidth = 50; g.beginPath(); g.moveTo(px, py); g.lineTo(jx, jy); g.stroke();
    g.lineWidth = 38; g.beginPath(); g.moveTo(jx, jy); g.lineTo(ax, ay); g.stroke();
    g.fillStyle = near ? '#FBF4E6' : cols[1]; ell(ax + 12, ay + 6, 30, 14); g.fill();
  };
  legs.filter(l => !l[2]).forEach(drawLeg);                         // far legs behind the body
  // tail (wags around its base)
  g.save(); g.translate(-305, -300 + bob); g.rotate(-.5 + wag);
  g.fillStyle = shade(-120, 0, B.patch); g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-60, -10, -90, -70, -70, -130); g.bezierCurveTo(-55, -80, -30, -40, 10, -14); g.closePath(); g.fill();
  g.restore();
  // body: haunch, barrel, chest
  g.fillStyle = shade(-370 + bob, -150 + bob, B.coat);
  ell(-150, -265 + bob, 115, 100); g.fill(); ell(0, -270 + bob, 200, 92); g.fill(); ell(135, -265 + bob, 100, 100); g.fill();
  if (B.saddle) { g.save(); ell(0, -270 + bob, 200, 92); g.clip(); g.fillStyle = shade(-370, -260, B.patch); ell(-30, -360 + bob, 190, 70); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(255,255,255,.14)'; ell(40, -320 + bob, 140, 22); g.fill();
  legs.filter(l => l[2]).forEach(drawLeg);                          // near legs in front
  // neck + head (the head nods a little behind the body bob; 'look' turns it toward the camera)
  const hb = moving ? -G.bob * .6 * Math.sin(4 * Math.PI * phase - .8) : 0;
  g.fillStyle = shade(-440, -240, B.coat); g.beginPath(); g.moveTo(110, -330 + bob); g.quadraticCurveTo(170, -420, 225, -430 + hb); g.lineTo(255, -350 + hb); g.quadraticCurveTo(200, -300, 170, -250 + bob); g.closePath(); g.fill();
  if (B.collar) { g.save(); g.translate(190, -345 + (bob + hb) / 2); g.rotate(-.9); g.fillStyle = B.collar; g.beginPath(); g.roundRect(-44, -12, 88, 24, 10); g.fill(); g.fillStyle = '#FFC94D'; ell(0, 22, 11, 11); g.fill(); g.restore(); }
  g.save(); g.translate(255, -440 + hb); g.rotate(tilt);
  const turn = look;   // 0 = profile, 1 = three-quarter toward camera (snout shortens, second eye appears)
  g.fillStyle = shade(-80, 70, B.coat); ell(0, 0, 78, 74); g.fill();
  if (B.eyePatch) { g.save(); ell(0, 0, 78, 74); g.clip(); g.fillStyle = shade(-60, 10, B.patch); ell(28 - 20 * turn, -18, 36, 30, .2); g.fill(); g.restore(); }
  const sl = 120 * (1 - .55 * turn);
  g.fillStyle = shade(-20, 60, ['#FFFDF6', '#F6ECDA', '#DCCAAA']); g.beginPath(); g.roundRect(30 - 20 * turn, -14, sl, 62, 30); g.fill();
  g.fillStyle = DOG.dark; ell(30 - 20 * turn + sl - 10, -2, 18, 14); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(30 - 20 * turn + sl - 16, -6, 6, 4); g.fill();
  g.strokeStyle = '#6E5444'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(30 - 20 * turn + sl - 14, 18); g.quadraticCurveTo(70, 46, 40 - 20 * turn, 36); g.stroke();
  const eyes = turn > .3 ? [[24 - 20 * turn, -20], [-14, -22]] : [[24, -20]];
  for (const [ex, ey] of eyes) { g.fillStyle = DOG.dark; ell(ex, ey, 13, Math.max(2, 15 * (1 - blink * .9))); g.fill(); if (blink < .5) { g.fillStyle = '#FFFFFF'; ell(ex + 4, ey - 6, 4.5, 4.5); g.fill(); } }
  g.strokeStyle = '#4A3226'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(8, -46); g.quadraticCurveTo(24, -56, 40, -46); g.stroke();
  // ear: floppy, swings a beat behind the head
  const earSwing = moving ? .28 * Math.sin(4 * Math.PI * phase - 1.6) : 0;
  g.save(); g.translate(-30, -50); g.rotate(earSwing);
  g.fillStyle = shade(-10, 120, B.ear); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, 10, -55, 80, -30, 120); g.bezierCurveTo(-10, 135, 15, 110, 18, 70); g.bezierCurveTo(20, 40, 15, 10, 0, 0); g.fill();
  g.restore();
  g.restore();
  g.restore();
}
