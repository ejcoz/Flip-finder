"""The Coupon - sound: narration, paper foley and an original score, from events.json and timeline.json -> out/mix.wav (48 kHz).
Score: a tarantella in A minor (6/8, one bar = 1 s): accordion tune, tuba and bassoon on the beats, pizzicato off-beats.
It stops dead before the turn, goes sparse (harp, low clarinet) for "new money paid old investors", climbs over a timpani roll
while the square of coupons grows, and ends on a tuba + timpani hit under the postmark, then a slow accordion chord.
Run: $LIB/.venv/bin/python mix.py   (LIB = library folder)"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, whoosh, thump

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'events.json'))); TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = D['dur']; EV = D['ev']; N = int(round(DUR * SR)); tt = np.arange(N) / SR
rng = np.random.default_rng(11)

def env_ar(n, a, r):
    e = np.ones(n); a = max(1, min(n // 2, a)); r = max(1, min(n - a, r))
    e[:a] = np.linspace(0, 1, a) ** 1.5; e[-r:] = np.linspace(1, 0, r) ** 2; return e
def paper_slide(d, size=1.0):
    n = max(64, int(d * SR)); x = bp(rng.standard_normal(n), 700 if size >= 1 else 1100, 5200, 2)
    g = lp(np.abs(rng.standard_normal(n)), 120, 1); g = 0.55 + 0.45 * g / (g.max() + 1e-9)
    return x * g * env_ar(n, int(0.04 * SR), int(0.5 * n)) * np.linspace(1.0, 0.6, n)
def paper_pat(w=1.0):
    n = int(0.09 * SR); x = lp(hp(rng.standard_normal(n) * np.exp(-np.arange(n) / (0.012 * SR)), 180), 3800)
    th = np.zeros(n); b = thump(v=0.5, f=85)[:n]; th[:len(b)] = b
    return x * 0.9 + th * 0.5 * w
def slap():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n) * np.exp(-np.arange(n) / (0.006 * SR)), 900) + lp(rng.standard_normal(n) * np.exp(-np.arange(n) / (0.02 * SR)), 600) * 0.6
def key():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 1800, 7000, 2) * np.exp(-t / 0.004) + 0.5 * lp(rng.standard_normal(n), 900) * np.exp(-t / 0.012)
def clink(f0=4200):
    n = int(0.4 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, (m, dec, a) in enumerate(((1.0, 0.09, 1.0), (1.63, 0.06, 0.6), (2.41, 0.045, 0.45))): x += a * np.sin(2 * np.pi * f0 * m * t + k) * np.exp(-t / dec)
    return x * 0.5
def flutter(d, rate, lo, hi):
    n = max(64, int(d * SR)); x = bp(rng.standard_normal(n), lo, hi, 2)
    ph = np.cumsum(np.full(n, rate) / SR) * 2 * np.pi
    return x * np.clip(np.sin(ph), 0, 1) ** 3 * env_ar(n, int(0.03 * SR), int(0.4 * n))
def stamp_hit():
    n = int(0.25 * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 1400) * np.exp(-t / 0.03) * 1.2 + thump(v=1.0, f=60)[:n] * 0.9

fx = np.zeros((N, 2))
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'slide': add(fx, paper_slide(e['d'], e.get('size', 1)), t, 0.15, 0)
    elif ty == 'land': add(fx, paper_pat(e.get('w', 1)), t, 0.26 * e.get('w', 1), 0)
    elif ty == 'slap': add(fx, slap(), t, 0.26 if e.get('big') else 0.18, 0)
    elif ty == 'key': add(fx, key(), t, 0.16, -0.2)
    elif ty == 'bell': add(fx, clink(), t, 0.14, -0.2)
    elif ty == 'fall': add(fx, flutter(e['d'], 11, 900, 5000), t, 0.06, 0)
    elif ty == 'thud': add(fx, thump(v=1.0, f=70), t, 0.32 * e['w'], 0); add(fx, paper_pat(1.0), t, 0.25, 0)
    elif ty == 'drop': add(fx, paper_pat(0.35), t, 0.10, (rng.random() - .5) * 0.8); add(fx, flutter(0.2, 14, 1500, 6000), t - 0.2, 0.03, 0)
    elif ty == 'flip': add(fx, flutter(e['d'], 9, 600, 4000), t, 0.12, 0)
    elif ty == 'whip': add(fx, lp(whoosh(e['d'], 1.0), 5000), t, 0.2, 0)
    elif ty == 'grow':
        n = int(e['d'] * SR); add(fx, bp(rng.standard_normal(n), 300, 2400) * np.linspace(0.15, 1, n) ** 2, t, 0.06, 0)
    elif ty == 'tiny': add(fx, clink(5200)[: int(0.15 * SR)], t, 0.12, 0.3)
    elif ty == 'stamp': add(fx, stamp_hit(), t, 0.4, 0.2)
room = lp(rng.standard_normal(N), 400, 2) * 0.004
fx += np.stack([room, np.roll(room, 997)], 1)

# ---------------- score ----------------
ev = []
def E(t, inst, p, d, v, pan=0.0, g=0.7):
    if t < DUR: ev.append((t, inst, p, d, v, pan, g))
e8 = 1 / 6                                            # eighth note: 6/8 at one bar per second
Am, Dm, E7, F = (45, [57, 60, 64]), (38, [57, 62, 65]), (40, [56, 59, 62]), (41, [57, 60, 65])
PROG = [Am, Dm, Am, E7]
TUNE = [[76, None, 76, 77, 76, 74], [74, None, 74, 76, 74, 72], [72, None, 71, 72, 74, 76], [71, None, None, 68, None, None],
        [76, None, 76, 77, 79, 77], [77, None, 76, 74, None, 72], [72, None, 74, 71, None, 69], [69, None, None, None, None, None]]
def tarantella(b0, b1, vel=0.5, tune=True, drive=False):
    for b in range(b0, b1):
        root, tri = PROG[b % 4]; t0 = float(b)
        E(t0, 'tuba_stac', root - 12 if root > 43 else root, 0.3, vel, -0.1, 0.8)
        E(t0 + 3 * e8, 'bassoon_stac', root + 7, 0.25, vel * 0.85, -0.15, 0.6)
        for k in (1, 2, 4, 5):
            for j, p in enumerate(tri): E(t0 + k * e8 + j * 0.008, 'violins_pizz', p, 0.15, vel * 0.7, 0.2 + 0.05 * j, 0.5)
        if tune:
            for k, p in enumerate(TUNE[b % 8]):
                if p is not None: E(t0 + k * e8, 'accordion', p - 12 if p > 79 else p, e8 * 1.6, vel * 0.9, 0.1, 0.55)
        if drive:
            for k in range(6): E(t0 + k * e8, 'snare2', 'stick' if k % 3 else 'on', None, vel * (0.5 if k % 3 else 0.8), -0.05, 0.35)
# 0-4.5: the coupon. Pizzicato under the typewriter, a timpani + tuba landing at 1.0
E(1.0, 'timpani', 45, 1.2, 0.55, 0, 0.7); E(1.0, 'tuba', 33, 1.0, 0.5, 0, 0.6)
for b in range(1, 5):
    for k in range(6): E(b + k * e8, 'violins_pizz', [69, 72, 76, 72, 69, 64][k], 0.15, 0.3, 0.2, 0.4)
E(2.0, 'clarinet', 64, 2.4, 0.3, -0.1, 0.4)
# 5-15: the tarantella
tarantella(5, 10, 0.48)
for t in (8.75, 8.92, 9.09): E(t, 'glockenspiel', 88, 0.6, 0.4, 0.3, 0.45)          # stamps
E(10.05, 'sus_cymbal', None, None, 0.35, 0, 0.4)                                   # the whip pan
tarantella(10, 15, 0.52)
for i, t in enumerate([11.4, 11.53, 11.66] + [12.3 + k * 0.125 for k in range(8)]): E(t, 'xylophone', [81, 84, 88, 76, 79, 81, 84, 86, 88, 89, 91][i], 0.2, 0.42, 0.3, 0.45)
# 15-18.3: the money, driving
tarantella(15, 18, 0.58, drive=True)
for k in range(6): E(18 + k * e8 * 0.5, 'xylophone', 88 + k, 0.1, 0.4, 0.3, 0.4)
# 18.3-19.4: silence; the coupon lands on the pile
E(18.45, 'timpani', 40, 1.4, 0.45, 0, 0.6)
# 19.4-23.6: the turn, sparse
E(19.55, 'harp', 57, 2.2, 0.4, -0.2, 0.55); E(19.6, 'harp', 64, 2.2, 0.35, 0, 0.5); E(19.65, 'harp', 72, 2.2, 0.32, 0.2, 0.45)
E(20.2, 'clarinet', 57, 1.6, 0.32, -0.1, 0.45)
for i, (t, p) in enumerate([(21.35, 52), (21.8, 50), (22.5, 48), (22.6, 47), (22.68, 45)]): E(t, 'bassoon_stac', p, 0.3, 0.42, -0.1, 0.55)
for t in (22.15, 22.25, 22.95, 23.05, 23.15, 23.25): E(t, 'violins_pizz', 81, 0.1, 0.3, 0.3, 0.4)
# 24-30.2: the square grows: timpani roll, a rising low line, horns when it is complete
for i in range(int(2.9 / 0.1)): E(24.05 + i * 0.1, 'timpani', 45, 0.25, 0.12 + 0.3 * i / 29, 0, 0.45)
for i, p in enumerate([33, 35, 36, 38, 40, 41]): E(24.05 + i * 0.48, 'tuba', p, 0.5, 0.45 + 0.04 * i, 0, 0.6)
E(26.9, 'horn', 57, 2.5, 0.5, -0.1, 0.55); E(26.9, 'horn', 64, 2.5, 0.45, 0.1, 0.5); E(26.9, 'trombone', 45, 2.5, 0.45, 0, 0.5)
E(26.9, 'crash', None, None, 0.35, 0, 0.35); E(26.9, 'timpani', 45, 1.5, 0.6, 0, 0.6)
E(27.55, 'glockenspiel', 93, 1.5, 0.35, 0.4, 0.4)                                 # the tiny square
E(28.2, 'clarinet', 69, 1.8, 0.3, 0.1, 0.4); E(28.2, 'bassoon', 45, 1.8, 0.35, -0.1, 0.45)
# 30.25-35.5: collapse
E(30.75, 'tuba', 33, 1.4, 0.6, 0, 0.7); E(30.75, 'timpani', 40, 1.6, 0.55, 0, 0.6)
E(31.0, 'accordion', 57, 1.2, 0.35, 0, 0.45); E(31.0, 'accordion', 64, 1.2, 0.3, 0.1, 0.4)
E(32.25, 'timpani', 45, 2.0, 0.75, 0, 0.7); E(32.25, 'tuba', 33, 1.5, 0.65, 0, 0.7); E(32.25, 'crash', None, None, 0.4, 0, 0.35)
for i, p in enumerate([45, 52, 57, 60, 64, 69]): E(32.85 + i * 0.06, 'harp', p, 2.6, 0.45, -0.3 + 0.12 * i, 0.55)
E(32.9, 'accordion', 57, 2.4, 0.3, 0, 0.4); E(32.9, 'accordion', 60, 2.4, 0.28, 0, 0.4); E(32.9, 'accordion', 64, 2.4, 0.26, 0, 0.4)
S.seed(9)
music = S.render(ev, dur=DUR + 3, master=False)[:N]
music = S.room(music, size=0.32, mix=0.16)

# ---------------- narration ----------------
vo = np.zeros(N); active = np.zeros(N)
for lid, (t0, d) in TL['vo'].items():
    x, sr = sf.read(os.path.join(HERE, 'voice', lid + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr); x = compress(x / (np.abs(x).max() + 1e-9) * 0.8, thr=0.18, ratio=3.0)
    i0 = int(t0 * SR); i1 = min(N, i0 + len(x)); vo[i0:i1] += x[:i1 - i0]
    active[max(0, i0 - int(0.15 * SR)):min(N, i1 + int(0.2 * SR))] = 1
k = int(0.12 * SR); act = np.convolve(active, np.ones(k) / k, 'same')
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2)) if np.any(np.abs(x) > 1e-4) else 1.0
mid = np.stack([bp(music[:, c], 300, 4000, 2) for c in range(2)], 1)
music = (music - mid * (0.5 * act)[:, None]) * (1 - 0.37 * act)[:, None]
vo_gain = (rms(music.mean(1)[active > 0]) * 10 ** (10 / 20)) / (rms(vo) + 1e-9)
mix = fx + music * 0.9 + np.stack([vo, vo], 1) * vo_gain
mix *= (np.clip((DUR - tt) / 0.6, 0, 1) ** 1.5)[:, None]
mix = np.stack([compress(mix[:, c], thr=0.35, ratio=2.2) for c in range(2)], 1)
m = mix.mean(1); r = np.sqrt(np.mean(m[np.abs(m) > 1e-3] ** 2)); mix *= 0.1 / r
mix = np.stack([limit(mix[:, c], ceil=0.1 * 10 ** (11 / 20)) for c in range(2)], 1)
mix *= 0.85 / max(1e-9, np.abs(mix).max())
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = ['tuba', 'tuba_stac', 'bassoon', 'bassoon_stac', 'violins_pizz', 'accordion', 'clarinet', 'timpani', 'harp', 'sus_cymbal',
        'xylophone', 'glockenspiel', 'snare2', 'horn', 'trombone', 'crash']
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix ok, vo gain', round(float(vo_gain), 2))
