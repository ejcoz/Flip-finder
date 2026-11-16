"""Score, foley and voice for Tacoma Narrows → out/mix.wav (and stems).
Run with the library's venv; LIB must point at the library root."""
import os, sys, json
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx
from core.audio.sfx import SR, add, lp, hp, bp, noise, norm, t_, env_exp, compress, limit

S.seed(3)
rng = np.random.default_rng(42)
E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; EV = E['ev']
N = int((DUR + .5) * SR)

BEAT = 60 / 90; BAR = 4 * BEAT; SIX = BEAT / 4; EI = BEAT / 2
SNAP = 7 * BAR; STAMP = 8 * BAR; FIG = 9 * BAR; FLOW = 10 * BAR

# ───────────── score ─────────────
ev = []
def n(t, inst, p, d, v, pan=0, g=1.0): ev.append((round(t, 4), inst, p, d, v, pan, g))

# chords per bar for the opening (D minor), gear motive in 8ths
CH = {0: ('D', ['D4', 'A4', 'F4', 'A4', 'E4', 'A4', 'F4', 'A4'], 'D2'),
      1: ('Bb', ['D4', 'Bb4', 'F4', 'Bb4', 'D4', 'Bb4', 'F4', 'Bb4'], 'Bb1'),
      2: ('Gm', ['D4', 'Bb4', 'G4', 'Bb4', 'D4', 'Bb4', 'G4', 'Bb4'], 'G1'),
      3: ('A', ['C#4', 'A4', 'E4', 'A4', 'C#4', 'A4', 'E4', 'G4'], 'A1'),
      4: ('D', ['D4', 'A4', 'F4', 'A4', 'E4', 'A4', 'F4', 'A4'], 'D2'),
      5: ('Bb', ['D4', 'Bb4', 'F4', 'Bb4', 'Eb4', 'Bb4', 'F4', 'Bb4'], 'Bb1'),
      6: ('A', ['C#4', 'A4', 'E4', 'A4', 'C#4', 'A4', 'E4', 'A4'], 'A1')}
