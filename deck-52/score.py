"""score.py — "52 Cards": punchy sonified build + cinematic swells (STYLE.md §7). 120 bpm grid.
  · every card is a dry zap one semitone up (C3 → D#7 across 52 cards) with a landing thud, on the frame it lands;
    the cards come faster window by window (4, 6, 9, 13, 19), so the hits accelerate by themselves
  · every landmark the number beats is a bright chord hit; a quiet choir darkens underneath
  · a slide into true silence; card 52 lands on a wide awe-struck swell
  · "all of us since the Big Bang": a 32nd stream racing up… then a comic slide down and a dry thud ("not even close")
  · "your shuffle is a world first": the biggest swell, with a lyrical line; the cards fly home as a falling run;
    the CTA resolves with arpeggios and the opening slide's answer."""
import numpy as np
from studio import (Studio, swell, ping, zap, gliss, choir, chordtone, bell, lead, trill,
                    k_uplift, k_subdrop, k_crash, SR, ns)

def build(e, dur):
    T = e['TL']; A = e['ARR']; MK = e['MARKS']; FLY = e['FLY']
    st = Studio(dur, 120, rt=1.9, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .3
    b = .5; go = T['go']; sil = T['sil']; win = T['win']
    pitch = lambda k: 47 + k

    # ① HOOK 0–4: a slide up, a quiet held fifth, a riffle of soft hits like a shuffle
    st.put('lead', gliss(60, 84, 1.4), .05, .4)
    st.put('choir', choir([60, 67], go, 'oo', att=.8), .3, .3)
    st.put('chords', chordtone([48, 55], go, a=.6, r=.3, cut=1500, duty=.5), .3, .22)
    for i in range(12): st.put('hits', zap(72 + (i * 5) % 12, .35, d=.08), 1.6 + i * .045, .3, (i % 2 - .5) * .4)       # riffle
    for i, t in enumerate([2.6, 3.1, 3.5]): st.put('hits', zap((72, 79, 84)[i], .7), t, .45, (i % 2 - .5) * .3)

    # ② THE DEAL 4–21.5: a card lands = a loud zap + a thud (and a little whoosh as it flies)
    for i, t in enumerate(A[:-1]):
        k = i + 1; late = k > 32
        st.put('hits', zap(pitch(k), 1.0, d=.4 if not late else .28), t, .7 if not late else .6, (k % 2 - .5) * .2)
        st.put('hits', zap(pitch(k) - 24, .8, d=.16, drop_=2.5), t, .36)
        st.put('fx', k_uplift(FLY, f0=1500, octs=2), t - FLY, .1)
        if late and i + 1 < len(A) - 1: st.put('hits', zap(pitch(k) + 12, .5, d=.12), (t + A[i + 1]) / 2, .3, (.25 if k % 2 else -.25))   # offbeats
        if k in MK:                                               # the number beats a landmark: a bright chord hit
            for j, iv in enumerate([0, 4, 7, 12]): st.put('hits', zap(pitch(k) + 12 + iv, .8, d=.6), t + .02 * j, .34, (j - 1.5) * .25)
            st.put('fx', bell(pitch(k) + 24, 1.2), t, .25)
    for w in range(5):
        t0 = go + w * win; t1 = t0 + win
        ch = [[60, 67], [60, 64, 67], [60, 63, 67, 72], [60, 61, 67, 72], [60, 61, 66, 67, 73]][w]
        st.put('choir', choir(ch, t1 - t0 + .1, 'oo' if w < 2 else 'ah', att=.35), t0, .3 + .04 * w)
        st.put('chords', chordtone([m - 12 for m in ch], t1 - t0 + .1, a=.4, r=.3, cut=1500, duty=.5), t0, .22)
    st.put('lead', trill(84, sil - (go + 4 * win)), go + 4 * win, .1, .2)
    st.put('lead', gliss(72, 100, sil - 19.9, duty=.25), 19.9, .45)                      # the slide into the silence
    st.put('fx', k_uplift(2.0, f0=400, octs=5), sil - 2.0, .4)
    # (true silence sil → hit is carved in mix.py)

    # ③ CARD 52 · 22–26: awe. A wide A-minor swell opening to F, sparkling hits as the cards light up
    o = T['hit']
    st.put('hits', zap(pitch(52), 1.0, d=.7), o, .8); st.put('hits', zap(pitch(52) - 36, .9, d=.35, drop_=2.5), o, .5)
    st.put('fx', k_subdrop(.8, 2.0), o, .4); st.put('drums', k_crash(.45, 3.0), o, .4)
    swell(st, [45, 52, 57, 60, 64, 69, 72], o, 2.0, g=.95, att=.06, bassnote=33)
    swell(st, [41, 53, 57, 60, 65, 69], o + 2.0, T['burst'] - o - 2.0 + .15, g=.8, att=.4, bassnote=29)
    for j in range(16): st.put('hits', zap([81, 84, 88, 93][j % 4] + (12 if (j // 4) % 2 else 0), .5, d=.22), o + .8 + j * b / 4, .28, (.2 if j % 2 else -.2))

    # ④ ALL OF US SINCE THE BIG BANG · 26–30: a 32nd stream racing up + a slide… then a comic slide down and a dry thud
    u0 = T['burstGo']; hit = T['burstHit']
    st.put('choir', choir([60, 65, 72], hit - T['burst'], 'ah', att=.3), T['burst'], .4)
    t = u0; i = 0
    while t < hit - 1e-6:
        pr = (t - u0) / (hit - u0)
        st.put('hits', zap(min(100, 60 + int(pr * 40)) - (12 if i % 2 else 0), .6 + .4 * pr, d=.13), t, .45, (.15 if i % 2 else -.15)); t += b / 8; i += 1
    st.put('lead', gliss(60, 98, hit - u0, duty=.25), u0, .45)
    st.put('fx', k_uplift(hit - u0, f0=400, octs=5), u0, .45)
    st.put('lead', gliss(86, 50, .8), hit + .02, .5)                                      # "…not even close"
    st.put('hits', zap(38, 1.0, d=.4, drop_=2.0), hit + .8, .6)
    st.put('choir', choir([53, 60], T['punch'] - hit - .9, 'oo', att=.3), hit + .9, .3)
    for j, t in enumerate(np.arange(hit + 1.0, T['punch'] - .1, b / 2)): st.put('hits', zap(72 if j % 2 else 67, .4, d=.1), t, .22, (j % 2 - .5) * .4)   # a clock, waiting

    # ⑤ A WORLD FIRST · 30–34: the biggest swell (C major), a lyrical line, sparkle
    p = T['punch']
    st.put('fx', k_subdrop(.9, 2.5), p, .45); st.put('drums', k_crash(.5, 3.0), p, .45)
    st.put('hits', zap(84, 1.0, d=.8), p, .6); st.put('hits', zap(48, .9, d=.4, drop_=2.5), p, .5)
    swell(st, [48, 55, 60, 64, 67, 72, 76, 79], p, 2.0, g=1.15, att=.06, bassnote=36)
    swell(st, [43, 55, 59, 62, 67, 71, 74], p + 2.0, T['cta'] - p - 2.0 + .15, g=1.0, att=.4, bassnote=31)
    tt = p + .6
    for m, d in [(76, .5), (79, .5), (84, 1.0), (83, .5), (79, .5), (76, .8)]: st.put('lead', lead(m, d * .95, vib=.015), tt, .45); tt += d
    for j in range(14): st.put('hits', zap([88, 91, 96, 100][j % 4], .45, d=.2), p + .3 + j * b / 4, .22, (.2 if j % 2 else -.2))

    # ⑥ CTA 34–38: the cards fly home as a falling run; home to C with arpeggios and the opening slide's answer
    c = T['cta']
    for j in range(20): st.put('hits', zap(96 - j * 2, .55, d=.12), c + .25 + j * .055, .34, (.2 if j % 2 else -.2))
    st.put('hits', zap(48, .9, d=.35, drop_=2.5), c + 1.4, .5)
    swell(st, [48, 55, 60, 64, 67, 72, 76], c, dur - c, g=1.05, att=.3, bassnote=36)
    st.melody([(72, 2), (79, 2), (84, 3.8)], c + .1, g=.45, legato=.98)
    t = c + 1.6; i = 0
    while t < dur - .5:
        st.put('hits', zap([76, 79, 84, 88][i % 4] + 12 * ((i // 4) % 2), .5, d=.2), t, .24, (.15 if i % 2 else -.15)); t += b / 4; i += 1
    return st.mixdown()
