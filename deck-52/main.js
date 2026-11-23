// main.js — "52 Cards" (Pixel Countdown Science): how many ways can a deck be ordered? Every timing lives in TL.
// Feel rules (STYLE.md §5): nothing stands still, and every card is a wind-up (the deck squashes, the card flips through the
// air), a hit (slam, ring, sparks, shake, the counter multiplies) and an aftermath (the number rolls, the gauge grows).
import { W, H, C, FB, LUT, makeOut, whiten, darken, bayer, hash, clamp, lerp, seg, eo, eio, mod } from './px.js';
import { lineC, bigNum, textW } from './font.js';
import { felt, card, deck, digitsGauge, confetti, burst, shock, shift, cardSlot, DX, DY } from './table.js';

const FPS = 30;
const TL = { go: 4.0, win: 3.5, sil: 21.5, hit: 22.0, burst: 26.0, burstGo: 26.25, burstHit: 28.0, punch: 30.0, cta: 34.0, dur: 38.0 };
const FLY = .2;
// landings: cards 1…51 in five 3.5 s windows (4, 6, 9, 13, 19 cards); card 52 lands after the silence
const ARR = []; [4, 6, 9, 13, 19].forEach((n, w) => { for (let j = 0; j < n; j++) ARR.push(Math.round((TL.go + w * TL.win + j * TL.win / n) / .0625) * .0625); });
ARR.push(TL.hit);
const LOGP = [0]; for (let k = 1; k <= 52; k++) LOGP.push(LOGP[k - 1] + Math.log10(53 - k));        // log10 of the orders after k cards
const MARKS = [[6, '> PEOPLE ON EARTH'], [12, '> GRAINS OF SAND'], [15, '> ALL THE STARS'], [17, '> ATOMS IN YOU'], [33, '> ATOMS ON EARTH']];
const GMARKS = [[9.9, ''], [18.9, ''], [24, ''], [27.8, ''], [50.1, '']];
const landed = t => ARR.filter(a => a <= t).length;
const since = (t, list) => { let a = 99; for (const x of list) if (x <= t && t - x < a) a = t - x; return a; };

const CAPS = [
  { t0: 0, t1: TL.go, l: ['SHUFFLE A DECK.', 'HAS THIS ORDER *EXISTED*?'] },
  { t0: TL.go, t1: 7.5, l: ['EACH CARD *MULTIPLIES*', 'THE ORDERS'] },
  { t0: 7.5, t1: 11.0, l: ['6 CARDS BEAT', '*EVERYONE ON EARTH*'] },
  { t0: 11.0, t1: 14.5, l: ['12 CARDS BEAT', '*EVERY GRAIN OF SAND*'] },
  { t0: 14.5, t1: 18.0, l: ["AND WE'RE NOT EVEN", '*HALFWAY* THROUGH'] },
  { t0: 18.0, t1: TL.sil, l: ['33 CARDS BEAT', '*ATOMS ON EARTH*'] },
  { t0: TL.hit, t1: TL.burst, l: ['*52 CARDS.*', '8 FOLLOWED BY 67 ZEROS'] },
  { t0: TL.burst, t1: TL.punch, l: ['ALL OF US SHUFFLING', 'SINCE THE *BIG BANG*'] },
  { t0: TL.punch, t1: TL.cta, l: ['YOUR SHUFFLE IS A', '*WORLD FIRST*'] },
  { t0: TL.cta, t1: TL.dur, l: ['SHUFFLE A DECK.', 'YOU JUST MADE *HISTORY*'] },
];
const PAL = { fg: C.white, hi: C.yB, ink: C.ink };
const YEL = { light: C.yL, body: C.yB, shade: C.yS, ink: C.ink };

const EV = [];
for (const c of CAPS) if (c.t0 > 0 && c.t0 !== TL.hit && c.t0 !== TL.punch) EV.push({ t: c.t0, type: 'blip' });
EV.push({ t: TL.sil, type: 'silence', dur: TL.hit - TL.sil });
EV.push({ t: TL.hit, type: 'confetti' }); EV.push({ t: TL.punch, type: 'confetti' });
EV.push({ t: TL.burst, type: 'whoosh' }); EV.push({ t: TL.cta, type: 'whoosh' });
EV.push({ t: 0, type: 'score', TL, ARR, FLY, MARKS: MARKS.map(m => m[0]) });
window.EV = EV; window.DUR = TL.dur;

const capAt = t => CAPS.find(c => t >= c.t0 && t < c.t1);
const out = makeOut(document.getElementById('c'));
const fb = new FB();
const BLOOM = new Set([C.yL, C.yB, C.white, C.cyan]);

