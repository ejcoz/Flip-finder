// caption cues for core/render/srt.py: the same split the page burns in
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tl = JSON.parse(fs.readFileSync(path.join(D, 'timeline.json'))), L = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(D, 'lines.json'))).map(l => [l.id, l.sub]));
const out = []; tl.V.forEach((v, i) => { const nx = tl.V[i + 1], t1 = Math.min(Math.max(v.t + v.dur + 0.6, v.t + 1.8), nx ? nx.t - 0.06 : tl.dur), text = L[v.id];
  if (v.id === 's5') { const c = text.indexOf(' just'); out.push({ t0: v.t, t1: tl.s5split, text: text.slice(0, c) }, { t0: tl.s5split, t1, text: text.slice(c + 1) }); } else out.push({ t0: v.t, t1, text }); });
console.log(JSON.stringify(out, null, 1));
