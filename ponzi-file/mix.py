"""Synth pop-print score + foley + voice → out/mix.wav. Run with the library venv; LIB = library root."""
import os, sys, json
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio import sfx
from core.audio.sfx import SR, add, lp, hp, bp, noise, norm, t_, env_exp, compress, limit

rng = np.random.default_rng(5)
import re
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
SRC = open(os.path.join(HERE, 'timeline.js')).read()
VO = json.loads(re.search(r'export const VOICE = (\{.*?\});', SRC).group(1))
T = json.loads(re.search(r'export const T = (\{.*?\});', SRC, re.S).group(1))
GAPS = json.loads(re.search(r'export const GAPS = (\[.*?\]);', SRC).group(1))
VDUR = json.load(open(os.path.join(HERE, 'voice', 'dur.json')))
N = int(DUR * SR) + int(.2 * SR)
BEAT = .6; EI = BEAT / 2; SX = BEAT / 4
SNAP, FAKE, CLOSED = T['snap'], T['fake'], T['closed']
def hz(m): return 440 * 2 ** ((m - 69) / 12)
vend = lambda k: VO[k] + VDUR[k]

# ───────── instruments ─────────
def kick(v=1):
    d = .3; tt = t_(d); f = 45 + 80 * np.exp(-tt / .03); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * env_exp(d, .09) + hp(noise(d), 3000) * env_exp(d, .003) * .3) * v
def snare(v=1):
    d = .22; tt = t_(d); return (bp(noise(d), 1200, 6000) * env_exp(d, .06) + np.sin(2 * np.pi * 190 * tt) * env_exp(d, .04) * .6) * v
def clap(v=1):
    d = .2; x = np.zeros(int(d * SR))
    for k, o in enumerate([0, .011, .022]): s = int(o * SR); b = bp(noise(.15), 900, 3500) * env_exp(.15, .012 if k < 2 else .05); x[s:s + len(b)] += b[:len(x) - s]
    return x * v
def hat(v=1, d=.05): return hp(noise(d), 7000) * env_exp(d, .012) * v
def bass(m, d, v=1):
    tt = t_(d); f = hz(m); x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in (1, 3, 5, 7)) + .5 * np.sin(2 * np.pi * f * 2 * tt)
    e = np.minimum(1, tt / .005) * np.exp(-tt / (d * .9)); return lp(x, 900) * e * .5 * v
def pluck(m, v=1, d=.5):
    tt = t_(d); f = hz(m); x = np.sin(2 * np.pi * f * tt) * env_exp(d, .28) + .3 * np.sin(2 * np.pi * 4 * f * tt) * env_exp(d, .05)
    return x * np.minimum(1, tt / .002) * v
