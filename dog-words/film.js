// Pet Cam film: "What does your dog really understand when you talk?" — a shot list laid on the narration.
// Scenes: home (owner talks) → close-up with word chips + survey card → the scanner lab + brain card → home (flat vs happy "good dog") → loop.
import * as A from './art.js';
const { W, H, ACC } = A;

const LINES = [
  { id: 'l01', lead: 5, key: 1, kind: 'ask', scene: 'home' },
  { id: 'l02', lead: 0, key: 4, kind: 'fact', scene: 'home' },
  { id: 'l03', lead: 9, key: 2, kind: 'fact', scene: 'home', display: 'In one survey, owners said their dogs responded to 89 words, on average.' },
  { id: 'l04', lead: 6, key: 3, kind: 'fact', scene: 'home' },
  { id: 'l05', lead: 6, key: 2, kind: 'ask', scene: 'lab' },
  { id: 'l06', lead: 2, key: 3, kind: 'fact', scene: 'lab' },
  { id: 'l07', lead: 1, key: 4, kind: 'ask', scene: 'lab' },
  { id: 'l08', lead: 7, key: 7, kind: 'good', scene: 'lab' },
  { id: 'l09', lead: 2, key: 3, kind: 'bad', scene: 'home' },
  { id: 'l10', lead: 2, key: 4, kind: 'good', scene: 'home' },
  { id: 'l11', lead: 4, key: 5, kind: 'good', scene: 'home' },
];
const GAP = { l02: .3, l03: .4, l04: .3, l05: .45, l06: .35, l07: .15, l08: .35, l09: .45, l10: .35, l11: .4 };
const START = 0.15, TAIL = 2.0, LOOP = 0.7, WHIP = .3;
const STEPS = [['WORDS', 2], ['MEANING', 5], ['TONE', 6]];   // the persistent progress HUD: [label, line index]
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
  CARDS = [{ kind: 'brain', t0: L6.wt[5] - .1, t1: L9.t0 - .3 }];   // one card for three lines, evolving (left half → right half → reward + the three conditions)
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  CARDS.forEach(c => EV.push({ t: c.t0, type: 'whoosh' }));
  EV.push({ t: L6.wt[2], type: 'swap' }, { t: L8.t0 + .3, type: 'tick' });
  STEPS.forEach(([, i]) => EV.push({ t: LINES[i].t0 + .2, type: 'tick' }));
  EV.push({ t: L1.wt[5], type: 'pop' });
  CHIPS().forEach(c => EV.push({ t: c.t, type: 'tick' }));
  [1, 2, 4].forEach(k => EV.push({ t: L4.wt[k], type: 'tick' }));
  EV.push({ t: L6.wt[2], type: 'pop' }, { t: L7.wt[1], type: 'pop' }, { t: L8.wt[12], type: 'chime' }, { t: L10.wt[2], type: 'boing' }, { t: END, type: 'loop' });
  window.EV = EV;
}
// word chips popping around the dog's head during the survey line
const CHIP_WORDS = ['SIT', 'WALK', 'BALL', 'NAME', 'TREAT', 'STAY', 'COME', 'NO'];
const TOP3 = () => ({ NAME: L4.wt[1], SIT: L4.wt[2], COME: L4.wt[4] });
const CHIPS = () => CHIP_WORDS.map((w, i) => ({ w, t: L3.t0 + .25 + i * (L3.wt[9] - L3.t0 - .4) / CHIP_WORDS.length, a: -Math.PI * .95 + i * Math.PI * 1.9 / (CHIP_WORDS.length - 1) }));

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
const homeTilt = t => keyed([[0, -.3], [L1.wt[5], -.3], [L2.t1, -.3], [L3.t0, 0], [L9.t0, 0], [L10.wt[2], -.32], [L11.t1 + .6, -.32], [END - .3, -.3]], t);   // frame 1 is already tilted, listening

