// Pet Cam demo: "Why does your dog tilt its head?" — a shot list laid on the narration (voice/dur.json, voice/words.json).
// Scenes change with the ideas: home → dog's-eye view → park lineup → home → toy pile (+ x-ray and study cards) → 3-dog split → home close-up → home (loop).
import * as A from './art.js';
const { W, H, ACC } = A;

// ---------- the script: caption cut (word counts) + the scene each line plays in ----------
const LINES = [
  { id: 'l01', lead: 4, key: 3, kind: 'ask', scene: 'home' },
  { id: 'l02', lead: 4, key: 5, kind: 'ask', scene: 'pov' },
  { id: 'l03', lead: 4, key: 2, kind: 'fact', scene: 'park' },
  { id: 'l04', lead: 5, key: 2, kind: 'ask', scene: 'home', display: 'But a 2021 study found something stranger.' },
  { id: 'l05', lead: 7, key: 3, kind: 'fact', scene: 'toys' },
  { id: 'l06', lead: 3, key: 2, kind: 'fact', scene: 'toys' },
  { id: 'l07', lead: 7, key: 3, kind: 'fact', scene: 'split' },
  { id: 'l08', lead: 4, key: 4, kind: 'ask', scene: 'home' },
  { id: 'l09', lead: 3, key: 2, kind: 'good', scene: 'home' },
  { id: 'l10', lead: 6, key: 1, kind: 'good', scene: 'home' },
];
const GAP = { l02: .45, l03: .3, l04: .5, l05: .4, l06: .3, l07: .45, l08: .4, l09: .25, l10: .35 };
const START = 0.15, TAIL = 2.2, LOOP = 0.7, WHIP = .3;
const STEPS = [['VIEW?', 1], ['WORDS', 4], ['SAME SIDE', 6]];   // the persistent progress HUD: [label, line index]
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

let L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, END, SHOTS, CARDS;
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
  // shots: a new shot wherever the scene changes, starting just before its line
  SHOTS = [];
  LINES.forEach((L, i) => { if (!i || LINES[i - 1].scene !== L.scene) SHOTS.push({ scene: L.scene, t0: i ? L.t0 - .15 : 0 }); });
  SHOTS.forEach((s, i) => s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : window.DUR);
  // cards: windows inside the lines (they cut in on the word that needs them)
  CARDS = [{ kind: 'big', t0: L5.wt[7] - .1, t1: L7.t0 - .3 }];   // one card, held for two lines, evolving (x-ray → + the study)
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  EV.push({ t: CARDS[0].t0, type: 'whoosh' }, { t: L6.t0, type: 'swap' }, { t: L3.wt[6], type: 'tick' }, { t: L3.wt[10], type: 'tick' });
  STEPS.forEach(([, i]) => EV.push({ t: LINES[i].t0 + .2, type: 'tick' }));
  EV.push({ t: L1.wt[4], type: 'pop' }, { t: L4.wt[6], type: 'pop' }, { t: L5.t0 + .05, type: 'pop' }, { t: L10.wt[6], type: 'pop' });
  for (const k of [3, 5, 8]) EV.push({ t: L7.wt[k], type: 'tick' });
  EV.push({ t: L9.wt[3], type: 'chime' }, { t: L10.wt[6] + .25, type: 'boing' }, { t: END, type: 'loop' });
  window.EV = EV;
}

// ---------- animation curves ----------
function keyed(keys, t) {   // [time, value] keys, eased with a little overshoot into each
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return keys[keys.length - 1][1];
  const [ta, va] = keys[i], [tb, vb] = keys[i + 1], span = Math.min(.28, tb - ta);
  return va + (vb - va) * (t < tb - span ? 0 : back((t - (tb - span)) / span));
}
const homeTilt = t => keyed([[0, -.32], [L1.wt[4], -.32], [L2.t0 - .2, -.32], [L4.t0, 0], [L4.wt[6], -.26], [L5.t0, -.26], [L8.t0, -.08], [L9.wt[3], -.3], [L10.t0, -.3], [L10.wt[2], -.05], [L10.wt[6] + .1, -.36], [L10.t1 + 1.2, -.36], [END - .3, -.32]], t);   // frame 1 is already mid-tilt (and so is the loop's end)
const blinkAt = (t, ph = 0) => { const p = (t + .7 + ph) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };
const breathAt = t => (Math.sin(t * 2.4) + 1) / 2;
const talkAt = (t, a, b) => (t > a && t < b) ? Math.abs(Math.sin((t - a) * 17)) : 0;

