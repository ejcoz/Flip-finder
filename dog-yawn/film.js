// Pet Cam: "Why does your dog yawn when you yawn?" — a shot list laid on the narration (voice/dur.json, voice/words.json).
// Scenes: home (extreme close-up mid-yawn → pull back) → owner / stranger / fake split → the heart cam + brain card (over home)
// → dog's-eye view of the owner yawning → home (the try-it-tonight test) → push back into the close-up for the loop.
import * as A from './art.js';
const { W, H, ACC } = A;

// ---------- the script: caption cut (word counts) + the scene each line plays in ----------
const LINES = [
  { id: 'l01', lead: 4, key: 4, kind: 'ask', scene: 'home' },
  { id: 'l02', lead: 5, key: 3, kind: 'bad', scene: 'home' },
  { id: 'l03', lead: 5, key: 4, kind: 'fact', scene: 'split', display: 'In one study, 25 dogs saw their owner yawn, and a stranger yawn.' },
  { id: 'l04', lead: 4, key: 3, kind: 'good', scene: 'split' },
  { id: 'l05', lead: 3, key: 5, kind: 'bad', scene: 'split' },
  { id: 'l06', lead: 3, key: 2, kind: 'good', scene: 'home' },
  { id: 'l07', lead: 5, key: 2, kind: 'fact', scene: 'home', display: '40 to 60% of adults catch yawns, and your dog’s brain may be tuned to you.' },
  { id: 'l08', lead: 7, key: 5, kind: 'good', scene: 'pov' },
  { id: 'l09', lead: 3, key: 2, kind: 'ask', scene: 'home' },
  { id: 'l10', lead: 0, key: 1, kind: 'good', scene: 'home' },
];
const GAP = { l02: .3, l03: .6, l04: .3, l05: .35, l06: .5, l07: .4, l08: .5, l09: .45, l10: .35 };
const START = 0, TAIL = 1.6, LOOP = 0.8, WHIP = .3;
const STEPS = [['OWNER WINS', 3], ['NO STRESS', 5], ['KNOWS YOU', 7]];   // the persistent progress HUD: [label, line index]
const BRAND = '@pupexplained';

const cv = document.getElementById('c'), out = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const SA = mk(), SB = mk();

async function load() {
  for (const [fam, url, desc] of [['Inter', './fonts/Inter.ttf', { weight: '100 900' }], ['Inter', './fonts/Inter-Italic.ttf', { weight: '100 900', style: 'italic' }], ['JetBrains Mono', './fonts/JetBrainsMono.ttf', { weight: '100 800' }]]) {
    const f = new FontFace(fam, `url(${url})`, desc); await f.load(); document.fonts.add(f);
  }
  const [dur, words, script] = await Promise.all(['./voice/dur.json', './voice/words.json', './lines.json'].map(u => fetch(u).then(r => r.json())));
  return { dur, words, script };
}
const clamp = t => Math.max(0, Math.min(1, t));
const ease = t => (t = clamp(t), t * t * (3 - 2 * t));
const back = t => { t = clamp(t) - 1; return 1 + t * t * (2.4 * t + 1.4); };

