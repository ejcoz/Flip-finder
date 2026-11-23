// main.js — "How Rare Are You?" (Pixel Countdown Science): five body tests, a score to comment. Every timing lives in TL.
// Each test: read it (0.8 s) → try it with a 3-2-1 countdown while the hero strains → the hero nails it and a crowd of 100
// lights up to show how many people can. Feel rules (STYLE.md §5): constant life; wind-up, hit, aftermath on every event.
import { W, H, C, FB, LUT, makeOut, whiten, darken, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum } from './font.js';
import { stage, hero, crowd, bigCrowd, pips, burst, shock, shift, confetti, HX, HY } from './who.js';

const FPS = 30;
const TL = { go: 4.0, per: 5.5, read: .8, rev: 3.3, sil: 31.5, fin: 32.0, sweep0: 32.3, sweep1: 33.3, cta: 36.0, dur: 41.0 };
const TESTS = [
  { a: ['1. *ROLL* YOUR TONGUE'], b: '*~7 IN 10* CAN', pct: 70 },
  { a: ['2. BEND YOUR *THUMB*', '*BACKWARDS*'], b: '*~3 IN 10* CAN', pct: 30 },
  { a: ['3. *WIGGLE* YOUR EARS'], b: '*~2 IN 10* CAN', pct: 20 },
  { a: ['4. MAKE A *CLOVER*', 'WITH YOUR TONGUE'], b: '*~1 IN 7* CAN', pct: 15 },
  { a: ['5. TOUCH TONGUE', 'TO YOUR *NOSE*'], b: '*~1 IN 10* CAN', pct: 10 },
];
TESTS.forEach((T, i) => { T.t0 = TL.go + i * TL.per; T.rev = T.t0 + TL.rev; T.ticks = [0, 1, 2].map(j => +(T.t0 + TL.read + j * (TL.rev - TL.read) / 3).toFixed(3)); T.d = Math.min(.012, .7 / T.pct); });
const CAPS = [{ t0: 0, t1: TL.go, l: ['HOW *RARE* ARE YOU?', '5 TESTS. KEEP SCORE'] }];
for (const T of TESTS) { CAPS.push({ t0: T.t0, t1: T.rev, l: T.a }); CAPS.push({ t0: T.rev, t1: T.t0 + TL.per, l: [T.b] }); }
CAPS.push({ t0: TL.fin, t1: TL.cta, l: ['ALL FIVE? ROUGHLY', '*1 IN 1,600* PEOPLE'] });
CAPS.push({ t0: TL.cta, t1: TL.dur, l: ['COMMENT YOUR *SCORE*', 'FOLLOW FOR PART 2'], f: 'SEND IT TO A FRIEND' });
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

