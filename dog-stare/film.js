// Pet Cam film: "Why does your dog stare at you while it poops?" — a shot list laid on the narration (voice/dur.json, voice/words.json).
// Scenes: the stare behind the bush (owner's POV) → the wild (a wolf, eyes in the dark) → the owner on guard → back to the bush with
// the study cards → push-in on the stare → the opening frame again for the loop.
import * as A from './art.js';
const { W, H, ACC } = A;

const LINES = [
  { id: 'l01', lead: 4, key: 3, kind: 'ask', scene: 'bush' },
  { id: 'l02', lead: 2, key: 2, kind: 'fact', scene: 'bush' },
  { id: 'l03', lead: 8, key: 3, kind: 'fact', scene: 'bush' },
  { id: 'l04', lead: 6, key: 4, kind: 'bad', scene: 'wild' },
  { id: 'l05', lead: 6, key: 3, kind: 'good', scene: 'guard' },
  { id: 'l06', lead: 3, key: 2, kind: 'ask', scene: 'bush' },
  { id: 'l07', lead: 9, key: 5, kind: 'fact', scene: 'bush', display: 'In a study of 70 dogs, they preferred to line up north to south.' },
  { id: 'l08', lead: 4, key: 2, kind: 'fact', scene: 'bush' },
  { id: 'l09', lead: 3, key: 3, kind: 'ask', scene: 'close' },
  { id: 'l10', lead: 1, key: 2, kind: 'good', scene: 'close' },
  { id: 'l11', lead: 3, key: 3, kind: 'good', scene: 'bush' },
];
const GAP = { l02: .3, l03: .35, l04: .45, l05: .45, l06: .45, l07: .3, l08: .3, l09: .45, l10: .25, l11: .4 };
const START = 0.15, TAIL = 2.0, LOOP = 0.7, WHIP = .3;
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

let L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, END, SHOTS, CARDS;
function build({ dur, words, script }) {
  let t = START;
  for (const L of LINES) {
    t += GAP[L.id] || 0;
    L.t0 = t; L.t1 = t + dur[L.id]; t = L.t1;
    L.text = (L.display || script.find(s => s.id === L.id).text).split(/\s+/);
    const wt = words[L.id], n = L.text.length, m = wt.length;
    L.wt = L.text.map((_, i) => { const w = wt[Math.min(m - 1, Math.round(i * m / n))]; return L.t0 + Math.max(0, w[1]); });
  }
  [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11] = LINES;
  END = L11.t1 + TAIL;
  window.DUR = +(END + LOOP).toFixed(2);
  SHOTS = [];
  LINES.forEach((L, i) => { if (!i || LINES[i - 1].scene !== L.scene) SHOTS.push({ scene: L.scene, t0: i ? L.t0 - .15 : 0 }); });
  SHOTS.forEach((s, i) => s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : window.DUR);
  CARDS = [
    { kind: 'meter', t0: L3.wt[3] - .1, t1: L4.t0 - .3 },
    { kind: 'compass', t0: L7.t0 - .1, t1: L8.t0 - .12 },
    { kind: 'field', t0: L8.t0 - .12, t1: L9.t0 - .3 },
  ];
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  CARDS.forEach((c, i) => EV.push({ t: c.t0, type: i === 2 ? 'swap' : 'whoosh' }));
  EV.push({ t: L1.wt[4], type: 'pop' }, { t: L6.wt[3], type: 'pop' }, { t: L5.wt[7], type: 'chime' }, { t: L10.wt[2], type: 'chime' });
  for (let k = 0; k < 9; k++) EV.push({ t: L3.wt[3] + .25 + k * .09, type: 'tick' });
  EV.push({ t: END, type: 'loop' });
  window.EV = EV;
}

// ---------- animation curves ----------
function keyed(keys, t) {
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return keys[keys.length - 1][1];
  const [ta, va] = keys[i], [tb, vb] = keys[i + 1], span = Math.min(.28, tb - ta);
  return va + (vb - va) * (t < tb - span ? 0 : back((t - (tb - span)) / span));
}
const blinkAt = (t, ph = 0) => { const p = (t + .7 + ph) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };
const breathAt = t => (Math.sin(t * 2.4) + 1) / 2;
const talkAt = (t, a, b) => (t > a && t < b) ? Math.abs(Math.sin((t - a) * 17)) : 0;
// the stare: on from the word "stare", off for "not being weird", back for the study, full for the close-up, off by the loop
const stareAt = t => keyed([[0, 0], [L1.wt[4], 1], [L2.t0, 1], [L2.wt[2], .4], [L3.t0, 1], [L6.t0, .3], [L7.t0, .8], [L9.t0, 1], [L11.t0, 1], [L11.wt[3], 0]], t);
const tiltAt = t => keyed([[0, 0], [L2.wt[2], -.18], [L3.t0, 0], [L6.wt[3], -.28], [L7.t0, 0], [L11.wt[3], -.2], [END - .3, 0]], t);

