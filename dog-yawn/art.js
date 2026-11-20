// Pet Cam art kit (dog-yawn): soft flat vector (no outlines), with a yawn for the dog and the people. soft flat vector (no outlines). Every function draws on the current context set with setCtx().
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
export function caption(lead, key, follow, kind, pop = 1, big = false, emph = null) {   // emph: one word of the key phrase set in the meaning colour
  const col = ACC[kind], cx = 540;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  // big: the hook (line 1). White bold lead-in, a huge key phrase: it has to stop the scroll on frame 1
  const LS = big ? 54 : 44, LW = big ? 700 : 400, LC = big ? '#FFFFFF' : '#C3CAD9', KS = big ? 116 : 84, BH = big ? 152 : 118, LY = big ? 330 : 318, BY = big ? 356 : 344;
  if (lead || key || follow) {
    const bottom = (follow ? BY + BH + 70 : key ? BY + BH + 14 : LY + 18);
    g.save(); g.fillStyle = big ? 'rgba(6,10,22,.72)' : 'rgba(8,12,26,.6)'; g.filter = 'blur(18px)'; g.beginPath(); g.roundRect(100, 262, 880, bottom - 262, 40); g.fill(); g.restore();
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
