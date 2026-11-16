"""Original score: a West-Coast cool-jazz combo for "Why Are Homes So Pricey in New Brunswick?"
vibraphone / flute / pizzicato bass / brushes + ride / celesta colour / muted trumpet tag.
112 BPM, 4/4, 31 bars = 66.43 s, B-flat major. Every reason has its own vibraphone chord
(Ebmaj7, Cm9, F13); the title and the summary stamp them back one per medallion.
Run: "$LIB/.venv/bin/python" music/score.py   (with LIB set; reads ../timeline.json)
"""
import sys, os, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
S.seed(112); rng = np.random.default_rng(112)
B = TL['beat']; BAR = TL['bar']; DUR = TL['dur']; N = int(round((DUR + 0.5) * SR)); SW = 0.62
SEC = {s['id']: s for s in TL['S']}

def T(bar, beat=0.0):
    """bar counts from 1; .5 off-beats are swung"""
    w = np.floor(beat + 1e-9); f = beat - w
    if abs(f - .5) < 1e-6: f = SW
    return (bar - 1) * BAR + (w + f) * B
def M(p): return S.midi(p) if isinstance(p, str) else p
def jit(ms=5): return float(rng.uniform(-ms, ms)) / 1000
stems = {k: np.zeros((N, 2), np.float32) for k in ('drums', 'bass', 'vib', 'lead')}
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)

def motor(x, rate=5.0, depth=.3, t0=0.0):
    t = np.arange(len(x)) / SR + t0; return x * (1 - depth * (.5 + .5 * np.sin(2 * np.pi * rate * t))).astype(np.float32)
def vib(t, pitches, dur, vel=.45, pan=-.25, hard=False, trem=0.0, gain=1.0):
    for i, p in enumerate(pitches if isinstance(pitches, (list, tuple)) else [pitches]):
        x = S.note('vibraphone_hard' if hard else 'vibraphone', M(p), dur, vel=vel)
        if trem: x = motor(x, depth=trem, t0=i * .013)
        add(stems['vib'], x, t, gain, pan + (i - 1.5) * .08)
def vib_run(t0, pitches, step, v0=.3, v1=.6, ring=1.0):
    n = len(pitches)
    for i, p in enumerate(pitches):
        add(stems['vib'], S.note('vibraphone_hard', M(p), ring, vel=v0 + (v1 - v0) * i / max(1, n - 1)), t0 + i * step, 1, -.3 + .6 * i / n)
def flute(t, p, beats, vel=.45, stac=False, pan=.22):
    x = S.note('flute_stac', M(p), .2, vel=vel) if stac and M(p) >= 69 else S.note('flute', M(p), max(.12, beats * B * .9), vel=vel, release=.09)
    add(stems['lead'], x, t - .02, 1, pan)
def trumpet(t, p, beats, vel=.5):
    add(stems['lead'], S.note('trumpet_mute', M(p), max(.12, beats * B * .9), vel=vel, release=.1), t - .02, .9, -.15)
def celesta(t, p, vel=.45, pan=.4):
    g = S.note('glockenspiel', M(p), 1.6, vel=min(.45, vel * .7)); add(stems['lead'], g, t, .6, pan)
def bass(t, p, beats=.9, vel=.6):
    add(stems['bass'], S.note('jazz_bass', M(p), max(.1, beats * B), vel=vel, release=.08), t - .015, 1, 0)
def dk(t, var, vel, dur=None, pan=.3, gain=1.0): add(stems['drums'], S.hit('drum_kit', var, vel, dur), t, gain, pan)
def brush_tap(t, v=.5, pan=-.1):
    d = .16; tt = np.arange(int(d * SR)) / SR; n = rng.standard_normal(len(tt))
    x = bp(n, 1500, 9000) * np.exp(-tt / .045) + .5 * bp(n, 300, 1200) * np.exp(-tt / .02) + .25 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / .03)
    add(stems['drums'], (x / 3.2 * v).astype(np.float32), t, 1, pan)
def brush_sweep(t, d, v=.3, pan=-.15):
    tt = np.arange(int(d * SR)) / SR; n = rng.standard_normal(len(tt))
    add(stems['drums'], ((bp(n, 1800, 7500) + .35 * bp(n, 500, 1800)) * np.sin(np.pi * tt / d) ** 1.5 / 4 * v).astype(np.float32), t, 1, pan)