function drawCaption(t, y = 30) {
  const c = capAt(t); if (!c) return;
  const age = t - c.t0, dy = age < .1 ? Math.round((1 - age / .1) * -4) : 0;
  c.l.forEach((s, i) => lineC(fb, s, W / 2, y + i * 19 + dy, 2, PAL));
}
const commas = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// the big number: full digits while it fits, then mantissa × 10 with a raised exponent
function bigValue(lg, y, slam) {
  if (lg < 6.9) { const s = commas(Math.pow(10, lg)); bigNum(fb, s, W / 2, y - (slam ? 3 : 0), (s.length <= 6 ? 5 : 4) + (slam && s.length <= 5 ? 1 : 0), YEL); return; }
  const e = Math.floor(lg + 1e-9), m = Math.pow(10, lg - e).toFixed(2), a = m + '×10', b = String(e), sa = slam ? 5 : 4, sb = 3;
  const wa = textW(a, sa), wb = textW(b, sb), x0 = Math.round(W / 2 - (wa + 3 + wb) / 2);
  bigNum(fb, a, x0 + wa / 2, y + (slam ? -2 : 2), sa, YEL); bigNum(fb, b, x0 + wa + 3 + wb / 2, y - 6, sb, YEL);
}

function render(t) {
  let lut = LUT.full, bloom = .12;
  const n = landed(t), last = since(t, ARR), inBurst = t >= TL.burstGo && t < TL.burstHit, cta = t >= TL.cta;
  felt(fb, t);
  // —— the dealt cards ——
  const back = cta ? eio(seg(t, TL.cta + .2, TL.cta + 1.4)) : 0;                       // CTA: the cards fly home
  const wave = t >= TL.hit && !cta ? mod((t - TL.hit) * .8, 1.6) : -1;
  for (let k = 0; k < n; k++) {
    const [sx, sy] = cardSlot(k), a = t - ARR[k];
    let x = sx, y = sy + Math.round(Math.sin(t * 3.4 + k * 1.3) * 1.2), w = 13, h = 19, kk = k, lit = false;
    if (a < .07) { w = 16; h = 16; } else if (a < .14) { w = 12; h = 21; }             // slam squash, then stretch
    if (wave >= 0) { const ph = Math.abs((k % 13) / 13 + Math.floor(k / 13) * .12 - wave); if (ph < .09) { lit = true; y -= 2; } }
    if (inBurst) { kk = k + Math.floor(t * 24) * 7; x += Math.round((hash(k, (t * 30) | 0) - .5) * 4); y += Math.round((hash(k + 99, (t * 30) | 0) - .5) * 4); w = 5 + Math.abs(Math.sin(t * 40 + k)) * 9; }
    if (back > 0) { const u = clamp(back * 1.6 - k / 52 * .6, 0, 1); if (u >= 1) continue; x = lerp(sx, DX, u); y = lerp(sy, DY - 20, u) - Math.sin(u * Math.PI) * 14; w = 3 + Math.abs(Math.cos(u * Math.PI * 2)) * 10; }
    card(fb, x, y, kk, { w, h, lit });
    burst(fb, sx, sy, a, .8);
  }
  // —— the card in the air: leaves the deck FLY before it lands, flipping ——
  for (let k = n; k < Math.min(52, n + 3); k++) {
    const a = t - (ARR[k] - FLY); if (a < 0) continue;
    const u = a / FLY, [sx, sy] = cardSlot(k), x = lerp(DX, sx, eo(u)), y = lerp(DY - 34, sy, u) - Math.sin(u * Math.PI) * 26;
    card(fb, x, y, k, { w: 3 + Math.abs(Math.cos(u * Math.PI * 2.5)) * 10, back: Math.cos(u * Math.PI * 2.5) < 0 });
    for (let q = 1; q <= 3; q++) fb.px(lerp(DX, sx, eo(Math.max(0, u - q * .08))), lerp(DY - 34, sy, Math.max(0, u - q * .08)) - Math.sin(Math.max(0, u - q * .08) * Math.PI) * 26, C.white);
  }
  // —— the hero: the deck ——
  const next = ARR.find(a => a - FLY > t), wind = next !== undefined && next - FLY - t < .09 ? 1 - (next - FLY - t) / .09 : 0;
  const mark = since(t, MARKS.map(m => ARR[m[0] - 1]));
  const expr = t < 1.3 ? 'calm' : t < TL.go ? 'happy' : t < TL.sil ? (mark < .7 ? 'wow' : n > 40 ? 'strain' : 'happy') : t < TL.hit ? 'wow' : t < TL.hit + 1.2 ? 'wow' : inBurst ? 'strain' : t < TL.punch ? 'sweat' : cta && mod(t - TL.cta, 2.4) > 2.0 ? 'happy' : 'happy';
  deck(fb, DX + (inBurst ? Math.round((hash((t * 30) | 0, 5) - .5) * 4) : 0), DY + Math.round(Math.sin(t * 2.8) * 1.5), cta ? Math.round(back * 52) : 52 - n, expr, t, { pump: t > 1.55 && t < 2.2 ? .5 + .5 * Math.sin(t * 70) : wind });
  if (t > 1.55 && t < 2.2) for (let q = 0; q < 12; q++) {                              // hook: a riffle shuffle above the deck
    const u = (t - 1.6 - q * .045) / .22; if (u < 0 || u > 1) continue;
    card(fb, DX + (q % 2 ? 1 : -1) * (26 - u * 26), DY - 46 - Math.sin(u * Math.PI) * 16, q, { w: 4 + Math.abs(Math.cos(u * 6)) * 8, back: true });
  }
  shock(fb, DX, 240, t - TL.hit); shock(fb, DX, 240, t - TL.punch);
  confetti(fb, t, TL.hit, DX, 230); confetti(fb, t, TL.punch, DX, 230);
  // —— landmark badge: the latest thing the number has beaten ——
  let badge = null, bAge = 99; for (const [k, s] of MARKS) if (n >= k && t < TL.burst) { badge = s; bAge = t - ARR[k - 1]; }
  if (badge) { lineC(fb, bAge < .12 ? `*${badge}*` : badge, W / 2, 402 - (bAge < .08 ? 3 : 0), 2, PAL); burst(fb, W / 2, 408, bAge, 2.2); }
  // —— screen shake ——
  let sh = last < .09 ? 1 : 0; if (bAge < .2) sh = 2; for (const h of [TL.hit, TL.punch]) { const a = t - h; if (a >= 0 && a < .36) sh = 3 - Math.floor(a / .12); }
  if (inBurst) sh = 1; if (t >= TL.burstHit && t < TL.burstHit + .2) sh = 2;
  if (sh) shift(fb, Math.round((hash((t * FPS) | 0, 1) - .5) * 2 * sh), Math.round((hash((t * FPS) | 0, 2) - .5) * 2 * sh));
  // —— counter + gauge ——
  const ease = eo(clamp(last / .22, 0, 1)), lg = n ? lerp(LOGP[n - 1], LOGP[n], ease) : 0, slam = last < 2.5 / FPS;
  if (t < TL.burst) {
    lineC(fb, 'POSSIBLE ORDERS', W / 2, 84, 1, PAL);
    bigValue(lg, 98, slam);
    lineC(fb, n ? `CARD ${n} OF 52` : 'CARD 0 OF 52', W / 2, 142, 2, PAL);
    if (n && last < .5 && t < TL.sil) lineC(fb, `*×${53 - n}*`, DX + 52, Math.round(DY - 30 - last / .5 * 18), 2, PAL);      // the multiplier floats up from the deck
    digitsGauge(fb, W / 2, 438, 200, lg + 1, t, GMARKS, Math.floor(lg) + 1 === 1 ? '1 DIGIT LONG' : `${Math.floor(lg) + 1} DIGITS LONG`);
  } else if (t < TL.punch) {
    const tried = inBurst ? 27.54 * eo((t - TL.burstGo) / (TL.burstHit - TL.burstGo)) : t < TL.burstGo ? 0 : 27.54;
    lineC(fb, 'SHUFFLES EVER TRIED', W / 2, 84, 1, PAL);
    bigValue(tried, 98, inBurst && ((t * FPS) | 0) % 2 === 0);
    lineC(fb, 'OUT OF 8.07×10 TO THE 67', W / 2, 142, 1, PAL);
    digitsGauge(fb, W / 2, 438, 200, 0, t, [], t >= TL.burstHit ? 'ORDERS SEEN: 0.000…004%' : 'SHARE OF ALL ORDERS SEEN');
    if (t >= TL.burstHit) lineC(fb, mod(t, .6) < .45 ? '*NOT EVEN CLOSE*' : 'NOT EVEN CLOSE', W / 2, 402 - (t - TL.burstHit < .08 ? 3 : 0), 2, PAL);
  } else if (!cta) {
    lineC(fb, 'IN ALL OF HISTORY', W / 2, 84, 1, PAL);
    bigNum(fb, '1ST', W / 2, 96 - (t - TL.punch < .1 ? 4 : 0), t - TL.punch < .1 ? 6 : 5, YEL);
    lineC(fb, 'NEVER SEEN BEFORE', W / 2, 142, 2, PAL);
    digitsGauge(fb, W / 2, 438, 200, 68, t, GMARKS, '68 DIGITS LONG');
  } else {
    lineC(fb, 'YOUR TURN', W / 2, 84, 1, PAL);
    bigNum(fb, '52', W / 2, 96 - (mod(t - TL.cta, 1) < .1 ? 3 : 0), 5, YEL);
    lineC(fb, 'CARDS. GO.', W / 2, 142, 2, PAL);
    digitsGauge(fb, W / 2, 438, 200, 68, t, GMARKS, '68 DIGITS LONG');
  }
  drawCaption(t);
  if (t >= TL.sil && t < TL.hit) { lut = darken(LUT.full, .5); bloom = 0; }
  for (const h of [TL.hit, TL.punch]) if (t >= h && t < h + 3 / FPS) lut = whiten(LUT.full, .75 - (t - h) * FPS / 4);
  if (t > TL.dur - .3) lut = darken(LUT.full, (t - (TL.dur - .3)) / .3);
  out.present(fb, lut);
  out.show(fb, BLOOM, bloom);
}

window.render = render;
window.TEXTS = t => {
  const c = capAt(t); if (!c) return [];
  return [{ id: 'cap' + c.t0, text: c.l.map(s => s.replace(/\*/g, '')).join(' '), x0: 0, y0: 100, x1: W * 4, y1: (30 + c.l.length * 19 + 14) * 4 }];
};
window.READY = true;
