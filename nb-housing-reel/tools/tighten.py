"""Cap the pauses inside each narration line (Kokoro breathes long at commas and before numbers).
Run after tts.py: python tools/tighten.py lines.json voices/   -> rewrites voices/*.wav and voices/dur.json"""
import sys, os, json, numpy as np, soundfile as sf
lines, D = json.load(open(sys.argv[1])), sys.argv[2]
MID, SENT, THR = 0.18, 0.32, 0.01          # max pause mid-sentence / after . ! ? ; silence threshold (RMS)
dur = {}
for l in lines:
    p = os.path.join(D, l['id'] + '.wav'); y, sr = sf.read(p); mono = y if y.ndim == 1 else y.mean(1)
    h = int(.01 * sr); n = len(mono) // h
    q = np.array([np.sqrt(np.mean(mono[k * h:(k + 1) * h] ** 2)) < THR for k in range(n)])
    gaps, s = [], None
    for k, v in enumerate(q):
        if v and s is None: s = k
        if not v and s is not None:
            if s > 0: gaps.append((s, k))
            s = None
    nsent = sum(l['text'].count(c) for c in '.!?') - 1     # sentence breaks inside the line
    longest = sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[:max(0, nsent)]
    out, pos, f = [], 0, int(.01 * sr)
    for a, b in gaps:
        cap = SENT if (a, b) in longest else MID
        keep = int(cap * 100)
        if b - a <= keep: continue
        cut0, cut1 = (a + keep // 2) * h, (b - (keep - keep // 2)) * h
        seg = y[pos:cut0].copy(); seg[-f:] *= np.linspace(1, 0, f)[:, None] if y.ndim > 1 else np.linspace(1, 0, f)
        out.append(seg); pos = cut1
    tail = y[pos:].copy()
    if out: tail[:f] *= np.linspace(0, 1, f)[:, None] if y.ndim > 1 else np.linspace(0, 1, f)
    y2 = np.concatenate(out + [tail]); sf.write(p, y2, sr); dur[l['id']] = round(len(y2) / sr, 3)
    print(l['id'], round(len(y) / sr, 2), '->', dur[l['id']])
json.dump(dur, open(os.path.join(D, 'dur.json'), 'w'), indent=1)
