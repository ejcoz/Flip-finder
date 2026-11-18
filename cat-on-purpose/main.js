// Your Cat Is Doing It On Purpose — low-poly isometric room dioramas, 1080x1920.
// The picture is a pure function of time: window.render(t).
import * as THREE from 'three';

const W = innerWidth, H = innerHeight;
const DUR = 25.8;
const V3 = THREE.Vector3;

// ---------------------------------------------------------------- helpers
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a, b, u) => a + (b - a) * u;
const eo = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const ei = (x) => Math.pow(clamp(x, 0, 1), 2);
function kf(t, keys) {           // smoothstep keyframes; values: number or array
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = ss((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pop = (s) => s <= 0 ? 0 : 1 - Math.exp(-9 * s) * Math.cos(17 * s);

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
{ // screen-space sky gradient (no horizon)
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#8fd8d0'); gr.addColorStop(0.55, '#d9f1e8'); gr.addColorStop(1, '#ffe7c7');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  scene.background = tx;
}
const hemi = new THREE.HemisphereLight('#fff6ea', '#d8a77a', 1.55); scene.add(hemi);
const key = new THREE.DirectionalLight('#fff1de', 2.7);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
scene.add(key); scene.add(key.target);
const fill = new THREE.DirectionalLight('#cfe9ff', 0.55); scene.add(fill); scene.add(fill.target);

const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const CAM_BACK = new V3();
function setCam(target, az, el, fh) {
  const d = 60, tg = new V3(...target);
  cam.position.set(tg.x + d * Math.cos(el) * Math.sin(az), tg.y + d * Math.sin(el), tg.z + d * Math.cos(el) * Math.cos(az));
  cam.up.set(0, 1, 0); cam.lookAt(tg);
  const hw = fh * W / H / 2;
  cam.left = -hw; cam.right = hw; cam.top = fh / 2; cam.bottom = -fh / 2;
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  CAM_BACK.copy(cam.position).sub(tg).normalize();
}

// ---------------------------------------------------------------- materials & geometry
const mats = {};
function M(hex, o = {}) {
  const k = hex + JSON.stringify(o);
  return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 0.85, metalness: 0, ...o }));
}
const G = {
  ico: new THREE.IcosahedronGeometry(1, 1), ico0: new THREE.IcosahedronGeometry(1, 0),
  box: new THREE.BoxGeometry(1, 1, 1), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8), sph: new THREE.SphereGeometry(1, 14, 10),
  cone4: new THREE.ConeGeometry(1, 1, 4), cone6: new THREE.ConeGeometry(1, 1, 6),
};
function mesh(geo, mat, pos = [0, 0, 0], scl = 1, rot = [0, 0, 0], parent = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (typeof scl === 'number') m.scale.setScalar(scl); else m.scale.set(...scl);
  m.rotation.set(...rot);
  m.castShadow = shadow; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const YAX = new V3(0, 1, 0);
function placeSeg(m, a, b, r) {          // a cylinder (unit, along Y) from a to b
  const d = new V3().subVectors(b, a), len = d.length();
  m.position.copy(a).addScaledVector(d, 0.5);
  m.scale.set(r, len, r);
  m.quaternion.setFromUnitVectors(YAX, d.normalize());
}
function ik(S, T, a, b, pole) {           // two-bone IK, returns joint position
  const d = new V3().subVectors(T, S); let L = d.length();
  L = clamp(L, 0.02, a + b - 1e-3);
  const dir = d.normalize();
  const along = (L * L + a * a - b * b) / (2 * L), h = Math.sqrt(Math.max(0, a * a - along * along));
  const perp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  return S.clone().addScaledVector(dir, along).addScaledVector(perp, h);
}

// ---------------------------------------------------------------- palette
const C = {
  orange: '#f2852a', stripe: '#c24d16', cream: '#fff1d8', pink: '#f59aa5', ink: '#22160f',
  wood: '#d49656', woodD: '#a8642f', woodL: '#e2ad6e', wall: '#fbefdc', teal: '#22a99c', tealD: '#178277',
  amber: '#f4b02a', grass: '#8fd05c', grassD: '#6fb84a', earth: '#b98352', mustard: '#f0a531', navy: '#3b3f5c',
};

// ---------------------------------------------------------------- the cat
function makeCat() {
  const root = new THREE.Group();
  const O = M(C.orange), D = M(C.stripe), CR = M(C.cream), P = M(C.pink), K = M(C.ink, { roughness: 0.5 });
  const chest = mesh(G.ico, O, [0, 0, 0], [0.27, 0.33, 0.27], [0, 0, 0], root);
  const bib = mesh(G.ico, CR, [0, 0, 0], [0.17, 0.23, 0.11], [0, 0, 0], root);
  const haunch = mesh(G.ico, O, [0, 0, 0], [0.34, 0.3, 0.37], [0, 0, 0], root);
  const backStripes = [-0.13, 0, 0.13].map(() => mesh(G.ico, D, [0, 0, 0], [0.13, 0.025, 0.04], [0, 0, 0], root));
  const hips = [-1, 1].map(() => mesh(G.ico, O, [0, 0, 0], [0.12, 0.17, 0.21], [0, 0, 0], root));
  const hpaws = [-1, 1].map(() => mesh(G.ico, O, [0, 0, 0], [0.085, 0.05, 0.13], [0, 0, 0], root));

  // head
  const head = new THREE.Group(); head.rotation.order = 'YXZ'; root.add(head);
  mesh(G.ico, O, [0, 0, 0], [0.33, 0.28, 0.29], [0, 0, 0], head);
  [[-0.075, 0.2, 0.16, 0.2], [0, 0.215, 0.15, 0], [0.075, 0.2, 0.16, -0.2]].forEach(([x, y, z, rz]) =>
    mesh(G.ico, D, [x, y, z], [0.022, 0.012, 0.075], [-0.75, 0, rz], head));
  const cheeks = [-1, 1].map(s => mesh(G.ico, CR, [s * 0.068, -0.1, 0.215], [0.105, 0.08, 0.09], [0, 0, 0], head));
  mesh(G.ico, CR, [0, -0.165, 0.18], [0.07, 0.04, 0.06], [0, 0, 0], head); // chin
  mesh(G.ico, P, [0, -0.052, 0.305], [0.038, 0.024, 0.02], [0, 0, 0], head); // nose
  const mouth = [-1, 1].map(s => mesh(G.box, K, [s * 0.024, -0.1, 0.312], [0.05, 0.009, 0.01], [0, 0, s * 0.45], head, false));
  const ears = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * 0.17, 0.2, -0.03); head.add(g);
    mesh(G.cone4, O, [0, 0.1, 0], [0.11, 0.22, 0.09], [0, Math.PI / 4, 0], g);
    mesh(G.cone4, P, [0, 0.085, 0.035], [0.065, 0.14, 0.03], [0, Math.PI / 4, 0], g);
    return g;
  });
  // eyes
  const capGeo = new THREE.SphereGeometry(1.012, 16, 6, 0, Math.PI * 2, 0, 0.82); capGeo.rotateX(Math.PI / 2);
  const eyes = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * 0.125, 0.035, 0.222); g.rotation.set(-0.05, s * 0.3, 0); head.add(g);
    const sc = new THREE.Group(); sc.scale.set(0.1, 0.112, 0.062); g.add(sc);
    mesh(G.sph, M('#fffaf2', { roughness: 0.45 }), [0, 0, 0], 1, [0, 0, 0], sc, false);
    const look = new THREE.Group(); sc.add(look);
    mesh(capGeo, M(C.amber, { roughness: 0.45 }), [0, 0, 0], 1, [0, 0, 0], look, false);
    const pupil = mesh(G.ico, M('#140c08', { roughness: 0.35 }), [0, 0, 0.94], [0.45, 0.62, 0.14], [0, 0, 0], look, false);
    mesh(G.ico0, M('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.7 }), [0.34, 0.37, 0.96], [0.17, 0.17, 0.08], [0, 0, 0], sc, false);
    const lid = (up) => {
      const plane = new THREE.Plane();
      const m = mesh(G.sph, new THREE.MeshStandardMaterial({ color: C.orange, flatShading: true, roughness: 0.85, side: THREE.DoubleSide, clippingPlanes: [plane] }), [0, 0, 0], 1.17, [0, 0, 0], sc, false);
      return { m, plane, up };
    };
    return { s, g, sc, look, pupil, lids: [lid(true), lid(false)] };
  });
  // front legs
  const legs = [-1, 1].map(s => ({
    s, up: mesh(G.cyl6, O, [0, 0, 0], 1, [0, 0, 0], root), lo: mesh(G.cyl6, O, [0, 0, 0], 1, [0, 0, 0], root),
    paw: (() => {
      const g = new THREE.Group(); g.scale.setScalar(1.18); root.add(g);
      mesh(G.ico, O, [0, 0, 0], [0.085, 0.058, 0.105], [0, 0, 0], g);
      [-0.045, 0, 0.045].forEach(x => mesh(G.ico, CR, [x, -0.005, 0.085], [0.032, 0.03, 0.032], [0, 0, 0], g));
      return g;
    })(),
  }));
  // tail
  const tail = Array.from({ length: 8 }, (_, i) => mesh(G.cyl6, i >= 6 ? D : (i % 2 ? D : O), [0, 0, 0], 1, [0, 0, 0], root));

  const v = (a) => new V3(...a);
  const tmp = new V3(), qInv = new THREE.Quaternion();
  function lookAngles(target) {          // yaw/pitch (root-local) for the head to face a world point
    root.updateMatrixWorld(true);
    const hw = head.getWorldPosition(new V3());
    const d = new V3().subVectors(target, hw).normalize();
    root.getWorldQuaternion(qInv); qInv.invert(); d.applyQuaternion(qInv);
    return [Math.atan2(d.x, d.z), -Math.asin(clamp(d.y, -1, 1))];
  }
  function pose(p, t) {
    const q = { ...SIT, ...p };
    root.position.set(...q.pos); root.rotation.set(0, q.ry, 0); root.scale.setScalar(q.scale);
    const br = 1 + 0.025 * Math.sin(t * 5.2);
    const ch = v(q.chest), hn = v(q.haunch);
    hn.x += q.wiggle;
    chest.position.copy(ch); chest.rotation.set(q.chestRx, 0, 0); chest.scale.set(0.27 * br, 0.33, 0.27 * br);
    bib.position.copy(ch).add(new V3(0, -0.01, 0.19).applyEuler(chest.rotation)); bib.rotation.copy(chest.rotation);
    haunch.position.copy(hn); haunch.rotation.set(q.haunchRx, 0, q.wiggle * 1.5);
    backStripes.forEach((m, i) => { m.position.copy(hn).add(new V3(0, 0.29, (i - 1) * 0.13).applyEuler(haunch.rotation)); m.rotation.copy(haunch.rotation); });
    hips.forEach((m, i) => { const s = i ? 1 : -1; m.position.copy(hn).add(new V3(s * 0.2, -0.09, 0.03)); m.rotation.set(q.haunchRx, 0, 0); });
    hpaws.forEach((m, i) => { const s = i ? 1 : -1; m.position.set(hn.x + s * 0.19, 0.045, hn.z + q.hpawZ); });
    // head
    head.position.set(...q.head);
    let hy = q.hy, hp = q.hp;
    if (q.look && q.lookW > 0) { const [y, x] = lookAngles(q.look); hy = lerp(hy, y, q.lookW); hp = lerp(hp, x, q.lookW); }
    if (q.lookCam > 0) {
      root.updateMatrixWorld(true);
      const hw = head.getWorldPosition(new V3()).addScaledVector(CAM_BACK, 30);
      const [y, x] = lookAngles(hw); hy = lerp(hy, y, q.lookCam); hp = lerp(hp, x, q.lookCam);
    }
    let eyeP = q.eye[1];
    if (hp > 0.4) { eyeP -= (hp - 0.4) * 0.9; hp = 0.4; }
    head.rotation.set(hp, hy, q.hr);
    ears.forEach((g, i) => { const s = i ? 1 : -1; g.rotation.set(-q.earBack + (i ? q.earTw : 0), 0, -s * (0.32 + q.earFlat)); });
    mouth.forEach((m, i) => { const s = i ? 1 : -1; m.rotation.z = s * 0.45 + (i ? q.smirk : -q.smirk * 0.3); m.position.y = -0.1 + (i ? q.smirk * 0.012 : 0); });
    // eyes
    const px = lerp(0.13, 0.66, q.pupil), py = lerp(0.6, 0.7, q.pupil);
    root.updateMatrixWorld(true);
    eyes.forEach(e => {
      e.look.rotation.set(-clamp(eyeP, -0.5, 0.5), q.eye[0], 0);
      e.pupil.scale.set(px, py, 0.14);
      e.lids.forEach(L => {
        const amt = L.up ? q.lidU : q.lidL;
        const level = 1.17 - amt * 2.34;
        if (amt <= 0.001) { L.m.visible = false; return; }
        L.m.visible = true;
        const tl = -e.s * q.tilt * (L.up ? 1 : -0.5);
        const n = L.up ? new V3(-Math.sin(tl), Math.cos(tl), 0) : new V3(Math.sin(tl), -Math.cos(tl), 0);
        L.plane.set(n, -level);
        L.plane.applyMatrix4(e.sc.matrixWorld);
      });
    });
    // front legs (IK in root-local space)
    legs.forEach(L => {
      const S = ch.clone().add(new V3(L.s * 0.12, 0.05, 0.08));
      const tgt = q[L.s < 0 ? 'pawR' : 'pawL'] || [L.s * 0.1, 0.045, ch.z + 0.16];
      const T = v(tgt);
      const E = ik(S, T, 0.25, 0.25, new V3(0, -0.35, -1));
      placeSeg(L.up, S, E, 0.072); placeSeg(L.lo, E, T, 0.066);
      L.paw.position.copy(T);
      const pr = q[L.s < 0 ? 'pawRotR' : 'pawRotL'] || [0, 0, 0];
      L.paw.rotation.set(...pr);
    });
    // tail
    const tq = q.tail;
    let pt = hn.clone().add(new V3(0, -0.06, -0.33));
    let hdg = tq.h0 * tq.side, el = tq.e0;
    tail.forEach((m, i) => {
      const w = (i + 1) / tail.length;
      hdg += (tq.curl + tq.amp * w * 2 * Math.sin(tq.freq * t * 6.283 - i * 0.55)) * tq.side;
      el += tq.lift;
      const dir = new V3(Math.sin(hdg) * Math.cos(el), Math.sin(el), -Math.cos(hdg) * Math.cos(el));
      const nx = pt.clone().addScaledVector(dir, 0.105);
      if (nx.y < 0.04 && tq.ground) nx.y = 0.04;
      placeSeg(m, pt, nx, lerp(0.058, 0.036, w));
      pt = nx;
    });
  }
  return { root, pose, head };
}
const SIT = {
  pos: [0, 0, 0], ry: 0, scale: 1,
  chest: [0, 0.47, 0.07], chestRx: -0.12, haunch: [0, 0.29, -0.17], haunchRx: 0, wiggle: 0, hpawZ: 0.2,
  head: [0, 0.93, 0.15], hy: 0, hp: 0, hr: 0, look: null, lookW: 0, lookCam: 0,
  eye: [0, 0], pupil: 0.55, lidU: 0, lidL: 0, tilt: 0, earBack: 0, earFlat: 0, earTw: 0, smirk: 0,
  pawL: null, pawR: null, pawRotL: null, pawRotR: null,
  tail: { h0: 0.3, e0: -0.55, lift: 0.07, curl: 0.2, amp: 0.06, freq: 0.6, side: 1, ground: true },
};
const CROUCH = {
  chest: [0, 0.27, 0.16], chestRx: 0.25, haunch: [0, 0.33, -0.28], haunchRx: 0.15, hpawZ: 0.25,
  head: [0, 0.47, 0.44],
};
function mixPose(a, b, u) {               // blend numeric fields of two partial poses
  const o = {};
  for (const k of Object.keys(b)) {
    const x = a[k] ?? SIT[k], y = b[k];
    o[k] = Array.isArray(y) ? y.map((v, j) => lerp(x[j], v, u)) : (typeof y === 'number' ? lerp(x, y, u) : y);
  }
  return o;
}

