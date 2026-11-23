// main.js — "23 People" (Pixel Countdown Science): the birthday paradox. Every timing lives in TL.
import { W, H, C, FB, LUT, makeOut, whiten, darken, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum } from './font.js';
import { room, web, guest, cake, gauge, confetti, slot, CXR, CYR } from './party.js';

const FPS = 30;
const TL = { go: 4.0, win: 3.5, sil: 18.0, hit: 18.5, pairs: 22.5, burst: 26.5, burstGo: 26.75, burstHit: 28.5, cta: 30.5, dur: 35.0 };
// arrivals: guest 0 is there from the start; guests 1…21 arrive in four 3.5 s windows (3, 5, 6, 7); guest 22 (the 23rd) lands after the silence
const ARR = [0]; [3, 5, 6, 7].forEach((n, w) => { for (let j = 0; j < n; j++) ARR.push(Math.round((TL.go + w * TL.win + j * TL.win / n) / .0625) * .0625); });
ARR.push(TL.hit);
for (let k = 0; k < 47; k++) ARR.push(TL.burstGo + (k + 1) * (TL.burstHit - TL.burstGo) / 47);       // guests 23…69 (people 24…70)
const LINES = [];
for (let p = 1; p < ARR.length; p++) {
  const gap = (ARR[p + 1] ?? ARR[p] + 1) - ARR[p], d = p < 23 ? Math.min(gap * .75, p * .0625) : 0;
  for (let i = 0; i < p; i++) LINES.push({ i, j: p, t0: ARR[p] + (p < 23 ? (i + 1) * d / p : 0) });
}
const nAt = t => ARR.filter(a => a <= t).length;
const P = n => { let q = 1; for (let k = 0; k < n; k++) q *= (365 - k) / 365; return 1 - q; };
const MATCH = [6, 22];

const CAPS = [
  { t0: 0, t1: TL.go, l: ['HOW MANY PEOPLE TILL', '2 SHARE A *BIRTHDAY*?'] },
  { t0: TL.go, t1: 7.5, l: ['GUESS. MOST SAY *183*'] },
  { t0: 7.5, t1: 11.0, l: ['EVERY NEW GUEST', 'MEETS *EVERYONE*'] },
  { t0: 11.0, t1: 14.5, l: ['15 PEOPLE: *105 PAIRS*'] },
  { t0: 14.5, t1: TL.sil, l: ['THE PAIRS *EXPLODE*'] },
  { t0: TL.hit, t1: TL.pairs, l: ['*23 PEOPLE.*', 'A 50% CHANCE'] },
  { t0: TL.pairs, t1: TL.burst, l: ['23 PEOPLE MAKE', '*253 PAIRS*'], f: 'EACH PAIR IS A CHANCE' },
  { t0: TL.burst, t1: TL.cta, l: ['*70 PEOPLE:* 99.9%', 'ALMOST CERTAIN'] },
  { t0: TL.cta, t1: TL.dur, l: ['COMMENT YOUR *BIRTHDAY*', 'FIND YOUR TWIN BELOW'] },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

const EV = [];
for (const c of CAPS) if (c.t0 > 0 && c.t0 !== TL.hit) EV.push({ t: c.t0, type: 'blip' });
for (let p = 1; p <= 22; p++) EV.push({ t: ARR[p], type: 'pop', n: p + 1 });
EV.push({ t: TL.sil, type: 'silence', dur: TL.hit - TL.sil });
EV.push({ t: TL.hit, type: 'confetti' }); EV.push({ t: TL.burstHit, type: 'confetti' });
EV.push({ t: TL.pairs, type: 'whoosh' }); EV.push({ t: TL.burst, type: 'whoosh' }); EV.push({ t: TL.cta, type: 'whoosh' });
EV.push({ t: 0, type: 'score', TL, ARR: ARR.slice(0, 23) });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.cyan]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19, 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3, 1, PAL);
}
function counter(label, big, sub, pop) {
  lineC(fb, label, W / 2, 84 + (capAt(0) && false ? 0 : 0), 1, PAL);
  bigNum(fb, String(big), W / 2, 96 - (pop ? 3 : 0), pop ? 6 : 5, YEL);
  if (sub) lineC(fb, sub, W / 2, 140, 2, PAL);
}
const recent = (t, d = .25) => { let p = 0; for (let k = 1; k < 23; k++) { const a = t - ARR[k]; if (a >= 0 && a < d) p = Math.max(p, 1 - a / d); } return p; };

