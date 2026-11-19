// Pet Cam film: "Why does your dog stare at you while it poops?" — v2, reference grammar:
// extreme close-up hook that pulls back; camera moves inside shots; tags pinned to the dog; a myth struck through;
// one evolving full-takeover data card; a persistent progress HUD; few cuts (bush → wild → guard → bush).
import * as A from './art.js';
import { dogProfile, runPose } from './dogpose.js';
const { W, H, ACC } = A;

const LINES = [
  { id: 'l01', lead: 4, key: 3, kind: 'ask', scene: 'bush' },
  { id: 'l02', lead: 2, key: 2, kind: 'bad', scene: 'bush' },
  { id: 'l03', lead: 8, key: 3, kind: 'fact', scene: 'bush' },
  { id: 'l04', lead: 6, key: 4, kind: 'bad', scene: 'wild' },
  { id: 'l05', lead: 6, key: 3, kind: 'good', scene: 'guard' },
  { id: 'l06', lead: 3, key: 2, kind: 'ask', scene: 'align' },
  { id: 'l07', lead: 9, key: 5, kind: 'fact', scene: 'align', display: 'In a study of 70 dogs, they preferred to line up north to south.' },
  { id: 'l08', lead: 4, key: 2, kind: 'fact', scene: 'align' },
  { id: 'l09', lead: 3, key: 3, kind: 'ask', scene: 'bush' },
  { id: 'l10', lead: 1, key: 2, kind: 'good', scene: 'bush' },
  { id: 'l11', lead: 3, key: 3, kind: 'good', scene: 'bush' },
];
const GAP = { l02: .3, l03: .35, l04: .45, l05: .45, l06: .45, l07: .3, l08: .3, l09: .45, l10: .25, l11: .4 };
const START = 0.15, TAIL = 2.0, LOOP = 0.7, WHIP = .3;
const BRAND = '@pupexplained';
const STEPS = [['EXPOSED', 'l03'], ['ON WATCH', 'l05'], ['N-S LINE', 'l07']];   // the persistent HUD's thread

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

let L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11, END, SHOTS, CARD, BYID = {};
function build({ dur, words, script }) {
  let t = START;
  for (const L of LINES) {
    t += GAP[L.id] || 0;
    L.t0 = t; L.t1 = t + dur[L.id]; t = L.t1;
    L.text = (L.display || script.find(s => s.id === L.id).text).split(/\s+/);
    const wt = words[L.id], n = L.text.length, m = wt.length;
    L.wt = L.text.map((_, i) => { const w = wt[Math.min(m - 1, Math.round(i * m / n))]; return L.t0 + Math.max(0, w[1]); });
    BYID[L.id] = L;
  }
  [L1, L2, L3, L4, L5, L6, L7, L8, L9, L10, L11] = LINES;
  END = L11.t1 + TAIL;
  window.DUR = +(END + LOOP).toFixed(2);
  SHOTS = [];
  LINES.forEach((L, i) => { if (!i || LINES[i - 1].scene !== L.scene) SHOTS.push({ scene: L.scene, t0: i ? L.t0 - .15 : 0 }); });
  SHOTS.forEach((s, i) => s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : window.DUR);
  CARD = { t0: L7.t0 - .15, t1: L9.t0 - .25 };   // one card, held for two lines, evolving
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  EV.push({ t: CARD.t0, type: 'whoosh' }, { t: L8.t0, type: 'swap' });
  EV.push({ t: L1.wt[4], type: 'pop' }, { t: L2.wt[2] + .15, type: 'boing' }, { t: L6.wt[3], type: 'pop' }, { t: L5.wt[7], type: 'chime' }, { t: L10.wt[2], type: 'chime' });
  STEPS.forEach(([, id]) => EV.push({ t: BYID[id].t0 + .2, type: 'tick' }));
  for (let k = 0; k < 6; k++) EV.push({ t: L7.wt[3] + .2 + k * .12, type: 'tick' });
  EV.push({ t: END, type: 'loop' });
  window.EV = EV;
}

