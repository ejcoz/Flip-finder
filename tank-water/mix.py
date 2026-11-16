# Score, sound effects and mix for "The Water Tanks".
# Voice: the user's own recording (narration.mp3), untouched, placed at VO = 0.6 s.
# Rules from the brief: no effects while the voice speaks (effects are gated to the pauses),
# music at least 12 dB under the voice while it speaks (aimed at about 18 dB under).
import numpy as np, subprocess, os, sys, json, wave
from scipy.signal import lfilter, butter

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
VO = 0.6
DUR = 33.4
N = int(SR * DUR)
rng = np.random.default_rng(11)

# speech blocks in the recording (ffmpeg silencedetect, -38 dB, 0.12 s), shifted to film time
RAW_SPEECH = [(0.0, 4.56), (5.48, 8.56), (9.13, 13.00), (13.87, 17.34), (18.09, 21.38),
              (22.24, 25.26), (26.0, 28.99), (29.85, 32.45)]
SPEECH = [(a + VO, b + VO) for a, b in RAW_SPEECH]

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, fc, o=2): b, a = butter(o, min(fc / (SR / 2), .99)); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def db(x): return 20 * np.log10(max(x, 1e-9))
def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))

def put(buf, sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i] * g
    l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
    buf[0, i:i + len(sig)] += sig * l; buf[1, i:i + len(sig)] += sig * r

# ---------- voice ----------
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'narration.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                     capture_output=True, check=True).stdout
v = np.frombuffer(pcm, dtype=np.float32).astype(np.float64)
voice = np.zeros(N); i0 = int(VO * SR); voice[i0:i0 + len(v)] = v[: N - i0]

# ---------- instruments (synth pop-print kit) ----------
def kick():
    n = int(.3 * SR); t = np.arange(n) / SR; f = 48 + 100 * np.exp(-t * 28)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 1.5)
def hat():
    n = int(.05 * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * 90) * .3
def snap():
    n = int(.08 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 70) * .7
def pluck(m, dur=.4):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .35 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 30) + .12 * np.sin(4 * np.pi * f * t) * np.exp(-t * 12)
    return s * np.minimum(1, t / .002)
def bass(m, dur=.28):
    n = int(dur * SR); t = np.arange(n) / SR; ph = 2 * np.pi * mtof(m) * t
    s = lp(np.sin(ph) + .25 * np.sign(np.sin(ph)) + .3 * np.sin(2 * ph), 900)
    return s * np.minimum(1, t / .004) * np.exp(-t * 6)
def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for det in (-.12, .12): s += 2 / np.pi * np.arcsin(np.sin(2 * np.pi * mtof(m) * (1 + det / 100) * t))
    s = lp(s / (len(ms) * 2), 2000)
    return s * np.minimum(1, t / .3) * np.clip((dur - t) / .4, 0, 1)

# ---------- sound effects ----------
def stamp(big=False):
    n = int(.9 * SR); t = np.arange(n) / SR; f = 40 + 90 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (4 if big else 7))
    click = lp(rng.standard_normal(n), 3000) * np.exp(-t * 55)
    s = np.tanh((boom * 1.4 + click * .9) * 1.5)
    if big: s = s + hp(rng.standard_normal(n), 4000) * np.exp(-t * 3.2) * .3
    return s
def whoosh(dur=.5, up=True):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        p = i / n; fc = 400 + 3500 * (p if up else 1 - p)
        out[i:i + 512] = bp(x[max(0, i - 2048):i + 512], fc * .7, fc * 1.3)[-len(x[i:i + 512]):]
    return out * np.sin(np.pi * t / dur) ** 2 * 1.1
def paper_slap():
    n = int(.35 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 300, 5000) * np.exp(-t * 22) + .6 * np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18)
def flap():
    n = int(.2 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 500, 3500) * np.exp(-t * 30) * .8
def slosh():
    n = int(.75 * SR); t = np.arange(n) / SR; out = np.zeros(n)
    base = lp(rng.standard_normal(n), 900) * np.sin(np.pi * t / .75) ** 1.5 * .5
    for k in range(9):  # bubbles rising in pitch
        st = rng.uniform(0, .6); m = n - int(st * SR); tt = np.arange(m) / SR
        f = rng.uniform(300, 700) * (1 + 2.5 * tt)
        out[int(st * SR):] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28) * .35
    return base + out
def clank():
    n = int(.6 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(420, 9, .5), (1130, 14, .3), (2310, 20, .2), (3470, 26, .12)])
    return s + lp(rng.standard_normal(n), 2500) * np.exp(-t * 60) * .6
def tick():
    out = np.zeros(int(.3 * SR))
    for off, lo in ((0, 2500), (.07, 1800)):
        n = int(.12 * SR); t = np.arange(n) / SR; i = int(off * SR)
        out[i:i + n] += bp(rng.standard_normal(n), lo, 8000) * np.exp(-t * 45) * .7
    return out

