"""Synth pop-print score + foley + voice → out/mix.wav. Run with the library venv; LIB = library root."""
import os, sys, json
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio import sfx
from core.audio.sfx import SR, add, lp, hp, bp, noise, norm, t_, env_exp, compress, limit

rng = np.random.default_rng(5)
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
N = int(DUR * SR) + int(.2 * SR)
BEAT = .6; EI = BEAT / 2; SX = BEAT / 4
def ev_t(type_, key=None):
    return [e for e in EV if e['type'] == type_]
SNAP = [e['t'] for e in EV if e['type'] == 'snap'][0]
STAMPS = [e['t'] for e in EV if e['type'] == 'stamp']
FAKE, CLOSED = STAMPS[1], STAMPS[2]
VO = {e['id']: e['t'] for e in EV if e['type'] == 'voice'}
def hz(m): return 440 * 2 ** ((m - 69) / 12)

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

# hook: pulse after the stamp
groove(.6, 3.6, kit=.6, mel=False, bassv=.8)
# the promise + the man: full groove; drop out before "He wasn't."
groove(3.6, VO['l3'] - .2, kit=1.0)
# crowd: snaps and bass, sneaky
groove(FAKE + .6, 17.5, kit=.8, mel=False, snaps=True)
# the chain: build, 16th hats
groove(17.5, 21.8, kit=1.0, hats16=True)
# tension: pedal bass, snare roll + riser, drop at SNAP - .4
t = 21.8
while t < SNAP - .4: put(bass(38, EI * .8, .9), t); put(bass(50, EI * .8, .5), t + EI); t += BEAT
n = 0; t = 21.8
while t < SNAP - .4:
    dens = 1 + int(3 * (t - 21.8) / (SNAP - .4 - 21.8)); step = BEAT / (2 * dens)
    put(snare(.15 + .5 * (t - 21.8) / (SNAP - 22.2)), t, pan=.05); t += step
d = SNAP - .4 - 21.8; tt = t_(d); f = 200 + 1800 * (tt / d) ** 2
riser = bp(noise(d), 300, 4000) * (tt / d) ** 2 * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / d) ** 3 * .12
put(riser, 21.8)
# after the snap: low pulse under the clippings, empty before the stamp
for k, tk in enumerate(np.arange(SNAP + .6, CLOSED - .3, BEAT)): put(kick(.6), tk); put(bass(38, EI, .6), tk)
# ending: soft pad and a bell tag on "his name"
put(pad([62, 65, 69], DUR - CLOSED - .3, .5), CLOSED + .3)
put(pad([50, 57], DUR - CLOSED - .3, .35), CLOSED + .3)
tag = VO['l6'] + 2.9
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

for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'stamp': F(stampfx(e.get('big')), t, .95)
    elif ty == 'flap': F(norm(paper(.35, 300, 3000)), t, .35); F(norm(lp(noise(.08), 300)) * env_exp(.08, .02), t + .33, .4)
    elif ty == 'pops':
        for i in range(e['n']): F(pop(rng.random()), t + i * .045, .16, rng.uniform(-.4, .4))
    elif ty == 'boing': F(boing(), t, .35)
    elif ty == 'flip':
        k = 0; tk = t
        while tk < t + e['dur']: F(norm(hp(noise(.03), 2500)) * env_exp(.03, .006), tk, .2, .3); k += 1; tk += max(.025, .12 * (1 - k / 30))
    elif ty == 'whoosh': F(sfx.whoosh(.4), t, .25)
    elif ty == 'shutter': F(norm(hp(noise(.02), 1500)), t, .45); F(norm(hp(noise(.03), 1200)) * env_exp(.03, .008), t + .07, .4)
    elif ty == 'slide': F(norm(paper(.45, 800, 6000)), t, .3, .3)
    elif ty == 'murmur': F(murmur(e['dur']), t, .12)
    elif ty == 'clink': F(clink(e['k']), t, .22, rng.uniform(-.3, .3))
    elif ty == 'money':
        tk = t
        while tk < e['until']: F(norm(paper(.12, 2000, 7000)), tk, .05, rng.uniform(-.5, .5)); tk += .21 + rng.random() * .1
    elif ty == 'strain':
        tk = t
        while tk < e['until']: g = .1 + .35 * (tk - t) / (e['until'] - t); F(sfx.creak(1), tk, g, rng.uniform(-.4, .4)); F(clink(2) * .3, tk + .1, g * .4); tk += .45 - .25 * (tk - t) / (e['until'] - t)
    elif ty == 'typing':
        for i in range(10): F(norm(hp(noise(.02), 2000)) * env_exp(.02, .004), t + i * .085, .25)
    elif ty == 'snap':
        F(stampfx(True), t, 1.0); F(clink(-3) * 1.2, t, .6); F(sfx.crash(1), t + .02, .35)
    elif ty == 'flutter':
        for i in range(14): F(norm(paper(.15, 1500, 7000)), t + i * .08, .08, rng.uniform(-.6, .6))
    elif ty == 'slap': F(norm(lp(noise(.12), 2500)) * env_exp(.12, .02), t, .55, rng.uniform(-.3, .3)); F(sfx.thump(1, 90), t, .25)

# ───────── voice ─────────
vo = np.zeros((N, 2), np.float32); mask = np.zeros(N)
for e in EV:
    if e['type'] != 'voice': continue
    x, sr = sf.read(os.path.join(HERE, 'voice', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = compress(norm(hp(x, 80), .9), thr=.22, ratio=3.0); add(vo, x.astype(np.float32), e['t']); s = int(e['t'] * SR); mask[s:s + len(x)] = 1
from scipy.ndimage import uniform_filter1d
duck = uniform_filter1d(mask, int(.2 * SR))
def rms(x): y = x[np.abs(x) > 1e-4]; return float(np.sqrt(np.mean(y ** 2))) if len(y) else 1e-9
vo *= .5 / rms(vo)
mus *= (.5 / 3.0) / rms(mus)
mus *= (1 - .64 * duck)[:, None]; fol *= (1 - .3 * duck)[:, None]
mix = vo + mus + fol * .9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)               # soft clip
end = int(DUR * SR); mix = mix[:end]
mix[-int(.08 * SR):] *= np.linspace(1, 0, int(.08 * SR))[:, None]
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
for nm, x in [('music', mus), ('foley', fol), ('voice', vo)]: sf.write(os.path.join(HERE, 'out', f'stem_{nm}.wav'), x[:end], SR)
print('mix', mix.shape, 'voice ends at', round(max(VO[k] for k in VO), 2))
