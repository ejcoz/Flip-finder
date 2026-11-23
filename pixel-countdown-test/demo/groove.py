"""groove.py — the Pixel Countdown Science music engine (original, numpy only).
A continuous beat-driven chip track like the genre's: pitch-drop kick, gated chip bass, pumping pulse-wave chords,
off-beat hats, 16th arps, snare builds into the hard silence, a riser, an impact on the reveal, and an end lead.
Every part is locked to a grid that each film sets so the count ticks land on beats.

music(sections, dur) -> stereo float array (N, 2) at 48 kHz.
section = dict(t0, t1, origin, bpm, prog=[(root_midi, 'min'|'maj'), …] one chord per bar,
               layers={'kick','bass','pad','hat','arp','snare','build','half','lead'}, lead=[(midi|None, beats), …], gain)
"""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
_rng = np.random.default_rng(11)
def ns(d): return max(1, int(round(d * SR)))
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def env(n, a=.003, r=.02):
    e = np.ones(n); na = min(n, ns(a)); e[:na] = np.linspace(0, 1, na); nr = min(n, ns(r)); e[-nr:] *= np.linspace(1, 0, nr); return e
def pulse(f, d, duty=.5, det=0.0):
    t = np.arange(ns(d)) / SR; ph = (t * f * (1 + det)) % 1.0
    return np.where(ph < duty, 1.0, -1.0) - (2 * duty - 1)
def tri(f, d):
    ph = (np.arange(ns(d)) * f / SR) % 1.0; return np.round((2 * np.abs(2 * ph - 1) - 1) * 7) / 7

CH = {'min': [0, 3, 7], 'maj': [0, 4, 7], 'sus': [0, 5, 7]}

def kick(v=1.0):
    d = .32; t = np.arange(ns(d)) / SR
    f = 46 + 170 * np.exp(-t / .028); ph = np.cumsum(f / SR)
    body = np.sin(2 * np.pi * ph) * np.exp(-t / .16)
    click = hp(_rng.standard_normal(len(t)), 2000) * np.exp(-t / .002) * .5
    return np.tanh((body + click) * 1.6) * v
def snare(v=1.0):
    d = .16; t = np.arange(ns(d)) / SR
    x = bp(_rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t / .045) + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .03) * .7
    return np.round(x * 10) / 10 * v
def hat(v=1.0, open_=False):
    d = .2 if open_ else .035; t = np.arange(ns(d)) / SR
    return hp(_rng.standard_normal(len(t)), 7000) * np.exp(-t / (.06 if open_ else .008)) * v
def crash(v=1.0):
    d = 1.6; t = np.arange(ns(d)) / SR
    return hp(_rng.standard_normal(len(t)), 3000) * np.exp(-t / .45) * v
def impact(v=1.0):
    d = 1.2; t = np.arange(ns(d)) / SR
    f = 36 + 90 * np.exp(-t / .08); boom = np.sin(2 * np.pi * np.cumsum(f / SR)) * np.exp(-t / .5)
    return np.tanh(boom * 2) * v

def place(buf, x, at, g=1.0, pan=0.0):
    s = int(round(at * SR))
    if s >= len(buf) or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    e = min(len(buf), s + len(x)); l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    buf[s:e, 0] += x[:e - s] * g * l; buf[s:e, 1] += x[:e - s] * g * r

