"""Score + ambience + foley + the user's narration → out/mix.wav (48 kHz stereo).

Rules from the brief, enforced here:
- narration starts at sample 0 (leading silence already trimmed into voice/narration.wav), used as recorded;
- no sound before the first word; music only under or after the voice;
- spot effects only in the gaps between words (asserted);
- music + ambience + effects stay >= 12 dB under the voice over every spoken word (asserted, target ~ -18 dB).
"""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core/audio'))
import sfx
from sfx import SR, noise, bp, lp, hp, norm, env_exp, t_, whoosh, thump, click, add, brown

EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EVJ['dur']; N = int(DUR * SR)
words = json.load(open(os.path.join(HERE, 'out/words.json')))
voice, vsr = sf.read(os.path.join(HERE, 'voice/narration.wav'))
assert vsr == SR
if voice.ndim > 1: voice = voice.mean(1)
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]

# speech intervals
SPEECH = []
for w in words:
    a, b = w['t0'] - 0.02, w['t1'] + 0.02
    if SPEECH and a - SPEECH[-1][1] < 0.12: SPEECH[-1][1] = b
    else: SPEECH.append([a, b])
mask = np.zeros(N)
for a, b in SPEECH: mask[int(max(0, a) * SR):int(b * SR)] = 1

# ---------------------------------------------------------------- music (D minor, 96 bpm, synthesized)
BPM = 96; BEAT = 60 / BPM
music = np.zeros((N, 2))
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def tone(f, d, kind='tri', att=0.01, tau=0.3):
    tt = t_(d)
    if kind == 'tri': x = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * tt))
    elif kind == 'sq': x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in (1, 3, 5, 7)) * 0.8
    elif kind == 'mar': x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 3.99 * tt) * np.exp(-tt / 0.05)
    elif kind == 'bell': x = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt / 0.1)
    env = np.minimum(1, tt / att) * np.exp(-tt / tau)
    return x * env
def kick():
    d = 0.3; tt = t_(d); return np.sin(2 * np.pi * (50 * tt + 60 * (1 - np.exp(-tt / 0.03)) * 0.03)) * env_exp(d, 0.09)
def hat():
    d = 0.06; return hp(noise(d), 7000) * env_exp(d, 0.012)

