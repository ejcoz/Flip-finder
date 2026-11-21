"""Score + foley + voice → out/mix.wav. Reads events.json (from the page) and timeline.json.
Run with the library's Python: "$LIB/.venv/bin/python" mix.py   (LIB must be set)."""
import json, os, sys
import numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB') or sys.exit('set LIB to the library folder')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, whoosh, thump, ding, pop, click, compress, limit, add

H = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('OUT', os.path.join(H, 'out'))
TL = json.load(open(os.path.join(H, 'timeline.json')))
EVJ = json.load(open(os.path.join(H, 'events.json')))
DUR = TL['DUR']; N = int(DUR * SR)
EV = EVJ['ev']
def evs(kind): return [e for e in EV if e['type'] == kind]
lines = {l['id']: l for l in TL['lines']}
hush = evs('powerdown')[0]['t']; red = evs('hit')[0]['t']; back2 = [e['t'] for e in evs('whoosh') if e.get('rev')][-1]
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
    return fade(lp(sum(saw(mf(n), d) for n in notes) / len(notes), cutoff, 2), .8, .8) * v
def pluck(m, v=1.):
    d = .32; tt = t_(d); f = mf(m)
    return lp((np.sin(2*np.pi*f*tt) + .5*np.sin(4*np.pi*f*tt) + .25*np.sin(6*np.pi*f*tt)) * env_exp(d, .07), 2000) * v
def metal(v=1., f0=180):
    d = 1.4; tt = t_(d)
    return norm(sum(a * np.sin(2*np.pi*f0*r*tt) * env_exp(d, tau) for r, a, tau in [(1,1,.5),(2.76,.6,.3),(5.4,.4,.18),(8.9,.25,.1)])) * v
def knock(v=1, deep=0):
    d = .25; tt = t_(d); f = 85 if deep else 140
    return norm(np.sin(2*np.pi*f*tt) * env_exp(d, .05) + lp(noise(d), 1500 if deep else 3000) * env_exp(d, .012) * .8) * v

# ---------- music ----------
for a0, b0, m in [(0, hush, 38), (red, back2, 37), (back2, DUR, 38)]:
    d = b0 - a0; tt = t_(d); f = mf(m)
    x = (np.sin(2*np.pi*f*tt) + .45*np.sin(4*np.pi*f*tt) + .2*np.sin(6*np.pi*f*tt)) * (1 + .15*np.sin(2*np.pi*.2*tt))
    add(mus, fade(x, .4 if a0 == 0 else .02, .1) * .16, a0)
bar = 4 * BEAT
for k, t0 in enumerate(np.arange(2.6, hush, bar * 2)):
    add(mus, pad([62, 65, 69] if k % 2 == 0 else [58, 62, 65], min(bar * 2 + .8, hush - t0 + .05), 900 + k * 150), t0, pan=-.15)
add(mus, pad([62, 63, 69, 50], back2 - red + .6, 1400, .24), red)
for k, t0 in enumerate(np.arange(back2, DUR - .2, bar * 2)):
    add(mus, pad([62, 65, 69] if k % 2 == 0 else [58, 62, 65], min(bar * 2 + .8, DUR - t0), 1100 + k * 300, .18), t0)
t0 = lines['l03']['t']
while t0 < hush - .1: add(mus, pluck(50, .45), t0, pan=(.2 if int(t0 / BEAT) % 2 else -.2)); t0 += BEAT / (1 if t0 < lines['l04']['t'] else 2)
t0 = back2 + .3
while t0 < DUR - .2: add(mus, pluck(50, .42), t0); t0 += BEAT / 2

# ---------- foley ----------
add(fx, fade(lp(brown(hush), 160), .8, .1) * .25, 0)
add(fx, fade(lp(brown(DUR - red), 160), .05, .3) * .22, red)
for e in EV:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'whoosh': w = whoosh(e.get('d', .6), .5 * v); add(fx, w[::-1] if e.get('rev') else w, t)
    elif ty == 'slam': add(fx, thump(v, 48), t); add(fx, metal(.3 * v, 120), t); add(fx, lp(noise(.4), 900) * env_exp(.4, .06) * .5 * v, t)
    elif ty == 'pop': add(fx, pop(.3), t)
    elif ty == 'ticks':
        for k in range(int(e['d'] / .035)): add(fx, click(1.4 + k * .01, .12), t + k * .035, pan=.1)
    elif ty == 'chime': add(fx, ding(.35), t); add(fx, ding(.2) * .6, t + .09, pan=.3)
    elif ty == 'powerdown': d = .8; tt = t_(d); add(fx, np.sin(2*np.pi*np.cumsum(400*(1 - tt/d)**2 + 30) / SR) * env_exp(d, .35) * .2, t)
    elif ty == 'hit': d = 2.2; tt = t_(d); add(fx, norm(np.sin(2*np.pi*42*tt*(1 - .2*tt)) * env_exp(d, .6) + lp(noise(d), 500) * env_exp(d, .15) * .6) * .9, t)
    elif ty == 'lowhit': d = 1.6; tt = t_(d); add(fx, norm(np.sin(2*np.pi*48*tt) * env_exp(d, .4) + lp(noise(d), 400) * env_exp(d, .08) * .5) * .7, t)
    elif ty == 'dive': d = e.get('d', 1); tt = t_(d); add(fx, whoosh(d, .55), t); add(fx, np.sin(2*np.pi*np.cumsum(500 - 380*tt/d) / SR) * np.sin(np.pi*tt/d) * .12, t)
    elif ty == 'redhum':
        d = e['d']; add(fx, fade(bp(saw(110, d), 150, 900) * .05, .3, .5), t)
        for k in range(int(d / 1.3)): add(fx, ding(.05) * env_exp(1.6, .05), t + .7 + k * 1.3 + (k % 3) * .2, pan=.5 - (k % 2))
    elif ty == 'knock': add(fx, knock(v, e.get('deep', 0)), t, pan=.3 if e.get('deep') else -.1)

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
sil = np.ones(N); a, b = int((hush + .25) * SR), int(red * SR); sil[a:b] = 0; sil[int(hush * SR):a] = np.linspace(1, 0, a - int(hush * SR))
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