// ---------------------------------------------------------------- the owner (simple, no face)
function makeOwner() {
  const root = new THREE.Group();
  const SH = M('#1fa597'), PA = M(C.navy), SK = M('#f0c19c'), HA = M('#4e2f1f'), SO = M('#2a2a33');
  const hips = new THREE.Group(); root.add(hips);
  const torso = new THREE.Group(); hips.add(torso);
  mesh(G.cyl6, SH, [0, 0.36, 0], [0.27, 0.72, 0.2], [0, 0, 0], torso);
  mesh(G.ico, PA, [0, 0.0, 0], [0.27, 0.12, 0.2], [0, 0, 0], torso);
  const headG = new THREE.Group(); headG.position.set(0, 0.98, 0); torso.add(headG);
  mesh(G.cyl6, SK, [0, -0.17, 0], [0.08, 0.14, 0.08], [0, 0, 0], torso).position.set(0, 0.78, 0);
  mesh(G.ico, SK, [0, 0, 0], 0.23, [0, 0, 0], headG);
  mesh(G.ico, HA, [0, 0.08, -0.04], [0.245, 0.19, 0.24], [0, 0, 0], headG);
  function limb(parent, pos, l1, l2, r1, r2, m1, m2, endMesh) {
    const j1 = new THREE.Group(); j1.position.set(...pos); parent.add(j1);
    mesh(G.cyl6, m1, [0, -l1 / 2, 0], [r1, l1, r1], [0, 0, 0], j1);
    const j2 = new THREE.Group(); j2.position.set(0, -l1, 0); j1.add(j2);
    mesh(G.cyl6, m2, [0, -l2 / 2, 0], [r2, l2, r2], [0, 0, 0], j2);
    endMesh(j2, l2);
    return [j1, j2];
  }
  const arms = [-1, 1].map(s => limb(torso, [s * 0.33, 0.66, 0], 0.38, 0.36, 0.075, 0.065, SH, SK,
    (j, l) => mesh(G.ico, SK, [0, -l - 0.04, 0], 0.075, [0, 0, 0], j)));
  const legs = [-1, 1].map(s => limb(hips, [s * 0.14, 0, 0], 0.52, 0.5, 0.11, 0.09, PA, PA,
    (j, l) => mesh(G.box, SO, [0, -l - 0.03, 0.07], [0.15, 0.08, 0.3], [0, 0, 0], j)));
  function pose(q) {
    root.position.set(...q.pos); root.rotation.set(0, q.ry, 0);
    hips.position.set(0, q.hipY, 0);
    torso.rotation.set(q.lean, 0, q.twist || 0);
    headG.rotation.set(q.headX || 0, 0, q.headZ || 0);
    arms.forEach(([a, e], i) => { const s = i ? 1 : -1; const A = q.arms[i]; a.rotation.set(A[0], 0, s * A[1]); e.rotation.set(A[2], 0, 0); });
    legs.forEach(([a, k], i) => { const L = q.legs[i]; a.rotation.set(L[0], 0, 0); k.rotation.set(L[1], 0, 0); });
  }
  return { root, pose };
}

