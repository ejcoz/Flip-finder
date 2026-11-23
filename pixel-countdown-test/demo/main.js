// main.js — "Count Your Pulse" (Pixel Countdown Science demo). Every timing lives in TL below; picture, sound events and text checks read it.
import { W, H, C, FB, LUT, makeOut, whiten, bayer, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum, textW } from './font.js';
import { heart } from './hero.js';
import { ground, shadow, ecgPlane, ribs, gauge } from './scene.js';

const FPS = 30;
const TL = {
  go: 3.4, countDur: 15, bpm: 72, firstBeat: 3.8,
  stop: 18.4, silence: .5, eq: 18.9, split: 21.8, tilt: 25.4, dur: 29.5,
};
const BEATI = 60 / TL.bpm;
const BEATS = []; for (let t = TL.firstBeat; t < TL.stop - .2; t += BEATI) BEATS.push(+t.toFixed(3));   // 18 beats
const NBEAT = BEATS.length;
const SPRINT = []; for (let t = TL.split + .3; t < TL.tilt; t += 60 / 180) SPRINT.push(+t.toFixed(3));
const REST = []; for (let t = TL.split + .3; t < TL.tilt; t += 60 / 66) REST.push(+t.toFixed(3));

const CAPS = [
  { t0: 0, t1: TL.go, l: ['FIND YOUR *PULSE*'], f: 'FINGERS ON WRIST' },
  { t0: TL.go, t1: 7.2, l: ['GO! COUNT', 'EVERY *THUMP*'] },
  { t0: 7.2, t1: 11.0, l: ['EACH BEAT PUSHES', '*70 ML* OF BLOOD'], f: '(AT REST)' },
  { t0: 11.0, t1: 14.8, l: ['THAT SURGE IS THE', '*PULSE* YOU FEEL'] },
  { t0: 14.8, t1: TL.stop, l: ['KEEP COUNTING…'] },
  { t0: TL.stop, t1: TL.eq, l: ['*STOP!*'] },
  { t0: TL.eq, t1: TL.split, l: [`*${NBEAT}* BEATS × 4`, `= *${NBEAT * 4}* BPM`] },
  { t0: TL.split, t1: TL.tilt, l: ['RESTING: *60-100*', 'SPRINTING: *~180*'] },
  { t0: TL.tilt + .3, t1: TL.dur, l: ['COUNT YOURS', '*BEFORE BED*'], f: 'CALMER = SLOWER' },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

// Sound events (exported by events.mjs)
const EV = [];
EV.push({ t: 0, type: 'bed', dur: TL.stop });
EV.push({ t: 1.6, type: 'wake' });
for (const c of CAPS) if (c.t0 > 0) EV.push({ t: c.t0, type: 'blip' });
EV.push({ t: TL.go, type: 'go' });
BEATS.forEach((t, i) => EV.push({ t, type: 'beat', n: i + 1 }));
EV.push({ t: TL.stop, type: 'stop' });
EV.push({ t: TL.stop + .02, type: 'silence', dur: TL.silence - .02 });
EV.push({ t: TL.eq, type: 'reveal' });
EV.push({ t: TL.eq, type: 'bed', dur: TL.dur - TL.eq });
REST.forEach(t => EV.push({ t, type: 'beat_soft', pan: -.5 }));
SPRINT.forEach(t => EV.push({ t, type: 'beat_fast', pan: .5 }));
EV.push({ t: TL.split, type: 'whoosh' });
EV.push({ t: TL.tilt, type: 'whoosh' });
EV.push({ t: TL.tilt + .3, type: 'melody' });
window.EV = EV; window.DUR = TL.dur;

// pump amount 0..1 from a beat list: fast squeeze, slower release
function pumpAt(t, list) {
  let p = 0; for (const b of list) { const d = t - b; if (d >= 0 && d < .5) p = Math.max(p, d < .08 ? d / .08 : 1 - (d - .08) / .42); }
  return clamp(p, 0, 1);
}
const countAt = t => BEATS.filter(b => b <= t).length;
const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);

const canvas = document.getElementById('c');
const out = makeOut(canvas);
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.hpink, C.white, C.eT, C.orange]);