// ---------- scenes (each draws a full frame on the current context) ----------
function dogOpts(t, tilt, extra = {}) { return { tilt, blink: blinkAt(t), perk: clamp(-tilt / .3), brow: clamp(-tilt / .3), breath: breathAt(t), ...extra }; }
const BALLBUB = () => [L10.wt[6] - .1, L10.t1 + .9];
function home(g, t, close) {
  A.livingRoom();
  const tilt = homeTilt(t);
  const hookBubble = t > L1.t1 - .2 && t < L2.t0 + .1;   // frame 1 carries one message: the question
  A.owner(230, 1650, { talk: hookBubble ? talkAt(t, L1.t1 - .2, L2.t0) : talkAt(t, L10.wt[6] - .1, L10.wt[6] + .5), reach: ease((t - (L10.wt[6] - .3)) / .4) * (t < END - .5 ? 1 : 0), blink: blinkAt(t, 1.4) });
  const wag = t > L10.wt[6] && t < END - .3 ? Math.sin(t * 14) * .35 : Math.sin(t * 5) * .08;
  A.dog(720, 1660, dogOpts(t, tilt, { wag }));
  // '?' on the tilts
  for (const [tq, tEnd] of [[-1, L2.t0 - .2], [L4.wt[6], L5.t0 - .2], [END - .5, 1e9]]) if (t > tq && t < tEnd) {
    const k = back((t - tq) / .25); g.save(); g.translate(880, 1010); g.scale(k, k); g.fillStyle = ACC.ask; g.font = '800 130px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0); g.restore();
  }
  // listening: sound arcs reaching the perked ear
  if (t > L9.wt[2] && t < L10.t0) {
    g.strokeStyle = ACC.good; g.lineWidth = 7; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const r = 40 + ((i + (t * 1.6) % 1) * 34); g.globalAlpha = Math.max(0, 1 - (r - 40) / 110); g.beginPath(); g.arc(930, 1110, r, Math.PI * .75, Math.PI * 1.25); g.stroke(); }
    g.globalAlpha = 1;
  }
  // the ball rolls in on "ball"
  if (t > L10.wt[6] - .2 && t < END - .3) {
    const k = clamp((t - (L10.wt[6] - .2)) / .7), x = 1150 - 260 * (1 - Math.pow(1 - k, 3)), fade = 1 - ease((t - (END - .7)) / .4);
    g.globalAlpha = fade; g.save(); g.translate(x, 1740); g.rotate(-k * 6); g.translate(-x, -1740); A.ball(x, 1740, 44); g.restore(); g.globalAlpha = 1;
  }
  if (hookBubble) A.bubble("Who's a good dog?", 360, 860, 300, 1040, ease((t - L1.wt[4] - .55) / .2));
  const [b0, b1] = BALLBUB(); if (t > b0 && t < b1) A.bubble('Where’s your ball?', 380, 860, 300, 1040, ease((t - b0) / .2));
}
function pov(g, t, lt) {     // the dog's-eye view: the owner's face, the muzzle hiding the mouth
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#2A2140'); wall.addColorStop(1, '#4A3A60'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(540, 980, 50, 540, 980, 700); glow.addColorStop(0, 'rgba(255,184,107,.25)'); glow.addColorStop(1, 'rgba(255,184,107,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const sway = Math.sin(t * 1.6) * 8;
  A.ownerFace(540 + sway, 1000, 330);
  g.save(); g.filter = 'blur(10px)';
  const rise = ease(lt / .5);
  A.ell(540, 1720 - 120 * rise, 470, 330); g.fillStyle = '#EADBC2'; g.fill();
  A.ell(540, 1460 - 120 * rise, 70, 48); g.fillStyle = '#2A2230'; g.fill();
  g.restore();
  A.pill('THEORY: VIEW BLOCKED?', 540, 640, ACC.ask);
}
let PIN = [];   // tags pinned to things in the current scene: [text, x, y, anchorX, anchorY, colour]
function park(g, t) {        // a long-muzzled dog and a flat-faced dog side by side
  A.park();
  if (t > L3.wt[10] + .8) { const k = back((t - L3.wt[10] - .8) / .3); g.save(); g.translate(540, 900); g.scale(k, k); A.pill('VIEW BLOCKED? \u2192 PARTLY', 0, 0, ACC.ask, 26); g.restore(); }
  const tH = keyed([[0, 0], [L3.wt[4], -.34], [L3.wt[6], -.05], [L3.wt[8], -.34], [L3.t1 + .2, -.3]], t);
  const tP = keyed([[0, 0], [L3.wt[10], -.14], [L3.t1, -.05]], t);
  for (const [x, breed, tilt, label, ph] of [[300, 'hound', tH, 'LONG MUZZLE', .3], [790, 'pug', tP, 'FLAT FACE', 1.9]]) {
    g.save(); g.translate(x, 1700); g.scale(.78, .78);
    A.dog(0, 0, { ...dogOpts(t + ph, tilt), breed, wag: Math.sin(t * 5 + ph) * .1 });
    g.restore();
    const pct = label === 'LONG MUZZLE' ? 71 : 52, tw = label === 'LONG MUZZLE' ? L3.wt[6] : L3.wt[10];
    const n = t < tw ? 0 : Math.round(pct * ease((t - tw) / .7));
    PIN.push([n ? label + ' \u00B7 ' + n + '%' : label, x, 1080, x, 1290, n ? ACC.fact : '#8B95AD']);
  }
}
function toys(g, t) {        // the toy pile: the owner names a toy, the dog tilts
  A.livingRoom();
  A.owner(230, 1650, { talk: talkAt(t, L5.t0 + .05, L5.t0 + 1.2), blink: blinkAt(t, 1.4) });
  const tilt = keyed([[0, 0], [L5.wt[6], -.34], [L6.t1, -.34], [L6.t1 + .5, -.1]], t);
  A.dog(720, 1660, dogOpts(t, tilt, { wag: Math.sin(t * 6) * .1 }));
  A.toy('duck', 455, 1660, .9); A.toy('rope', 930, 1640, .8); A.toy('ball', 600, 1690, .8);
  if (t > L5.t0 && t < L5.wt[7] - .05) A.bubble('Get the duck!', 360, 860, 300, 1040, ease((t - L5.t0) / .2));
}
function split(g, t) {       // three dogs, each tilting to its own side, every time
  g.fillStyle = '#0B1224'; g.fillRect(0, 0, W, H);
  const P = [[580, 'cream', -1, '#24304F'], [880, 'black', 1, '#2B2448'], [1180, 'hound', -1, '#1F3A3A']];
  const ticks = [3, 5, 8].map(k => L7.wt[k]);
  const n = ticks.filter(w => t >= w).length;   // one tag for all three panels
  if (n) A.pill(n === 1 ? 'SAME SIDE' : 'SAME SIDE \u00D7' + n, 540, 535, ACC.fact, 22);
  P.forEach(([y0, breed, side, bg], i) => {
    g.save(); g.beginPath(); g.roundRect(60, y0, 860, 280, 24); g.clip();
    g.fillStyle = bg; g.fillRect(60, y0, 860, 280);
    const keys = [[0, 0]]; ticks.forEach(w => keys.push([w - .12 + i * .04, side * .06], [w + i * .04, side * .36]));
    const tilt = keyed(keys, t), s = .92, cy = y0 + 150;
    g.save(); g.translate(490, cy + 470 * s + 10); g.scale(s, s);
    A.dog(0, 0, { ...dogOpts(t + i * .9, tilt * -side * -1), breed, perk: clamp(Math.abs(tilt) / .3) });
    g.restore();
    g.restore();
    g.strokeStyle = 'rgba(120,150,210,.28)'; g.lineWidth = 2; g.beginPath(); g.roundRect(60, y0, 860, 280, 24); g.stroke();
    g.fillStyle = '#9AA6C2'; g.font = '500 24px JetBrains Mono'; g.textBaseline = 'top'; g.textAlign = 'right'; g.fillText('CAM 0' + (6 + i), 890, y0 + 22); g.textAlign = 'left';
  });
}
const glide = (keys, t) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; if (i >= keys.length - 1) return keys[keys.length - 1][1]; const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; return va + (vb - va) * ease((t - ta) / (tb - ta)); };
const HEADW = [720, 1190];
let CAM = [1, 0, 0];
const camAt = (z, fx, fy) => [z, Math.min(0, Math.max(W - W * z, W / 2 - fx * z)), Math.min(0, Math.max(H - H * z, fy - fy * z))];
const toScreen = (x, y) => [x * CAM[0] + CAM[1], y * CAM[0] + CAM[2]];
function drawScene(name, g, t, lt) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; CAM = [1, 0, 0];
  if (name === 'home') {   // extreme close-up on the tilt → pull back; slow push-in on l08–l09; push back in for the loop
    const z = glide([[0, 2.3], [L1.wt[4] + .35, 2.3], [L1.t1 + .15, 1], [L8.t0, 1], [L9.t1, 1.35], [L10.t0 + .5, 1], [L10.t1 + .4, 1], [END, 2.3]], t);
    CAM = camAt(z, ...HEADW); g.setTransform(CAM[0], 0, 0, CAM[0], CAM[1], CAM[2]); home(g, t); g.setTransform(1, 0, 0, 1, 0, 0);
  }
  else if (name === 'pov') pov(g, t, lt);
  else if (name === 'park') park(g, t);
  else if (name === 'toys') toys(g, t);
  else if (name === 'split') split(g, t);
  A.grass && name === 'park' && A.grass(1680, 1760, 30, '#5DAA55', 11, Math.sin(t * 1.3));
}

