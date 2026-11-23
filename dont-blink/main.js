// main.js — "Don't Blink" (Pixel Countdown Science). Every timing lives in TL; picture, sound events and text checks read it.
import { W, H, C, FB, LUT, makeOut, whiten, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum } from './font.js';
import { eye, tear, filmGauge } from './eye.js';
import { ground } from './scene.js';

const FPS = 30;
const TL = { go: 3.0, count: 15, silence: 17.5, blink: 18.0, rate: 18.6, hour: 22.2, split: 26.4, cta: 30.0, dur: 34.2 };
const END = TL.go + TL.count;                       // 18.0: counter reaches 0
const SECS = []; for (let i = 0; i <= TL.count; i++) SECS.push(TL.go + i);   // 3.0 … 18.0

const CAPS = [
  { t0: 0, t1: TL.go, l: ["DON'T *BLINK*", 'FOR 15 SECONDS'] },
  { t0: TL.go, t1: 6.8, l: ['YOUR EYE IS COATED', 'IN A *TEAR FILM*'] },
  { t0: 6.8, t1: 10.6, l: ['IT LASTS ABOUT', '*10 SECONDS*'] },
  { t0: 10.6, t1: 14.4, l: ['THEN IT *BREAKS UP*', 'AND STARTS TO STING'] },
  { t0: 14.4, t1: TL.blink, l: ['HOLD IT…'] },
  { t0: TL.blink, t1: TL.rate, l: ['*BLINK!*'], pass: true },
  { t0: TL.rate, t1: TL.hour, l: ['YOU BLINK *15-20*', 'TIMES A MINUTE'] },
  { t0: TL.hour, t1: TL.split, l: ['THAT\'S *~1 HOUR* A DAY', 'EYES SHUT'], f: 'YOUR BRAIN HIDES IT' },
  { t0: TL.split, t1: TL.cta, l: ['ON SCREENS YOU BLINK', '*3× LESS*'] },
  { t0: TL.cta, t1: TL.dur, l: ['DID YOU MAKE IT?', '*SEND THIS* TO A', 'SCREEN STARER'] },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

// blinks (lid closes) after the challenge
const CALM_BL = [19.4, 21.0, 22.9, 25.1];
const TALK_BL = [26.9, 28.0, 29.1], SCREEN_BL = [28.6];
const dryAt = t => t < TL.go ? 0 : t < TL.blink ? eio(seg(t, 6.0, 16.5)) : Math.max(0, 1 - (t - TL.blink) / .25) * 1;
const filmAt = t => t < TL.go ? 1 : t < TL.blink ? 1 - seg(t, 4.0, 14.0) : clamp((t - TL.blink - .1) / .35, 0, 1);

const EV = [];
EV.push({ t: 0, type: 'bed', dur: TL.silence, rise: [TL.go, TL.silence] });
EV.push({ t: .05, type: 'hook' });
for (const c of CAPS) if (c.t0 > 0 && c.t0 !== TL.blink) EV.push({ t: c.t0, type: 'blip' });
SECS.slice(0, -1).forEach((t, i) => EV.push({ t, type: 'tick', n: TL.count - i, loud: i >= 12 }));
for (let t = 10.8; t < TL.silence; t += .45) EV.push({ t: +t.toFixed(2), type: 'crackle', v: seg(t, 10.6, 17) });
EV.push({ t: TL.silence, type: 'silence', dur: TL.blink - TL.silence });
EV.push({ t: TL.blink, type: 'blink_big' });
EV.push({ t: TL.blink + .05, type: 'relief' });
EV.push({ t: TL.rate, type: 'bed', dur: TL.dur - TL.rate, rise: null });
CALM_BL.forEach(t => EV.push({ t, type: 'lid', pan: 0 }));
EV.push({ t: TL.hour, type: 'reveal' });
EV.push({ t: TL.split, type: 'whoosh' });
TALK_BL.forEach(t => EV.push({ t, type: 'lid', pan: -.5 }));
SCREEN_BL.forEach(t => EV.push({ t, type: 'lid', pan: .5 }));
EV.push({ t: TL.cta, type: 'whoosh' });
// music: a continuous 120 bpm chip groove (each count second = 2 beats), cut dead for the silence, impact on BLINK
const P1 = [[50, 'min'], [46, 'maj'], [53, 'maj'], [48, 'maj']], P2 = [[53, 'maj'], [48, 'maj'], [50, 'min'], [46, 'maj']];
EV.push({ t: 0, type: 'music', sections: [
  { t0: 0, t1: TL.go, origin: -1, prog: P1, layers: ['kick', 'bass', 'pad'] },
  { t0: TL.go, t1: 10.6, origin: -1, prog: P1, layers: ['kick', 'bass', 'pad', 'hat'] },
  { t0: 10.6, t1: 14.4, origin: -1, prog: P1, layers: ['kick', 'bass', 'pad', 'hat', 'arp', 'snare'] },
  { t0: 14.4, t1: TL.silence, origin: -1, prog: P1, layers: ['kick', 'bass', 'pad', 'hat', 'arp', 'build'] },
  { t0: TL.blink, t1: TL.split, origin: TL.blink, prog: P2, layers: ['impact', 'kick', 'bass', 'pad', 'hat', 'snare', 'arp'] },
  { t0: TL.split, t1: TL.cta, origin: TL.blink, prog: P2, layers: ['half', 'kick', 'bass', 'pad', 'arp'] },
  { t0: TL.cta, t1: TL.dur - .4, origin: TL.cta, prog: P2, layers: ['impact', 'kick', 'bass', 'pad', 'hat', 'snare', 'lead'],
    lead: [[77, 1], [81, 1], [84, 1], [81, .5], [79, .5], [77, 1], [76, 1], [74, 1], [77, 1]] },
] });
window.EV = EV; window.DUR = TL.dur;

// lid openness from a list of blink times (close .07, hold .05, open .16)
function openAt(t, list) {
  let o = 1;
  for (const b of list) { const d = t - b; if (d < 0 || d > .3) continue;
    o = Math.min(o, d < .07 ? 1 - d / .07 : d < .12 ? 0 : (d - .12) / .16); }
  return clamp(o, 0, 1);
}
const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);

