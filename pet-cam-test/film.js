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
  { id: 'l08', lead: 4, key: 4, kind: 'ask', scene: 'close' },
  { id: 'l09', lead: 3, key: 2, kind: 'good', scene: 'close' },
  { id: 'l10', lead: 6, key: 1, kind: 'good', scene: 'home' },
];
const GAP = { l02: .45, l03: .3, l04: .5, l05: .4, l06: .3, l07: .45, l08: .4, l09: .25, l10: .35 };
const START = 0.15, TAIL = 2.2, LOOP = 0.7, WHIP = .3;
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
  CARDS = [
    { kind: 'survey', t0: L3.wt[6] - .1, t1: L4.t0 - .3 },
    { kind: 'xray', t0: L5.wt[7] - .1, t1: L6.t0 - .12 },
    { kind: 'study', t0: L6.t0 - .12, t1: L7.t0 - .3 },
  ];
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  CARDS.forEach((c, i) => EV.push({ t: c.t0, type: i === 2 ? 'swap' : 'whoosh' }));
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
const homeTilt = t => keyed([[0, 0], [L1.wt[4], -.32], [L2.t0 - .2, -.32], [L4.t0, 0], [L4.wt[6], -.26], [L5.t0, -.26], [L8.t0, -.08], [L9.wt[3], -.3], [L10.t0, -.3], [L10.wt[2], -.05], [L10.wt[6] + .1, -.36], [L10.t1 + 1.2, -.36], [END - .3, 0]], t);
const blinkAt = (t, ph = 0) => { const p = (t + .7 + ph) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };
const breathAt = t => (Math.sin(t * 2.4) + 1) / 2;
const talkAt = (t, a, b) => (t > a && t < b) ? Math.abs(Math.sin((t - a) * 17)) : 0;

// ---------- scenes (each draws a full frame on the current context) ----------
function dogOpts(t, tilt, extra = {}) { return { tilt, blink: blinkAt(t), perk: clamp(-tilt / .3), brow: clamp(-tilt / .3), breath: breathAt(t), ...extra }; }
const BALLBUB = () => [L10.wt[6] - .1, L10.t1 + .9];
function home(g, t, close) {
  A.livingRoom();
  const tilt = homeTilt(t);
  const hookBubble = t < L1.t1 + .3 || t > END - .4;
  A.owner(230, 1650, { talk: hookBubble ? talkAt(t, 0.05, L1.t1) : talkAt(t, L10.wt[6] - .1, L10.wt[6] + .5), reach: ease((t - (L10.wt[6] - .3)) / .4) * (t < END - .5 ? 1 : 0), blink: blinkAt(t, 1.4) });
  const wag = t > L10.wt[6] && t < END - .3 ? Math.sin(t * 14) * .35 : Math.sin(t * 5) * .08;
  A.dog(720, 1660, dogOpts(t, tilt, { wag }));
  // '?' on the tilts
  for (const [tq, tEnd] of [[L1.wt[4], L2.t0 - .2], [L4.wt[6], L5.t0 - .2]]) if (t > tq && t < tEnd) {
    const k = back((t - tq) / .25); g.save(); g.translate(930, 1000); g.scale(k, k); g.fillStyle = ACC.ask; g.font = '800 130px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0); g.restore();
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
  if (hookBubble) A.bubble("Who's a good dog?", 360, 860, 300, 1040, t > END - .4 ? 1 : ease(t / .2 + 1));
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
function park(g, t) {        // a long-muzzled dog and a flat-faced dog side by side
  A.park();
  const tH = keyed([[0, 0], [L3.wt[4], -.34], [L3.wt[6], -.05], [L3.wt[8], -.34], [L3.t1 + .2, -.3]], t);
  const tP = keyed([[0, 0], [L3.wt[10], -.14], [L3.t1, -.05]], t);
  for (const [x, breed, tilt, label, ph] of [[300, 'hound', tH, 'LONG MUZZLE', .3], [790, 'pug', tP, 'FLAT FACE', 1.9]]) {
    g.save(); g.translate(x, 1700); g.scale(.78, .78);
    A.dog(0, 0, { ...dogOpts(t + ph, tilt), breed, wag: Math.sin(t * 5 + ph) * .1 });
    g.restore();
    A.pill(label, x, 1180, ACC.fact, 24);
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
    g.fillStyle = '#9AA6C2'; g.font = '500 24px JetBrains Mono'; g.textBaseline = 'top'; g.fillText('CAM 0' + (6 + i), 90, y0 + 22);
    const n = ticks.filter(w => t >= w).length;
    if (n) A.pill((side < 0 ? '↺' : '↻') + ' ×' + n, 820, y0 + 50, ACC.fact, 22);
  });
}
function drawScene(name, g, t, lt) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
  if (name === 'home') home(g, t);
  else if (name === 'close') {      // slow push-in on the dog's face
    const z = 1 + .32 * ease((t - L8.t0) / (L9.t1 - L8.t0)), fx = 720, fy = 1260;
    g.setTransform(z, 0, 0, z, Math.min(0, Math.max(W - W * z, W / 2 - fx * z)), Math.min(0, Math.max(H - H * z, fy - fy * z))); home(g, t); g.setTransform(1, 0, 0, 1, 0, 0);
  }
  else if (name === 'pov') pov(g, t, lt);
  else if (name === 'park') park(g, t);
  else if (name === 'toys') toys(g, t);
  else if (name === 'split') split(g, t);
  A.grass && name === 'park' && A.grass(1680, 1760, 30, '#5DAA55', 11, Math.sin(t * 1.3));
}

