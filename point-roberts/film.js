// Point Roberts: an engraved chart of the Pacific Northwest, 1080×1920.
// The sheet is the world (1080×1920 units); the camera is a loupe over it. The peninsula and the route live in a
// magnification roundel, engraved at its own scale (authored for radius 500), so line widths stay true at every zoom.
import { B, drawSheet, engraveText, writeScript, roundelFrame, leader, wrapLines, Wash, PAL } from './engine/index.js';
const { clamp, mix, sstep } = B;
export const W = 1080, H = 1920;
let M, TL, K, LINES, main, ins, washMain, washIns, DASH = [];
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a));

// ---------------------------------------------------------------- geometry helpers
function chaikin(P, closed, it = 2) {
  for (let k = 0; k < it; k++) {
    const out = [], n = P.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = P[i], b = P[(i + 1) % n]; out.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
    if (!closed) { out.unshift(P[0]); out.push(P[n - 1]); }
    P = out;
  }
  return P;
}
const pathOf = polys => { const p = new Path2D(); for (const r of polys) { r.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); } return p; };
function proj(view) { const [lon0, lat0, cx, cy, k] = view; return (lon, lat) => [cx + (lon - lon0) * M.KX * k, cy - (lat - lat0) * M.KY * k]; }
// water-lining: lines that follow the coast out to sea (distance field of the land, rasterised on a canvas)
function waterLines(ink, land, [x0, y0, x1, y1], { g = 2, spacing = 6, levels = 7, wMax = 1.1, seed = 3, maxD = 60 } = {}) {
  const nx = Math.ceil((x1 - x0) / g) + 1, ny = Math.ceil((y1 - y0) / g) + 1;
  const c = document.createElement('canvas'); c.width = nx; c.height = ny; const cg = c.getContext('2d');
  cg.setTransform(1 / g, 0, 0, 1 / g, -x0 / g, -y0 / g); cg.fillStyle = '#000'; cg.fill(pathOf(land));
  const A = cg.getImageData(0, 0, nx, ny).data, D = new Float32Array(nx * ny), INF = 1e9;
  for (let i = 0; i < nx * ny; i++) D[i] = A[i * 4 + 3] > 127 ? 0 : INF;
  const a = 1, b = 1.4142;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const id = j * nx + i; if (!D[id]) continue; let m = D[id];
    if (i > 0) m = Math.min(m, D[id - 1] + a); if (j > 0) m = Math.min(m, D[id - nx] + a); if (i > 0 && j > 0) m = Math.min(m, D[id - nx - 1] + b); if (i < nx - 1 && j > 0) m = Math.min(m, D[id - nx + 1] + b); D[id] = m; }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const id = j * nx + i; if (!D[id]) continue; let m = D[id];
    if (i < nx - 1) m = Math.min(m, D[id + 1] + a); if (j < ny - 1) m = Math.min(m, D[id + nx] + a); if (i < nx - 1 && j < ny - 1) m = Math.min(m, D[id + nx + 1] + b); if (i > 0 && j < ny - 1) m = Math.min(m, D[id + nx - 1] + b); D[id] = m; }
  for (let i = 0; i < D.length; i++) D[i] = Math.min(D[i], maxD / g + 4);
  const samp = (x, y) => { const fx = (x - x0) / g, fy = (y - y0) / g, i = Math.floor(fx), j = Math.floor(fy); if (i < 0 || j < 0 || i >= nx - 1 || j >= ny - 1) return 99; return D[j * nx + i] * g; };
  const tone = Object.assign((x, y) => clamp(0.95 - samp(x, y) / (spacing * levels * 1.1)), { grid: { D, nx, ny, g, bb: [x0, y0] } });
  B.contourHatch(ink, [], { spacing, tone, thr: 0.02, wMin: 0.25, wMax, from: 0.6, maxLevels: levels, seed, taper: 10 });
  return { D, nx, ny, g, x0, y0 };
}
// sea ruling: fine horizontal lines across open water, kept a few px off the coast (the chart engraver's ruled sea)
function seaRuling(ink, F, { spacing = 4.5, w = 0.42, gap = 3, seed = 2 } = {}) {
  const { D, nx, ny, g, x0, y0 } = F;
  for (let y = y0 + spacing / 2; y < y0 + (ny - 1) * g; y += spacing) {
    const j = Math.round((y - y0) / g); let run = null;
    const flush = () => { if (run && run[1] - run[0] > 6) { const pts = [], ws = []; for (let x = run[0]; x <= run[1]; x += 3) { pts.push([x, y + (B.noise1(x * 0.01, seed + j) - 0.5) * 0.6]); ws.push(w * (0.75 + 0.5 * B.noise1(x * 0.02 + j, seed))); } const n = pts.length; for (let k = 0; k < n; k++) { const e = Math.min(k, n - 1 - k) * 3; if (e < 8) ws[k] *= Math.max(0.2, e / 8); } ink.add(pts, ws); } run = null; };
    for (let i = 0; i < nx; i++) { const x = x0 + i * g, wet = D[j * nx + i] * g > gap; if (wet) { if (!run) run = [x, x]; else run[1] = x; } else flush(); }
    flush();
  }
}