function render(t) {
  let lut = LUT.full, bloom = .12;
  const n = nAt(t), N = n <= 23 ? 23 : n, r = n <= 23 ? 9 : Math.round(lerp(9, 4, (n - 23) / 47));
  const matchOn = t >= TL.hit && t < TL.burst, wave = t >= TL.pairs && t < TL.burst;
  room(fb, t);
  web(fb, t, LINES, N, { hot: matchOn ? MATCH : null, wave: wave ? mod((t - TL.pairs) * .45, 1) : t >= TL.burstHit ? mod((t - TL.burstHit) * .3, 1) : undefined });
  // guests (drawn back to front by y)
  const order = [...Array(n).keys()].sort((a, b) => slot(a, N)[1] - slot(b, N)[1]);
  for (const i of order) {
    const [x, y] = slot(i, N), age = t - ARR[i], k = i === 0 ? 1 : clamp(age / .18, 0, 1);
    const rr = Math.max(2, Math.round(r * (k < 1 ? k * 1.25 : 1)));
    const isM = matchOn && MATCH.includes(i);
    guest(fb, x, y, rr, i, t, { jump: isM ? Math.abs(Math.sin((t - TL.hit) * 7)) * 5 : 0, happy: isM || t >= TL.burstHit });
  }
  if (matchOn && t < TL.pairs) for (const i of MATCH) { const [x, y] = slot(i, N); lineC(fb, 'MAY 9', clamp(x, 24, W - 24), y - 30 - Math.round(Math.abs(Math.sin((t - TL.hit) * 7)) * 5), 1, PAL); }
  const expr = t < 1.2 ? 'calm' : t < TL.go ? 'happy' : t < 14.5 ? 'happy' : t < TL.hit ? 'wow' : t < TL.hit + 1 ? 'wow' : t < TL.burstGo ? 'happy' : t < TL.burstHit + 1 ? 'wow' : 'happy';
  cake(fb, CXR, CYR + 4, expr, t, { pump: recent(t) });
  confetti(fb, t, TL.hit, CXR, CYR - 30); confetti(fb, t, TL.burstHit, CXR, CYR - 30);
  gauge(fb, W / 2, 438, 190, P(n), t, 'CHANCE OF A MATCH');
  // counter band
  const pct = P(n) * 100, ptxt = (pct > 99.85 ? '99.9' : pct.toFixed(1)) + '% CHANCE';
  if (t >= TL.pairs && t < TL.burst) counter('PAIRS', 253, '23 × 22 / 2', false);
  else if (t >= TL.cta) counter('YOUR BIRTHDAY TWIN', '?', null, false);
  else counter('PEOPLE', n, ptxt, (recent(t, 2 / FPS) > 0) || (t >= TL.hit && t < TL.hit + 2 / FPS) || (t >= TL.burstGo && t < TL.burstHit && ((t * FPS) | 0) % 2 === 0));
  drawCaption(t);
  if (t >= TL.sil && t < TL.hit) { lut = darken(LUT.full, .5); bloom = 0; }
  for (const h of [TL.hit, TL.burstHit]) if (t >= h && t < h + 3 / FPS) lut = whiten(LUT.full, .75 - (t - h) * FPS / 4);
  if (t > TL.dur - .3) lut = darken(LUT.full, (t - (TL.dur - .3)) / .3);
  out.present(fb, lut);
  out.show(fb, BLOOM, bloom);
}

window.render = render;
window.TEXTS = t => {
  const c = capAt(t); if (!c) return [];
  return [{ id: 'cap' + c.t0, text: c.l.map(s => s.replace(/\*/g, '')).join(' ') + (c.f ? ' ' + c.f : ''), x0: 0, y0: 100, x1: W * 4, y1: (30 + c.l.length * 19 + 14) * 4 }];
};
window.READY = true;
