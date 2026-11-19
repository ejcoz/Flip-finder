// Pet Cam demo: "Why does your dog tilt its head?" — the narration's timing (voice/dur.json, voice/words.json) drives everything.
import * as A from './art.js';
const { W, H, ACC } = A;

// ---------- the script: caption cut + what the picture does ----------
// lead / key / follow are word counts from the start of the line (script words, punctuation kept)
const LINES = [
  { id: 'l01', lead: 4, key: 3, kind: 'ask', vis: 'scene', tiltOn: 4 },
  { id: 'l02', lead: 4, key: 5, kind: 'ask', vis: 'view' },
  { id: 'l03', lead: 4, key: 2, kind: 'fact', vis: 'survey' },
  { id: 'l04', lead: 5, key: 2, kind: 'ask', vis: 'scene', tiltOn: 6, display: 'But a 2021 study found something stranger.' },
  { id: 'l05', lead: 7, key: 3, kind: 'fact', vis: 'xray' },
  { id: 'l06', lead: 3, key: 2, kind: 'fact', vis: 'study' },
  { id: 'l07', lead: 7, key: 3, kind: 'fact', vis: 'side' },
  { id: 'l08', lead: 4, key: 4, kind: 'ask', vis: 'push' },
  { id: 'l09', lead: 3, key: 2, kind: 'good', vis: 'listen' },
  { id: 'l10', lead: 6, key: 1, kind: 'good', vis: 'ball' },
];
const GAP = { l02: .45, l03: .3, l04: .5, l05: .4, l06: .3, l07: .45, l08: .4, l09: .25, l10: .35 };
const START = 0.15, TAIL = 2.2, LOOP = 0.7;

const cv = document.getElementById('c'), out = cv.getContext('2d');
const WORLD = document.createElement('canvas'); WORLD.width = W; WORLD.height = H;
const wg = WORLD.getContext('2d');

async function load() {
  for (const [fam, url, desc] of [['Inter', './fonts/Inter.ttf', { weight: '100 900' }], ['Inter', './fonts/Inter-Italic.ttf', { weight: '100 900', style: 'italic' }], ['JetBrains Mono', './fonts/JetBrainsMono.ttf', { weight: '100 800' }]]) {
    const f = new FontFace(fam, `url(${url})`, desc); await f.load(); document.fonts.add(f);
  }
  const [dur, words, script] = await Promise.all(['./voice/dur.json', './voice/words.json', './lines.json'].map(u => fetch(u).then(r => r.json())));
  return { dur, words, script };
}

const ease = t => (t = Math.max(0, Math.min(1, t)), t * t * (3 - 2 * t));
const back = t => { t = Math.max(0, Math.min(1, t)) - 1; return 1 + t * t * (2.4 * t + 1.4); };

function build({ dur, words, script }) {
  let t = START;
  for (const L of LINES) {
    t += GAP[L.id] || 0;
    L.t0 = t; L.t1 = t + dur[L.id]; t = L.t1;
    L.text = (L.display || script.find(s => s.id === L.id).text).split(/\s+/);   // on-screen words (digits, not the spoken spelling)
    const wt = words[L.id], n = L.text.length, m = wt.length;
    // script word i gets the time of whisper word round(i*m/n) (counts can differ, e.g. hyphenated words)
    L.wt = L.text.map((_, i) => { const w = wt[Math.min(m - 1, Math.round(i * m / n))]; return L.t0 + Math.max(0, w[1]); });
  }
  const end = LINES[LINES.length - 1].t1 + TAIL;
  window.DUR = +(end + LOOP).toFixed(2);
  // sound events: voice placement, card whooshes, pops, chimes
  const EV = [];
  LINES.forEach((L, i) => {
    EV.push({ t: L.t0, type: 'vo', id: L.id });
    const prev = LINES[i - 1];
    if (isCard(L.vis) && !(prev && isCard(prev.vis))) EV.push({ t: L.t0 - .12, type: 'whoosh' });
    else if (isCard(L.vis)) EV.push({ t: L.t0 - .1, type: 'swap' });
    if (L.tiltOn != null) EV.push({ t: L.wt[L.tiltOn], type: 'pop' });
    if (L.vis === 'side') [3, 5, 8].forEach(k => EV.push({ t: L.wt[Math.min(k, L.wt.length - 1)], type: 'tick' }));
    if (L.vis === 'listen') EV.push({ t: L.wt[3], type: 'chime' });
    if (L.vis === 'ball') EV.push({ t: L.wt[6], type: 'boing' });
    EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind });
  });
  EV.push({ t: end, type: 'loop' });
  window.EV = EV;
  window.LINES = LINES.map(({ id, t0, t1 }) => ({ id, t0, t1 }));
}
const isCard = v => ['view', 'survey', 'xray', 'study'].includes(v);