// ---------------------------------------------------------------- setup
export function setup(map, tl, lines) {
  M = map; TL = tl; K = tl.K; LINES = Object.fromEntries(lines.map(l => [l.id, l]));
  const Mm = M.main, Mi = M.inset, PR = [635, 829];
  // ---- main sheet
  main = new B.Ink();
  const landM = Mm.land; main.landPath = pathOf(landM);
  main.group('coast'); for (const l of Mm.coast) B.stroke(main, chaikin(l, false, 1), 1.5, { taper: 4, swell: false, grain: 0.3, seed: l.length });
  main.group('water'); const FM = waterLines(main, landM, [Mm.frame[0], Mm.frame[1], Mm.frame[2], Mm.frame[3]], { spacing: 5.5, levels: 4, wMax: 0.9 });
  main.group('sea'); seaRuling(main, FM, { spacing: 4.6, w: 0.42, gap: 3 });
  main.group('frame');
  const [fx0, fy0, fx1, fy1] = Mm.frame;
  B.outline(main, [[fx0 - 10, fy0 - 10], [fx1 + 10, fy0 - 10], [fx1 + 10, fy1 + 10], [fx0 - 10, fy1 + 10]], { w: 2.4, vary: .15, grain: .04, step: 4, run: 0 });
  B.outline(main, [[fx0, fy0], [fx1, fy0], [fx1, fy1], [fx0, fy1]], { w: 0.8, vary: .1, grain: .04, step: 4, run: 0 });
  const P = proj(Mm.view);
  main.group('grat');
  for (let lon = -125; lon <= -122; lon++) { const [x] = P(lon, 49); B.stroke(main, [[x, fy0], [x, fy1]], 0.55, { taper: 2, swell: false, grain: 0.1 }); }
  for (let lat = 47; lat <= 50; lat++) { if (lat === 49) continue; const [, y] = P(-124, lat); B.stroke(main, [[fx0, y], [fx1, y]], 0.55, { taper: 2, swell: false, grain: 0.1 }); }
  // degree border: alternating bars every 10′
  for (let k = 0; k < 28; k++) { const lon = -125.8 + k / 6, [x] = P(lon, 49), [x2] = P(lon + 1 / 6, 49); if (k % 2 === 0) { B.stroke(main, [[x, fy0 - 5], [Math.min(x2, fx1), fy0 - 5]], 3.2, { taper: 0.5, swell: false }); B.stroke(main, [[x, fy1 + 5], [Math.min(x2, fx1), fy1 + 5]], 3.2, { taper: 0.5, swell: false }); } }
  for (let k = 0; k < 24; k++) { const lat = 46.6 + k / 6, [, y] = P(-125, lat), [, y2] = P(-125, lat + 1 / 6); if (k % 2 === 0) { B.stroke(main, [[fx0 - 5, y], [fx0 - 5, Math.max(y2, fy0)]], 3.2, { taper: 0.5, swell: false }); B.stroke(main, [[fx1 + 5, y], [fx1 + 5, Math.max(y2, fy0)]], 3.2, { taper: 0.5, swell: false }); } }
  main.group('p49'); const [, y49] = P(-124, 49); main.y49 = y49;
  B.stroke(main, [[fx0, y49], [fx1, y49]], 2.6, { taper: 10, swell: false, grain: 0.12, step: 3 });
  const dPR = s => Math.hypot((s.bb[0] + s.bb[2]) / 2 - PR[0], (s.bb[1] + s.bb[3]) / 2 - PR[1]);
  main.schedule('coast', -0.9, 3.4, { conc: 7, key: dPR }); main.schedule('water', 1.3, 5.0, { conc: 40, key: dPR });
  main.schedule('sea', 2.0, 5.0, { conc: 30, key: s => s.bb[1] }); main.schedule('frame', 1.6, 3.6, { conc: 2 }); main.schedule('grat', 2.2, 4.6, { conc: 8 }); main.schedule('p49', K.lineStart, K.lineEnd, { conc: 1 });
  main.build();
  washMain = new Wash({ scale: 1.2 });
  washMain.add({ path: pathOf(Mm.us), polys: Mm.us, color: '#C9A15E', origin: [540, y49 + 40], t0: K.lineEnd + 0.1, dur: 1.5, alpha: 0.5, seed: 4 });
  washMain.add({ path: pathOf(Mm.tip), polys: Mm.tip, color: '#C9A15E', origin: PR, t0: K.tip, dur: 0.9, alpha: 0.62, seed: 5, spill: 1.5 });
  // ---- the inset (roundel content, local units, radius 500 about (500, 500))
  ins = new B.Ink();
  const Pi = proj(Mi.view), landI = Mi.land.map(r => chaikin(r, true, 3));
  ins.landPath = pathOf(landI);
  ins.group('coast'); for (const l of Mi.coast) B.stroke(ins, chaikin(l, false, 3), 2.4, { taper: 4, swell: false, grain: 0.3, seed: l.length });
  ins.group('water'); const FI = waterLines(ins, landI, [-60, -60, 1060, 1060], { g: 2, spacing: 8, levels: 5, wMax: 1.3, maxD: 80 });
  ins.group('sea'); seaRuling(ins, FI, { spacing: 6.5, w: 0.62, gap: 4 });
  const [, iy49] = Pi(-123, 49); ins.y49 = iy49;
  ins.group('p49'); B.stroke(ins, [[-20, iy49], [1020, iy49]], 3.6, { taper: 10, swell: false, grain: 0.1, step: 3 });
  const tipI = Mi.tip.map(r => chaikin(r, true, 2));
  ins.group('tiph'); B.hatch(ins, tipI, { angle: -0.6, spacing: 4.2, tone: () => 0.6, thr: 0.1, wMax: 1.2, seed: 7 });
  // the road (schematic, along the real roads: Tsawwassen, Hwy 17, Hwy 99, the Peace Arch crossing, Blaine)
  const RT = [[-123.058, 48.982], [-123.066, 48.993], [-123.068, 49.0], [-123.07, 49.012], [-123.083, 49.022], [-123.075, 49.04], [-123.058, 49.055], [-123.04, 49.072],
    [-123.0, 49.078], [-122.95, 49.07], [-122.89, 49.058], [-122.84, 49.045], [-122.80, 49.028], [-122.775, 49.012], [-122.757, 49.0], [-122.75, 48.988], [-122.744, 48.968]];
  const route = B.resample(chaikin(RT.map(([lo, la]) => Pi(lo, la)), false, 3), 2);
  const L = route.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - route[i - 1][0], p[1] - route[i - 1][1]) : 0), 0);
  const cum = [0]; for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
  const uAtY = (y, from) => { for (let i = from; i < route.length - 1; i++) if ((route[i][1] - y) * (route[i + 1][1] - y) <= 0) return [cum[i] / L, i]; return [1, route.length - 1]; };
  const [u1, i1] = uAtY(iy49, 0), [u2, i2] = uAtY(iy49, i1 + 8);
  ins.cross = [route[i1], route[i2]];
  const tAt = u => u < u1 ? mix(K.carStart, K.cross1, u / u1) : u < u2 ? mix(K.cross1, K.cross2, (u - u1) / (u2 - u1)) : mix(K.cross2, K.carEnd, (u - u2) / (1 - u2));
  ins.group('route'); DASH = [];
  for (let d = 0; d < L - 6; d += 13) {
    const a = cum.findIndex(c => c >= d), b = cum.findIndex(c => c >= d + 7.5);
    if (a < 0 || b < 0) break;
    const n0 = ins.S.length; B.stroke(ins, route.slice(a, b + 1), 2.6, { taper: 2, swell: false, grain: 0.1 });
    for (let k = n0; k < ins.S.length; k++) { ins.S[k].s0 = tAt(d / L); ins.S[k].s1 = tAt((d + 7.5) / L); }
  }
  ins.route = route; ins.tAt = tAt; ins.cum = cum; ins.L = L;
  ins.instant('coast'); ins.instant('water'); ins.instant('sea');
  ins.schedule('p49', K.below - 0.1, K.below + 0.8, { conc: 1 }); ins.schedule('tiph', K.below + 0.7, K.below + 1.5, { conc: 30 });
  ins.build();
  ins.P = Pi;
  washIns = new Wash({ scale: 1.2 });
  washIns.add({ path: pathOf(Mi.us.map(r => chaikin(r, true, 3))), polys: Mi.us.map(r => chaikin(r, true, 3)), color: '#C9A15E', origin: [800, 900], t0: -5, dur: 0.1, alpha: 0.5, seed: 8 });
  washIns.add({ path: pathOf(tipI), polys: tipI, color: '#C9A15E', origin: [320, 540], t0: K.tip, dur: 1.1, alpha: 0.62, seed: 9, spill: 2 });
  main.PR = PR; main.P = P;
}
export const DUR = () => TL.dur;