const EV = [];
EV.push({ t: TL.sil, type: 'silence', dur: TL.fin - TL.sil });
EV.push({ t: TL.sweep1, type: 'confetti' }); EV.push({ t: TL.cta, type: 'whoosh' });
for (const T of TESTS) EV.push({ t: T.rev, type: 'confetti' });
EV.push({ t: 0, type: 'score', TL, TESTS: TESTS.map(T => ({ t0: T.t0, rev: T.rev, ticks: T.ticks, pct: T.pct, d: T.d })) });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.cyan]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  const age = t - c.t0, dy = age < .1 ? Math.round((1 - age / .1) * -4) : 0;
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19 + dy, 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3 + dy, 1, PAL);
}
function counter(label, big, sub, slam) {
  lineC(fb, label, W / 2, 84, 1, PAL);
  bigNum(fb, String(big), W / 2, 96 - (slam ? 4 : 0), slam ? 6 : 5, YEL);
  if (sub) lineC(fb, sub, W / 2, 142, 2, PAL);
}
const commas = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function render(t) {
  let lut = LUT.full, bloom = .12, sh = 0;
  stage(fb, t);
  const ti = t < TL.go ? -1 : Math.min(4, Math.floor((t - TL.go) / TL.per)), T = ti >= 0 && t < TL.sil ? TESTS[ti] : null;
  if (t < TL.go) {
    // —— hook: the hero waves hello with its ears ——
    hero(fb, t, { test: -1, expr: t < 1.2 ? 'calm' : t < 2.6 ? 'happy' : 'wow' });
    crowd(fb, t, Math.floor(mod(t * 40, 130)), null);
    counter('TESTS', 5, 'HOW MANY CAN YOU DO?', mod(t, 1) < .08);
    pips(fb, t, 0, 0);
  } else if (T) {
    const a = t - T.t0, rev = t - T.rev;
    let k, strain = false, expr = 'calm';
    if (a < TL.read) k = 0;
    else if (rev < 0) { strain = true; k = .14 + .12 * Math.sin(t * 9) + .06 * Math.sin(t * 23); }           // trying…
    else { k = eo(clamp(rev / .16, 0, 1)); expr = rev < .9 ? 'wow' : 'happy'; }
    hero(fb, t, { test: ti, k, strain, expr, shake: strain ? 2 : 0 });
    for (const tk of T.ticks) burst(fb, HX, HY, t - tk, 3.4);                                                    // a pulse on every countdown tick
    if (rev >= 0) { burst(fb, HX, HY + 24, rev, 2.6); burst(fb, HX, HY + 24, rev - .08, 1.6); if (rev < .3) sh = rev < .1 ? 2 : 1; }
    const lit = rev < 0 ? 0 : Math.min(T.pct, Math.floor(rev / T.d) + 1);
    crowd(fb, t, lit, k2 => T.rev + k2 * T.d);
    lineC(fb, rev < 0 ? 'OUT OF 100 PEOPLE…' : `${lit} OUT OF 100 PEOPLE`, W / 2, 436, 1, PAL);
    if (a < TL.read) counter('TEST', ti + 1, 'GET READY', a < .1);
    else if (rev < 0) { const j = T.ticks.filter(x => x <= t).length, age = t - T.ticks[j - 1]; counter('TRY IT NOW', 4 - j, 'GO!', age < .1); if (age < .08) sh = 1; }
    else counter('CAN DO THIS', `~${T.pct}%`, 'OF PEOPLE', rev < .12);
    pips(fb, t, ti + (rev >= 0 ? 1 : 0), ti);
    confetti(fb, t, T.rev, HX, HY - 20);
  } else if (t < TL.fin) {
    hero(fb, t, { test: -1, expr: 'wow' }); crowd(fb, t, 10, null); counter('CAN DO THIS', '~10%', 'OF PEOPLE', false); pips(fb, t, 5, 5);
    lut = darken(LUT.full, .5); bloom = 0;                                                                    // the held breath
  } else if (t < TL.cta) {
    // —— all five: the hero becomes one dot among 1,600 ——
    const u = eio(seg(t, TL.fin, TL.fin + .4)), prog = seg(t, TL.sweep0, TL.sweep1), hit = t - TL.sweep1;
    bigCrowd(fb, t, prog);
    if (u < 1) hero(fb, t, { test: -1, expr: 'wow', scale: lerp(1, .04, u), x: lerp(HX, 153, u), y: lerp(HY, 276, u) });
    shock(fb, 153, 276, hit); confetti(fb, t, TL.sweep1, 153, 260);
    if (hit >= 0 && hit < .36) sh = 3 - Math.floor(hit / .12);
    const val = hit >= 0 ? 1600 : Math.max(1, Math.round(Math.pow(1600, prog)));
    counter('ALL FIVE = 1 PERSON IN', commas(val), 'ROUGHLY', (hit >= 0 && hit < .12) || (prog > 0 && prog < 1 && ((t * FPS) | 0) % 2 === 0));
    pips(fb, t, 5, 5);
    if (hit >= 0 && hit < 3 / FPS) lut = whiten(LUT.full, .75 - hit * FPS / 4);
  } else {
    // —— CTA: the hero pops back and winks ——
    const a = t - TL.cta, s = a < .25 ? eo(a / .25) * 1.12 : a < .35 ? lerp(1.12, 1, (a - .25) / .1) : 1;
    hero(fb, t, { test: -1, expr: mod(a, 2.2) > 1.7 ? 'happy' : 'calm', scale: s });
    burst(fb, HX, HY, a, 3);
    crowd(fb, t, 100, k2 => TL.cta + mod(k2 * .37 + Math.floor((t - TL.cta) * 1.5) * .21, 1.5));
    lineC(fb, 'WHICH ONE ARE YOU?', W / 2, 436, 1, PAL);
    counter('YOUR SCORE', '?/5', null, mod(a, 1) < .1);
    pips(fb, t, 5, 5);
    if (a < .2) sh = 1;
  }
  if (sh) shift(fb, Math.round((hash((t * FPS) | 0, 1) - .5) * 2 * sh), Math.round((hash((t * FPS) | 0, 2) - .5) * 2 * sh));
  drawCaption(t);
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
