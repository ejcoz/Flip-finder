// Pet Cam limited animation: the dog in profile, drawn as strong hand-placed key poses (held on twos), not a continuous rig.
// One continuous body silhouette; tapered legs that grow out of thigh / shoulder masses; a profile head in the sitting dog's style.
import * as A from './art.js';

// leg = list of [x, y, width] from the shoulder/hip down to the paw (y up is negative, ground = 0)
const P = {
  stand: {
    bob: 0, head: [0, 0, 0],
    fn: [[120, -235, 62], [138, -128, 40], [136, -40, 32], [150, -6, 30]],
    ff: [[98, -235, 56], [104, -128, 38], [100, -40, 30], [112, -6, 28]],
    hn: [[-165, -255, 92], [-112, -168, 54], [-186, -76, 34], [-160, -6, 30]],
    hf: [[-185, -255, 80], [-136, -168, 48], [-206, -76, 30], [-182, -6, 28]],
  },
  stepA: {   // near front reaching, near hind pushing back
    bob: 4, head: [6, 4, -.04],
    fn: [[120, -235, 62], [168, -140, 40], [212, -54, 32], [238, -6, 30]],
    ff: [[98, -235, 56], [80, -130, 38], [54, -44, 30], [44, -6, 28]],
    hn: [[-165, -255, 92], [-138, -168, 54], [-238, -84, 34], [-262, -6, 30]],
    hf: [[-185, -255, 80], [-112, -170, 48], [-134, -76, 30], [-104, -6, 28]],
  },
  pass: {    // legs under the body, near front lifted and folded
    bob: -8, head: [0, -6, .03],
    fn: [[120, -235, 62], [150, -150, 40], [118, -92, 32], [146, -72, 30]],
    ff: [[98, -235, 56], [104, -128, 38], [100, -40, 30], [112, -6, 28]],
    hn: [[-165, -255, 92], [-112, -168, 54], [-186, -76, 34], [-160, -6, 30]],
    hf: [[-185, -255, 80], [-120, -180, 48], [-178, -110, 30], [-150, -82, 28]],
  },
  runOut: {  // extended: front legs reach far forward, hind legs far back, body low
    bob: 14, head: [12, 14, -.1],
    fn: [[120, -235, 62], [190, -170, 40], [262, -104, 32], [300, -86, 30]],
    ff: [[98, -235, 56], [170, -150, 38], [236, -76, 30], [266, -50, 28]],
    hn: [[-165, -255, 92], [-196, -176, 54], [-300, -130, 34], [-338, -112, 30]],
    hf: [[-185, -255, 80], [-222, -164, 48], [-318, -96, 30], [-350, -70, 28]],
  },
  runIn: {   // gathered: all four paws tucked under, back rounded, airborne
    bob: -26, head: [0, -12, .08],
    fn: [[120, -235, 62], [128, -150, 40], [70, -96, 32], [44, -74, 30]],
    ff: [[98, -235, 56], [116, -144, 38], [62, -100, 30], [36, -82, 28]],
    hn: [[-165, -255, 92], [-90, -190, 54], [-40, -120, 34], [-6, -98, 30]],
    hf: [[-185, -255, 80], [-116, -178, 48], [-74, -110, 30], [-40, -92, 28]],
  },
};
export const POSES = P;

function limb(g, pts, cols, paw) {   // tapered limb: a quad per segment + round joints, one gradient top to bottom
  const fill = A.shade(pts[0][1], 0, cols);
  g.fillStyle = fill;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0, w0] = pts[i], [x1, y1, w1] = pts[i + 1], a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const c = Math.cos(a), s = Math.sin(a);
    g.beginPath(); g.moveTo(x0 + c * w0 / 2, y0 + s * w0 / 2); g.lineTo(x1 + c * w1 / 2, y1 + s * w1 / 2); g.lineTo(x1 - c * w1 / 2, y1 - s * w1 / 2); g.lineTo(x0 - c * w0 / 2, y0 - s * w0 / 2); g.closePath(); g.fill();
    A.ell(x1, y1, w1 / 2, w1 / 2); g.fill();
  }
  const [px, py] = pts[pts.length - 1];
  g.fillStyle = paw; A.ell(px + 10, py + 2, 26, 12); g.fill();
}

