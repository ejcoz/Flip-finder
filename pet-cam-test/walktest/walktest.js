// Walk-cycle test: walk in, slow to a stop, look at the camera with a tilt, trot off.
import * as A from './art.js';
const cv = document.getElementById('c'), g = cv.getContext('2d');
const SC = 1.05, X0 = 60, DUR = 9;
const ease = t => (t = Math.max(0, Math.min(1, t)), t * t * (3 - 2 * t));
// speed profile (screen px/s): walk 1.05 strides/s, ease to a stop, stand, then trot
const vWalk = A.GAIT.walk.stride * SC * 1.0, vTrot = A.GAIT.trot.stride * SC * 1.7;
function speed(t) {
  if (t < 2.4) return vWalk;
  if (t < 3.0) return vWalk * (1 - ease((t - 2.4) / .6));
  if (t < 6.4) return 0;
  return vTrot * ease((t - 6.4) / .5);
}
function state(t) {   // integrate distance in small fixed steps (deterministic, any frame on its own)
  let d = 0, dw = 0, dt2 = 0; const h = 1 / 240;
  for (let s = 0; s < t; s += h) { const v = speed(s) * Math.min(h, t - s); d += v; if (s < 6.4) dw += v; else dt2 += v; }
  return { x: X0 + d, dw, dt: dt2 };
}
window.DUR = DUR;
window.render = (t) => {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0);
  A.park();
  const { x, dw, dt } = state(t), trot = t >= 6.4;
  const gait = t < 3.0 ? 'walk' : trot ? 'trot' : 'stand';
  const phase = trot ? dt / (A.GAIT.trot.stride * SC) : dw / (A.GAIT.walk.stride * SC);
  const look = ease((t - 3.2) / .4) * (1 - ease((t - 6.1) / .3)), tilt = -.3 * ease((t - 4.0) / .25) * (1 - ease((t - 6.1) / .3));
  g.save(); g.translate(x, 1640); g.scale(SC, SC);
  A.dogSide(0, 0, { gait, phase: gait === 'stand' ? 0 : phase, look, tilt, wag: Math.sin(t * (trot ? 16 : 9)) * (trot ? .5 : .25), blink: ((t + .4) % 3.1) < .12 ? 1 : 0 });
  g.restore();
  A.grass(1660, 1740, 40, '#5DAA55', 11, Math.sin(t * 1.3));
  g.fillStyle = 'rgba(8,14,28,.6)'; g.fillRect(0, 0, 1080, 140); g.fillStyle = '#F2F5FF'; g.font = '700 44px sans-serif'; g.fillText('WALK TEST  ' + gait.toUpperCase(), 40, 90);
};
window.render(0); window.READY = true;
