"""Score, foley and the user's narration -> out/mix.wav (48 kHz stereo).

Rules from the brief:
- narration starts on frame 0, used as it is (only the leading silence was trimmed);
- music starts with the voice (no lead-in) and sits >= 12 dB under the voice while it speaks;
- effects play only in the gaps between sentences, never over a spoken word.
"""
import json, os, sys
import numpy as np
import soundfile as sf

LIB = os.environ.get('LIB', '/root/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx as S
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur']; EV = ev['ev']
NS = int(round(DUR * SR))
rng = np.random.default_rng(1990)

# ---------- voice ----------
v, vsr = sf.read(os.path.join(HERE, 'audio', 'narration.wav'), dtype='float32')
if v.ndim > 1: v = v.mean(1)
assert vsr == SR, vsr
voice = np.zeros(NS, np.float32); voice[:min(NS, len(v))] = v[:NS]

words = json.load(open(os.path.join(HERE, 'audio', 'words_raw.json')))

def smooth_mask(intervals, ramp=0.01):
    m = np.zeros(NS, np.float32)
    for a, b in intervals:
        i0, i1 = max(0, int(a * SR)), min(NS, int(b * SR))
        if i1 > i0: m[i0:i1] = 1
    k = max(1, int(ramp * SR)); ker = np.ones(k) / k
    return np.convolve(m, ker, mode='same').astype(np.float32)

# speech intervals and the gaps between sentences (>= 0.25 s)
speech = [(w['t0'] - 0.05, w['t1'] + 0.12) for w in words]
gaps = []
for a, b in zip(words, words[1:]):
    if b['t0'] - a['t1'] >= 0.25: gaps.append((a['t1'] + 0.06, b['t0'] - 0.05))
gaps.append((words[-1]['t1'] + 0.15, DUR + 1))
GATE = smooth_mask(gaps, 0.012)          # 1 only between sentences
SPEECH = smooth_mask(speech, 0.06)

# ---------- music: 84 BPM, D minor, synth pop-print toolkit ----------
BPM = 84; BEAT = 60 / BPM
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def note_env(n, a=0.005, tau=0.25):
    tt = np.arange(n) / SR; e = np.exp(-tt / tau); e[:int(a * SR)] *= np.linspace(0, 1, int(a * SR)); return e
def pluck(m, d=0.5, tau=0.22):
    n = int(d * SR); tt = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * tt) + 0.28 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt / 0.05)) * note_env(n, 0.003, tau)
def sqbass(m, d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR; f = mtof(m)
    x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in (1, 2, 3, 5)) * note_env(n, 0.004, 0.12)
    return lp(x, 900)
def tri(m, d):
    n = int(d * SR); tt = np.arange(n) / SR; f = mtof(m)
    x = 2 * np.abs(2 * ((tt * f) % 1) - 1) - 1
    e = np.minimum(1, tt / 0.25) * np.minimum(1, (d - tt) / 0.3)
    return lp(x, 1400) * e
def snap():
    d = 0.08; return hp(noise(d), 2000) * env_exp(d, 0.012) + np.sin(2 * np.pi * 1800 * t_(d)) * env_exp(d, 0.008) * 0.4

mus = np.zeros((NS, 2), np.float32)
chords = [(38, [50, 53, 57]), (34, [50, 53, 58]), (31, [50, 55, 58]), (33, [49, 52, 57])]  # Dm  Bb  Gm  A
mel = [62, None, 65, None, 69, 67, None, 65, 62, None, 60, None, 62, None, None, None]
def music_on(t):
    if t < 17.25: return True
    if 18.2 <= t < 29.2: return True
    return False
bar = 0; t = 0.0
while t < DUR:
    root, pad = chords[bar % 4]
    if music_on(t):
        for m in pad:
            add(mus, tri(m, BEAT * 4 + 0.2) * 0.10, t, 1.0, (m - 54) / 12)
    for i in range(8):
        tt = t + i * BEAT / 2
        if tt >= DUR or not music_on(tt): continue
        add(mus, sqbass(root + (12 if i % 4 == 3 else 0), BEAT / 2) * 0.45, tt, 1.0, 0)
        mi = mel[(bar % 2) * 8 + i]
        if mi is not None and bar % 4 != 3:
            add(mus, pluck(mi + (0 if bar % 4 < 2 else -2)) * 0.35, tt, 1.0, 0.25 if i % 2 else -0.25)
        if 18.2 <= tt < 25.8 and i in (2, 6):
            add(mus, snap() * 0.5, tt, 1.0, 0.3)
    t += BEAT * 4; bar += 1
# bell tag under the 13 tiles, rising
for k in range(6):
    add(mus, pluck(74 + [0, 3, 7, 10, 12, 15][k], 0.6, 0.3) * 0.22, 25.95 + k * 0.2, 1.0, -0.3 + k * 0.12)
# a single low pad note under the last line (no melody), fading to nothing at the end
for m in (50, 57):
    n = int((DUR - 30.0) * SR); tt = np.arange(n) / SR; f = mtof(m)
    x = lp(2 * np.abs(2 * ((tt * f) % 1) - 1) - 1, 900) * np.minimum(1, tt / 0.6) * np.clip((DUR - 30.0 - tt) / 1.2, 0, 1)
    add(mus, x * 0.12, 30.0, 1.0, 0)
