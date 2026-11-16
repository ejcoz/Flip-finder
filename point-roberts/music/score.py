"""Original score for "Point Roberts": harpsichord (plucked, dry, while lines are cut), pizzicato cello pulse,
and one bowed cello line that enters when the wash reaches the tip. 84 BPM, D minor resolving to F major.
Run: LIB=<library> "$LIB/.venv/bin/python" music/score.py"""
import sys, os, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.dirname(HERE)
TL = json.load(open(f'{D}/timeline.json')); K = TL['K']; DUR = TL['dur']; N = int(round(DUR * SR))
S.seed(49); rng = np.random.default_rng(49)
BPM = 84; B = 60 / BPM; BAR = 4 * B
st = {k: np.zeros((N + SR * 4, 2), np.float32) for k in ('harp', 'cello')}
def M(p): return S.midi(p) if isinstance(p, str) else p
def hpsi(t, p, d=.6, v=.4, pan=-.15):
    if 0 <= t < DUR: add(st['harp'], S.note('harpsichord', M(p), d, vel=v), t + float(rng.uniform(-.004, .004)), 1, pan)
def pizz(t, p, v=.5):
    if 0 <= t < DUR: add(st['cello'], S.note('cellos_pizz', M(p), .8, vel=v), t, .9, .2)
def bow(t, p, d, v=.45):
    add(st['cello'], S.note('cellos', M(p), d, vel=v, release=.6), t, .85, .15)
CH = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'], 'Gm': ['G2', 'D3', 'G3', 'Bb3'], 'A': ['A2', 'E3', 'A3', 'C#4'],
      'F': ['F2', 'C3', 'F3', 'A3'], 'C': ['C3', 'G3', 'C4', 'E4'], 'Am': ['A2', 'E3', 'A3', 'C4']}
PROG = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A', 'F', 'Bb', 'F', 'C', 'F']
SIL = (K['tip'] - 0.62, K['tip'] - 0.02)          # the beat before "tip": nothing
def broken(bar, ch, v=.36, density=8):
    t0 = bar * BAR; c = CH[ch]; seq = [c[0], c[2], c[1], c[3], c[2], c[3] if density < 8 else c[1], c[2], c[3]]
    for i in range(8):
        if density == 4 and i % 2: continue
        t = t0 + i * B / 2
        if SIL[0] - .05 < t < SIL[1]: continue
        hpsi(t, M(seq[i]) + 12, .5, v * (1.1 if i == 0 else .85))
for bar, ch in enumerate(PROG):
    t0 = bar * BAR
    if t0 >= DUR: break
    dens = 4 if 4.5 <= bar <= 6.5 else 8                           # thinner while the roundel opens
    vel = .3 if bar < 2 else .36
    if bar < 12: broken(bar, ch, vel, dens)
    if not (SIL[0] - .05 < t0 < SIL[1]): pizz(t0, CH[ch][0], .5); pizz(t0 + 2 * B, CH[ch][1], .4)
# the cello line enters with the wash on the tip
bow(K['tip'], 'F3', 2.2 * B, .5); bow(K['tip'] + 2.2 * B, 'A3', 1.8 * B, .45); bow(K['tip'] + 4 * B, 'Bb3', 2 * B, .45)
bow(K['carEnd'] - 0.4, 'C4', 2 * B, .4); bow(K['carEnd'] - 0.4 + 2 * B, 'A3', 4 * B, .42)
# the finished plate: a final F major, rolled
t = 12 * BAR + 0.0 if 12 * BAR < DUR - 1.5 else DUR - 3.5
for i, p in enumerate(['F2', 'C3', 'F3', 'A3', 'C4', 'F4']): hpsi(t + i * .06, p, 3.5, .42)
bow(t, 'F2', 3.5, .45)
tt = np.arange(N) / SR; mask = np.ones(N)
mask[(tt >= SIL[0]) & (tt < SIL[1])] = 0
s = tt >= DUR - 1.0; mask[s] *= np.linspace(1, 0, s.sum())
ROOM = dict(harp=(.35, .18), cello=(.5, .25))
mix = sum(S.room(st[k][:N] * mask[:, None], size=ROOM[k][0], mix=ROOM[k][1]) for k in st)
mix = (mix / np.abs(mix).max() * .89).astype(np.float32)
sf.write(f'{HERE}/score.wav', mix, SR, subtype='PCM_24')
json.dump(dict(silence=SIL), open(f'{HERE}/silences.json', 'w'))
open(f'{HERE}/CREDITS_music.txt', 'w').write('Music: original score, generated in code for this film\n' + '\n'.join(S.credits(['harpsichord', 'cellos_pizz', 'cellos'])) + '\n')
print('score.wav', mix.shape, 'silence', SIL)
