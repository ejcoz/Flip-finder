// Pet Cam: "Why does your dog yawn when you yawn?" — a shot list laid on the narration (voice/dur.json, voice/words.json).
// Scenes: home (extreme close-up mid-yawn → pull back on "YOU") → owner / stranger / fake split → the takeover card (heart cam → brain)
// → the visit (a stranger yawns, the dog ignores it; the owner yawns, the dog catches it) → home (the try-it-tonight test) → loop.
// Voice: the user's recording (voice_src/yawn-narration.mp3), cut into voice/l01–l10.wav; l04 and l05 are one sentence, butted together.
import * as A from './art.js';
const { W, H, ACC } = A;

const L07_DISPLAY = 'In another study, 21 of 29 dogs caught a person\u2019s yawn, and your dog\u2019s brain may be tuned to you.';   // Joly-Mascheroni et al. 2008
// ---------- the script: caption cut (word counts) + the scene each line plays in ----------
const LINES = [
  { id: 'l01', lead: 4, key: 4, kind: 'ask', scene: 'home', display: 'Why does your dog yawn when YOU yawn?', emph: 'YOU' },
  { id: 'l02', lead: 5, key: 3, kind: 'bad', scene: 'home' },
  { id: 'l03', lead: 5, key: 4, kind: 'fact', scene: 'split', display: 'In one study, 25 dogs saw their owner yawn, and a stranger yawn.' },
  { id: 'l04', lead: 4, key: 3, kind: 'good', scene: 'split' },
  { id: 'l05', lead: 4, key: 5, kind: 'bad', scene: 'split' },
  { id: 'l06', lead: 3, key: 2, kind: 'good', scene: 'card' },
  { id: 'l07', lead: 3, key: 4, kind: 'fact', scene: 'card', display: L07_DISPLAY },
  { id: 'l08', lead: 7, key: 5, kind: 'good', scene: 'visit' },
  { id: 'l09', lead: 3, key: 2, kind: 'ask', scene: 'home' },
  { id: 'l10', lead: 0, key: 1, kind: 'good', scene: 'home' },
];
const GAP = { l02: .35, l03: 1.6, l04: .45, l05: 0, l06: .7, l07: .45, l08: .7, l09: .5, l10: .4 };   // l03: time to read the strike; l05 follows l04 with no gap (one sentence)
const START = 0, TAIL = 1.6, LOOP = 0.8, WHIP = .4;
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
  // one takeover card, held for two lines and evolving: the heart cam (l06) → inside the head (l07). It is a scene of its own,
  // so it comes in and goes out on a single whip
  const cs = SHOTS.find(s => s.scene === 'card'); CARD = { t0: cs.t0, t1: cs.t1, tB: L7.t0 - .1 };
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  EV.push({ t: CARD.tB, type: 'swap' });
  STEPS.forEach(([, i]) => EV.push({ t: LINES[i].t0 + .2, type: 'tick' }));
  EV.push({ t: L1.wt[6] - .1, type: 'whoosh' }, { t: STRIKE(), type: 'strike' }, { t: L2.wt[5], type: 'pop' });
  for (const w of OWNER_TALLY()) EV.push({ t: w, type: 'tick' });
  EV.push({ t: L5.wt[2], type: 'pop' }, { t: L6.wt[4], type: 'strike' }, { t: L7.wt[3], type: 'pop' }, { t: L7.wt[16], type: 'chime' });
  EV.push({ t: CTA()[0], type: 'pop' }, { t: L8.wt[1], type: 'tick' });
  for (const y of DOG_YAWNS()) EV.push({ t: y, type: 'yawn' });
  EV.push({ t: END, type: 'loop' });
  window.EV = EV;
}
const STRIKE = () => L2.t1 + .15;                               // the myth tag is struck just after the line ends (slowly, then a red X)
const CTA = () => [L9.wt[4] + 1.5, END - .9];                    // the SAVE THIS button: after the dog catches the yawn, through l10
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
const homeOwnerYawn = t => Math.max(yawnAt(t, L1.wt[6] - .45, 2.0), yawnAt(t, L9.wt[3] - .2, 2.2));

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
}
function dayRoom(g) {   // the visit: a bright daytime room, so it reads as a different moment from the evening at home
  const wall = g.createLinearGradient(0, 0, 0, 1420); wall.addColorStop(0, '#F3E4D0'); wall.addColorStop(1, '#E2C7A9'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(330, 560, 420, 470, 18); g.fill();
  const sky = g.createLinearGradient(0, 580, 0, 1010); sky.addColorStop(0, '#8FD0F2'); sky.addColorStop(1, '#D7EEF8'); g.fillStyle = sky; g.beginPath(); g.roundRect(348, 578, 384, 434, 10); g.fill();
  g.fillStyle = '#6FB86A'; A.ell(420, 1010, 120, 70); g.fill(); A.ell(640, 1015, 150, 80); g.fill();
  g.fillStyle = '#FFFFFF'; g.fillRect(534, 578, 12, 434); g.fillRect(348, 790, 384, 12);
  // a plant on the left, a shelf on the right
  g.fillStyle = '#C46A44'; g.beginPath(); g.moveTo(70, 1300); g.lineTo(190, 1300); g.lineTo(175, 1420); g.lineTo(85, 1420); g.closePath(); g.fill();
  g.fillStyle = '#4E9A5A'; for (const [x, y, r] of [[130, 1180, 70], [80, 1230, 55], [185, 1225, 60], [130, 1260, 60]]) { A.ell(x, y, r * .7, r); g.fill(); }
  g.fillStyle = '#B98A62'; g.fillRect(820, 760, 220, 18); g.fillStyle = '#5AB4FF'; g.fillRect(840, 700, 30, 60); g.fillStyle = '#FF8A5C'; g.fillRect(878, 714, 26, 46); g.fillStyle = '#FFC94D'; g.fillRect(910, 692, 34, 68);
  const floor = g.createLinearGradient(0, 1400, 0, H); floor.addColorStop(0, '#C99B6E'); floor.addColorStop(1, '#9C6E46'); g.fillStyle = floor; g.fillRect(0, 1400, W, H - 1400);
  g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { const yy = 1430 + k * k * 14; g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); }
  g.fillStyle = '#E8A93A'; A.ell(540, 1700, 500, 120); g.fill(); g.fillStyle = '#F2C463'; A.ell(540, 1690, 430, 92); g.fill();
}
const VISIT = () => ({ s: L8.wt[1] - .15, o: L8.wt[5] - .25, d: L8.wt[9] - .05 });   // stranger yawns, owner yawns, the dog catches the owner's
function visit(g, t) {
  dayRoom(g);
  const V = VISIT();
  A.owner(195, 1660, { yawn: yawnAt(t, V.o, 1.9), blink: blinkAt(t, 1.4) });
  g.save(); g.translate(885, 1660); g.scale(-1, 1); A.owner(0, 0, { who: 'stranger', yawn: yawnAt(t, V.s, 1.7), blink: blinkAt(t, 2.2) }); g.restore();
  // the dog glances at the stranger's yawn and does nothing; then looks to the owner and catches theirs
  const look = glide([[0, 0], [V.s + .3, 0], [V.s + .6, .14], [V.o - .1, .14], [V.o + .25, -.12], [V.d + 1.2, -.12], [V.d + 1.6, 0]], t);
  g.save(); g.translate(545, 1680); g.scale(.82, .82);
  A.dog(0, 0, { tilt: look, blink: blinkAt(t), brow: .5, breath: breathAt(t), wag: t > V.d ? Math.sin(t * 9) * .2 : Math.sin(t * 5) * .08, yawn: yawnAt(t, V.d, 1.7) });
  g.restore();
  PIN.push(['OWNER', 215, 905, 205, 975, ACC.good, 26], ['STRANGER', 860, 905, 875, 975, '#8B95AD', 26]);
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
    { in: L5.wt[4] - .2, yawns: [L5.wt[6], L5.wt[8] + .3], dog: [] },
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
    const z = glide([[0, ZC], [L1.wt[6] - .1, ZC], [L1.wt[6] + .3, 1], [L10.t0, 1], [END - .4, ZC]], t);   // pulls back on "YOU" to reveal the owner mid-yawn
    CAM = camAt(z, ...HEADW); g.setTransform(CAM[0], 0, 0, CAM[0], CAM[1], CAM[2]); home(g, t); g.setTransform(1, 0, 0, 1, 0, 0);
  }
  else if (name === 'visit') visit(g, t);
  else if (name === 'card') cardScene(g, t);
  else if (name === 'split') split(g, t);
}

