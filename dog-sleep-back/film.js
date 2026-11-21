// Pet Cam: "Why does your dog sleep with its butt facing you?" — laid on the user's recording (voice/offsets.json, dur.json, words.json).
// Scenes: home from the owner's seat (l01–l04, the camera moves inside it) → the wild, the one takeover card (l05)
// → night bedroom, the 86 % (l06) → home (l07, pushes back into the frame-1 shot) → [IG/TikTok only] the share line (l08) → loop.
// Two cuts from this page: ?cut=yt ends after l07 (YouTube Shorts); the default plays all 8 lines (Instagram, TikTok).
import * as A from './art.js';
const { W, H, ACC } = A;
const Q = new URLSearchParams(location.search), CUT = Q.get('cut') === 'yt' ? 'yt' : 'full';
if (Q.get('cover')) window.COVER = true;   // ?cover=1: the scene only, no text (for checking drawings and covers)

// ---------- the script: caption cut (word counts) + the scene each line plays in ----------
const ALL = [
  { id: 'l01', lead: 0, key: 0, kind: 'ask', scene: 'home' },
  { id: 'l02', lead: 0, key: 4, kind: 'bad', scene: 'home' },
  { id: 'l03', lead: 4, key: 3, kind: 'good', scene: 'home' },
  { id: 'l04', lead: 6, key: 2, kind: 'good', scene: 'home' },
  { id: 'l05', lead: 5, key: 1, kind: 'fact', scene: 'wild' },
  { id: 'l06', lead: 5, key: 1, kind: 'fact', scene: 'night', display: 'A UK study found over 86% of dogs near people at night chose to be close.' },
  { id: 'l07', lead: 6, key: 5, kind: 'good', scene: 'home' },
  { id: 'l08', lead: 0, key: 2, kind: 'ask', scene: 'home' },
];
const LINES = CUT === 'yt' ? ALL.slice(0, 7) : ALL;
const HOOK = [['Why does your', 112], ['dog sleep with its', 112], ['BUTT', 240], ['facing you?', 112]];
const TAIL = CUT === 'yt' ? 1.3 : 1.1, LOOP = 0.6, WHIP = .4;
const STEPS = [['TRUST', 3], ['PACK', 4], ['86% CLOSE', 5]];
const BRAND = '@pupexplained';

const cv = document.getElementById('c'), out = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const SA = mk(), SB = mk();

async function load() {
  for (const [fam, url, desc] of [['Inter', './fonts/Inter.ttf', { weight: '100 900' }], ['Inter', './fonts/Inter-Italic.ttf', { weight: '100 900', style: 'italic' }], ['JetBrains Mono', './fonts/JetBrainsMono.ttf', { weight: '100 800' }]]) {
    const f = new FontFace(fam, `url(${url})`, desc); await f.load(); document.fonts.add(f);
  }
  const [dur, words, off, script] = await Promise.all(['./voice/dur.json', './voice/words.json', './voice/offsets.json', './lines.json'].map(u => fetch(u).then(r => r.json())));
  return { dur, words, off, script };
}
const clamp = t => Math.max(0, Math.min(1, t));
const ease = t => (t = clamp(t), t * t * (3 - 2 * t));
const back = t => { t = clamp(t) - 1; return 1 + t * t * (2.4 * t + 1.4); };