def music(sections, dur):
    N = ns(dur) + SR
    drums = np.zeros((N, 2)); bass = np.zeros((N, 2)); keys = np.zeros((N, 2)); duck = np.ones(N)
    for S in sections:
        bpm = S.get('bpm', 120); b = 60 / bpm; o = S['origin']; L = S.get('layers', set()); prog = S['prog']; G = S.get('gain', 1.0)
        t0, t1 = S['t0'], S['t1']
        k0 = int(np.ceil((t0 - o) / b - 1e-6)); k1 = int(np.floor((t1 - o) / b - 1e-6))
        half = 'half' in L
        for k in range(k0, k1 + 1):
            tb = o + k * b; beat = k % 4; bar = k // 4
            root, q = prog[bar % len(prog)]
            in_last_bar = 'build' in L and tb >= t1 - 4 * b - 1e-6
            # —— drums ——
            if 'kick' in L and (not half or beat == 0) :
                place(drums, kick(), tb, .75 * G)
                n0 = int(tb * SR); n = ns(.22)
                if 0 <= n0 < N: duck[n0:n0 + n] = np.minimum(duck[n0:n0 + n], .35 + .65 * np.linspace(0, 1, min(n, N - n0)) ** 1.5)
            if 'snare' in L and beat in (1, 3) and not half: place(drums, snare(), tb, .32 * G)
            if 'hat' in L:
                place(drums, hat(), tb + b / 2, .4 * G, .2); place(drums, hat(), tb, .15 * G, -.2)
                if beat == 3: place(drums, hat(open_=True), tb + b / 2, .12 * G, .2)
            if in_last_bar:   # snare roll accelerating into the stop
                sub = 2 if tb < t1 - 2 * b else 4
                for j in range(sub): place(drums, snare(), tb + j * b / sub, (.18 + .25 * (tb - (t1 - 4 * b)) / (4 * b)) * G)
            # —— chip bass: root on every beat, gated, rest on the last 8th of the bar ——
            if 'bass' in L:
                d = b * (.5 if beat == 3 else .82) * (2 if half and beat in (0, 2) else 1)
                if not half or beat in (0, 2):
                    m = root - 24 + (12 if (beat == 2 and not half) else 0) * 0
                    x = pulse(hz(m), d, .5) * .6 + tri(hz(m), d) * .5
                    x = lp(x, 900) * env(len(x), .004, .03)
                    place(bass, x, tb, .5 * G)
            # —— pumping chords: 8th-gated pulse triads ——
            if 'pad' in L:
                for j in range(2):
                    if beat == 3 and j == 1: continue        # breath at the bar end
                    d = b / 2 * .78
                    x = sum(pulse(hz(root + iv), d, .25, det) for iv in CH[q] for det in (0, .004)) / 6
                    x = lp(x, 4800) * env(len(x), .002, .03)
                    place(keys, x, tb + j * b / 2, .62 * G, -.15 if j else .15)
            if 'arp' in L:
                notes = [root + 12 + iv for iv in CH[q]] + [root + 24]
                for j in range(4):
                    m = notes[(k * 4 + j) % 4]; d = b / 4 * .6
                    x = pulse(hz(m), d, .125) * np.exp(-np.arange(ns(d)) / SR / .05)
                    place(keys, lp(x, 5000), tb + j * b / 4, .26 * G, .3 if j % 2 else -.3)
        if 'build' in L:   # riser over the last bar
            d = 4 * b; n = ns(d); t = np.arange(n) / SR
            x = _rng.standard_normal(n); y = np.zeros(n)
            for i in range(0, n, 2400):
                f = 400 * 2 ** (i / n * 4); y[i:i + 2400] = bp(x[i:i + 2400], f, min(f * 1.6, 20000))
            place(keys, y * (t / d) ** 2 * .25 * G, t1 - d)
        if 'impact' in L:
            place(drums, impact(), t0, .7 * G); place(drums, crash(), t0, .25 * G)
        if 'lead' in L and S.get('lead'):
            tt = o if o >= t0 else t0
            for m, beats in S['lead']:
                d = beats * b
                if m is not None:
                    n = ns(d * .92); t = np.arange(n) / SR
                    vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - .15) / .2, 0, 1)
                    ph = np.cumsum(hz(m) * vib / SR) % 1
                    x = (np.where(ph < .25, 1., -1.) + .5) * env(n, .004, .05) * np.exp(-t / max(.4, d))
                    place(keys, lp(x, 6000), tt, .5 * G, .05)
                    place(keys, lp(x, 6000) * .35, tt + .18, .5 * G, -.3)    # one echo tap
                tt += d
    mix = drums + bass * duck[:, None] + keys * (.55 + .45 * duck[:, None])
    return mix[:ns(dur)]
