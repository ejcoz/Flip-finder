"""Score + foley + the user's narration → out/mix.wav

Rules from the brief:
- the narration is used as recorded (only the leading silence was trimmed) and starts at frame 0;
- music and effects stay ≥ 12 dB under the voice while it speaks (checked at the end, per 200 ms window);
- no effect overlaps a spoken word: every effect is placed inside a measured pause and gated to it;
- no music before the first word; the music stops at 31.37 s and the last line plays alone.
"""
import json, sys, os
import numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d, maximum_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', '/root/lemo-opuscar'), 'core', 'audio'))
import sfx
from sfx import SR, t_, env_exp, lp, hp, bp, noise, norm, add

ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur']; N = int(DUR * SR)
EV = ev['ev']
GAPS = [(e['t'], e['t1']) for e in EV if e['type'] == 'gap']
MSTOP = next(e['t'] for e in EV if e['type'] == 'musicstop')

# ── voice ──
v, vsr = sf.read(os.path.join(HERE, 'voice', 'narration.wav'))
assert vsr == SR
if v.ndim > 1: v = v.mean(1)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
# voice activity envelope (for ducking and for the check)
venv = np.sqrt(uniform_filter1d(voice ** 2, int(.05 * SR)))
vact = maximum_filter1d((venv > 10 ** (-42 / 20) * np.abs(voice).max()).astype(float), int(.12 * SR))
vact = uniform_filter1d(vact, int(.04 * SR))

# ── score: 96 BPM, D minor, synth pop-print toolkit ──
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT
m = np.zeros((N, 2))
def mtof(n): return 440 * 2 ** ((n - 69) / 12)
def tri(f, d):
    tt = t_(d); return 2 * np.abs(2 * ((tt * f) % 1) - 1) - 1
def pad(notes, at, d, g):
    x = sum(tri(mtof(n), d) + .5 * tri(mtof(n) * 1.004, d) for n in notes)
    a = np.minimum(1, t_(d) / .4) * np.minimum(1, (d - t_(d)) / .5)
    add(m, lp(x, 1800) * a, at, g)
def bass(n, at, d=BEAT / 2 * .9, g=.5):
    tt = t_(d); f = mtof(n); x = np.tanh(2.2 * np.sin(2 * np.pi * f * tt)) + .35 * np.sin(4 * np.pi * f * tt) + .2 * np.sin(6 * np.pi * f * tt)
    add(m, lp(x, 900) * env_exp(d, .12), at, g)
def pluck(n, at, g=.35, pan=0):
    d = .9; tt = t_(d); f = mtof(n)
    x = np.sin(2 * np.pi * f * tt) * env_exp(d, .28) + .45 * np.sin(2 * np.pi * f * 3.99 * tt) * env_exp(d, .05)
    add(m, x, at, g, pan)
def snap(at, g=.4):
    d = .08; x = bp(noise(d), 1500, 4500) * env_exp(d, .012); add(m, norm(x), at, g, .3)
def tick(at, g=.25):
    d = .04; x = hp(noise(d), 5000) * env_exp(d, .006); add(m, norm(x), at, g, -.2)
def kick(at, g=.5):
    d = .3; tt = t_(d); x = np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt) * env_exp(d, .09); add(m, x, at, g)

CH = [(50, [62, 65, 69]), (46, [62, 65, 70]), (43, [62, 67, 70]), (45, [61, 64, 69])]   # Dm Bb Gm A
nb = int(MSTOP / BEAT) + 1
for b in range(nb):
    at = b * BEAT; ci = (b // 8) % 4; root, notes = CH[ci]
    if b % 8 == 0: pad(notes, at, 8 * BEAT, .10 if at < 15.6 else .07)
    night = 15.6 <= at < 23.3
    if at >= 4.4 and not (23.3 <= at < 26.7):
        for h in range(2): bass(root - 12 + (7 if (b % 4 == 3 and h) else 0), at + h * BEAT / 2, g=.42)
    if night and b % 2 == 1: snap(at)
    if 10.45 <= at < 15.6 or at >= 29.6:
        mel = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[1] + 12]
        pluck(mel[b % 4], at + BEAT / 2, .22, (b % 3 - 1) * .4)
    if 26.7 <= at < 29.6:
        dens = 2 + int(6 * (at - 26.7) / 2.9)
        for k in range(dens): tick(at + k * BEAT / dens, .18 + .1 * (at - 26.7) / 2.9)
    if at >= 4.4 and b % 4 == 0 and not night and not (23.3 <= at < 26.7): kick(at, .35)
# no music before the first word, none after the stop
fade_in = np.minimum(1, np.arange(N) / (.25 * SR))
stop = np.clip((MSTOP - np.arange(N) / SR) / .06, 0, 1)
m *= (fade_in * stop)[:, None]