function drawCaption(t, y = 34) {
  const c = capAt(t); if (!c) return;
  const big = c.l.length === 1 && c.l[0] === '*STOP!*';
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19, big ? 4 : 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3, 1, PAL);
}
function popScale(t, list, base) { // counter pop: one size step for 2 frames
  for (const b of list) if (t >= b && t < b + 2 / FPS) return base + 1; return base;
}
function plusOne(t, cx, cy) {
  for (const b of BEATS) { const d = t - b; if (d >= 0 && d < .4) { const y = Math.round(cy - d / .4 * 8); lineC(fb, '*+1*', cx, y, 1, PAL); } }
}
function halo(cx, cy, r, t, k = 1) {
  const br = Math.sin(t * Math.PI) * .25;   // 2 s breathing
  fb.glow(cx, cy, r * .3, r * (.86 + br * .08) * k, [C.g4, C.plum, C.crimson, C.clay, C.orange], 0, new Set([C.g0, C.g1, C.g2, C.g3, C.g4]));
}
function pressureRing(t, cx, cy, r0) {
  for (const b of BEATS) { const d = t - b; if (d < 0 || d > .6) continue;
    const r = r0 + d * 110; for (let a = 0; a < 360; a += 1.2) { const A = a * Math.PI / 180; const x = cx + Math.cos(A) * r, y = cy + Math.sin(A) * r * .92; if (bayer(x | 0, y | 0) < 1 - d / .6) fb.px(x, y, C.g4); } }
}
function timer(t, cx, y) {
  const left = Math.max(0, Math.ceil(TL.go + TL.countDur - t - 1e-6));
  const s = `0:${String(left).padStart(2, '0')}`;
  const x0 = Math.round(cx - (textW(s, 1) + 10) / 2);
  // little clock glyph
  fb.disc(x0 + 3, y + 3, 3.2, C.ink); fb.disc(x0 + 3, y + 3, 2.2, C.white); fb.px(x0 + 3, y + 2, C.ink); fb.px(x0 + 3, y + 3, C.ink); fb.px(x0 + 4, y + 3, C.ink);
  lineC(fb, `*${s}*`, cx + 5, y, 1, PAL);
}

