"""Pixel Scan score: pure chiptune at 120 BPM, generated from the picture's own timeline (events.json).
Pulse lead + pulse arpeggio, triangle bass, noise drums; sweeps, ticks and a coin cue sit on the picture's events.
Usage: python music.py <events.json> <out.wav>"""
import json, sys
import numpy as np
import soundfile as sf

SR, BEAT = 44100, 0.5
BAR = 4 * BEAT
ev = json.load(open(sys.argv[1]))
DUR = ev['dur']
N = int(DUR * SR) + SR
L = np.zeros(N); R = np.zeros(N)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def env(n, a=0.003, d=0.06, s=0.6, r=0.03):
    t = np.arange(n) / SR; dur = n / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((dur - t) / r, 0, 1)
    return e * rel

def pulse(f, dur, duty=0.5, vib=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = np.cumsum(np.full(n, f) * (1 + vib * np.sin(2 * np.pi * 6 * t))) / SR
    return np.where((ph % 1) < duty, 1.0, -1.0)

def tri(f, dur):
    n = int(dur * SR); ph = (np.arange(n) * f / SR) % 1
    return 4 * np.abs(ph - 0.5) - 1

def noise(dur, seed):
    return np.random.default_rng(seed).uniform(-1, 1, int(dur * SR))

def lowpass(x, k=0.35):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += k * (v - acc); y[i] = acc
    return y

def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[:j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))

def note(t, m, dur, gain, duty=0.5, pan=0.0, vib=0.0, **e):
    add(pulse(mtof(m), dur, duty, vib) * env(int(dur * SR), **e), t, gain, pan)

def kick(t, g=0.5):
    n = int(0.16 * SR); tt = np.arange(n) / SR
    f = 45 + 120 * np.exp(-tt * 40)
    add(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 22) * 0.6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18), t, g * 0.5)

def snare(t, g=0.5, seed=1):
    x = noise(0.14, seed); x = x - lowpass(x, 0.2)
    add(x * np.exp(-np.arange(len(x)) / SR * 28), t, g * 0.45)

def hat(t, g=0.3, seed=2, long=False):
    x = noise(0.25 if long else 0.035, seed); x = x - lowpass(x, 0.5)
    add(x * np.exp(-np.arange(len(x)) / SR * (8 if long else 90)), t, g * 0.35, pan=0.25)