// ---------- cards, captions, watermark ----------
function cardLayer(t) {
  A.setCtx(out);
  const c = CARDS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const i = CARDS.indexOf(c), prev = CARDS[i - 1], next = CARDS[i + 1];
  const enter = prev && Math.abs(prev.t1 - c.t0) < .05 ? 1 : ease((t - c.t0) / .2), leave = next && Math.abs(next.t0 - c.t1) < .05 ? 1 : ease((c.t1 - t) / .15);
  const k = Math.min(enter, leave), s = .94 + .06 * k, x = 60, y = 560, w = 860, h = 470, lt = t - c.t0;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  const META = { survey: ['the survey', '582 dog owners', 'CAM 02'], xray: ['inside the head', 'listening mode', 'CAM 04'], study: ['the study', '40 dogs, 2021', 'CAM 05'] }[c.kind];
  A.card(x, y, w, h, ...META, (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip();
  if (c.kind === 'survey') {
    const p = ease((lt - .2) / .8);
    const row = (y0, label, pct, long) => {
      A.dogIcon(150, y0 + 30, 1.5, { long });
      out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textBaseline = 'top'; out.fillText(label, 210, y0);
      out.fillStyle = 'rgba(120,150,210,.18)'; out.beginPath(); out.roundRect(210, y0 + 42, 560, 34, 10); out.fill();
      out.fillStyle = ACC.fact; out.beginPath(); out.roundRect(210, y0 + 42, Math.max(12, 560 * pct / 100 * p), 34, 10); out.fill();
      out.fillStyle = '#F2F5FF'; out.font = '800 44px Inter'; out.textAlign = 'right'; out.fillText(Math.round(pct * p) + '%', 880, y0 + 34); out.textAlign = 'left';
    };
    row(700, 'LONG MUZZLE', 71, true); row(850, 'FLAT FACE', 52, false);
    out.fillStyle = '#8B95AD'; out.font = 'italic 400 24px Inter'; out.fillText('owners who said their dog often tilts', 210, 965);
  } else if (c.kind === 'xray') {
    A.xrayHead(500, 860, -.3 * ease((lt - .3) / .4), (t * 1.2) % 1, ease((lt - .5) / .5));
    A.pill('TOY NAME → TILT', 490, 660, ACC.fact);
  } else {
    const p = ease((lt - .2) / .6);
    out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textBaseline = 'top';
    out.fillText('WORD LEARNERS · 7', 100, 668);
    for (let i = 0; i < 7; i++) A.dogIcon(130 + i * 66, 748, 1.2, { tilt: -.35 * p });
    A.pill('OFTEN TILTED', 760, 748, ACC.good, 22);
    out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.fillText('TYPICAL DOGS · 33', 100, 818);
    for (let i = 0; i < 33; i++) A.dogIcon(130 + (i % 11) * 60, 892 + Math.floor(i / 11) * 48, .95, { col: '#D9CDB8' });
    A.pill('RARELY', 840, 940, '#8B95AD', 22);
  }
  out.restore(); out.restore();
}
function lineAt(t) { let cur = null; for (const L of LINES) if (t >= L.t0 - 0.12) cur = L; return cur; }
function captionLayer(t) {
  A.setCtx(out);
  let L = lineAt(t);
  if (t >= END || !L) L = L1;
  const full = L === L1;   // the opening question is whole from frame 1 and returns for the loop
  const shown = full ? L.text : L.text.slice(0, L.wt.filter(w => w <= t + .02).length);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  A.caption(lead, key, follow, L.kind, full ? 1 : (t - L.wt[L.lead]) / .22);
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
    if (p == null) { drawScene(S.scene, out, t, t - S.t0); }
    else {
      const e = ease(p), blur = Math.sin(clamp(p) * Math.PI) * 18;
      drawScene(from.scene, SA.getContext('2d'), t, t - from.t0); drawScene(to.scene, SB.getContext('2d'), t, Math.max(0, t - to.t0));
      A.setCtx(out); out.setTransform(1, 0, 0, 1, 0, 0);
      out.filter = `blur(${blur}px)`; out.drawImage(SA, -W * e, 0); out.drawImage(SB, W * (1 - e), 0); out.filter = 'none';
    }
    cardLayer(t);
    captionLayer(t);
    watermark();
  };
  window.TEXTS = (t) => {
    const T = [], c = CARDS.find(c => t >= c.t0 && t < c.t1);
    if (c) T.push({ id: 'card-' + c.kind, text: c.kind, x0: 60, y0: 560, x1: 920, y1: 1030 });
    return T;   // captions follow the voice and are checked as subtitles (subs.srt)
  };
  window.render(0);
  window.READY = true;
});