// ---------------------------------------------------------------- sets
const rnd = mulberry(7);
const jit = (hex, a = 0.05) => { const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, clamp(hsl.l + (rnd() - 0.5) * 2 * a, 0, 1)); return '#' + c.getHexString(); };
const FLOOR = -1.3;

function makeRoom(size, wallH) {
  const g = new THREE.Group();
  const half = size / 2;
  mesh(G.box, M(C.woodD), [0, FLOOR - 0.33, 0], [size, 0.6, size], [0, 0, 0], g);
  const n = Math.round(size / 0.58);
  for (let i = 0; i < n; i++) {
    const w = size / n;
    mesh(G.box, M(jit(C.wood, 0.045)), [-half + w * (i + 0.5), FLOOR - 0.03, 0], [w - 0.025, 0.06, size], [0, 0, 0], g);
  }
  const wall = M(C.wall);
  mesh(G.box, wall, [0, FLOOR + wallH / 2, -half - 0.1], [size + 0.4, wallH, 0.2], [0, 0, 0], g);
  mesh(G.box, wall, [-half - 0.1, FLOOR + wallH / 2, 0], [0.2, wallH, size], [0, 0, 0], g);
  mesh(G.box, M(C.teal), [0, FLOOR + 0.55, -half + 0.02], [size, 1.1, 0.06], [0, 0, 0], g);
  mesh(G.box, M(C.teal), [-half + 0.02, FLOOR + 0.55, 0], [0.06, 1.1, size], [0, 0, 0], g);
  mesh(G.box, M('#fff8ee'), [0, FLOOR + 1.12, -half + 0.05], [size, 0.06, 0.08], [0, 0, 0], g);
  mesh(G.box, M('#fff8ee'), [-half + 0.05, FLOOR + 1.12, 0], [0.08, 0.06, size], [0, 0, 0], g);
  return g;
}
function makeTable(parent, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  for (let i = 0; i < 4; i++) mesh(G.box, M(jit(C.woodL, 0.035)), [0, -0.07, -0.85 + 0.425 * (i + 0.5)], [2.8, 0.14, 0.41], [0, 0, 0], g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(G.box, M(C.woodD), [sx * 1.25, (FLOOR - 0.14) / 2, sz * 0.7], [0.14, -FLOOR - 0.14, 0.14], [0, 0, 0], g);
  mesh(G.box, M(C.wood), [0, -0.2, 0.0], [2.6, 0.12, 1.5], [0, 0, 0], g);
  return g;
}
function makeWindow(parent, pos, rotY = 0) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; parent.add(g);
  mesh(G.box, M('#ffffff'), [0, 0, 0], [1.5, 1.25, 0.08], [0, 0, 0], g);
  mesh(G.box, M('#a9e3f0', { emissive: '#a9e3f0', emissiveIntensity: 0.35 }), [0, 0, 0.03], [1.32, 1.07, 0.04], [0, 0, 0], g);
  mesh(G.box, M('#ffffff'), [0, 0, 0.06], [0.07, 1.07, 0.03], [0, 0, 0], g);
  mesh(G.box, M('#ffffff'), [0, 0, 0.06], [1.32, 0.07, 0.03], [0, 0, 0], g);
  mesh(G.box, M(C.orange), [0, -0.68, 0.12], [1.7, 0.08, 0.26], [0, 0, 0], g);
  return g;
}
function makePlant(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.36, 8), M('#d9693b'), [0, 0.18, 0], 1, [0, 0, 0], g);
  [[0, 0.62, 0, 0.28], [0.16, 0.5, 0.08, 0.2], [-0.15, 0.52, -0.05, 0.22], [0.02, 0.85, 0.02, 0.18]].forEach(([x, y, z, r]) =>
    mesh(G.ico0, M(jit('#4caf62', 0.06)), [x, y, z], r, [rnd(), rnd(), 0], g));
  return g;
}
function makeGlass(color = '#86dcd3', h = 0.27) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.088, 0.075, h, 8); geo.translate(0, h / 2, 0);
  mesh(geo, M(color, { transparent: true, opacity: 0.82, roughness: 0.25 }), [0, 0, 0], 1, [0, 0, 0], g);
  const wgeo = new THREE.CylinderGeometry(0.074, 0.068, h * 0.55, 8); wgeo.translate(0, h * 0.3, 0);
  mesh(wgeo, M('#3fb6e0', { roughness: 0.3 }), [0, 0, 0], 1, [0, 0, 0], g);
  const rgeo = new THREE.CylinderGeometry(0.092, 0.092, 0.025, 8); rgeo.translate(0, h - 0.012, 0);
  mesh(rgeo, M('#ffffff', { roughness: 0.3 }), [0, 0, 0], 1, [0, 0, 0], g);
  return g;
}
function makeCupHalves(color) {          // a cup made of two halves, so it can crack in two
  const g = new THREE.Group(), halves = [];
  for (let i = 0; i < 2; i++) {
    const hg = new THREE.Group(); g.add(hg);
    const geo = new THREE.CylinderGeometry(0.1, 0.082, 0.22, 8, 1, false, i * Math.PI, Math.PI); geo.translate(0, 0.11, 0);
    mesh(geo, M(color, { side: THREE.DoubleSide }), [0, 0, 0], 1, [0, 0, 0], hg);
    const bgeo = new THREE.CylinderGeometry(0.104, 0.104, 0.04, 8, 1, false, i * Math.PI, Math.PI); bgeo.translate(0, 0.17, 0);
    mesh(bgeo, M('#fff6e4', { side: THREE.DoubleSide }), [0, 0, 0], 1, [0, 0, 0], hg);
    halves.push(hg);
  }
  return { g, halves };
}