// ---------------------------------------------------------------- cameras
const CAM = [[0, 635, 829, 2.8], [4.8, 540, 960, 1.0], [12.5, 540, 955, 1.02], [14.1, 625, 900, 1.6], [15.9, 540, 960, 1.0], [35, 540, 952, 1.025]];
function camAt(t) {
  let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const [t0, x0, y0, z0] = CAM[i], [t1, x1, y1, z1] = CAM[i + 1], u = eio(seg(t, t0, t1));
  return { x: mix(x0, x1, u), y: mix(y0, y1, u), z: Math.exp(mix(Math.log(z0), Math.log(z1), u)) };
}
const RC = { x: 560, y: 1270, r: 360 };            // the roundel's place on the sheet
function roundelState(t) {
  const a = 14.55, b = 15.75, u = eio(seg(t, a, b)), PR = main.PR;
  const r = Math.exp(mix(Math.log(24), Math.log(RC.r), u)), lift = Math.sin(Math.PI * u) * 60;
  return { x: mix(PR[0], RC.x, u) + lift * 0.4, y: mix(PR[1], RC.y, u) - lift, r, u, on: t >= 13.9 };
}
function innerCam(t) {   // focus + zoom inside the roundel (local units)
  const tipF = [330, 525, 1.75], wide = [500, 520, 1.0];
  const u = eio(seg(t, 20.3, 21.6));
  return { x: mix(tipF[0], wide[0], u), y: mix(tipF[1], wide[1], u), z: Math.exp(mix(Math.log(tipF[2]), Math.log(wide[2]), u)) };
}

