// Pet Cam — style frame. Soft flat vector (no outlines), mood-lit night scene, CAM-feed card, two-tier voice caption.
const W = 1080, H = 1920;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const SAFE = { x0: 60, x1: 920, y0: 250, y1: 1480 };
const ACC = { good: '#3DDC97', bad: '#FF5C6C', ask: '#FFC94D', fact: '#5AB4FF' };
const DOG = { coat: ['#FFF8EC', '#F1E4CF', '#CDB898'], patch: ['#A9714A', '#8A5A3B', '#61391F'], dark: '#2A2230' };

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
// soft flat shading: highlight at the top, base in the middle, shadow at the bottom of each form
function shade(y0, y1, [hi, base, sh]) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, hi); gr.addColorStop(.45, base); gr.addColorStop(1, sh); return gr;
}
function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }

// ---------- scene: cool night (calm / curious) ----------
function scene() {
  const sky = g.createLinearGradient(0, 0, 0, 1350);
  sky.addColorStop(0, '#0A1124'); sky.addColorStop(1, '#1B2C4E'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(220,230,255,.07)'; ell(150, 150, 64, 64); g.fill(); g.fillStyle = 'rgba(220,230,255,.15)'; ell(150, 150, 40, 40); g.fill();
  // distant round trees
  const R = rng(7);
  for (let i = 0; i < 9; i++) {
    const x = -60 + i * 150 + R() * 60, r = 120 + R() * 90, y = 1330 - R() * 60;
    g.fillStyle = i % 2 ? '#13281F' : '#102219'; ell(x, y, r, r * 1.05); g.fill();
  }
  const ground = g.createLinearGradient(0, 1330, 0, H);
  ground.addColorStop(0, '#1F4B2F'); ground.addColorStop(1, '#0C2014'); g.fillStyle = ground; g.fillRect(0, 1330, W, H - 1330);
  grass(1350, 1560, 140, '#2A6B3D', 3);
}
function grass(y0, y1, n, col, seed) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = y0 + R() * (y1 - y0), h = 40 + R() * 90, lean = (R() - .5) * 40, w = 5 + R() * 6;
    g.fillStyle = R() > .5 ? col : '#358A4C';
    g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x + lean * .3, y - h * .6, x + lean, y - h); g.quadraticCurveTo(x + lean * .3 + w * .4, y - h * .5, x + w, y); g.fill();
  }
}