def snap(t, v=.5):
    d = .09; tt = np.arange(int(d * SR)) / SR; n = rng.standard_normal(len(tt))
    add(stems['drums'], (bp(n, 1800, 5000) * np.exp(-tt / .012) / 2.5 * v).astype(np.float32), t, 1, .45)
def brushes(b0, b1, v=.3, half=False):
    for bar in range(b0, b1):
        for h in ((0,) if half else (0, 2)): brush_sweep(T(bar, h) + jit(4), (4 if half else 2) * B * 1.05, v * .8)
        for bt in ((2,) if half else (1, 3)):
            brush_tap(T(bar, bt) + jit(4), v * 1.25)
            add(stems['drums'], S.hit('hihat', 'pedal', .35 * v / .3, .3), T(bar, bt) + .004, .45, .45)
def ride(b0, b1, vel=.3):
    for bar in range(b0, b1):
        for b in [0, 1, 1.5, 2, 3, 3.5]: dk(T(bar, b) + jit(4), 'ride_right', vel * (1 if b in (1, 3) else .7), dur=1.3, pan=.35, gain=.55)
        for bt in (1, 3): add(stems['drums'], S.hit('hihat', 'pedal', .4, .3), T(bar, bt) + .004, .45, .45)

# ---------------------------------------------------------------- harmony
V = {
    'Bb69': ['F3', 'Bb3', 'D4', 'G4', 'C5'], 'Bb6': ['D4', 'F4', 'G4', 'Bb4'], 'Gm7': ['F3', 'Bb3', 'D4'], 'Cm7': ['Eb3', 'G3', 'Bb3', 'D4'],
    'F7': ['Eb3', 'A3', 'C4'], 'F13': ['Eb3', 'A3', 'D4', 'G4'], 'Ebmaj7': ['G3', 'Bb3', 'D4', 'F4'], 'Cm9': ['Eb3', 'G3', 'Bb3', 'D4'],
    'Dm7': ['F3', 'A3', 'C4', 'E4'], 'G7': ['F3', 'B3', 'E4'], 'Abmaj7': ['G3', 'C4', 'Eb4'], 'G7alt': ['F3', 'B3', 'Eb4', 'Ab4'],
    'Fsus': ['Eb3', 'Bb3', 'C4', 'F4'], 'Eb9': ['Db4', 'G3', 'F4'], 'D7#9': ['F#3', 'C4', 'F4'], 'C7': ['Bb3', 'E4', 'A4'],
}
ROOT = {'Bb69': 'Bb1', 'Bb6': 'Bb1', 'Gm7': 'G1', 'Cm7': 'C2', 'F7': 'F1', 'F13': 'F1', 'Ebmaj7': 'Eb2', 'Cm9': 'C2', 'Dm7': 'D2', 'G7': 'G1',
        'Abmaj7': 'Ab1', 'G7alt': 'G1', 'Fsus': 'F1', 'Eb9': 'Eb2', 'D7#9': 'D2', 'C7': 'C2'}
def comp(bar, ch, vel=.3, charleston=True):
    vib(T(bar, 0) + jit(3), V[ch], 1.4 * B, vel)
    if charleston: vib(T(bar, 1.5) + jit(3), V[ch], .6 * B, vel * .75)
def walk(bar, ch, nxt, vel=.58, half=False):
    r = M(ROOT[ch]); n = M(ROOT[nxt]); third = r + (3 if 'm' in ch.replace('maj', '') else 4)
    if half: bass(T(bar, 0), r, 1.8, vel); bass(T(bar, 2), r + 7, 1.8, vel * .9); return
    for i, p in enumerate([r, third, r + 7, n + (1 if n < r + 7 else -1)]): bass(T(bar, i) + jit(3), p, .9, vel * (1 if i % 2 == 0 else .88))
def tones(ch, lo=64, hi=84):
    pcs = {M(p) % 12 for p in V[ch]}; return [m for m in range(lo, hi + 1) if m % 12 in pcs]
