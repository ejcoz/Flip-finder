"""Sound for "23 People": reads events.json (from main.js EV), writes mix.wav (48 kHz stereo).
Usage: python mix.py <events.json> <out.wav>   (LIB in the environment for core/audio/sfx.py)
The music is score.py (sonified guests and handshakes + swells); this file adds party foley, caption blips, the true silence."""
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
def pop(v=1.0):        # a guest pops in: a soft pitched "bup"
    d = .07; tt = t_(d); f = 420 * (1 + 1.5 * np.exp(-tt / .008)); return np.sin(2 * np.pi * np.cumsum(f / SR)) * env_exp(d, .02) * v
def confetti(v=1.0):   # a popper: a snap + a fizzing spray
    d = .9; tt = t_(d); x = hp(noise(d), 4000) * (np.random.default_rng(4).random(len(tt)) > .9) * np.exp(-tt / .3)
    x[:ns(.01)] += hp(noise(.01), 1500) * 1.5; return np.round(x * 8) / 8 * v
def blip():
    d = .05; tt = t_(d); return np.sign(np.sin(2 * np.pi * 1320 * tt)) * env_exp(d, .015) * .5

silences = []
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'score':
        M = score.build(e, DUR); buf[:len(M)] += M * .8
    elif ty == 'pop': add(buf, pop(), t, .22, (e['n'] % 2 - .5) * .3)
    elif ty == 'confetti': add(buf, confetti(), t, .2)
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
