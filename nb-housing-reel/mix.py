"""Mix: score + Kokoro narration + foley by material + room tone -> out/mix.wav
Run: LIB=<library> "$LIB/.venv/bin/python" mix.py   (needs events.json, voices/, music/score.wav)
Music ducks ~8 dB under the voice; foley unducked. Silence 1 (before the title stamps) cuts everything;
silence 2 (before the see-saw) keeps room tone only."""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, norm, brown, clack, whoosh, thump, ding, pop, add, compress, limit
D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR)); EV = E['ev']
TL = json.load(open(os.path.join(D, 'timeline.json'))); BEAT = TL['beat']
SIL = json.load(open(os.path.join(D, 'music', 'silences.json')))['silences']
rng = np.random.default_rng(1506)
def nz(d): return rng.standard_normal(len(t_(d)))
def env_ad(d, a=.004, tau=.1):
    x = env_exp(d, tau); n = int(a * SR)
    if n: x[:n] *= np.linspace(0, 1, n)
    return x
def M(*xs): n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
def sine(f, d): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, len(t_(d))).astype(float)) / SR)

def stamp():          # damped rubber stamp with a paper smack
    d = .3; tt = t_(d); return norm(sine(140 * (1 - .4 * tt), d) * env_exp(d, .035) + lp(nz(d), 1800) * env_exp(d, .012) * .9)
def paper_swish(d=.3): return norm(bp(nz(d), 1800, 8000)) * np.sin(np.pi * t_(d) / d) ** 2
def pen_write(d=.5): return norm(bp(nz(d), 2000, 7000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 11 * t_(d))))) * np.sin(np.pi * t_(d) / d)
def slide_whistle(d=.38):
    f = np.linspace(650, 1600, len(t_(d))); return norm(sine(f * (1 + .012 * np.sin(2 * np.pi * 6 * t_(d))), d) + .1 * bp(nz(d), 1000, 3000)) * np.sin(np.pi * t_(d) / d) ** .6
def ticker(d):        # a mechanical counter rolling over: fast tiny clicks
    x = np.zeros(len(t_(d))); n = int(d * 28)
    for k in range(n):
        c = norm(clack(1.6 + .2 * (k % 2), 1)[:int(.02 * SR)]) * (.5 + .5 * k / n); o = int(k / 28 * SR); x[o:o + len(c)] += c[:len(x) - o]
    return norm(x)
def iris(d): tt = t_(d); return norm(bp(nz(d), 1000, 6000) * np.linspace(1, .2, len(tt))) * np.sin(np.pi * tt / d)
def wood_knock(): return norm(M(clack(.8, 1)[:int(.14 * SR)], thump(.5, 120)[:int(.14 * SR)] * .5))
def footstep(): d = .1; return norm(lp(nz(d), 1400) * env_exp(d, .015) + sine(90, d) * env_exp(d, .02) * .5)
def airliner(d):      # four props droning past, Doppler down
    tt = t_(d); f = 92 * (1 + .06 * np.tanh((d / 2 - tt) * 2)); saw = (np.cumsum(f) / SR) % 1 * 2 - 1
    x = bp(saw, 120, 1800) * .6 + bp(nz(d), 300, 2500) * .25
    return norm(x) * np.sin(np.pi * tt / d) ** 1.5
def pip(n): d = .12; f = 880 * 2 ** ((n % 5) * 2 / 12); return norm(sine(f, d) * env_ad(d, .003, .04))
def soft_pip(n): d = .2; f = [1047, 1175, 1319, 1397, 1568, 1760][n % 6]; return norm(sine(f, d) * env_ad(d, .003, .06) + sine(f * 2.01, d) * env_exp(d, .02) * .2)
def tock(): d = .18; return norm(M(sine(320, d) * env_exp(d, .03), bp(nz(d), 400, 1600) * env_exp(d, .01) * .5))
def clank(): d = .5; tt = t_(d); return norm(M(*(np.sin(2 * np.pi * f * tt) * env_exp(d, tau) * a for f, a, tau in [(523, .6, .15), (1311, .4, .09), (2203, .3, .05)]), hp(nz(d), 3000) * env_exp(d, .004)))
def hammer(): d = .12; return norm(M(clack(1.0, 1)[:int(d * SR)], thump(.6, 160)[:int(d * SR)] * .6))
def big_thump(): d = .5; tt = t_(d); return norm(M(sine(70 * (1 - .3 * tt), d) * env_exp(d, .09), lp(nz(d), 700) * env_exp(d, .03) * .6, wood_knock() * .4))

fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); amb = np.zeros((N, 2))
for e in EV:
    t, ty, gn, pan = e['t'], e['type'], e.get('gain', 1.0), e.get('pan', 0.0)
    if ty == 'vo': continue
    if ty == 'stamp': add(fx, stamp(), t, .75 * gn)
    elif ty == 'paper_swish': add(fx, paper_swish(), t, .35 * gn, .4)
    elif ty == 'pen_write': add(fx, pen_write(e.get('dur', .5)), t, .16, -.2)
    elif ty == 'whistle_up': add(fx, slide_whistle(.2 if e.get('short') else .38), t, .22 * gn, .2)
    elif ty == 'ding': add(fx, ding(1), t, .3 * gn, .1)
    elif ty == 'ticker': add(fx, ticker(e.get('dur', .8)), t, .22, .25)
    elif ty == 'iris': add(fx, iris(e.get('dur', .5)), t, .25)
    elif ty == 'slide': add(fx, paper_swish(.25), t, .2 * gn, -.4)
    elif ty == 'wood_knock': add(fx, wood_knock(), t, .55 * gn, -.3)
    elif ty == 'step': add(fx, footstep(), t, .3 * gn, pan)
    elif ty == 'plane': add(amb, airliner(e.get('dur', 2.6)), t, .2)
    elif ty == 'pip': add(fx, pip(e.get('n', 0)), t, .14, -.6 + (e.get('n', 0) % 9) * .15)
    elif ty == 'celesta_pip': add(fx, soft_pip(e.get('n', 0)), t, .12, -.3 if e['t'] < 38 else .3)
    elif ty == 'tock': add(fx, tock(), t, .4 * gn, .3)
    elif ty == 'whoosh': add(fx, whoosh(e.get('dur', .3), 1), t, .25 * gn, .5)
    elif ty == 'pop': add(fx, pop(1), t, .3 * gn, .2)
    elif ty == 'clank': add(fx, clank(), t, .35)
    elif ty == 'hammer': add(fx, hammer(), t, .3 * gn, .3)
    elif ty == 'thump': add(fx, big_thump(), t, .8)

voice_env = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR); y = compress(norm(y, .9), thr=.3, ratio=3.0)
    add(vo, y, e['t'], .85, 0); s = int(e['t'] * SR); voice_env[s:s + len(y)] = 1

room = lp(brown(DUR), 900) * .018
amb += np.stack([room, np.roll(room, 311)], 1)
for k in range(int(DUR / (2 * BEAT))): add(amb, clack(1.1, 1)[:int(.08 * SR)], k * 2 * BEAT, .025, -.6)   # mantel clock, very quiet

mus, msr = sf.read(os.path.join(D, 'music', 'score.wav'))
if msr != SR: mus = soxr.resample(mus, msr, SR)
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
k = int(.12 * SR); sm = np.convolve(voice_env, np.ones(k) / k, 'same')
mus = mus * (1 - sm * (1 - 10 ** (-8 / 20)))[:, None]

def gate(buf, a, b, keep=0.0, fade=.03):
    s, e = int(a * SR), int(b * SR); f = int(fade * SR); m = np.ones(N); m[s:e] = keep
    m[max(0, s - f):s] = np.linspace(1, keep, min(f, s)); m[e:e + f] = np.linspace(keep, 1, len(m[e:e + f])); buf *= m[:, None]
(a1, b1), (a2, b2) = SIL
gate(amb, a1, b1 - .01); gate(fx, a1, b1 - .01)            # silence 1: everything off; the first stamp is the next sound
gate(fx, a2, b2 - .01)                                      # silence 2: room tone only; the see-saw thump is the next sound
mix = mus * .9 + fx * .9 + vo + amb
mix = limit(mix, .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix.wav', mix.shape, 'peak', float(np.abs(mix).max()))