// ---------- the dog (original design: cream coat, brown ears, brown saddle and one brown eye patch, teal collar) ----------
// sitting, three-quarter front view, so a head tilt reads at a glance
function dog(x, y, tilt) {     // x,y = centre of the front paws on the ground
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.3)'; ell(30, 4, 220, 24); g.fill();
  // tail curled on the ground
  g.fillStyle = shade(-60, 0, DOG.patch);
  g.beginPath(); g.moveTo(150, -30); g.bezierCurveTo(240, -20, 270, -60, 250, -110); g.bezierCurveTo(235, -70, 210, -45, 150, -55); g.closePath(); g.fill();
  // haunch (sitting rear leg), behind the chest
  g.fillStyle = shade(-260, 0, DOG.coat); ell(95, -110, 135, 115, -0.2); g.fill();
  g.save(); ell(95, -110, 135, 115, -0.2); g.clip(); g.fillStyle = shade(-240, -140, DOG.patch); ell(120, -230, 120, 70, -0.3); g.fill(); g.restore();
  g.fillStyle = shade(-30, 0, ['#F7EEDD', '#E8D9BF', '#CDB898']); ell(150, -10, 55, 16); g.fill();
  // chest / body
  g.fillStyle = shade(-380, 0, DOG.coat);
  g.beginPath(); g.moveTo(-95, -40); g.bezierCurveTo(-125, -180, -110, -300, -60, -350); g.lineTo(70, -350); g.bezierCurveTo(115, -290, 120, -170, 95, -40); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.16)'; ell(-15, -270, 55, 60); g.fill();
  // front legs
  for (const lx of [-55, 45]) {
    g.fillStyle = shade(-200, 0, DOG.coat); g.beginPath(); g.roundRect(lx - 28, -190, 56, 188, 26); g.fill();
    g.fillStyle = '#FBF4E6'; ell(lx, -8, 36, 15); g.fill();
    g.strokeStyle = 'rgba(160,130,90,.45)'; g.lineWidth = 3; g.lineCap = 'round';
    for (const d of [-10, 10]) { g.beginPath(); g.moveTo(lx + d, -14); g.lineTo(lx + d, -4); g.stroke(); }
  }
  // collar
  g.fillStyle = '#21B3A6'; g.beginPath(); g.roundRect(-78, -372, 156, 30, 14); g.fill();
  g.fillStyle = '#FFC94D'; ell(0, -330, 15, 15); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; ell(0, -326, 6, 6); g.fill();
  // head
  g.save(); g.translate(0, -470); g.rotate(tilt);
  const ear = (sx, up) => {     // floppy ear; 'up' = perked by the tilt
    g.save(); g.scale(sx, 1);
    g.fillStyle = shade(-90, 110, DOG.patch);
    g.beginPath();
    if (up) { g.moveTo(-70, -80); g.bezierCurveTo(-120, -150, -190, -120, -175, -50); g.bezierCurveTo(-165, -10, -130, 10, -100, -10); g.bezierCurveTo(-90, -40, -80, -60, -70, -80); }
    else { g.moveTo(-80, -75); g.bezierCurveTo(-140, -95, -165, -20, -150, 50); g.bezierCurveTo(-140, 100, -110, 110, -95, 70); g.bezierCurveTo(-90, 20, -85, -30, -80, -75); }
    g.fill(); g.restore();
  };
  ear(1, false); ear(-1, true);
  g.fillStyle = shade(-110, 100, DOG.coat); ell(0, 0, 112, 104); g.fill();
  g.save(); ell(0, 0, 112, 104); g.clip();
  g.fillStyle = shade(-80, 20, DOG.patch); ell(48, -22, 50, 44, 0.2); g.fill();     // eye patch
  g.restore();
  g.fillStyle = shade(10, 110, ['#FFFDF6', '#F6ECDA', '#DCCAAA']); ell(0, 52, 70, 50); g.fill();   // muzzle
  g.fillStyle = DOG.dark; g.beginPath(); g.moveTo(-26, 18); g.quadraticCurveTo(0, 8, 26, 18); g.quadraticCurveTo(20, 40, 0, 44); g.quadraticCurveTo(-20, 40, -26, 18); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; ell(-9, 20, 7, 4); g.fill();
  g.strokeStyle = '#6E5444'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 44); g.lineTo(0, 60); g.quadraticCurveTo(-14, 74, -28, 64); g.moveTo(0, 60); g.quadraticCurveTo(14, 74, 28, 64); g.stroke();
  for (const ex of [-46, 46]) { g.fillStyle = DOG.dark; ell(ex, -18, 15, 18); g.fill(); g.fillStyle = '#FFFFFF'; ell(ex + 5, -25, 5.5, 5.5); g.fill(); }
  g.strokeStyle = '#4A3226'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-64, -50); g.quadraticCurveTo(-46, -64, -28, -54); g.stroke();      // one brow higher = curious
  g.beginPath(); g.moveTo(28, -46); g.quadraticCurveTo(46, -54, 64, -44); g.stroke();
  g.restore();
  g.restore();
}