MOTIF = [(0.5, .5, 0), (1.0, .5, 1), (1.5, 1.0, 2), (3.0, .5, 1), (3.5, .5, 0)]
def tune(bar, ch, vel=.38, up=True):
    tt = tones(ch); seq = tt[-5:]
    for (b, ln, k), p in zip(MOTIF, [seq[2], seq[3], seq[4], seq[2], seq[1]]): flute(T(bar, b) + jit(4), p, ln, vel, stac=ln <= .5 and b >= 3)
def play(bars, prog, mel=None, half=False, vel=.28):
    for i, (bar, ch) in enumerate(zip(bars, prog)):
        nxt = prog[i + 1] if i + 1 < len(prog) else prog[0]
        comp(bar, ch, vel, charleston=not half); walk(bar, ch, nxt, half=half)
        if mel and i in mel: tune(bar, ch, mel[i])

# ================================================================ HOOK bars 1–5 (0–10.71)
play([1, 2, 3], ['Bb6', 'Gm7', 'Cm7'], mel={1: .32, 2: .3})
brushes(1, 4, .26)
vib_run(T(3, 3), ['Bb4', 'C5', 'D5', 'F5', 'G5', 'Bb5', 'C6', 'D6'], (T(4, 0) - T(3, 3) - .02) / 8, .25, .55)
cr = S.hit('sus_cymbal', 'roll', .55); ln = int(B * SR); add(stems['drums'], (cr[:ln] * np.linspace(0, 1, ln) ** 2).astype(np.float32), T(3, 3), .8, .25)
t = T(4, 0); vib(t, V['Bb69'], 2.2 * B, .7, hard=True, trem=.3); bass(t, 'Bb1', 1.8, .85); dk(t, 'crash_right', .5, dur=2.4, gain=.55); celesta(t, 'D6', .6)
walk(4, 'F13', 'Bb6'); brushes(4, 6, .3); comp(4, 'F13', .26)
play([5], ['F7'], mel={0: .36})
# ================================================================ TITLE bars 6–8 (10.71–17.14)
t = T(6, 0); vib(t, V['Bb69'], 1.2 * B, .55, hard=True); bass(t, 'Bb1', .8, .8); dk(t, 'kick_drum_left', .4, gain=.5)
vib(T(6, 1.5), V['Gm7'], .8 * B, .4, hard=True); bass(T(6, 1.5), 'G1', .8, .7)
SIL1 = (T(6, 3.42), T(7, 0))                         # "So, why?" → silence → the first stamp
for i, ch in enumerate(['Ebmaj7', 'Cm9', 'F13']):
    t = T(7, i); vib(t, V[ch], 1.6 * B, .55, hard=True, trem=.2); bass(t, ROOT[ch], .9, .75); celesta(t, tones(ch, 79, 92)[-1], .5)
comp(7, 'F13', .2, charleston=False); vib(T(7, 3), V['F7'], .8 * B, .25)
play([8], ['F7'], vel=.24); brushes(8, 9, .22)
flute(T(8, 2), 'C5', .5, .34); flute(T(8, 2.5), 'D5', .5, .34); flute(T(8, 3), 'F5', 1, .38)
# ================================================================ R1 bars 9–15: Ebmaj7 world, finger snaps
play(range(9, 16), ['Ebmaj7', 'Ebmaj7', 'Dm7', 'G7', 'Cm7', 'F7', 'Bb6'], mel={0: .3, 3: .26, 5: .26, 6: .3})
brushes(9, 16, .26)
for bar in range(9, 16):
    for bt in (1, 3): snap(T(bar, bt) + .01, .5)
# ================================================================ R2 bars 16–20: half feel, Cm9
play(range(16, 21), ['Cm9', 'Cm9', 'Abmaj7', 'G7alt', 'Fsus'], half=True, mel={0: .26, 2: .24}, vel=.26)
brushes(16, 21, .24, half=True)
for i in range(6): celesta(SEC['r2']['t0'] + 5 * B + i * B * .5, tones('Cm9', 79, 96)[i % 6], .4)
# ================================================================ R3 bars 21–24: sticks on the ride, F13
play(range(21, 25), ['F13', 'F13', 'Eb9', 'D7#9'], mel={0: .32, 1: .3, 2: .3}, vel=.3)
ride(21, 25, .3)
# ================================================================ SUMMARY bars 25–28
su = SEC['sum']['t0']
for x, ch in zip([.2, 1.15, 2.1], ['Ebmaj7', 'Cm9', 'F13']):
    vib(su + x, V[ch], 1.6 * B, .55, hard=True, trem=.2); bass(su + x, ROOT[ch], .9, .72)