// ---------- cards, captions, watermark ----------
function cardLayer(t) {   // one tall card takes over: the scene drops away; x-ray first, then the study grows underneath
  A.setCtx(out);
  const c = CARDS[0]; if (t < c.t0 || t >= c.t1) return;
  const lt = t - c.t0, k = Math.min(ease(lt / .3), ease((c.t1 - t) / .25));
  out.save(); out.globalAlpha = k * .88; out.fillStyle = '#05080F'; out.fillRect(0, 0, W, H); out.restore();
  const x = 60, y = 610, w = 860, h = 860, s = .92 + .08 * k, phaseB = t >= L6.t0 - .1;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  A.card(x, y, w, h, phaseB ? 'the study' : 'inside the head', phaseB ? '40 dogs, 2021' : 'listening mode', phaseB ? 'CAM 05' : 'CAM 04', (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip(); out.textBaseline = 'top';
  const xs = phaseB ? .62 : 1, xy = phaseB ? 830 : 1010;
  out.save(); out.translate(490, xy); out.scale(xs, xs); out.translate(-500, -960);
  A.xrayHead(500, 960, -.3 * ease((lt - .3) / .4), (t * 1.2) % 1, ease((lt - .5) / .5)); out.restore();
  A.pill('TOY NAME → TILT', 490, phaseB ? 720 : 740, ACC.fact);
  if (phaseB) {
    const b = ease((t - L6.t0) / .35), p = ease((t - L6.t0 - .2) / .6);
    out.globalAlpha = k * b;
    out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textAlign = 'left'; out.fillText('WORD LEARNERS · 7', 100, 1010);
    for (let i = 0; i < 7; i++) A.dogIcon(130 + i * 66, 1090, 1.2, { tilt: -.35 * p });
    A.pill('OFTEN TILT', 790, 1090, ACC.good, 22);
    out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textAlign = 'left'; out.fillText('TYPICAL DOGS · 33', 100, 1170);
    for (let i = 0; i < 33; i++) A.dogIcon(130 + (i % 11) * 60, 1250 + Math.floor(i / 11) * 60, .95, { col: '#D9CDB8' });
    A.pill('RARELY', 840, 1250, '#8B95AD', 22);
  }
  out.restore(); out.restore();
}
// tags pinned to things (leader line + dot), drawn over the scene in screen space
function pins(t, scene) {
  A.setCtx(out);
  const list = [...PIN];
  if (scene === 'home' && (t < L1.t1 + .1 || t > END - .4)) { const [ax, ay] = toScreen(HEADW[0] - 40, HEADW[1] - 40); list.push(['HEAD TILT', 720, 780, ax, ay, ACC.ask, 36]); }
  for (const [text, x, y, ax, ay, col, size = 24] of list) {
    out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(x, y); out.lineTo(ax, ay); out.stroke();
    out.fillStyle = col; out.beginPath(); out.arc(ax, ay, 8, 0, Math.PI * 2); out.fill();
    A.pill(text, x, y, col, size);
  }
}
// persistent progress HUD on the left edge: numbered dots light up as the thread advances
function hud(t) {
  if (t < L2.t0 + .1) return;
  A.setCtx(out);
  const a = ease((t - L2.t0 - .1) / .3) * (t > END - .6 ? 1 - ease((t - (END - .6)) / .4) : 1);
  const onCard = t >= CARDS[0].t0 && t < CARDS[0].t1;
  out.save(); out.globalAlpha = a * (onCard ? 0 : 1);
  out.fillStyle = 'rgba(8,14,28,.72)'; out.beginPath(); out.roundRect(52, 632, 290, 206, 22); out.fill();
  out.font = '600 24px JetBrains Mono'; out.textBaseline = 'middle'; out.textAlign = 'left';
  STEPS.forEach(([label, li], i) => {
    const on = t >= LINES[li].t0 + .2, y = 670 + i * 65, pop = on ? back((t - LINES[li].t0 - .2) / .25) : 1;
    const col = i === 0 ? ACC.ask : ACC.good;   // the first idea is only partly true: amber, not green
    out.strokeStyle = on ? col : 'rgba(120,150,210,.45)'; out.lineWidth = 3; out.beginPath(); out.arc(88, y, 18 * pop, 0, Math.PI * 2); out.stroke();
    if (on) { out.fillStyle = col; out.beginPath(); out.arc(88, y, 12 * pop, 0, Math.PI * 2); out.fill(); }
    out.fillStyle = on ? '#0B1224' : 'rgba(201,210,232,.6)'; out.textAlign = 'center'; out.fillText(String(i + 1), 88, y + 1); out.textAlign = 'left';
    out.fillStyle = on ? '#F2F5FF' : 'rgba(201,210,232,.45)'; out.fillText(label, 116, y + 1);
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
  const onCard = t >= CARDS[0].t0 && t < CARDS[0].t1;   // the card shows it and the voice says it: drop the third line
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
    // whip-pan between scenes: the old shot slides out left, the new one in from the right, with motion blur
    let p = null, from = null, to = null;
    if (next && t > next.t0 - WHIP / 2) { p = (t - (next.t0 - WHIP / 2)) / WHIP; from = S; to = next; }
    else if (prev && t < S.t0 + WHIP / 2) { p = (t - (S.t0 - WHIP / 2)) / WHIP; from = prev; to = S; }
    PIN = [];
    if (p == null) { drawScene(S.scene, out, t, t - S.t0); }
    else {
      const e = ease(p), blur = Math.sin(clamp(p) * Math.PI) * 18;
      drawScene(from.scene, SA.getContext('2d'), t, t - from.t0); drawScene(to.scene, SB.getContext('2d'), t, Math.max(0, t - to.t0));
      A.setCtx(out); out.setTransform(1, 0, 0, 1, 0, 0);
      out.filter = `blur(${blur}px)`; out.drawImage(SA, -W * e, 0); out.drawImage(SB, W * (1 - e), 0); out.filter = 'none';
    }
    if (window.COVER) return;   // cover stills: the scene only, the title is set on top
    if (p == null) pins(t, S.scene);
    cardLayer(t);
    hud(t);
    captionLayer(t);
    watermark();
  };
  window.TEXTS = (t) => {
    const T = [], c = CARDS[0];
    if (t >= c.t0 && t < c.t1) T.push({ id: 'card', text: 'the study', x0: 60, y0: 610, x1: 920, y1: 1470 });
    return T;   // captions follow the voice and are checked as subtitles (subs.srt)
  };
  window.render(0);
  window.READY = true;
});
