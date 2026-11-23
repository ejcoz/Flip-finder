"""Sound for "Don't Blink": reads events.json (from main.js EV), writes mix.wav (48 kHz stereo).
Usage: python mix.py <events.json> <out.wav>   (LIB on sys.path for core/audio/sfx.py)
All sounds synthesised: chip tick + heart thump per count, inside-the-body bed, pulse-wave blips, one hard silence, original end melody."""
import json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core', 'audio'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from groove import music
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

def ping(f=3600):   # bright count ping
    d = .09; tt = t_(d); x = (np.sin(2*np.pi*f*tt) + .4*np.sign(np.sin(2*np.pi*f*tt))*.5) * np.exp(-tt/.025); return x
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
    if ty == 'bed':
        d = e['dur']; tt = t_(d)
        hum = lp(brown(d), 180) * .5
        if e.get('rise'):   # tension: a drone whose pitch and level rise across the countdown
            r0, r1 = e['rise']; p = np.clip((tt + t - r0) / (r1 - r0), 0, 1)
            f = 110 * 2 ** (p * 1.0); ph = np.cumsum(f / SR) % 1
            drone = (np.where(ph < .5, 1., -1.) * .5 + np.sin(2 * np.pi * ph) * .5) * (0.02 + .1 * p ** 1.5)
            hum = hum + lp(drone, 1200)
        fade = np.minimum(1, tt / .4) * np.minimum(1, (d - tt) / .05)
        add(buf, hum * fade, t, .14, -.2); add(buf, hum * fade, t, .14, .2)
    elif ty == 'hook': add(buf, arp([72, 76, 79, 84], .05, .5, .6), t, .3)
    elif ty == 'tick':
        add(buf, tick(1.0 if e['n'] > 3 else 1.25), t, .55 if e.get('loud') else .4)
        add(buf, ping(3520 if e['n'] > 3 else 4186), t, .22, .15)
    elif ty == 'crackle':
        x = hp(noise(.12), 3000) * (np.random.default_rng(int(t * 100)).random(ns(.12)) > .985) * 3
        add(buf, x, t, .25 * (.3 + e['v']), (t * 7 % 2) - 1)
    elif ty == 'silence': silences.append((t, t + e['dur']))
    elif ty == 'blink_big':
        sw = np.cumsum(np.linspace(900, 200, ns(.12)) / SR) % 1
        bw = np.where(sw < .5, 1., -1.) * env_exp(.12, .05)[:len(sw)]
        add(buf, lp(bw, 5000), t, .35); add(buf, lidsound(1), t, .6); add(buf, thump(.8, 90), t, .4)
    elif ty == 'relief': add(buf, arp([60, 67, 72, 76, 79], .05, .25, .6), t + .1, .3)
    elif ty == 'lid': add(buf, lidsound(.8), t, .35, e.get('pan', 0))
    elif ty == 'blip': add(buf, blip(), t, .22)
    elif ty == 'reveal': add(buf, arp([60, 64, 67, 72, 76, 79, 84], .045, .25, .6), t, .35)
    elif ty == 'whoosh': add(buf, np.round(whoosh(.35) * 16) / 16, t, .25)
    elif ty == 'music':
        M = music(e['sections'], DUR); buf[:len(M)] += M * .9
    elif ty == 'melody_old':
        b = 60 / 150
        lead = [(76, 1), (79, 1), (84, 1), (83, 1), (81, 2), (79, 2), (77, 1), (76, 1), (74, 1), (76, 1), (72, 4)]
        bass = [(45, 4), (41, 4), (43, 4), (48, 4)]
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
buf = np.stack([limit(buf[:, 0], .62), limit(buf[:, 1], .62)], 1) * 1.45
for a, b2 in silences: buf[int(a * SR):int(b2 * SR)] = 0
sf.write(out, buf.astype(np.float32), SR)
print('mix', out, f'{DUR:.2f}s')
