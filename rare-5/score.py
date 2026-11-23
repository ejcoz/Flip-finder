"""score.py — "How Rare Are You?": punchy sonified score (STYLE.md §7). 120 bpm feel, cue by cue.
Each test is a little game-show round, one step higher in key than the last:
  · the instruction lands on a bright hit; the 3-2-1 countdown is three rising zaps over a tense held note
  · the reveal is a big chord hit; then the crowd lights up as a run of notes, one per ~3 people, so a common ability
    is a long rushing run and a rare one is just a few notes: you hear how rare it is
True silence before the finale; the 1,600-dot sweep is a 32nd stream racing up into the biggest swell; the CTA resolves
home with arpeggios and the opening slide's answer."""
import numpy as np
from studio import (Studio, swell, zap, gliss, choir, chordtone, bell, lead, trill,
                    k_uplift, k_subdrop, k_crash, SR, ns)

def build(e, dur):
    T = e['TL']; TS = e['TESTS']
    st = Studio(dur, 120, rt=1.9, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .3
    b = .5; go = T['go']

    # ① HOOK 0–4: a slide up, a playful call-and-answer of hits, a held question
    st.put('lead', gliss(60, 84, 1.2), .05, .4)
    st.put('choir', choir([60, 67], go, 'oo', att=.7), .3, .3)
    for i, (t, m) in enumerate([(1.3, 72), (1.55, 76), (1.8, 79), (2.4, 84), (2.9, 79), (3.15, 84), (3.4, 88)]): st.put('hits', zap(m, .7, d=.3), t, .45, (i % 2 - .5) * .3)
    st.put('fx', k_uplift(.8, f0=600, octs=3), go - .8, .3)

    # ② FIVE ROUNDS: each a whole tone higher
    for i, X in enumerate(TS):
        r = 60 + 2 * i; t0 = X['t0']; rev = X['rev']
        # the instruction: a bright two-note "ta-da" + a low thud
        st.put('hits', zap(r + 12, .9, d=.35), t0, .6); st.put('hits', zap(r + 19, .8, d=.4), t0 + .12, .5); st.put('hits', zap(r - 12, .8, d=.2, drop_=2.5), t0, .4)
        # the try: a tense held second (r, r+1) and a quiet trill; 3-2-1 = three rising zaps, louder each time
        st.put('choir', choir([r, r + 1, r + 7], rev - t0 - .3, 'oo', att=.3), t0 + .3, .34)
        st.put('chords', chordtone([r - 12, r - 5], rev - t0, a=.3, r=.1, cut=1500, duty=.5), t0, .22)
        st.put('lead', trill(r + 24, rev - X['ticks'][0], rate=10), X['ticks'][0], .08, .2)
        for j, tk in enumerate(X['ticks']):
            st.put('hits', zap(r + 12 + 2 * j, .8 + .1 * j, d=.3), tk, .5 + .08 * j); st.put('hits', zap(r - 12, .7, d=.15, drop_=2.5), tk, .3)
        st.put('fx', k_uplift(.5, f0=800, octs=3), rev - .5, .3)
        # the reveal: a big major chord hit + thud, then the crowd run (one note per ~3 people, rising)
        for j, iv in enumerate([0, 4, 7, 12, 16]): st.put('hits', zap(r + 12 + iv, .9, d=.7), rev + .012 * j, .4, (j - 2) * .2)
        st.put('hits', zap(r - 12, 1.0, d=.4, drop_=2.5), rev, .55); st.put('drums', k_crash(.35, 1.5), rev, .3)
        n = max(3, X['pct'] // 3); span = X['pct'] * X['d']
        SC = [0, 2, 4, 7, 9]
        for j in range(n):
            st.put('hits', zap(r + 12 + SC[j % 5] + 12 * (j // 5), .5 + .02 * j, d=.14), rev + .03 + j * span / n, .3, (.2 if j % 2 else -.2))
        swell(st, [r - 12, r - 5, r, r + 4, r + 7], rev, t0 + T['per'] - rev, g=.55, att=.05, bassnote=r - 24)
    # (true silence T['sil'] → T['fin'] is carved in mix.py)

    # ③ ALL FIVE · 32–36: the hero shrinks (a falling slide), the 1,600 sweep in as a 32nd stream racing up, then the
    #    biggest swell lands when "YOU" lights up
    f = T['fin']; s0 = T['sweep0']; s1 = T['sweep1']
    st.put('lead', gliss(84, 60, .4), f, .45)
    st.put('choir', choir([62, 69], s1 - f, 'ah', att=.2), f, .4)
    t = s0; i = 0
    while t < s1 - 1e-6:
        pr = (t - s0) / (s1 - s0)
        st.put('hits', zap(min(100, 62 + int(pr * 38)) - (12 if i % 2 else 0), .6 + .4 * pr, d=.13), t, .45, (.15 if i % 2 else -.15)); t += b / 8; i += 1
    st.put('lead', gliss(62, 98, s1 - s0, duty=.25), s0, .45); st.put('fx', k_uplift(s1 - s0, f0=400, octs=5), s0, .45)
    st.put('fx', k_subdrop(.9, 2.5), s1, .45); st.put('drums', k_crash(.5, 3.0), s1, .45)
    st.put('hits', zap(86, 1.0, d=.9), s1, .6); st.put('hits', zap(50, .9, d=.4, drop_=2.5), s1, .5)
    swell(st, [50, 57, 62, 66, 69, 74, 78], s1, 1.4, g=1.15, att=.06, bassnote=38)
    swell(st, [43, 55, 59, 62, 67, 71], s1 + 1.4, T['cta'] - s1 - 1.4 + .15, g=1.0, att=.4, bassnote=31)
    tt = s1 + .5
    for m, d in [(78, .5), (81, .5), (86, .9), (83, .5)]: st.put('lead', lead(m, d * .95, vib=.015), tt, .45); tt += d

    # ④ CTA 36–41: the hero pops back (a hit), home to D with arpeggios, the opening slide's answer, ringing out
    c = T['cta']
    st.put('hits', zap(74, 1.0, d=.5), c, .6); st.put('hits', zap(50, .9, d=.3, drop_=2.5), c, .5)
    swell(st, [50, 57, 62, 66, 69, 74, 78], c, dur - c, g=1.05, att=.3, bassnote=38)
    st.melody([(74, 2), (81, 2), (86, 5)], c + .1, g=.45, legato=.98)
    t = c + .5; i = 0
    while t < dur - .6:
        st.put('hits', zap([78, 81, 86, 90][i % 4] + 12 * ((i // 4) % 2), .5, d=.2), t, .24, (.15 if i % 2 else -.15)); t += b / 4; i += 1
    return st.mixdown()
