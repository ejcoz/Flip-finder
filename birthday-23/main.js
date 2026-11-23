// main.js — "23 People" (Pixel Countdown Science): the birthday paradox. Every timing lives in TL.
// Feel rules: nothing ever stands still (idle bobs, rays, signals on the lines, easing numbers), and every event has a
// wind-up (the guest drops in), a hit (squash, ring, sparks, shake, counter slam) and an aftermath (lines shoot out, targets hop).
import { W, H, C, FB, LUT, makeOut, whiten, darken, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum } from './font.js';
import { room, web, guest, cake, gauge, confetti, burst, shock, shift, slot, CXR, CYR } from './party.js';

const FPS = 30;
const TL = { go: 4.0, win: 3.5, sil: 18.0, hit: 18.5, pairs: 22.5, burst: 26.5, burstGo: 26.75, burstHit: 28.5, cta: 30.5, dur: 35.0 };
const FALL = .16;                                                    // a guest starts dropping this long before landing
// landings: guest 0 is there from the start; guests 1…21 land in four 3.5 s windows (3, 5, 6, 7); guest 22 lands after the silence
const ARR = [0]; [3, 5, 6, 7].forEach((n, w) => { for (let j = 0; j < n; j++) ARR.push(Math.round((TL.go + w * TL.win + j * TL.win / n) / .0625) * .0625); });
ARR.push(TL.hit);
for (let k = 0; k < 47; k++) ARR.push(TL.burstGo + (k + 1) * (TL.burstHit - TL.burstGo) / 47);       // guests 23…69
const LINES = [], HITS = [];                                          // HITS[p] = times the lines of guest p land (for the score)
for (let p = 1; p < ARR.length; p++) {
  const gap = (ARR[p + 1] ?? ARR[p] + 1) - ARR[p], fast = p >= 23;
  const delta = fast ? 0 : Math.min(.0625, Math.max(.012, (gap * .7 - .2) / p)); HITS[p] = [];
  for (let i = 0; i < p; i++) { const ts = ARR[p] + (fast ? 0 : .05 + i * delta), th = ts + (fast ? 0 : .11); LINES.push({ i, j: p, ts, th }); HITS[p].push(+th.toFixed(4)); }
}
const HOPS = ARR.map(() => []); for (const L of LINES) if (L.j < 23) HOPS[L.i].push(L.th);
const nLanded = t => ARR.filter(a => a <= t).length;
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
EV.push({ t: TL.sil, type: 'silence', dur: TL.hit - TL.sil });
EV.push({ t: TL.hit, type: 'confetti' }); EV.push({ t: TL.burstHit, type: 'confetti' });
EV.push({ t: TL.pairs, type: 'whoosh' }); EV.push({ t: TL.burst, type: 'whoosh' }); EV.push({ t: TL.cta, type: 'whoosh' });
EV.push({ t: 0, type: 'score', TL, ARR: ARR.slice(0, 23), HITS: HITS.slice(0, 23), FALL });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.cyan]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  const age = t - c.t0, dy = age < .1 ? Math.round((1 - age / .1) * -4) : 0;          // captions drop in
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19 + dy, 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3 + dy, 1, PAL);
}
function counter(label, big, sub, pop) {
  lineC(fb, label, W / 2, 84, 1, PAL);
  bigNum(fb, String(big), W / 2, 96 - (pop ? 4 : 0), pop ? 6 : 5, YEL);
  if (sub) lineC(fb, sub, W / 2, 140, 2, PAL);
}
const since = (t, list) => { let a = 99; for (const x of list) if (x <= t && t - x < a) a = t - x; return a; };