function render(t) {
  let lut = LUT.full, bloom = .14;
  fb.clear(C.g0);

  if (t < TL.split) {
    // —— Count section: locked centre, push-in during 11–14.8 ——
    const push = eo(seg(t, 11.0, 11.6)) - eo(seg(t, 14.8, 15.4));
    const pull = TL.eq <= t ? eio(seg(t, TL.eq, TL.eq + .6)) : 0;
    const size = Math.round(lerp(118, 158, push) - pull * 10);
    const cx = Math.round(lerp(108, 116, push)), cy = Math.round(lerp(300, 292, push));
    ground(fb, t);
    const live = t >= TL.go && t < TL.stop;
    const pump = live ? pumpAt(t, BEATS) : 0;
    ribs(fb, cx, 214 - Math.round(push * 14), 5, 46 + Math.round(push * 6), (Math.sin(t * 1.6) + 1) / 2);
    halo(cx, cy - 4, size * .95 + pump * 6, t);
    if (live && push > .5) pressureRing(t, cx, cy, size * .5);
    let expr = t < 1.6 ? 'sleepy' : t < 2.2 ? 'wake' : t < TL.go ? 'calm' : t < TL.stop ? (t > 14.8 ? 'strain' : 'calm') : t < TL.eq ? 'wow' : 'happy';
    const bob = live ? 0 : Math.round(Math.sin(t * 2.2) * 2);
    heart(fb, cx, cy + bob, size, pump, expr, t, { look: live ? 2 : 0 });
    // the measuring prop: a pulse gauge on a post, +1 per beat
    const n = countAt(t);
    const shown = t < TL.eq ? n : NBEAT;
    let fr = shown / 20; for (const b of BEATS) if (t >= b && t < b + .15) fr -= (1 - (t - b) / .15) / 20;
    const gx = 226, g = gauge(fb, gx, 150 + Math.round(push * 30), 448, clamp(fr, 0, 1), 20, 5, pump > .6);
    if (live) for (const b of BEATS) { const d = t - b; if (d >= 0 && d < .4) lineC(fb, '*+1*', gx + 26, Math.round(g.fillY - 2 - d / .4 * 8), 1, PAL); }
    // Zzz while asleep
    if (t < 1.6) for (let i = 0; i < 3; i++) { const p = mod(t * .8 + i / 3, 1); lineC(fb, 'Z', cx + 40 + Math.round(p * 14), Math.round(cy - 50 - p * 26), 1 + (i === 1 ? 1 : 0), PAL); }
    // counter, above the heart
    const ncx = cx, ny = 122;
    if (t >= TL.go && t < TL.eq) {
      const sc = popScale(t, BEATS, 5);
      bigNum(fb, String(n), ncx, ny - (sc - 5) * 3, sc, YEL);
      lineC(fb, 'BEATS', ncx, ny + 7 * 5 + 7, 1, PAL);
      timer(t, ncx, ny - 14);
    }
    if (t >= TL.eq) {
      bigNum(fb, String(NBEAT * 4), ncx, ny, 5, YEL); lineC(fb, 'BPM', ncx, ny + 42, 1, PAL);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 1.5, r = 34 + Math.sin(t * 6 + i) * 3; if (((t * 12 + i) | 0) % 2) fb.px(ncx + Math.cos(a) * r, ny + 18 + Math.sin(a) * r * .6, C.yL); }
    }
    drawCaption(t);
    if (t >= TL.eq && t < TL.eq + 3 / FPS) lut = whiten(LUT.full, 1 - (t - TL.eq) * FPS / 3);
    if (t >= TL.stop && t < TL.eq) bloom = 0;
  } else if (t < TL.tilt) {
    // —— Split verdict ——
    const k = eo(seg(t, TL.split, TL.split + .45));
    ground(fb, t);
    const off = Math.round(lerp(0, 66, k)), size = Math.round(lerp(108, 88, k));
    const L = { cx: W / 2 - off, cy: 300 }, R = { cx: W / 2 + off, cy: 300 };
    // divider
    ribs(fb, W / 2, 214, 5, 46, (Math.sin(t * 1.6) + 1) / 2);
    for (const [S, list, expr, lab, num] of [[L, REST, 'calm', 'REST', '66'], [R, SPRINT, 'sweat', 'SPRINT', '180']]) {
      halo(S.cx, S.cy - 3, size * .9, t, .9);
      heart(fb, S.cx, S.cy, size, pumpAt(t, list), expr, t, { blinkOff: lab.length });
      if (k > .9) { lineC(fb, lab, S.cx, S.cy + 62, 1, PAL);
        // live mini counter
        const n = list.filter(b => b <= t).length; lineC(fb, `*${n}*`, S.cx, S.cy - 72, 2, PAL); }
    }
    drawCaption(t);
  } else {
    // —— Pixel 3D tilt to the ECG plane ——
    const k = eio(seg(t, TL.tilt, TL.tilt + 1.4));
    const horizon = Math.round(lerp(H + 40, 250, k));
    ground(fb, t, Math.round(k * 60));
    ecgPlane(fb, horizon, t, 1.6, 150, t * 3.2);
    // heart rises to sit on the horizon like a sun
    const cy = Math.round(lerp(300, horizon - 54, k)), size = Math.round(lerp(108, 92, k));
    halo(W / 2, cy - 3, size * 1.05, t);
    const calm = [];  for (let b = TL.tilt; b < TL.dur; b += 60 / 60) calm.push(b);
    heart(fb, W / 2, cy, size, pumpAt(t, calm), t > TL.tilt + 1.6 ? 'happy' : 'calm', t);
    drawCaption(t);
    // end: 4-step palette fade to the ground in the last 0.4 s
    if (t > TL.dur - .4) lut = whiten(LUT.full, 0);
  }

  out.present(fb, lut);
  out.show(fb, BLOOM, bloom);
}

window.render = render;
window.TEXTS = t => {
  const c = capAt(t); if (!c) return [];
  const lines = c.l.map(s => s.replace(/\*/g, ''));
  const tx = [{ id: 'cap' + c.t0, pass: c.t0 === TL.stop, text: lines.join(' ') + (c.f ? ' ' + c.f : ''), x0: 0, y0: 30 * 4, x1: W * 4, y1: (34 + c.l.length * 19 + 12) * 4 }];
  return tx;
};
window.READY = true;