// ---------- animation state over time ----------
function lineAt(t) { let cur = null; for (const L of LINES) if (t >= L.t0 - 0.12) cur = L; return cur; }
function tiltAt(t) {
  // key poses: [time, tilt]; eased with a little overshoot between them
  const keys = [[0, 0]];
  const L1 = LINES[0], L4 = LINES[3], L7 = LINES[6], L9 = LINES[8], L10 = LINES[9];
  keys.push([L1.wt[4], -.32], [LINES[1].t0, -.32], [L4.t0, 0], [L4.wt[6], -.26], [LINES[4].t0, -.26]);
  for (const k of [3, 5, 8]) { const w = L7.wt[Math.min(k, L7.wt.length - 1)]; keys.push([w - .05, -.05], [w + .02, -.34]); }
  keys.push([L7.t1 + .2, -.1], [L9.wt[3], -.3], [L10.t0, -.3], [L10.wt[2], -.05], [L10.wt[6], -.36], [L10.t1 + 1.2, -.36], [L10.t1 + TAIL, 0]);
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return keys[keys.length - 1][1];
  const [ta, va] = keys[i], [tb, vb] = keys[i + 1], span = Math.min(.28, tb - ta);
  const k = t < tb - span ? 0 : back((t - (tb - span)) / span);
  return va + (vb - va) * k;
}
function blinkAt(t) { const p = (t + .7) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; }
function cameraAt(t) {
  const L8 = LINES[7], L9 = LINES[8], L10 = LINES[9];
  let z = 1;
  if (t > L8.t0) z = 1 + .3 * ease((t - L8.t0) / (L9.t1 - L8.t0));
  if (t > L10.t0) z = 1.3 - .3 * ease((t - L10.t0) / 1.6);
  return z;
}

// ---------- drawing ----------
const DOGX = 520, DOGY = 1660, HEAD = [520, 1190];
function world(t, L) {
  A.setCtx(wg);
  wg.setTransform(1, 0, 0, 1, 0, 0);
  A.scene();
  const tilt = tiltAt(t);
  A.dog(DOGX, DOGY, { tilt, blink: blinkAt(t), perk: Math.min(1, Math.max(0, -tilt / .3)), brow: Math.min(1, -tilt / .3) });
  // '?' pops on the tilt
  for (const Lq of [LINES[0], LINES[3]]) {
    const tq = Lq.wt[Lq.tiltOn], k = (t - tq) / .25, endq = (LINES[LINES.indexOf(Lq) + 1].t0 - .2);
    if (t > tq && t < endq) { wg.save(); wg.translate(735, 990); wg.scale(back(k), back(k)); wg.fillStyle = ACC.ask; wg.font = '800 130px Inter'; wg.textBaseline = 'middle'; wg.textAlign = 'center'; wg.fillText('?', 0, 0); wg.restore(); }
  }
  // listening: sound arcs reaching the perked ear
  const L9 = LINES[8];
  if (t > L9.wt[2] && t < LINES[9].t0) {
    wg.strokeStyle = ACC.good; wg.lineWidth = 7; wg.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const r = 40 + ((i + (t * 1.6) % 1) * 34); wg.globalAlpha = Math.max(0, 1 - (r - 40) / 110); wg.beginPath(); wg.arc(HEAD[0] + 210, HEAD[1] - 80, r, Math.PI * .75, Math.PI * 1.25); wg.stroke(); }
    wg.globalAlpha = 1;
  }
  // the ball drops in on "ball" and bounces
  const L10 = LINES[9];
  if (t > L10.wt[6] - .3 && t < window.DUR - LOOP) {
    const k = t - (L10.wt[6] - .3), fall = Math.min(1, k / .3), bounce = Math.abs(Math.sin(Math.max(0, k - .3) * 7)) * Math.exp(-Math.max(0, k - .3) * 3) * 90;
    const yb = 1600 - (1 - fall * fall) * 700 - bounce, fade = 1 - ease((t - (window.DUR - LOOP - .4)) / .4);
    wg.globalAlpha = fade; A.ball(820, yb, 46); wg.globalAlpha = 1;
  }
  A.grass(1640, 1720, 40, '#2F7D45', 11, Math.sin(t * 1.3));
}

