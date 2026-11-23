"""score.py — "23 People": sonified build + cinematic swells (the 7M-view model). 120 bpm grid.
  · every guest is a note one semitone up (C4 → A#5 across 23 guests); every handshake line they draw is a note of a
    quick rising run, so the runs get longer and denser as the room fills: the pairs explode in the ear
  · a choir darkens under it; a slide into true silence; guest 23 lands as a huge bright D-major swell + sparkle
  · "253 pairs": a rippling 16th arpeggio over slow swells; the 70-guest burst: a 32nd stream racing up, then the
    biggest swell; the CTA resolves home with arpeggios and the opening slide's answer."""
import numpy as np
from studio import (Studio, swell, ping, gliss, choir, chordtone, bell, lead, drone, trill, drop,
                    k_uplift, k_subdrop, k_crash, SR, ns)

def build(e, dur):
    T = e['TL']; A = e['ARR']                                   # A[p] = arrival time of guest p (0-based), p = 0…22
    st = Studio(dur, 120, rt=2.6, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .3
    b = .5; go = T['go']; sil = T['sil']; win = T['win']
    pitch = lambda p: 60 + p

    # ① HOOK 0–4: a slide up, an open fifth held like a question, a few party pings
    st.put('lead', gliss(60, 84, 1.4), .05, .45)
    st.put('choir', choir([60, 67], go, 'oo', att=.8), .3, .7)
    st.put('chords', chordtone([48, 55], go, a=.6, r=.3, cut=1800, duty=.5), .3, .45)
    for i, t in enumerate([1.5, 2.0, 2.5, 3.0, 3.5]): st.put('fx', ping((72, 79, 72, 84, 79)[i], .5), t, .45, (i % 2 - .5) * .4)

    # ② THE ROOM FILLS 4–18: each guest = a ping; each of their handshake lines = a note in a rising run (32nd grid)
    RUN = [0, 4, 7, 12, 16, 19, 24, 28, 31, 36]
    for p in range(1, 22):
        t = A[p]; gap = A[p + 1] - t
        st.put('fx', ping(pitch(p), .9), t, .5); st.put('fx', drop(pitch(p) + 12), t, .25, .1)
        k = min(p, int(gap * .75 / (b / 8)), len(RUN) - 1)       # as many run notes as lines, up to what fits
        for j in range(1, k + 1):
            st.put('fx', ping(pitch(p) + RUN[j], .3 + .03 * j), t + j * b / 8, .34, (.15 if j % 2 else -.15))
    for w in range(4):
        t0 = go + w * win; t1 = t0 + win
        ch = [[60, 67], [60, 64, 67], [60, 63, 67, 72], [60, 61, 67, 72, 75]][w]
        st.put('choir', choir(ch, t1 - t0 + .1, 'oo' if w < 2 else 'ah', att=.35), t0, .8 + .05 * w)
        st.put('chords', chordtone([m - 12 for m in ch], t1 - t0 + .1, a=.4, r=.3, cut=1800, duty=.5), t0, .5)
        if w: st.put('fx', bell(84 + 3 * w, 1.0), t0, .28, -.2)
    st.put('lead', trill(84, sil - (go + 3 * win)), go + 3 * win, .13, .2)
    st.put('lead', gliss(72, 98, sil - 16.4, duty=.25), 16.4, .5)                       # the slide into the silence
    st.put('fx', k_uplift(2.0, f0=400, octs=5), sil - 2.0, .45)
    # (true silence sil → hit is carved in mix.py)

    # ③ GUEST 23 · 18.5–22.5: the match. A huge bright D-major swell, a sparkle of bells, a happy little line
    o = T['hit']
    st.put('fx', ping(pitch(22), 1.0, d=.6), o, .55)
    st.put('fx', k_subdrop(.8, 2.0), o, .4); st.put('drums', k_crash(.45, 3.0), o, .4)
    for j, m in enumerate([86, 90, 93, 98, 93, 98, 102]): st.put('fx', bell(m, .9), o + .05 + j * .09, .34, (j % 3 - 1) * .3)
    swell(st, [50, 57, 62, 66, 69, 74, 78], o, 2.0, g=1.2, att=.06, bassnote=38)
    swell(st, [43, 55, 59, 62, 67, 71], o + 2.0, T['pairs'] - o - 2.0 + .15, g=1.05, att=.4, bassnote=31)
    tt = o + .7
    for m, d in [(78, .5), (81, .5), (86, 1.0), (83, .5), (81, .5), (78, .8)]: st.put('lead', lead(m, d * .95, vib=.015), tt, .42); tt += d

    # ④ "253 PAIRS" 22.5–26.5: the web ripples. A 16th arpeggio over Bm → A swells
    q = T['pairs']
    swell(st, [47, 54, 59, 62, 66, 71], q, 2.0, att=.4, vowel='oo', bassnote=35)
    swell(st, [45, 52, 57, 61, 64, 69], q + 2.0, T['burst'] - q - 2.0 + .3, att=.4, vowel='oo', bassnote=33)
    t = q; i = 0
    while t < T['burst'] - .05:
        ch = [71, 74, 78, 83] if t < q + 2.0 else [69, 73, 76, 81]
        st.put('fx', ping(ch[i % 4] + (12 if (i // 4) % 2 else 0), .36), t, .32, (.15 if i % 2 else -.15)); t += b / 4; i += 1

    # ⑤ THE BURST 26.5–30.5: 47 more guests in 1.75 s = a 32nd stream racing up + a slide, then the biggest swell (G → A)
    u0 = T['burstGo']; hit = T['burstHit']
    st.put('choir', choir([62, 69, 74], hit - T['burst'], 'ah', att=.3), T['burst'], .5)
    t = u0; i = 0
    while t < hit - 1e-6:
        pr = (t - u0) / (hit - u0)
        st.put('fx', ping(min(100, 62 + int(pr * 38)) - (12 if i % 2 else 0), .5 + .4 * pr), t, .45, (.15 if i % 2 else -.15)); t += b / 8; i += 1
    st.put('lead', gliss(62, 98, hit - u0, duty=.25), u0, .5)
    st.put('fx', k_uplift(hit - u0, f0=400, octs=5), u0, .5)
    st.put('fx', k_subdrop(.9, 2.5), hit, .45); st.put('drums', k_crash(.5, 3.0), hit, .45); st.put('fx', bell(98, 2.5), hit, .4)
    swell(st, [43, 55, 59, 62, 67, 71, 74, 79], hit, T['cta'] - hit + .15, g=1.25, att=.06, bassnote=31)

    # ⑥ CTA 30.5–35: home to D. The last swell, high arpeggios, the opening slide's answer, a wink, ringing out
    c = T['cta']
    swell(st, [50, 57, 62, 66, 69, 74, 78], c, dur - c, g=1.15, att=.3, bassnote=38)
    st.melody([(74, 2), (81, 2), (86, 4.6)], c + .1, g=.5, legato=.98)
    t = c + .5; i = 0
    while t < dur - .6:
        st.put('fx', ping([78, 81, 86, 90][i % 4] + 12 * ((i // 4) % 2), .36), t, .28, (.15 if i % 2 else -.15)); t += b / 4; i += 1
    st.put('fx', bell(102, 1.0), c + 1.2, .4, .3)
    return st.mixdown()