let L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, END, SHOTS, CARD;
function build({ dur, words, script }) {
  let t = START;
  for (const L of LINES) {
    t += GAP[L.id] || 0;
    L.t0 = t; L.t1 = t + dur[L.id]; t = L.t1;
    L.text = (L.display || script.find(s => s.id === L.id).text).split(/\s+/);
    const wt = words[L.id], n = L.text.length, m = wt.length;
    L.wt = L.text.map((_, i) => { const w = wt[Math.min(m - 1, Math.round(i * m / n))]; return L.t0 + Math.max(0, w[1]); });
  }
  [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10] = LINES;
  END = L10.t1 + TAIL;
  window.DUR = +(END + LOOP).toFixed(2);
  SHOTS = [];
  LINES.forEach((L, i) => { if (!i || LINES[i - 1].scene !== L.scene) SHOTS.push({ scene: L.scene, t0: i ? L.t0 - .15 : 0 }); });
  SHOTS.forEach((s, i) => s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : window.DUR);
  // one takeover card, held for two lines and evolving: the heart cam (l06) → inside the head (l07)
  CARD = { t0: L6.t0 - .05, t1: L8.t0 - .3, tB: L7.t0 - .1 };
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  EV.push({ t: CARD.t0, type: 'whoosh' }, { t: CARD.tB, type: 'swap' });
  STEPS.forEach(([, i]) => EV.push({ t: LINES[i].t0 + .2, type: 'tick' }));
  EV.push({ t: STRIKE(), type: 'strike' }, { t: L2.wt[5], type: 'pop' });
  for (const w of OWNER_TALLY()) EV.push({ t: w, type: 'tick' });
  EV.push({ t: L5.wt[2], type: 'pop' }, { t: L6.wt[4], type: 'strike' }, { t: L7.wt[6], type: 'pop' }, { t: L7.wt[12], type: 'chime' });
  EV.push({ t: L9.wt[6], type: 'pop' }, { t: L10.t0 + .1, type: 'pop' });
  for (const y of DOG_YAWNS()) EV.push({ t: y, type: 'yawn' });
  EV.push({ t: END, type: 'loop' });
  window.EV = EV;
}
const STRIKE = () => L2.t1 + .1;                                // the myth tag is struck just after the line ends
const OWNER_TALLY = () => [L4.wt[2], L4.wt[5], L4.t1 + .05];  // the owner panel dog yawns three times on l04 (illustrative)
const DOG_YAWNS = () => [L1.t1 + 1.0, L9.wt[4] + .9, END - 1.25];

// ---------- animation curves ----------
const glide = (keys, t) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; if (i >= keys.length - 1) return keys[keys.length - 1][1]; const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; return va + (vb - va) * ease((t - ta) / (tb - ta)); };
// one yawn starting at t0: opens over .55 s, holds, closes; d = total length
function yawnAt(t, t0, d = 1.7) { const u = t - t0; if (u < 0 || u > d) return 0; const o = .55, c = .55; return u < o ? ease(u / o) : u > d - c ? ease((d - u) / c) : 1 - .06 * Math.sin((u - o) * 6); }
const blinkAt = (t, ph = 0) => { const p = (t + .7 + ph) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };
const breathAt = t => (Math.sin(t * 2.4) + 1) / 2;
const talkAt = (t, a, b) => (t > a && t < b) ? Math.abs(Math.sin((t - a) * 17)) : 0;
// the home dog: frame 1 is already mid-yawn (held, then closes), catches the owner's yawn on l02 and l09, and is mid-yawn again for the loop
const homeDogYawn = t => Math.max(t < 1.6 ? (t < .9 ? 1 - .05 * Math.sin(t * 6) : ease((1.6 - t) / .7)) : 0, yawnAt(t, DOG_YAWNS()[0]), yawnAt(t, DOG_YAWNS()[1], 1.9), t > END - 1.25 ? ease((t - (END - 1.25)) / .55) : 0);
const homeOwnerYawn = t => Math.max(yawnAt(t, L1.t1 - .1, 1.8), yawnAt(t, L9.wt[3] - .2, 2.2));