// Kitchen diorama
const kitchen = makeRoom(6.4, 4.4); scene.add(kitchen);
makeTable(kitchen, 0, 0);
makeWindow(kitchen, [0.6, 1.0, -3.13]);
makePlant(kitchen, [-2.6, FLOOR, -2.5], 1.3);
{ // shelf with jars on the left wall
  mesh(G.box, M(C.woodD), [-3.08, 1.3, -0.6], [0.32, 0.07, 1.8], [0, 0, 0], kitchen);
  [['#ffffff', -1.2, 0.34], [C.teal, -0.75, 0.26], [C.orange, -0.3, 0.3], [C.mustard, 0.1, 0.22]].forEach(([c, z, h]) =>
    mesh(new THREE.CylinderGeometry(0.11, 0.11, h, 8), M(c), [-3.05, 1.33 + h / 2, z], 1, [0, 0, 0], kitchen));
  // chair behind the table
  const ch = new THREE.Group(); ch.position.set(-0.7, 0, -1.3); kitchen.add(ch);
  mesh(G.box, M(C.teal), [0, -0.75, 0], [0.8, 0.1, 0.75], [0, 0, 0], ch);
  mesh(G.box, M(C.teal), [0, -0.05, -0.33], [0.8, 1.3, 0.1], [0, 0, 0], ch);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(G.box, M(C.tealD), [sx * 0.33, -1.2, sz * 0.3], [0.08, 0.8, 0.08], [0, 0, 0], ch);
}
mesh(G.box, M('#fff4e2'), [0.9, FLOOR + 0.005, 1.6], [2.6, 0.03, 1.6], [0, 0, 0], kitchen); // rug
mesh(G.box, M(C.orange), [0.9, FLOOR + 0.01, 1.6], [2.3, 0.03, 0.18], [0, 0, 0], kitchen);

// kitchen props
const GS = 1.3;
const glass1 = makeGlass(); glass1.scale.setScalar(GS); kitchen.add(glass1);
const pen = new THREE.Group(); kitchen.add(pen);
mesh(G.cyl6, M(C.teal), [0, 0, 0], [0.035, 0.42, 0.035], [0, 0, Math.PI / 2], pen);
mesh(G.cone6, M('#fff1d8'), [0.25, 0, 0], [0.035, 0.08, 0.035], [0, 0, -Math.PI / 2], pen);
mesh(G.cyl6, M(C.orange), [-0.2, 0, 0], [0.04, 0.06, 0.04], [0, 0, Math.PI / 2], pen);
const cup = makeCupHalves(C.teal); kitchen.add(cup.g);
const mug = new THREE.Group(); kitchen.add(mug);
mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.24, 8), M(C.teal), [0, 0.12, 0], 1, [0, 0, 0], mug);
mesh(new THREE.TorusGeometry(0.07, 0.022, 4, 8), M(C.teal), [0.13, 0.13, 0], 1, [0, 0, 0], mug);
const row = [C.teal, '#ff9a3c', '#86dcd3', '#fff1d8'].map((c, i) => { const gl = makeGlass(i === 1 || i === 3 ? c : '#86dcd3'); kitchen.add(gl); return gl; });

// Grass patch (hex tiles)
const grass = new THREE.Group(); scene.add(grass);
{
  const R = 0.42;
  for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) {
    const s = -q - r; const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
    if (ring > 4) continue;
    const x = R * Math.sqrt(3) * (q + r / 2), z = R * 1.5 * r;
    const top = ring <= 2 ? 0 : (ring === 3 ? (rnd() - 0.4) * 0.12 : -0.1 + rnd() * 0.25);
    const h = 0.9 + top;
    mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.96, h - 0.07, 6), M(jit(C.earth, 0.04)), [x, top - 0.07 - (h - 0.07) / 2 - 0.01, z], 1, [0, 0, 0], grass);
    mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.965, 0.08, 6), M(jit(ring % 2 ? C.grass : C.grassD, 0.05)), [x, top - 0.04, z], 1, [0, 0, 0], grass);
    if (ring >= 2 && rnd() < 0.35) { // tuft or flower
      if (rnd() < 0.5) [0, 1, 2].forEach(k => mesh(G.cone4, M('#5aa83f'), [x + (k - 1) * 0.06, top + 0.08, z + (rnd() - 0.5) * 0.1], [0.03, 0.16, 0.03], [0, 0, (k - 1) * 0.3], grass));
      else {
        mesh(G.cyl6, M('#4f9a3a'), [x, top + 0.09, z], [0.012, 0.18, 0.012], [0, 0, 0], grass);
        mesh(G.ico0, M(rnd() < 0.5 ? '#ffffff' : C.orange), [x, top + 0.2, z], 0.05, [0, 0, 0], grass);
      }
    }
  }
  mesh(G.ico0, M('#b6b9be'), [-1.2, 0.08, 1.0], [0.28, 0.2, 0.24], [0.3, 0.5, 0], grass);
  mesh(G.ico0, M('#9ea3aa'), [1.3, 0.05, -1.1], [0.2, 0.15, 0.18], [0.1, 1.2, 0], grass);
}
const mouse = new THREE.Group(); grass.add(mouse);
const mouseBody = new THREE.Group(); mouse.add(mouseBody);
{
  const Gr = M('#a59a96'), Pk = M(C.pink);
  mesh(G.ico, Gr, [0, 0.08, 0], [0.1, 0.08, 0.15], [0, 0, 0], mouseBody);
  mesh(G.ico, Gr, [0, 0.1, 0.15], [0.07, 0.065, 0.085], [0, 0, 0], mouseBody);
  mesh(G.ico0, Pk, [0, 0.1, 0.24], 0.018, [0, 0, 0], mouseBody);
  [-1, 1].forEach(s => { mesh(G.ico, Pk, [s * 0.055, 0.17, 0.12], [0.04, 0.04, 0.012], [0, 0, 0], mouseBody); mesh(G.ico0, M(C.ink), [s * 0.035, 0.125, 0.215], 0.013, [0, 0, 0], mouseBody, false); });
  [0, 1, 2].forEach(i => mesh(G.cyl6, Pk, [0, 0.05 + i * 0.01, -0.17 - i * 0.09], [0.012, 0.1, 0.012], [Math.PI / 2 - 0.2 * i, 0, 0], mouseBody));
}

