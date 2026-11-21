// Pet Cam art kit (dog-sleep-back): soft flat vector (no outlines). Adds the couch POV, the rear-view dog, the owner's hand, wolves rump to rump, the night bedroom, the big hook.
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
  const { tilt = 0, blink = 0, perk = 0, brow = .5, wag = 0, breath = 0, breed = 'cream', yawn = 0 } = o;
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
  g.save(); g.translate(0, -470); g.rotate(tilt - yawn * .12);
  frontHead(breed, { blink, perk, brow, yawn });
  g.restore();
  g.restore();
}

// the front-facing head (drawn at the current origin, centre of the skull); shared by the sitting dog and the profile dog's look
// yawn 0..1: the jaw drops into a wide pink yawn, the eyes squeeze shut, the brows lift
export function frontHead(breed = 'cream', { blink = 0, perk = 0, brow = .5, yawn = 0 } = {}) {
  blink = Math.max(blink, Math.min(1, yawn * 1.25)); brow = brow + yawn * .9;
  const B = BREEDS[breed];
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
  const drop = 92 * yawn;   // the lower jaw hangs below the muzzle as the mouth opens
  if (yawn > .01) { g.fillStyle = shade(my, my + mry + drop, B.muzzleCol); ell(mx, my + drop * .55, mrx * (1 - .1 * yawn), mry + drop * .5); g.fill(); }
  g.fillStyle = shade(my - mry, my + mry, B.muzzleCol); ell(mx, my, mrx, mry); g.fill();
  if (B.mask) {   // pug wrinkles
    g.strokeStyle = 'rgba(120,80,40,.45)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-40, -66); g.quadraticCurveTo(0, -78, 40, -66); g.moveTo(-30, -52); g.quadraticCurveTo(0, -60, 30, -52); g.stroke();
  }
  const ny = B.nose;
  g.fillStyle = DOG.dark; g.beginPath(); g.moveTo(-26, ny); g.quadraticCurveTo(0, ny - 10, 26, ny); g.quadraticCurveTo(20, ny + 22, 0, ny + 26); g.quadraticCurveTo(-20, ny + 22, -26, ny); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(-9, ny + 2, 7, 4); g.fill();
  if (yawn > .06) {   // the open mouth: dark throat, tongue curling forward, four small fangs
    const top = ny + 30, h = 8 + 112 * yawn, w = 30 + 22 * yawn, cyM = top + h / 2;
    g.fillStyle = '#4A1A28'; ell(0, cyM, w, h / 2); g.fill();
    g.save(); ell(0, cyM, w, h / 2); g.clip();
    g.fillStyle = '#7A2A3C'; ell(0, cyM - h * .12, w * .7, h * .28); g.fill();
    g.fillStyle = shade(cyM, top + h, ['#FFA3B1', '#F27A8A', '#C9566A']); ell(0, top + h * .86, w * .78, h * .3); g.fill();
    g.strokeStyle = 'rgba(160,50,70,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, top + h * .66); g.lineTo(0, top + h * .9); g.stroke();
    g.restore();
    g.fillStyle = '#FFFBF2';
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(sx * (w * .62), top + 4); g.lineTo(sx * (w * .62 - 7), top + 4 + 16 * yawn); g.lineTo(sx * (w * .62 - 13), top + 6); g.fill();
      g.beginPath(); g.moveTo(sx * (w * .6), top + h - 3); g.lineTo(sx * (w * .6 - 6), top + h - 3 - 13 * yawn); g.lineTo(sx * (w * .6 - 12), top + h - 6); g.fill();
    }
  } else {
    g.strokeStyle = B.mask ? '#120E14' : '#6E5444'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, ny + 26); g.lineTo(0, ny + 40); g.quadraticCurveTo(-14, ny + 54, -28, ny + 44); g.moveTo(0, ny + 40); g.quadraticCurveTo(14, ny + 54, 28, ny + 44); g.stroke();
  }
  const ex = breed === 'pug' ? 52 : 46, ey = breed === 'hound' ? -30 : -18, er = breed === 'pug' ? 1.25 : 1;
  for (const s2 of [-1, 1]) {
    const ry = 18 * er * (1 - blink * .9);
    if (yawn > .5) { g.strokeStyle = DOG.dark; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(s2 * ex - 16, ey + 2); g.quadraticCurveTo(s2 * ex, ey - 10, s2 * ex + 16, ey + 2); g.stroke(); continue; }
    g.fillStyle = DOG.dark; ell(s2 * ex, ey, 15 * er, Math.max(2, ry)); g.fill();
    if (blink < .5) { g.fillStyle = '#FFFFFF'; ell(s2 * ex + 5, ey - 7, 5.5, 5.5); g.fill(); }
  }
  g.strokeStyle = breed === 'black' ? 'rgba(150,160,190,.5)' : '#4A3226'; g.lineWidth = 5;
  const by = 8 * brow;
  g.beginPath(); g.moveTo(-ex - 18, ey - 32 - by * .4); g.quadraticCurveTo(-ex, ey - 46 - by, -ex + 18, ey - 36 - by * .6); g.stroke();
  g.beginPath(); g.moveTo(ex - 18, ey - 28); g.quadraticCurveTo(ex, ey - 36, ex + 18, ey - 26); g.stroke();
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
export function ownerFace(cx, cy, r, { who = 'owner', yawn = 0, blink = 0, eyesOpen = false } = {}) {
  const P = PEOPLE[who], shut = eyesOpen ? blink : Math.max(blink, Math.min(1, yawn * 1.3));
  g.save(); g.translate(cx, cy); g.rotate(-yawn * .06);
  g.fillStyle = P.hair; ell(0, -r * .35, r * 1.02, r * .85); g.fill();
  g.fillStyle = shade(-r, r, P.skin); ell(0, 0, r * .86, r); g.fill();
  g.fillStyle = P.hair; g.beginPath(); g.ellipse(0, -r * .62, r * .9, r * .45, 0, Math.PI, 0); g.fill();
  g.strokeStyle = '#2A2230'; g.fillStyle = '#2A2230'; g.lineCap = 'round';
  for (const sx of [-1, 1]) {
    if (shut > .6) { g.lineWidth = r * .04; g.beginPath(); g.moveTo(sx * r * .32 - r * .09, -r * .06); g.quadraticCurveTo(sx * r * .32, -r * .13, sx * r * .32 + r * .09, -r * .06); g.stroke(); }
    else { ell(sx * r * .32, -r * .08, r * .07, r * .09 * (1 - shut * .8)); g.fill(); }
    g.lineWidth = r * .03; g.strokeStyle = P.hair; const by = -r * (.26 + yawn * .07); g.beginPath(); g.moveTo(sx * r * .2, by); g.quadraticCurveTo(sx * r * .32, by - r * .05, sx * r * .44, by); g.stroke(); g.strokeStyle = '#2A2230';
  }
  if (yawn > .05) {
    g.fillStyle = '#6A2A34'; ell(0, r * .48, r * (.16 + .1 * yawn), r * (.04 + .3 * yawn)); g.fill();
    g.fillStyle = '#E87A8A'; ell(0, r * (.48 + .2 * yawn), r * (.12 + .05 * yawn), r * .09 * yawn); g.fill();
  } else {
    g.strokeStyle = '#8A4A3A'; g.lineWidth = r * .05;
    g.beginPath(); g.moveTo(-r * .3, r * .42); g.quadraticCurveTo(0, r * .62, r * .3, r * .42); g.stroke();
  }
  g.restore();
}
// a small person icon for crowd grids (head + shoulders)
export function personIcon(x, y, s, col = '#C9D2E8') {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
  ell(0, -10, 11, 11); g.fill(); g.beginPath(); g.roundRect(-17, 4, 34, 22, 11); g.fill();
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
export function xrayHead(cx, cy, tilt, wave = 0, glowK = 1, arcs = true) {
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
  if (arcs) for (let i = 0; i < 3; i++) {
    const r = 40 + ((i + 1 - wave) % 3) * 36;
    g.globalAlpha = Math.max(0, 1 - (r - 40) / 110); g.beginPath(); g.arc(-180, 10, r, Math.PI * .72, Math.PI * 1.28); g.stroke();
  }
  g.globalAlpha = 1; g.restore();
}

// ---------- two-tier caption: lead words (grey), key phrase in a selection box, follow words (grey) ----------
// lead/key/follow are already cut to what has been spoken; pop = 0..1 box entrance
let PLATE = .6; export const setPlate = a => { PLATE = a; };
export function caption(lead, key, follow, kind, pop = 1, big = false, emph = null) {   // emph: one word of the key phrase set in the meaning colour
  const col = ACC[kind], cx = 540;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  // big: the hook (line 1). White bold lead-in, a huge key phrase: it has to stop the scroll on frame 1
  const LS = big ? 54 : 44, LW = big ? 700 : 400, LC = big ? '#FFFFFF' : '#C3CAD9', KS = big ? 116 : 84, BH = big ? 152 : 118, LY = big ? 330 : 318, BY = big ? 356 : 344;
  if (lead || key || follow) {
    const bottom = (follow ? BY + BH + 70 : key ? BY + BH + 14 : LY + 18);
    g.save(); g.fillStyle = big ? 'rgba(6,10,22,.72)' : `rgba(8,12,26,${PLATE})`; g.filter = 'blur(18px)'; g.beginPath(); g.roundRect(100, 262, 880, bottom - 262, 40); g.fill(); g.restore();
  }
  const fitFont = (txt, weight, size, max) => { do { g.font = `${weight} ${size}px Inter`; size -= 2; } while (g.measureText(txt).width > max && size > 20); };
  if (lead) { fitFont(lead, LW, LS, 800); g.fillStyle = LC; g.fillText(lead, cx, LY); }
  if (key) {
    fitFont(key, 800, KS, 780);
    const tw = g.measureText(key).width, s = 0.9 + 0.1 * Math.min(1, pop) + Math.sin(Math.min(1, pop) * Math.PI) * .04;
    const bw = tw + 64, bh = BH, by = BY;
    g.save(); g.translate(cx, by + bh / 2); g.scale(s, s); g.translate(-cx, -(by + bh / 2));
    const bx = cx - bw / 2;
    g.fillStyle = 'rgba(10,16,30,.55)'; g.fillRect(bx, by, bw, bh);
    g.strokeStyle = col; g.lineWidth = big ? 5 : 3; g.strokeRect(bx, by, bw, bh);
    for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) { g.fillStyle = '#FFFFFF'; ell(hx, hy, big ? 12 : 9, big ? 12 : 9); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); }
    const ty = by + bh / 2 + KS * .36;
    if (emph && key.split(' ').includes(emph)) {   // draw word by word so the stressed word can carry the accent colour
      const sp = g.measureText(' ').width; let x = cx - tw / 2; g.textAlign = 'left';
      for (const w of key.split(' ')) { g.fillStyle = w === emph ? col : '#FFFFFF'; g.fillText(w, x, ty); x += g.measureText(w).width + sp; }
      g.textAlign = 'center';
    } else { g.fillStyle = '#FFFFFF'; g.fillText(key, cx, ty); }
    g.restore();
  }
  if (follow) { fitFont(follow, big ? 600 : 400, big ? 46 : 40, 800); g.fillStyle = big ? '#E6EAF4' : '#C3CAD9'; g.fillText(follow, cx, BY + BH + 54); }
  g.textAlign = 'left'; g.textBaseline = 'top';
}

