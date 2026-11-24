// main.js — "Say the Colour" (Pixel Countdown Science): the Stroop test, three levels that speed up. Every timing lives in TL.
// 120 bpm grid (beat = 0.5 s, bar = 2 s): the hook is 2 bars; each level is a 1-bar intro (LEVEL · 3 · 2 · 1) + 3–4 bars
// of words, every word landing on a beat. Feel rules (STYLE.md §5): constant life; every word drops in, slams, and is answered.
import { W, H, C, FB, LUT, makeOut, whiten, darken, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum, textW } from './font.js';
import { stage, hero, burst, shock, shift, confetti } from './who.js';

const FPS = 30;
const TL = { go: 4.0, sil: 30.0, pay: 30.5, cta: 36.0, dur: 42.0 };
const INK = {
  RED: { light: C.hpink, body: C.red, shade: C.crimson, ink: C.ink },
  BLUE: { light: C.cyan, body: C.blue, shade: C.navy, ink: C.ink },
  GREEN: { light: C.lime, body: C.lime, shade: C.green, ink: C.ink },
  PURPLE: { light: C.puL, body: C.puB, shade: C.puS, ink: C.ink },
};
const NAMES = Object.keys(INK);
// levels: intro bar at t0, words from t0 + 2 s, one every `step` s
const LEVELS = [{ t0: 4.0, n: 8, step: 1.0 }, { t0: 14.0, n: 8, step: .75 }, { t0: 22.0, n: 12, step: .5 }];
const WORDS = [];
LEVELS.forEach((L, li) => {
  L.w0 = L.t0 + 2; L.end = L.w0 + L.n * L.step;
  let prevW = '', prevI = '';
  for (let k = 0; k < L.n; k++) {
    let s = 0, w, ink;
    do { w = NAMES[Math.floor(hash(li * 50 + k, 3 + s) * 4)]; ink = NAMES[Math.floor(hash(li * 50 + k, 7 + s) * 4)]; s++; } while (w === ink || w === prevW || ink === prevI);
    prevW = w; prevI = ink;
    WORDS.push({ li, k, t: L.w0 + k * L.step, step: L.step, word: w, ink, wrong: li === 2 && k === 8 });
  }
});
const wordAt = t => { let cur = null; for (const W_ of WORDS) if (W_.t <= t) cur = W_; return cur && t < LEVELS[cur.li].end ? cur : null; };

const CAPS = [
  { t0: 0, t1: TL.go, l: ['SAY THE *COLOUR*,', 'NOT THE WORD'], f: 'OUT LOUD' },
  { t0: 4.0, t1: 14.0, l: ['*LEVEL 1*', 'SAY THE COLOUR'] },
  { t0: 14.0, t1: 22.0, l: ['*LEVEL 2*: FASTER', 'SAY THE COLOUR'] },
  { t0: 22.0, t1: TL.sil, l: ['*LEVEL 3*: GOOD LUCK', 'SAY THE COLOUR'] },
  { t0: TL.pay, t1: TL.cta, l: ['READING IS *AUTOMATIC*', 'NAMING COLOURS ISN\'T'], f: 'STROOP EFFECT, 1935' },
  { t0: TL.cta, t1: TL.dur, l: ['WHICH LEVEL', 'DID YOU *REACH*?'], f: 'SEND TO A FRIEND. PART 2 SOON' },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };
const inkPal = n => ({ fg: INK[n].body, hi: INK[n].body, ink: C.ink });