// Living room diorama: couch (left) and table (right) side by side, so both sit above the caption
const living = makeRoom(8, 4.4); scene.add(living);
const U = new V3(Math.SQRT1_2, 0, -Math.SQRT1_2), VV = new V3(-Math.SQRT1_2, 0, -Math.SQRT1_2);
const at = (u, v, y = 0) => U.clone().multiplyScalar(u).addScaledVector(VV, v).setY(y);
const LT = at(1.05, 0.55);
makeTable(living, LT.x, LT.z).rotation.y = 2.356;
makeWindow(living, [0.3, 1.2, -4.13]);
makePlant(living, [-3.3, FLOOR, -3.3], 1.3);
{
  const CC = at(-1.2, 0.35, FLOOR);
  const cg = new THREE.Group(); cg.position.copy(CC); cg.rotation.y = 2.356; living.add(cg);
  const MU = M(C.mustard), MD = M('#d8892a');
  mesh(G.box, MD, [0, 0.22, 0], [2.4, 0.44, 1.0], [0, 0, 0], cg);
  [-0.58, 0.58].forEach(x => mesh(G.box, MU, [x, 0.52, 0.05], [1.12, 0.18, 0.88], [0, 0, 0], cg));
  mesh(G.box, MU, [0, 0.85, -0.4], [2.4, 0.85, 0.26], [0, 0, 0], cg);
  [-1, 1].forEach(s => mesh(G.box, MD, [s * 1.3, 0.5, 0], [0.22, 0.66, 1.0], [0, 0, 0], cg));
  mesh(G.box, M(C.teal), [0.75, 0.78, -0.2], [0.42, 0.38, 0.13], [0.2, -0.2, 0], cg);
  const rg = at(0.0, 0.2, FLOOR + 0.01);
  mesh(G.box, M('#fff4e2'), [rg.x, rg.y, rg.z], [3.4, 0.03, 3.4], [0, Math.PI / 4, 0], living);
  mesh(G.box, M(C.orange), [rg.x, rg.y + 0.01, rg.z], [3.0, 0.03, 0.2], [0, Math.PI / 4, 0], living);
  const lp = new THREE.Group(); lp.position.copy(at(-1.3, 1.9, FLOOR)); living.add(lp);
  mesh(G.cyl6, M(C.navy), [0, 1.1, 0], [0.03, 2.2, 0.03], [0, 0, 0], lp);
  mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.42, 8, 1, true), M('#fff3d6', { emissive: '#ffd890', emissiveIntensity: 0.5, side: THREE.DoubleSide }), [0, 2.3, 0], 1, [0, 0, 0], lp);
  [[-2.2, 1.9, C.teal], [-1.0, 2.1, C.orange]].forEach(([x, y, c]) => {
    mesh(G.box, M('#ffffff'), [-3.97, y, x], [0.05, 0.62, 0.8], [0, 0, 0], living);
    mesh(G.box, M(c), [-3.94, y, x], [0.04, 0.46, 0.64], [0, 0, 0], living);
  });
}
const brokenGlass = makeCupHalves('#86dcd3'); living.add(brokenGlass.g);
brokenGlass.g.position.copy(at(0.25, -0.75, FLOOR));
brokenGlass.halves[0].rotation.set(0, 0.4, 1.25); brokenGlass.halves[0].position.set(-0.08, 0.08, 0);
brokenGlass.halves[1].rotation.set(0, 0.4, -1.3); brokenGlass.halves[1].position.set(0.1, 0.08, 0.02);

const cat = makeCat(); scene.add(cat.root);
const owner = makeOwner(); living.add(owner.root);

// ---------------------------------------------------------------- shots
const SHOTS = [
  { t0: 0.0, t1: 2.9, set: 'kitchen', f: shot1 },
  { t0: 2.9, t1: 5.0, set: 'kitchen', f: shot2 },
  { t0: 5.0, t1: 10.3, set: 'grass', f: shot3 },
  { t0: 10.3, t1: 12.2, set: 'kitchen', f: shot4 },
  { t0: 12.2, t1: 14.7, set: 'kitchen', f: shot5 },
  { t0: 14.7, t1: 18.0, set: 'kitchen', f: shot6 },
  { t0: 18.0, t1: 21.5, set: 'living', f: shot7 },
  { t0: 21.5, t1: 22.8, set: 'kitchen', f: shot8 },
  { t0: 22.8, t1: DUR + 1, set: 'kitchen', f: shot9 },
];
const hide = (...objs) => objs.forEach(o => { o.visible = false; });
const PUSH = new V3(Math.SQRT1_2, 0, -Math.SQRT1_2);

function tipGlass(g, base, dir, s, ang, fallT, R) {   // slide along dir by s, tip over the far rim by ang, then fall
  const k = new V3().crossVectors(YAX, dir).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(k, ang);
  const pivot = base.clone().addScaledVector(dir, s + R);
  const off = dir.clone().multiplyScalar(-R).applyQuaternion(q);
  g.position.copy(pivot).add(off);
  if (fallT > 0) { g.position.y -= 0.5 * 9 * fallT * fallT; g.position.addScaledVector(dir, 0.35 * fallT); }
  g.quaternion.copy(q);
}

function shot1(t) {            // 0–2.9: the paw on the glass, staring at us
  const catPos = new V3(0.79, 0, 0.04), ry = Math.PI / 4, R = 0.085 * GS;
  const base = new V3(1.4 - R - 0.1, 0, -0.005);
  const s = kf(t, [[0, 0.04], [0.42, 0.12]]);
  const ang = kf(t, [[0, 0.05], [0.42, 0.55]]) + (t > 0.42 ? (t - 0.42) * 4.2 : 0);
  const fallT = Math.max(0, t - 0.42);
  tipGlass(glass1, base, PUSH, s, ang, fallT, R); glass1.visible = fallT < 1.3;
  const gp = new V3().copy(base).addScaledVector(PUSH, Math.min(s, 0.12));
  const loc = gp.clone().sub(catPos).applyAxisAngle(YAX, -ry);
  const pawPush = [loc.x - R - 0.06, 0.2, loc.z];
  const pawHold = [loc.x - 0.02, 0.14, loc.z];
  const pawRest = [0.12, 0.045, 0.24];
  const pw = t < 0.5 ? pawPush : kf(t, [[0.5, pawPush], [0.9, pawHold], [2.0, pawHold], [2.7, pawRest]]);
  cat.pose({
    pos: catPos.toArray(), ry, lookCam: 1, pupil: 0.5, lidU: kf(t, [[0, 0.12], [1.5, 0.12], [1.62, 0.95], [1.74, 0.12]]),
    hr: 0.06 * Math.sin(t * 2.2), pawL: pw, pawRotL: [0, 0, 0.5],
    earTw: t > 1.0 && t < 1.25 ? 0.5 * Math.sin((t - 1.0) * 25) : 0,
    tail: { ...SIT.tail, amp: 0.22, freq: 0.9, side: -1 },
  }, t);
  const fh = kf(t, [[0, 3.05], [2.9, 2.8]]);
  return { cam: [[1.0, 0.3, 0.06], Math.PI / 4, 0.42, fh] };
}