// ---------- people ----------
// owner kneeling at the left, three-quarter view facing right; talk 0..1 opens the mouth; reach 0..1 raises the near arm
export const PEOPLE = {
  owner: { hair: '#3A2A24', top: ['#F29A7E', '#E07A5F', '#B85A42'], arm: ['#E8886C', '#CC6A50', '#A8503A'], legs: ['#5B6CA8', '#3F4E86', '#2C3864'], skin: ['#FFD9C2', '#F2B99A', '#D9967A'], neck: '#E9A98A' },
  stranger: { hair: '#C9A35A', top: ['#7FCBA8', '#4FA382', '#347A5E'], arm: ['#6FBB98', '#438F70', '#2E6A50'], legs: ['#6A6A78', '#4A4A58', '#33333E'], skin: ['#E8B996', '#C98F6A', '#A4704E'], neck: '#C98F6A' },
};
export function owner(x, y, { talk = 0, reach = 0, blink = 0, yawn = 0, who = 'owner' } = {}) {
  const P = PEOPLE[who]; blink = Math.max(blink, Math.min(1, yawn * 1.3));
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.25)'; ell(20, 6, 190, 22); g.fill();
  g.fillStyle = shade(-160, 0, P.legs); g.beginPath(); g.roundRect(-150, -150, 300, 150, 60); g.fill();   // knees / legs
  g.fillStyle = shade(-520, -120, P.top);                                                              // sweater torso
  g.beginPath(); g.moveTo(-120, -130); g.bezierCurveTo(-140, -330, -100, -460, -10, -480); g.bezierCurveTo(90, -470, 130, -350, 120, -130); g.closePath(); g.fill();
  // far arm resting, near arm reaching toward the dog
  g.fillStyle = shade(-400, -100, P.arm); g.beginPath(); g.roundRect(-110, -400, 60, 260, 30); g.fill();
  g.save(); g.translate(80, -420); g.rotate(-0.2 - reach * .9);
  g.fillStyle = shade(-40, 260, P.top); g.beginPath(); g.roundRect(-30, 0, 62, 250, 30); g.fill();
  g.fillStyle = shade(240, 310, P.skin); ell(0, 270, 34, 38); g.fill();
  g.restore();
  // neck + head
  g.fillStyle = P.neck; g.beginPath(); g.roundRect(-30, -530, 60, 70, 20); g.fill();
  g.save(); g.translate(10, -620); g.rotate(-yawn * .14);
  g.fillStyle = P.hair; ell(-10, -30, 108, 96); g.fill();
  g.fillStyle = shade(-100, 100, P.skin); ell(8, 4, 86, 98); g.fill();
  g.fillStyle = P.hair; g.beginPath(); g.ellipse(-4, -58, 96, 52, -0.15, Math.PI * 1.02, Math.PI * 2.02); g.fill();
  g.fillStyle = P.skin[2]; ell(-70, 10, 16, 24); g.fill();                       // ear
  for (const ex2 of [10, 54]) { g.fillStyle = '#2A2230'; ell(ex2, -6, 7, 9 * (1 - blink * .85)); g.fill(); }
  g.strokeStyle = '#8A4A3A'; g.lineWidth = 4; g.lineCap = 'round';
  const bl = yawn * 10; g.beginPath(); g.moveTo(4, -32 - bl); g.quadraticCurveTo(14, -38 - bl, 24, -32 - bl); g.moveTo(44, -32 - bl); g.quadraticCurveTo(54, -38 - bl, 64, -32 - bl); g.stroke();
  g.fillStyle = '#8A3A3A'; ell(40, 50 + yawn * 10, 18 + yawn * 10, 4 + talk * 12 + yawn * 30); g.fill();               // mouth (a yawn stretches it tall)
  if (yawn > .3) { g.fillStyle = '#E87A8A'; ell(40, 50 + yawn * 26, 12 + yawn * 4, 6 * yawn); g.fill(); }
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