function render(t) {
  let lut = LUT.full, bloom = .12;
  const n = nLanded(t), N = n <= 23 ? 23 : n, r = n <= 23 ? 9 : Math.round(lerp(9, 4, (n - 23) / 47));
  const matchOn = t >= TL.hit && t < TL.burst, wave = t >= TL.pairs && t < TL.burst;
  const idle = i => Math.round(Math.sin(t * 4.2 + i * 1.7) * 1.4);                    // everyone bobs, out of phase
  const pos = i => { const [x, y] = slot(i, N); return [x, y + idle(i)]; };
  room(fb, t);
  web(fb, t, LINES, N, { pos, hot: matchOn ? MATCH : null, wave: wave ? mod((t - TL.pairs) * .45, 1) : t >= TL.burstHit ? mod((t - TL.burstHit) * .3, 1) : undefined });
  // guests: landed ones (back to front) + the one dropping in
  const live = []; for (let i = 0; i < ARR.length; i++) if (t >= ARR[i] - (i ? FALL : 0)) live.push(i);
  live.sort((a, b) => slot(a, N)[1] - slot(b, N)[1]);
  for (const i of live) {
    const [x, y0] = pos(i), a = t - ARR[i];
    let y = y0, rr = r, jump = 0;
    if (i && a < 0) { const u = 1 + a / FALL; y = y0 - 46 * (1 - u * u); rr = Math.max(3, r - 1); }                   // dropping in
    else if (i && a < .09) rr = r + 2;                                                                               // squash on landing
    else if (i && a < .18) rr = Math.max(2, r - 1);
    const hop = since(t, HOPS[i]); if (hop < .16) jump = Math.sin(hop / .16 * Math.PI) * 4;                           // handshake hop
    const isM = matchOn && MATCH.includes(i);
    if (isM) { jump = Math.abs(Math.sin((t - TL.hit) * 7)) * 6; rr = r + 2; }
    guest(fb, x, y, rr, i, t, { jump, happy: isM || hop < .3 || t >= TL.burstHit, glow: isM });
    if (i && a >= 0) burst(fb, x, y0, a, i < 23 ? 1 : .5);
  }
  if (matchOn && t < TL.pairs) for (const i of MATCH) { const [x, y] = pos(i); lineC(fb, 'MAY 9', clamp(x, 24, W - 24), y - 34 - Math.round(Math.abs(Math.sin((t - TL.hit) * 7)) * 6), 1, PAL); }
  const last = since(t, ARR.slice(1, 23));
  const expr = t < 1.2 ? 'calm' : t < 14.5 ? (last < .3 ? 'wow' : 'happy') : t < TL.hit ? 'wow' : t < TL.hit + 1 ? 'wow' : t < TL.burstGo ? 'happy' : t < TL.burstHit + 1 ? 'wow' : 'happy';
  cake(fb, CXR, CYR + 4 + Math.round(Math.sin(t * 3.1) * 1.5), expr, t, { pump: last < .22 ? 1 - last / .22 : t >= TL.burstGo && t < TL.burstHit ? .5 + .5 * Math.sin(t * 50) : 0 });
  shock(fb, CXR, CYR, t - TL.hit); shock(fb, CXR, CYR, t - TL.burstHit);
  confetti(fb, t, TL.hit, CXR, CYR - 30); confetti(fb, t, TL.burstHit, CXR, CYR - 30);
  // screen shake: 1 px on a landing, 3-2-1 on the big hits
  let sh = last < .1 ? 1 : 0; for (const h of [TL.hit, TL.burstHit]) { const a = t - h; if (a >= 0 && a < .36) sh = 3 - Math.floor(a / .12); }
  if (t >= TL.burstGo && t < TL.burstHit) sh = 1;
  if (sh) shift(fb, Math.round((hash((t * FPS) | 0, 1) - .5) * 2 * sh), Math.round((hash((t * FPS) | 0, 2) - .5) * 2 * sh));
  // the chance eases to its new value; the gauge follows with a moving glint
  const pn = P(n), pp = P(Math.max(1, n - 1)), ease = eo(clamp(since(t, ARR.slice(0, 70)) / .3, 0, 1)), pShown = lerp(pp, pn, n > 1 ? ease : 1);
  gauge(fb, W / 2, 438, 190, pShown, t, 'CHANCE OF A MATCH');
  const gx = W / 2 - 95 + Math.round(mod(t * 60, 190)); if (gx < W / 2 - 95 + pShown * 190) { fb.px(gx, 439, C.white); fb.px(gx + 1, 439, C.white); fb.px(gx, 440, C.white); }
  const pct = pShown * 100, ptxt = (pct > 99.85 ? '99.9' : pct.toFixed(1)) + '% CHANCE';
  const slam = (last < 2.5 / FPS) || (t >= TL.hit && t < TL.hit + 3 / FPS) || (t >= TL.burstGo && t < TL.burstHit && ((t * FPS) | 0) % 2 === 0);
  if (t >= TL.pairs && t < TL.burst) counter('PAIRS', Math.min(253, Math.round(253 * eo(seg(t, TL.pairs, TL.pairs + .5)))), '23 × 22 / 2', t < TL.pairs + .5 && ((t * FPS) | 0) % 2 === 0);
  else if (t >= TL.cta) counter('YOUR BIRTHDAY TWIN', '?', null, mod(t - TL.cta, 1) < .1);
  else counter('PEOPLE', n, ptxt, slam);
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