// ---------- scenes ----------
function home(g, t) {
  A.livingRoom();
  const tilt = homeTilt(t), flat = t > L9.t0 - .2 && t < L10.wt[2], happy = t > L10.wt[2] && t < END - .3;
  const sayFlat = [L9.t0 - .1, L10.t0 - .1], sayHappy = [L10.t0 - .1, L11.t1 + .4], sayWalk = [L1.t1 - .2, L2.t1 + .2];
  const talking = talkAt(t, ...sayWalk) || talkAt(t, sayFlat[0], sayFlat[0] + .6) * .35 || talkAt(t, sayHappy[0], sayHappy[0] + .8);
  A.owner(230, 1650, { talk: talking, reach: happy ? ease((t - L10.wt[2]) / .4) * .7 : 0, blink: blinkAt(t, 1.4) });
  A.dog(720, 1660, { tilt, blink: flat ? .45 : blinkAt(t), perk: flat ? 0 : clamp(-tilt / .3), brow: flat ? 0 : clamp(-tilt / .3), breath: breathAt(t), wag: happy ? Math.sin(t * 15) * .4 : flat ? 0 : Math.sin(t * 5) * .08 });
  if (t > sayWalk[0] && t < sayWalk[1]) A.bubble('Wanna go for a walk?', 380, 860, 300, 1040, ease((t - sayWalk[0]) / .2));
  if (t > sayFlat[0] && t < sayFlat[1]) { A.bubble('good dog.', 360, 880, 300, 1040, ease((t - sayFlat[0]) / .2), 'flat'); A.pill('MEH', 900, 1060, ACC.bad, 24); }
  if (t > sayHappy[0] && t < sayHappy[1]) A.bubble('GOOD DOG!', 380, 860, 300, 1040, ease((t - sayHappy[0]) / .2), 'excited');
  if (happy) for (let i = 0; i < 4; i++) { const k = ((t - L10.wt[2]) * .8 + i * .25) % 1; g.globalAlpha = 1 - k; A.heart(820 + Math.sin(i * 2.1) * 120, 1080 - k * 260, .9 + i * .1); g.globalAlpha = 1; }
}
function lab(g, t) {           // a bright clinic with a scanner ring behind the dog
  const wall = g.createLinearGradient(0, 0, 0, 1450); wall.addColorStop(0, '#CFE0E8'); wall.addColorStop(1, '#A9C2CE'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  const fl = g.createLinearGradient(0, 1450, 0, H); fl.addColorStop(0, '#7E95A1'); fl.addColorStop(1, '#4E6470'); g.fillStyle = fl; g.fillRect(0, 1450, W, H - 1450);
  g.fillStyle = 'rgba(0,0,0,.18)'; A.ell(540, 1460, 470, 40); g.fill();
  const rg = g.createLinearGradient(0, 760, 0, 1460); rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(1, '#C6D3DA');
  g.fillStyle = rg; A.ell(540, 1110, 430, 360); g.fill();
  g.fillStyle = '#2A3442'; A.ell(540, 1130, 300, 250); g.fill();
  g.fillStyle = 'rgba(90,180,255,.25)'; A.ell(540, 1130, 260, 210); g.fill();
  g.fillStyle = '#5AB4FF'; g.beginPath(); g.roundRect(470, 820, 140, 16, 8); g.fill();
  g.save(); g.translate(560, 1700); g.scale(.9, .9);
  A.dog(0, 0, { tilt: Math.sin(t * 1.6) * .06, blink: blinkAt(t), perk: .5, brow: .5, breath: breathAt(t) });
  g.restore();
}
const glide = (keys, t) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; if (i >= keys.length - 1) return keys[keys.length - 1][1]; const [ta, va] = keys[i], [tb, vb] = keys[i + 1]; return va + (vb - va) * ease((t - ta) / (tb - ta)); };
const HEADW = [720, 1190];
let CAM = [1, 0, 0];
const camAt = (z, fx, fy) => [z, Math.min(0, Math.max(W - W * z, W / 2 - fx * z)), Math.min(0, Math.max(H - H * z, fy - fy * z))];
const toScreen = (x, y) => [x * CAM[0] + CAM[1], y * CAM[0] + CAM[2]];
function drawScene(name, g, t) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; CAM = [1, 0, 0];
  if (name === 'home') {   // extreme close-up hook → pull back; push in again for the words; back in for the loop
    const z = glide([[0, 2.3], [L1.wt[5] + .3, 2.3], [L1.t1 + .1, 1], [L2.t1 + .1, 1], [L3.t0 + .7, 1.45], [L4.t1 + .3, 1.45], [L9.t0 - .2, 1], [L11.t1 + .4, 1], [END, 2.3]], t);
    CAM = camAt(z, ...HEADW); g.setTransform(CAM[0], 0, 0, CAM[0], CAM[1], CAM[2]); home(g, t); g.setTransform(1, 0, 0, 1, 0, 0);
  } else lab(g, t);
}