// ================= dog-sleep-back additions =================
// the living room seen from the owner's seat: the couch cushion runs away from the camera, the room behind it
export function couchPOV(t = 0) {
  const wall = g.createLinearGradient(0, 0, 0, 900); wall.addColorStop(0, '#221B33'); wall.addColorStop(1, '#3B2F52'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#16203A'; g.beginPath(); g.roundRect(90, 300, 300, 380, 18); g.fill();           // window, night outside
  g.fillStyle = 'rgba(220,230,255,.2)'; ell(290, 410, 30, 30); g.fill();
  g.fillStyle = '#4A3C62'; g.fillRect(234, 300, 12, 380); g.fillRect(90, 484, 300, 12);
  const glow = g.createRadialGradient(880, 520, 20, 880, 520, 560); glow.addColorStop(0, 'rgba(255,184,107,.42)'); glow.addColorStop(1, 'rgba(255,184,107,0)'); g.fillStyle = glow; g.fillRect(200, 0, 880, 1200);
  g.fillStyle = '#2A2238'; g.fillRect(872, 560, 14, 360); g.fillStyle = '#FFC98A'; g.beginPath(); g.moveTo(812, 560); g.lineTo(948, 560); g.lineTo(915, 470); g.lineTo(845, 470); g.closePath(); g.fill();
  // couch back and arm
  g.fillStyle = shade(820, 1100, ['#5E6EA0', '#45548A', '#2E3A66']); g.beginPath(); g.roundRect(-60, 830, 1200, 300, 60); g.fill();
  g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.roundRect(-40, 850, 1160, 60, 40); g.fill();
  g.fillStyle = shade(900, 1920, ['#56649A', '#3E4C80', '#2A3560']); g.beginPath(); g.moveTo(960, 960); g.lineTo(1080, 940); g.lineTo(1080, 1920); g.lineTo(1000, 1920); g.closePath(); g.fill();
  // seat cushion in perspective (narrow far edge, full width at the bottom)
  const seat = g.createLinearGradient(0, 1060, 0, 1920); seat.addColorStop(0, '#5866A0'); seat.addColorStop(1, '#3C4A7E'); g.fillStyle = seat;
  g.beginPath(); g.moveTo(40, 1060); g.lineTo(990, 1060); g.lineTo(1040, 1920); g.lineTo(-40, 1920); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 5; g.beginPath(); g.moveTo(520, 1062); g.lineTo(500, 1920); g.stroke();   // cushion seam
  g.fillStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(60, 1070); g.lineTo(970, 1070); g.lineTo(980, 1120); g.lineTo(50, 1120); g.closePath(); g.fill();
}
// the owner's legs, seen looking down them along the couch: pyjama trousers rounded like real legs (lit down the middle),
// a slight bend at the knee, folds at the knee and ankle, a soft check that follows the leg into the distance, and socked
// feet standing up at the far end, toes to the ceiling
export function legsPOV() {
  const leg = (bx, tx, wb, wt, ty, side) => {
    const L = (f) => [bx + (tx - bx) * f, 1940 + (ty - 1940) * f, wb + (wt - wb) * f];   // centre x, y and width at f (0 near, 1 ankle)
    const knee = .58, kb = 12;   // the knee: a slight bulge
    const edge = (sgn) => { const pts = []; for (let k = 0; k <= 20; k++) { const f = k / 20, [cx, cy, w] = L(f), bulge = kb * Math.exp(-((f - knee) ** 2) / .03); pts.push([cx + sgn * (w / 2 + bulge * (sgn === side ? 1 : .4)), cy]); } return pts; };
    const left = edge(-1), right = edge(1);
    const path = () => { g.beginPath(); g.moveTo(...left[0]); for (const p of left) g.lineTo(...p); for (const p of right.slice().reverse()) g.lineTo(...p); g.closePath(); };
    // rounded: dark at both edges, lit down the middle
    const gr = g.createLinearGradient(bx - wb / 2, 0, bx + wb / 2, 0);
    gr.addColorStop(0, '#7E2A38'); gr.addColorStop(.35, '#C0505E'); gr.addColorStop(.6, '#D46A76'); gr.addColorStop(1, '#8A3240');
    g.fillStyle = gr; path(); g.fill();
    g.save(); path(); g.clip();
    // distance haze toward the ankle
    const hz = g.createLinearGradient(0, ty, 0, 1940); hz.addColorStop(0, 'rgba(40,30,70,.25)'); hz.addColorStop(.5, 'rgba(40,30,70,0)'); g.fillStyle = hz; g.fillRect(0, ty, W, 1940 - ty);
    // the check: lines along the leg (converging) and across it (closer together in the distance)
    g.strokeStyle = 'rgba(255,225,210,.12)'; g.lineWidth = 4;
    for (let a = -2; a <= 2; a++) { g.beginPath(); g.moveTo(bx + a * wb / 5, 1940); g.lineTo(tx + a * wt / 5, ty); g.stroke(); }
    for (let k = 1; k < 8; k++) { const f = 1 - Math.pow(1 - k / 8, 1.6), [cx, cy, w] = L(f); g.beginPath(); g.moveTo(cx - w, cy); g.lineTo(cx + w, cy); g.stroke(); }
    // folds: soft creases at the knee and above the ankle
    g.strokeStyle = 'rgba(70,20,30,.2)'; g.lineWidth = 5; g.lineCap = 'round';
    for (const f of [knee, .93]) { const [cx, cy, w] = L(f), o = side * w * .12; g.beginPath(); g.moveTo(cx - w * .36 + o, cy + 4); g.quadraticCurveTo(cx + o, cy - 6, cx + w * .2 + o, cy + 6); g.stroke(); }
    g.restore();
    // the cuff, then the socked foot standing up, toes to the ceiling
    g.fillStyle = '#7E2A38'; g.beginPath(); g.ellipse(tx, ty + 4, wt * .56, 14, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(tx, ty); g.rotate(side * .16);
    g.fillStyle = shade(-120, 10, ['#FFFFFF', '#ECE6DC', '#C9BFAE']);
    g.beginPath(); g.moveTo(-38, 0); g.bezierCurveTo(-46, -50, -40, -104, -6, -116); g.bezierCurveTo(28, -122, 46, -88, 42, -40); g.lineTo(38, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; ell(-12, -84, 10, 22, -.2); g.fill();
    g.fillStyle = '#D8CFC0'; g.beginPath(); g.roundRect(-40, -18, 80, 18, 8); g.fill();   // sock cuff ribbing
    g.restore();
  };
  leg(170, 300, 300, 104, 1150, -1);
  leg(440, 430, 300, 104, 1140, 1);
}
// the owner's forearm and hand reaching in from the bottom right; (hx, hy) = the palm, a = arm angle tweak, open 0..1
export function ownerHand(hx, hy, { a = 0, open = 1 } = {}) {
  g.save(); g.translate(hx, hy); g.rotate(-.5 + a);
  g.fillStyle = shade(0, 700, ['#F29A7E', '#E07A5F', '#B85A42']); g.beginPath(); g.roundRect(-58, 40, 116, 760, 54); g.fill();   // sleeve
  g.fillStyle = shade(-90, 60, ['#FFD9C2', '#F2B99A', '#D9967A']); ell(0, 0, 70, 82); g.fill();
  for (const [fx, len] of [[-44, 60], [-16, 74], [12, 72], [38, 60]]) { g.beginPath(); g.roundRect(fx - 13, -60 - len * open, 26, len * open + 40, 13); g.fill(); }
  g.beginPath(); g.ellipse(-70, 10, 18, 46, -.7, 0, Math.PI * 2); g.fill();   // thumb
  g.restore();
}
// a cartoon gas puff (k 0..1 = age)
export function puff(x, y, k) {
  if (k <= 0 || k >= 1) return;
  g.save(); g.globalAlpha = (1 - k) * .85; g.fillStyle = '#9BDB6E';
  const r = 30 + 60 * k; for (const [dx, dy, s] of [[0, 0, 1], [-.7, .3, .7], [.7, .35, .75], [.2, -.5, .65]]) { ell(x + dx * r, y - 160 * k + dy * r, r * s, r * s * .85); g.fill(); }
  g.restore();
}
// the star dog lying stretched out on its side on the couch, its BACK toward the camera (after the user's reference:
// a long dog on a diagonal). Drawn along a local axis (rump at 0, head end at +x, the back along +y = the side nearest
// you) and rotated by `ang`: the butt is nearest you, the spine and saddle face you, the legs fall away on the far side
// with only the paws peeking, and the head at the far end looks back over its shoulder.
// (x, y) = the middle of the rump. o = { ang, sc, blink, brow, perk, wag, breath, turn (0..1: 1 = looking back at you) }
export function rearDog(x, y, o = {}) {
  const { ang = -.62, sc = .88, blink = 0, brow = .5, perk = 0, wag = 0, breath = 0, turn = 1 } = o;
  const B = BREEDS.cream, k = 1 + breath * .02;
  const paw = (px, py, rot, s = 1) => {   // a paw peeking out beyond the far side of the body
    g.save(); g.translate(px, py); g.rotate(rot); g.scale(s, s);
    g.fillStyle = shade(40, -40, ['#FFFDF6', '#F1E4CF', '#D3BF9F']); g.beginPath(); g.roundRect(-26, -10, 52, 70, 22); g.fill();   // the lower leg
    g.fillStyle = shade(-60, 0, ['#FFFDF6', '#F4E9D6', '#D9C6A6']); ell(0, -30, 40, 36); g.fill();                           // the paw
    g.strokeStyle = 'rgba(120,90,60,.4)'; g.lineWidth = 4; g.lineCap = 'round';
    for (const d of [-14, 0, 14]) { g.beginPath(); g.moveTo(d, -64); g.lineTo(d * 1.1, -48); g.stroke(); }
    g.restore();
  };
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
  // contact shadow along the near side, where the back presses into the cushion
  const sh = g.createLinearGradient(0, 80, 0, 180); sh.addColorStop(0, 'rgba(10,14,40,.28)'); sh.addColorStop(1, 'rgba(10,14,40,0)');
  g.fillStyle = sh; g.beginPath(); g.roundRect(-60, 80, 520, 100, 50); g.fill();
  // the legs fall away on the far side: the paws peek out in pairs beyond the belly
  paw(-80, -112, Math.PI + .5, 1.1); paw(-10, -124, Math.PI + .3, 1.05);    // hind paws
  paw(296, -110, Math.PI - .15, 1); paw(358, -100, Math.PI - .4, .98);     // front paws
  // the head first, at the far end, looking back at you; the body's shoulder will overlap its cheek
  g.fillStyle = shade(-80, 80, ['#3DD6C6', '#21B3A6', '#178A80']); g.beginPath(); g.roundRect(426, -96, 28, 120, 14); g.fill();   // collar
  g.save(); g.translate(530, -74); g.rotate(-ang - .25 + .35 * (1 - turn)); g.scale(.86, .86);
  frontHead('cream', { blink, perk, brow });
  g.restore();
  // the tail, curled from the end of the rump toward you
  g.save(); g.translate(-128, 26); g.rotate(wag * .6);
  g.fillStyle = shade(-20, 90, B.patch); g.beginPath(); g.moveTo(16, -20); g.bezierCurveTo(-40, -14, -88, 26, -86, 84); g.bezierCurveTo(-66, 92, -56, 76, -52, 60); g.bezierCurveTo(-46, 28, -14, 16, 16, 20); g.closePath(); g.fill();
  g.restore();
  // the body seen from its back: a round hip, a gentle waist, the rib cage and the shoulder (which overlaps the cheek)
  g.save(); g.scale(1, k);
  const body = () => { g.beginPath(); g.moveTo(-140, 0);
    g.bezierCurveTo(-144, 96, -70, 132, 10, 124);       // hip, near side
    g.bezierCurveTo(90, 116, 150, 104, 210, 108);        // waist dip along the spine
    g.bezierCurveTo(300, 116, 390, 120, 440, 70);        // rib cage up to the shoulder
    g.bezierCurveTo(472, 36, 470, -10, 446, -40);        // shoulder round the front
    g.bezierCurveTo(420, -80, 370, -100, 300, -100);     // chest, far side
    g.bezierCurveTo(220, -100, 140, -92, 60, -104);      // belly
    g.bezierCurveTo(-40, -118, -136, -90, -140, 0); g.closePath(); };
  g.fillStyle = shade(-110, 130, ['#D9C6A6', '#F1E4CF', '#FBF3E6']); body(); g.fill();
  g.save(); body(); g.clip();
  // round forms: light on the hip and the rib cage, shadow toward the belly
  for (const [cx, cy, r] of [[-40, 40, 150], [320, 40, 140]]) { const gr = g.createRadialGradient(cx, cy, 10, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
  // the brown saddle, centred across the spine
  g.fillStyle = shade(-40, 130, ['#B98058', '#9C6A46', '#7A4E30']);
  g.beginPath(); g.moveTo(70, 132); g.bezierCurveTo(50, 80, 60, 10, 110, -20); g.bezierCurveTo(170, -50, 260, -40, 300, -4); g.bezierCurveTo(340, 32, 336, 96, 310, 132); g.closePath(); g.fill();
  const sg = g.createRadialGradient(200, 60, 10, 200, 60, 150); sg.addColorStop(0, 'rgba(255,255,255,.18)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(40, -60, 320, 200);
  // the top thigh: a soft crease where the hip meets the flank
  g.strokeStyle = 'rgba(140,105,70,.26)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(34, -96); g.quadraticCurveTo(70, 0, 30, 96); g.stroke();
  g.restore();
  g.restore();
  g.restore();
}
// a wolf (or dog) lying sphinx-style, side view; dir = 1 faces right, -1 faces left. eye 0..1 (0 asleep, 1 wide awake)
export function sphinxDog(x, y, dir = 1, { eye = 1, coat = ['#C9C2B6', '#8E8478', '#5E554C'], dark = ['#6E655A', '#4E463E', '#332D27'], breath = 0, earTwitch = 0 } = {}) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.fillStyle = 'rgba(0,0,0,.35)'; ell(-10, 8, 230, 22); g.fill();
  // tail curled along the ground at the back
  g.fillStyle = shade(-40, 10, dark); g.beginPath(); g.moveTo(-170, -20); g.bezierCurveTo(-250, -10, -260, 0, -200, 4); g.bezierCurveTo(-170, 6, -150, 0, -150, -10); g.closePath(); g.fill();
  // body + haunch
  g.fillStyle = shade(-160, 0, coat); ell(-30, -72, 140 + breath * 3, 76 + breath * 3); g.fill();
  g.fillStyle = shade(-150, 0, coat); ell(-115, -70, 88, 78); g.fill();
  g.fillStyle = shade(-150, -90, dark); ell(-60, -112, 120, 26, -.04); g.fill();   // darker back
  // front legs stretched forward
  g.fillStyle = shade(-30, 0, coat); g.beginPath(); g.roundRect(40, -30, 160, 30, 14); g.fill(); g.beginPath(); g.roundRect(60, -22, 150, 24, 12); g.fill();
  // neck + head (profile, raised)
  g.fillStyle = shade(-200, -40, coat); g.beginPath(); g.moveTo(40, -110); g.quadraticCurveTo(80, -170, 120, -200); g.lineTo(160, -150); g.quadraticCurveTo(130, -90, 100, -40); g.closePath(); g.fill();
  g.save(); g.translate(140, -190); g.scale(1.3, 1.3);
  g.fillStyle = shade(-50, 40, coat); ell(0, 0, 52, 46); g.fill();
  g.fillStyle = shade(-10, 40, ['#F2EEE6', '#DCD5C9', '#B5AC9E']); ell(58, 14, 46, 24); g.fill();   // muzzle
  g.fillStyle = '#2A2230'; ell(100, 6, 11, 9); g.fill();
  g.fillStyle = shade(-110, -20, dark); g.save(); g.rotate(-.15 + earTwitch * .25); g.beginPath(); g.moveTo(-24, -30); g.lineTo(-8, -100); g.lineTo(18, -34); g.closePath(); g.fill(); g.restore();
  if (eye > .2) { g.fillStyle = '#2A2230'; ell(30, -8, 8, 8 * eye); g.fill(); g.fillStyle = '#FFD15A'; ell(32, -10, 3, 3 * eye); g.fill(); }
  else { g.strokeStyle = '#2A2230'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(20, -6); g.quadraticCurveTo(30, 0, 40, -6); g.stroke(); }
  g.restore();
  g.restore();
}
// a dark night forest (the wild), for inside the takeover card
export function forestNight(t) {
  const sky = g.createLinearGradient(0, 0, 0, 1400); sky.addColorStop(0, '#05080F'); sky.addColorStop(1, '#14202A'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(220,230,255,.12)'; ell(760, 830, 60, 60); g.fill(); g.fillStyle = 'rgba(220,230,255,.3)'; ell(760, 830, 34, 34); g.fill();
  for (let i = 0; i < 7; i++) { const x = -40 + i * 180, h = 420 + (i % 3) * 80, base = 1360; g.fillStyle = i % 2 ? '#0B1712' : '#0E1D16'; g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + 110, base); g.lineTo(x - 110, base); g.closePath(); g.fill(); }
  const gr = g.createLinearGradient(0, 1340, 0, H); gr.addColorStop(0, '#16261C'); gr.addColorStop(1, '#070D09'); g.fillStyle = gr; g.fillRect(0, 1340, W, H - 1340);
  grass(1350, 1460, 80, '#1E3A26', 9, Math.sin(t));
}
// a night bedroom: a person asleep in bed on the right
export function bedroom(t, glowK = 0, stir = 0) {   // stir 0..1: the sleeper shifts and settles, smiling
  const wall = g.createLinearGradient(0, 0, 0, 1300); wall.addColorStop(0, '#0E1530'); wall.addColorStop(1, '#1C2446'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0A1022'; g.beginPath(); g.roundRect(110, 600, 280, 340, 16); g.fill();
  g.fillStyle = 'rgba(220,230,255,.25)'; ell(300, 700, 34, 34); g.fill(); g.fillStyle = '#2A3358'; g.fillRect(244, 600, 10, 340); g.fillRect(110, 766, 280, 10);
  const moon = g.createLinearGradient(200, 940, 520, 1500); moon.addColorStop(0, 'rgba(180,200,255,.12)'); moon.addColorStop(1, 'rgba(180,200,255,0)'); g.fillStyle = moon; g.beginPath(); g.moveTo(110, 940); g.lineTo(390, 940); g.lineTo(640, 1500); g.lineTo(260, 1500); g.closePath(); g.fill();
  const floor = g.createLinearGradient(0, 1280, 0, H); floor.addColorStop(0, '#2A2440'); floor.addColorStop(1, '#151226'); g.fillStyle = floor; g.fillRect(0, 1280, W, H - 1280);
  // the bed (right)
  if (glowK > 0) { const gl = g.createRadialGradient(820, 1220, 20, 820, 1220, 420); gl.addColorStop(0, `rgba(255,201,77,${.28 * glowK})`); gl.addColorStop(1, 'rgba(255,201,77,0)'); g.fillStyle = gl; g.fillRect(380, 800, 700, 800); }
  g.fillStyle = '#3A2E50'; g.beginPath(); g.roundRect(560, 980, 520, 120, 20); g.fill();   // headboard
  g.fillStyle = shade(1080, 1420, ['#5E6EA0', '#45548A', '#2E3A66']); g.beginPath(); g.roundRect(560, 1080, 560, 300, 30); g.fill();   // mattress + duvet
  g.fillStyle = '#EDE6F5'; g.beginPath(); g.roundRect(600, 1060, 200, 70, 30); g.fill();   // pillow
  g.save(); g.translate(700 + 10 * stir, 1070 - 4 * stir); g.rotate(.14 * stir); ownerFace(0, 0, 52, { blink: 1 }); g.restore();   // asleep; stirs on "near people"
  g.fillStyle = shade(1100, 1380, ['#7E8EC4', '#62729E', '#46547E']); g.beginPath(); g.moveTo(640, 1120); g.bezierCurveTo(800, 1090, 1000, 1100, 1100, 1130); g.lineTo(1100, 1380); g.lineTo(560, 1380); g.lineTo(560, 1140); g.closePath(); g.fill();
  // "z"s
  g.fillStyle = 'rgba(201,210,232,.55)'; g.font = '700 40px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) { const p = ((t * .5 + i / 3) % 1); g.globalAlpha = Math.sin(p * Math.PI) * .7; g.fillText('z', 760 + p * 70, 1000 - p * 140); }
  g.globalAlpha = 1; g.textAlign = 'left'; g.textBaseline = 'top';
}
// the frame-1 hook: four big lines, the key word in amber, on a dark plate. Readable at a glance
export function hookCaption(rows, emph, col = ACC.ask) {
  // rows: [[text, size], ...]; the row whose text equals emph is drawn in col inside a selection box
  const cx = 540; let y = 300; const H0 = rows.reduce((s, [, sz]) => s + sz * 1.06, 0);
  g.save(); g.fillStyle = 'rgba(6,10,22,.78)'; g.filter = 'blur(22px)'; g.beginPath(); g.roundRect(70, 262, 940, H0 + 90, 44); g.fill(); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for (const [txt, sz] of rows) {
    g.font = `800 ${sz}px Inter`; let s2 = sz; while (g.measureText(txt).width > 860 && s2 > 40) { s2 -= 4; g.font = `800 ${s2}px Inter`; }
    const base = y + s2 * .84;
    if (txt === emph) {
      const tw = g.measureText(txt).width, bx = cx - tw / 2 - 34, bw = tw + 68, by = y - 4, bh = s2 * 1.0;
      g.fillStyle = 'rgba(10,16,30,.6)'; g.fillRect(bx, by, bw, bh); g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(bx, by, bw, bh);
      for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) { g.fillStyle = '#FFFFFF'; ell(hx, hy, 14, 14); g.fill(); g.strokeStyle = col; g.lineWidth = 4; g.stroke(); }
      g.fillStyle = col;
    } else g.fillStyle = '#FFFFFF';
    g.fillText(txt, cx, base); y += s2 * 1.06;
  }
  g.textAlign = 'left'; g.textBaseline = 'top';
}