def sweep(t, f0, f1, dur, gain, duty=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    ph = np.cumsum(f) / SR
    add(np.where((ph % 1) < duty, 1.0, -1.0) * env(n, d=dur, s=0.7, r=0.05), t, gain)

# chords per bar
MINOR = [(57, [0, 3, 7]), (53, [0, 4, 7]), (48, [0, 4, 7]), (55, [0, 4, 7])]   # Am F C G
MAJOR = [(48, [0, 4, 7]), (53, [0, 4, 7]), (55, [0, 4, 7]), (48, [0, 4, 7])]   # C F G C (key up)
MOTIF = [[0, None, 2, 1, None, 2, 4, None], [4, None, 3, 2, None, 1, 2, 3]]

def tones(root, q, k):  # chord-tone ladder: root, 3rd, 5th, oct, oct+3rd ...
    return root + q[k % 3] + 12 * (k // 3)

secs = [e for e in ev['ev'] if e['type'] == 'section']
for si, s in enumerate(secs):
    t0, bars, mood = s['t'], s['bars'], s['mood']
    for b in range(bars):
        tb = t0 + b * BAR
        gbar = int(round(tb / BAR))
        turn = s.get('final') and b == bars - 1     # loop turnaround: the last bar is a groove bar on G, leading back into bar 1 (Am)
        md = 'groove' if turn else mood
        root, q = MINOR[3] if turn else (MAJOR if md == 'triumph' else MINOR)[gbar % 4]
        last_drop = s['drop'] and b == bars - 1
        if last_drop:   # one bar of near-silence before the finale: a faint held chord only
            for k in range(3): note(tb, tones(root + 12, q, k), BAR, 0.035, duty=0.5, a=0.3, d=0.1, s=1, r=0.5)
            continue
        if md == 'stripped':  # setback: drone bass, held chord, slow detuned lead, no drums
            add(tri(mtof(root - 12), BAR) * env(int(BAR * SR), a=0.02, d=0.1, s=0.9, r=0.1), tb, 0.13)
            for k in range(3): note(tb, tones(root + 12, q, k), BAR, 0.05, duty=0.5, a=0.05, s=0.9, r=0.2)
            for j, k in enumerate([2, 1]): note(tb + j * 2 * BEAT, tones(root + 12, q, k) - 1 + j, 2 * BEAT * 0.9, 0.11, duty=0.125, vib=0.012, s=0.8)
            continue
        # groove / triumph
        for e8 in range(8):
            te = tb + e8 * BEAT / 2
            bn = root - 12 + (12 if e8 % 2 else 0)
            add(tri(mtof(bn), BEAT / 2 * 0.9) * env(int(BEAT / 2 * 0.9 * SR), s=0.8), te, 0.21)
            hat(te, 0.5 if e8 % 2 == 0 else 0.3, seed=e8 + gbar * 8)
            if md == 'triumph': hat(te + BEAT / 4, 0.2, seed=99 + e8)
        for bt in range(4):
            if bt in (0, 2) or (md == 'triumph' and bt == 3): kick(tb + bt * BEAT)
            if bt in (1, 3): snare(tb + bt * BEAT, seed=gbar * 4 + bt)
        mot = MOTIF[gbar % 2]
        up = 12 if md == 'triumph' else 0
        for e8, k in enumerate(mot):
            if k is None: continue
            note(tb + e8 * BEAT / 2, tones(root + 12 + up, q, k), BEAT / 2 * 0.85, 0.13, duty=0.25, pan=0.0)
        if si >= 2 or md == 'triumph':   # arpeggio voice once things improve
            for e16 in range(16):
                note(tb + e16 * BEAT / 4, tones(root + 24, q, [0, 1, 2, 3][e16 % 4]), BEAT / 4 * 0.7, 0.045 if md != 'triumph' else 0.06, duty=0.125, pan=-0.3, d=0.03, s=0.4)
        if b == 0 and md == 'triumph': hat(tb, 0.9, seed=7, long=True)   # crash

# effects on the picture's events
for e in ev['ev']:
    t = e['t']
    if e['type'] == 'sweep': sweep(t, 500, 1700, 0.45, 0.08)
    elif e['type'] == 'fall': sweep(t, 1500, 140, 1.0, 0.1, duty=0.5)
    elif e['type'] == 'tick': note(t, 84 + e['k'], 0.04, 0.05, duty=0.5, d=0.02, s=0.3, r=0.01)
    elif e['type'] == 'blip':   # hook line lands: a short rising blip per line
        note(t, 76 + 3 * e['k'], 0.07, 0.07, duty=0.25, d=0.04, s=0.5, r=0.02); note(t + 0.07, 81 + 3 * e['k'], 0.09, 0.06, duty=0.25, d=0.05, s=0.4)
    elif e['type'] == 'cap':    # caption pops in: soft two-note chirp
        note(t, 88, 0.035, 0.035, duty=0.125, d=0.02, s=0.4, r=0.01); note(t + 0.04, 93, 0.05, 0.03, duty=0.125, d=0.03, s=0.3)
    elif e['type'] == 'lens':   # the lens opens: a quick upward glide and a soft pop
        sweep(t, 300, 1200, 0.22, 0.06, duty=0.125); note(t + 0.22, 91, 0.06, 0.05, duty=0.5, d=0.03, s=0.4)
    elif e['type'] == 'coin':
        note(t, 83, 0.08, 0.11, duty=0.5, s=0.9); note(t + 0.08, 88, 0.35, 0.11, duty=0.5, d=0.2, s=0.5)
    elif e['type'] == 'rewind':   # the scan runs back up: a falling-then-rising glide into the loop
        sweep(t, 1600, 600, 0.5, 0.06, duty=0.25); sweep(t + BAR - 0.35, 400, 1300, 0.33, 0.05, duty=0.125)
    elif e['type'] == 'confetti':
        for j in range(12): note(t + 0.4 + j * 0.06, 84 + [0, 4, 7, 12][j % 4] + 12 * (j // 8), 0.08, 0.05, duty=0.125, pan=(-0.4 if j % 2 else 0.4))

# end: no ring-out or fade (the film loops); a 15 ms declick only
out = np.stack([L, R], 1)[:int(DUR * SR)]
dc = int(0.015 * SR); out[-dc:] *= np.linspace(1, 0, dc)[:, None]; out[:dc] *= np.linspace(0, 1, dc)[:, None]
out /= max(1e-9, np.abs(out).max()) / 0.89
sf.write(sys.argv[2], out, SR)
print('score', sys.argv[2], f'{DUR:.1f}s')