// ---------- scenes (each draws a full frame on the current context) ----------
let PIN = [];   // tags pinned to things in the current scene: [text, x, y, anchorX, anchorY, colour, size]
const HEADW = [720, 1215];
let CAM = [1, 0, 0];
const camAt = (z, fx, fy) => [z, Math.min(0, Math.max(W - W * z, W / 2 - fx * z)), Math.min(0, Math.max(H - H * z, fy - fy * z))];
const toScreen = (x, y) => [x * CAM[0] + CAM[1], y * CAM[0] + CAM[2]];
const ZC = 2.75;   // the extreme close-up
function home(g, t) {
  A.livingRoom();
  const oy = homeOwnerYawn(t), dy = homeDogYawn(t);
  A.owner(230, 1650, { yawn: oy, talk: talkAt(t, L9.t0 + .05, L9.wt[3] - .3), blink: blinkAt(t, 1.4) });
  const wag = Math.sin(t * 5) * .08;
  A.dog(720, 1660, { tilt: -.04, blink: blinkAt(t), perk: 0, brow: .5, breath: breathAt(t), wag, yawn: dy });
  // the save cue on l09: a bookmark pops beside the dog on "save"
  if (t > L9.wt[6] && t < L10.t0 - .1) { const k = back((t - L9.wt[6]) / .3); g.save(); g.translate(560, 880); g.scale(k, k); A.pill('↓ SAVE THIS', 0, 0, ACC.ask, 30); g.restore(); }
}
function pov(g, t, lt) {     // the dog's-eye view: the owner leans in and yawns; the dog's own muzzle at the bottom of frame
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#2A2140'); wall.addColorStop(1, '#4A3A60'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#3A2F52'; g.fillRect(0, 1280, W, 60);   // the sofa back behind them
  const glow = g.createRadialGradient(540, 1000, 50, 540, 1000, 720); glow.addColorStop(0, 'rgba(255,184,107,.28)'); glow.addColorStop(1, 'rgba(255,184,107,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const lean = ease(lt / .9), sway = Math.sin(t * 1.4) * 6;
  const y = yawnAt(t, L8.t0 + .15, 2.1);
  A.ownerFace(540 + sway, 1060 - 30 * lean, 300 + 40 * lean, { yawn: y, blink: blinkAt(t, .4) });
  // the dog's own muzzle, soft and out of focus, rising into frame — and starting to open as the yawn catches
  const dy = yawnAt(t, L8.t0 + 1.25, 2.2), rise = ease(lt / .5);
  g.save(); g.filter = 'blur(12px)';
  A.ell(540, 1790 - 110 * rise, 480, 320); g.fillStyle = '#EADBC2'; g.fill();
  A.ell(540, 1540 - 110 * rise - 20 * dy, 72, 48); g.fillStyle = '#2A2230'; g.fill();
  if (dy > .05) { A.ell(540, 1640 - 110 * rise + 60 * dy, 120 * dy + 20, 70 * dy); g.fillStyle = '#5A2232'; g.fill(); }
  g.restore();
  const [mx, my] = [540 + sway, 1060 - 30 * lean + (300 + 40 * lean) * .5];
  if (lt > .4) PIN.push(['FAMILIAR FACE', 760, 760, 540 + sway + 170, 1060 - 30 * lean - 120, ACC.good, 26]);
  if (dy > .3) PIN.push(['CAUGHT IT', 300, 1330, 460, 1470 - 110 * rise, ACC.good, 26]);
  void mx; void my;
}
// the split: CAM panels, one per condition. The person yawns (or fakes it), the dog in the same panel answers — or doesn't.
const PANELS = [
  { cam: 'CAM 01', label: 'OWNER', who: 'owner', fake: false, y: 590, bg: '#24304F' },
  { cam: 'CAM 02', label: 'STRANGER', who: 'stranger', fake: false, y: 885, bg: '#2B2448' },
  { cam: 'CAM 03', label: 'FAKE YAWN', who: 'owner', fake: true, y: 1180, bg: '#1F3A3A' },
];
function panelTimes() {
  return [
    { in: L3.t0 - .1, yawns: [L3.wt[7], L4.wt[2] - .7, L4.wt[5] - .7], dog: [L3.wt[9], ...OWNER_TALLY()] },
    { in: L3.wt[4], yawns: [L3.wt[11], L4.wt[3]], dog: [L4.t1 + .35] },
    { in: L5.wt[6] - .3, yawns: [L5.wt[7] - .1, L5.wt[10]], dog: [] },
  ];
}
function split(g, t) {
  g.fillStyle = '#0B1224'; g.fillRect(0, 0, W, H);
  const PT = panelTimes();
  PANELS.forEach((P, i) => {
    const T = PT[i]; if (t < T.in) return;
    const k = ease((t - T.in) / .3), x0 = 140, w = 780, h = 270, y0 = P.y;
    g.save(); g.globalAlpha = k; g.translate(x0 + w / 2, y0 + h / 2); g.scale(.96 + .04 * k, .96 + .04 * k); g.translate(-(x0 + w / 2), -(y0 + h / 2));
    g.save(); g.beginPath(); g.roundRect(x0, y0, w, h, 24); g.clip();
    g.fillStyle = P.bg; g.fillRect(x0, y0, w, h);
    const glow = g.createRadialGradient(x0 + w / 2, y0 + h, 20, x0 + w / 2, y0 + h, 420); glow.addColorStop(0, 'rgba(255,184,107,.18)'); glow.addColorStop(1, 'rgba(255,184,107,0)'); g.fillStyle = glow; g.fillRect(x0, y0, w, h);
    // the person, left
    const py = Math.max(...T.yawns.map(s => P.fake ? yawnAt(t, s, .7) * .8 : yawnAt(t, s, 1.5)));
    A.ownerFace(x0 + 175, y0 + 165, 110, { who: P.who, yawn: py, eyesOpen: P.fake, blink: blinkAt(t, i * .8) });
    // the dog, right (front head, same rig as the star)
    const dy = Math.max(0, ...T.dog.map(s => yawnAt(t, s, 1.3)));
    g.save(); g.translate(x0 + 560, y0 + 170); g.scale(.72, .72);
    A.frontHead('cream', { blink: blinkAt(t, 1.3 + i), yawn: dy, brow: .5 });
    g.restore();
    g.restore();
    g.strokeStyle = 'rgba(120,150,210,.28)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x0, y0, w, h, 24); g.stroke();
    g.fillStyle = '#9AA6C2'; g.font = '500 24px JetBrains Mono'; g.textBaseline = 'top'; g.textAlign = 'right'; g.fillText(P.cam, x0 + w - 24, y0 + 20);
    g.textAlign = 'left'; g.fillStyle = '#F2F5FF'; g.font = 'italic 700 30px Inter'; g.fillText(P.label.toLowerCase(), x0 + 26, y0 + 18);
    // the dog's yawn tally (illustrative): one small mark per yawn so far
    const n = T.dog.filter(s => t >= s + .35).length;
    for (let j = 0; j < 3; j++) { const on = j < n, cx = x0 + w - 44 - j * 40, cy = y0 + h - 36; g.fillStyle = on ? (i === 0 ? ACC.good : ACC.fact) : 'rgba(120,150,210,.25)'; A.ell(cx, cy, 13, 13); g.fill(); }
    g.restore();
  });
  // one tag for the whole split
  if (t > L4.wt[5]) { const k = back((t - L4.wt[5]) / .25); g.save(); g.translate(530, 1515); g.scale(k, k); A.pill(t > L5.wt[7] ? 'OWNER > STRANGER > FAKE' : 'OWNER > STRANGER', 0, 0, ACC.good, 26); g.restore(); }
}
function drawScene(name, g, t, lt) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; CAM = [1, 0, 0];
  if (name === 'home') {   // frame 1 is the extreme close-up mid-yawn → pull back on l02; l09 wide; push back in on l10 for the loop
    const z = glide([[0, ZC], [L1.t1 - .05, ZC], [L2.t0 + .7, 1], [L10.t0, 1], [END - .4, ZC]], t);
    CAM = camAt(z, ...HEADW); g.setTransform(CAM[0], 0, 0, CAM[0], CAM[1], CAM[2]); home(g, t); g.setTransform(1, 0, 0, 1, 0, 0);
  }
  else if (name === 'pov') pov(g, t, lt);
  else if (name === 'split') split(g, t);
}

