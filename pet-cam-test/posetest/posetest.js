// Limited-animation test: walk in pose-to-pose, stop and look at the camera, tilt, then run off with smears.
import * as A from './art.js';
import { dogProfile, walkPose, runPose, smear } from './dogpose.js';
const cv = document.getElementById('c'), g = cv.getContext('2d');
const SC = .9, DUR = 8;
const ease = t => (t = Math.max(0, Math.min(1, t)), t * t * (3 - 2 * t));
const HOLD = 2 / 15;   // each drawing held ~0.13 s (≈ 7.5 drawings a second)
window.DUR = DUR;
window.render = (t) => {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0);
  A.park();
  let x, pose, look = 0, tilt = 0, run = false;
  if (t < 2.6) { x = -200 + 300 * Math.min(t, 2.4) + 300 * .6 * Math.max(0, Math.min(t - 2.4, .2) / .2) * .1; pose = t < 2.4 ? walkPose(Math.floor(t / HOLD)) : 'stand'; x = -200 + 300 * (t < 2.4 ? t : 2.4 + (1 - Math.pow(1 - (t - 2.4) / .2, 2)) * .1); }
  else if (t < 5.2) { x = -200 + 300 * 2.5; pose = 'stand'; look = ease((t - 2.8) / .3) * (1 - ease((t - 4.9) / .25)); tilt = -.3 * ease((t - 3.4) / .2) * (1 - ease((t - 4.9) / .25)); }
  else { const u = t - 5.2; x = -200 + 300 * 2.5 + 180 * u + 700 * u * u; pose = u < .25 ? 'stepA' : runPose(Math.floor(u / (HOLD * .75))); run = u > .25; }
  if (run) smear(g, x, 1640, Math.min(1, (t - 5.45) / .2));
  g.save(); g.translate(x, 1640); g.scale(SC, SC);
  dogProfile(g, 0, 0, { pose, look, tilt, wag: Math.sin(Math.floor(t * 15) / 15 * 12) * .25, blink: ((t + .4) % 3.1) < .12 ? 1 : 0 });
  g.restore();
  A.grass(1680, 1760, 30, '#5DAA55', 11, Math.sin(t * 1.3));
};
window.render(0); window.READY = true;
