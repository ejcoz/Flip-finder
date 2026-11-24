"""score.py — "Say the Colour": two layers (STYLE.md §7). 120 bpm.
  · BACKING: a chip backing under the whole film; C – Am – F – G, up a whole tone per level, busier per level
  · EVENT HITS: each ink colour has its own note (RED = C, BLUE = E, GREEN = G, PURPLE = B, an octave up per level),
    so the sequence of right answers is the melody. A word lands = a punchy zap on its colour's note + a thud; the
    answer half a step later = a bright "ding" a fifth higher. The wrong answer gets a dry buzzer.
  · LEVEL intros: a chord stab + 3 · 2 · 1 rising zaps on beats. A roll and riser into true silence before the "why";
    the "why" lands on a swell with the words orbiting; the CTA resolves home."""
import numpy as np
from studio import (Studio, backing, MAJ, MIN, swell, zap, gliss, choir, chordtone, bell, lead, blep_pulse, lp,
                    k_uplift, k_subdrop, k_crash, k_snare, SR, ns)

NOTE = {'RED': 72, 'BLUE': 76, 'GREEN': 79, 'PURPLE': 83}
PROG = [(60, MAJ), (57, MIN), (53, MAJ), (55, MAJ)]

def buzzer(d=.32):
    n = ns(d); t = np.arange(n) / SR
    x = blep_pulse(np.full(n, 110.), np.full(n, .5)) * .6 + blep_pulse(np.full(n, 116.5), np.full(n, .5)) * .6
    return lp(x, 2500) * np.minimum(1, (d - t) / .03) * .8

def build(e, dur):
    T = e['TL']; LV = e['LEVELS']; WD = e['WORDS']
    st = Studio(dur, 120, rt=1.9, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .3; st.hitduck = 2.5
    b = .5

    # ① HOOK 0–4: backing from the first frame; the worked example: RED (in blue) lands, "BLUE!" answers
    backing(st, 0, PROG[:2], g=.8, riff=False)
    st.put('lead', gliss(60, 84, 1.0), .05, .35)
    st.put('hits', zap(NOTE['BLUE'], 1.0, d=.4), e['demo'], .7); st.put('hits', zap(52, .8, d=.18, drop_=2.5), e['demo'], .4)
    st.put('hits', zap(NOTE['BLUE'] + 7, .8, d=.5), 2.0, .55); st.put('fx', bell(NOTE['BLUE'] + 19, .8), 2.0, .25)

    # ② THREE LEVELS
    for li, L in enumerate(LV):
        tr = 2 * li                                                    # up a whole tone per level
        prog = [(r + tr, iv) for r, iv in PROG]
        # intro bar: stab · 3 · 2 · 1
        backing(st, L['t0'], [prog[3]], g=.6, kick=False, riff=False)
        for j, iv in enumerate([0, 4, 7, 12]): st.put('hits', zap(prog[0][0] + 12 + iv, .9, d=.5), L['t0'] + .01 * j, .38, (j - 1.5) * .2)
        st.put('drums', k_crash(.3, 1.2), L['t0'], .3)
        for j in range(3): st.put('hits', zap(prog[0][0] + 12 + [0, 4, 7][j], .8 + .08 * j, d=.28), L['t0'] + (j + 1) * b, .5); st.kick(L['t0'] + (j + 1) * b, .6)
        # the words' bars: the backing gets busier per level
        nb = int(round((L['end'] - L['w0']) / 2))
        backing(st, L['w0'], [prog[k % 4] for k in range(nb)], g=.75 + .1 * li, riff=li >= 1)
        if li == 2:                                                    # level 3: 16th hats on top, then roll + riser
            for tb in np.arange(L['w0'], L['end'] - 2, b / 4): st.hat(tb, .14, pan=.3)
            for j, tb in enumerate(np.arange(L['end'] - 2, L['end'] - 1e-3, b / 4)): st.snare(tb, .15 + .3 * j / 16)
            st.put('fx', k_uplift(2.0, f0=400, octs=5), L['end'] - 2, .4)
            st.put('lead', gliss(72, 100, 2.0, duty=.25), L['end'] - 2, .35)
    for w in WD:
        m = NOTE[w['ink']] + 2 * w['li']; half = w['step'] * .5
        st.put('hits', zap(m, 1.0, d=.35), w['t'], .65); st.put('hits', zap(m - 24, .8, d=.15, drop_=2.5), w['t'], .35)
        if w['wrong']: st.put('hits', buzzer(), w['t'] + half, .55)
        else: st.put('hits', zap(m + 7, .7, d=.25), w['t'] + half, .4, .2)
    # (true silence T['sil'] → T['pay'] is carved in mix.py)

    # ③ WHY · 30.5–36: an impact and a swell, then the backing returns softly while the words orbit
    p = T['pay']
    st.put('fx', k_subdrop(.8, 2.0), p, .4); st.put('drums', k_crash(.45, 2.5), p, .4)
    st.put('hits', zap(84, 1.0, d=.8), p, .6); st.put('hits', zap(48, .9, d=.4, drop_=2.5), p, .5)
    swell(st, [45, 52, 57, 60, 64, 69], p, 2.0, g=.85, att=.06, bassnote=33)
    swell(st, [41, 53, 57, 60, 65, 69], p + 2.0, T['cta'] - p - 2.0 + .15, g=.65, att=.4, bassnote=29)
    backing(st, p + 1.5, [(57, MIN), (53, MAJ)], g=.6, riff=False)
    for j, note in enumerate([72, 76, 79, 83, 79, 76, 72, 76]): st.put('hits', zap(note + 12, .4, d=.2), p + 1.5 + j * b, .22, (j % 2 - .5) * .5)   # the orbit, as notes

    # ④ CTA 36–42: home to C, backing + the colour notes as a little tune, a final hit
    c = T['cta']
    st.put('hits', zap(72, 1.0, d=.5), c, .55); st.put('hits', zap(48, .9, d=.3, drop_=2.5), c, .45)
    backing(st, c, [(60, MAJ), (57, MIN), (53, MAJ)], g=.95)
    swell(st, [48, 55, 60, 64, 67, 72], c, dur - c, g=.55, att=.3, bassnote=36)
    tune = [('RED', 1), ('BLUE', 1), ('GREEN', 2), ('PURPLE', 1), ('GREEN', 1), ('BLUE', 2), ('RED', 4)]
    tt = c + 1.0
    for name, bt in tune: st.put('lead', lead(NOTE[name] + 12, bt * b * .92), tt, .38); tt += bt * b
    st.kick(c + 12 * b, .9); st.put('hits', zap(84, 1.0, d=.9), c + 12 * b, .5); st.put('drums', k_crash(.5, 2.0), c + 12 * b, .4)
    return st.mixdown()