CH = {'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'Gm': [43, 50, 55], 'A': [45, 49, 52], 'F': [41, 48, 53]}
PROG = ['Dm', 'Dm', 'Bb', 'A']
bar = 4 * BEAT
def section(t0, t1, bass=True, drums=False, pluck=False, bell=False, pad=True, pg=1.0):
    t = t0; k = 0
    while t < t1 - 0.05:
        ch = CH[PROG[k % 4]]
        dur = min(bar, t1 - t)
        if pad:
            for m in ch: add(music, tone(mtof(m + 12), dur, 'tri', att=0.4, tau=3.0) * 0.06 * pg, t, 1, (m % 3 - 1) * 0.3)
        for i in range(8):
            tb = t + i * BEAT / 2
            if tb >= t1: break
            if bass: add(music, lp(tone(mtof(ch[0] - 12), BEAT / 2 * 0.9, 'sq', att=0.005, tau=0.18), 900) * 0.16, tb)
            if drums:
                if i % 2 == 0: add(music, kick() * 0.5, tb)
                add(music, hat() * (0.09 if i % 2 else 0.05), tb, 1, 0.3)
            if pluck and i in (0, 3, 6):
                add(music, tone(mtof(ch[(i // 3) % 3] + 24), 0.6, 'mar', tau=0.25) * 0.12, tb, 1, -0.2)
            if bell:
                arp = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 36]
                add(music, tone(mtof(arp[i % 4]), 1.2, 'bell', tau=0.5) * 0.08, tb, 1, 0.25 if i % 2 else -0.25)
        t += bar; k += 1

section(0.0, 12.85, bass=True)
section(12.85, 24.3, bass=True, drums=True, pluck=True)
section(26.85, 32.35, bass=False, bell=True)
add(music, (tone(mtof(38), 2.6, 'tri', att=1.0, tau=6) + tone(mtof(45), 2.6, 'tri', att=1.0, tau=6)) * 0.07, 32.3)
# gentle edges: no lead-in, out before "Neither has he"
fade = np.ones(N); tt = np.arange(N) / SR
fade *= np.clip(tt / 0.4, 0, 1)
fade *= 1 - np.clip((tt - 24.3) / 0.1, 0, 1) * np.clip((26.85 - tt) / 0.05, 0, 1)
fade *= np.clip((34.8 - tt) / 1.2, 0, 1)
music *= fade[:, None]

# ---------------------------------------------------------------- ambience beds
amb = np.zeros((N, 2))
def bed(x, t0, t1, g, pan=0):
    n = int((t1 - t0) * SR); x = x[:n]; e = np.minimum(1, np.minimum(np.arange(n) / (0.2 * SR), (n - np.arange(n)) / (0.2 * SR)))
    add(amb, x * e * g, t0, 1, pan)
wind = lambda d: norm(bp(brown(d) + noise(d) * 0.3, 200, 1400)) * (0.7 + 0.3 * np.sin(np.arange(int(round(d * SR))) / SR * 1.7))
rain = lambda d: norm(hp(noise(d), 2500) * 0.5 + bp(noise(d), 800, 3000) * 0.5)
bed(wind(4.6), 0.0, 4.6, 0.5)
bed(norm(lp(noise(3.71), 250)) + 0.3 * np.sin(2 * np.pi * 110 * t_(3.71)), 9.14, 12.85, 0.3)
bed(rain(4.8), 12.85, 17.65, 0.35)
bed(wind(4.45), 20.0, 24.45, 0.6)
bed(rain(2.4), 24.45, 26.85, 0.35)
bed(norm(bp(noise(5.8), 300, 1200)) * (0.7 + 0.3 * np.sin(t_(5.8) * 5)), 26.85, 32.65, 0.35)

# ---------------------------------------------------------------- spot effects (gaps only)
fx = np.zeros((N, 2)); SPOTS = []
def spot(x, at, g, pan=0):
    SPOTS.append((at, at + len(x) / SR)); add(fx, x, at, g, pan)
def stamp():
    d = 0.28; n = int(round(d * SR)); th = np.pad(thump(1, 90), (0, n))[:n]
    return norm(th + lp(noise(d), 2000) * env_exp(d, 0.015) * 0.6) * env_exp(d, 0.08)
def slide(d=0.28): return norm(bp(noise(d), 1500, 5000)) * np.sin(np.pi * t_(d) / d) ** 2
def paper(d=0.38): return norm(bp(noise(d), 1200, 6000) * (np.random.default_rng(3).random(int(round(d * SR))) > 0.7)) * np.sin(np.pi * t_(d) / d)
def jet(d=0.85): return norm(lp(brown(d), 600) + bp(noise(d), 1500, 4000) * 0.2) * np.sin(np.pi * t_(d) / d) ** 1.5
seen = set()
for e in EVJ['ev']:
    t, k = e['t'], e['type']
    if k == 'whoosh':
        if any(abs(t - s) < 0.2 for s in seen): continue
        seen.add(t); spot(whoosh(0.3), max(t, 0), 0.25)
    elif k == 'stamp': spot(stamp(), t - 0.01, 0.5)
    elif k == 'paper': spot(paper(), t, 0.25)
    elif k == 'slide' and t > 30: spot(slide(), t, 0.25)
    elif k == 'jet': spot(jet(0.75), t, 0.35)
    elif k == 'gust': spot(whoosh(0.22), t, 0.3)
for a, b in SPOTS:
    for sa, sb in SPEECH:
        assert b <= sa or a >= sb, f'effect {a:.2f}-{b:.2f} overlaps speech {sa:.2f}-{sb:.2f}'

# ---------------------------------------------------------------- levels: duck everything under the voice
rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)
db = lambda x: 20 * np.log10(x + 1e-12)
vr = rms(voice[mask > 0])
def level(buf, under_db, gap_db):
    r = rms(buf.mean(1)[np.abs(buf.mean(1)) > 1e-5]) if np.any(np.abs(buf) > 1e-5) else 1
    g_s, g_g = vr * 10 ** (under_db / 20) / r, vr * 10 ** (gap_db / 20) / r
    m = np.convolve(mask, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')  # smooth duck, slightly early
    m = np.minimum(1, m * 3)
    return buf * (g_g + (g_s - g_g) * m)[:, None]
music = level(music, -21, -13)
amb = level(amb, -28, -19)
fx = fx * (vr * 10 ** (-6 / 20) / max(rms(fx.mean(1)[np.abs(fx.mean(1)) > 1e-4]), 1e-9))   # gaps only
bedmix = music + amb + fx
mix = bedmix + voice[:, None]

# check: every word, voice vs everything else
worst = 99
for w in words:
    a, b = int(w['t0'] * SR), int(w['t1'] * SR)
    d = db(rms(voice[a:b])) - db(rms(bedmix[a:b].mean(1)))
    worst = min(worst, d)
print(f'voice over bed, worst word: {worst:.1f} dB')
assert worst >= 12, 'bed too loud under a word'
mix = mix / np.abs(mix).max() * 0.9   # plain gain; mux does loudness + true-peak limiting
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix.astype(np.float32), SR)
print('out/mix.wav', round(len(mix) / SR, 2), 's')