// ---------- CAM-feed card ----------
function card(x, y, w, h, title, sub, cam) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 40; g.shadowOffsetY = 12;
  g.fillStyle = '#111A2E'; g.beginPath(); g.roundRect(x, y, w, h, 28); g.fill();
  g.restore();
  g.strokeStyle = 'rgba(120,150,210,.28)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, w, h, 28); g.stroke();
  g.fillStyle = '#F2F5FF'; g.font = 'italic 700 34px Inter'; g.textBaseline = 'top'; g.fillText(title, x + 32, y + 26);
  g.fillStyle = '#8B95AD'; g.font = 'italic 400 25px Inter'; g.fillText(sub, x + 32, y + 68);
  g.fillStyle = '#9AA6C2'; g.font = '500 24px JetBrains Mono'; g.textAlign = 'right'; g.fillText(cam, x + w - 82, y + 32); g.textAlign = 'left';
  g.strokeStyle = '#C9D2E8'; g.lineWidth = 3; ell(x + w - 48, y + 46, 17, 17); g.stroke();
  g.beginPath(); g.moveTo(x + w - 48, y + 46); g.lineTo(x + w - 48, y + 34); g.stroke();
}
function pill(text, cx, cy, col) {
  g.font = '600 26px JetBrains Mono'; const tw = g.measureText(text).width, w = tw + 40, h = 50;
  g.fillStyle = 'rgba(10,16,30,.9)'; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, 10); g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cx, cy + 1); g.textAlign = 'left'; g.textBaseline = 'top';
}
// inside the card: the same dog's head in x-ray (front view, same tilt), sound reaching one ear, the listening area lighting up
function xrayHead(cx, cy, tilt) {
  g.save(); g.translate(cx, cy); g.rotate(tilt);
  const glow = (f) => { g.save(); g.shadowColor = '#5AB4FF'; g.shadowBlur = 18; g.strokeStyle = '#9FD0FF'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; f(); g.restore(); };
  g.fillStyle = 'rgba(40,70,130,.35)'; ell(0, 0, 135, 125); g.fill();
  glow(() => {
    ell(0, 0, 135, 125); g.stroke();
    for (const sx of [1, -1]) { g.save(); g.scale(sx, 1); g.beginPath(); g.moveTo(-95, -88); g.bezierCurveTo(-165, -110, -195, -20, -178, 60); g.bezierCurveTo(-166, 118, -130, 128, -112, 82); g.stroke(); g.restore(); }
    ell(0, 62, 80, 56); g.stroke();
    ell(-54, -20, 22, 24); g.stroke(); ell(54, -20, 22, 24); g.stroke();
  });
  // brain
  const br = g.createRadialGradient(0, -70, 10, 0, -60, 110);
  br.addColorStop(0, '#FFE3A3'); br.addColorStop(1, '#F2A65A');
  g.fillStyle = br; ell(0, -62, 92, 46); g.fill();
  g.strokeStyle = 'rgba(160,90,40,.55)'; g.lineWidth = 4;
  for (const [a, b] of [[-60, -70], [-25, -82], [10, -66], [42, -80]]) { g.beginPath(); g.moveTo(a, b + 10); g.quadraticCurveTo(a + 15, b - 12, a + 32, b + 6); g.stroke(); }
  // the listening (word-recognition) area glowing
  g.fillStyle = 'rgba(90,180,255,.35)'; ell(-40, -55, 34, 22); g.fill(); g.fillStyle = '#5AB4FF'; ell(-40, -55, 13, 9); g.fill();
  // sound waves arriving at the left ear
  g.strokeStyle = '#5AB4FF'; g.lineWidth = 6;
  for (let i = 0; i < 3; i++) { g.globalAlpha = 1 - i * .28; g.beginPath(); g.arc(-180, 10, 40 + i * 36, Math.PI * .72, Math.PI * 1.28); g.stroke(); }
  g.globalAlpha = 1; g.restore();
}

// ---------- two-tier caption (lead-in words + keyword in a selection box) ----------
function caption(lead, key, follow, kind) {
  const col = ACC[kind];
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#A7B0C4'; g.font = '400 44px Inter'; g.fillText(lead, W / 2, 318);
  g.font = '800 84px Inter'; const tw = g.measureText(key).width, bw = tw + 64, bh = 118, bx = W / 2 - bw / 2, by = 344;
  g.fillStyle = 'rgba(10,16,30,.55)'; g.fillRect(bx, by, bw, bh);
  g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(bx, by, bw, bh);
  for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) { g.fillStyle = '#FFFFFF'; ell(hx, hy, 9, 9); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); }
  g.fillStyle = '#FFFFFF'; g.fillText(key, W / 2, by + 88);
  if (follow) { g.fillStyle = '#A7B0C4'; g.font = '400 40px Inter'; g.fillText(follow, W / 2, by + bh + 52); }
  g.textAlign = 'left'; g.textBaseline = 'top';
}

async function main() {
  for (const [fam, url, desc] of [['Inter', './fonts/Inter.ttf', { weight: '100 900' }], ['Inter', './fonts/Inter-Italic.ttf', { weight: '100 900', style: 'italic' }], ['JetBrains Mono', './fonts/JetBrainsMono.ttf', { weight: '100 800' }]]) {
    const f = new FontFace(fam, `url(${url})`, desc); await f.load(); document.fonts.add(f);
  }
  window.DUR = 1;
  window.render = () => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    scene();
    dog(520, 1660, -0.32);
    grass(1640, 1720, 40, '#2F7D45', 11);
    g.fillStyle = ACC.ask; g.font = '800 130px Inter'; g.fillText('?', 700, 1040);
    card(60, 560, 860, 470, 'inside the head', 'listening mode', 'CAM 04');
    g.save(); g.beginPath(); g.roundRect(60, 560, 860, 470, 28); g.clip(); xrayHead(500, 850, -0.32); g.restore();
    pill('TILT = BETTER SIGNAL?', 490, 660, ACC.ask);
    caption('Dogs that learn their toys’ names', 'tilt their heads', 'far more than other dogs.', 'fact');
  };
  window.render(0);
  window.READY = true;
}
main();