def pad(ms, d, v=1):
    tt = t_(d); x = 0
    for m in ms:
        f = hz(m); x = x + sum(((-1) ** ((k - 1) // 2)) * np.sin(2 * np.pi * f * k * tt * (1 + .0015 * np.sin(2 * np.pi * .3 * tt))) / k ** 2 for k in (1, 3, 5))
    e = np.minimum(1, tt / .6) * np.minimum(1, (d - tt) / .25); return lp(x, 2500) * e * v / len(ms)
def bell(m, v=1, d=1.4):
    tt = t_(d); f = hz(m); return sum(a * np.sin(2 * np.pi * f * r * tt) * env_exp(d, tau) for r, a, tau in [(1, 1, .9), (2.76, .4, .4), (5.4, .2, .18)]) * v
def fsnap(v=1):
    d = .06; return (hp(noise(d), 2500) * env_exp(d, .006) + np.sin(2 * np.pi * 1800 * t_(d)) * env_exp(d, .004) * .4) * v

mus = np.zeros((N, 2), np.float32)
def put(x, t, g=1, pan=0): add(mus, x.astype(np.float32), t, g, pan)

PROG = [(50, [62, 65, 69]), (46, [62, 65, 70]), (48, [64, 67, 72]), (45, [61, 64, 69])]   # Dm Bb C A
MEL = [74, 72, 69, 72, 74, 77, 76, 72]   # marimba motif (8ths over 4 beats)
def groove(t0, t1, kit=1.0, hats16=False, mel=True, bassv=1.0, snaps=False):
    t = t0; b = 0
    while t < t1 - 1e-3:
        bar = int(b // 4) % 4; root, ch = PROG[bar]; beat_in_bar = b % 4
        if kit:
            if beat_in_bar in (0, 2): put(kick(.9 * kit), t)
            if beat_in_bar in (1, 3): put(clap(.45 * kit) if not snaps else fsnap(.6), t, pan=.1)
            for h in (range(4) if hats16 else range(2)): put(hat(.22 * kit if h % 2 == 0 else .14 * kit), t + h * (SX if hats16 else EI), pan=.3)
        for e in range(2): put(bass(root - 12 if e == 0 else root, EI * .9, .8 * bassv), t + e * EI)
        if mel:
            for e in range(2): put(pluck(MEL[(int(b) * 2 + e) % 8] - (0 if bar % 2 == 0 else 2), .32), t + e * EI, pan=-.25)
        t += BEAT; b += 1

# opening: light pulse under the hook, groove once the file opens
groove(VO['l1'], T['open'], kit=.6, mel=False, bassv=.8)
groove(T['open'], VO['l3'] - .1, kit=1.0)
# music stops for "He wasn't." and the FAKE stamp in the beat after it
groove(VO['l4'], T['chain'], kit=.8, mel=False, snaps=True)
groove(T['chain'], T['chain2'], kit=1.0, hats16=True)
# tension: pedal bass, snare roll + riser, cut dead at the end of "to cover it."
t0, t1 = T['chain2'], vend('l5')
t = t0
while t < t1: put(bass(38, EI * .8, .9), t); put(bass(50, EI * .8, .5), t + EI); t += BEAT
t = t0
while t < t1:
    dens = 1 + int(3 * (t - t0) / (t1 - t0)); put(snare(.15 + .5 * (t - t0) / (t1 - t0)), t, pan=.05); t += BEAT / (2 * dens)
d = t1 - t0; tt = t_(d); f = 200 + 1800 * (tt / d) ** 2
put(bp(noise(d), 300, 4000) * (tt / d) ** 2 * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / d) ** 3 * .12, t0)
mus[int(t1 * SR):int((t1 + .25) * SR)] = 0
# after the snap: low pulse, pad, the score's own hit on the CLOSED stamp, a bell tag on "his name"
for tk in np.arange(VO['l6'], CLOSED - .05, BEAT): put(kick(.6), tk); put(bass(38, EI, .6), tk)
put(pad([62, 65, 69], DUR - VO['l6'], .5), VO['l6']); put(pad([50, 57], DUR - VO['l6'], .35), VO['l6'])
for e in EV:
    if e['type'] == 'accent':
        put(kick(1.0), e['t']); put(bass(38, .4, 1.0), e['t'])
        if e.get('big'): put(bp(noise(.5), 200, 2000) * env_exp(.5, .12) * .6, e['t'])
tag = T['end'] - .9
for i, m in enumerate([74, 77, 81, 86]): put(bell(m, .35), tag + i * .09, pan=-.2 + .13 * i)
mus = mus[:N]

# ───────── foley ─────────
fol = np.zeros((N, 2), np.float32)
def F(x, t, g=1, pan=0): add(fol, np.asarray(x, np.float32), t, g, pan)
def stampfx(big=False):
    d = .7; tt = t_(d); f = 50 + 110 * np.exp(-tt / .05); boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .16)
    click = hp(noise(d), 2000) * env_exp(d, .004)
    x = boom + click * .6
    if big: x = x + bp(noise(d), 1500, 6000) * (rng.random(len(tt)) > .97) * env_exp(d, .1) * 2
    return norm(x)
def pop(p=1.0):
    d = .08; tt = t_(d); f = (700 + 500 * p) * (1 + 2 * np.exp(-tt / .01)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .025)
def paper(d, lo=500, hi=5000):
    tt = t_(d); return bp(noise(d), lo, hi) * np.sin(np.pi * tt / d) ** 1.5
def clink(k=0):
    d = .4; tt = t_(d); return sum(a * np.sin(2 * np.pi * f * (1 + .02 * k) * tt) * env_exp(d, tau) for f, a, tau in [(2100, 1, .12), (3300, .6, .08), (5200, .4, .05), (900, .3, .1)])
def boing():
    d = .5; tt = t_(d); f = 180 * (1 + .6 * np.exp(-tt / .1)) * (1 + .08 * np.sin(2 * np.pi * 18 * tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .2)
def murmur(d):
    tt = t_(d); x = 0
    for k in range(6):
        fo = 300 + 500 * rng.random(); m = .5 + .5 * np.sin(2 * np.pi * (2 + 3 * rng.random()) * tt + 6 * rng.random())
        x = x + bp(noise(d), fo, fo * 1.6) * m
    return norm(x) * np.minimum(1, tt / .4) * np.minimum(1, (d - tt) / .5)

def in_gap(t):
    for g0, g1 in GAPS:
        if g0 - 1e-3 <= t < g1: return g1
    return None
def snapfx():
    d = .4; tt = t_(d); f = 55 + 160 * np.exp(-tt / .03)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .06) + hp(noise(d), 1500) * env_exp(d, .015) * .8 + clink(-3) [:int(d * SR)] * .6)
for e in EV:
    t, ty = e['t'], e['type']
    if ty not in ('stamp', 'snap'): continue
    g1 = in_gap(t)
    if g1 is None: print('skipped effect over speech:', ty, t); continue
    x = stampfx(e.get('big')) if ty == 'stamp' else snapfx()
    L = max(0, int((g1 - .02 - t) * SR)); x = x[:L].copy(); f = min(len(x), int(.015 * SR))
    if f: x[-f:] *= np.linspace(1, 0, f)
    F(x, t, 1.0)

# ───────── voice ─────────
vo = np.zeros((N, 2), np.float32); mask = np.zeros(N)
for e in EV:
    if e['type'] != 'voice': continue
    x, sr = sf.read(os.path.join(HERE, 'voice', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = compress(norm(hp(x, 80), .9), thr=.22, ratio=3.0); add(vo, x.astype(np.float32), e['t']); s = int(e['t'] * SR); mask[s:s + len(x)] = 1
from scipy.ndimage import uniform_filter1d, minimum_filter1d
def rms(x): y = x[np.abs(x) > 1e-4]; return float(np.sqrt(np.mean(y ** 2))) if len(y) else 1e-9
vo *= .5 / rms(vo)
mus *= (.5 / 6.3) / rms(mus)                      # base level: music ~16 dB under the voice
# keep music + effects at least 12 dB under the voice wherever it speaks (16 dB target, 4 dB margin)
fr = int(.02 * SR); nf = N // fr
def lev(x):
    m = x.mean(1)[:nf * fr].reshape(nf, fr); return 10 * np.log10(np.mean(m ** 2, 1) + 1e-12)
Lv = 10 * np.log10(uniform_filter1d(10 ** (lev(vo) / 10), 5) + 1e-12)
active = Lv > Lv.max() - 30
Lb = lev(mus + fol)
need = np.where(active, np.minimum(0, (Lv - 16) - Lb), 0.0)
need = minimum_filter1d(need, 9)                  # hold the cut ±80 ms around each frame
g = 10 ** (uniform_filter1d(need, 3) / 20); g = np.minimum(g, 10 ** (minimum_filter1d(need, 3) / 20) * 1.0)
gs = np.repeat(g, fr); gs = np.concatenate([gs, np.full(N - len(gs), gs[-1])])
mus *= gs[:, None]; fol *= gs[:, None]
mix = vo + mus + fol
mix = np.tanh(mix * 1.1) / np.tanh(1.1)               # soft clip
end = int(DUR * SR); mix = mix[:end]
mix[-int(.08 * SR):] *= np.linspace(1, 0, int(.08 * SR))[:, None]
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
for nm, x in [('music', mus), ('foley', fol), ('voice', vo)]: sf.write(os.path.join(HERE, 'out', f'stem_{nm}.wav'), x[:end], SR)
# check: 100 ms windows where the voice speaks
w = int(.1 * SR); bg = (mus + fol)[:end].mean(1); vv = vo[:end].mean(1); worst = 99; bad = 0
vth = 10 * np.log10(np.mean(vv ** 2) + 1e-12) - 18
for i in range(0, end - w, w):
    lv = 10 * np.log10(np.mean(vv[i:i + w] ** 2) + 1e-12); lb = 10 * np.log10(np.mean(bg[i:i + w] ** 2) + 1e-12)
    if lv > vth: worst = min(worst, lv - lb); bad += (lv - lb) < 12
print(f'voice over music+effects while speaking: worst {worst:.1f} dB, windows under 12 dB: {bad}')
