"""Mix: score + narration + engraving foley + workroom tone -> out/mix.wav
Run: LIB=<library> "$LIB/.venv/bin/python" mix.py   (needs events.json, voices/, music/score.wav)"""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, norm, brown, clack, whoosh, add, compress, limit
D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(f'{D}/events.json')); DUR = E['dur']; N = int(round(DUR * SR)); EV = E['ev']
SIL = json.load(open(f'{D}/music/silences.json'))['silence']
rng = np.random.default_rng(1846)
def nz(d): return rng.standard_normal(len(t_(d)))
def sine(f, d): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, len(t_(d))).astype(float)) / SR)
def burin(d, chatter=0.3):          # steel through copper: a high band-passed hiss with chatter and a faint plate ring
    tt = t_(d); x = bp(nz(d), 3500, 9000) * (1 - chatter + chatter * (rng.random(len(tt)) > .55))
    x = x * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 3.1 * tt))) + .05 * sine(2730, d)
    e = np.minimum(1, tt / .05) * np.minimum(1, (d - tt) / .08); return norm(x) * e
def hatch(d):                       # many short strokes: micro-scratches
    x = np.zeros(len(t_(d)))
    for k in range(int(d * 22)):
        s = bp(nz(.05), 4000, 10000) * env_exp(.05, .012); o = int(rng.uniform(0, d - .05) * SR); x[o:o + len(s)] += s * rng.uniform(.4, 1)
    return norm(x)
def scribe(d):                      # a ring scribed: a steady curved hiss rising slightly
    tt = t_(d); return norm(bp(nz(d), 3000, 8000) * (0.5 + 0.5 * tt / d)) * np.sin(np.pi * tt / d) ** .5
def ticks(d):                       # letters cut one by one
    x = np.zeros(len(t_(d)))
    for k in range(int(d * 14)):
        c = norm(clack(1.8 + rng.uniform(-.2, .2), 1)[:int(.03 * SR)]); o = int(k / 14 * SR); x[o:o + len(c)] += c[:len(x) - o]
    return norm(x)
def brush(d): tt = t_(d); return norm(lp(bp(nz(d), 600, 4000), 3000)) * np.sin(np.pi * tt / d) ** 1.5
def plip(): d = .25; tt = t_(d); return norm(sine(1400 * (1 + .6 * np.exp(-tt / .02)), d) * env_exp(d, .05))
def sheet(d): tt = t_(d); return norm(bp(nz(d), 1200, 7000)) * np.sin(np.pi * tt / d) ** 2
def land(): d = .2; return norm(lp(nz(d), 1500) * env_exp(d, .02) + sine(120, d) * env_exp(d, .04) * .5)
def dots(d):                        # the dotted road: a little burin flick for each dash
    x = np.zeros(len(t_(d))); n = int(d * 6.5)
    for k in range(n):
        s = burin(.07, .5) * .8; o = int(k / 6.5 * SR); x[o:o + len(s)] += s[:len(x) - o]
    return norm(x)
fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); amb = np.zeros((N, 2))
for e in EV:
    t, ty, g = e['t'], e['type'], e.get('gain', 1.0)
    d = e.get('dur', .5)
    if ty == 'vo': continue
    if ty == 'burin': add(fx, burin(d), max(0, t), .16 * g, -.2)
    elif ty == 'hatch': add(fx, hatch(d), t, .1, .25)
    elif ty == 'scribe': add(fx, scribe(d), t, .16, .1)
    elif ty == 'ticks': add(fx, ticks(d), t, .08, -.1)
    elif ty == 'rule': add(fx, burin(d, .12), t, .2, 0)
    elif ty == 'brush': add(fx, brush(d), t, .22, .2)
    elif ty == 'plip': add(fx, plip(), t + .15, .12, .3)
    elif ty == 'sheet': add(fx, sheet(d), t, .2, .3)
    elif ty == 'land': add(fx, land(), t, .3, .1)
    elif ty == 'dots': add(fx, dots(d), t, .12, .15)
venv = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    y, sr = sf.read(f"{D}/voices/{e['id']}.wav"); y = y.mean(1) if y.ndim > 1 else y
    y = compress(norm(soxr.resample(y, sr, SR), .9), thr=.3, ratio=3.0); add(vo, y, e['t'], .85)
    s = int(e['t'] * SR); venv[s:s + len(y)] = 1
room = lp(brown(DUR), 700) * .016; amb += np.stack([room, np.roll(room, 401)], 1)
for k in range(int(DUR / 1.0)): add(amb, clack(1.0, 1)[:int(.06 * SR)], k * 1.0, .018, -.6)   # a faint workroom clock
mus, msr = sf.read(f'{D}/music/score.wav'); mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
k = int(.15 * SR); sm = np.convolve(venv, np.ones(k) / k, 'same'); mus = mus * (1 - sm * (1 - 10 ** (-9 / 20)))[:, None]
a, b = int(SIL[0] * SR), int(SIL[1] * SR); amb[a:b] *= 0; fx[a:b] *= 0.3    # the silence before "tip": room tone off too
mix = limit(mus * .75 + fx + vo + amb, .95)
os.makedirs(f'{D}/out', exist_ok=True); sf.write(f'{D}/out/mix.wav', mix.astype(np.float32), SR)
print('mix', mix.shape, 'peak', float(np.abs(mix).max()))