// x,y = ground point under the middle of the body; o = { pose, breed, look (head turn 0..1), tilt, blink, wag }
export function dogProfile(g, x, y, o = {}) {
  const { pose = 'stand', breed = 'cream', look = 0, tilt = 0, blink = 0, wag = 0 } = o;
  const B = A.BREEDS[breed], K = P[pose], b = K.bob;
  const far = B.coat.map((c, i) => B.coat[Math.min(2, i + 1)]);
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.26)'; A.ell(-10, 6, pose.startsWith('run') ? 200 : 270, 22); g.fill();
  limb(g, K.ff.map(([px, py, w]) => [px, py + (py < -200 ? b : 0), w]), far, far[1]);
  limb(g, K.hf.map(([px, py, w]) => [px, py + (py < -200 ? b : 0), w]), far, far[1]);
  // tail
  g.save(); g.translate(-262, -318 + b); g.rotate(-.35 + wag + (pose.startsWith('run') ? .5 : 0));
  g.fillStyle = A.shade(-110, 10, B.patch); g.beginPath(); g.moveTo(10, 10); g.bezierCurveTo(-50, -4, -86, -56, -72, -118); g.bezierCurveTo(-56, -70, -26, -34, 16, -16); g.closePath(); g.fill();
  g.restore();
  // one continuous silhouette: chest → belly → haunch → rump → back → withers → neck
  g.save(); g.translate(0, b);
  const body = () => {
    g.beginPath();
    g.moveTo(172, -262);
    g.bezierCurveTo(188, -214, 160, -186, 112, -186);   // chest bottom
    g.bezierCurveTo(40, -190, -20, -206, -78, -200);     // belly with a tuck
    g.bezierCurveTo(-150, -194, -232, -206, -262, -262); // under the haunch
    g.bezierCurveTo(-284, -312, -250, -352, -190, -350); // rump
    g.bezierCurveTo(-110, -352, 20, -346, 82, -352);     // back line
    g.bezierCurveTo(124, -356, 150, -380, 172, -420);    // withers up the back of a short, thick neck
    g.lineTo(250, -386);                                  // under the jaw
    g.bezierCurveTo(238, -330, 212, -290, 172, -262);    // throat down to the chest
    g.closePath();
  };
  g.fillStyle = A.shade(-460, -186, B.coat); body(); g.fill();
  g.save(); body(); g.clip();
  if (B.saddle) { g.fillStyle = A.shade(-370, -250, B.patch); A.ell(-60, -362, 170, 62, -.03); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.08)'; A.ell(-20, -190, 260, 26); g.fill();          // belly shadow
  g.fillStyle = 'rgba(255,255,255,.16)'; A.ell(-40, -338, 200, 16); g.fill();   // back highlight
  g.restore();
  if (B.collar) { g.save(); g.translate(200, -366); g.rotate(-1.1); g.fillStyle = B.collar; g.beginPath(); g.roundRect(-46, -12, 92, 24, 10); g.fill(); g.fillStyle = '#FFC94D'; A.ell(0, 22, 11, 11); g.fill(); g.restore(); }
  g.restore();
  // near legs grow out of a thigh mass and a shoulder mass
  g.fillStyle = A.shade(-460 + b, -186 + b, B.coat); A.ell(-168, -258 + b, 80, 84, .15); g.fill();
  g.fillStyle = A.shade(-460 + b, -186 + b, B.coat); A.ell(118, -256 + b, 52, 64, -.1); g.fill();
  g.fillStyle = 'rgba(0,0,0,.05)'; A.ell(-150, -205 + b, 66, 22, .1); g.fill();
  limb(g, K.hn.map(([px, py, w]) => [px, py + (py < -200 ? b : 0), w]), B.coat, '#FBF4E6');
  limb(g, K.fn.map(([px, py, w]) => [px, py + (py < -200 ? b : 0), w]), B.coat, '#FBF4E6');
  // head in profile (same parts and colours as the sitting dog), turning toward the camera with `look`
  const [hx, hy, hr] = K.head;
  g.save(); g.translate(236 + hx, -432 + b + hy); g.rotate(hr + tilt);
  const t2 = look, sl = 104 * (1 - .5 * t2);
  g.fillStyle = A.shade(-90, 70, B.coat); A.ell(0, 0, 86, 80); g.fill();
  if (B.eyePatch) { g.save(); A.ell(0, 0, 86, 80); g.clip(); g.fillStyle = A.shade(-70, 10, B.patch); A.ell(30 - 24 * t2, -20, 42, 36, .2); g.fill(); g.restore(); }
  g.fillStyle = A.shade(-10, 70, ['#FFFDF6', '#F6ECDA', '#DCCAAA']); g.beginPath(); g.ellipse(46 - 22 * t2 + sl / 2, 20, sl / 2 + 16, 36, 0, 0, Math.PI * 2); g.fill();
  const nx = 46 - 22 * t2 + sl + 6;
  g.fillStyle = A.DOG.dark; A.ell(nx, 6, 19, 15); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; A.ell(nx - 6, 2, 6, 4); g.fill();
  g.strokeStyle = '#6E5444'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx - 4, 26); g.quadraticCurveTo(nx - 30, 50, 52 - 20 * t2, 42); g.stroke();
  const eyes = t2 > .35 ? [[28 - 22 * t2, -22], [-18 + 10 * t2, -24]] : [[28, -22]];
  for (const [ex, ey] of eyes) { g.fillStyle = A.DOG.dark; A.ell(ex, ey, 14, Math.max(2, 16 * (1 - blink * .9))); g.fill(); if (blink < .5) { g.fillStyle = '#fff'; A.ell(ex + 5, ey - 6, 5, 5); g.fill(); } }
  g.strokeStyle = '#4A3226'; g.lineWidth = 5; g.beginPath(); g.moveTo(12, -50); g.quadraticCurveTo(28, -62, 46, -50); g.stroke();
  // floppy ear, swinging with the pose
  const swing = { stand: 0, stepA: .12, pass: -.18, runOut: .35, runIn: -.3 }[pose];
  g.save(); g.translate(-34, -54); g.rotate(swing);
  g.fillStyle = A.shade(-10, 130, B.ear); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-46, 10, -62, 88, -34, 132); g.bezierCurveTo(-12, 148, 18, 120, 20, 76); g.bezierCurveTo(22, 42, 16, 10, 0, 0); g.fill();
  g.restore();
  g.restore();
  g.restore();
}

