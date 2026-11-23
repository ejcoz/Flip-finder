"""studio.py — premium-chiptune production kit for Pixel Countdown Science scores (original, numpy/scipy only).

Instruments: PWM chip lead (glide, delayed vibrato), chip choir (formant vowels), detuned chip chords, chip bass with sub,
layered drums (kick, snare, clap, hats with swing/velocity, toms), reverse cymbal, crash, uplifter, sub drop, bell, drop.
Mix: buses (drums, bass, chords, lead, fx) with sends to a stereo reverb and a ping-pong delay, chorus on chords,
side-chain pump from the kick, bus glue compression, saturation, mono bass, low cut on everything but bass/kick.

Typical use (score.py):
    st = Studio(dur, bpm=120)
    st.kick(t); st.note('lead', 74, t, d); st.chord('chords', [62,66,69], t, d)
    out = st.mixdown()      # (N, 2)
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
_rng = np.random.default_rng(23)
def ns(d): return max(1, int(round(d * SR)))
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def _f(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_f('low', min(f, SR / 2 - 200), o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_f('high', f, o), x, axis=0)
def bp(x, a, b, o=2): return sosfilt(_f('band', [a, min(b, SR / 2 - 200)], o), x, axis=0)
def adsr(n, a=.004, d=.08, s=.8, r=.04):
    e = np.full(n, s, float); na = min(n, ns(a)); nd = min(n - na, ns(d))
    e[:na] = np.linspace(0, 1, na); e[na:na + nd] = np.linspace(1, s, nd)
    nr = min(n, ns(r)); e[-nr:] *= np.linspace(1, 0, nr); return e
def blep_pulse(freq, duty):
    """Band-limited pulse from per-sample frequency and duty arrays (PolyBLEP)."""
    dt = freq / SR; ph = np.cumsum(dt) % 1.0
    def pb(t, d):
        y = np.zeros_like(t); m = t < d; x = t[m] / d[m]; y[m] = x + x - x * x - 1
        m = t > 1 - d; x = (t[m] - 1) / d[m]; y[m] = x * x + x + x + 1; return y
    y = np.where(ph < duty, 1.0, -1.0) + pb(ph, dt) - pb((ph - duty) % 1.0, dt)
    return y - (2 * duty - 1)

# ———————— instruments (mono) ————————
def lead(m, d, glide_from=None, v=1.0, pwm=.18, vib=.012):
    n = ns(d); t = np.arange(n) / SR; f0 = hz(m)
    f = np.full(n, f0)
    if glide_from is not None: f = hz(glide_from) * (f0 / hz(glide_from)) ** np.clip(t / .06, 0, 1)
    f = f * (1 + vib * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - .18) / .25, 0, 1))
    duty = .25 + pwm * np.sin(2 * np.pi * 1.3 * t)
    x = blep_pulse(f, duty) * .7 + blep_pulse(f * 2.003, np.full(n, .5)) * .12
    return lp(x, 7000) * adsr(n, .006, .12, .75, .05) * v
def choir(ms, d, vowel='ah', v=1.0, att=.25):
    F = {'ah': [(730, 1.0), (1090, .5), (2440, .25)], 'oo': [(300, 1.0), (870, .35), (2240, .12)], 'ee': [(270, 1.0), (2290, .5), (3010, .3)]}[vowel]
    n = ns(d); t = np.arange(n) / SR; src = np.zeros(n)
    for m in ms:
        for det in (-.006, .0, .007):
            f = hz(m) * (1 + det) * (1 + .004 * np.sin(2 * np.pi * (4.8 + det * 100) * t))
            src += blep_pulse(f, np.full(n, .5))
    y = sum(a * bp(src, f * .85, f * 1.15) for f, a in F)
    return y / (3 * len(ms)) * 2.5 * adsr(n, att, .2, .9, min(.6, d * .4)) * v
def chordtone(ms, d, v=1.0, duty=.25, cut=5000, a=.003, r=.03):
    n = ns(d); x = np.zeros(n)
    for m in ms:
        for det in (-.003, .003): x += blep_pulse(np.full(n, hz(m) * (1 + det)), np.full(n, duty))
    return lp(x / (2 * len(ms)), cut) * adsr(n, a, .1, .7, r) * v
def arp(m, d, v=1.0):
    n = ns(d); x = blep_pulse(np.full(n, hz(m)), np.full(n, .125)); return lp(x, 6500) * np.exp(-np.arange(n) / SR / .06) * v
def bass(m, d, v=1.0, cut=1100):
    n = ns(d); t = np.arange(n) / SR
    x = blep_pulse(np.full(n, hz(m)), np.full(n, .5)) * .55 + np.sin(2 * np.pi * hz(m - 12) * t) * .6
    return np.tanh(lp(x, cut) * 1.4) * adsr(n, .003, .1, .85, .03) * v
def bell(m, d=.9, v=1.0):
    t = np.arange(ns(d)) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .1) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / .04)) * np.exp(-t / (d / 3)) * v
def drop(m, v=1.0):
    d = .18; t = np.arange(ns(d)) / SR; f = hz(m) * (1 + 1.3 * np.exp(-t / .012))
    return np.sin(2 * np.pi * np.cumsum(f / SR)) * np.exp(-t / .055) * v
def pluck(m, d=.2, v=1.0, duty=.5, tau=.07):
    n = ns(d); return lp(blep_pulse(np.full(n, hz(m)), np.full(n, duty)), 6000) * np.exp(-np.arange(n) / SR / tau) * adsr(n, .002, .01, 1, .01) * v
def trill(m, d, v=1.0, rate=9, depth=.025):
    n = ns(d); t = np.arange(n) / SR; return lp(blep_pulse(hz(m) * (1 + depth * np.sin(2 * np.pi * rate * t)), np.full(n, .25)), 5000) * adsr(n, .05, .1, .9, .05) * v
def drone(m, d, v=1.0):
    n = ns(d); t = np.arange(n) / SR
    x = blep_pulse(np.full(n, hz(m)), np.full(n, .5)) * .5 + blep_pulse(np.full(n, hz(m + 7) * 1.002), np.full(n, .5)) * .3
    w = .5 * (1 + np.sin(2 * np.pi * .2 * t)); return (lp(x, 300) * (1 - w) + lp(x, 1000) * w) * adsr(n, .6, .1, 1, .6) * v

# drums
def k_kick(v=1.0):
    d = .45; t = np.arange(ns(d)) / SR
    f = 44 + 150 * np.exp(-t / .03) + 600 * np.exp(-t / .002)
    body = np.sin(2 * np.pi * np.cumsum(f / SR)) * np.exp(-t / .22)
    punch = bp(_rng.standard_normal(len(t)), 800, 4000) * np.exp(-t / .004) * .35
    return np.tanh((body + punch) * 1.8) * .9 * v
def k_snare(v=1.0):
    d = .3; t = np.arange(ns(d)) / SR
    tone = (np.sin(2 * np.pi * 185 * t) + .5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / .045)
    nz = bp(_rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t / .07)
    return np.tanh((tone * .8 + nz) * 1.5) * .8 * v
def k_clap(v=1.0):
    d = .25; t = np.arange(ns(d)) / SR; nz = bp(_rng.standard_normal(len(t)), 900, 6000)
    e = sum(np.exp(-np.clip(t - o, 0, None) / .006) * (t >= o) for o in (0, .011, .022)) + np.exp(-np.clip(t - .03, 0, None) / .06) * (t >= .03)
    return nz * e * .5 * v
def k_hat(v=1.0, open_=False):
    d = .35 if open_ else .05; t = np.arange(ns(d)) / SR
    x = hp(_rng.standard_normal(len(t)), 7500) + .3 * np.sign(np.sin(2 * np.pi * 7100 * t)) * .3
    return hp(x, 6000) * np.exp(-t / (.09 if open_ else .012)) * .5 * v
def k_tom(m, v=1.0):
    d = .3; t = np.arange(ns(d)) / SR; f = hz(m) * (1 + .6 * np.exp(-t / .03))
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f / SR)) * np.exp(-t / .12) * 1.5) * .7 * v
def k_crash(v=1.0, d=2.2):
    t = np.arange(ns(d)) / SR; x = hp(_rng.standard_normal(len(t)), 3500)
    return (x + .2 * np.sign(np.sin(2 * np.pi * 5300 * t + 3 * np.sin(2 * np.pi * 411 * t)))) * np.exp(-t / .6) * .45 * v
def k_revcymbal(d=1.5, v=1.0):
    return k_crash(1.0, d)[::-1] * np.linspace(0, 1, ns(d)) ** 1.5 * v
def k_uplift(d, v=1.0, f0=300, octs=5):
    n = ns(d); t = np.arange(n) / SR; x = _rng.standard_normal(n); y = np.zeros(n)
    for i in range(0, n, 1200):
        f = f0 * 2 ** (i / n * octs); y[i:i + 1200] = bp(x[i:i + 1200], f, f * 1.5)
    return y * (t / d) ** 2 * 1.5 * v
def k_subdrop(v=1.0, d=1.6):
    t = np.arange(ns(d)) / SR; f = 30 + 70 * np.exp(-t / .25)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f / SR)) * np.exp(-t / .7) * 2) * .9 * v
def k_impact(v=1.0):
    return k_subdrop(1.0, 1.4) * .8 * v

# ———————— the studio ————————
class Studio:
    BUSES = ('drums', 'bass', 'chords', 'lead', 'fx', 'choir')
    SENDS = {'drums': (.10, .0), 'bass': (0, 0), 'chords': (.22, .10), 'lead': (.22, .28), 'fx': (.35, .25), 'choir': (.45, .05)}
    def __init__(self, dur, bpm=120):
        self.dur = dur; self.N = ns(dur) + 2 * SR; self.b = 60 / bpm
        self.bus = {k: np.zeros((self.N, 2)) for k in self.BUSES}
        self.duck = np.ones(self.N); self.gates = []
    def put(self, bus, x, at, g=1.0, pan=0.0):
        s = int(round(at * SR)); buf = self.bus[bus]
        if s >= self.N or s + len(x) <= 0: return
        if s < 0: x = x[-s:]; s = 0
        e = min(self.N, s + len(x)); l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        buf[s:e, 0] += x[:e - s] * g * l; buf[s:e, 1] += x[:e - s] * g * r
    # convenience
    def kick(self, at, g=1.0, pump=.3):
        self.put('drums', k_kick(), at, g)
        n0 = int(at * SR); n = ns(min(.32, self.b * .9))
        if 0 <= n0 < self.N: m = min(n, self.N - n0); self.duck[n0:n0 + m] = np.minimum(self.duck[n0:n0 + m], pump + (1 - pump) * np.linspace(0, 1, m) ** 1.8)
    def snare(self, at, g=1.0): self.put('drums', k_snare(), at, g)
    def clap(self, at, g=1.0): self.put('drums', k_clap(), at, g, .1)
    def hat(self, at, g=1.0, open_=False, pan=.25): self.put('drums', k_hat(1, open_), at, g * (.85 + .3 * _rng.random()), pan)
    def note(self, bus, m, at, d, g=1.0, pan=0.0, **kw):
        f = {'lead': lead, 'bass': bass}.get(bus)
        x = f(m, d, **kw) if f else lead(m, d, **kw)
        self.put(bus, x, at, g, pan)
    def chord(self, bus, ms, at, d, g=1.0, pan=0.0, **kw): self.put(bus, chordtone(ms, d, **kw), at, g, pan)
    def melody(self, notes, at, bus='lead', g=1.0, pan=0.0, transpose=0, legato=.92, glide=True):
        """notes: [(midi|None, beats)] → placed from `at`, with glides between close notes."""
        t = at; prev = None
        for m, bt in notes:
            d = bt * self.b
            if m is not None:
                gf = prev + transpose if (glide and prev is not None and abs(m - prev) <= 2 and bt <= 1) else None
                self.put(bus, lead(m + transpose, d * legato, glide_from=gf), t, g, pan)
                prev = m
            t += d
        return t
    def gate(self, t0, t1): self.gates.append((t0, t1))   # hard mute of the whole mix (e.g. the music "blinks")
    # ——— mixdown ———
    def mixdown(self):
        b = self.b
        def reverb(x, rt=1.8, pre=.02):
            n = ns(rt * 1.2); t = np.arange(n) / SR; out = np.zeros_like(x)
            for c in (0, 1):
                ir = _rng.standard_normal(n) * np.exp(-6.9 * t / rt); ir = lp(ir, 6000); ir[:ns(pre)] = 0
                out[:, c] = fftconvolve(x[:, c], ir)[:len(x)] * .06
            return out
        def pingpong(x, dl=.75 * b, fb=.38):
            out = np.zeros_like(x); d = ns(dl); mono = lp(x.mean(1), 5000); tap = mono.copy(); g = 1.0
            for i in range(1, 7):
                g *= fb; c = i % 2; s = i * d
                if s >= len(x): break
                tap = lp(tap, 4000)
                out[s:, c] += tap[:len(x) - s] * g
            return out
        def chorus(x, depth=.004, rate=.6):
            n = len(x); t = np.arange(n) / SR; out = np.zeros_like(x)
            for c, ph in ((0, 0), (1, np.pi / 2)):
                dl = (.012 + depth * np.sin(2 * np.pi * rate * t + ph)) * SR; idx = np.clip(np.arange(n) - dl, 0, n - 1)
                i0 = idx.astype(int); fr = idx - i0; i1 = np.minimum(i0 + 1, n - 1)
                out[:, c] = x[:, c] * .8 + (x[i0, c] * (1 - fr) + x[i1, c] * fr) * .28
            return out
        def comp(x, thr=.3, ratio=3, att=.005, rel=.12):
            lvl = np.abs(x).max(1); env = np.zeros(len(x)); e = 0; a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
            # block-wise envelope for speed
            blk = 64; L = lvl[:len(lvl) // blk * blk].reshape(-1, blk).max(1)
            E = np.zeros(len(L)); ab, rb = a ** blk, r ** blk
            for i, c in enumerate(L): e = ab * e + (1 - ab) * c if c > e else rb * e + (1 - rb) * c; E[i] = e
            env = np.repeat(E, blk); env = np.concatenate([env, np.full(len(x) - len(env), E[-1] if len(E) else 0)])
            g = np.where(env > thr, (thr + (env - thr) / ratio) / np.maximum(env, 1e-9), 1.0)
            return x * g[:, None]
        B = self.bus; duck = self.duck[:, None]
        drums = comp(B['drums'], .45, 2.5) * 1.35
        bass_ = B['bass'].mean(1, keepdims=True) * np.ones((1, 2)) * duck * 1.7      # mono bass, pumped
        chords = hp(chorus(B['chords']), 150) * (.35 + .65 * duck) * .6
        lead_ = hp(B['lead'], 180) * (.75 + .25 * duck)
        choir_ = hp(chorus(B['choir'], .006, .4), 160) * (.6 + .4 * duck) * .45
        fx = hp(B['fx'], 120)
        dry = drums + bass_ + chords + lead_ + choir_ + fx
        send_r = sum(hp(B[k], 200) * self.SENDS[k][0] for k in B); send_d = sum(B[k] * self.SENDS[k][1] for k in B)
        wet = reverb(send_r) * .8 + pingpong(send_d) * .45
        mix = dry + hp(wet, 200)
        mix = np.tanh(comp(mix, .55, 2.0, .01, .2) * 1.1)                           # glue + gentle saturation
        mix = mix + .12 * (hp(mix, 9000))                                            # a touch of air
        for t0, t1 in self.gates: mix[int(t0 * SR):int(t1 * SR)] = 0
        return mix[:ns(self.dur)]

# ———————— shared high-energy groove (140 bpm era) ————————
def q32(st, t, origin):
    """Snap a real-time event to the next 1/32 note of the grid (≤ ~54 ms late at 140 bpm)."""
    s = st.b / 8; k = np.ceil((t - origin) / s - 1e-6); return origin + k * s

def groove(st, t0, t1, origin, prog, CH, ROOT, kick='four', clap=True, hats='16', bassline='drive', chords='8',
           arps=False, fills=True, g=1.0, pan=0.0):
    b = st.b
    k0 = int(np.ceil((t0 - origin) / b - 1e-6)); k1 = int(np.floor((t1 - origin) / b - 1e-6))
    for k in range(k0, k1 + 1):
        tb = origin + k * b; beat = k % 4; bar = k // 4; c = prog[bar % len(prog)]; r = ROOT[c]
        last_beat_of_phrase = beat == 3 and bar % 4 == 3
        if kick == 'four' or (kick == 'half' and beat == 0) or (kick == 'two' and beat in (0, 2)): st.kick(tb, .95 * g, pump=.18)
        if kick == 'eighths': st.kick(tb, .9 * g, pump=.18); st.kick(tb + b / 2, .6 * g, pump=.4)
        if clap and beat in (1, 3): st.snare(tb, .55 * g); st.clap(tb, .38 * g)
        if hats in ('8', '16'):
            st.hat(tb + b / 2, .32 * g, open_=True)                                   # open hat on every offbeat
            if hats == '16':
                for j in (1, 3): st.hat(tb + j * b / 4 + .006, .28 * g, pan=-.25)
                st.hat(tb, .18 * g, pan=.3)
        if fills and last_beat_of_phrase and clap:
            for j in range(4): st.snare(tb + j * b / 4, (.3 + .1 * j) * g)
        if bassline == 'drive':      # offbeat-pumping 8ths with an octave pop on the last 16th
            st.put('bass', bass(r, b / 2 * .7), tb, .5 * g, pan * .3)
            st.put('bass', bass(r, b / 4 * .8), tb + b / 2, .55 * g, pan * .3)
            st.put('bass', bass(r + 12, b / 4 * .7), tb + 3 * b / 4, .45 * g, pan * .3)
        elif bassline == '8':
            st.put('bass', bass(r, b / 2 * .8), tb, .55 * g, pan * .3); st.put('bass', bass(r + (12 if beat % 2 else 7), b / 2 * .6), tb + b / 2, .42 * g, pan * .3)
        elif bassline == 'bounce':
            st.put('bass', bass(r + (0, 12, 7, 12)[beat], b * .4), tb, .55 * g, pan * .3)
        elif bassline == 'long' and beat == 0:
            st.put('bass', bass(r, 4 * b * .95), tb, .5 * g)
        if chords == '8':
            for j in range(2):
                if beat == 3 and j and not arps: continue
                st.put('chords', chordtone([m + 12 for m in CH[c]], b / 2 * .6, duty=.5), tb + j * b / 2, .5 * g, (.2 if j else -.2) + pan)
        elif chords == 'pad' and beat == 0:
            st.put('chords', chordtone([m + 12 for m in CH[c]], 4 * b, a=.12, r=.4, cut=3500), tb, .42 * g, pan)
        if arps:
            ms = [m + 24 for m in CH[c]] + [CH[c][0] + 36]
            for j in range(4): st.put('fx', arp(ms[(k * 4 + j) % 4 if j % 2 == 0 else (k * 4 + j * 3) % 4], b / 4 * .8), tb + j * b / 4, .26 * g, (.45 if j % 2 else -.45) + pan)