let L1, L2, L3, L4, L5, L6, L7, L8, END, SHOTS;
function build({ dur, words, off, script }) {
  for (const L of LINES) {
    L.t0 = L.id === 'l01' ? 0 : off[L.id];   // every line where it sits in the recording: the user's own pacing
    L.t1 = L.t0 + dur[L.id];
    L.text = (L.display || script.find(s => s.id === L.id).text).split(/\s+/);
    const wt = words[L.id], n = L.text.length, m = wt.length;
    L.wt = L.text.map((_, i) => { const w = wt[Math.min(m - 1, Math.round(i * m / n))]; return L.t0 + Math.max(0, w[1]); });
  }
  [L1, L2, L3, L4, L5, L6, L7, L8] = LINES;
  END = LINES[LINES.length - 1].t1 + TAIL;
  window.DUR = +(END + LOOP).toFixed(2);
  SHOTS = [];
  LINES.forEach((L, i) => { if (!i || LINES[i - 1].scene !== L.scene) SHOTS.push({ scene: L.scene, t0: i ? L.t0 - .15 : 0 }); });
  SHOTS.forEach((s, i) => s.t1 = SHOTS[i + 1] ? SHOTS[i + 1].t0 : window.DUR);
  const EV = [];
  LINES.forEach(L => { EV.push({ t: L.t0, type: 'vo', id: L.id }); if (L !== L1) EV.push({ t: L.wt[L.lead], type: 'cap', kind: L.kind }); });
  SHOTS.slice(1).forEach(s => EV.push({ t: s.t0 - WHIP / 2, type: 'whoosh' }));
  STEPS.forEach(([, i]) => EV.push({ t: LINES[i].t0 + .2, type: 'tick' }));
  EV.push({ t: L1.wt[7], type: 'pop' }, { t: L2.wt[3], type: 'pop' }, { t: L2.wt[9], type: 'puff' }, { t: STRIKE(), type: 'strike' });
  EV.push({ t: L4.wt[6], type: 'pop' }, { t: L5.wt[6], type: 'tick' }, { t: L5.wt[8], type: 'tick' }, { t: L5.wt[9], type: 'pop' });
  EV.push({ t: L6.wt[1], type: 'pop' }, { t: L6.wt[5], type: 'pop' });
  for (let i = 0; i < 19; i += 3) EV.push({ t: HOP() + i * .045, type: 'tick' });
  EV.push({ t: L7.wt[8], type: 'chime' });
  if (L8) EV.push({ t: CTA()[0], type: 'pop' });
  EV.push({ t: END, type: 'loop' });
  window.EV = EV;
}
const STRIKE = () => L2.t1 + .05;            // the myth is struck as "gassy" ends
const HOP = () => L6.wt[12];                  // the dogs choose the bed on "chose"
const CTA = () => [L8.wt[0] + .05, END - .5];