function shot2(t, lt) {        // 2.9–5.0: paw slides a pen to the edge
  const ry = 0.25, catPos = new V3(0.2, 0, 0.0);
  const u = ss(seg(lt, 0.1, 1.95));
  const penLocZ = lerp(0.47, 0.76, u);
  const penLoc = new V3(0.08, 0.035, penLocZ);
  const pw = penLoc.clone().applyAxisAngle(YAX, ry).add(catPos);
  pen.position.copy(pw); pen.rotation.set(u * 1.6, ry, 0);
  cat.pose({
    pos: catPos.toArray(), ry, chest: [0, 0.44, 0.13], chestRx: 0.05, head: [0, 0.86, 0.22],
    look: pw, lookW: 1, pupil: 0.9, earBack: -0.1,
    pawL: [0.09, 0.07, penLocZ - 0.11], pawRotL: [0.2, 0, 0],
    tail: { ...SIT.tail, amp: 0.14, freq: 0.7 },
  }, lt);
  const tg = new V3(0.3, 0.2, 0.32).lerp(new V3(0.36, 0.18, 0.46), ss(seg(lt, 0, 2.1)));
  return { cam: [tg.toArray(), 0.72, 0.36, kf(lt, [[0, 2.5], [2.1, 2.35]])] };
}

function shot3(t, lt) {        // 5.0–10.3: grass patch, tap the mouse, it runs
  const catPos = new V3(-0.5, 0, -0.3), mStart = new V3(0.3, 0, 0.18);
  const ry = Math.atan2(mStart.x - catPos.x, mStart.z - catPos.z);
  const dart = new V3(0.62, 0, -0.78).normalize();
  let mp = mStart.clone(), myaw = -0.9, hop = 0, sq = 1;
  const tap1 = 7.76, tap2 = 8.66, go = 9.36;
  myaw += 0.12 * Math.sin(t * 7) * (t < tap1 ? 1 : 0);
  for (const tt of [tap1, tap2]) { const s = t - tt; if (s > 0 && s < 0.35) { hop = Math.max(hop, Math.sin(s / 0.35 * Math.PI) * 0.09); sq = Math.min(sq, 1 - 0.3 * Math.exp(-s * 18)); } }
  if (t > tap1) myaw = kf(t, [[tap1, -0.9], [tap1 + 0.3, -0.4], [tap2, -0.4], [tap2 + 0.3, 0.1]]);
  if (t > go - 0.1) {
    const aim = Math.atan2(dart.x, dart.z);
    myaw = kf(t, [[go - 0.1, 0.1], [go + 0.06, aim]]);
    const s = Math.max(0, t - go - 0.04);
    mp.addScaledVector(dart, 3.4 * s * s / (s + 0.08));
    hop = Math.abs(Math.sin(s * 28)) * 0.05;
  }
  mouse.position.set(mp.x, hop, mp.z); mouse.rotation.y = myaw;
  mouseBody.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  mouse.visible = mp.distanceTo(mStart) < 4;
  const mLoc = new V3(mStart.x, 0, mStart.z).sub(catPos).applyAxisAngle(YAX, -ry);
  const over = [mLoc.x - 0.02, 0.26, mLoc.z - 0.12], on = [mLoc.x - 0.02, 0.15, mLoc.z - 0.03];
  const rest = [0.1, 0.045, 0.43];
  const paw = kf(t, [[5, rest], [6.9, rest], [7.55, over], [tap1, on], [8.1, over], [8.45, over], [tap2, on], [9.0, over], [9.6, rest]]);
  const tgt = t < go ? new V3(mStart.x, 0.12, mStart.z) : new V3(mp.x, 0.12, mp.z);
  cat.pose({
    ...mixPose({}, CROUCH, 1), pos: catPos.toArray(), ry,
    look: tgt, lookW: 1, pupil: kf(t, [[5, 0.6], [7.5, 0.8], [go, 0.8], [go + 0.2, 1]]),
    pawL: paw, pawRotL: [0.35, 0, 0], earBack: -0.15, wiggle: t > 6.0 && t < 7.3 ? 0.03 * Math.sin(t * 20) : 0,
    tail: { h0: 0, e0: 0.05, lift: 0.02, curl: 0.02, amp: 0.35, freq: 1.4, side: 1, ground: true },
  }, t);
  const az = kf(lt, [[0, 0.75], [5.3, 1.05]]);
  return { cam: [[0.0, 0.06, -0.05], az, 0.36, kf(lt, [[0, 2.75], [5.3, 2.55]])] };
}

function shot4(t, lt) {        // 10.3–12.2: watch it fall
  const catPos = new V3(0.95, 0, 0.2), ry = 0.75;
  const edge = new V3(1.33, 0, 0.5);
  const fall0 = 10.86, land = 11.88, fd = land - fall0, drop = -FLOOR;
  let cp = edge.clone(), crot = 0;
  cup.halves.forEach(h => { h.position.set(0, 0, 0); h.rotation.set(0, 0, 0); });
  if (t < fall0) {
    crot = 0.18 + 0.12 * Math.sin((t - 10.3) * 16) * (1 - seg(t, 10.3, 10.84) * 0.3) + seg(t, 10.6, fall0) * 0.25;
    cup.g.position.copy(cp); cup.g.rotation.set(0, 0, -crot);
  } else if (t < land) {
    const s = (t - fall0) / fd;
    cp.y = -s * s * drop; cp.x += 0.25 * s;
    crot = 0.43 + s * 1.15;
    cup.g.position.copy(cp); cup.g.rotation.set(0, 0, -crot);
  } else {
    const s = t - land;
    cup.g.position.set(edge.x + 0.25, FLOOR + Math.abs(Math.sin(s * 14)) * Math.exp(-s * 12) * 0.08, edge.z);
    cup.g.rotation.set(0, 0.5, 0);
    const a = eo(s / 0.3);
    cup.halves[0].rotation.set(0, 0, a * 0.55); cup.halves[0].position.set(-a * 0.05, 0, 0);
    cup.halves[1].rotation.set(0, 0, -a * 0.55); cup.halves[1].position.set(a * 0.05, 0, 0);
  }
  const look = cup.g.position.clone().add(new V3(0, 0.1, 0));
  cat.pose({
    pos: catPos.toArray(), ry, look, lookW: 1, hr: kf(t, [[10.3, 0], [11.0, -0.1], [11.7, -0.28]]),
    pupil: kf(t, [[10.3, 0.75], [10.9, 1]]), earBack: -0.12,
    pawL: kf(t, [[10.3, [0.18, 0.14, 0.36]], [10.75, [0.16, 0.14, 0.34]], [11.2, [0.1, 0.045, 0.24]]]),
    head: [0, 0.9, 0.2],
    tail: { ...SIT.tail, amp: 0.12, freq: 0.8, side: -1 },
  }, t);
  const tg = kf(t, [[10.3, [1.12, 0.3, 0.42]], [10.84, [1.12, 0.28, 0.42]], [11.9, [1.25, -0.32, 0.45]], [12.2, [1.25, -0.35, 0.45]]]);
  const fh = kf(t, [[10.3, 2.95], [10.84, 3.0], [11.9, 4.15], [12.2, 4.1]]);
  return { cam: [tg, 0.6, 0.3, fh] };
}

