"""score.py — original score for "The Sun Is Shrinking", cue by cue against the picture.
Key D. 120 bpm grid (one count = 2 beats). Reads the film's timings from the 'score' event (main.js)."""
import numpy as np
from groove import (Score, beats, kick, snare, hat, crash, impact, drop, pluck, bell, brass, swell, trill,
                    bassnote, chord8, riser, drone, crush, hz, SR, ns, lp, hp, _rng)

D = 50  # D3
def build(e, dur):
    T = e['TL']; PYR = e['PYR']; PH = e['PHOTON']; WK = e['WALK']; S = Score(dur); b = .5
    o = -.4                                           # count grid: beats on every count second

    # 1 · HOOK (0–3.6) "THE SUN IS SHRINKING": cosmic awe. Sub swell, choir pad, the Sun motif (rising 5th → octave)
    S.add(impact(), 0, .55, drum=True)
    S.add(swell([D, D + 7, D + 12, D + 16], 3.7, att=1.2, cut=1800), 0, .55)
    S.add(drone(D - 12, 3.7, lfo=.3), 0, .35)
    for at, m, d in [(.35, D + 12, .5), (.9, D + 19, .5), (1.45, D + 24, 1.9)]:
        S.add(brass(m, d), at, .32, .05); S.add(brass(m - 12, d), at, .18, -.05)
    S.add(bell(D + 31, 1.6), 1.45, .2, .4)
    S.add(riser(1.0, f0=500, oct_=3), T['go'] - 1.0, .18)

    # 2 · COUNT (3.6–13.6): a march of weights. Kick on every beat, bass on D, each pyramid landing plays the next note up
    prog = {0: [D, D + 3, D + 7], 1: [D - 2, D + 2, D + 5], 2: [D - 4, D, D + 3], 3: [D - 5, D - 1, D + 2]}   # Dm Bb Gm A-ish
    for tb, k in beats(T['go'], T['stop'] - 1e-3, o, b):
        bar = (k // 4) % 4; beat = k % 4; ch = prog[bar] if tb < 7.0 else [D, D + 4, D + 7] if bar % 2 == 0 else [D - 5, D - 1, D + 2]
        S.kick(tb, .8)
        S.add(bassnote(ch[0] - 12, b * (.5 if beat == 3 else .82)), tb, .5)
        if tb >= 7.0:   # "MASS BECOMES LIGHT": the chords turn major and light (shimmering bell 16ths climb)
            for j in range(2):
                if not (beat == 3 and j): S.add(chord8([m + 12 for m in ch], b / 2 * .75), tb + j * b / 2, .32, .15 if j else -.15)
            for j in range(4):
                step = int((tb - 7.0) / (b / 4)) + j; m = [D + 24, D + 28, D + 31, D + 36][step % 4] + 12 * (step // 24 % 2)
                S.add(bell(m, .25), tb + j * b / 4, .09, .35 if j % 2 else -.35)
            S.add(hat(), tb + b / 2, .3, .2, drum=True)
        else:
            if beat in (0, 2): S.add(swell([m + 12 for m in ch], b * 2, att=.08, cut=1400), tb, .22)
        if tb >= 10.3 and beat in (1, 3): S.add(snare(), tb, .3, drum=True)
    # pyramids: a pitched stone note per landing, climbing D E F G A Bb C#
    for i, p in enumerate(PYR):
        m = [D, D + 2, D + 3, D + 5, D + 7, D + 8, D + 11][i]
        S.add(bassnote(m, .35, cut=1400), p + .5, .45); S.add(pluck(m + 24, .2, .5), p + .5, .18)
    # "A PYRAMID'S WORTH" (10.3–13.6): a hijaz-flavoured lead over the march, then the roll + riser into STOP
    tt = 10.3
    for m, d in [(D + 19, .5), (D + 20, .5), (D + 23, .5), (D + 24, 1.0), (D + 23, .25), (D + 20, .25), (D + 19, 1.0)]:
        S.add(brass(m, d * .95, att=.02), tt, .26); tt += d
    for tb, k in beats(T['stop'] - 2, T['stop'] - 1e-3, o, b):
        sub = 2 if tb < T['stop'] - 1 else 4
        for j in range(sub): S.add(snare(), tb + j * b / sub, .2 + .25 * (tb - T['stop'] + 2) / 2, drum=True)
    S.add(riser(2.0, f0=300, oct_=5), T['stop'] - 2.0, .3)
    # (hard silence T['stop'] → T['reveal'] is carved in mix.py)

    # 3 · REVEAL (14.1–18.0) "43 MILLION TONNES GONE": the heaviest moment. Impact, full D minor groove, motif in the bass
    o2 = T['reveal']
    S.add(impact(), o2, .8, drum=True); S.add(crash(), o2, .3, drum=True)
    for tb, k in beats(o2, T['fuel'] - 1e-3, o2, b):
        beat = k % 4; ch = [[D, D + 3, D + 7], [D - 2, D + 2, D + 5]][(k // 4) % 2]
        S.kick(tb, .85)
        if beat in (1, 3): S.add(snare(), tb, .32, drum=True)
        S.add(hat(), tb + b / 2, .3, .2, drum=True)
        for j in range(2):
            if not (beat == 3 and j): S.add(chord8([m + 12 for m in ch], b / 2 * .78), tb + j * b / 2, .34, .15 if j else -.15)
    for at, m, d in [(o2, D, .9), (o2 + 1, D + 7, .9), (o2 + 2, D + 12, 1.8)]:
        S.add(bassnote(m - 12, d, cut=1100), at, .6); S.add(brass(m + 12, d), at, .22)

    # 4 · RELAX (18.0–21.8) "FUEL FOR 5 BILLION YEARS": exhale. Half-time, warm D major lullaby, no snare
    for tb, k in beats(T['fuel'], T['light'] - 1e-3, o2, b):
        beat = k % 4
        if beat == 0: S.kick(tb, .55)
        ch = [[D, D + 4, D + 7], [D - 5, D - 1, D + 2], [D - 3, D, D + 4], [D - 5, D - 1, D + 2]][(k // 4) % 4]
        if beat == 0: S.add(swell([m + 12 for m in ch], 2.0, att=.25, cut=2200), tb, .3); S.add(bassnote(ch[0] - 12, 1.8), tb, .45)
        S.add(pluck([ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[1] + 24][beat], .3, .25, tau=.12), tb, .16, (beat - 1.5) * .3)

    # 5 · LIGHT (21.8–26.0) "LEFT IT 8 MIN AGO": the trip. Suspended pad; the photon is a rising 16th arpeggio crossing left→right
    S.add(swell([D + 12, D + 19, D + 24, D + 26], T['core'] - T['light'], att=.4, cut=3000), T['light'], .3)
    n16 = int((PH[1] - PH[0]) / (b / 4))
    scale = [0, 2, 4, 7, 9]
    for j in range(n16):
        at = PH[0] + j * b / 4; pr = j / n16
        m = D + 12 + scale[j % 5] + 12 * (j // 5) // 2; m = min(m, D + 48)
        S.add(pluck(m, .12, .125, tau=.04), at, .2, -0.9 + 1.8 * pr)
        S.add(hat(), at, .08 + .1 * pr, -0.9 + 1.8 * pr, drum=True)    # the clock spinning
    S.add(bell(D + 36, 1.4), PH[1], .35, .7); S.add(bell(D + 31, 1.4), PH[1] + .08, .25, .7)
    S.add(swell([D + 4, D + 7, D + 12, D + 16], T['core'] - PH[1], att=.05, cut=3500), PH[1], .3)
    S.kick(PH[1], .5)

    # 6 · CORE (26.0–30.6) "~100,000 YEARS TO ESCAPE": deep ominous drone; the walk's blips (mix.py) sit on a slow pulse that speeds up
    S.add(drone(D - 12, T['cta'] - T['core'], v=1, lfo=.2), T['core'], .9)
    S.add(swell([D - 12, D - 5, D + 3], T['cta'] - T['core'], att=1.0, cut=1200), T['core'], .5)
    t = T['core'] + .4; gap = 1.0
    while t < WK[1]:
        S.kick(t, .45, dk=.6); t += gap; gap = max(.25, gap * .86)
    S.add(riser(2.0, f0=400, oct_=4), WK[1] - 2.0, .25)
    S.add(crash(), WK[1], .3, drum=True)
    for j, m in enumerate([D + 24, D + 28, D + 31, D + 36]): S.add(bell(m, .6), WK[1] + j * .06, .2)

    # 7 · CTA (30.6–35.4) "NEXT SUNRISE…": sunrise. The opening motif returns in D major, full warm groove + lead
    o3 = T['cta']
    S.add(impact(), o3, .55, drum=True); S.add(crash(), o3, .25, drum=True)
    for tb, k in beats(o3, dur - .6, o3, b):
        beat = k % 4; ch = [[D, D + 4, D + 7], [D - 5, D - 1, D + 2], [D - 3, D, D + 4], [D - 7, D - 3, D]][(k // 4) % 4]
        S.kick(tb, .7)
        if beat in (1, 3): S.add(snare(), tb, .26, drum=True)
        S.add(hat(), tb + b / 2, .26, .2, drum=True)
        S.add(bassnote(ch[0] - 12, b * (.5 if beat == 3 else .82)), tb, .48)
        for j in range(2):
            if not (beat == 3 and j): S.add(chord8([m + 12 for m in ch], b / 2 * .75), tb + j * b / 2, .26, .15 if j else -.15)
    tt = o3 + .02
    for m, d in [(D + 12, .5), (D + 19, .5), (D + 24, 1.0), (D + 26, .5), (D + 24, .5), (D + 21, 1.0), (D + 19, .5), (D + 21, .5), (D + 24, 2.0)]:
        S.add(brass(m, d * .95, att=.03), tt, .3, .05); S.add(brass(m, d * .95, att=.03) * .3, tt + .18, .3, -.3); tt += d
    S.add(swell([D, D + 4, D + 7, D + 12], 1.6, att=.02, cut=3000), dur - 1.6, .35); S.add(crash(), dur - 1.6, .2, drum=True)
    return S.render()