// ---------------------------------------------------------------- drawing
function label(ctx, str, x, y, t0, o = {}) { const p = (TNOW - t0) / (o.dur || Math.max(0.5, str.length * 0.06)); if (p > 0) engraveText(ctx, str, x, y, { size: 24, weight: 500, track: 0.28, ...o, p }); }
let TNOW = 0;
function drawRoundel(ctx, t) {
  const R = roundelState(t); if (!R.on) return;
  const PR = main.PR;
  if (R.u <= 0) { roundelFrame(ctx, PR[0], PR[1], 24, { p: seg(t, 13.9, 14.4), w: 2 }); return; }
  // leader from the peninsula to the rim
  const ang = Math.atan2(R.y - PR[1], R.x - PR[0]);
  leader(ctx, PR, [R.x - Math.cos(ang) * R.r, R.y - Math.sin(ang) * R.r], { p: 1, w: 1 });
  ctx.save(); ctx.beginPath(); ctx.arc(R.x, R.y, R.r, 0, Math.PI * 2); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.clip();
  const ic = innerCam(t), s = R.r / 500;
  ctx.translate(R.x, R.y); ctx.scale(s * ic.z, s * ic.z); ctx.translate(-ic.x, -ic.y);
  washIns.draw(ctx, t);
  const tips = ins.draw(ctx, t, { wScale: 1 / Math.pow(ic.z, 0.55), view: null });
  // lettering inside the inset
  const Pi = ins.P;
  { const [x, y] = Pi(-122.84, 49.062); label(ctx, 'CANADA', x, y, 21.7, { size: 30 }); }
  { const [x, y] = Pi(-122.765, 48.955); label(ctx, 'WASHINGTON', x, y, 22.0, { size: 26 }); }
  { const [x, y] = Pi(-122.95, 48.975); label(ctx, 'Boundary Bay', x, y, 22.6, { size: 26, italic: true, track: 0.06 }); }
  { const [x, y] = Pi(-123.05, 48.965); label(ctx, 'Point Roberts', x, y, 21.8, { size: 26, italic: true, track: 0.04, dur: 0.8 }); }
  // the two crossings
  ins.cross.forEach(([x, y], i) => { const tc = i ? K.cross2 : K.cross1; const p = seg(t, tc - 0.05, tc + 0.45);
    if (p > 0) { roundelFrame(ctx, x, y, 22, { p, w: 2.2 }); engraveText(ctx, String(i + 1), x + (i ? 30 : -30), y - 26, { size: 30, italic: true, weight: 600, p: (t - tc - 0.2) / 0.4 }); } });
  // the burin's glint on the route head
  for (const [x, y] of tips) { ctx.fillStyle = 'rgba(255,248,230,0.9)'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); }
  ctx.restore();
  roundelFrame(ctx, R.x, R.y, R.r, { p: 1, w: 2.6 });
  roundelFrame(ctx, R.x, R.y, R.r + 9, { p: R.u, w: 0.8 });
}
function caption(ctx, t) {
  const cue = cues().find(c => t >= c.t0 && t < c.t1); if (!cue) return;
  const a = Math.min(sstep(cue.t0, cue.t0 + 0.12, t), 1 - sstep(cue.t1 - 0.15, cue.t1, t));
  const size = 50, lines = wrapLines(ctx, cue.text, 900, { size, font: 'Pinyon Script', weight: 400 });
  ctx.save(); ctx.font = `400 ${size}px "Pinyon Script"`;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 90, h = 40 + lines.length * size * 1.15, x0 = W / 2 - w / 2, y0 = 1735 - h / 2;
  ctx.globalAlpha = a;
  // a deckled paper slip
  const R = B.RNG(Math.round(cue.t0 * 100)), p = new Path2D(), N = 60;
  const edge = (u, v) => [x0 + u * w + (B.noise1(u * 40 + v * 7, 3) - .5) * 5, y0 + v * h + (B.noise1(v * 30 + u * 9, 5) - .5) * 5];
  for (let i = 0; i <= N; i++) { const [x, y] = edge(i / N, 0); i ? p.lineTo(x, y) : p.moveTo(x, y); }
  for (let i = 0; i <= N / 3; i++) p.lineTo(...edge(1, i / (N / 3)));
  for (let i = N; i >= 0; i--) p.lineTo(...edge(i / N, 1));
  for (let i = N / 3; i >= 0; i--) p.lineTo(...edge(0, i / (N / 3)));
  ctx.shadowColor = 'rgba(60,40,20,0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; ctx.fillStyle = '#f6efdc'; ctx.fill(p); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(90,64,36,0.35)'; ctx.lineWidth = 1; ctx.stroke(p);
  const wp = clamp((t - cue.t0) / Math.max(0.5, cue.text.length * 0.012));
  lines.forEach((l, i) => writeScript(ctx, l, W / 2, y0 + 22 + size * 0.95 + i * size * 1.15, { size, p: clamp(wp * lines.length - i), alpha: 1 }));
  ctx.restore();
}
export function cues() {
  const V = TL.V, out = [];
  V.forEach((v, i) => {
    const nx = V[i + 1], t1 = Math.min(Math.max(v.t + v.dur + 0.6, v.t + 1.8), nx ? nx.t - 0.06 : TL.dur), text = LINES[v.id].sub;
    if (v.id === 's5') { const cut = text.indexOf(' just'); out.push({ t0: v.t, t1: TL.s5split, text: text.slice(0, cut) }, { t0: TL.s5split, t1, text: text.slice(cut + 1) }); }
    else out.push({ t0: v.t, t1, text });
  });
  return out;
}
export function render(ctx, t, Q) {
  TNOW = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const c = camAt(t);
  ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
  drawSheet(ctx, { W, H, plate: [22, 60, 1058, 1880] });
  washMain.draw(ctx, t);
  main.draw(ctx, t, { wScale: 1 / Math.pow(c.z, 0.6) });
  const P = main.P;
  // place names on the sheet
  label(ctx, 'CANADA', 770, 520, 5.4, { size: 34 });
  label(ctx, 'Pacific', 150, 1010, 5.9, { size: 30, italic: true, track: 0.05 }); label(ctx, 'Ocean', 160, 1048, 6.2, { size: 30, italic: true, track: 0.05 });
  { ctx.save(); ctx.translate(455, 655); ctx.rotate(-0.62); label(ctx, 'Strait of Georgia', 0, 0, 6.5, { size: 22, italic: true, track: 0.05 }); ctx.restore(); }
  { const [x, y] = P(-123.12, 49.28); const k = seg(t, 6.9, 7.1); if (k > 0) { ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(x, y, 4.5 * k, 0, 7); ctx.fill(); } label(ctx, 'Vancouver', x + 16, y - 18, 7.0, { size: 22, align: 'left', track: 0.12 }); }
  label(ctx, 'WASHINGTON', 875, 925, K.lineEnd + 0.4, { size: 24 });
  label(ctx, 'Parallel of 49° N.', 890, main.y49 + 32, K.lineEnd - 1.2, { size: 22, italic: true, track: 0.04 });
  label(ctx, 'TREATY OF 1846', 890, main.y49 - 14, K.lineEnd - 0.6, { size: 18, track: 0.22 });
  { const k = seg(t, 1.1, 1.8); if (k > 0 && t < 13.9) roundelFrame(ctx, main.PR[0], main.PR[1], 24, { p: k, w: 2 }); }
  drawRoundel(ctx, t);
  // the title, cut last
  label(ctx, 'POINT ROBERTS', 540, 175, 29.0, { size: 66, weight: 600, track: 0.16, dur: 1.4 });
  label(ctx, 'Washington · reached by land only through Canada', 540, 228, 30.0, { size: 24, italic: true, track: 0.03, dur: 1.5 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!(Q && Q.has('nosubs'))) caption(ctx, t);
}
export function events() {
  const E = [], ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  TL.V.forEach(v => ev(v.t, 'vo', { id: v.id }));
  ev(0, 'burin', { dur: 3.6, gain: 0.8 }); ev(1.3, 'hatch', { dur: 3.7 }); ev(1.1, 'scribe', { dur: 0.7 });
  [5.4, 5.9, 6.5, 7.0].forEach(x => ev(x, 'ticks', { dur: 0.5 }));
  ev(K.lineStart, 'rule', { dur: K.lineEnd - K.lineStart }); ev(K.lineEnd + 0.1, 'brush', { dur: 1.4 }); ev(K.lineEnd - 1.2, 'ticks', { dur: 1.2 });
  ev(13.9, 'scribe', { dur: 0.5 }); ev(14.55, 'sheet', { dur: 1.2 }); ev(15.75, 'land', {});
  ev(K.below - 0.1, 'rule', { dur: 0.9 }); ev(K.below + 0.7, 'hatch', { dur: 0.8 }); ev(K.tip, 'brush', { dur: 1.0 }); ev(K.tip, 'plip', {});
  ev(K.carStart, 'dots', { dur: K.carEnd - K.carStart }); ev(K.cross1, 'scribe', { dur: 0.45 }); ev(K.cross2, 'scribe', { dur: 0.45 });
  ev(29.0, 'ticks', { dur: 2.4 });
  return E.sort((a, b) => a.t - b.t);
}