# fades: no lead-in (fade in with the first word), out before the stamp gap and the final gap
fade = np.ones(NS, np.float32); tt = np.arange(NS) / SR
fade *= np.clip(tt / 0.25, 0, 1)
mus *= fade[:, None]

# duck under the voice (-6 dB while speaking)
duck = 1 - (1 - 10 ** (-6 / 20)) * SPEECH
mus *= duck[:, None]

# ---------- foley (gap-only) ----------
fx = np.zeros((NS, 2), np.float32)
def buzz(d):
    tt = t_(d); f = 118
    x = np.sign(np.sin(2 * np.pi * f * tt)) * 0.6 + np.sin(2 * np.pi * 2 * f * tt) * 0.4
    return bp(x, 200, 3200) * np.minimum(1, tt / 0.01) * np.minimum(1, (d - tt) / 0.02)
def paper_slide(d=0.3):
    tt = t_(d); return bp(noise(d), 1500, 6500) * np.sin(np.pi * tt / d) ** 1.5
def knock():
    d = 0.18; tt = t_(d)
    return norm(np.sin(2 * np.pi * 190 * tt) * env_exp(d, 0.03) + bp(noise(d), 600, 2500) * env_exp(d, 0.012) * 0.8 + np.sin(2 * np.pi * 1450 * tt) * env_exp(d, 0.01) * 0.3)
def stamp():
    d = 0.7; tt = t_(d); f = 140 * np.exp(-tt * 4) + 45
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, 0.16)
    clk = hp(noise(d), 2500) * env_exp(d, 0.006)
    crk = bp(noise(d) * (rng.random(len(tt)) > 0.985), 1500, 7000) * env_exp(d, 0.08) * 3
    return norm(boom + clk * 0.8 + crk * 0.5)
def snick():
    d = 0.12; tt = t_(d)
    return norm(sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(3100, 1, .02), (5200, .7, .012), (7400, .4, .008)]) + hp(noise(d), 4000) * env_exp(d, .003))
def rip(d=0.4):
    tt = t_(d); grains = (rng.random(len(tt)) > 0.6).astype(float)
    return norm(bp(noise(d) * grains, 700, 5000) * np.sin(np.pi * tt / d) ** 0.7 * (1 - 0.5 * tt / d))
def hiss(d):
    tt = t_(d); return hp(noise(d), 3000) * np.sin(np.pi * tt / d) ** 2

for e in EV:
    t0, ty = e['t'], e['type']
    if ty == 'buzz': add(fx, buzz(e.get('d', 0.4)) * 0.35, t0, 1.0, 0.25)
    elif ty == 'latch': add(fx, S.thump(0.7, 90), t0, 0.55, 0.1); add(fx, S.click(0.6, 0.5), t0, 0.55, 0.1)
    elif ty == 'slide': add(fx, paper_slide(), t0, 0.35, -0.2)
    elif ty == 'knock': add(fx, knock(), t0, 0.7, 0.0)
    elif ty == 'whoosh': add(fx, S.whoosh(e.get('d', 0.4)), t0, 0.3, 0.3)
    elif ty == 'stamp': add(fx, stamp(), t0, 0.9, 0.0)
    elif ty == 'snick': add(fx, snick(), t0, 0.4, 0.2)
    elif ty == 'rip': add(fx, rip(), t0, 0.55, -0.1)
    elif ty == 'thunk': add(fx, S.thump(0.8, 85), t0, 0.5, 0.0); add(fx, S.click(0.5, 0.4), t0, 0.5, 0.0)
    elif ty == 'dust': add(fx, hiss(e.get('d', 0.8)), t0, 0.03, 0.0)
fx *= GATE[:, None]   # no effect ever plays over a spoken word

# ---------- level the bed against the voice ----------
def rms(x): return float(np.sqrt(np.mean(np.square(x)) + 1e-12))
def worst_margin(bed):
    # per word: voice RMS minus music+fx RMS over that word, in dB
    bm = bed.mean(1)
    out = []
    for w in words:
        i0, i1 = int(w['t0'] * SR), int(w['t1'] * SR)
        if i1 - i0 < 0.05 * SR: continue
        out.append(20 * np.log10(rms(voice[i0:i1]) / rms(bm[i0:i1])))
    return min(out), float(np.median(out))
mg = 1.0
for _ in range(30):
    wm, med = worst_margin(mus * mg + fx)
    if wm >= 15.0: break
    mg *= 10 ** ((wm - 15.5) / 20)
wm, med = worst_margin(mus * mg + fx)
print(f'music gain {mg:.3f}; voice over bed: worst word {wm:.1f} dB, median {med:.1f} dB')
assert wm >= 12.0

mix = mus * mg + fx
mix[:, 0] += voice; mix[:, 1] += voice
pk = np.abs(mix).max()
if pk > 0.98: mix *= 0.98 / pk
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR, subtype='PCM_24')
# stems for checking
sf.write(os.path.join(HERE, 'out', 'bed.wav'), mus * mg + fx, SR, subtype='PCM_24')
print('wrote out/mix.wav', mix.shape[0] / SR, 's')
