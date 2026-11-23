"""score.py — "Paper to the Moon": sonified build + cinematic swells (the 7M-view model). 120 bpm grid.
  · every fold is a note one semitone up (E4 → A#7 across 42 folds); between folds a stream that thickens window by
    window (none → 8ths → 16ths → 16ths doubled → 32nds) while the choir under it turns dissonant
  · a synth slide into true silence; fold 42 lands on the Moon as a huge slow C-major swell with a lyrical line
  · the record (12 folds) is a small dry joke: a slide down and a few plucks
  · the universe burst: 61 folds in under two seconds as a 32nd stream racing up, then the biggest swell (F), which
    resolves home to C under the CTA with high arpeggios and the opening slide's answer."""
import numpy as np
from studio import (Studio, swell, ping, gliss, sine_bass, choir, chordtone, bell, lead, drone, pluck, trill,
                    k_uplift, k_subdrop, k_crash, SR, ns)

def build(e, dur):
    T = e['TL']; F = e['FOLDS']
    st = Studio(dur, 120, rt=2.6, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .3
    b = .5; go = T['go']; sil = T['sil']; win = T['win']
    pitch = lambda n: 57 + n

    # ① HOOK 0–3.5: a slide up out of nothing, an open fifth held like a question, a few sparse pings
    st.put('lead', gliss(64, 88, 1.4), .05, .45)
    st.put('choir', choir([64, 71], go, 'oo', att=.8), .3, .55)
    st.put('bass', drone(52, go), 0, .2)
    for i, t in enumerate([1.5, 2.0, 2.5, 3.0]): st.put('fx', ping((76, 83, 76, 88)[i], .5), t, .5, (i % 2 - .5) * .5)

    # ② THE CLIMB 3.5–21.0: each fold = a ping one semitone up; the filler stream thickens window by window
    for i, t in enumerate(F[:-1]):
        n = i + 1; st.put('fx', ping(pitch(n), .9), t, .5); st.put('fx', bell(pitch(n) + 12, .5), t, .14, .1)
    for w in range(5):
        t0 = go + w * win; t1 = min(sil, t0 + win)
        step = [None, b / 2, b / 4, b / 4, b / 8][w]
        if step:
            t = t0; i = 0
            while t < t1 - 1e-6:
                n = sum(1 for f in F if f <= t + 1e-6)
                if not any(abs(f - t) < 1e-3 for f in F):
                    m = pitch(n) + [7, 12, 5, 12, 3, 7, 12, 19][i % 8] - (12 if w == 4 and i % 2 else 0)
                    st.put('fx', ping(m, .26 + .08 * w + (.12 if w == 3 and i % 2 else 0)), t, .38, .15 if i % 2 else -.15)
                t += step; i += 1
        ch = [[64, 71], [64, 67, 71], [64, 67, 71, 76], [64, 65, 71, 76], [64, 65, 70, 71, 77]][w]
        st.put('choir', choir(ch, t1 - t0 + .1, 'oo' if w < 2 else 'ah', att=.35), t0, .8 + .05 * w)
        st.put('chords', chordtone([m - 12 for m in ch], t1 - t0 + .1, a=.4, r=.3, cut=1800, duty=.5), t0, .5)
        if w: st.put('choir', choir([52 + 2 * w, 59 + 2 * w], .45, 'ah', att=.01), t0, .5); st.put('fx', bell(88 + 3 * w, 1.0), t0, .3, -.2)   # milestone
    st.put('bass', drone(52, sil - go), go, .2)
    st.put('lead', trill(88, sil - (go + 3 * win)), go + 3 * win, .14, .2)
    st.put('lead', gliss(76, 104, sil - 19.4, duty=.25), 19.4, .5)                       # the slide into the silence
    st.put('fx', k_uplift(2.0, f0=400, octs=5), sil - 2.0, .45)
    # (true silence sil → moon is carved in mix.py)

    # ③ THE MOON 21.5–25.5: fold 42 lands. A huge slow C-major swell, then G/B; a lyrical line
    o = T['moon']
    st.put('fx', ping(pitch(42), 1.0, d=.6), o, .6); st.put('fx', bell(100, 2.5), o, .4)
    st.put('fx', k_subdrop(.8, 2.0), o, .4); st.put('drums', k_crash(.45, 3.0), o, .4)
    swell(st, [48, 55, 60, 64, 67, 72, 76], o, 2.0, g=1.2, att=.06, bassnote=36)
    swell(st, [47, 55, 59, 62, 67, 71], o + 2.0, T['record'] - o - 2.0 + .15, g=1.05, att=.4, bassnote=35)
    tt = o + .6
    for m, d in [(76, 1.0), (79, .5), (77, .5), (76, 1.0), (72, .9)]: st.put('lead', lead(m, d * .95, vib=.015), tt, .42); tt += d

    # ④ THE RECORD 25.5–29.5 · "12 FOLDS": a small dry joke. A slide down, a few lonely plucks, a strained little trill
    r = T['record']
    st.put('lead', gliss(79, 62, .9), r + .05, .4)
    st.put('choir', choir([57, 64], T['uni'] - r - .3, 'oo', att=.5), r + .3, .35)
    for i, t in enumerate(np.arange(r + 1.0, T['uni'] - .3, b / 2)): st.put('fx', pluck([69, 72, 76, 72, 69, 64, 69, 72][i % 8], .2, duty=.5, tau=.06), t, .45, (i % 2 - .5) * .4)
    st.put('lead', trill(81, 1.6, rate=11), r + 1.6, .1)

    # ⑤ THE UNIVERSE 29.5–33.5: 61 folds in 1.75 s = a 32nd stream racing up + a slide + an uplifter, then the biggest swell (F)
    u0 = T['uniGo']; hit = T['uniHit']
    st.put('choir', choir([64, 71, 76], hit - T['uni'], 'ah', att=.3), T['uni'], .5)
    t = u0; i = 0
    while t < hit - 1e-6:
        pr = (t - u0) / (hit - u0)
        st.put('fx', ping(min(100, 62 + int(pr * 38)) - (12 if i % 2 else 0), .5 + .4 * pr), t, .45, (.15 if i % 2 else -.15)); t += b / 8; i += 1
    st.put('lead', gliss(64, 100, hit - u0, duty=.25), u0, .5)
    st.put('fx', k_uplift(hit - u0, f0=400, octs=5), u0, .5)
    st.put('fx', k_subdrop(.9, 2.5), hit, .45); st.put('drums', k_crash(.5, 3.0), hit, .45); st.put('fx', bell(101, 2.5), hit, .4)
    swell(st, [41, 53, 57, 60, 65, 69, 72, 77], hit, T['cta'] - hit + .15, g=1.25, att=.06, bassnote=29)

    # ⑥ CTA 33.5–37.5: home to C. The last swell, high arpeggios, the opening slide's answer, a wink, ringing out
    c = T['cta']
    swell(st, [48, 55, 60, 64, 67, 72, 76], c, dur - c, g=1.15, att=.3, bassnote=36)
    st.melody([(72, 2), (79, 2), (84, 3.8)], c + .1, g=.5, legato=.98)
    t = c + .5; i = 0
    while t < dur - .5:
        st.put('fx', ping([76, 79, 84, 88][i % 4] + 12 * ((i // 4) % 2), .36), t, .28, (.15 if i % 2 else -.15)); t += b / 4; i += 1
    st.put('fx', bell(100, 1.0), c + 1.2, .4, .3)
    return st.mixdown()
