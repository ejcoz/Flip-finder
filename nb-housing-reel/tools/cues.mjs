// prints the caption cues as JSON for core/render/srt.py (the same cues the page burns in)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tl = JSON.parse(fs.readFileSync(path.join(D, 'timeline.json'))), lines = JSON.parse(fs.readFileSync(path.join(D, 'lines.json')));
const sub = Object.fromEntries(lines.map(l => [l.id, l.sub]));
const out = tl.V.map((v, i) => { const nx = tl.V[i + 1]; return { t0: v.t, t1: Math.min(Math.max(v.t + v.dur + 0.6, v.t + 1.8), nx ? nx.t - 0.06 : tl.dur), text: sub[v.id] }; });
console.log(JSON.stringify(out, null, 1));