def render():
    mus = np.zeros((2, N)); sfx = np.zeros((2, N))
    # ----- score: D minor, 96 bpm, bar = 2.5 s -----
    BEAT = 60 / 96; BAR = 4 * BEAT
    prog = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]  # Dm Bb F C
    motif = [74, None, 72, 69, None, 69, 72, None]
    t = 0.0; bar = 0
    silent = [(13.45, 14.5), (25.8, 26.35), (32.95, 99)]  # near-silences before the turn and the collapse
    def quiet(x): return any(a <= x < b for a, b in silent)
    while t < DUR:
        root, chord = prog[bar % 4]
        if not quiet(t): put(mus, pad(chord, BAR + .3), t, .10)
        for k in range(8):
            tt = t + k * BEAT / 2
            if tt >= DUR or quiet(tt): continue
            put(mus, bass(root + (12 if k % 4 == 3 else 0)), tt, .30)
            put(mus, hat(), tt + BEAT / 4, .5, .3)
            if k % 4 == 0: put(mus, kick(), tt, .45)
            if k % 4 == 2 and tt > 14.5: put(mus, snap(), tt, .35, -.3)
            m = motif[k]
            if m and bar % 2 == 1: put(mus, pluck(m), tt, .18, .25)
        t += BAR; bar += 1
    put(mus, pluck(74, .8), 0.0, .35); put(mus, pluck(62, .8), 0.0, .25)  # opening sting
    # ----- effects (film time) -----
    put(sfx, stamp(), 0.0, .55); put(sfx, paper_slap(), 0.0, .5)
    put(sfx, whoosh(.45), 5.36, .5); put(sfx, flap(), 5.92, .6)
    put(sfx, stamp(), 9.28 - .01, .8)
    put(sfx, slosh(), 13.66, .6)
    put(sfx, clank(), 18.33, .55); put(sfx, whoosh(.4), 18.12, .35)
    put(sfx, tick(), 22.03, .8); put(sfx, whoosh(.4), 22.3, .4)
    put(sfx, whoosh(.35, False), 25.88, .45); put(sfx, paper_slap(), 26.2, .8)
    put(sfx, whoosh(.45), 29.72, .45)
    put(sfx, stamp(True), 33.11, .9)
    return mus, sfx

mus, sfx = render()

# gate: effects only in the pauses (20 ms fades), so none sit on a spoken word
gate = np.ones(N)
for a, b in SPEECH:
    gate[int((a - .03) * SR):int((b + .03) * SR)] = 0
k = int(.02 * SR); gate = np.convolve(gate, np.ones(k) / k, mode='same')
sfx *= gate
for a, b in SPEECH:  # and nothing at all inside a block (belt and braces)
    sfx[:, int(a * SR):int(b * SR)] = 0

# music level: per speech block, 18 dB under that block's voice RMS; slightly up in pauses
vr = {i: rms(voice[int(a * SR):int(b * SR)]) for i, (a, b) in enumerate(SPEECH)}
mgain = np.full(N, 10 ** ((db(np.mean(list(vr.values()))) - 15 - db(rms(mus[0]))) / 20))
for i, (a, b) in enumerate(SPEECH):
    seg_m = rms(mus[0, int(a * SR):int(b * SR)])
    mgain[int((a - .15) * SR):int((b + .1) * SR)] = 10 ** ((db(vr[i]) - 18 - db(seg_m)) / 20)
k = int(.12 * SR); mgain = np.convolve(mgain, np.ones(k) / k, mode='same')
mus *= mgain

# follow the voice: in every 50 ms frame inside speech, keep the bed 20 dB under the voice
# envelope (max-held over +-250 ms so it doesn't pump between syllables)
FR = int(.05 * SR); nf = N // FR
venv = np.array([rms(voice[i * FR:(i + 1) * FR]) for i in range(nf)])
menv = np.array([rms(mus[0, i * FR:(i + 1) * FR]) for i in range(nf)])
from scipy.ndimage import maximum_filter1d, uniform_filter1d
vh = maximum_filter1d(venv, 3)
mh = maximum_filter1d(menv, 7)
g = np.minimum(1.0, (vh * 10 ** (-25 / 20)) / np.maximum(mh, 1e-9))
inside = np.zeros(nf, bool)
for a_, b_ in SPEECH: inside[int((a_ - .2) * SR) // FR:int((b_ + .1) * SR) // FR] = True
g = np.where(inside, g, 1.0)
g = np.minimum.accumulate(np.stack([g, np.roll(g, 1), np.roll(g, -1)]), axis=0)[-1]
g = uniform_filter1d(g, 3)
gs = np.repeat(g, FR); gs = np.concatenate([gs, np.full(N - len(gs), gs[-1])])
mus *= gs

# effects level in the pauses: peaks around the voice's peaks
sfx *= (np.max(np.abs(voice)) * .8) / max(np.max(np.abs(sfx)), 1e-9)

mix = mus + sfx + voice[None, :]
# fade the last 60 ms so the stamp tail doesn't click
f = int(.06 * SR); mix[:, -f:] *= np.linspace(1, 0, f)
mix /= max(1.0, np.max(np.abs(mix)) / .95)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
def wav(path, x):
    x = np.clip(x, -1, 1); d = (x.T * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
wav(os.path.join(HERE, 'out', 'mix.wav'), mix)

# check: in every 400 ms window inside speech, (music+effects) vs voice
worst = 99; worst_t = 0
win = int(.4 * SR)
for a, b in SPEECH:
    for s in range(int(a * SR), int(b * SR) - win, win // 2):
        vv = rms(voice[s:s + win])
        if vv < 0.01: continue  # breath gaps inside a block
        bed = rms((mus[0] + sfx[0])[s:s + win])
        d = db(vv) - db(bed)
        if d < worst: worst, worst_t = d, s / SR
print(f'voice-over-bed margin: worst {worst:.1f} dB at {worst_t:.2f}s; effects inside speech: {np.max(np.abs(sfx[:, [i for a,b in SPEECH for i in range(int(a*SR), int(b*SR), 441)]])):.5f}')