function cardLayer(t, L) {
  A.setCtx(out);
  const cl = LINES.filter(x => isCard(x.vis)).find(x => t >= x.t0 - .12 && t < (LINES[LINES.indexOf(x) + 1]?.t0 ?? 1e9) - .12);
  if (!cl) return;
  const idx = LINES.indexOf(cl), prev = LINES[idx - 1], next = LINES[idx + 1];
  const tin = t - (cl.t0 - .12), tout = (next.t0 - .12) - t;
  const enter = prev && isCard(prev.vis) ? 1 : ease(tin / .2), leave = next && isCard(next.vis) ? 1 : ease(tout / .15);
  const k = Math.min(enter, leave), s = .94 + .06 * k;
  const x = 60, y = 560, w = 860, h = 470, lt = t - cl.t0;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  const CARD = { view: ['the view', 'from down here', 'CAM 01'], survey: ['the survey', '582 dog owners', 'CAM 02'], xray: ['inside the head', 'listening mode', 'CAM 04'], study: ['the study', '40 dogs, 2021', 'CAM 05'] }[cl.vis];
  A.card(x, y, w, h, ...CARD, (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip();
  if (cl.vis === 'view') {
    A.ownerFace(490, 820, 150);
    // the dog's own muzzle, out of focus in the foreground, hiding the mouth
    out.save(); out.filter = 'blur(6px)';
    A.ell(490, 1010, 230, 120); out.fillStyle = '#EADBC2'; out.fill();
    A.ell(490, 915, 40, 28); out.fillStyle = '#2A2230'; out.fill();
    out.restore();
    A.pill('THEORY: VIEW BLOCKED?', 490, 660, ACC.ask);
  } else if (cl.vis === 'survey') {
    const p = ease((lt - .3) / .9);
    const row = (y0, label, pct, long) => {
      A.dogIcon(150, y0 + 30, 1.5, { long });
      out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textBaseline = 'top'; out.fillText(label, 210, y0);
      out.fillStyle = 'rgba(120,150,210,.18)'; out.beginPath(); out.roundRect(210, y0 + 42, 560, 34, 10); out.fill();
      out.fillStyle = ACC.fact; out.beginPath(); out.roundRect(210, y0 + 42, Math.max(12, 560 * pct / 100 * p), 34, 10); out.fill();
      out.fillStyle = '#F2F5FF'; out.font = '800 44px Inter'; out.textAlign = 'right'; out.fillText(Math.round(pct * p) + '%', 880, y0 + 34); out.textAlign = 'left';
    };
    row(700, 'LONG MUZZLE', 71, true); row(850, 'FLAT FACE', 52, false);
    out.fillStyle = '#8B95AD'; out.font = 'italic 400 24px Inter'; out.fillText('owners who said their dog often tilts', 210, 965);
  } else if (cl.vis === 'xray') {
    A.xrayHead(500, 860, -.3 * ease((lt - .6) / .4), (t * 1.2) % 1, ease((lt - .9) / .5));
    A.pill('TOY NAME → TILT', 490, 660, ACC.fact);
  } else if (cl.vis === 'study') {
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

function captionLayer(t) {
  A.setCtx(out);
  const end = LINES[LINES.length - 1].t1 + TAIL;
  let L = lineAt(t);
  if (t >= end || t < LINES[0].t0 || !L) L = LINES[0];     // the opening question is on frame 1 and returns for the loop
  const full = L === LINES[0];   // the opening question is whole from frame 1 (no word-by-word build) and returns for the loop
  const n = full ? L.text.length : L.wt.filter(w => w <= t + .02).length;
  const words = L.text.slice(0, Math.max(n, L === LINES[0] ? L.text.length * (full ? 1 : 0) : 0));
  const shown = full ? L.text : L.text.slice(0, n);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  const keyStart = full ? -1 : L.wt[L.lead];
  A.caption(lead, key, follow, L.kind, full ? 1 : (t - keyStart) / .22);
}

function sideTags(t) {   // "LEFT · LEFT · LEFT": one per tilt on the same side
  const L7 = LINES[6];
  if (t < L7.t0 || t > LINES[7].t0) return;
  A.setCtx(out);
  const marks = [3, 5, 8].map(k => L7.wt[Math.min(k, L7.wt.length - 1)]).filter(w => t >= w).length;
  if (marks) A.pill(marks === 1 ? 'SAME SIDE' : 'SAME SIDE ×' + marks, 540, 640, ACC.fact);
}

load().then(data => {
  build(data);
  window.render = (t) => {
    t = Math.min(t, window.DUR - 1e-4);
    const L = lineAt(t);
    world(t, L);
    const z = cameraAt(t), fx = HEAD[0], fy = HEAD[1] + 60;
    const tx = Math.min(0, Math.max(W - W * z, W / 2 - fx * z - (W / 2 - fx))), ty = Math.min(0, Math.max(H - H * z, (fy - fy * z)));
    out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = '#0A1124'; out.fillRect(0, 0, W, H);
    out.setTransform(z, 0, 0, z, tx, ty); out.drawImage(WORLD, 0, 0); out.setTransform(1, 0, 0, 1, 0, 0);
    cardLayer(t, L);
    sideTags(t);
    captionLayer(t);
  };
  window.TEXTS = (t) => {
    const T = [], cl = LINES.filter(x => isCard(x.vis)).find(x => t >= x.t0 && t < (LINES[LINES.indexOf(x) + 1]?.t0 ?? 1e9) - .12);
    if (cl) T.push({ id: 'card-' + cl.vis, text: cl.vis, x0: 60, y0: 560, x1: 920, y1: 1030 });
    return T;   // captions follow the voice and are checked as subtitles (see subs.srt), not here
  };
  window.render(0);
  window.READY = true;
});