const EV = [];
EV.push({ t: TL.sil, type: 'silence', dur: TL.pay - TL.sil });
EV.push({ t: TL.pay, type: 'confetti' }); EV.push({ t: TL.cta, type: 'whoosh' });
EV.push({ t: 0, type: 'score', TL, LEVELS: LEVELS.map(L => ({ t0: L.t0, w0: L.w0, end: L.end, step: L.step })), WORDS: WORDS.map(w => ({ t: w.t, step: w.step, ink: w.ink, wrong: w.wrong, li: w.li })), demo: 1.0 });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.cyan, C.lime, C.hpink, C.puL]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  const age = t - c.t0, dy = age < .1 ? Math.round((1 - age / .1) * -4) : 0;
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19 + dy, 2, PAL));
  if (c.f) lineC(fb, c.f, W / 2, y + c.l.length * 19 + 3 + dy, 1, PAL);
}
// the big word, printed in the wrong ink; drops in and slams
function bigWord(word, ink, age, y = 132) {
  const sc = age < 2 / FPS ? 6 : 5, dy = (age < .06 ? Math.round((1 - age / .06) * -10) : 0) + Math.round(Math.sin(age * 9) * 1.5);
  bigNum(fb, word, W / 2, y - (sc - 5) * 3 + dy, sc, INK[ink]);
}
function bubble(x, y, text, pal, age) {
  const w = textW(text, 2) + 20, h = 26, s = age < .08 ? .7 + age / .08 * .3 : 1, ww = Math.round(w * s), hh = Math.round(h * s), x0 = Math.round(x - ww / 2), y0 = Math.round(y - hh / 2);
  for (let j = -1; j <= hh; j++) for (let i = -1; i <= ww; i++) {
    const edge = j === -1 || j === hh || i === -1 || i === ww; if (edge && (i === -1 || i === ww) && (j === -1 || j === hh)) continue;
    fb.px(x0 + i, y0 + j, edge ? C.ink : C.white);
  }
  for (let q = 0; q < 6; q++) { fb.px(x0 - 1 - q, y0 + hh - 4 + Math.floor(q / 2), C.ink); for (let r = 0; r < Math.max(0, 4 - q); r++) fb.px(x0 - q, y0 + hh - 5 + r + Math.floor(q / 2), C.white); }
  if (s >= 1) lineC(fb, text, x, y0 + 6, 2, { ...pal, ink: C.ink });
}
function dots(t, L, li) {                                               // progress: one dot per word, filled in its ink
  const n = L.n, gap = Math.min(16, Math.floor(220 / n)), x0 = W / 2 - (n - 1) * gap / 2;
  for (let k = 0; k < n; k++) {
    const w = WORDS.find(w => w.li === li && w.k === k), on = t >= w.t + w.step * .5, x = Math.round(x0 + k * gap), y = 432 + Math.round(Math.sin(t * 5 - k * .6) * 1.2);
    const fresh = on && t - (w.t + w.step * .5) < .1;
    fb.disc(x, y, fresh ? 5 : 4, C.ink); fb.disc(x, y, fresh ? 4 : 3, on ? (w.wrong ? C.g3 : INK[w.ink].body) : C.g2);
    if (on && w.wrong) { fb.px(x - 1, y - 1, C.red); fb.px(x + 1, y + 1, C.red); fb.px(x + 1, y - 1, C.red); fb.px(x - 1, y + 1, C.red); }
  }
}
function levelBadge(t, li) {
  lineC(fb, 'LEVEL', 96, 456, 1, PAL);
  for (let i = 0; i < 3; i++) { const x = 118 + i * 13; fb.rect(x - 1, 455, 10, 10, C.ink); fb.rect(x, 456, 8, 8, i < li ? C.yB : i === li && ((t * 4) | 0) % 2 ? C.white : C.g1); }
}