// ---------- animation curves ----------
const keyed = (keys, t) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; if (i >= keys.length - 1) return keys[keys.length - 1].slice(1); const [ta, ...va] = keys[i], [tb, ...vb] = keys[i + 1], e = ease((t - ta) / (tb - ta)); return va.map((v, k) => v + (vb[k] - v) * e); };
const bump = (t, t0, d = .5) => { const u = (t - t0) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
const blinkAt = (t, ph = 0) => { const p = (t + .7 + ph) % 3.1; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };
const breathAt = t => (Math.sin(t * 2.2) + 1) / 2;

// ---------- the home scene (the owner's seat on the couch) ----------
let PIN = [];
const MYTH = [320, 1180];   // where the myth tag sits on screen (left, over your legs, clear of the dog's face)
const RUMP = [700, 1480], CONTACT = [520, 1470], HEAD = [826, 1188];
const F1 = [1.25, 652, 1340];   // the frame-1 shot: the rump against your leg, the face looking back, below the hook
let CAM = [1, 0, 0];
const camAt = (z, fx, fy) => [z, Math.min(0, Math.max(W - W * z, W / 2 - fx * z)), Math.min(0, Math.max(H - H * z, fy - fy * z))];
const toScreen = (x, y) => [x * CAM[0] + CAM[1], y * CAM[0] + CAM[2]];
function homeCam(t) {
  const K = [[0, ...F1], [.9, F1[0] * 1.05, F1[1] + 20, F1[2] + 30],                 // a slow push while the question lands
    [L2.t0 + .05, F1[0] * 1.05, F1[1] + 20, F1[2] + 30], [L2.t0 + .75, 1, 540, 960], // pull back to the whole couch
    [L2.wt[8], 1, 540, 960], [L2.wt[9] + .3, 1.12, 700, 1380],                        // nudge in on the butt for "gassy"
    [L3.t0 + .1, 1.12, 700, 1380], [L3.t0 + .7, 1.18, 820, 1200],                    // toward the face: "the opposite"
    [L4.t0, 1.18, 820, 1200], [L4.t0 + .8, 1.42, 600, 1480],                          // into the contact point: trust
    [L4.t1 + .5, 1.42, 600, 1480]];
  if (t < L4.t1 + 1) return keyed(K, t);
  // l07 (and l08): from wide, push back into the frame-1 shot for the loop
  const land = L8 ? L8.t0 - .1 : END - .35;
  return keyed([[L7.t0 - .2, 1, 540, 960], [L7.wt[6], 1.06, 640, 1080], [land, ...F1], [END + 5, ...F1]], t);
}
function handPos(t) {   // [x, y, angle, visible 0..1]
  const fanT = L2.wt[9] - .15, pat3 = [L3.t0 + .25, L3.t1 + .4], pat7 = [L7.t0 + .1, L7.wt[8] + .2];
  if (t > fanT - .3 && t < fanT + 1.3) { const k = Math.min(ease((t - fanT + .3) / .3), ease((fanT + 1.3 - t) / .3)); return [330 + 40 * Math.sin(t * 16), 1330 + (1 - k) * 700, .35 + .35 * Math.sin(t * 16), k]; }
  for (const [a, b] of [pat3, pat7]) if (t > a - .3 && t < b + .3) { const k = Math.min(ease((t - a + .3) / .3), ease((b + .3 - t) / .3)); return [700, 1400 + 26 * Math.abs(Math.sin((t - a) * 6)) + (1 - k) * 700, .25, k]; }
  return null;
}
function home(g, t) {
  A.couchPOV(t);
  A.legsPOV();
  // the dog: looks back over its shoulder; turns away on "gassy", back toward you on "the opposite", eyes close happily on "safe"
  const turn = t > L2.wt[8] && t < L3.t0 + .2 ? 1 - .55 * Math.min(ease((t - L2.wt[8]) / .25), ease((L3.t0 + .2 - t) / .3)) : 1;
  const happy = L7 && t > L7.wt[8] - .1 && t < L7.wt[8] + 1.3 ? Math.min(ease((t - L7.wt[8] + .1) / .2), ease((L7.wt[8] + 1.3 - t) / .3)) : 0;
  const pats = handPos(t) && t > L2.t1 ? 1 : 0;
  A.rearDog(RUMP[0], RUMP[1], {
    turn, blink: Math.max(blinkAt(t), happy), breath: breathAt(t),
    brow: .5 + .9 * bump(t, L3.wt[5], 1.1) + .6 * happy,
    perk: Math.max(bump(t, L1.wt[7], .5), bump(t, L4.wt[6], .5), bump(t, L8 ? L8.t0 + .4 : 1e9, .5)),
    wag: (pats || (L8 && t > L8.t0)) ? Math.sin(t * 11) * .3 : Math.sin(t * 3) * .06,
  });
  // the trust glow where its back meets your leg
  const gk = L4 ? Math.min(ease((t - L4.wt[5]) / .3), ease((L5.t0 - .2 - t) / .3)) : 0;
  if (gk > 0) { const p = .8 + .2 * Math.sin(t * 6), gr = g.createRadialGradient(...CONTACT, 10, ...CONTACT, 170); gr.addColorStop(0, `rgba(61,220,151,${.55 * gk * p})`); gr.addColorStop(1, 'rgba(61,220,151,0)'); g.fillStyle = gr; g.fillRect(CONTACT[0] - 200, CONTACT[1] - 200, 400, 400); }
  // gas puffs on "gassy"
  for (const d of [0, .22, .45]) A.puff(RUMP[0] + (d - .22) * 260, RUMP[1] - 40, (t - L2.wt[9] - d) / 1.1);
  const hp = handPos(t); if (hp) A.ownerHand(hp[0], hp[1], { a: hp[2] });
  // the heart on "safe"
  if (L7 && t > L7.wt[8] && t < L7.t1 + .6) { const k = back((t - L7.wt[8]) / .35), f = 1 - ease((t - L7.t1) / .6); g.save(); g.globalAlpha = f; g.translate(HEAD[0] - 120, HEAD[1] - 110 - 40 * clamp(t - L7.wt[8])); g.scale(k * 1.6, k * 1.6); g.fillStyle = ACC.bad; g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-28, -6, -18, -28, 0, -14); g.bezierCurveTo(18, -28, 28, -6, 0, 14); g.fill(); g.restore(); }
}

