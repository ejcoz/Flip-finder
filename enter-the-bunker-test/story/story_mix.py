"""12 s story soundtrack: drone, wind and ash, Geiger crackle, the 101 glitch (static, low hit), three knocks."""
import os, sys, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or sys.exit('set LIB')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, thump, ding, click, limit, add
D = 12.0; N = int(D * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(404)
def fade(x, a, b):
    x = x.copy(); na, nb = min(int(a*SR), len(x)//2), min(int(b*SR), len(x)//2)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x
tt = t_(D)
f = 73.42  # D2 with harmonics, slow swell
drone = (np.sin(2*np.pi*f*tt) + .45*np.sin(4*np.pi*f*tt) + .2*np.sin(6*np.pi*f*tt) + .12*np.sin(2*np.pi*f*1.498*tt)) * (1 + .2*np.sin(2*np.pi*.15*tt))
add(out, fade(drone, 1.2, 1.0) * .14, 0)
add(out, fade(lp(brown(D), 180), 1.0, 1.0) * .22, 0)                      # earth rumble
add(out, fade(bp(noise(D), 600, 3000) * (1 + .5*np.sin(2*np.pi*.23*tt)), 1.5, 1.5) * .035, 0, pan=-.3)   # wind and ash
for k in range(70):                                                         # sparse Geiger crackle
    at = rng.uniform(.4, 11.5); add(out, click(2.2 + rng.uniform(-.3, .3), .05 + .08 * rng.random()), at, pan=rng.uniform(-.6, .6))
for at in (1.0, 3.6, 6.1):                                                  # beacon pings
    add(out, ding(.06) * env_exp(1.6, .5), at, pan=.4)
g0 = 7.1                                                                    # the glitch
st = hp(noise(.85), 1500) * (rng.random(int(.85*SR)) > .3) ; add(out, fade(st, .01, .08) * .16, g0)
d2 = 2.4; t2 = t_(d2); hit = norm(np.sin(2*np.pi*42*t2*(1-.2*t2)) * env_exp(d2, .7) + lp(noise(d2), 500) * env_exp(d2, .15) * .6) * .85
add(out, hit, g0 + .02)
def knock(v):
    d = .25; t3 = t_(d); return norm(np.sin(2*np.pi*85*t3) * env_exp(d, .05) + lp(noise(d), 1500) * env_exp(d, .012) * .8) * v
for j in range(3): add(out, knock(.9), 8.35 + j * .24, pan=.25)
pad = sum(np.sin(2*np.pi*440*2**((m-69)/12)*t_(3.6)) for m in (62, 63, 69)) / 3   # dissonant tail
add(out, fade(lp(pad, 1200), .6, 1.2) * .06, 8.3)
out[-int(.4*SR):] *= np.linspace(1, 0, int(.4*SR))[:, None]
out = np.stack([limit(out[:, 0], .9), limit(out[:, 1], .9)], 1)
sf.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'story_mix.wav'), out.astype(np.float32), SR); print('ok')