// ---------- curves ----------
function keyed(keys, t) {
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return keys[keys.length - 1][1];
  const [ta, va] = keys[i], [tb, vb] = keys[i + 1], span = Math.min(.28, tb - ta);
  return va + (vb - va) * (t < tb - span ? 0 : back((t - (tb - span)) / span));
}
const glide = (keys, t) => {   // smooth camera keys (no overshoot)
  let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return keys[keys.length - 1][1];
  const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; return va + (vb - va) * ease((t - ta) / (tb - ta));
};
const blinkAt = (t, ph = 0) => { const p = (t + .7 + ph) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };
const breathAt = t => (Math.sin(t * 2.4) + 1) / 2;
const stareAt = t => keyed([[0, 1], [L2.t0, 1], [L2.wt[2], .4], [L3.t0, 1], [L6.t0, .3], [L7.t0, .8], [L9.t0, 1], [L11.t0, 1], [L11.wt[3], .2], [END - .8, 1]], t);
const tiltAt = t => keyed([[0, 0], [L2.wt[2], -.18], [L3.t0, 0], [L6.wt[3], -.28], [L7.t0, 0], [L11.wt[3], -.2], [END - .8, 0]], t);
// bush-scene camera: extreme close-up on the stare → pull back on line 2 → wide → push in for "bodyguard" → close-up again for the loop
const DX = 560, DY = 1710, HEAD = [DX, DY - 470];
const bushZoom = t => glide([[0, 2.6], [L1.t1, 2.6], [L2.t1 + .2, 1], [L9.t0, 1], [L10.t1, 1.45], [L11.t1, 1.45], [END, 2.6]], t);
let CAM = [1, 0, 0];
function camFor(z) { const tx = Math.min(0, Math.max(W - W * z, W / 2 - HEAD[0] * z)), ty = Math.min(0, Math.max(H - H * z, HEAD[1] - HEAD[1] * z)); return [z, tx, ty]; }
const toScreen = (x, y) => [x * CAM[0] + CAM[1], y * CAM[0] + CAM[2]];

