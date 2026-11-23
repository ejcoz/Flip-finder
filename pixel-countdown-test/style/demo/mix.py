"""Sound for "Paper to the Moon": reads events.json (from main.js EV), writes mix.wav (48 kHz stereo).
Usage: python mix.py <events.json> <out.wav>   (LIB in the environment for core/audio/sfx.py)
The music is score.py (sonified folds + swells); this file adds the paper foley, caption blips and the true silence."""
import json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core', 'audio'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfx import SR, t_, env_exp, lp, hp, bp, noise, whoosh, add, limit
import score

ev_path, out = sys.argv[1], sys.argv[2]
E = json.load(open(ev_path)); DUR = E['dur']; EV = E['ev']
buf = np.zeros((int(DUR * SR) + SR, 2))
def ns(d): return int(round(d * SR))
def crease(v=1.0):   # a paper fold: a short dry swish + a tiny snap
    d = .09; x = bp(noise(d), 1500, 7000) * env_exp(d, .022); x[:ns(.004)] += hp(noise(.004), 3000) * .8
    return x * v
def blip():
    d = .05; tt = t_(d); return np.sign(np.sin(2 * np.pi * 1320 * tt)) * env_exp(d, .015) * .5

silences = []
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'score':
        M = score.build(e, DUR); buf[:len(M)] += M * .8
    elif ty == 'fold': add(buf, crease(), t, .16 + .1 * min(1, e['n'] / 30), (e['n'] % 2 - .5) * .3)
    elif ty == 'crease': add(buf, crease(1.2), t, .3)
    elif ty == 'blip': add(buf, blip(), t, .06)
    elif ty == 'whoosh': add(buf, np.round(whoosh(.35) * 16) / 16, t, .14)
    elif ty == 'silence': silences.append((t, t + e['dur']))

for a, b2 in silences: buf[int(a * SR) + ns(.02):int(b2 * SR)] = 0
buf = buf[:int(DUR * SR)]
buf[-ns(.3):] *= np.linspace(1, 0, ns(.3))[:, None]
buf = buf / max(1e-9, np.abs(buf).max())
buf = np.stack([limit(buf[:, 0], .62), limit(buf[:, 1], .62)], 1) * 1.45
for a, b2 in silences: buf[int(a * SR) + ns(.02):int(b2 * SR)] = 0
sf.write(out, buf.astype(np.float32), SR)
print('mix', out, f'{DUR:.2f}s')