const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.cyan]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  const big = c.l[0] === '*BLINK!*';
  c.l.forEach((s, i) => lineC(fb, s, W / 2, big ? 40 : y + i * 19, big ? 5 : 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3, 1, PAL);
}
function halo(cx, cy, r, t) {
  const br = Math.sin(t * Math.PI) * .25;
  fb.glow(cx, cy, r * .3, r * (.86 + br * .08), [C.g4, C.plum, C.rose, C.pink], 0, new Set([C.g0, C.g1, C.g2, C.g3, C.g4]));
}
function sparkles(cx, cy, t) {
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t * 1.4, r = 46 + Math.sin(t * 6 + i) * 3; if (((t * 12 + i) | 0) % 2) { fb.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .45, C.yL); } }
}

// One full "eye + tear + gauge" frame. k = zoom (redrawn), shake px
function eyeScene(t, { k = 1, open = 1, dry = 0, shake = 0, expr = 'calm', film = 1, noBlink = false, look = 0, gauge = true }) {
  const sx = shake ? Math.round((hash((t * FPS) | 0, 1) - .5) * 2 * shake) : 0, sy = shake ? Math.round((hash((t * FPS) | 0, 2) - .5) * 2 * shake) : 0;
  const ex = W / 2 + sx, ey = 280 + sy, a = 112 * k, b = 66 * k;
  halo(ex, ey, a * 1.05, t);
  const E = eye(fb, ex, ey, a, b, open, dry, t, look);
  // the tear sits on the lower lid, left of centre; shrinks as the film dries
  const r = Math.round(31 * (1 - .3 * (1 - film)) * Math.min(1.15, k));
  const tx = ex - Math.round(a * .38), ty = Math.round(E.lowY(tx) + r * .75);
  tear(fb, tx, ty, r, expr, t, { noBlink, look: expr === 'strain' ? 1 : 0 });
  if (gauge) { lineC(fb, 'TEAR FILM', W / 2, 418, 1, PAL); filmGauge(fb, W / 2, 430, 130, film, t); }
  return E;
}