// a walk on twos: stepA → pass → stepA mirrored (far legs lead) → pass; returns the pose and whether to mirror the legs
export function walkPose(stepIndex) { return ['stepA', 'pass', 'stepB', 'pass'][stepIndex % 4]; }
export const runPose = i => (i % 2 ? 'runIn' : 'runOut');
// stepB = stepA with near/far legs swapped
P.stepB = { ...P.stepA, fn: P.stepA.ff.map(([x, y, w], i) => [x + 22, y, P.stepA.fn[i][2]]), ff: P.stepA.fn.map(([x, y, w], i) => [x - 22, y, P.stepA.ff[i][2]]),
  hn: P.stepA.hf.map(([x, y, w], i) => [x + 20, y, P.stepA.hn[i][2]]), hf: P.stepA.hn.map(([x, y, w], i) => [x - 20, y, P.stepA.hf[i][2]]) };

// speed lines + a faint smear of the previous drawing, for runs and whips
export function smear(g, x, y, k = 1, len = 260) {
  g.save(); g.globalAlpha = .55 * k; g.strokeStyle = '#FFFFFF'; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const yy = y - 120 - i * 52 - (i % 2) * 18, xx = x - 320 - (i % 3) * 40; g.lineWidth = 6 - (i % 3); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - len * (.6 + .4 * ((i * 7) % 5) / 5), yy); g.stroke(); }
  g.restore();
}