function render(t) {
  let lut = LUT.full, bloom = .14, sh = 0;
  stage(fb, t);
  const HXp = 112, HYp = 318;
  if (t < TL.go) {
    // —— hook: a worked example. RED printed in BLUE; the hero says "BLUE!" ——
    if (t >= 1.0) { bigWord('RED', 'BLUE', t - 1.0); burst(fb, W / 2, 148, t - 1.0, 2.4); if (t - 1.0 < .1) sh = 1; }
    const said = t >= 2.0;
    hero(fb, t, { test: -1, expr: said ? 'wow' : t < 1 ? 'calm' : 'calm', scale: .85, x: HXp, y: HYp });
    if (said) { bubble(206, 262, 'BLUE!', inkPal('BLUE'), t - 2.0); lineC(fb, '*✓ RIGHT*', W / 2, 178, 2, PAL); }
    if (t >= 2.9) lineC(fb, 'NOT "RED"', W / 2, 200, 1, PAL);
  } else if (t < TL.sil) {
    const li = t < 14 ? 0 : t < 22 ? 1 : 2, L = LEVELS[li];
    if (t < L.w0) {
      // —— level intro: LEVEL n · 3 · 2 · 1 on beats ——
      const a = t - L.t0, beat = Math.floor(a / .5), age = a - beat * .5;
      lineC(fb, beat === 0 ? 'GET READY' : 'GO IN', W / 2, 84, 1, PAL);
      if (beat === 0) bigNum(fb, `LEVEL ${li + 1}`, W / 2, 112 - (age < .07 ? 3 : 0), age < .07 ? 5 : 4, YEL);
      else bigNum(fb, String(4 - beat), W / 2, 104 - (age < .07 ? 4 : 0), age < .07 ? 7 : 6, YEL);
      burst(fb, W / 2, 130, age, 2.6); if (age < .08) sh = beat === 0 ? 2 : 1;
      hero(fb, t, { test: -1, expr: li === 2 ? 'wow' : 'calm', strain: li === 2 && beat > 0, scale: .85, x: HXp, y: HYp, shake: li === 2 ? 1 : 0 });
    } else {
      // —— words: drop in on a beat, answered half a step later ——
      const w = wordAt(t), a = t - w.t, half = w.step * .5;
      lineC(fb, `WORD ${w.k + 1} / ${L.n}`, W / 2, 84, 1, PAL);
      bigWord(w.word, w.ink, a); burst(fb, W / 2, 148, a, 2.2); if (a < .07) sh = 1;
      const said = a >= half;
      hero(fb, t, { test: -1, expr: said ? (w.wrong ? 'calm' : 'wow') : 'calm', strain: w.wrong && said || (li === 2 && !said), scale: .85, x: HXp, y: HYp, shake: li === 2 ? 1 : 0 });
      if (said) {
        if (w.wrong) { bubble(206, 262, w.word + '?', inkPal(w.word), a - half); lineC(fb, '*✗ OOPS*', W / 2, 178, 2, PAL); if (a - half < .15) sh = 2; }
        else { bubble(206, 262, w.ink + '!', inkPal(w.ink), a - half); lineC(fb, '*✓*', W / 2, 178, 2, PAL); }
      }
      if (li === 2 && t > L.end - 2) { const k = (t - (L.end - 2)) / 2; for (let q = 0; q < 10; q++) { const x = hash(q, 21) * W, y = 168 + mod(hash(q, 22) * 300 - t * 400 * k, 300); fb.line(x, y, x, y + 10 * k, C.g4); } }   // speed lines
    }
    dots(t, L, li); levelBadge(t, li);
  } else if (t < TL.pay) {
    hero(fb, t, { test: -1, expr: 'wow', scale: .85, x: HXp, y: HYp }); dots(t, LEVELS[2], 2); levelBadge(t, 3);
    lut = darken(LUT.full, .5); bloom = 0;
  } else if (t < TL.cta) {
    // —— why: the words orbit the dizzy hero ——
    const a = t - TL.pay;
    bigNum(fb, '?!', W / 2, 104 - (a < .1 ? 4 : 0), a < .1 ? 6 : 5, YEL);
    for (let q = 0; q < 8; q++) {
      const ang = q / 8 * 6.283 + a * 1.6, rx = 100, ry = 66, x = W / 2 + Math.cos(ang) * rx, y = HYp - 10 + Math.sin(ang) * ry, name = NAMES[q % 4], ink = NAMES[(q + 1 + (q >> 2)) % 4];
      if (Math.sin(ang) < 0) lineC(fb, name, x, y - 7, 1, inkPal(ink));
    }
    hero(fb, t, { test: -1, expr: a < 1 ? 'wow' : 'calm', strain: a > 1 && a < 2.6, scale: .85, x: W / 2, y: HYp - 10 });
    for (let q = 0; q < 8; q++) {
      const ang = q / 8 * 6.283 + a * 1.6, x = W / 2 + Math.cos(ang) * 100, y = HYp - 10 + Math.sin(ang) * 66, name = NAMES[q % 4], ink = NAMES[(q + 1 + (q >> 2)) % 4];
      if (Math.sin(ang) >= 0) lineC(fb, name, x, y - 4, 1, inkPal(ink));
    }
    shock(fb, W / 2, 260, a); confetti(fb, t, TL.pay, W / 2, 240);
    if (a < .36) sh = 3 - Math.floor(a / .12);
    if (a < 3 / FPS) lut = whiten(LUT.full, .75 - a * FPS / 4);
    levelBadge(t, 3);
  } else {
    // —— CTA: the hero winks; a mini level-select ——
    const a = t - TL.cta;
    bigNum(fb, '1 2 3', W / 2, 104 - (mod(a, 1) < .08 ? 3 : 0), 5, YEL);
    const pick = Math.floor(mod(a * 1.6, 3)); fb.rect(W / 2 - 52 + pick * 42 - 2, 146, 24, 3, C.white);
    hero(fb, t, { test: -1, expr: mod(a, 2.4) > 1.9 ? 'happy' : 'calm', scale: .95, x: W / 2, y: HYp - 6 });
    burst(fb, W / 2, HYp - 6, a, 3);
    for (let q = 0; q < 4; q++) { const x = 40 + q * 63, y = 430 + Math.round(Math.sin(t * 4 + q) * 3); lineC(fb, NAMES[(q + 2) % 4], x, y, 1, inkPal(NAMES[q])); }
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