function render(t) {
  let lut = LUT.full, bloom = .12;
  fb.clear(C.g0);
  ground(fb, t);

  if (t < TL.split || t >= TL.cta) {
    const cta = t >= TL.cta;
    const tt = cta ? t - TL.cta : t;          // the CTA returns to the opening frame
    const push = cta ? 0 : eo(seg(t, 10.6, 11.3)) - eo(seg(t, 14.4, 15.0)) * .4 - eo(seg(t, TL.blink, TL.blink + .5)) * .6;
    const k = 1 + .18 * clamp(push, 0, 1);
    const live = !cta && t >= TL.go && t < TL.blink;
    const dry = cta ? 0 : dryAt(t);
    let open = 1;
    if (!cta && t >= TL.blink) open = openAt(t, [TL.blink, ...CALM_BL]);
    const shake = live ? (t > 14.4 ? 2 : t > 10.6 ? 1 : 0) : 0;
    let expr = cta ? (tt > 1.2 && tt < 1.6 ? 'wink' : 'happy') : t < TL.go ? 'happy' : t < 6.8 ? 'calm' : t < 10.6 ? 'sweat' : t < TL.blink ? 'strain' : t < TL.hour ? 'happy' : 'wow';
    if (!cta && t >= TL.blink && t < TL.blink + .4) expr = 'wow';
    eyeScene(t, { k, open, dry, shake, expr, film: cta ? 1 : filmAt(t), noBlink: t < TL.blink, look: live ? Math.round(Math.sin(t * 7) * (t > 14.4 ? 2 : 0)) : 0 });
    // counter band
    const ny = 120;
    if (!cta && t < TL.blink + .01) {
      const n = t < TL.go ? 15 : Math.max(0, TL.count - Math.floor(t - TL.go + 1e-6));
      const pop = SECS.some(s => t >= s && t < s + 2 / FPS) && t >= TL.go;
      bigNum(fb, String(n), W / 2, ny - (pop ? 3 : 0), pop ? 6 : 5, YEL);
      lineC(fb, 'SECONDS', W / 2, ny + 42, 1, PAL);
    } else if (!cta && t >= TL.rate && t < TL.hour) {
      bigNum(fb, '17', W / 2, ny, 5, YEL); lineC(fb, 'BLINKS / MIN', W / 2, ny + 42, 1, PAL);
    } else if (!cta && t >= TL.hour) {
      bigNum(fb, '1 HR', W / 2, ny, 5, YEL); lineC(fb, 'PER DAY, EYES SHUT', W / 2, ny + 42, 1, PAL);
      sparkles(W / 2, ny + 18, t);
    } else if (cta) {
      bigNum(fb, '15', W / 2, ny, 5, YEL); lineC(fb, 'SECONDS', W / 2, ny + 42, 1, PAL);
    }
    drawCaption(t);
    // the blink itself: white flash for 3 frames as the lid reopens
    if (!cta && t >= TL.blink + .12 && t < TL.blink + .12 + 3 / FPS) lut = whiten(LUT.full, .75 - (t - TL.blink - .12) * FPS / 4);
    if (t >= TL.silence && t < TL.blink) bloom = 0;
  } else {
    // —— Split verdict: talking vs screen ——
    const k = eo(seg(t, TL.split, TL.split + .45));
    const sets = [[-1, TALK_BL, 'TALKING', '22'], [1, SCREEN_BL, 'SCREEN', '7']];
    for (const [side, bl, lab, num] of sets) {
      const ex = Math.round(W / 2 + side * lerp(0, 68, k)), ey = Math.round(lerp(280, 270, k)), a = lerp(112, 58, k), b = lerp(66, 36, k);
      const dryS = side > 0 ? .45 + .1 * Math.sin(t * 3) : 0;
      halo(ex, ey, a * 1.1, t);
      const E = eye(fb, ex, ey, a, b, openAt(t, bl), dryS, t);
      tear(fb, ex - Math.round(a * .1), Math.round(E.lowY(ex) + 16), 13, side > 0 ? 'sweat' : 'happy', t, { blinkOff: side });
      if (k > .9) {
        lineC(fb, lab, ex, 340, 1, PAL);
        bigNum(fb, num, ex, 178, 3, YEL); lineC(fb, '/MIN', ex, 204, 1, PAL);
      }
    }
    if (k > .9) for (let y = 170; y < 360; y++) if ((y >> 2) & 1) fb.px(W / 2, y, C.g4);
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
