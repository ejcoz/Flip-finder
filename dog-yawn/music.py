"""Pet Cam mix (dog-yawn): narrator + soft curious underscore (ducked under the voice) + foley, all placed from the page's events.
Usage: python music.py <events.json> <voice_dir> <out.wav>"""
import json, sys, os
import numpy as np, soundfile as sf, soxr

SR = 48000
ev = json.load(open(sys.argv[1])); VOICE = sys.argv[2]
DUR = ev['dur']; N = int(DUR * SR)
music = np.zeros((N, 2)); voice = np.zeros(N); fx = np.zeros((N, 2))

def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); j = min(len(buf), i + len(sig))
    if j <= i or i < 0: return
    s = sig[:j - i] * gain
    if buf.ndim == 1: buf[i:j] += s
    else: buf[i:j, 0] += s * (1 - max(0, pan)); buf[i:j, 1] += s * (1 + min(0, pan))

def env(n, a, r):
    e = np.ones(n); a = int(a * SR); r = int(r * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e

def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR

# ---------- underscore: 80 BPM, sleepy: Fmaj7 – Am7 – Dm9 – Bbmaj7, one chord per bar ----------
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
CHORDS = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 64], [46, 53, 57, 62]]
def pad(notes, d):
    t = tt(d); s = np.zeros_like(t)
    for m in notes:
        f = mtof(m + 12)
        for det in (-0.12, 0.12): s += np.sin(2 * np.pi * f * (1 + det / 100) * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s / (len(notes) * 4) * env(len(t), 0.6, 0.6)
def pluck(m, d=0.9):
    t = tt(d); f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 5) * env(len(t), 0.004, 0.05)
def kick(d=0.25):
    t = tt(d); f = 55 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
def shaker(d=0.05, seed=0):
    x = np.random.default_rng(seed).uniform(-1, 1, int(d * SR)); x = np.diff(np.concatenate([[0], x]))
    return x * np.exp(-np.arange(len(x)) / SR * 70)

nbars = int(np.ceil(DUR / BAR)) + 1
ARP = [0, 2, 1, 3, 2, 1, 3, 2]
for b in range(nbars):
    t0 = b * BAR; ch = CHORDS[b % 4]
    put(music, pad(ch, BAR + 0.6), t0, 0.5)
    for k in range(8):
        put(music, pluck(ch[ARP[k]] + 24), t0 + k * BEAT / 2, 0.16 if k % 2 == 0 else 0.11, pan=(-0.25 if k % 2 else 0.25))
    if b >= 1:
        put(music, kick(), t0, 0.35); put(music, kick(), t0 + 2 * BEAT, 0.25)
        for k in range(8): put(music, shaker(seed=b * 8 + k), t0 + k * BEAT / 2, 0.05 if k % 2 else 0.03, pan=0.3)

# ---------- narrator ----------
vo_spans = []
for e in ev['ev']:
    if e['type'] != 'vo': continue
    x, sr = sf.read(os.path.join(VOICE, e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR)
    x = x / (np.sqrt((x ** 2).mean()) + 1e-9) * 0.12          # RMS-match every line
    x = np.tanh(x * 1.6) / 1.6                                 # gentle compression of peaks
    put(voice, x, e['t']); vo_spans.append((e['t'], e['t'] + len(x) / SR))

# ---------- foley on the picture's events ----------
def whoosh(d=0.35, up=True):
    x = np.random.default_rng(3).normal(0, 1, int(d * SR)); y = np.zeros_like(x); acc = 0
    t = np.arange(len(x)) / len(x); k = 0.02 + (0.25 * t if up else 0.25 * (1 - t))
    for i, v in enumerate(x): acc += k[i] * (v - acc); y[i] = acc
    return y * np.sin(np.pi * t) ** 1.5
def chirp(f0, f1, d, shape=1.0):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6 * shape) * env(len(t), 0.003, 0.02)
def bell(f, d=1.2):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 3.5)
for e in ev['ev']:
    t, ty = e['t'], e['type']
    if ty == 'whoosh': put(fx, whoosh(), t, 0.45)
    elif ty == 'swap': put(fx, whoosh(0.22, False), t, 0.3)
    elif ty == 'pop': put(fx, chirp(500, 1300, 0.12), t, 0.25)
    elif ty == 'tick': put(fx, chirp(1800, 1700, 0.05, 3), t, 0.18)
    elif ty == 'chime': put(fx, bell(880), t, 0.14); put(fx, bell(1318.5), t + 0.12, 0.1)
    elif ty == 'boing': put(fx, chirp(240, 120, 0.35, 0.6) * (1 + 0.5 * np.sin(2 * np.pi * 18 * tt(0.35))), t, 0.25)
    elif ty == 'strike': put(fx, kick(0.3), t, 0.5); put(fx, chirp(420, 180, 0.18, 1.5), t, 0.22)
    elif ty == 'yawn':
        d = 0.9; tv = tt(d); f = 520 * (0.62 ** (tv / d)) * (1 + 0.03 * np.sin(2 * np.pi * 7 * tv))
        w = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        put(fx, w * np.sin(np.pi * tv / d) ** 1.5 * 0.5, t + 0.15, 0.12)
    elif ty == 'cap': put(fx, chirp(2400, 2300, 0.03, 4), t, 0.05)

# ---------- duck the music under the voice (-10 dB, 80 ms attack, 350 ms release) ----------
target = np.ones(N)
for a, b in vo_spans: target[int(a * SR):int(b * SR)] = 10 ** (-10 / 20)
g = np.empty(N); cur = 1.0
att, rel = 1 - np.exp(-1 / (0.08 * SR)), 1 - np.exp(-1 / (0.35 * SR))
for i in range(N):
    k = att if target[i] < cur else rel
    cur += k * (target[i] - cur); g[i] = cur
music *= g[:, None] * 0.55

mix = music + fx + voice[:, None]
dc = int(0.015 * SR); mix[:dc] *= np.linspace(0, 1, dc)[:, None]; mix[-dc:] *= np.linspace(1, 0, dc)[:, None]   # loops: no fade
mix /= max(1e-9, np.abs(mix).max()) / 0.89
sf.write(sys.argv[3], mix, SR)
print('mix', sys.argv[3], f'{DUR:.2f}s')
