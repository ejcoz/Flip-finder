"""Alcatraz: Case Open — score, foley and mix.

The user's narration (voice/narration.wav) is used as it is, placed at VO = 1.00 s.
Rules from the brief:
  * music and SFX stay at least 12 dB below the voice while it speaks (sidechain duck, verified below);
  * no effects over spoken words (every SFX is gated by a voice-activity envelope);
  * a low, tense music bed (synth pad, soft square bass, heartbeat kick, marimba pluck in the gaps).
Reads events.json (exported from the page by events.mjs). Writes out/mix.wav, out/music.wav, out/sfx.wav.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy.ndimage import uniform_filter1d, maximum_filter1d

LIB = os.environ.get('LIB', '/root/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx as S  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
SR = S.SR
VO = 1.0
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur']
N = int(round(DUR * SR))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
rng = np.random.default_rng(3)

# ---------------- voice (as delivered) ----------------
v, vsr = sf.read(os.path.join(HERE, 'voice', 'narration.wav'), dtype='float64')
if v.ndim > 1: v = v.mean(axis=1)
assert vsr == SR, vsr
voice = np.zeros(N)
s0 = int(VO * SR); voice[s0:s0 + len(v)] = v[:N - s0]
voice *= 0.5 / np.abs(voice).max()   # level only; the mux normalizes the whole film

# voice activity: 10 ms RMS against the file's own speech level, held 120 ms each side
hop = int(0.01 * SR)
rms = np.sqrt(uniform_filter1d(voice ** 2, hop))
thr = np.percentile(rms[rms > 1e-5], 90) * 10 ** (-30 / 20)
act = (rms > thr).astype(float)
act = maximum_filter1d(act, int(0.24 * SR))            # dilate ±120 ms
# fill tiny holes (< 180 ms) so the gate doesn't flutter between words
hole = 1 - maximum_filter1d(act, int(0.18 * SR))
act = np.maximum(act, 1 - maximum_filter1d(hole, int(0.18 * SR)))
vad = uniform_filter1d(act, int(0.04 * SR))           # 40 ms ramps
gate = 1 - np.clip(uniform_filter1d(maximum_filter1d(act, int(0.12 * SR)), int(0.04 * SR)), 0, 1)
venv = np.sqrt(uniform_filter1d(voice ** 2, int(0.12 * SR))) + 1e-9
speaking = uniform_filter1d((rms > thr).astype(float), int(0.4 * SR))

# ---------------- score: 84 bpm, D minor ----------------
BEAT = 60 / 84
mus = np.zeros(N)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def place(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    x = x[:len(buf) - i]; buf[i:i + len(x)] += x * g
def tri_pad(midis, d, att=1.2, rel=1.2):
    tt = np.arange(int(d * SR)) / SR; x = np.zeros_like(tt)
    for m in midis:
        f = mtof(m)
        for k, a in [(1, 1), (3, 1 / 9), (5, 1 / 25), (2, 0.12)]:
            x += a * np.sin(2 * np.pi * f * k * tt * (1 + 0.0015 * np.sin(2 * np.pi * 0.3 * tt + m)))
    e = np.minimum(1, tt / att) * np.minimum(1, (d - tt) / rel)
    return S.lp(x * e, 2200) / len(midis)
def bass(m, d):
    tt = np.arange(int(d * SR)) / SR; f = mtof(m)
    sq = np.sign(np.sin(2 * np.pi * f * tt)) * 0.35 + np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt) + 0.25 * np.sin(6 * np.pi * f * tt)
    return S.lp(sq, 700) * np.exp(-tt / 0.16) * np.minimum(1, tt / 0.004)
def kick(v=1.0):
    d = 0.4; tt = np.arange(int(d * SR)) / SR
    f = 52 + 60 * np.exp(-tt / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.12) * v
def marimba(m, v=1.0):
    d = 0.9; tt = np.arange(int(d * SR)) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.32) + 0.35 * np.sin(2 * np.pi * f * 3.98 * tt) * np.exp(-tt / 0.06)) * v * np.minimum(1, tt / 0.002)

CH = [[50, 53, 57], [50, 53, 58], [50, 55, 58], [49, 52, 57]]   # Dm, Bb/D, Gm/D, A
ROOT = [38, 34, 31, 33]
BAR2 = 8 * BEAT
# pad: continuous, chord every two bars; drops out in the two silences
t = 0.0; k = 0
while t < DUR:
    place(mus, tri_pad(CH[k % 4], BAR2 + 1.4), t, 0.55); t += BAR2; k += 1
# tension rise into the bed reveal: an extra high pad voice 17.1 → 21.7
place(mus, tri_pad([62, 65], 4.8, att=3.6, rel=0.8), 17.0, 0.35)
# bass pulse in 8ths: cells and roof/raft
def pulse_section(a, b, g):
    n = int((b - a) / (BEAT / 2))
    for i in range(n):
        tt = a + i * BEAT / 2; ch = int(tt / BAR2) % 4
        place(mus, bass(ROOT[ch] + (12 if i % 4 == 3 else 0), BEAT / 2), tt, g * (1.0 if i % 2 == 0 else 0.7))
pulse_section(5.4, 12.6, 0.30)
pulse_section(23.1, 27.8, 0.30)
# heartbeat kick on beats 1 and 3
for a, b in [(0.0, 21.8), (23.1, 27.8), (28.4, 29.8)]:
    tt = a
    while tt < b: place(mus, kick(), tt, 0.55); tt += 2 * BEAT
# marimba motif, only in voice gaps
for at in [4.62, 12.48, 27.80]:
    for i, m in enumerate([74, 77, 76, 69]): place(mus, marimba(m), at + i * BEAT / 3, 0.28)
# ending: low D drone resolve under the last line
place(mus, tri_pad([50, 57, 62], DUR - 30.9 + 0.2, att=0.8, rel=0.25), 30.9, 0.5)
# silences: empty the music before the turn and before the stamp
silence = np.ones(N); tt = np.arange(N) / SR
for a, b in [(21.80, 23.10), (29.85, 30.92)]:
    silence *= 1 - np.clip(np.minimum((tt - a) / 0.25, (b - tt) / 0.2), 0, 1) * 0.97
mus *= silence
mus = S.hp(mus, 35)

# ---------------- foley (gaps only) ----------------
fx = np.zeros(N)
def wind(d):
    x = S.bp(S.noise(d), 250, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * S.t_(d)))
    return S.norm(x) * np.sin(np.pi * S.t_(d) / d) ** 2
def water(d):
    x = S.lp(S.brown(d), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * S.t_(d)) ** 2)
    return S.norm(x)
def clank():
    d = 0.6; tt = S.t_(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, a, tau in [(523, 1, .25), (1367, .6, .12), (2210, .4, .08), (3150, .25, .05)])
    return S.norm(x + S.hp(S.noise(d), 2000) * np.exp(-tt / .005))
def splash():
    d = 0.55; tt = S.t_(d)
    return S.norm(S.bp(S.noise(d), 300, 3000) * np.exp(-tt / 0.13) * np.minimum(1, tt / 0.01))
def paper():
    d = 0.22; tt = S.t_(d)
    return S.norm(S.bp(S.noise(d), 1500, 6000) * np.sin(np.pi * tt / d) ** 2)
def stamp():
    d = 0.38; tt = S.t_(d)
    f = 45 + 90 * np.exp(-tt / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.09)
    crack = S.hp(S.noise(d), 1500) * np.exp(-tt / 0.012) * 0.8 + S.bp(S.noise(d), 800, 4000) * (rng.random(len(tt)) > 0.97) * np.exp(-tt / 0.05) * 0.6
    x = S.norm(boom + crack); x *= np.clip((d - tt) / 0.06, 0, 1)
    return x
def hum(d):
    tt = S.t_(d); return S.norm(sum(a * np.sin(2 * np.pi * f * tt) for f, a in [(60, 1), (120, .6), (180, .3), (240, .2)])) * np.minimum(1, tt / .2)

for e in ev['ev']:
    ty, at, g = e['type'], e['t'], e.get('v', 1.0)
    if ty == 'amb_island':
        d = e['d'] + 0.3; x = water(d) * 0.5 + hum(d) * 0.12 + wind(d) * 0.25
        x *= np.clip((d - S.t_(d)) / 0.4, 0, 1); place(fx, x, at, 0.7)
    elif ty == 'whoosh': place(fx, S.whoosh(0.32), at, 0.35 * g)
    elif ty == 'clank': place(fx, clank(), at, 0.35)
    elif ty == 'step': place(fx, S.lp(S.step(1.0), 2500) + S.thump(0.6, 110)[:2400], at, 0.42 * g)
    elif ty == 'click': place(fx, S.click(0.6), at, 0.4)
    elif ty == 'wind': place(fx, wind(e['d']), at, 0.25)
    elif ty == 'splash': place(fx, splash(), at, 0.45)
    elif ty == 'thunk': place(fx, S.thump(1.0, 95), at, 0.6)
    elif ty == 'paper': place(fx, paper(), at, 0.3)
    elif ty == 'stamp': place(fx, stamp(), at, 0.9)
fx *= gate   # no effects over spoken words

# ---------------- duck: music ≥ 12 dB under the voice while it speaks ----------------
vr = np.median(venv[vad > 0.99])
mus *= (vr * 10 ** (-9 / 20)) / (np.sqrt(np.mean(mus[mus != 0] ** 2)) + 1e-9)   # gap level ≈ 9 dB under the speech level
menv = np.sqrt(uniform_filter1d(mus ** 2, int(0.12 * SR))) + 1e-9
target = venv * 10 ** (-18 / 20)                      # aim 18 dB under, check ≥ 12 dB
g_speech = np.minimum(10 ** (-7 / 20), target / menv)
g = 1 - vad + vad * g_speech
g = -maximum_filter1d(-g, int(0.06 * SR))             # hold the lowest gain a little (no gain spikes)
g = uniform_filter1d(g, int(0.03 * SR))
mus *= g

# ---------------- sum ----------------
mix = voice + mus + fx
end_fade = np.clip((N - np.arange(N)) / (0.08 * SR), 0, 1)
mix *= end_fade
pk = np.abs(mix).max(); mix *= 0.89 / pk
stereo = np.stack([mix, mix], axis=1)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), stereo.astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'out', 'music.wav'), (mus * 0.89 / pk).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'out', 'sfx.wav'), (fx * 0.89 / pk).astype(np.float32), SR, subtype='FLOAT')

# ---------------- verify the brief's mix rules ----------------
w = int(0.4 * SR); worst_m, worst_f = 99, 99
for i in range(0, N - w, w // 4):
    if vad[i:i + w].min() < 0.99 or speaking[i + w // 2] < 0.6: continue   # windows where the voice is sounding
    vv = np.sqrt(np.mean(voice[i:i + w] ** 2)); mm = np.sqrt(np.mean(mus[i:i + w] ** 2)) + 1e-12; ff = np.sqrt(np.mean(fx[i:i + w] ** 2)) + 1e-12
    worst_m = min(worst_m, 20 * np.log10(vv / mm)); worst_f = min(worst_f, 20 * np.log10(vv / ff))
print(f'voice-over-music, worst 400 ms window while speaking: {worst_m:.1f} dB (need >= 12)')
print(f'voice-over-sfx,   worst 400 ms window while speaking: {worst_f:.1f} dB (gated)')
if worst_m < 12: sys.exit('music too loud under the voice')