// ---------- the takeover card ----------
function heartTrace(out, x, y, w, h, t, col, ph) {   // a scrolling ECG line at a steady rate
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
function cardScene(out, t) {   // the takeover card as its own scene (it whips in and out like any other shot)
  const c = CARD, lt = Math.max(0, t - c.t0), k = 1;
  out.fillStyle = '#060A15'; out.fillRect(0, 0, W, H);
  const x = 60, y = 600, w = 860, h = 880, phaseB = t >= c.tB;
  out.save();
  A.card(x, y, w, h, phaseB ? 'inside the head' : 'the heart cam', phaseB ? 'a second study, 2008 \u00B7 mechanism unknown' : '21 dogs wore monitors', phaseB ? 'CAM 05' : 'CAM 04', (lt / 6) % 1);
  out.save(); out.beginPath(); out.roundRect(x, y, w, h, 28); out.clip(); out.textBaseline = 'middle';
  if (!phaseB) {
    // three steady heart traces, one per condition; then STRESS? is struck through
    ['OWNER', 'STRANGER', 'FAKE'].forEach((lab, i) => {
      const ry = 850 + i * 160, a = ease((lt - .15 - i * .18) / .3);
      out.globalAlpha = k * a;
      out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textAlign = 'left'; out.fillText(lab, 100, ry - 50);
      out.fillStyle = 'rgba(120,150,210,.12)'; out.fillRect(100, ry - 30, 780, 60);
      heartTrace(out, 100, ry + 10, 780, 46, t, ACC.fact, i * 37);
      out.globalAlpha = k;
    });
    if (t > L6.wt[3]) { const p = back((t - L6.wt[3]) / .25); out.save(); out.translate(300, 1340); out.scale(p, p); A.pill('NO CHANGE', 0, 0, ACC.good, 28); out.restore(); }
    if (t > L6.wt[6] - .1) {
      const p = back((t - L6.wt[6] + .1) / .25); out.save(); out.translate(690, 1340); out.scale(p, p); A.pill('STRESS?', 0, 0, ACC.bad, 28); out.restore();
      const sk = ease((t - L6.wt[6] - .15) / .25);
      if (sk > 0) { out.strokeStyle = ACC.bad; out.lineWidth = 7; out.lineCap = 'round'; out.beginPath(); out.moveTo(600, 1340); out.lineTo(600 + 180 * sk, 1340); out.stroke(); }
    }
  } else {
    // the second study: 29 dogs, 21 of them catch a person's yawn (they light up one by one); then the x-ray brain glows — "may"
    const b = ease((t - c.tB) / .35);
    out.globalAlpha = k * b;
    out.fillStyle = '#C9D2E8'; out.font = '600 26px JetBrains Mono'; out.textAlign = 'left'; out.fillText('DOGS WHO CAUGHT A YAWN', 100, 740);
    const lit = Math.round(21 * ease((t - L7.wt[3]) / .9));
    for (let i = 0; i < 29; i++) A.dogIcon(130 + (i % 10) * 74, 800 + Math.floor(i / 10) * 62, 1.05, { col: i < lit ? '#F1E4CF' : '#3A4560' });
    if (lit) A.pill(lit + ' / 29', 800, 740, ACC.fact, 24);
    const gl = ease((t - L7.wt[13]) / .6);
    out.save(); out.translate(490, 1210); out.scale(.8, .8); out.translate(-500, -960);
    A.xrayHead(500, 960, 0, 0, 0, false); out.restore();
    if (gl > 0) {   // the brain region glows, softly pulsing — illustrative, nothing was scanned
      const pulse = .85 + .15 * Math.sin(t * 6);
      const gr = out.createRadialGradient(490, 1160, 10, 490, 1160, 150 * gl); gr.addColorStop(0, `rgba(255,201,77,${.75 * gl * pulse})`); gr.addColorStop(1, 'rgba(255,201,77,0)');
      out.fillStyle = gr; out.fillRect(300, 980, 380, 360);
    }
    if (t > L7.wt[16]) { const p = back((t - L7.wt[16]) / .25); out.save(); out.translate(490, 1400); out.scale(p, p); A.pill('MAY BE TUNED TO YOU', 0, 0, ACC.ask, 28); out.restore(); }
  }
  out.restore(); out.restore();
}

// ---------- pinned tags, HUD, captions, watermark ----------
function pins(t, scene) {
  A.setCtx(out);
  const list = [...PIN];
  if (scene === 'home') {
    if (t > L2.wt[3] && t < L3.t0 - .4) {   // the myth, pinned to the dog, then struck through
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
  if (scene === 'home' && t > STRIKE() && t < L3.t0 - .4) {   // strike + red X
    const k = ease((t - STRIKE()) / .45), w = 360;
    out.strokeStyle = ACC.bad; out.lineWidth = 8; out.lineCap = 'round';
    out.beginPath(); out.moveTo(690 - w / 2, 862); out.lineTo(690 - w / 2 + w * k, 862); out.stroke();
    const xk = back((t - STRIKE() - .45) / .35);
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
  const S = SHOTS.find(s => t >= s.t0 && t < s.t1); A.setPlate(S && S.scene === 'visit' ? .9 : .6);   // a darker plate on the bright daytime room
  A.caption(lead, key, onCard ? '' : follow, L.kind, full ? 1 : (t - L.wt[L.lead]) / .22, full, L.emph);
}
function ctaLayer(t) {   // a big SAVE THIS button, with a bookmark icon, pulsing gently
  const [a, b] = CTA(); if (t < a || t > b) return;
  A.setCtx(out);
  const k = Math.min(back((t - a) / .35), ease((b - t) / .3)), pulse = 1 + .025 * Math.sin((t - a) * 5);
  out.save(); out.translate(540, 1000); out.scale(k * pulse, k * pulse);
  out.font = '800 64px Inter'; const tw = out.measureText('SAVE THIS').width, w = tw + 160, h = 120;
  out.shadowColor = 'rgba(0,0,0,.45)'; out.shadowBlur = 30; out.shadowOffsetY = 10;
  out.fillStyle = ACC.ask; out.beginPath(); out.roundRect(-w / 2, -h / 2, w, h, 60); out.fill(); out.shadowColor = 'transparent';
  const bx = -w / 2 + 52, by = -34;   // bookmark
  out.fillStyle = '#1B2238'; out.beginPath(); out.moveTo(bx, by); out.lineTo(bx + 40, by); out.lineTo(bx + 40, by + 68); out.lineTo(bx + 20, by + 50); out.lineTo(bx, by + 68); out.closePath(); out.fill();
  out.fillStyle = '#1B2238'; out.textAlign = 'left'; out.textBaseline = 'middle'; out.fillText('SAVE THIS', bx + 64, 4);
  out.restore();
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
    hud(t, S.scene);
    captionLayer(t);
    ctaLayer(t);
    watermark();
  };
  window.TEXTS = (t) => {
    const T = [];
    if (t >= CARD.t0 + WHIP / 2 && t < CARD.t1 - WHIP / 2) T.push({ id: 'card', text: t >= CARD.tB ? 'inside the head' : 'the heart cam', x0: 60, y0: 600, x1: 920, y1: 1480 });
    const [a, b] = CTA(); if (t >= a + .2 && t < b) T.push({ id: 'cta', text: 'SAVE THIS', x0: 200, y0: 940, x1: 880, y1: 1060 });
    return T;
  };
  window.render(0);
  window.READY = true;
});
