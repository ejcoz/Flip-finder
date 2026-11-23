// main.js — "Paper to the Moon" (Pixel Countdown Science). Every timing lives in TL; picture, sound events and text checks read it.
import { W, H, C, FB, LUT, makeOut, whiten, darken, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum } from './font.js';
import { logScene, deskScene, moonShot } from './world.js';

const FPS = 30;
const TL = { go: 3.5, win: 3.5, sil: 21.0, moon: 21.5, record: 25.5, uni: 29.5, uniGo: 29.75, uniHit: 31.5, cta: 33.5, dur: 37.5 };
// folds: 5 windows of 3.5 s (7 beats at 120 bpm) holding 5, 7, 9, 10, 10 folds; fold 42 lands on the Moon, after the silence
const PER = [5, 7, 9, 10, 10]; const FOLDS = [];
PER.forEach((n, w) => { for (let j = 0; j < n; j++) FOLDS.push(Math.round((TL.go + w * TL.win + j * TL.win / n) / .0625) * .0625); });
FOLDS.push(TL.moon);                                                   // fold 42
const U0 = 43, U1 = 103;                                               // the universe burst: folds 43 … 103
const uFold = t => t < TL.uniGo ? 42 : Math.min(U1, 42 + Math.floor((t - TL.uniGo) / (TL.uniHit - TL.uniGo) * (U1 - 42) + 1e-6));
const foldsAt = t => t >= TL.uni ? uFold(t) : FOLDS.filter(f => f <= t).length;
const hOf = n => 1e-4 * Math.pow(2, n);                                // metres (a sheet is 0.1 mm)
function logHAt(t) {                                                   // eased log10(height): the scenery lurches down on every fold
  if (t >= TL.uni) { const f = t < TL.uniGo ? 42 : Math.min(U1, 42 + (t - TL.uniGo) / (TL.uniHit - TL.uniGo) * (U1 - 42)); return Math.log10(hOf(f)); }
  let n = 0, k = 1; FOLDS.forEach((f, i) => { if (f <= t) { n = i + 1; const gap = (FOLDS[i + 1] ?? f + 1) - f; k = eo(clamp((t - f) / Math.min(.2, gap * .7), 0, 1)); } });
  return Math.log10(hOf(n - 1 + k));
}
function fmt(h) {
  const c = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','), d1 = n => n < 10 ? n.toFixed(1) : c(n);
  if (h < .01) return d1(h * 1000) + ' MM'; if (h < 1) return d1(h * 100) + ' CM'; if (h < 1000) return d1(h) + ' M';
  const big = (v, u) => { for (const [s, w] of [[1e12, 'TRILLION'], [1e9, 'BILLION'], [1e6, 'MILLION']]) if (v >= s) return d1(v / s) + ' ' + w + ' ' + u; return d1(v) + ' ' + u; };
  const ly = h / 9.461e15; return ly >= 1 ? big(ly, 'LIGHT YEARS').replace('LIGHT YEARS', ly >= 1e6 ? 'LY' : 'LIGHT YEARS') : big(h / 1000, 'KM');
}

const CAPS = [
  { t0: 0, t1: TL.go, l: ['FOLD A PAPER', '*42 TIMES*. HOW TALL?'] },
  { t0: TL.go, t1: TL.go + 3.5, l: ['EACH FOLD *DOUBLES* IT'] },
  { t0: TL.go + 3.5, t1: TL.go + 7, l: ['FOLD 12: *KNEE HIGH*'] },
  { t0: TL.go + 7, t1: TL.go + 10.5, l: ['FOLD 21: A *SKYSCRAPER*'] },
  { t0: TL.go + 10.5, t1: TL.go + 14, l: ['FOLD 30: *OUTER SPACE*'] },
  { t0: TL.go + 14, t1: TL.sil, l: ['FOLD 32: PAST THE', '*SPACE STATION*'] },
  { t0: TL.moon, t1: TL.record, l: ['*THE MOON.*', '440,000 KM OF PAPER'] },
  { t0: TL.record, t1: TL.uni, l: ['THE REAL RECORD:', '*12 FOLDS*'], f: 'B. GALLIVAN, 2002' },
  { t0: TL.uni, t1: TL.cta, l: ['*103 FOLDS:* THE WHOLE', 'VISIBLE UNIVERSE'] },
  { t0: TL.cta, t1: TL.dur, l: ['GRAB A PAPER.', 'CAN YOU PASS *7 FOLDS*?'] },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

const EV = [];
for (const c of CAPS) if (c.t0 > 0 && c.t0 !== TL.moon) EV.push({ t: c.t0, type: 'blip' });
EV.push({ t: TL.go - .25, type: 'crease' });
FOLDS.forEach((t, i) => EV.push({ t, type: 'fold', n: i + 1 }));
EV.push({ t: TL.sil, type: 'silence', dur: TL.moon - TL.sil });
EV.push({ t: TL.record, type: 'whoosh' }); EV.push({ t: TL.uni, type: 'whoosh' }); EV.push({ t: TL.cta, type: 'whoosh' });
EV.push({ t: TL.cta + 1.2, type: 'crease' });
EV.push({ t: 0, type: 'score', TL, FOLDS, U0, U1 });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19, 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3, 1, PAL);
}
function counter(n, h, pop, label = 'FOLD') {
  lineC(fb, label, W / 2, 84, 1, PAL);
  bigNum(fb, String(n), W / 2, 96 - (pop ? 3 : 0), pop ? 6 : 5, YEL);
  if (h !== null) lineC(fb, fmt(h), W / 2, 140, 2, PAL);
}
const popAt = t => FOLDS.some(f => t >= f && t < f + 2 / FPS);
const pumpAt = t => { let p = 0; for (const f of FOLDS) { const d = t - f; if (d >= 0 && d < .25) p = Math.max(p, 1 - d / .25); } return p; };