function crouchCat(t, extra = {}) {
  const catPos = new V3(-0.35, 0, -0.05), mugP = new V3(0.75, 0, 0.42);
  mug.position.copy(mugP);
  const ry = Math.atan2(mugP.x - catPos.x, mugP.z - catPos.z);
  return { ...mixPose({}, CROUCH, 1), pos: catPos.toArray(), ry, look: mugP.clone().add(new V3(0, 0.12, 0)), lookW: 1, ...extra };
}
function shot5(t, lt) {        // 12.2–14.7: the hunter crouch
  const w = t > 12.75 ? 0.05 * Math.sin((t - 12.75) * 19) * ss(seg(t, 12.75, 13.0)) : 0;
  cat.pose(crouchCat(t, {
    wiggle: w, pupil: 1, earBack: -0.2, earFlat: 0.12,
    tail: { h0: 0.1, e0: 0.08, lift: 0.025, curl: 0.03, amp: 0.45, freq: 1.8, side: 1, ground: true },
  }), t);
  return { cam: [[0.05, 0.08, 0.12], 0.45, 0.32, kf(lt, [[0, 2.75], [2.5, 2.5]])] };
}
function shot6(t, lt) {        // 14.7–18.0: freeze, turn to us
  const turn = ss(seg(t, 15.75, 16.5));
  const rise = ss(seg(t, 15.5, 16.4));
  const pose = crouchCat(t, {
    pupil: lerp(1, 0.7, turn), earBack: lerp(-0.2, 0, rise), earFlat: lerp(0.12, 0, rise),
    wiggle: t < 15.2 ? 0.05 * Math.sin((t - 12.75) * 19) * (1 - seg(t, 14.9, 15.2)) : 0,
    lookW: 1 - turn, lookCam: turn, hr: turn * 0.08,
    earTw: t > 15.2 && t < 15.45 ? 0.6 * Math.sin((t - 15.2) * 25) : 0,
    lidU: kf(t, [[16.9, 0], [17.02, 1], [17.15, 0]]),
    tail: { h0: 0.1, e0: lerp(0.08, 0.2, rise), lift: lerp(0.025, 0.09, rise), curl: 0.05, amp: lerp(0.3, 0.12, seg(t, 15.0, 15.4)), freq: 1.2, side: 1, ground: true },
  });
  const p = mixPose(pose, { chest: [0, 0.38, 0.13], head: [0, 0.72, 0.3], haunch: [0, 0.3, -0.24], chestRx: 0.05 }, rise * 0.8);
  cat.pose({ ...pose, ...p }, t);
  const tg = new V3(-0.05, 0.12, 0.05).add(new V3(Math.cos(0.55), 0, -Math.sin(0.55)).multiplyScalar(kf(lt, [[0, -0.1], [3.3, 0.14]])));
  return { cam: [tg.toArray(), 0.55, 0.3, 2.45] };
}

function ownerPose(t) {        // living room: sit → leap → shout → run
  const seat = at(-1.1, 0.35, FLOOR), stand = at(-0.7, 0.25, FLOOR), dest = at(-0.5, -0.3, FLOOR);
  const SITQ = { hipY: 0.72, lean: -0.12, arms: [[-0.5, 0.1, -0.9], [-0.5, 0.1, -0.9]], legs: [[-1.5, 1.45], [-1.5, 1.45]], headX: 0.25 };
  const DIP = { hipY: 0.62, lean: 0.25, arms: [[0.4, 0.25, -0.3], [0.4, 0.25, -0.3]], legs: [[-1.6, 1.5], [-1.6, 1.5]], headX: 0 };
  const UP = { hipY: 1.12, lean: -0.1, arms: [[-2.9, 0.38, -0.2], [-2.9, 0.38, -0.2]], legs: [[0.1, 0.25], [-0.2, 0.4]], headX: -0.25 };
  const STAND = { hipY: 1.02, lean: -0.05, arms: [[-2.8, 0.45, -0.35], [-2.8, 0.45, -0.35]], legs: [[0, 0], [0, 0]], headX: -0.15 };
  const blend = (a, b, u) => ({
    hipY: lerp(a.hipY, b.hipY, u), lean: lerp(a.lean, b.lean, u), headX: lerp(a.headX, b.headX, u),
    arms: a.arms.map((x, i) => x.map((v, j) => lerp(v, b.arms[i][j], u))),
    legs: a.legs.map((x, i) => x.map((v, j) => lerp(v, b.legs[i][j], u))),
  });
  let q, pos, ry = 2.356;
  const leap0 = 19.2, air = 19.46, landT = 19.95, run0 = 20.6;
  if (t < leap0) { q = blend(SITQ, SITQ, 0); q.headX += 0.05 * Math.sin(t * 2); pos = seat.clone(); }
  else if (t < air) { q = blend(SITQ, DIP, ss(seg(t, leap0, air))); pos = seat.clone(); }
  else if (t < landT) {
    const u = seg(t, air, landT);
    q = blend(DIP, UP, eo(u * 1.6));
    pos = seat.clone().lerp(stand, u); q.hipY += Math.sin(u * Math.PI) * 0.75;
  } else if (t < run0) {
    const s = t - landT;
    q = blend(UP, STAND, ss(s / 0.15));
    const shake = Math.sin(s * 30) * 0.18;
    q.arms[0][0] += shake; q.arms[1][0] -= shake; q.hipY += -Math.abs(Math.sin(s * 9)) * 0.05;
    pos = stand.clone();
  } else {
    const s = t - run0, u = clamp(s / 0.9, 0, 1);
    const ph = s * 13;
    q = { hipY: 1.0 + Math.abs(Math.sin(ph)) * 0.08, lean: 0.32, headX: -0.2,
      arms: [[Math.sin(ph) * 1.0 - 0.2, 0.15, -1.3], [-Math.sin(ph) * 1.0 - 0.2, 0.15, -1.3]],
      legs: [[-Math.sin(ph) * 0.9 - 0.1, 0.3 + Math.max(0, Math.sin(ph)) * 1.2], [Math.sin(ph) * 0.9 - 0.1, 0.3 + Math.max(0, -Math.sin(ph)) * 1.2]] };
    q = blend(STAND, q, ss(s / 0.18));
    pos = stand.clone().lerp(dest, u * (2 - u));
    ry = lerp(2.356, Math.atan2(dest.x - stand.x, dest.z - stand.z), ss(s / 0.2));
  }
  owner.pose({ ...q, pos: pos.toArray(), ry });
  return pos;
}
function shot7(t, lt) {        // 18.0–21.5: the owner leaps up and runs over
  const op = ownerPose(t);
  const catPos = at(0.6, -0.25, 0);
  const ownerHead = op.clone().add(new V3(0, 2.0, 0));
  cat.pose({
    pos: catPos.toArray(), ry: Math.PI / 4 - 0.3, look: ownerHead, lookW: 0.85, pupil: kf(t, [[18, 0.5], [19.5, 0.9]]),
    earBack: t > 19.9 && t < 20.6 ? -0.25 : 0, earTw: t > 18.6 && t < 18.85 ? 0.5 * Math.sin((t - 18.6) * 25) : 0,
    tail: { ...SIT.tail, amp: 0.12, freq: 0.8, side: -1 },
  }, t);
  const tg = at(-0.15, 0.1, -0.15).lerp(at(0.05, 0.0, -0.1), ss(seg(lt, 0, 3.5)));
  return { cam: [tg.toArray(), Math.PI / 4, 0.5, kf(lt, [[0, 5.7], [3.5, 5.3]])] };
}

