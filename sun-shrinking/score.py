"""score.py — "The Sun Is Shrinking": sonified build + cinematic swells (the 7M-view model).
120 bpm grid (one count = 2 beats). Almost no drums: the energy is note density and rising pitch.
  · the count is a stream of pings: every count is a note one step up; between counts the stream gets denser
    (8ths → 16ths → 32nds) and climbs, as the mass loss piles up; each pyramid landing is a deep choir stab
  · a synth slide fires into STOP; true silence; the reveal lands as a huge slow D-minor swell
  · "relax" resolves to D major; the photon's flight is a single accelerating, rising stream panning left → right;
    the core's random walk is a random stream that climbs as the photon gets out; the CTA is the biggest swell."""
import numpy as np
from studio import (Studio, swell, ping, gliss, sine_bass, choir, chordtone, bell, lead, drone, arp,
                    k_uplift, k_revcymbal, k_subdrop, k_impact, k_crash, SR, ns, _rng)

def build(e, dur):
    T = e['TL']; PYR = e['PYR']; PH = e['PHOTON']; WK = e['WALK']
    st = Studio(dur, 120, rt=2.6, sends={'chords': (.42, .08), 'choir': (.55, .0), 'fx': (.4, .22), 'lead': (.38, .25)})
    st.narrow = .5
    b = .5; go = T['go']; stop = T['stop']

    # ① HOOK 0–3.6 · "THE SUN IS SHRINKING": a slide up out of nothing, the Sun's low hum, the first sparse pings
    st.put('lead', gliss(62, 86, 1.6), .05, .45)
    st.put('bass', drone(50, go + .2), 0, .25)
    st.put('choir', choir([62, 69], go, 'oo', att=1.0), .4, .55)
    for i, t in enumerate([1.8, 2.3, 2.8, 3.05, 3.3]): st.put('fx', ping(74 + (0, 7, 12, 7, 12)[i], .7), t, .5, (i % 2 - .5) * .6)

    # ② COUNT 3.6–13.6: each count = a ping one semitone up (D5 → C6); between counts the stream thickens and climbs:
    #    8ths, then 16ths from "MASS BECOMES LIGHT" (7.0), then 32nds from "A PYRAMID'S WORTH" (10.3)
    def count_pitch(t): return 74 + int(np.floor(t - go))                                # semitone per count
    t = go; i = 0
    while t < stop - 1e-6:
        step = b / 2 if t < 7.0 else b / 4 if t < 10.3 else b / 8
        cp = count_pitch(t); on_count = abs((t - go) - round(t - go)) < 1e-6
        m = cp if on_count else cp + [0, 7, 12, 5, 7, 12, 3, 7][i % 8]
        lvl = .85 if on_count else .32 + .25 * (t - go) / 10
        st.put('fx', ping(m, lvl), t, .55, 0 if on_count else (.25 if i % 2 else -.25))
        if on_count: st.put('fx', bell(cp + 12, .6), t, .25, .2)
        t += step; i += 1
    # the Sun under it: a drone + a choir that grows and darkens (a fifth, then an added minor 2nd)
    st.put('bass', drone(50, stop - go), go, .22)
    st.put('choir', choir([62, 69], 7.0 - go, 'oo', att=.6), go, .6)
    st.put('choir', choir([62, 69, 74], 10.3 - 7.0, 'ah', att=.4), 7.0, .65)
    st.put('choir', choir([62, 63, 69, 74], stop - 10.3, 'ah', att=.3), 10.3, .7)
    st.put('chords', chordtone([74, 81, 86], stop - 7.0, a=1.0, r=.1, cut=4500, duty=.5), 7.0, .25)          # "light" shimmer
    for k, p in enumerate(PYR):                                                            # pyramid landings: deep stabs, stepping up
        r = 50 + [0, 2, 3, 5, 7, 8, 10][k]
        st.put('choir', choir([r - 12, r - 5], .5, 'ah', att=.01), p + .5, .55); st.put('bass', sine_bass(r - 12, .5, att=.005), p + .5, .3)
    st.put('lead', gliss(74, 98, stop - 11.6, duty=.25), 11.6, .5)                         # the slide into STOP
    st.put('fx', k_uplift(2.0, f0=400, octs=5), stop - 2.0, .5)
    # (true silence stop → reveal is carved in mix.py)

    # ③ REVEAL 14.1–18.0 · "43 MILLION TONNES GONE": the explosion. A huge slow D-minor swell, sub, a high bell
    o = T['reveal']
    st.put('fx', k_subdrop(.9, 2.5), o, .45); st.put('drums', k_crash(.5, 3.0), o, .45); st.put('fx', bell(98, 2.5), o, .35)
    swell(st, [50, 57, 62, 65, 69], o, 2.0, g=1.1, att=.08, bassnote=38)
    swell(st, [46, 53, 58, 62, 65], o + 2.0, T['fuel'] - o - 2.0 + .3, g=1.0, att=.4, bassnote=34)     # → Bb

    # ④ RELAX 18.0–21.8 · "FUEL FOR 5 BILLION YEARS": resolves warm into D major; a slow lyrical line
    f0 = T['fuel']
    swell(st, [50, 57, 62, 66, 69], f0, 1.9, att=.5, vowel='oo', bassnote=38)
    swell(st, [49, 57, 61, 64, 69], f0 + 1.9, T['light'] - f0 - 1.9 + .3, att=.5, vowel='oo', bassnote=33)  # A/C#
    tt = f0 + .2
    for m, d in [(78, 1.0), (76, .5), (74, .5), (73, 1.0), (69, 1.2)]: st.put('lead', lead(m, d * .95, vib=.015), tt, .42); tt += d

    # ⑤ LIGHT 21.8–26.0 · "LEFT IT 8 MIN AGO": the photon's flight = one stream that accelerates and climbs while it
    #    pans left → right; it lands on Earth as a bright swell
    l0 = T['light']
    swell(st, [62, 69, 74, 76], l0, PH[1] - l0, g=.6, att=.6, vowel='oo', bassnote=38)
    t = PH[0]; i = 0; span = PH[1] - PH[0]
    while t < PH[1]:
        pr = (t - PH[0]) / span; step = b / 2 * (1 - pr) + b / 8 * pr
        m = 62 + int(pr * 30) + [0, 7, 12][i % 3]
        st.put('fx', ping(m, .45 + .4 * pr), t, .5, -.95 + 1.9 * pr); t += step; i += 1
    st.put('fx', bell(98, 2.0), PH[1], .5, .75); st.put('drums', k_crash(.4, 2.0), PH[1], .4)
    swell(st, [62, 66, 69, 74, 78], PH[1], T['core'] - PH[1] + .3, g=1.0, att=.05, bassnote=38)

    # ⑥ CORE 26.0–30.6 · "~100,000 YEARS": the random walk = a random stream in D minor that gets denser and climbs
    #    as the photon nears the surface, over a dark drone; a slide up into the finale
    c0 = T['core']; o3 = T['cta']
    st.put('bass', drone(50, o3 - c0), c0, .3)
    swell(st, [50, 53, 57, 62], c0, o3 - c0, g=.7, att=1.0, vowel='oo')
    pent = [0, 3, 5, 7, 10]; t = WK[0]; i = 0; rng = np.random.default_rng(5)
    while t < WK[1]:
        pr = (t - WK[0]) / (WK[1] - WK[0]); step = b / 2 * (1 - pr) + b / 8 * pr
        m = 62 + int(pr * 24) + pent[rng.integers(5)] + 12 * rng.integers(0, 2) - 6
        st.put('fx', ping(m, .3 + .45 * pr), t, .5, rng.uniform(-.35, .35)); t += step; i += 1
    st.put('lead', gliss(62, 98, 1.8, duty=.25), o3 - 1.8, .5)
    st.put('fx', k_uplift(1.8, f0=400, octs=5), o3 - 1.8, .45)

    # ⑦ CTA 30.6–35.4 · "NEXT SUNRISE…": the biggest swell — D major, then G, then home — with high arpeggios and the
    #    sunrise call (a rising fifth → octave) on top, ringing out
    st.put('fx', k_subdrop(.8, 2.0), o3, .4); st.put('drums', k_crash(.5, 3.0), o3, .45)
    swell(st, [50, 57, 62, 66, 69, 74], o3, 1.6, g=1.15, att=.06, bassnote=38)
    swell(st, [43, 55, 59, 62, 67, 71], o3 + 1.6, 1.2, g=1.05, att=.3, bassnote=31)
    swell(st, [50, 57, 62, 66, 69, 74, 78], o3 + 2.8, dur - o3 - 2.8, g=1.15, att=.35, bassnote=38)
    st.melody([(74, 2), (81, 2), (86, 6)], o3 + .1, g=.55, legato=.98)
    t = o3 + .8; i = 0
    while t < dur - .5:
        chord = [74, 78, 81, 86] if t < o3 + 1.6 or t >= o3 + 2.8 else [74, 79, 83, 86]
        st.put('fx', ping(chord[i % 4] + 12 * ((i // 4) % 2), .4), t, .38, (.25 if i % 2 else -.25)); t += b / 4; i += 1
    return st.mixdown()
