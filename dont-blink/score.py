"""score.py — "Don't Blink": sonified build + cinematic swells (the 7M-view model).
120 bpm grid (one count second = 2 beats). Almost no drums: the energy is note density and rising pitch.
  · the countdown is a stream of pings: each second is a note one semitone up (E5 → G6); between seconds the stream
    thickens as the eye dries (8ths → 16ths as it stings → 32nds in the panic), with cracks as extra high pings
  · under it a choir that turns more dissonant; a synth slide into the silence; BLINK! lands as a huge slow C-major
    swell — relief — with a falling cascade of drops; then evolving swells, a lyrical line, the brain-hides blink-outs,
    a talking-left / screen-right stream, and the biggest swell under the CTA."""
import numpy as np
from studio import (Studio, swell, ping, gliss, sine_bass, choir, chordtone, bell, lead, drone, drop, trill,
                    k_uplift, k_subdrop, k_crash, SR, ns, lp, blep_pulse)

def build(e, dur):
    T = e['TL']; CALM = e['CALM']; TALK = e['TALK']; SCR = e['SCREEN']
    st = Studio(dur, 120, rt=2.6, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .5
    b = .5; go = T['go']; sil = T['silence']; o = T['blink']

    # ① HOOK 0–3.0 · "DON'T BLINK FOR 15 SECONDS": a slide up, a held breath (a soft open fifth), a few clock pings
    st.put('lead', gliss(64, 88, 1.4), .05, .45)
    st.put('choir', choir([64, 71], go, 'oo', att=.8), .3, .55)
    st.put('bass', drone(52, go), 0, .2)
    for i, t in enumerate([1.5, 2.0, 2.5, 2.75]): st.put('fx', ping((76, 83, 76, 83)[i], .55), t, .5, (i % 2 - .5) * .5)

    # ② COUNTDOWN 3.0–17.5: each second = a ping one semitone up; between seconds the stream thickens as the eye dries
    t = go; i = 0
    while t < sil - 1e-6:
        step = b / 2 if t < 10.6 else b / 4 if t < 14.4 else b / 8
        cp = 76 + int(np.floor(t - go)); on_count = abs((t - go) - round(t - go)) < 1e-6
        m = cp if on_count else cp + [7, 12, 5, 12, 3, 7, 1, 12][i % 8]
        lvl = .85 if on_count else .28 + .3 * (t - go) / (sil - go)
        st.put('fx', ping(m, lvl), t, .55, 0 if on_count else (.25 if i % 2 else -.25))
        if on_count: st.put('fx', bell(cp + 12, .5), t, .22, .2)
        t += step; i += 1
    # "tear film": watery drops under the first section
    for j, t in enumerate(np.arange(go, 6.8, b)): st.put('fx', drop(88 + (0, 4, 7, 12)[j % 4]), t + b / 4, .3, (j % 2 - .5) * .4)
    # cracks (10.6–14.4): extra bright, off-grid pings, more and more
    rng = np.random.default_rng(3)
    for t in np.sort(rng.uniform(10.6, sil, 26)): st.put('fx', ping(int(rng.integers(96, 104)), .25, d=.12), t, .3, rng.uniform(-.3, .3))
    # the choir under it turns dissonant: open fifth → minor → add a minor 2nd → a cluster; a trill appears as it stings
    st.put('choir', choir([64, 71], 6.8 - go, 'oo', att=.5), go, .55)
    st.put('choir', choir([64, 67, 71], 10.6 - 6.8, 'oo', att=.4), 6.8, .6)
    st.put('choir', choir([64, 65, 71, 76], 14.4 - 10.6, 'ah', att=.3), 10.6, .65)
    st.put('choir', choir([64, 65, 70, 71, 76], sil - 14.4, 'ah', att=.2), 14.4, .7)
    st.put('lead', trill(88, 14.4 - 10.6), 10.6, .18, .2)
    st.put('bass', drone(52, sil - go), go, .22)
    st.put('lead', gliss(76, 100, sil - 15.5, duty=.25), 15.5, .5)                      # the slide into the silence
    st.put('fx', k_uplift(2.0, f0=400, octs=5), sil - 2.0, .45)
    # (true silence sil → blink is carved in mix.py)

    # ③ BLINK! 18.0–22.2 · relief. A huge slow C-major swell, a falling cascade of drops, then G/B; each blink = a soft bell
    st.put('fx', k_subdrop(.8, 2.0), o, .4); st.put('drums', k_crash(.45, 3.0), o, .4)
    for j, m in enumerate([100, 96, 93, 91, 88, 84, 81, 79, 76]): st.put('fx', drop(m), o + .04 + j * .05, .45, (j % 3 - 1) * .3)
    swell(st, [48, 55, 60, 64, 67, 72], o, 2.1, g=1.15, att=.06, bassnote=36)
    swell(st, [47, 55, 59, 62, 67, 71], o + 2.1, T['hour'] - o - 2.1 + .3, g=1.0, att=.4, bassnote=35)
    tt = o + .6
    for m, d in [(76, 1.0), (79, .5), (77, .5), (76, 1.0), (72, 1.2)]: st.put('lead', lead(m, d * .95, vib=.015), tt, .42); tt += d
    for bt in CALM:
        if bt < T['hour']: st.put('fx', bell(91, .6), bt, .3, .2)

    # ④ "~1 HOUR A DAY · YOUR BRAIN HIDES IT" 22.2–26.4: wonder. Am → Fmaj7 swells with a high 16th arpeggio,
    #    and the whole track blinks out for 130 ms on every on-screen blink
    h = T['hour']; sp = T['split']
    swell(st, [45, 57, 60, 64, 69], h, 2.1, att=.4, vowel='oo', bassnote=33)
    swell(st, [41, 57, 60, 64, 65, 69], h + 2.1, sp - h - 2.1 + .3, att=.4, vowel='oo', bassnote=29)
    t = h; i = 0
    while t < sp - .05:
        ch = [81, 84, 88, 93] if t < h + 2.1 else [77, 81, 84, 88]
        st.put('fx', ping(ch[i % 4] + (12 if (i // 4) % 2 else 0), .35), t, .4, (.25 if i % 2 else -.25)); t += b / 4; i += 1
    for bt in CALM:
        if h <= bt < sp: st.gate(bt, bt + .13)

    # ⑤ SPLIT 26.4–30.0 · "ON SCREENS YOU BLINK 3× LESS": left = a lively stream (talking, blinking), right = a flat hum
    #    with one lonely ping; soft Dm → G swells in the middle
    c = T['cta']
    swell(st, [50, 57, 62, 65, 69], sp, 1.8, g=.7, att=.4, vowel='oo', bassnote=38)
    swell(st, [43, 55, 59, 62, 67], sp + 1.8, c - sp - 1.8 + .2, g=.7, att=.4, vowel='oo', bassnote=31)
    t = sp; i = 0
    while t < c - .05:
        st.put('fx', ping([74, 77, 81, 86, 81, 77][i % 6] + 12, .45), t, .45, -.85); t += b / 2; i += 1
    for bt in TALK: st.put('fx', bell(93, .5), bt, .35, -.85)
    n = ns(c - sp); tt_ = np.arange(n) / SR
    hum = (blep_pulse(np.full(n, 120.), np.full(n, .5)) * .4 + np.sin(2 * np.pi * 240 * tt_) * .5) * np.minimum(1, tt_ / .3) * np.minimum(1, (tt_[-1] - tt_) / .1)
    st.put('fx', lp(hum, 900), sp, .25, .9)
    for bt in SCR: st.put('fx', ping(86, .6, d=.6), bt, .5, .9)
    st.put('lead', gliss(72, 96, 1.4, duty=.25), c - 1.4, .4)

    # ⑥ CTA 30.0–34.2 · "DID YOU MAKE IT?": the biggest swell — F → C — high arpeggios, the opening slide's answer, ring out
    st.put('fx', k_subdrop(.7, 2.0), c, .35); st.put('drums', k_crash(.45, 3.0), c, .4)
    swell(st, [41, 53, 57, 60, 65, 69, 72], c, 1.6, g=1.15, att=.06, bassnote=29)
    swell(st, [48, 55, 60, 64, 67, 72, 76], c + 1.6, dur - c - 1.6, g=1.2, att=.3, bassnote=36)
    st.melody([(72, 2), (79, 2), (84, 4.4)], c + .1, g=.55, legato=.98)
    t = c + .5; i = 0
    while t < dur - .4:
        ch = [77, 81, 84, 89] if t < c + 1.6 else [76, 79, 84, 88]
        st.put('fx', ping(ch[i % 4] + 12 * ((i // 4) % 2), .38), t, .38, (.25 if i % 2 else -.25)); t += b / 4; i += 1
    st.put('fx', bell(100, 1.0), c + 1.2, .4, .3)                                      # the tear's wink
    return st.mixdown()
