// main.js — "The Sun Is Shrinking" (Pixel Countdown Science). Every timing lives in TL; picture, sound events and text checks read it.
import { W, H, C, FB, LUT, makeOut, whiten, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum } from './font.js';
import { sky, sun, cutaway, earth, pyramid } from './sun.js';

const FPS = 30;
const TL = { go: 3.6, count: 10, stop: 13.6, reveal: 14.1, fuel: 18.0, light: 21.8, core: 26.0, cta: 30.6, dur: 35.4 };
const RATE = 4.3;                                                    // million tonnes per second (L/c² ≈ 4.26e9 kg/s)
const SECS = []; for (let i = 1; i <= TL.count; i++) SECS.push(+(TL.go + i).toFixed(2));   // counter steps
const PYR = []; for (let i = 0; i < 7; i++) PYR.push(+(TL.go + 1.39 * (i + 1)).toFixed(2)); // one Great Pyramid (~5.9 Mt) per ~1.39 s
const SLOTS = [[-43, 452], [-14, 452], [15, 452], [44, 452], [-29, 433], [0, 433], [29, 433]];
const PHOTON = [TL.light + .5, TL.light + 3.4];
const WALK = [TL.core + .4, TL.cta - .5];

const CAPS = [
  { t0: 0, t1: TL.go, l: ['THE SUN IS *SHRINKING*', 'COUNT 10 SECONDS'] },
  { t0: TL.go, t1: 7.0, l: ['IT LOSES *4 MILLION*', 'TONNES A SECOND'] },
  { t0: 7.0, t1: 10.3, l: ['MASS BECOMES *LIGHT*'] },
  { t0: 10.3, t1: TL.stop, l: ["A *PYRAMID'S* WORTH", 'EVERY 1.4 SEC'] },
  { t0: TL.stop, t1: TL.reveal, l: ['*STOP!*'], pass: true },
  { t0: TL.reveal, t1: TL.fuel, l: ['*43 MILLION TONNES*', 'GONE AS YOU COUNTED'] },
  { t0: TL.fuel, t1: TL.light, l: ['RELAX: IT HAS FUEL', 'FOR *5 BILLION* YEARS'] },
  { t0: TL.light, t1: TL.core, l: ['THE LIGHT ON YOUR FACE', 'LEFT IT *8 MIN* AGO'] },
  { t0: TL.core, t1: TL.cta, l: ['BUT THAT ENERGY TOOK', '*~100,000 YEARS*', 'TO ESCAPE THE CORE'] },
  { t0: TL.cta, t1: TL.dur, l: ['NEXT SUNRISE, SAY HI', 'TO *ANCIENT ENERGY*'], f: 'SEND TO A FRIEND' },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

const EV = [];
EV.push({ t: 0, type: 'bed', dur: TL.stop });
EV.push({ t: .05, type: 'hook' });
for (const c of CAPS) if (c.t0 > 0 && c.t0 !== TL.stop) EV.push({ t: c.t0, type: 'blip' });
EV.push({ t: TL.go, type: 'tick', n: 0 });
SECS.slice(0, -1).forEach((t, i) => EV.push({ t, type: 'tick', n: i + 1 }));
PYR.forEach(t => EV.push({ t: +(t + .5).toFixed(2), type: 'thunk' }));
EV.push({ t: TL.stop, type: 'stop' });
EV.push({ t: TL.stop + .02, type: 'silence', dur: TL.reveal - TL.stop - .02 });
EV.push({ t: TL.reveal, type: 'reveal' });
EV.push({ t: TL.reveal, type: 'bed', dur: TL.dur - TL.reveal });
EV.push({ t: TL.light, type: 'whoosh' });
EV.push({ t: PHOTON[0], type: 'photon', dur: PHOTON[1] - PHOTON[0] });
EV.push({ t: PHOTON[1], type: 'arrive' });
EV.push({ t: TL.core, type: 'whoosh' });
for (let t = WALK[0]; t < WALK[1]; t += .09) EV.push({ t: +t.toFixed(2), type: 'bounce', k: seg(t, WALK[0], WALK[1]) });
EV.push({ t: WALK[1], type: 'escape' });
EV.push({ t: TL.cta, type: 'whoosh' });
EV.push({ t: TL.cta + .1, type: 'melody' });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.sL, C.sB, C.cyan]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  const big = c.l[0] === '*STOP!*';
  c.l.forEach((s, i) => lineC(fb, s, W / 2, big ? 40 : y + i * 19, big ? 5 : 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3, 1, PAL);
}
function pulseAt(t) { let p = 0; for (const s of [TL.go, ...SECS]) { const d = t - s; if (d >= 0 && d < .35) p = Math.max(p, 1 - d / .35); } return p; }
function pile(t, cx, upto) {
  let n = 0;
  PYR.forEach((p, i) => {
    if (t < p) return;
    const [sx, sy] = SLOTS[i], k = eo(seg(t, p, p + .5));
    const x = Math.round(lerp(cx + (i % 2 ? 40 : -40), 135 + sx, k)), y = Math.round(lerp(345, sy, k) - Math.sin(k * Math.PI) * 24);
    if (k >= 1) n++;
    if (y <= upto) pyramid(fb, x, y, 2);
  });
  return n;
}
function halo(cx, cy, r, t) {
  const br = Math.sin(t * Math.PI) * .25;
  fb.glow(cx, cy, r * .3, r * (.86 + br * .06), [C.g3, C.g4, C.plum, C.sE, C.sD], 0, new Set([C.g0, C.g1, C.g2, C.g3, C.g4, C.steel, C.white, C.silver]));
}
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function render(t) {
  let lut = LUT.full, bloom = .16;
  fb.clear(C.g0);
  sky(fb, t, t * 2);
  const ny = 110;

  if (t < TL.light || t >= TL.cta) {
    const cta = t >= TL.cta;
    const live = !cta && t >= TL.go && t < TL.stop;
    const p = live ? pulseAt(t) : 0;
    const lost = cta ? 0 : clamp((t - TL.go) / TL.count, 0, 1);
    const r = Math.round(72 - lost * 2);                               // a (very exaggerated) 2 px of shrinking
    const expr = cta ? (mod(t - TL.cta, 3) > 1.6 && mod(t - TL.cta, 3) < 2.0 ? 'happy' : 'calm') : t < 1.4 ? 'calm' : t < TL.go ? 'wow' : t < 10.3 ? 'calm' : t < TL.stop ? 'sweat' : t < TL.reveal ? 'wow' : t < TL.fuel ? 'strain' : 'happy';
    halo(W / 2, 280, r * 1.9, t);
    sun(fb, W / 2, 280, r, t, expr, p);
    // the pyramid pile (measuring prop)
    if (!cta) {
      const n = pile(t, W / 2, H);
      if (n > 0 || t >= TL.go) lineC(fb, `PYRAMIDS: *${n}*`, W / 2, 463, 1, PAL);
    }
    // counter
    if (!cta && t < TL.reveal) {
      const steps = t < TL.go ? 0 : Math.min(TL.count, Math.floor(t - TL.go + 1e-6));
      const v = steps * RATE, s = steps === TL.count ? '43' : v.toFixed(1);
      const pop = live && SECS.some(x => t >= x && t < x + 2 / FPS);
      bigNum(fb, s, W / 2, ny - (pop ? 3 : 0), pop ? 6 : 5, YEL);
      lineC(fb, 'MILLION TONNES', W / 2, ny + 42, 1, PAL);
      if (t >= TL.go && t < TL.stop) { const left = Math.max(0, Math.ceil(TL.stop - t - 1e-6)); lineC(fb, `*0:${String(left).padStart(2, '0')}*`, W / 2, ny - 14, 1, PAL); }
      if (live) for (const x of SECS) { const d = t - x; if (d >= 0 && d < .4) lineC(fb, '*+4.3*', W / 2 + 62, Math.round(ny + 8 - d / .4 * 8), 1, PAL); }
    } else if (!cta && t < TL.fuel) {
      bigNum(fb, '43', W / 2, ny, 5, YEL); lineC(fb, 'MILLION TONNES', W / 2, ny + 42, 1, PAL);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t * 1.4, rr = 46 + Math.sin(t * 6 + i) * 3; if (((t * 12 + i) | 0) % 2) fb.px(W / 2 + Math.cos(a) * rr, ny + 18 + Math.sin(a) * rr * .45, C.yL); }
    } else if (!cta) {
      bigNum(fb, '5', W / 2, ny, 5, YEL); lineC(fb, 'BILLION YEARS LEFT', W / 2, ny + 42, 1, PAL);
    } else {
      bigNum(fb, '0.0', W / 2, ny, 5, YEL); lineC(fb, 'MILLION TONNES', W / 2, ny + 42, 1, PAL);
    }
    drawCaption(t);
    if (t >= TL.reveal && t < TL.reveal + 3 / FPS) lut = whiten(LUT.full, .75 - (t - TL.reveal) * FPS / 4);
    if (t >= TL.stop && t < TL.reveal) bloom = 0;
  } else if (t < TL.core) {
    // —— Pull back: Sun → Earth, the photon's 8 min 20 s trip ——
    const k = eio(seg(t, TL.light, TL.light + .6));
    const sx = lerp(W / 2, 46, k), sr = lerp(70, 34, k), ex = 228, ey = 300;
    halo(sx, 300, sr * 1.9, t);
    sun(fb, sx, 300, sr, t, k > .9 ? (t > PHOTON[1] ? 'happy' : 'calm') : 'calm', 0);
    if (k > .5) earth(fb, ex, ey, 11, t);
    if (k > .9) lineC(fb, 'YOU ARE HERE', ex, ey + 18, 1, PAL);
    const pr = clamp((t - PHOTON[0]) / (PHOTON[1] - PHOTON[0]), 0, 1);
    const x0 = sx + sr + 6, x1 = ex - 13, px = Math.round(lerp(x0, x1, pr));
    if (t >= PHOTON[0]) {
      for (let x = Math.round(x0); x < px; x++) if (((x + ((t * 30) | 0)) & 3) === 0) fb.px(x, ey, C.sL);
      if (pr < 1) { fb.disc(px, ey, 2, C.white); fb.px(px - 3, ey, C.sL); }
      else if (t < PHOTON[1] + .25) { fb.disc(ex, ey, 14 + (t - PHOTON[1]) * 20, C.white); earth(fb, ex, ey, 11, t); }
    }
    const secs = Math.round(pr * 500), m = Math.floor(secs / 60), s = secs % 60;
    bigNum(fb, `${m}:${String(s).padStart(2, '0')}`, W / 2, ny + 40, 5, YEL);
    lineC(fb, 'MINUTES OF TRAVEL', W / 2, ny + 82, 1, PAL);
    if (t >= PHOTON[1] && t < PHOTON[1] + 3 / FPS) lut = whiten(LUT.full, .5);
    drawCaption(t);
  } else {
    // —— Cut-away: a photon's random walk out of the core ——
    const k = eo(seg(t, TL.core, TL.core + .6));
    const cx = lerp(46, 120, k), r = lerp(34, 104, k), cy = 300;
    halo(cx, cy, r * 1.7, t);
    sun(fb, cx, cy, r, t, 'wow', 0, { cut: k > .2 });
    const pr = clamp((t - WALK[0]) / (WALK[1] - WALK[0]), 0, 1);
    if (k > .2) {
      cutaway(fb, cx, cy, r, pr, t);
      lineC(fb, 'CORE', cx + 14, cy + 18, 1, PAL);
      lineC(fb, 'SURFACE', Math.min(W - 26, cx + r - 6), cy + r - 2, 1, PAL);
    }
    const yrs = Math.round(pr * 100) * 1000;
    bigNum(fb, fmt(yrs), W / 2, ny + 24, 4, YEL);
    lineC(fb, 'YEARS', W / 2, ny + 58, 1, PAL);
    drawCaption(t);
  }

  out.present(fb, lut);
  out.show(fb, BLOOM, bloom);
}

window.render = render;
window.TEXTS = t => {
  const c = capAt(t); if (!c) return [];
  return [{ id: 'cap' + c.t0, pass: !!c.pass, text: c.l.map(s => s.replace(/\*/g, '')).join(' ') + (c.f ? ' ' + c.f : ''), x0: 0, y0: 100, x1: W * 4, y1: (30 + c.l.length * 19 + 14) * 4 }];
};
window.READY = true;