// ---------- the takeover card ----------
function heartTrace(x, y, w, h, t, col, ph) {   // a scrolling ECG line at a steady rate
  out.save(); out.beginPath(); out.rect(x, y - h, w, h * 2); out.clip();
  out.strokeStyle = col; out.lineWidth = 4; out.lineJoin = 'round'; out.shadowColor = col; out.shadowBlur = 10; out.beginPath();
  const period = 150, off = (t * 160 + ph) % period;
  for (let px = 0; px <= w; px += 3) {
    const u = ((px + off) % period) / period;
    const v = u > .40 && u < .44 ? -(u - .40) / .04 : u >= .44 && u < .48 ? -1 + (u - .44) / .04 * 1.5 : u >= .48 && u < .52 ? .5 - (u - .48) / .04 * .5 : u > .62 && u < .74 ? -.18 * Math.sin((u - .62) / .12 * Math.PI) : 0;
    const yy = y + v * h; px ? out.lineTo(x + px, yy) : out.moveTo(x + px, yy);
  }
  out.stroke(); out.restore();
}
function cardLayer(t) {
  A.setCtx(out);
  const c = CARD; if (t < c.t0 || t >= c.t1) return;
  const lt = t - c.t0, k = Math.min(ease(lt / .3), ease((c.t1 - t) / .25));
  out.save(); out.globalAlpha = k * .9; out.fillStyle = '#05080F'; out.fillRect(0, 0, W, H); out.restore();
  const x = 60, y = 600, w = 860, h = 880, s = .96 + .04 * k, phaseB = t >= c.tB;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  A.card(x, y, w, h, phaseB ? 'inside the head' : 'the heart cam', phaseB ? 'mechanism unknown' : '21 dogs wore monitors', phaseB ? 'CAM 05' : 'CAM 04', (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip(); out.textBaseline = 'middle';
  if (!phaseB) {
    // three steady heart traces, one per condition; then STRESS? is struck through
    ['OWNER', 'STRANGER', 'FAKE'].forEach((lab, i) => {
      const ry = 850 + i * 160, a = ease((lt - .15 - i * .18) / .3);
      out.globalAlpha = k * a;
      out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textAlign = 'left'; out.fillText(lab, 100, ry - 50);
      out.fillStyle = 'rgba(120,150,210,.12)'; out.fillRect(100, ry - 30, 780, 60);
      heartTrace(100, ry + 10, 780, 46, t, ACC.fact, i * 37);
      out.globalAlpha = k;
    });
    if (t > L6.wt[3]) { const p = back((t - L6.wt[3]) / .25); out.save(); out.translate(300, 1340); out.scale(p, p); A.pill('NO CHANGE', 0, 0, ACC.good, 28); out.restore(); }
    if (t > L6.wt[6] - .1) {
      const p = back((t - L6.wt[6] + .1) / .25); out.save(); out.translate(690, 1340); out.scale(p, p); A.pill('STRESS?', 0, 0, ACC.bad, 28); out.restore();
      const sk = ease((t - L6.wt[6] - .15) / .25);
      if (sk > 0) { out.strokeStyle = ACC.bad; out.lineWidth = 7; out.lineCap = 'round'; out.beginPath(); out.moveTo(600, 1340); out.lineTo(600 + 180 * sk, 1340); out.stroke(); }
    }
  } else {
    // a crowd of 10 adults: 4 to 6 catch yawns (40–60 %); then the dog's x-ray head lights up — "may"
    const b = ease((t - c.tB) / .35);
    out.globalAlpha = k * b;
    out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textAlign = 'left'; out.fillText('ADULTS WHO CATCH YAWNS', 100, 740);
    const lit = t < L7.wt[2] ? 0 : t < L7.wt[2] + .5 ? 4 : 6;
    for (let i = 0; i < 10; i++) { const on = i < lit, mid = i >= 4 && i < 6; A.personIcon(130 + i * 70, 815, 1.25, on ? (mid ? 'rgba(90,180,255,.55)' : ACC.fact) : '#4A5674'); }
    if (lit) A.pill('40–60%', 790, 740, ACC.fact, 24);
    const gl = ease((t - L7.wt[10]) / .6);
    out.save(); out.translate(490, 1150); out.scale(.95, .95); out.translate(-500, -960);
    A.xrayHead(500, 960, 0, 0, 0, false); out.restore();
    if (gl > 0) {   // the brain region glows, softly pulsing — illustrative, nothing was scanned
      const pulse = .85 + .15 * Math.sin(t * 6);
      const gr = out.createRadialGradient(490, 1090, 10, 490, 1090, 170 * gl); gr.addColorStop(0, `rgba(255,201,77,${.75 * gl * pulse})`); gr.addColorStop(1, 'rgba(255,201,77,0)');
      out.fillStyle = gr; out.fillRect(300, 900, 380, 380);
    }
    if (t > L7.wt[12]) { const p = back((t - L7.wt[12]) / .25); out.save(); out.translate(490, 1390); out.scale(p, p); A.pill('MAY BE TUNED TO YOU', 0, 0, ACC.ask, 28); out.restore(); }
  }
  out.restore(); out.restore();
}

// ---------- pinned tags, HUD, captions, watermark ----------
function pins(t, scene) {
  A.setCtx(out);
  const list = [...PIN];
  if (scene === 'home') {
    if (t > L2.wt[3] && t < L3.t0 - .2) {   // the myth, pinned to the dog, then struck through
      const [hx, hy] = toScreen(720, 1150), a = back((t - L2.wt[3]) / .25);
      out.save(); out.globalAlpha = clamp(a);
      const tag = 'TIRED? STRESSED?'; list.push([tag, 690, 860, hx, hy, ACC.bad, 32]);
      out.restore();
    }
  }
  for (const [text, x, y, ax, ay, col, size = 24] of list) {
    out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(x, y); out.lineTo(ax, ay); out.stroke();
    out.fillStyle = col; out.beginPath(); out.arc(ax, ay, 8, 0, Math.PI * 2); out.fill();
    A.pill(text, x, y, col, size);
  }
  if (scene === 'home' && t > STRIKE() && t < L3.t0 - .2) {   // strike + red X
    const k = ease((t - STRIKE()) / .2), w = 360;
    out.strokeStyle = ACC.bad; out.lineWidth = 8; out.lineCap = 'round';
    out.beginPath(); out.moveTo(690 - w / 2, 862); out.lineTo(690 - w / 2 + w * k, 862); out.stroke();
    const xk = back((t - STRIKE() - .12) / .25);
    if (xk > 0) { out.save(); out.translate(890, 790); out.scale(xk, xk); out.lineWidth = 16; out.beginPath(); out.moveTo(-34, -34); out.lineTo(34, 34); out.moveTo(34, -34); out.lineTo(-34, 34); out.stroke(); out.restore(); }
  }
}
function hud(t, scene) {
  if (t < L2.t0 + .1) return;
  A.setCtx(out);
  const a = ease((t - L2.t0 - .1) / .3) * (t > END - .9 ? 1 - ease((t - (END - .9)) / .4) : 1);
  const onCard = t >= CARD.t0 && t < CARD.t1, compact = scene === 'split';   // on the split only the dots stay (the panels need the width)
  out.save(); out.globalAlpha = a * (onCard ? 0 : 1);
  out.fillStyle = 'rgba(8,14,28,.72)'; out.beginPath(); out.roundRect(52, 632, compact ? 72 : 290, 206, 22); out.fill();
  out.font = '600 24px JetBrains Mono'; out.textBaseline = 'middle'; out.textAlign = 'left';
  STEPS.forEach(([label, li], i) => {
    const on = t >= LINES[li].t0 + .2, y = 670 + i * 65, pop = on ? back((t - LINES[li].t0 - .2) / .25) : 1, col = ACC.good;
    out.strokeStyle = on ? col : 'rgba(120,150,210,.45)'; out.lineWidth = 3; out.beginPath(); out.arc(88, y, 18 * pop, 0, Math.PI * 2); out.stroke();
    if (on) { out.fillStyle = col; out.beginPath(); out.arc(88, y, 12 * pop, 0, Math.PI * 2); out.fill(); }
    out.fillStyle = on ? '#0B1224' : 'rgba(201,210,232,.6)'; out.textAlign = 'center'; out.fillText(String(i + 1), 88, y + 1); out.textAlign = 'left';
    if (!compact) { out.fillStyle = on ? '#F2F5FF' : 'rgba(201,210,232,.45)'; out.fillText(label, 116, y + 1); }
    if (i < STEPS.length - 1) { out.fillStyle = 'rgba(120,150,210,.3)'; out.fillRect(87, y + 20, 2, 25); }
  });
  out.restore();
}
function lineAt(t) { let cur = null; for (const L of LINES) if (t >= L.t0 - 0.12) cur = L; return cur; }
function captionLayer(t) {
  A.setCtx(out);
  let L = lineAt(t);
  if (t >= END || !L) L = L1;
  const full = L === L1;   // the opening question is whole from frame 1 and returns for the loop
  const shown = full ? L.text : L.text.slice(0, L.wt.filter(w => w <= t + .02).length);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  const onCard = t >= CARD.t0 && t < CARD.t1;   // the card shows it and the voice says it: drop the third line
  A.caption(lead, key, onCard ? '' : follow, L.kind, full ? 1 : (t - L.wt[L.lead]) / .22, full);
}
function watermark() {
  A.setCtx(out);
  out.save(); out.font = '600 30px Inter'; const w = out.measureText(BRAND).width + 36;
  out.globalAlpha = .6; out.fillStyle = 'rgba(8,14,28,.55)'; out.beginPath(); out.roundRect(540 - w / 2, 1716, w, 46, 23); out.fill();
  out.globalAlpha = .82; out.fillStyle = '#F2F5FF'; out.textAlign = 'center'; out.textBaseline = 'middle'; out.fillText(BRAND, 540, 1740); out.restore();
}

load().then(data => {
  build(data);
  window.render = (t) => {
    t = Math.min(t, window.DUR - 1e-4);
    let si = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); if (si < 0) si = SHOTS.length - 1;
    const S = SHOTS[si], next = SHOTS[si + 1], prev = SHOTS[si - 1];
    out.setTransform(1, 0, 0, 1, 0, 0); out.filter = 'none'; out.globalAlpha = 1;
    let p = null, from = null, to = null;
    if (next && t > next.t0 - WHIP / 2) { p = (t - (next.t0 - WHIP / 2)) / WHIP; from = S; to = next; }
    else if (prev && t < S.t0 + WHIP / 2) { p = (t - (S.t0 - WHIP / 2)) / WHIP; from = prev; to = S; }
    PIN = [];
    if (p == null) drawScene(S.scene, out, t, t - S.t0);
    else {
      const e = ease(p), blur = Math.sin(clamp(p) * Math.PI) * 18;
      drawScene(from.scene, SA.getContext('2d'), t, t - from.t0); drawScene(to.scene, SB.getContext('2d'), t, Math.max(0, t - to.t0));
      A.setCtx(out); out.setTransform(1, 0, 0, 1, 0, 0);
      out.filter = `blur(${blur}px)`; out.drawImage(SA, -W * e, 0); out.drawImage(SB, W * (1 - e), 0); out.filter = 'none';
    }
    if (window.COVER) return;
    if (p == null) pins(t, S.scene);
    cardLayer(t);
    hud(t, S.scene);
    captionLayer(t);
    watermark();
  };
  window.TEXTS = (t) => {
    const T = [];
    if (t >= CARD.t0 && t < CARD.t1) T.push({ id: 'card', text: t >= CARD.tB ? 'inside the head' : 'the heart cam', x0: 60, y0: 600, x1: 920, y1: 1480 });
    return T;
  };
  window.render(0);
  window.READY = true;
});