// ---------- scenes ----------
function bushScene(g, t) {
  A.park();
  const stare = stareAt(t), tilt = tiltAt(t);
  A.dog(DX, DY, { tilt, stare, blink: stare > .7 ? 0 : blinkAt(t), perk: clamp(-tilt / .3), brow: .4, breath: breathAt(t), wag: t > L11.wt[3] && t < END - .8 ? Math.sin(t * 14) * .3 : 0 });
  A.bush(DX + 10, DY + 10, 760);
  A.leashPOV(DX + 6, DY - 345, Math.sin(t * 1.4) * 20);
  if (false) { const k = 0; g.save(); g.translate(790, 1060); g.scale(k, k); g.fillStyle = ACC.ask; g.font = '800 130px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0); g.restore(); }
}
function wildScene(g, t, lt) {
  const z = 1 + .08 * ease(lt / 3);   // slow push into the dark
  g.setTransform(z, 0, 0, z, 540 - 540 * z, 1300 - 1300 * z);
  A.forestNight(t);
  const look = keyed([[0, -.15], [L4.wt[3], .18], [L4.wt[7], -.2], [L4.t1 + .3, .1]], t);
  g.save(); g.translate(540, 1700); g.scale(.95, .95);
  A.dog(0, 0, { breed: 'wolf', tilt: look, stare: .6, blink: blinkAt(t, 2), breath: breathAt(t) });
  g.restore();
  A.bush(550, 1715, 700, ['#2E5A3A', '#1F4229', '#12291A']);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = 'rgba(255,92,108,.08)'; g.fillRect(0, 0, W, H);
}
function guardScene(g, t, lt) {
  const z = 1.08 - .08 * ease(lt / 2.4);   // gentle pull back to show both
  g.setTransform(z, 0, 0, z, 540 - 540 * z, 1300 - 1300 * z);
  A.park();
  A.owner(230, 1650, { talk: 0, blink: blinkAt(t, 1.4) });
  g.save(); g.translate(770, 1710); g.scale(.8, .8);
  A.dog(0, 0, { stare: 1, tilt: .12, breath: breathAt(t) });
  g.restore();
  A.bush(780, 1720, 560);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
// the strangest part: the dog trots in on a north-south compass line and pulls up, lined up along it
function alignScene(g, t) {
  A.park();
  // the compass line on the ground
  g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 8; g.setLineDash([26, 20]);
  g.beginPath(); g.moveTo(90, 1700); g.lineTo(990, 1700); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(1010, 1700); g.lineTo(975, 1680); g.lineTo(975, 1720); g.closePath(); g.fill();
  g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ACC.good; g.fillText('N', 1010, 1610); g.fillStyle = '#FFFFFF'; g.fillText('S', 70, 1610);
  g.restore();
  const t0 = L6.t0 - .15, u = t - t0, run = 1.1, stopX = 560;
  const x = u < run ? -260 + (stopX + 260) * (1 - Math.pow(1 - u / run, 2)) : stopX;
  const pose = u < run - .25 ? runPose(Math.floor(u / (2 / 15 * .75))) : u < run ? 'stepA' : 'stand';
  if (u < run - .25) { g.save(); g.globalAlpha = .55; g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const yy = 1440 - i * 40; g.beginPath(); g.moveTo(x - 260 - i * 20, yy); g.lineTo(x - 440 - i * 30, yy); g.stroke(); } g.restore(); }
  g.save(); g.translate(x, 1690); g.scale(.72, .72);
  dogProfile(g, 0, 0, { pose, wag: Math.sin(Math.floor(t * 15) / 15 * 10) * .2, blink: ((t + .4) % 3.1) < .12 ? 1 : 0 });
  g.restore();
  if (t > L6.wt[3] && t < L7.t0 - .1) { const k = back((t - L6.wt[3]) / .25); g.save(); g.translate(820, 1180); g.scale(k, k); g.fillStyle = ACC.ask; g.font = '800 130px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0); g.restore(); }
}
function drawScene(name, g, t, lt) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
  if (name === 'bush') { CAM = camFor(bushZoom(t)); g.setTransform(...[CAM[0], 0, 0, CAM[0], CAM[1], CAM[2]]); bushScene(g, t); g.setTransform(1, 0, 0, 1, 0, 0); }
  else if (name === 'wild') wildScene(g, t, lt);
  else if (name === 'align') alignScene(g, t);
  else guardScene(g, t, lt);
}

// ---------- tags pinned to things in the scene (leader line to the anchor) ----------
function tag(text, x, y, ax, ay, col, k = 1, struck = 0) {
  if (k <= 0) return;
  A.setCtx(out);
  out.save(); out.globalAlpha = Math.min(1, k * 1.5);
  out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(x, y); out.lineTo(ax, ay); out.stroke();
  out.fillStyle = col; out.beginPath(); out.arc(ax, ay, 8, 0, Math.PI * 2); out.fill();
  out.translate(x, y); out.scale(.85 + .15 * k, .85 + .15 * k); A.pill(text, 0, 0, col, 24);
  if (struck > 0) {   // the myth gets struck through, then a red X
    out.font = '600 24px JetBrains Mono'; const w = out.measureText(text).width + 40;
    out.strokeStyle = ACC.bad; out.lineWidth = 5; out.beginPath(); out.moveTo(-w / 2, 0); out.lineTo(-w / 2 + w * Math.min(1, struck * 2), 0); out.stroke();
    if (struck > .5) { const s = back((struck - .5) * 2) * 26; out.lineWidth = 8; out.beginPath(); out.moveTo(w / 2 + 20 - s, -s); out.lineTo(w / 2 + 20 + s, s); out.moveTo(w / 2 + 20 + s, -s); out.lineTo(w / 2 + 20 - s, s); out.stroke(); }
  }
  out.restore();
}
function tagLayer(t, scene) {
  if (scene === 'bush') {
    const [ex, ey] = toScreen(HEAD[0] + 40, HEAD[1] - 20), [bx, by] = toScreen(DX - 80, DY - 300);
    if (t > L1.wt[4] && t < L2.t0) tag('EYES ON YOU', 780, 760, ex, ey, ACC.ask, ease((t - L1.wt[4]) / .2));
    if (t > L2.t0 && t < L3.t0 - .1) tag('THEORY: JUST WEIRD?', 540, 760, ex, ey, ACC.ask, ease((t - L2.t0) / .2), (t - L2.wt[2]) / .5);
    if (t > L3.wt[6] && t < L4.t0 - .2) tag('EXPOSED', 790, 900, bx, by, ACC.bad, ease((t - L3.wt[6]) / .2));
    if (t > L10.wt[1] && t < L11.t0) tag('BODYGUARD: YOU', 740, 800, ex, ey, ACC.good, ease((t - L10.wt[1]) / .2));
  } else if (scene === 'wild') {
    if (t > L4.wt[7]) tag('PREDATOR', 760, 900, 960, 1290, ACC.bad, ease((t - L4.wt[7]) / .2));
  } else if (scene === 'guard') {
    if (t > L5.wt[6]) { tag('ON WATCH', 600, 720, 260, 1000, ACC.good, ease((t - L5.wt[6]) / .2)); }
  }
}
// strikethrough on the caption's key phrase for the myth line
function captionStrike(t) {
  if (!(t > L2.wt[2] + .1 && t < L3.t0 - .1)) return;
  const k = clamp((t - L2.wt[2] - .1) / .3);
  out.save(); out.font = '800 84px Inter'; const w = out.measureText(L2.text.slice(2, 4).join(' ')).width;
  out.strokeStyle = ACC.bad; out.lineWidth = 9; out.lineCap = 'round'; out.beginPath(); out.moveTo(540 - w / 2, 404); out.lineTo(540 - w / 2 + w * k, 404); out.stroke(); out.restore();
}

// ---------- the one evolving data card: takes over the frame for two lines ----------
function bigCard(t) {
  if (t < CARD.t0 || t >= CARD.t1) return;
  A.setCtx(out);
  const lt = t - CARD.t0, k = Math.min(ease(lt / .3), ease((CARD.t1 - t) / .25));
  out.save(); out.globalAlpha = k * .88; out.fillStyle = '#05080F'; out.fillRect(0, 0, W, H); out.restore();   // the scene drops away
  const x = 60, y = 560, w = 860, h = 860, s = .92 + .08 * k;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  const phaseB = t >= L8.t0 - .1;
  A.card(x, y, w, h, 'the study', phaseB ? 'calm vs unstable field' : '70 dogs · 37 breeds', 'CAM 05', (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip(); out.textBaseline = 'top';
  // phase A: the compass, icons turning to line up; the poop counter rolls
  const cx = 490, cy = phaseB ? 820 : 900, r = phaseB ? 130 : 200, p = ease((t - L7.wt[11]) / 1.2), un = phaseB ? ease((t - L8.wt[5]) / .5) : 0;
  out.strokeStyle = 'rgba(120,150,210,.35)'; out.lineWidth = 3; out.beginPath(); out.arc(cx, cy, r, 0, Math.PI * 2); out.stroke();
  out.shadowColor = ACC.good; out.shadowBlur = 14 * p; out.strokeStyle = `rgba(61,220,151,${(.3 + .7 * p) * (1 - un * .8)})`; out.lineWidth = 6;
  out.beginPath(); out.moveTo(cx, cy - r - 10); out.lineTo(cx, cy + r + 10); out.stroke(); out.shadowBlur = 0;
  out.fillStyle = '#F2F5FF'; out.font = '800 34px Inter'; out.textAlign = 'center'; out.textBaseline = 'middle'; out.fillText('N', cx, cy - r - 34); out.fillText('S', cx, cy + r + 34); out.textAlign = 'left'; out.textBaseline = 'top';
  for (let j = 0; j < 10; j++) {
    const a = j / 10 * Math.PI * 2, rr = r * .62, start = ((j * 2.399) % (Math.PI * 2)) - Math.PI, chaos = Math.sin(t * 6 + j * 1.7) * 1.4;
    A.dogIcon(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, phaseB ? .8 : 1.15, { tilt: start * (1 - p) + chaos * un });
  }
  const n = Math.round(1893 * ease((t - L7.wt[3]) / 1.4));
  out.fillStyle = '#F2F5FF'; out.font = '900 72px Inter'; out.fillText(n.toLocaleString('en-US'), 640, phaseB ? 640 : 700);
  out.fillStyle = '#8B95AD'; out.font = 'italic 400 24px Inter'; out.fillText('poops logged', 644, phaseB ? 720 : 780);
  // phase B: the card grows a second panel: calm (aligned) vs unstable (random)
  if (phaseB) {
    const b = ease((t - L8.t0) / .35);
    out.globalAlpha = k * b;
    const panel = (x0, label, calm, pill, col) => {
      out.fillStyle = 'rgba(120,150,210,.08)'; out.beginPath(); out.roundRect(x0, 1040, 380, 330, 18); out.fill();
      out.fillStyle = '#C9D2E8'; out.font = '600 24px JetBrains Mono'; out.fillText(label, x0 + 20, 1058);
      out.strokeStyle = 'rgba(90,180,255,.55)'; out.lineWidth = 3;
      for (let l = 0; l < 4; l++) { out.beginPath(); for (let xx = 0; xx <= 340; xx += 10) { const yy = 1130 + l * 50 + (calm ? Math.sin(xx / 60 + t) * 8 : Math.sin(xx / 12 + l * 3 + t * 6) * 16 + Math.sin(xx / 5 + l) * 8); xx ? out.lineTo(x0 + 20 + xx, yy) : out.moveTo(x0 + 20 + xx, yy); } out.stroke(); }
      A.pill(pill, x0 + 190, 1330, col, 22);
    };
    panel(90, 'CALM FIELD', true, 'ALIGNED ✓', ACC.good);
    if (t > L8.wt[5]) panel(510, 'UNSTABLE', false, 'RANDOM ✗', ACC.bad);
  }
  out.restore(); out.restore();
}

// ---------- persistent HUD: the film's thread, lighting up step by step ----------
function hud(t) {
  if (t < L2.t1) return;
  A.setCtx(out);
  const a = ease((t - L2.t1) / .3) * (t > END - .6 ? 1 - ease((t - (END - .6)) / .4) : 1);
  out.save(); out.globalAlpha = a;
  // vertical, on the left edge (like the reference's step dots): numbered dots that light up, a short label each
  out.fillStyle = 'rgba(8,14,28,.72)'; out.beginPath(); out.roundRect(52, 700, 210, 250, 22); out.fill();
  out.font = '600 19px JetBrains Mono'; out.textBaseline = 'middle'; out.textAlign = 'left';
  STEPS.forEach(([label, id], i) => {
    const on = t >= BYID[id].t0 + .2, y = 745 + i * 80, pop = on ? back((t - BYID[id].t0 - .2) / .25) : 1;
    out.strokeStyle = on ? ACC.good : 'rgba(120,150,210,.45)'; out.lineWidth = 3; out.beginPath(); out.arc(88, y, 18 * pop, 0, Math.PI * 2); out.stroke();
    if (on) { out.fillStyle = ACC.good; out.beginPath(); out.arc(88, y, 12 * pop, 0, Math.PI * 2); out.fill(); }
    out.fillStyle = on ? '#0B1224' : 'rgba(201,210,232,.6)'; out.textAlign = 'center'; out.fillText(String(i + 1), 88, y + 1); out.textAlign = 'left';
    out.fillStyle = on ? '#F2F5FF' : 'rgba(201,210,232,.45)'; out.fillText(label, 116, y + 1);
    if (i < STEPS.length - 1) { out.fillStyle = 'rgba(120,150,210,.3)'; out.fillRect(87, y + 20, 2, 40); }
  });
  out.restore();
}

function lineAt(t) { let cur = null; for (const L of LINES) if (t >= L.t0 - 0.12) cur = L; return cur; }
function captionLayer(t) {
  A.setCtx(out);
  let L = lineAt(t);
  if (t >= END || !L) L = L1;
  const full = L === L1;
  const shown = full ? L.text : L.text.slice(0, L.wt.filter(w => w <= t + .02).length);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  const onCard = t >= CARD.t0 && t < CARD.t1;
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
    if (window.COVER) return;   // cover stills: the scene only, the title is set on top
    if (p == null) tagLayer(t, S.scene);
    bigCard(t);
    hud(t);
    captionLayer(t);
    captionStrike(t);
    watermark();
  };
  window.TEXTS = (t) => {
    const T = [];
    if (t >= CARD.t0 && t < CARD.t1) T.push({ id: 'card', text: 'the study', x0: 60, y0: 560, x1: 920, y1: 1420 });
    return T;
  };
  window.render(0);
  window.READY = true;
});
