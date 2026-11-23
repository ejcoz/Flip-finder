"""Sound for "The Sun Is Shrinking": reads events.json (from main.js EV), writes mix.wav (48 kHz stereo).
Usage: python mix.py <events.json> <out.wav>   (LIB on sys.path for core/audio/sfx.py)
All sounds synthesised: chip tick + heart thump per count, inside-the-body bed, pulse-wave blips, one hard silence, original end melody."""
import json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core', 'audio'))
from sfx import SR, t_, env_exp, lp, hp, bp, noise, norm, brown, thump, whoosh, add, limit

ev_path, out = sys.argv[1], sys.argv[2]
E = json.load(open(ev_path)); DUR = E['dur']; EV = E['ev']
buf = np.zeros((int(DUR * SR) + SR, 2))

def ns(d): return int(round(d * SR))
def pulse(f, d, duty=.25):
    ph = (np.arange(ns(d)) * f / SR) % 1.0; return np.where(ph < duty, 1.0, -1.0) - (2 * duty - 1)
def tri(f, d):
    ph = (np.arange(ns(d)) * f / SR) % 1.0; return np.round((2 * np.abs(2 * ph - 1) - 1) * 7) / 7   # 4-bit-ish
def adsr(n, a=.004, r=.06):
    e = np.ones(n); na = max(1, ns(a)); e[:na] = np.linspace(0, 1, na); nr = min(n, ns(r)); e[-nr:] *= np.linspace(1, 0, nr); return e
def note(f, d, duty=.25, v=1.0, dec=None):
    x = pulse(f, d, duty) * adsr(ns(d));
    if dec: x *= env_exp(d, dec)[:len(x)]
    return lp(x, 6500) * v
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def tick(p=1.0):   # the count tick: a short square click with a pitch drop
    d = .045; n = ns(d); f = 1900 * p * np.exp(-np.arange(n) / SR * 30)
    ph = np.cumsum(f / SR) % 1; return np.where(ph < .5, 1., -1.) * env_exp(d, .009)[:n] * .8
def beat_sound(v=1.0):
    lub = thump(1.0, 58) * .9; dub = thump(.65, 66) * .7
    x = np.zeros(len(lub) + ns(.2)); x[:len(lub)] += lub; x[ns(.2):ns(.2) + len(dub)] += dub
    return lp(x, 400) * v
def blip(): return np.concatenate([note(hz(84), .035, .5, .6), note(hz(91), .05, .5, .5)])
def arp(notes, step=.06, duty=.25, v=.6):
    x = np.zeros(ns(step * len(notes) + .3))
    for i, m in enumerate(notes): y = note(hz(m), step + .25, duty, v, dec=.12); s = ns(i * step); x[s:s + len(y)] += y[:len(x) - s]
    return x

silences = []
def lidsound(v=1.0):   # soft wet "tk" of a lid
    d = .07; x = bp(noise(d), 900, 3000) * env_exp(d, .012); return norm(x) * v
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'bed':   # the Sun's roar: low brown rumble + slow flutter + faint airy hiss
        d = e['dur']; tt = t_(d)
        roar = lp(brown(d), 140) * (0.8 + 0.2 * np.sin(2 * np.pi * .3 * tt))
        hiss = bp(noise(d), 2000, 6000) * .025
        fade = np.minimum(1, tt / .4) * np.minimum(1, (d - tt) / .05)
        add(buf, (roar + hiss) * fade, t, .45, -.25); add(buf, (roar * .9 + hiss) * fade, t, .45, .25)
    elif ty == 'hook': add(buf, arp([67, 72, 76, 79], .05, .5, .6), t, .3)
    elif ty == 'tick':
        add(buf, tick(1.0), t, .45); add(buf, note(hz(55 + (e['n'] % 2) * 7), .09, .5, .5, dec=.03), t, .16)
    elif ty == 'thunk':
        add(buf, thump(.9, 80), t, .45); x = np.round(lp(noise(.05), 1800) * env_exp(.05, .012) * 6) / 6; add(buf, x, t, .25)
    elif ty == 'stop':
        x = hp(noise(.12), 1500) * env_exp(.12, .03) * .6; x = np.round(x * 8) / 8
        add(buf, x, t, .4); add(buf, arp([79, 72], .06, .5, .6), t, .3)
    elif ty == 'silence': silences.append((t, t + e['dur']))
    elif ty == 'reveal': add(buf, arp([60, 64, 67, 72, 76, 79, 84], .045, .25, .6), t, .35)
    elif ty == 'whoosh': add(buf, np.round(whoosh(.35) * 16) / 16, t, .25)
    elif ty == 'photon':   # thin rising pulse travelling left to right
        d = e['dur']; n = ns(d); f = 600 * 2 ** (np.arange(n) / n * 1.5); ph = np.cumsum(f / SR) % 1
        x = lp(np.where(ph < .125, 1., -1.) * .25 * np.minimum(1, np.arange(n) / ns(.2)), 5000)
        for k, pan in enumerate(np.linspace(-.8, .8, 8)):
            add(buf, x[k * n // 8:(k + 1) * n // 8], t + k * d / 8, .35, pan)
    elif ty == 'arrive': add(buf, arp([84, 91], .05, .5, .5), t, .35); add(buf, thump(.5, 120), t, .3)
    elif ty == 'bounce':
        m = 72 + int((t * 137) % 12)
        add(buf, note(hz(m), .03, .5, .4, dec=.01), t, .05 + .07 * e['k'], ((t * 7) % 2) - 1)
    elif ty == 'escape': add(buf, arp([72, 79, 84, 88], .04, .25, .6), t, .3)
    elif ty == 'blip': add(buf, blip(), t, .22)
    elif ty == 'melody':
        b = 60 / 140
        lead = [(72, 1), (76, 1), (79, 2), (81, 1), (79, 1), (76, 2), (77, 1), (76, 1), (74, 1), (71, 1), (72, 4)]
        bass = [(48, 4), (45, 4), (41, 4), (43, 2), (48, 2)]
        pos = 0
        for m, l in lead: add(buf, note(hz(m), l * b * .92, .25, .5, dec=.5), t + pos * b, .22, .1); pos += l
        pos = 0
        for m, l in bass:
            for k in range(l): y = tri(hz(m), b * .9) * adsr(ns(b * .9)); add(buf, y, t + (pos + k) * b, .32, -.1)
            pos += l
        for k in range(16):
            h = hp(noise(.03), 6000) * env_exp(.03, .008); add(buf, h, t + k * b + b / 2, .12)

for a, b2 in silences: buf[int(a * SR):int(b2 * SR)] = 0   # true zero, tails included
buf = buf[:int(DUR * SR)]
buf[-ns(.25):] *= np.linspace(1, 0, ns(.25))[:, None]
buf = buf / max(1e-9, np.abs(buf).max())
buf = np.stack([limit(buf[:, 0], .4), limit(buf[:, 1], .4)], 1) * 2.2
for a, b2 in silences: buf[int(a * SR):int(b2 * SR)] = 0
sf.write(out, buf.astype(np.float32), SR)
print('mix', out, f'{DUR:.2f}s')