# ── foley, only inside pauses ──
f = np.zeros((N, 2))
def stamp_boom():
    d = .5; tt = t_(d)
    return norm(np.sin(2 * np.pi * (140 * np.exp(-tt * 6) + 45) * tt) * env_exp(d, .12) + hp(noise(d), 2000) * env_exp(d, .006) * .6)
def paper_slide(d=.36):
    return norm(bp(noise(d), 900, 5000) * np.sin(np.pi * t_(d) / d) ** 1.5)
def walkie():
    a = sfx.click(.6, 1); b = sfx.quindar(1, 1900)[:int(.12 * SR)]; s = bp(noise(.25), 1200, 3800) * .4
    out = np.zeros(int(.5 * SR)); out[:len(a)] += a; out[int(.06 * SR):int(.06 * SR) + len(b)] += b; out[int(.2 * SR):int(.2 * SR) + len(s)] += s * env_exp(.25, .08)
    return norm(out)
def burst():
    d = 1.0; out = sfx.thump(1, 55); x = np.zeros(int(d * SR)); x[:len(out)] += out
    cr = sfx.crash(.6)[:int(.85 * SR)]; x[int(.03 * SR):int(.03 * SR) + len(cr)] += cr * .6
    x += lp(noise(d), 500) * env_exp(d, .25) * .5
    return norm(x)
def clunk():
    d = .26; tt = t_(d)
    return norm(np.sin(2 * np.pi * 70 * tt) * env_exp(d, .06) + bp(noise(d), 300, 2500) * env_exp(d, .02) * .8)
def eject():
    a = sfx.clack(.9, 1); b = sfx.click(.5, .7); out = np.zeros(int(.2 * SR)); out[:len(a)] += a; out[int(.07 * SR):int(.07 * SR) + len(b)] += b; return norm(out)
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'slide': add(f, paper_slide(), t, .35, .2)
    elif ty == 'whoosh': add(f, sfx.whoosh(.32), t, .3)
    elif ty == 'burst': add(f, burst(), t, .7)
    elif ty == 'walkie': add(f, walkie(), t, .35, .4)
    elif ty == 'eject': add(f, eject(), t, .45)
    elif ty == 'stamp': add(f, stamp_boom(), t, .65)
    elif ty == 'taps':
        for k in range(4): add(f, sfx.click(1.3 + k * .1, 1), t + k * .09, .25, (k - 1.5) * .3)
    elif ty == 'clunk': add(f, clunk(), t, .6)
# gate effects to the pauses, 30 ms inside each edge
gate = np.zeros(N)
for a0, b0 in GAPS: gate[int((a0 + .03) * SR):int((b0 - .03) * SR)] = 1
gate = uniform_filter1d(gate, int(.012 * SR)); gate[gate < 1e-3] = 0
f *= gate[:, None]
SPEECH = np.ones(N, bool); SPEECH[int(35.02 * SR):] = False
for a0, b0 in GAPS: SPEECH[int(a0 * SR):int(b0 * SR)] = False

# ── balance: music ≥ 12 dB under the voice while it speaks ──
vrms = np.sqrt(np.mean(voice[SPEECH] ** 2))
mono = m.mean(1); mrms = np.sqrt(np.mean(mono[mono != 0] ** 2)) + 1e-12
m *= vrms * 10 ** (-16 / 20) / mrms                    # base: 16 dB under the average speech level
# voice-following gain: inside speech, the bed never rises above (voice − 14 dB) in any 200 ms window
win = int(.2 * SR)
for _ in range(3):
    ve = np.sqrt(np.maximum(0, uniform_filter1d(voice ** 2, win))); me = np.sqrt(np.maximum(0, uniform_filter1d(m.mean(1) ** 2, win))) + 1e-12
    g = np.where(SPEECH, np.minimum(1, ve * 10 ** (-14 / 20) / me), 1.0)
    g = -maximum_filter1d(-g, win)                      # take the window minimum so the gain covers the whole window
    g = uniform_filter1d(g, int(.03 * SR))
    m *= g[:, None]
f *= vrms * 10 ** (-6 / 20) / (np.abs(f).max() + 1e-12) * 2.2   # effects lead in the pauses

mix = np.stack([voice, voice], 1) + m + f
pk = np.abs(mix).max(); mix *= .89 / pk
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')

# ── check: per 200 ms window inside speech, bed (music + effects) vs voice ──
w = int(.2 * SR); worst = 99; bad = 0
bed = (m + f).mean(1) * .89 / pk; vv = voice * .89 / pk
for i in range(0, N - w, w // 4):
    if not SPEECH[i:i + w].all(): continue
    vr = np.sqrt(np.mean(vv[i:i + w] ** 2)); br = np.sqrt(np.mean(bed[i:i + w] ** 2)) + 1e-12
    d = 20 * np.log10(vr / br); worst = min(worst, d); bad += d < 12
fx = float(np.abs(f[SPEECH]).max())
print(f'mix.wav written · voice over bed, worst 200 ms window in speech: {worst:.1f} dB · windows under 12 dB: {bad} · effects peak during speech: {fx:.6f}')