// ---------- scenes ----------
const DX = 560, DY = 1710;
function bushScene(g, t) {
  A.park();
  const stare = stareAt(t), tilt = tiltAt(t);
  A.dog(DX, DY, { tilt, stare, blink: stare > .7 ? 0 : blinkAt(t), perk: clamp(-tilt / .3), brow: .4, breath: breathAt(t), wag: t > L11.wt[3] ? Math.sin(t * 14) * .3 : 0 });
  A.bush(DX + 10, DY + 10, 760);
  A.leashPOV(DX + 6, DY - 345, Math.sin(t * 1.4) * 20);
  if (t > L6.wt[3] && t < L7.t0 - .1) { const k = back((t - L6.wt[3]) / .25); g.save(); g.translate(790, 1060); g.scale(k, k); g.fillStyle = ACC.ask; g.font = '800 130px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0); g.restore(); }
}
function wildScene(g, t, lt) {
  A.forestNight(t);
  const look = keyed([[0, -.15], [L4.wt[3], .18], [L4.wt[7], -.2], [L4.t1 + .3, .1]], t);
  g.save(); g.translate(540, 1700); g.scale(.95, .95);
  A.dog(0, 0, { breed: 'wolf', tilt: look, stare: .6, blink: blinkAt(t, 2), breath: breathAt(t) });
  g.restore();
  A.bush(550, 1715, 700, ['#2E5A3A', '#1F4229', '#12291A']);
  g.fillStyle = 'rgba(255,92,108,.08)'; g.fillRect(0, 0, W, H);   // a faint red wash: danger
  if (lt > .8) A.pill('PREDATOR?', 540, 960, ACC.bad, 24);
}
function guardScene(g, t) {
  A.park();
  A.owner(230, 1650, { talk: 0, blink: blinkAt(t, 1.4) });
  g.save(); g.translate(770, 1710); g.scale(.8, .8);
  A.dog(0, 0, { stare: 1, tilt: .12, breath: breathAt(t) });
  g.restore();
  A.bush(780, 1720, 560);
  const k = back((t - L5.wt[6]) / .3);
  if (t > L5.wt[6]) { A.shield(240, 760, k * 1.1); A.pill('ON WATCH', 240, 870, ACC.good, 24); }
}
function drawScene(name, g, t, lt) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
  const punch = (z, fx, fy, f) => { g.setTransform(z, 0, 0, z, Math.min(0, Math.max(W - W * z, W / 2 - fx * z)), Math.min(0, Math.max(H - H * z, fy - fy * z))); f(); g.setTransform(1, 0, 0, 1, 0, 0); };
  if (name === 'bush') {   // a quick punch-in on "stare", eased back out before the next line
    const z = 1 + .2 * keyed([[0, 0], [L1.wt[4], 1], [L2.t0 + .2, 1], [L2.t1, 0]], t);
    punch(z, DX, DY - 470, () => bushScene(g, t));
  } else if (name === 'close') {
    const z = 1 + .34 * ease((t - L9.t0) / (L10.t1 - L9.t0));
    punch(z, DX, DY - 470, () => bushScene(g, t));
    if (t > L10.wt[2]) { const k = back((t - L10.wt[2]) / .3); A.shield(280, 1080, k); A.pill('BODYGUARD', 280, 1190, ACC.good, 24); }
  }
  else if (name === 'wild') wildScene(g, t, lt);
  else if (name === 'guard') guardScene(g, t);
}