// ---------- cards ----------
function cardLayer(t) {   // one tall card takes over: the scene drops away and the brain lights up half by half
  A.setCtx(out);
  const c = CARDS[0]; if (t < c.t0 || t >= c.t1) return;
  const lt = t - c.t0, k = Math.min(ease(lt / .3), ease((c.t1 - t) / .25));
  out.save(); out.globalAlpha = k * .88; out.fillStyle = '#05080F'; out.fillRect(0, 0, W, H); out.restore();
  const x = 60, y = 610, w = 860, h = 860, s = .92 + .08 * k, phaseB = t >= L8.t0 - .1;
  out.save(); out.globalAlpha = k; out.translate(x + w / 2, y + h / 2); out.scale(s, s); out.translate(-(x + w / 2), -(y + h / 2));
  A.card(x, y, w, h, 'inside the head', 'brain scan · 13 dogs', 'CAM 04', (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip(); out.textBaseline = 'top';
  const sc = phaseB ? .72 : 1.15, cx = 490, cy = phaseB ? 860 : 1000;
  const Lon = true, Ron = t >= L7.wt[1], both = t >= L8.wt[12];
  const glowL = ease((t - c.t0 - .2) / .3), glowR = Ron ? ease((t - L7.wt[1]) / .3) : 0;
  out.save(); out.translate(cx, cy); out.scale(sc, sc);
  const half = (sx, on, col) => {
    out.save(); out.beginPath(); out.ellipse(sx * 92, 0, 88, 120, 0, 0, Math.PI * 2);
    const gr = out.createRadialGradient(sx * 92, -30, 10, sx * 92, 0, 140); gr.addColorStop(0, '#FFE3A3'); gr.addColorStop(1, '#F2A65A');
    out.fillStyle = gr; out.fill();
    if (on > 0) { out.globalAlpha = on * .75; out.shadowColor = col; out.shadowBlur = 40; out.fillStyle = col; out.fill(); }
    out.restore();
    out.strokeStyle = 'rgba(160,90,40,.5)'; out.lineWidth = 4;
    for (let j = 0; j < 4; j++) { out.beginPath(); out.moveTo(sx * 40, -80 + j * 45); out.quadraticCurveTo(sx * 100, -100 + j * 45, sx * 150, -70 + j * 45); out.stroke(); }
  };
  half(-1, glowL, ACC.fact); half(1, glowR, ACC.ask);
  out.font = '600 26px JetBrains Mono'; out.textAlign = 'center';
  if (Lon) { out.fillStyle = ACC.fact; out.fillText('WHAT YOU SAY', -190, 150); }
  if (Ron) { out.fillStyle = ACC.ask; out.fillText('HOW YOU SAY IT', 200, 150); }
  if (both) { const kk = back((t - L8.wt[12]) / .3); out.save(); out.translate(0, 40); out.scale(kk, kk); out.shadowColor = ACC.good; out.shadowBlur = 30; out.fillStyle = ACC.good; A.ell(0, 0, 34, 34); out.fill(); out.restore(); }
  out.restore(); out.textAlign = 'left';
  if (phaseB) {   // the second panel grows underneath: reward response for the three combinations
    const b = ease((t - L8.t0) / .35);
    out.globalAlpha = k * b;
    out.fillStyle = '#C9D2E8'; out.font = '600 24px JetBrains Mono'; out.fillText('REWARD AREA', 100, 1050);
    const rows = [['PRAISE + HAPPY TONE', 1, ACC.good, L8.wt[12]], ['PRAISE + FLAT TONE', .2, '#8B95AD', L8.t0 + .5], ['NONSENSE + HAPPY TONE', .2, '#8B95AD', L8.t0 + .8]];
    rows.forEach(([lab, v, col, tw], i) => {
      const yy = 1110 + i * 105, f = ease((t - tw) / .6);
      out.fillStyle = '#F2F5FF'; out.font = '600 24px JetBrains Mono'; out.fillText(lab, 100, yy);
      out.fillStyle = 'rgba(120,150,210,.2)'; out.beginPath(); out.roundRect(100, yy + 38, 760, 22, 11); out.fill();
      out.fillStyle = col; out.beginPath(); out.roundRect(100, yy + 38, Math.max(22, 760 * v * f), 22, 11); out.fill();
    });
  }
  out.restore(); out.restore();
}
// tags pinned to things: the word chips and the count orbit the dog's head while the camera is in close
function pins(t, scene) {
  A.setCtx(out);
  if (scene === 'home' && (t < L1.t1 + .1 || t > END - .4)) { const [ax, ay] = toScreen(HEADW[0] - 40, HEADW[1] - 40); line3(720, 780, ax, ay, ACC.ask); A.pill('LISTENING', 720, 780, ACC.ask, 36); }
  if (scene === 'lab' && t > L5.wt[2] && t < CARDS[0].t0) {   // the myth: "dogs only hear tone", struck when the voice says "what you say"
    const k = back((t - L5.wt[2]) / .3), sx = t > L6.wt[2] ? clamp((t - L6.wt[2]) / .3) : 0, label = 'THEORY: JUST TONE?';
    line3(540, 760, 560, 1270, ACC.ask);
    out.save(); out.translate(540, 760); out.scale(k, k); A.pill(label, 0, 0, sx ? '#8B95AD' : ACC.ask, 28); out.restore();
    if (sx) {
      out.save(); out.font = '600 28px JetBrains Mono'; const w = out.measureText(label).width + 40;
      out.strokeStyle = ACC.bad; out.lineWidth = 7; out.lineCap = 'round'; out.beginPath(); out.moveTo(540 - w / 2, 760); out.lineTo(540 - w / 2 + w * sx, 760); out.stroke();
      const xk = back((t - L6.wt[2] - .2) / .25), xx = 540 + w / 2 + 50;
      if (t > L6.wt[2] + .2) { out.translate(xx, 760); out.scale(xk, xk); out.fillStyle = ACC.bad; A.ell(0, 0, 30, 30); out.fill(); out.strokeStyle = '#fff'; out.lineWidth = 6; out.beginPath(); out.moveTo(-11, -11); out.lineTo(11, 11); out.moveTo(11, -11); out.lineTo(-11, 11); out.stroke(); }
      out.restore();
    }
  }
  if (scene !== 'home' || t < L3.t0 || t > L5.t0) return;
  const [hx, hy] = toScreen(HEADW[0], HEADW[1] - 20), top = TOP3();
  for (const c of CHIPS()) {
    if (t < c.t) continue;
    const k = back((t - c.t) / .25), r = 330, x = 540 + Math.cos(c.a) * r, y = 1150 + Math.sin(c.a) * r * .8;
    const hit = top[c.w] && t >= top[c.w];
    out.save(); out.globalAlpha = t > L4.t0 && !top[c.w] ? .45 : 1; out.translate(x, y); out.scale(k, k); A.pill(hit ? c.w + ' ✓' : c.w, 0, 0, hit ? ACC.good : ACC.fact, 30); out.restore();
  }
  if (t > L3.wt[9]) {   // the count, pinned to the head
    const n = Math.round(89 * ease((t - L3.wt[9]) / .9)), k = back((t - L3.wt[9]) / .25);
    line3(540, 740, hx, hy - 180, ACC.fact);
    out.save(); out.translate(540, 740); out.scale(k, k); A.pill('≈ ' + n + ' WORDS', 0, 0, ACC.fact, 34); out.restore();
  }
}
function line3(x, y, ax, ay, col) { out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(x, y); out.lineTo(ax, ay); out.stroke(); out.fillStyle = col; out.beginPath(); out.arc(ax, ay, 8, 0, Math.PI * 2); out.fill(); }
// persistent progress HUD on the left edge
function hud(t) {
  if (t < L3.t0) return;
  A.setCtx(out);
  const a = ease((t - L3.t0) / .3) * (t > END - .6 ? 1 - ease((t - (END - .6)) / .4) : 1);
  const hide = (t >= CARDS[0].t0 && t < CARDS[0].t1) || (t > L3.t0 && t < L5.t0 - .2);   // off while the card or the word chips fill the frame
  out.save(); out.globalAlpha = a * (hide ? 0 : 1);
  out.fillStyle = 'rgba(8,14,28,.72)'; out.beginPath(); out.roundRect(52, 632, 270, 206, 22); out.fill();
  out.font = '600 24px JetBrains Mono'; out.textBaseline = 'middle'; out.textAlign = 'left';
  STEPS.forEach(([label, li], i) => {
    const on = t >= LINES[li].t0 + .2, y = 670 + i * 65, pop = on ? back((t - LINES[li].t0 - .2) / .25) : 1;
    out.strokeStyle = on ? ACC.good : 'rgba(120,150,210,.45)'; out.lineWidth = 3; out.beginPath(); out.arc(88, y, 18 * pop, 0, Math.PI * 2); out.stroke();
    if (on) { out.fillStyle = ACC.good; out.beginPath(); out.arc(88, y, 12 * pop, 0, Math.PI * 2); out.fill(); }
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
  const full = L === L1;
  const shown = full ? L.text : L.text.slice(0, L.wt.filter(w => w <= t + .02).length);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  const onCard = t >= CARDS[0].t0 && t < CARDS[0].t1;
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
    if (p == null) drawScene(S.scene, out, t);
    else {
      const e = ease(p), blur = Math.sin(clamp(p) * Math.PI) * 18;
      drawScene(from.scene, SA.getContext('2d'), t); drawScene(to.scene, SB.getContext('2d'), t);
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
    if (t >= c.t0 && t < c.t1) T.push({ id: 'card', text: 'inside the head', x0: 60, y0: 610, x1: 920, y1: 1470 });
    return T;
  };
  window.render(0);
  window.READY = true;
});
