"""Score + foley + voice → out/mix.wav. Reads events.json (from the page) and timeline.json.
Run with the library's Python: "$LIB/.venv/bin/python" mix.py   (LIB must be set)."""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or sys.exit('set LIB to the library folder')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, whoosh, creak, thump, ding, pop, click, rumble, compress, limit, add

H = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('OUT', os.path.join(H, 'out'))
TL = json.load(open(os.path.join(H, 'timeline.json')))
EVJ = json.load(open(os.path.join(H, 'events.json')))
DUR = TL['DUR']; N = int(DUR * SR)
EV = EVJ['ev']; T = {e['type']: e['t'] for e in EV}
def evs(kind): return [e for e in EV if e['type'] == kind]
seal_slam = evs('slam')[0]['t']; cut = evs('powerdown')[0]['t']; red = evs('hit')[0]['t']
lines = {l['id']: l for l in TL['lines']}
k_ticks = [e['t'] for e in evs('ticks')]
follow = lines['l14']['t']; pick = lines['l13']['t']; back2 = [e['t'] for e in evs('whoosh') if e.get('rev')][-1]

mus = np.zeros((N, 2)); fx = np.zeros((N, 2)); vo = np.zeros((N, 2))
mf = lambda m: 440 * 2 ** ((m - 69) / 12)
BEAT = .6

def fade(x, a=.05, b=.3):
    na, nb = int(a * SR), int(b * SR); x = x.copy()
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x
def saw(f, d, det=.004):
    tt = t_(d); return sum(2 * ((tt * f * (1 + k * det)) % 1) - 1 for k in (-1, 0, 1)) / 3
def pad(notes, d, cutoff=1100, v=.2):
    x = sum(saw(mf(n), d) for n in notes) / len(notes)
    return fade(lp(x, cutoff, 2), .8, .8) * v
def pluck(m, v=1.):
    d = .32; tt = t_(d); f = mf(m)
    x = (np.sin(2 * np.pi * f * tt) + .5 * np.sin(4 * np.pi * f * tt) + .25 * np.sin(6 * np.pi * f * tt)) * env_exp(d, .07)
    return lp(x, 2000) * v
def metal(v=1., f0=180):
    d = 1.4; tt = t_(d)
    return norm(sum(a * np.sin(2 * np.pi * f0 * r * tt) * env_exp(d, tau) for r, a, tau in [(1, 1, .5), (2.76, .6, .3), (5.4, .4, .18), (8.9, .25, .1)])) * v

# ---------- music ----------
# drone (D2 with harmonics, so it speaks on phones) under everything but the silence
for a, b in [(0, cut), (red, DUR)]:
    d = b - a; tt = t_(d); f = mf(38) if a == 0 else mf(37)
    x = (np.sin(2 * np.pi * f * tt) + .45 * np.sin(4 * np.pi * f * tt) + .2 * np.sin(6 * np.pi * f * tt)) * (1 + .15 * np.sin(2 * np.pi * .2 * tt))
    add(mus, fade(x, 1.2 if a == 0 else .02, .05) * .16, a)
# pad: Dm / Bb until the cut; dissonant red pad; Dm / Bb again with the filter opening
bar = 4 * BEAT
for k, t0 in enumerate(np.arange(3.0, cut, bar * 2)):
    d = min(bar * 2 + .8, cut - t0 + .05); add(mus, pad([62, 65, 69] if k % 2 == 0 else [58, 62, 65], d, 900 + k * 120), t0, pan=-.15)
add(mus, pad([62, 63, 69, 50], back2 - red + .6, 1400, .24), red)
for k, t0 in enumerate(np.arange(back2, DUR - .2, bar * 2)):
    d = min(bar * 2 + .8, DUR - t0); add(mus, pad([62, 65, 69] if k % 2 == 0 else [58, 62, 65], d, 1000 + k * 300, .18), t0, pan=.15)
# pulse: one per beat from the counter's entrance, doubling at each milestone, stopping at the slam
start = lines['l03']['t']
t0 = start
while t0 < seal_slam - .05:
    rate = 1 if t0 < k_ticks[0] else 2 if t0 < k_ticks[1] else 4 if t0 < k_ticks[2] else 4
    add(mus, pluck(50, .5 if rate < 4 else .38), t0, pan=(.2 if int(t0 / BEAT) % 2 else -.2)); t0 += BEAT / rate
# pulse returns half-time after the twist, doubles at "Follow me"
t0 = back2 + .2
while t0 < DUR - .1:
    rate = .5 if t0 < follow else 2
    add(mus, pluck(50, .45), t0); t0 += BEAT / rate
# kick on downbeats during the milestones
t0 = k_ticks[0]
while t0 < seal_slam: add(mus, thump(.6, 55), t0); t0 += BEAT * 2