function shot8(t, lt) {        // 21.5–22.8: smug
  const u = ss(seg(t, 21.8, 22.65));
  cat.pose({
    pos: [0.1, 0, 0.1], ry: Math.PI / 4, lookCam: 1, pupil: lerp(0.6, 0.42, u),
    lidU: lerp(0, 0.5, u), lidL: lerp(0, 0.2, u), tilt: lerp(0, 0.28, u), hr: lerp(0, 0.14, u), hp: 0,
    smirk: lerp(0, 0.5, u), earTw: t > 22.25 && t < 22.5 ? 0.4 * Math.sin((t - 22.25) * 25) : 0,
    tail: { ...SIT.tail, amp: 0.16, freq: 0.7, side: -1 },
  }, t);
  return { cam: [[0.12, 0.3, 0.18], Math.PI / 4, 0.2, kf(lt, [[0, 2.35], [1.3, 2.2]])] };
}

function shot9(t, lt) {        // 22.8–end: the row of glasses, paw raised
  const catPos = new V3(-0.659, 0, 0.403), ry = 0.45;
  const xs = [-0.35, 0.05, 0.45, 0.85];
  row.forEach((g, i) => { g.position.set(xs[i], 0, 0.72); g.rotation.set(0, 0, 0); });
  const bob = 0.035 * Math.sin(lt * 5);
  const lift = ss(seg(lt, 0.1, 0.7));
  const pawT = [lerp(0.1, 0.14, lift), lerp(0.045, 0.52 + bob, lift), lerp(0.24, 0.42, lift)];
  cat.pose({
    pos: catPos.toArray(), ry, lookCam: 1, pupil: 0.5, lidU: 0.32, lidL: 0.1, tilt: 0.2, smirk: 0.35, hr: 0.1,
    pawL: pawT, pawRotL: [-0.9, 0, 0.2], chest: [0, 0.48, 0.05],
    earTw: lt > 1.6 && lt < 1.85 ? 0.4 * Math.sin((lt - 1.6) * 25) : 0,
    tail: { ...SIT.tail, amp: 0.2, freq: 0.8, side: -1 },
  }, t);
  const tg = new V3(-0.2, 0.25, 0.5).add(new V3(Math.cos(0.35), 0, -Math.sin(0.35)).multiplyScalar(kf(lt, [[0, 0.06], [3.0, -0.14]])));
  return { cam: [tg.toArray(), 0.35, 0.36, 2.8] };
}

// ---------------------------------------------------------------- overlay text
const ov = document.getElementById('ov'); ov.width = W; ov.height = H;
const ctx = ov.getContext('2d');
let CUES = [];
const HOOK = ['Your cat is doing', 'it on purpose.'];
const HOOK_END = 2.9;
const FONT = (px) => `700 ${px}px Quicksand, sans-serif`;
function hookLayout() {
  let px = 104; ctx.font = FONT(px);
  const wmax = Math.max(...HOOK.map(s => ctx.measureText(s).width));
  if (wmax > W * 0.9) px = Math.floor(px * W * 0.9 / wmax);
  return { px, y0: H * 0.045, lh: px * 1.12 };
}
function capLayout(text) {
  let px = 78; ctx.font = FONT(px);
  let w = ctx.measureText(text).width;
  if (w > W * 0.84) { px = Math.floor(px * W * 0.84 / w); ctx.font = FONT(px); w = ctx.measureText(text).width; }
  const padX = 38, padY = 22, bh = px * 1.08 + padY * 2;
  return { px, w, x0: (W - w) / 2 - padX, y0: H * 0.65 - bh / 2, bw: w + padX * 2, bh };
}
function drawOverlay(t) {
  ctx.clearRect(0, 0, W, H);
  if (t < HOOK_END) {
    const a = 1;
    const L = hookLayout();
    ctx.save(); ctx.globalAlpha = a; ctx.font = FONT(L.px); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    HOOK.forEach((s, i) => {
      const y = L.y0 + i * L.lh;
      ctx.shadowColor = 'rgba(40,20,10,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.lineWidth = 16; ctx.strokeStyle = '#2a170c'; ctx.strokeText(s, W / 2, y);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = i === 1 ? '#ffd23f' : '#ffffff'; ctx.fillText(s, W / 2, y);
    });
    ctx.restore();
  }
  const c = CUES.find(q => t >= q.t0 && t < q.t1);
  if (c) {
    const L = capLayout(c.text);
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath(); ctx.roundRect(L.x0, L.y0, L.bw, L.bh, 30); ctx.fill();
    ctx.font = FONT(L.px); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(c.text, W / 2, H * 0.65 + L.px * 0.04);
  }
}
window.TEXTS = (t) => {
  if (t >= HOOK_END) return [];
  const L = hookLayout();
  return [{ id: 'hook', text: HOOK.join(' '), x0: 40, y0: L.y0, x1: W - 40, y1: L.y0 + L.lh * 2 }];
};

// ---------------------------------------------------------------- render
const SETS = { kitchen, grass, living };
const KITCHEN_PROPS = [glass1, pen, cup.g, mug, ...row];
window.DUR = DUR;
window.EV = [
  { t: 7.76, type: 'tap' }, { t: 8.66, type: 'tap' }, { t: 9.36, type: 'dart' },
  { t: 10.86, type: 'fall' }, { t: 11.88, type: 'smash' }, { t: 19.46, type: 'leap' }, { t: 20.6, type: 'run' },
  ...SHOTS.map(s => ({ t: s.t0, type: 'cut' })),
];
window.render = (t) => {
  t = clamp(t, 0, DUR - 1e-4);
  const shot = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  Object.entries(SETS).forEach(([k, g]) => { g.visible = k === shot.set; });
  KITCHEN_PROPS.forEach(o => { o.visible = false; });
  const vis = { 0: [glass1], 1: [pen], 3: [cup.g], 4: [mug], 5: [mug], 8: row }[SHOTS.indexOf(shot)] || [];
  vis.forEach(o => { o.visible = true; });
  // camera first (the cat's look-at-viewer needs it)
  let r = shot.f(t, t - shot.t0);
  setCam(...r.cam);
  r = shot.f(t, t - shot.t0);          // second pass with the camera of this frame
  const tg = new V3(...r.cam[0]);
  key.position.copy(tg).add(new V3(-3.5, 7.5, 5.0)); key.target.position.copy(tg);
  fill.position.copy(tg).add(new V3(5, 3, -2)); fill.target.position.copy(tg);
  const ext = shot.set === 'living' ? 6 : 4;
  Object.assign(key.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 0.5, far: 30 });
  key.shadow.camera.updateProjectionMatrix();
  renderer.render(scene, cam);
  drawOverlay(t);
};

(async () => {
  CUES = await (await fetch('cues.json')).json();
  await document.fonts.load(FONT(80));
  await document.fonts.ready;
  window.render(0);
  window.READY = true;
})();