// ---------- cards ----------
function cardLayer(t) {
  A.setCtx(out);
  const c = CARDS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const i = CARDS.indexOf(c), prev = CARDS[i - 1], next = CARDS[i + 1];
  const enter = prev && Math.abs(prev.t1 - c.t0) < .05 ? 1 : ease((t - c.t0) / .2), leave = next && Math.abs(next.t0 - c.t1) < .05 ? 1 : ease((c.t1 - t) / .15);
  const k = Math.min(enter, leave), s = .94 + .06 * k, x = 60, y = 560, w = 860, h = 470, lt = t - c.t0;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  const META = { meter: ['risk meter', 'mid-poop', 'CAM 02'], compass: ['the study', '70 dogs · 37 breeds', 'CAM 05'], field: ['the field', 'calm vs unstable', 'CAM 06'] }[c.kind];
  A.card(x, y, w, h, ...META, (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip();
  if (c.kind === 'meter') {
    const n = Math.min(9, Math.floor(clamp((lt - .25) / .8) * 9 + .001));
    out.fillStyle = '#C9D2E8'; out.font = '600 28px JetBrains Mono'; out.textBaseline = 'top'; out.fillText('VULNERABILITY', 110, 700);
    for (let j = 0; j < 10; j++) {
      const on = j < n, col = j < 4 ? ACC.good : j < 7 ? ACC.ask : ACC.bad;
      out.fillStyle = on ? col : 'rgba(120,150,210,.16)'; out.beginPath(); out.roundRect(110 + j * 70, 760, 58, 90, 10); out.fill();
    }
    if (n >= 9) { out.fillStyle = ACC.bad; out.font = '800 64px Inter'; out.fillText('HIGH', 110, 880); }
    out.fillStyle = '#8B95AD'; out.font = 'italic 400 24px Inter'; out.fillText('eyes on the surroundings, body busy', 330, 905);
  } else if (c.kind === 'compass') {
    const cx = 490, cy = 830, r = 165, p = ease((lt - .3) / 1.4);
    out.strokeStyle = 'rgba(120,150,210,.35)'; out.lineWidth = 3; out.beginPath(); out.arc(cx, cy, r, 0, Math.PI * 2); out.stroke();
    out.shadowColor = ACC.good; out.shadowBlur = 14 * p; out.strokeStyle = `rgba(61,220,151,${.3 + .7 * p})`; out.lineWidth = 6;
    out.beginPath(); out.moveTo(cx, cy - r - 10); out.lineTo(cx, cy + r + 10); out.stroke(); out.shadowBlur = 0;
    out.fillStyle = '#F2F5FF'; out.font = '800 34px Inter'; out.textAlign = 'center'; out.textBaseline = 'middle';
    out.fillText('N', cx, cy - r - 34); out.fillText('S', cx, cy + r + 34); out.font = '600 26px Inter'; out.fillStyle = '#8B95AD'; out.fillText('E', cx + r + 30, cy); out.fillText('W', cx - r - 30, cy); out.textAlign = 'left';
    for (let j = 0; j < 10; j++) {   // dog icons around the ring turn to face along the north-south axis
      const a = j / 10 * Math.PI * 2, rr = r * .62, start = ((j * 2.399) % (Math.PI * 2)) - Math.PI;
      A.dogIcon(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.05, { tilt: start * (1 - p) });
    }
    out.fillStyle = '#8B95AD'; out.font = '600 22px JetBrains Mono'; out.textBaseline = 'top'; out.fillText('1,893 POOPS LOGGED', 640, 990);
  } else {
    const panel = (x0, label, calm, pill, col) => {
      out.fillStyle = 'rgba(120,150,210,.08)'; out.beginPath(); out.roundRect(x0, 650, 380, 330, 18); out.fill();
      out.fillStyle = '#C9D2E8'; out.font = '600 24px JetBrains Mono'; out.textBaseline = 'top'; out.fillText(label, x0 + 20, 668);
      out.strokeStyle = 'rgba(90,180,255,.55)'; out.lineWidth = 3;
      for (let l = 0; l < 4; l++) {
        out.beginPath();
        for (let xx = 0; xx <= 340; xx += 10) {
          const yy = 740 + l * 50 + (calm ? Math.sin(xx / 60 + t) * 8 : Math.sin(xx / 12 + l * 3 + t * 6) * 16 + Math.sin(xx / 5 + l) * 8);
          xx ? out.lineTo(x0 + 20 + xx, yy) : out.moveTo(x0 + 20 + xx, yy);
        }
        out.stroke();
      }
      for (let j = 0; j < 4; j++) A.dogIcon(x0 + 70 + j * 80, 935, 1, { tilt: calm ? 0 : ((j * 1.7 + 0.9) % 3) - 1.5 });
      A.pill(pill, x0 + 190, 1000, col, 20);
    };
    panel(90, 'CALM FIELD', true, 'ALIGNED ✓', ACC.good);
    panel(510, 'UNSTABLE', false, 'RANDOM ✗', ACC.bad);
  }
  out.restore(); out.restore();
}
function lineAt(t) { let cur = null; for (const L of LINES) if (t >= L.t0 - 0.12) cur = L; return cur; }
function captionLayer(t) {
  A.setCtx(out);
  let L = lineAt(t);
  if (t >= END || !L) L = L1;
  const full = L === L1;
  const shown = full ? L.text : L.text.slice(0, L.wt.filter(w => w <= t + .02).length);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  const onCard = CARDS.some(c => t >= c.t0 && t < c.t1);
  A.caption(lead, key, onCard ? '' : follow, L.kind, full ? 1 : (t - L.wt[L.lead]) / .22);
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
    if (p == null) drawScene(S.scene, out, t, t - S.t0);
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
    return T;
  };
  window.render(0);
  window.READY = true;
});