# ---------- foley ----------
def bed(d, lo, hi, v): return fade(bp(noise(d), lo, hi), .6, .6) * v
add(fx, fade(lp(brown(cut), 160), 1.5, .08) * .25, 0)                   # earth rumble bed
add(fx, fade(lp(brown(DUR - red), 160), .05, .05) * .22, red)
add(fx, bed(cut, 1500, 6000, .012), 0, pan=.4)                          # faint wind above
for e in EV:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'whoosh': w = whoosh(e.get('d', .6), .5 * v); add(fx, w[::-1] if e.get('rev') else w, t)
    elif ty == 'sweep': d = e['d']; tt = t_(d); add(fx, fade(np.sin(2 * np.pi * (300 + 500 * tt / d) * tt) * .05 + bp(noise(d), 2000, 5000) * .02, .3, .4), t)
    elif ty == 'ping': add(fx, ding(.22 * v) * env_exp(1.6, .4), t, pan=-.3)
    elif ty == 'lowping': tt = t_(1.4); add(fx, np.sin(2 * np.pi * 220 * tt) * env_exp(1.4, .5) * .3 + np.sin(2 * np.pi * 233 * tt) * env_exp(1.4, .5) * .2, t)
    elif ty == 'pop': add(fx, pop(.3), t)
    elif ty == 'dive':
        d = e.get('d', 1); tt = t_(d); add(fx, whoosh(d, .55 * v), t); add(fx, np.sin(2 * np.pi * np.cumsum(500 - 380 * tt / d) / SR) * np.sin(np.pi * tt / d) * .12 * v, t)
    elif ty == 'chime': add(fx, ding(.35 * v), t); add(fx, ding(.2 * v)[::1] * .6, t + .09, pan=.3)
    elif ty == 'ticks':
        for k in range(int(e['d'] / .035)): add(fx, click(1.4 + k * .01, .12), t + k * .035, pan=.1)
    elif ty == 'clunk': add(fx, thump(.5, 90), t); add(fx, click(.6, .3), t)
    elif ty == 'hum': d = 1.6; tt = t_(d); add(fx, fade(lp(np.sign(np.sin(2 * np.pi * 120 * tt)), 600) * env_exp(d, .6), .02, .3) * .05, t)
    elif ty == 'air': add(fx, bed(e['d'], 3000, 9000, .05), t, pan=.2)
    elif ty == 'roll': d = e['d']; add(fx, rumble(d, .35 * v) + fade(bp(noise(d), 200, 900), .2, .2) * .06 * v, t)
    elif ty == 'slam': add(fx, thump(1.0, 48), t); add(fx, metal(.35, 140), t); add(fx, lp(noise(.5), 800) * env_exp(.5, .08) * .5, t)
    elif ty == 'rumble': d = e['d']; add(fx, rumble(d, .5), t); add(fx, fade(lp(noise(d), 300), .8, .1) * .15, t)
    elif ty == 'powerdown': d = .8; tt = t_(d); add(fx, np.sin(2 * np.pi * np.cumsum(400 * (1 - tt / d) ** 2 + 30) / SR) * env_exp(d, .35) * .2, t)
    elif ty == 'hit': d = 2.2; tt = t_(d); add(fx, norm(np.sin(2 * np.pi * 42 * tt * (1 - .2 * tt)) * env_exp(d, .6) + lp(noise(d), 500) * env_exp(d, .15) * .6) * .9, t)
    elif ty == 'redhum':
        d = e['d']; tt = t_(d); add(fx, fade(bp(saw(110, d), 150, 900) * .05, .3, .5), t)
        for k in range(int(d / 1.3)): add(fx, ding(.05) * env_exp(1.6, .05), t + .7 + k * 1.3 + (k % 3) * .2, pan=.5 - (k % 2))
    elif ty == 'creak': add(fx, creak(.35), t); add(fx, creak(.25), t + .3)
    elif ty == 'latch': add(fx, thump(.9, 70), t); add(fx, click(.5, .6), t); add(fx, metal(.3, 260), t)
    elif ty == 'weld':
        d = 1.1; n = hp(noise(d), 2500); crack = (np.random.default_rng(3).random(len(n)) > .985) * 1.0
        add(fx, fade(n * .05 + lp(crack, 6000) * hp(noise(d), 1500) * .5, .05, .3), t, pan=.15)
    elif ty == 'knock': d = .25; tt = t_(d); add(fx, norm(np.sin(2 * np.pi * 85 * tt) * env_exp(d, .05) + lp(noise(d), 1500) * env_exp(d, .012) * .8) * .9 * v, t, pan=.25)
    elif ty == 'riser':
        d = e['d']; tt = t_(d); add(fx, fade(hp(noise(d), 800) * (tt / d) ** 2 * .12 + np.sin(2 * np.pi * np.cumsum(200 + 600 * (tt / d) ** 2) / SR) * (tt / d) ** 2 * .06, .2, .02), t)

# ---------- voice ----------
vmask = np.zeros(N)
for lid, l in lines.items():
    x, sr = sf.read(os.path.join(H, 'voice', f'{lid}.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR)
    x = hp(x, 90); x = compress(norm(x, .9), .3, 3.0)
    add(vo, x, l['t'], 1.0)
    s = int(l['t'] * SR); vmask[s:s + len(x)] = 1
# duck music under voice
from scipy.ndimage import uniform_filter1d
duck = 1 - .45 * np.clip(uniform_filter1d(vmask, int(.25 * SR)) * 1.5, 0, 1)
mus *= duck[:, None]
# the silence: everything but the power-down out between the cut and the hit
sil = np.ones(N); a, b = int((cut + .25) * SR), int(red * SR); sil[a:b] = 0; sil[int(cut * SR):a] = np.linspace(1, 0, a - int(cut * SR))
mus *= sil[:, None]
# balance: voice ≈ 10 dB over music by RMS
rms = lambda x: np.sqrt(np.mean(x[np.abs(x).sum(1) > 1e-4] ** 2)) if np.any(np.abs(x) > 1e-4) else 1
mus *= (rms(vo) / rms(mus)) * 10 ** (-10 / 20)
fx *= (rms(vo) / rms(fx)) * 10 ** (-8 / 20)
mix = vo + mus + fx
# hard stop on the loop point
mix[-int(.02 * SR):] *= np.linspace(1, 0, int(.02 * SR))[:, None]
mix = np.stack([limit(mix[:, 0], .95), limit(mix[:, 1], .95)], 1)
os.makedirs(OUT, exist_ok=True)
sf.write(os.path.join(OUT, 'mix.wav'), mix.astype(np.float32), SR)
print('mix.wav', round(len(mix) / SR, 2), 's')