function render(t) {
  let lut = LUT.full, bloom = .12;
  if (t < TL.go) {
    // —— hook: the sheet on the desk; it starts folding just before GO ——
    deskScene(fb, t, { mode: 'sheet', expr: t < 1.2 ? 'calm' : t < 2.4 ? 'happy' : 'wow', foldK: eio(seg(t, TL.go - .3, TL.go)) });
    counter(0, hOf(0), false, 'FOLDS');
  } else if (t < TL.moon) {
    // —— the climb: log-altitude view, one lurch per fold ——
    const n = foldsAt(t), lh = logHAt(t), w = Math.floor((t - TL.go) / TL.win);
    logScene(fb, t, lh, { pump: pumpAt(t), speed: [0, 0, .2, .55, 1][Math.min(4, w)] * (t < TL.sil ? 1 : 0), expr: n < 6 ? 'happy' : n < 22 ? (popAt(t) ? 'wow' : 'happy') : n < 32 ? 'wow' : 'strain', moonExpr: n > 40 ? 'wow' : 'calm' });
    counter(n, hOf(n), popAt(t));
    if (t >= TL.sil) { lut = darken(LUT.full, .5); bloom = 0; }       // the held breath before the Moon
  } else if (t < TL.record) {
    // —— pay-off: Earth, the Moon, and the paper between them ——
    moonShot(fb, t, seg(t, TL.moon, TL.moon + .35));
    counter(42, hOf(42), t < TL.moon + 2 / FPS);
    if (t < TL.moon + 3 / FPS) lut = whiten(LUT.full, .75 - (t - TL.moon) * FPS / 4);
  } else if (t < TL.uni) {
    // —— reality check: the record is 12 folds ——
    deskScene(fb, t, { mode: 'block', shake: 1 });
    counter(12, hOf(12), false, 'RECORD FOLD');
  } else if (t < TL.cta) {
    // —— the universe burst: folds 43 → 103 in under two seconds ——
    const n = foldsAt(t), lh = logHAt(t), run = t >= TL.uniGo && t < TL.uniHit;
    logScene(fb, t, lh, { pump: run ? .5 + .5 * Math.sin(t * 60) : 0, speed: run ? 1.6 : 0, expr: 'wow' });
    counter(n, hOf(n), run && ((t * FPS) | 0) % 2 === 0);
    if (t >= TL.uniHit && t < TL.uniHit + 3 / FPS) lut = whiten(LUT.full, .75 - (t - TL.uniHit) * FPS / 4);
  } else {
    // —— CTA: back on the desk; the sheet winks ——
    const tt = t - TL.cta;
    deskScene(fb, t, { mode: 'sheet', expr: tt > 1.2 && tt < 1.7 ? 'happy' : 'calm', foldK: 0 });
    counter(7, null, false, 'CAN YOU PASS FOLD');
    if (t > TL.dur - .3) lut = darken(LUT.full, (t - (TL.dur - .3)) / .3);
  }
  drawCaption(t);
  out.present(fb, lut);
  out.show(fb, BLOOM, bloom);
}

window.render = render;
window.TEXTS = t => {
  const c = capAt(t); if (!c) return [];
  return [{ id: 'cap' + c.t0, text: c.l.map(s => s.replace(/\*/g, '')).join(' ') + (c.f ? ' ' + c.f : ''), x0: 0, y0: 100, x1: W * 4, y1: (30 + c.l.length * 19 + 14) * 4 }];
};
window.READY = true;
