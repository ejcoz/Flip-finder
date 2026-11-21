"""Join the Bunker theme, story cut (12 s). Original, synthesized. Writes story_score.wav; mixes it under
story_mix.wav (the sound design) into story_scored_mix.wav.
Motif: D5 F5 A5 E5 (a music-box lullaby); after the glitch it returns flattened (D5 F5 Ab5 Eb5)."""
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve
LIB = os.environ.get('LIB') or sys.exit('set LIB')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, lp, hp, bp, noise, norm, limit, add
H = os.path.dirname(os.path.abspath(__file__))
D = 12.0; N = int(D * SR); mus = np.zeros((N, 2)); rng = np.random.default_rng(7)
BEAT = 60 / 72; G = 7.1                                        # tempo; the glitch
mf = lambda m: 440 * 2 ** ((m - 69) / 12)
def fade(x, a, b):
    x = x.copy(); na, nb = min(int(a*SR), len(x)//2), min(int(b*SR), len(x)//2)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x
def saw(f, d, det=.005):
    tt = t_(d); return sum(2 * ((tt * f * (1 + k * det) + k * .31) % 1) - 1 for k in (-1, 0, 1)) / 3
def pad(notes, d, cut=900, v=.2):
    return fade(lp(sum(saw(mf(n), d) for n in notes) / len(notes), cut, 2), .9, .5) * v
def bell(m, v=1., detune=0.):
    d = 2.8; tt = t_(d); f = mf(m) * (1 + detune)
    x = sum(a * np.sin(2*np.pi*f*r*tt) * env_exp(d, tau) for r, a, tau in [(1, 1, .9), (2.0, .35, .5), (2.76, .25, .3), (5.4, .12, .12)])
    return x * np.minimum(1, tt / .004) * v
# space: a synthetic hall impulse response
ir_t = t_(2.6); ir = lp(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t / .9); ir /= np.abs(ir).sum() / 6
def verb(x, wet=.35): return x * (1 - wet) + fftconvolve(x, ir)[:len(x)] * wet

# 1. drone (D2 + fifth), until the glitch, and a darker one after
for a, b, base in [(0, G, 38), (G + .9, D, 37)]:
    d = b - a; tt = t_(d); f = mf(base)
    x = (np.sin(2*np.pi*f*tt) + .5*np.sin(4*np.pi*f*tt) + .25*np.sin(6*np.pi*f*tt) + .18*np.sin(2*np.pi*f*1.5*tt)) * (1 + .18*np.sin(2*np.pi*.2*tt))
    add(mus, fade(x, 1.0 if a == 0 else .4, .03 if a == 0 else 1.2) * .11, a)
# 2. pads: Dm then Bb, then a dissonant cluster after the glitch
add(mus, pad([62, 65, 69], 4 * BEAT + .6, 800, .16), .2, pan=-.2)
add(mus, pad([58, 62, 65, 69], G - (.2 + 4 * BEAT) + .02, 1000, .16), .2 + 4 * BEAT, pan=.2)
add(mus, pad([62, 63, 68, 50], D - (G + 1.3), 1300, .17), G + 1.3)
# 3. heartbeat pulse from bar 1, quickening into the glitch
def beat(v):
    d = .4; tt = t_(d); return (np.sin(2*np.pi*48*tt*(1-.3*tt)) * env_exp(d, .09) + .25*np.sin(2*np.pi*96*tt) * env_exp(d, .05)) * v
t0 = 1.6
while t0 < G - .05:
    add(mus, beat(.55), t0); add(mus, beat(.35), t0 + .28); t0 += BEAT if t0 < 5.2 else BEAT / 2
# 4. the music-box motif: D5 F5 A5 E5, then again an octave lower answer; after the glitch, flattened
for at, m, v in [(.9, 74, .5), (1.7, 77, .45), (2.5, 81, .45), (3.4, 76, .5), (4.4, 74, .4), (5.2, 77, .38), (6.0, 81, .36), (6.6, 80, .3)]:
    add(mus, bell(m, v * 1.3, rng.uniform(-.002, .002)), at, pan=rng.uniform(-.3, .3))
for at, m, v in [(8.9, 74, .42), (9.7, 77, .38), (10.5, 80, .36), (11.2, 75, .3)]:
    add(mus, bell(m, v, -.012), at, pan=rng.uniform(-.3, .3))          # detuned, wrong
# 5. riser into the glitch, then a hard cut
d = 1.6; tt = t_(d); r = (hp(noise(d), 900) * .5 + np.sin(2*np.pi*np.cumsum(180 + 900*(tt/d)**2) / SR) * .3) * (tt / d) ** 2.2
add(mus, r * .14, G - d)
cut = np.ones(N); a, b = int(G * SR), int((G + .02) * SR); cut[a:b] = np.linspace(1, 0, b - a); cut[b:int((G + .85) * SR)] = 0
cut[int((G + .85) * SR):] = 1; mus[:int((G + .85) * SR)] *= cut[:int((G + .85) * SR), None]
mus = np.stack([verb(mus[:, 0]), verb(mus[:, 1])], 1)
mus = np.stack([hp(c, 45) - .45 * lp(hp(c, 45), 130) for c in mus.T], 1)   # thinner low end for phone speakers
mus[-int(.5*SR):] *= np.linspace(1, 0, int(.5*SR))[:, None]
sf.write(os.path.join(H, 'story_score.wav'), mus.astype(np.float32), SR)
# mix: score under the sound design (knocks, hit and static stay on top)
sfxw, sr2 = sf.read(os.path.join(H, 'story_mix.wav'))
n = min(len(sfxw), len(mus)); sl = np.stack([c - .4 * lp(c, 120) for c in sfxw[:n].T], 1); mix = sl * .85 + mus[:n] * 1.0
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1)
sf.write(os.path.join(H, 'story_scored_mix.wav'), mix.astype(np.float32), SR); print('ok')