SIL2 = (su + 2.86, su + 6 * B)                       # room tone only, then the see-saw thump
t = su + 6 * B; dk(t, 'kick_drum_left', .6, gain=.7); bass(t, 'G1', 1.8, .8); vib(t, V['Gm7'], 1.4 * B, .45)
play([27, 28], ['Cm7', 'F7'], mel={0: .34}, vel=.3); brushes(26, 29, .3)
vib_run(su + 5.9, ['F4', 'G4', 'Bb4', 'C5', 'D5', 'F5', 'G5', 'Bb5'], .05, .3, .55)
# ================================================================ END bars 29–31: the trumpet tag, tremolo under the held frame
t = T(29, 0); vib(t, V['Bb69'], 4 * B, .4, trem=.35); bass(t, 'Bb1', 1.8, .6); bass(T(29, 2), 'F1', 1.8, .5)
TAG = [(29, .5, 'D5', .5), (29, 1, 'F5', .5), (29, 1.5, 'G5', 1.5), (29, 3.5, 'F5', .5), (30, 0, 'D5', 1), (30, 1, 'C5', .5), (30, 1.5, 'Bb4', 2)]
for bar, b, p, l in TAG: trumpet(T(bar, b), p, l, .45)
brushes(29, 31, .2)
vib(T(30, 0), V['Gm7'], 3.5 * B, .32, trem=.35); bass(T(30, 0), 'Eb2', 1.8, .5); bass(T(30, 2), 'F1', 1.8, .5)
t = SEC['end']['t0'] + 5.85; vib(t, V['Bb69'], 3 * B, .55, hard=True, trem=.3); bass(t, 'Bb1', 2, .7); celesta(t, 'D6', .5); celesta(t + .02, 'Bb6', .4)
dk(t, 'crash_right', .35, dur=2.0, gain=.4)

# ---------------------------------------------------------------- room, silences, limiter
ROOMS = dict(drums=(.3, .1), bass=(.22, .06), vib=(.45, .2), lead=(.4, .18)); GAIN = dict(drums=.9, bass=1.05, vib=.95, lead=.85)
for k in stems: stems[k] = S.room(stems[k] * GAIN[k], size=ROOMS[k][0], mix=ROOMS[k][1]).astype(np.float32)
tt = np.arange(N) / SR; mask = np.ones(N)
def cut(a, b, f=.06):
    s = (tt >= a - f) & (tt < a); mask[s] *= .5 + .5 * np.cos(np.pi * (tt[s] - (a - f)) / f); mask[(tt >= a) & (tt < b)] = 0
cut(*SIL1); cut(*SIL2)
s = tt >= DUR - .25; mask[s] *= np.linspace(1, 0, s.sum())
for k in stems: stems[k] *= mask[:, None].astype(np.float32)
mix = sum(stems.values()); pk = np.abs(mix).max(); g = .89 / pk
for k in stems: stems[k] *= g
mix = sum(stems.values())[:int(round(DUR * SR))]
os.makedirs(f'{HERE}/stems', exist_ok=True)
sf.write(f'{HERE}/score.wav', mix.astype(np.float32), SR, subtype='PCM_24')
json.dump(dict(silences=[SIL1, SIL2]), open(f'{HERE}/silences.json', 'w'))
used = ['vibraphone', 'vibraphone_hard', 'flute', 'flute_stac', 'jazz_bass', 'drum_kit', 'hihat', 'sus_cymbal', 'glockenspiel', 'trumpet_mute']
open(f'{HERE}/CREDITS_music.txt', 'w').write('Music: original score, generated in code for this film\n' + '\n'.join(S.credits(used)) + '\n')
print('score.wav', mix.shape, 'silences', SIL1, SIL2)