// ---------- the wild: the one takeover card ----------
function wild(g, t, lt) {
  g.fillStyle = '#060A15'; g.fillRect(0, 0, W, H);
  const x = 60, y = 600, w = 860, h = 880;
  A.card(x, y, w, h, 'the wild', 'pack-mates, back to back', 'CAM 04', (lt / 6) % 1);
  g.save(); g.beginPath(); g.roundRect(x + 14, y + 118, w - 28, h - 132, 20); g.clip();
  g.save(); g.translate(0, -20); A.forestNight(t); g.restore();
  // who is awake: both asleep for "dogs may sleep back-to-back", one opens its eyes on "so", they swap on "always", both on "watching"
  const eR = Math.min(ease((t - L5.wt[6]) / .25), 1 - ease((t - L5.wt[8]) / .25)), eL = ease((t - L5.wt[8]) / .25);
  const cone = (hx, hy, dir, k) => { if (k <= 0) return; const gr = g.createRadialGradient(hx, hy, 10, hx, hy, 420); gr.addColorStop(0, `rgba(255,201,77,${.45 * k})`); gr.addColorStop(1, 'rgba(255,201,77,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(hx, hy); g.arc(hx, hy, 420, dir > 0 ? -.45 : Math.PI - .45, dir > 0 ? .45 : Math.PI + .45); g.closePath(); g.fill(); };
  const both = ease((t - L5.wt[9]) / .3);
  const s = .85, gy = 1350, LX = 325, RX = 655;
  cone(LX - 140 * s, gy - 190 * s, -1, Math.max(eL, both));
  cone(RX + 140 * s, gy - 190 * s, 1, Math.max(eR, both * .9));
  g.save(); g.translate(LX, gy); g.scale(s, s); A.sphinxDog(0, 0, -1, { eye: Math.max(eL, both * .9), breath: breathAt(t), earTwitch: bump(t, L5.wt[4], .4) }); g.restore();
  g.save(); g.translate(RX, gy); g.scale(s, s); A.sphinxDog(0, 0, 1, { eye: Math.max(eR, both), breath: breathAt(t + 1.3), earTwitch: bump(t, L5.wt[2], .4), coat: ['#D9C3A4', '#A88A64', '#735C40'], dark: ['#7E654A', '#5C4834', '#3E3022'] }); g.restore();   // a warmer coat, so the two read as two
  g.restore();
  if (t > L5.wt[9]) { const k = back((t - L5.wt[9]) / .3); g.save(); g.translate(490, 800); g.scale(k, k); A.pill('360° COVERED', 0, 0, ACC.fact, 30); g.restore(); }
}

// ---------- night bedroom: the 86 % ----------
const ICONS = Array.from({ length: 22 }, (_, i) => ({ fx: 130 + (i % 6) * 76, fy: 1450 + Math.floor(i / 6) * 62, tx: 640 + (i % 7) * 62 + (Math.floor(i / 7) % 2) * 30, ty: 1430 + Math.floor(i / 7) * 54 }));
function night(g, t) {
  A.bedroom(t, ease((t - L6.wt[8]) / .5));
  ICONS.forEach((ic, i) => {
    const goes = i < 19, k = goes ? ease((t - HOP() - i * .045) / .45) : 0;
    const x = ic.fx + (ic.tx - ic.fx) * k, y = ic.fy + (ic.ty - ic.fy) * k - Math.sin(k * Math.PI) * 120;
    A.dogIcon(x, y, 1.35, { col: k >= 1 ? '#F1E4CF' : '#B8AC98' });
  });
  if (t > L6.wt[1]) { const k = back((t - L6.wt[1]) / .3); g.save(); g.translate(540, 1010); g.scale(k, k); A.pill('UK STUDY · DOGS TRUST', 0, 0, ACC.fact, 28); g.restore(); }
  if (t > L6.wt[5] - .05) {   // the counter rolls to 86 % on "eighty-six"
    const n = Math.round(86 * ease((t - L6.wt[5] + .05) / .6)), k = back((t - L6.wt[5] + .05) / .3);
    g.save(); g.translate(620, 760); g.scale(k, k);
    g.fillStyle = 'rgba(8,14,28,.8)'; g.beginPath(); g.roundRect(-250, -110, 500, 200, 30); g.fill(); g.strokeStyle = ACC.fact; g.lineWidth = 4; g.stroke();
    g.fillStyle = ACC.fact; g.font = '800 150px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((n >= 86 ? '86' : n) + '%', 0, -12);
    g.fillStyle = '#C9D2E8'; g.font = '600 24px JetBrains Mono'; g.fillText('CHOSE TO BE CLOSE', 0, 66);
    g.restore(); g.textAlign = 'left'; g.textBaseline = 'top';
  }
}

function drawScene(name, g, t, lt) {
  A.setCtx(g); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; CAM = [1, 0, 0];
  if (name === 'home') { CAM = camAt(...homeCam(t)); g.setTransform(CAM[0], 0, 0, CAM[0], CAM[1], CAM[2]); home(g, t); g.setTransform(1, 0, 0, 1, 0, 0); }
  else if (name === 'wild') wild(g, t, lt);
  else if (name === 'night') night(g, t);
}

// ---------- pinned tags, strike, HUD, captions, CTA, watermark ----------
function pins(t, scene) {
  A.setCtx(out);
  if (scene !== 'home') return;
  const list = [];
  const [bx, by] = toScreen(RUMP[0] + 30, RUMP[1] + 50),   // the butt
        [cx, cy] = toScreen(...CONTACT);
  if (t > L1.wt[7] && t < L2.t0 + .1) list.push(['ON PURPOSE?', 300, 1260, bx, by, ACC.ask, 32]);   // on "butt"; gone before the loop frame
  if (t > L2.wt[3] && t < L3.t0 + .5) list.push(['RUDE? GASSY?', MYTH[0], MYTH[1], bx, by, ACC.bad, 34]);
  if (L4 && t > L4.wt[6] && t < L5.t0 - .3) list.push(['BACK TO YOU = TRUST', 560, 1120, cx, cy, ACC.good, 32]);
  for (const [text, x, y, ax, ay, col, size] of list) {
    out.strokeStyle = col; out.lineWidth = 3; out.beginPath(); out.moveTo(x, y); out.lineTo(ax, ay); out.stroke();
    out.fillStyle = col; out.beginPath(); out.arc(ax, ay, 9, 0, Math.PI * 2); out.fill();
    const k = back((t - (text === 'ON PURPOSE?' ? L1.wt[7] : text === 'RUDE? GASSY?' ? L2.wt[3] : L4.wt[6])) / .25);
    out.save(); out.translate(x, y); out.scale(k, k); A.pill(text, 0, 0, col, size); out.restore();
  }
  if (t > STRIKE() && t < L3.t0 + .5) {   // strike + red X on the myth
    const k = ease((t - STRIKE()) / .3); out.font = '600 34px JetBrains Mono'; const w = out.measureText('RUDE? GASSY?').width + 20;
    out.strokeStyle = ACC.bad; out.lineWidth = 8; out.lineCap = 'round'; out.beginPath(); out.moveTo(MYTH[0] - w / 2, MYTH[1] + 2); out.lineTo(MYTH[0] - w / 2 + w * k, MYTH[1] + 2); out.stroke();
    const xk = back((t - STRIKE() - .25) / .3);
    if (xk > 0) { out.save(); out.translate(MYTH[0] + w / 2 + 48, MYTH[1]); out.scale(xk, xk); out.lineWidth = 16; out.beginPath(); out.moveTo(-32, -32); out.lineTo(32, 32); out.moveTo(32, -32); out.lineTo(-32, 32); out.stroke(); out.restore(); }
  }
}
function hud(t, scene) {
  if (t < L2.t0 + .1 || scene === 'wild') return;
  A.setCtx(out);
  const a = ease((t - L2.t0 - .1) / .3) * (t > END - .7 ? 1 - ease((t - (END - .7)) / .35) : 1);
  out.save(); out.globalAlpha = a;
  out.fillStyle = 'rgba(8,14,28,.72)'; out.beginPath(); out.roundRect(52, 632, 290, 206, 22); out.fill();
  out.font = '600 24px JetBrains Mono'; out.textBaseline = 'middle'; out.textAlign = 'left';
  STEPS.forEach(([label, li], i) => {
    const on = t >= LINES[li].t0 + .2, y = 670 + i * 65, pop = on ? back((t - LINES[li].t0 - .2) / .25) : 1, col = ACC.good;
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
  if (t >= END || !L || L === L1) { A.hookCaption(HOOK, 'BUTT'); return; }   // the hook is whole from frame 1 and returns for the loop
  const shown = L.text.slice(0, L.wt.filter(w => w <= t + .02).length);
  const lead = shown.slice(0, L.lead).join(' '), key = shown.length > L.lead ? L.text.slice(L.lead, L.lead + L.key).join(' ') : '', follow = shown.slice(L.lead + L.key).join(' ');
  A.caption(lead, key, follow, L.kind, (t - L.wt[L.lead]) / .22, false);
}
function ctaLayer(t) {   // the one call to action (IG/TikTok cut): a big SEND THIS button with a paper plane
  if (!L8) return; const [a, b] = CTA(); if (t < a || t > b) return;
  A.setCtx(out);
  const k = Math.min(back((t - a) / .35), ease((b - t) / .3)), pulse = 1 + .025 * Math.sin((t - a) * 5);
  out.save(); out.translate(540, 1000); out.scale(k * pulse, k * pulse);
  out.font = '800 64px Inter'; const tw = out.measureText('SEND THIS').width, w = tw + 170, h = 120;
  out.shadowColor = 'rgba(0,0,0,.45)'; out.shadowBlur = 30; out.shadowOffsetY = 10;
  out.fillStyle = ACC.ask; out.beginPath(); out.roundRect(-w / 2, -h / 2, w, h, 60); out.fill(); out.shadowColor = 'transparent';
  const px = -w / 2 + 46;   // paper plane
  out.fillStyle = '#1B2238'; out.beginPath(); out.moveTo(px, -4); out.lineTo(px + 62, -34); out.lineTo(px + 44, 30); out.lineTo(px + 26, 10); out.closePath(); out.fill();
  out.fillStyle = ACC.ask; out.beginPath(); out.moveTo(px + 26, 10); out.lineTo(px + 62, -34); out.lineTo(px + 30, 2); out.closePath(); out.fill();
  out.fillStyle = '#1B2238'; out.textAlign = 'left'; out.textBaseline = 'middle'; out.fillText('SEND THIS', px + 84, 4);
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
    if (L6 && t > L6.wt[5] + .3 && t < L7.t0 - .3) T.push({ id: 'n86', text: '86% CHOSE TO BE CLOSE', x0: 370, y0: 650, x1: 870, y1: 850 });
    if (L8) { const [a, b] = CTA(); if (t >= a + .2 && t < b) T.push({ id: 'cta', text: 'SEND THIS', x0: 200, y0: 940, x1: 880, y1: 1060 }); }
    return T;
  };
  window.render(0);
  window.READY = true;
});