for b in range(7):
    t0 = b * BAR
    _, mot, bass = CH[b]
    for i, p in enumerate(mot):
        t = t0 + i * EI
        if b == 6 and t >= t0 + 2 * BEAT: break           # music drops out at bar 6, beat 3
        n(t, 'harpsichord', p, EI * .9, .55 + .1 * (i % 2 == 0) + .04 * b, -.25)
    # pizzicato bass on 1 and 3
    for k in (0, 2):
        if b == 6 and k == 2: break
        n(t0 + k * BEAT, 'cellos_pizz', S.name(S.midi(bass) + 12), BEAT, .7, .2)
    # bassoon canon one beat behind, an octave lower (from bar 2)
    if b >= 2:
        for i, p in enumerate(mot[:6] if b == 6 else mot):
            t = t0 + BEAT + i * EI
            if b == 6 and t >= t0 + 2 * BEAT: break
            if t < t0 + BAR: n(t, 'bassoon_stac', S.name(S.midi(p) - 12), EI * .8, .5 + .03 * b, .35)
    # spiccato 16ths rising with the wind (bars 4–6), crescendo
    if b >= 4:
        arp = [S.midi(p) for p in mot[:4]]
        for i in range(16):
            t = t0 + i * SIX
            if b == 6 and t >= t0 + 2 * BEAT: break
            p = arp[i % 4] + 12 * ((i // 8) % 2) + (b - 4) * 2
            prog = ((b - 4) * 16 + i) / 40
            n(t, 'violins_spic', min(p, 86), SIX * .9, .35 + .5 * prog, -.05 + .1 * (i % 2))
        n(t0, 'cellos_spic', S.name(S.midi(bass) + 12), BEAT * .5, .65 + .1 * (b - 4), .1)
        n(t0 + 2 * BEAT, 'cellos_spic', S.name(S.midi(bass) + 12), BEAT * .5, .65, .1)

# the snap: low stab
for p, inst, v in [('D2', 'cellos_spic', .95), ('Eb2', 'cellos_spic', .85), ('D2', 'contrabass_pizz', 1.0), ('D2', 'bassoon_stac', .9)]:
    n(SNAP, inst, p, .6, v, 0)

# a single questioning bassoon line after the stamp
q = [(STAMP + 1.0, 'A3', .9), (STAMP + 1.0 + 2 * EI, 'D4', .5), (STAMP + 1.0 + 3 * EI, 'E4', .5), (STAMP + 1.0 + 4 * EI, 'F4', 1.6), (FIG + .4, 'E4', 2.0)]
for t, p, d in q: n(t, 'bassoon', p, d, .55, .15)
n(FIG, 'harpsichord', 'A3', 1.0, .45, -.2); n(FIG + BEAT * 2, 'harpsichord', 'D4', 1.0, .4, -.2)
n(FIG + BAR, 'harp', 'A2', 2.0, .5, .1); n(FIG + BAR + BEAT, 'harp', 'E3', 2.0, .4, .1)

# the answer: theme in augmentation (quarters), harpsichord + harp, calm
prog = [(FLOW, 'D', ['D4', 'F4', 'A4', 'F4'], 'D2', ['D3', 'A3', 'F4', 'A4']),
        (FLOW + BAR, 'Bb', ['D4', 'F4', 'Bb4', 'F4'], 'Bb1', ['Bb2', 'F3', 'D4', 'F4']),
        (FLOW + 2 * BAR, 'Gm-A', ['D4', 'G4', 'C#4', 'E4'], 'G1', ['G2', 'D3', 'Bb3', 'D4'])]
for t0, _, mel, bass, harp in prog:
    for i, p in enumerate(mel): n(t0 + i * BEAT, 'harpsichord', p, BEAT * .95, .5, -.25)
    for i, p in enumerate(harp): n(t0 + i * EI, 'harp', p, 2.0, .45, .25)
    n(t0, 'bassoon', S.name(S.midi(bass) + 12), BAR * .95, .38, .1)
# dominant half-bar, then the final D major cadence at bar 12.5
CAD = FLOW + 2.5 * BAR
for i, p in enumerate(['A2', 'E3', 'C#4', 'E4']): n(CAD - BAR / 2 + i * EI, 'harp', p, 1.5, .45, .25)
n(CAD - BAR / 2, 'bassoon', 'A2', BAR / 2, .4, .1)
for p in ['D3', 'A3', 'D4', 'F#4', 'A4']: n(CAD, 'harpsichord', p, 2.2, .4, -.2)
for i, p in enumerate(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']): n(CAD + i * .05, 'harp', p, 3.0, .36, .25)
n(CAD, 'bassoon', 'D2', 2.0, .42, .1)

music = S.render([e[:6] if e[6] == 1 else e for e in ev], dur=N / SR)
music = S.room(music, size=.38, mix=.16)
music = music[:N]
# fade the tail into the end
tail = int(.5 * SR); end = int(DUR * SR)
music[end - tail:end] *= np.linspace(1, 0, tail)[:, None] ** .5; music[end:] = 0

# ───────────── foley ─────────────
fol = np.zeros((N, 2), np.float32)
amb = np.zeros((N, 2), np.float32)

def pen(d, v=1.0):
    """technical pen scratch: grainy 2–6 kHz noise with a stroke envelope"""
    x = bp(noise(d), 2200, 6500) * (.6 + .4 * np.abs(lp(noise(d), 40)) * 3)
    tt = t_(d); e = np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .05)
    return norm(x * e) * v
def letter(d, v=1.0):
    out = np.zeros(int(d * SR)); t = 0
    while t < d - .05:
        s = .04 + rng.random() * .08; seg_ = pen(s, .5 + rng.random() * .5); i = int(t * SR); out[i:i + len(seg_)] += seg_[:len(out) - i]; t += s + rng.random() * .03
    return norm(out) * v
def tsquare(d, v=1.0):
    x = lp(bp(noise(d), 300, 2500), 1800); tt = t_(d)
    return norm(x * np.sin(np.pi * tt / d) ** .6) * v
def tick(v=1.0):
    d = .03; return norm(hp(noise(d), 3000) * env_exp(d, .003)) * v
def twang(v=1.0):
    d = 1.1; tt = t_(d); f = 180 + rng.random() * 160
    x = sum(a * np.sin(2 * np.pi * f * k * tt * (1 - .08 * tt)) * env_exp(d, .25 / k) for k, a in [(1, 1), (2.03, .6), (3.1, .4), (4.4, .25)])
    crack = hp(noise(d), 1500) * env_exp(d, .006) * 2
    return norm(x * .7 + crack) * v
def tear(d, v=1.0):
    tt = t_(d); x = bp(noise(d), 500, 4000) * (np.abs(np.sin(2 * np.pi * 37 * tt)) ** 2 + .3)
    groan = sum(np.sin(2 * np.pi * f * tt * (1 - .2 * tt)) for f in (110, 167, 233)) * .3
    return norm((x + groan) * env_exp(d, .45)) * v
def splash(v=1.0):
    d = 1.4; tt = t_(d)
    body = lp(noise(d), 900) * env_exp(d, .25); hiss = bp(noise(d), 1500, 7000) * env_exp(d, .4) * .5
    low = np.sin(2 * np.pi * 55 * tt) * env_exp(d, .15)
    return norm(body + hiss + low * .8) * v
def stamp(v=1.0):
    th = sfx.thump(1, 85); slap = hp(noise(.08), 900) * env_exp(.08, .01)
    x = th.copy(); x[:len(slap)] += slap * .6
    return norm(x) * v
def windbed(d):
    w = lp(sfx.brown(d), 900) + bp(noise(d), 300, 1800) * .25
    tt = t_(d); gust = .6 + .4 * np.sin(2 * np.pi * .23 * tt) * np.sin(2 * np.pi * .07 * tt + 1)
    whistle = bp(noise(d), 900, 1300) * (.5 + .5 * np.sin(2 * np.pi * .3 * tt)) * .15
    return norm((w + whistle) * gust)

for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'pen': add(fol, pen(e['dur'], .22), t, pan=rng.uniform(-.3, .3))
    elif ty == 'letter': add(fol, letter(e['dur'], .18 * e.get('v', 1)), t, pan=rng.uniform(-.2, .2))
    elif ty == 'hatch':
        for k in range(int(e['dur'] / .07)): add(fol, pen(.05, .12), t + k * .07)
    elif ty == 'tsquare': add(fol, tsquare(e['dur'], .25), t, pan=-.2)
    elif ty == 'tick': add(fol, tick(.08 * e.get('v', 1)), t, pan=rng.uniform(-.5, .5))
    elif ty == 'creak': add(fol, sfx.creak(.22 * e['v']), t, pan=rng.uniform(-.4, .4))
    elif ty == 'snap': add(fol, hp(noise(.12), 800) * env_exp(.12, .01) * .9, t)
    elif ty == 'twang': add(fol, twang(.35 * e['v']), t, pan=rng.uniform(-.6, .6))
    elif ty == 'tear': add(fol, tear(e['dur'], .55), t)
    elif ty == 'splash': add(fol, splash(.55 * e['v']), t, pan=rng.uniform(-.3, .3))
    elif ty == 'stamp': add(fol, stamp(.95), t)
    elif ty == 'strike': add(fol, pen(e['dur'], .3), t)
    elif ty == 'wind_on':
        d = e['until'] - t; w = windbed(d); tt = t_(d)
        envw = np.minimum(1, tt / 1.2) * np.minimum(1, (d - tt) / 1.8)
        # swell until the snap, then fall away
        rise = np.interp(tt, [0, SNAP - t - 1.3, SNAP - t, d], [.35, 1.0, .8, .25])
        w = w * envw * rise * .28
        add(amb, w, t, pan=-.1); add(amb, np.roll(w, 2400), t, gain=.7, pan=.4)
    elif ty == 'flow_on':
        d = DUR - t + .3; tt = t_(d)
        hum = (np.sin(2 * np.pi * 60 * tt) * .5 + np.sin(2 * np.pi * 120 * tt) * .3 + np.sin(2 * np.pi * 180 * tt) * .15)
        air = lp(noise(d), 700) * .6
        add(amb, (hum * .25 + air) * np.minimum(1, tt / 1.0) * .07, t)

# room tone, very low
amb += (lp(noise(N / SR), 500)[:N, None] * .004).astype(np.float32)

# ───────────── voice ─────────────
vo = np.zeros((N, 2), np.float32); vmask = np.zeros(N)
for e in EV:
    if e['type'] != 'voice': continue
    x, sr = sf.read(os.path.join(HERE, 'voice', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = hp(x, 80); x = compress(norm(x, .9), thr=.22, ratio=3.0)
    add(vo, x.astype(np.float32), e['t']); s = int(e['t'] * SR); vmask[s:s + len(x)] = 1

def rms(x): return float(np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2))) if np.any(np.abs(x) > 1e-4) else 1e-9
# duck music under voice (~0.36×), foley by half
from scipy.ndimage import uniform_filter1d
duck = uniform_filter1d(vmask, int(.25 * SR))
music *= (1 - .64 * duck)[:, None]
fol *= (1 - .45 * duck)[:, None]

# balance: voice ~10 dB above music
vo *= .5 / rms(vo)
music *= (.5 / 3.16) / rms(music) * 1.0
fol *= .9
mix = vo + music + fol + amb
for c in range(2): mix[:, c] = limit(mix[:, c], .95)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR)
for nm, x in [('music', music), ('foley', fol + amb), ('voice', vo)]: sf.write(os.path.join(HERE, 'out', f'stem_{nm}.wav'), x, SR)
print('mix written', mix.shape, 'peak', float(np.abs(mix).max()))
print('instruments:', sorted({e[1] for e in ev}))
