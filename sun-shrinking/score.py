"""score.py — "The Sun Is Shrinking": original premium-chiptune score, cue by cue against the picture.
D major, 120 bpm (one count = 2 beats). THEME: a rising fifth → octave ("sunrise"), stated as a call in the hook,
carried by the count, dropped huge on the reveal, whispered as a music box at "relax", turned minor in the core,
and paid off in full under the CTA. The count itself climbs the D major scale one note per count."""
import numpy as np
from studio import (Studio, groove, q32, choir, chordtone, arp, bass, bell, drop, pluck, trill, drone, lead,
                    k_crash, k_revcymbal, k_uplift, k_subdrop, k_impact, k_tom, k_snare, SR, ns, hz)

A  = [(62, 1), (69, 1), (74, 1.5), (73, .5), (71, .5), (69, .5), (66, 1), (69, 2)]          # theme, phrase A
A2 = [(62, 1), (69, 1), (74, 1.5), (76, .5), (78, 1), (76, .5), (74, .5), (74, 2)]          # theme, answer
CH = {'D': [62, 66, 69], 'Bm': [59, 62, 66], 'G': [55, 59, 62], 'A': [57, 61, 64], 'Dm': [62, 65, 69], 'Bb': [58, 62, 65], 'C': [60, 64, 67]}
ROOT = {'D': 50, 'Bm': 47, 'G': 43, 'A': 45, 'Dm': 50, 'Bb': 46, 'C': 48}
PROG = ['D', 'Bm', 'G', 'A']
SCALE = [74, 76, 78, 79, 81, 83, 85, 86, 88, 90, 93]        # count pings: D5 → … (one per count), top note on the drop

def fill(st, t_end, beats_=1):
    b = st.b
    for j, m in enumerate([52, 50, 47, 45, 43, 40, 38, 36][:beats_ * 4]):
        st.put('drums', k_tom(m), t_end - beats_ * b + j * b / 4, .7, (j % 2 - .5) * .6)

def G(st, *a, **k): groove(st, *a[:4], CH, ROOT, **k)
def nxt(st, t, origin): return origin + np.ceil((t - origin) / st.b - 1e-6) * st.b      # next beat at/after t

def build(e, dur):
    T = e['TL']; PYR = e['PYR']; PH = e['PHOTON']; WK = e['WALK']
    st = Studio(dur, 140); b = st.b
    o1 = T['stop']                                     # pre-drop grid: the build slams exactly into STOP

    # ① HOOK 0–3.6 · "THE SUN IS SHRINKING": the sunrise call over a choir + sub, a pulsing bass, sparkle, lift
    st.put('fx', k_subdrop(.9, 2.0), 0, 1.0)
    st.put('choir', choir([50, 57, 62, 66], 3.7, 'ah', att=.6), 0, .9)
    t0 = nxt(st, .05, o1)
    st.melody([(62, 1), (69, 1), (74, 3), (76, .5), (78, .5)], t0, g=.9, legato=.98)
    st.melody([(50, 1), (57, 1), (62, 4)], t0, g=.35, pan=-.2, legato=.98)
    G(st, nxt(st, 1.2, o1), T['go'] - 1e-3, o1, ['D'], kick='none', clap=False, hats='none', bassline='drive', chords='none', fills=False, g=.75)
    for j, m in enumerate([86, 90, 93, 98]): st.put('fx', bell(m, 1.0), t0 + 4 * b + j * b / 4, .35, (j - 1.5) * .3)
    st.put('fx', k_uplift(1.4, f0=400, octs=4), T['go'] - 1.4, .55); st.put('fx', k_revcymbal(1.2), T['go'] - 1.2, .55)

    # ② COUNT 3.6–13.6: a driving march. Theme A → at "MASS BECOMES LIGHT" the full groove + arps + theme A2 an octave up
    #    → last bar: roll, toms, uplifter into STOP. Each count steps up the scale.
    st.put('drums', k_crash(.7), T['go'], .7)
    tl = nxt(st, 7.0, o1); tb_ = o1 - 4 * b
    G(st, T['go'], tl - 1e-3, o1, PROG, kick='four', clap=False, hats='8', bassline='drive', chords='pad', fills=False, g=.95)
    G(st, tl, tb_ - 1e-3, o1, PROG, kick='four', clap=True, hats='16', bassline='drive', chords='8', arps=True, g=1.0)
    G(st, tb_, o1 - 1e-3, o1, PROG, kick='four', clap=False, hats='16', bassline='drive', chords='8', arps=True, fills=False, g=1.0)
    st.put('drums', k_crash(.6), tl, .55)
    st.melody(A, nxt(st, T['go'], o1), g=.6)
    st.melody(A2, tl, g=.62, transpose=12); st.melody(A2, tl, g=.2, pan=-.3)
    st.melody(A[:4], tl + 8 * b, g=.6, transpose=12)
    for i, p in enumerate(PYR):
        c = PROG[int((p + .5 - o1) // (4 * b)) % 4]; st.put('drums', k_tom(ROOT[c] - 2), q32(st, p + .5, o1), .55, -.3)
    for i in range(9):
        tq = q32(st, T['go'] + 1 + i, o1)
        st.put('fx', bell(SCALE[i], .45), tq, .45, .15); st.put('fx', pluck(SCALE[i], .1, duty=.25), tq, .28)
    for j in range(4): st.snare(tb_ + j * b / 2, .3 + .04 * j)
    for j in range(8): st.snare(tb_ + 2 * b + j * b / 4, .45 + .05 * j)
    st.put('fx', k_uplift(2.0, f0=300, octs=5), o1 - 2.0, .75); st.put('fx', k_revcymbal(1.4), o1 - 1.4, .5)
    fill(st, o1, 1)
    # (true silence T['stop'] → T['reveal'] is carved in mix.py)

    # ③ DROP 14.1–18.0 · "43 MILLION TONNES GONE": the theme slams in an octave up, doubled + a third, full groove + arps
    o2 = T['reveal']
    st.put('fx', k_impact(1.0), o2, 1.0); st.put('drums', k_crash(1.0), o2, .95); st.put('fx', bell(SCALE[10] + 5, 1.6), o2, .45)
    G(st, o2, T['fuel'] - 1e-3, o2, PROG, kick='four', clap=True, hats='16', bassline='drive', chords='8', arps=True, g=1.08)
    st.put('choir', choir([62, 66, 69, 74], T['fuel'] - o2, 'ah', att=.08), o2, .6)
    st.melody(A, o2, g=.9, transpose=12); st.melody(A, o2, g=.32, pan=-.35)
    st.melody([(m + 4 if m else None, d) for m, d in A], o2, g=.22, transpose=12, pan=.35)
    st.melody(A[:2], o2 + 8 * b, g=.85, transpose=12)

    # ④ "FUEL FOR 5 BILLION YEARS" 18.0–21.8: lighter but still moving. Steady kick, 8th hats, the theme as a music box
    G(st, T['fuel'], T['light'] - 1e-3, o2, PROG, kick='four', clap=False, hats='8', bassline='8', chords='pad', fills=False, g=.75)
    st.put('choir', choir([62, 66, 69], T['light'] - T['fuel'], 'oo', att=.3), T['fuel'], .5)
    tt = nxt(st, T['fuel'], o2)
    for m, d in A2:
        st.put('fx', bell(m + 12, max(.4, d * b * 1.5)), tt, .42, .1); st.put('fx', bell(m + 24, .3), tt, .12, -.3); tt += d * b

    # ⑤ LIGHT 21.8–26.0 · "LEFT IT 8 MIN AGO": the photon flies: rising 16th arp panning left → right over a riding hat,
    #    then the groove kicks back in the moment it lands on Earth
    st.put('choir', choir([74, 78, 81, 86], T['core'] - T['light'], 'ah', att=.4), T['light'], .45)
    st.put('fx', k_subdrop(.5, 1.0), T['light'], .5)
    G(st, T['light'], PH[0] - 1e-3, o2, PROG, kick='none', clap=False, hats='8', bassline='long', chords='none', fills=False, g=.7)
    n16 = int((PH[1] - PH[0]) / (b / 4)); notes = [62, 66, 69, 74, 78, 81, 86, 90, 93, 98]
    for j in range(n16):
        at = PH[0] + j * b / 4; pr = j / n16
        st.put('fx', arp(notes[min(len(notes) - 1, int(pr * len(notes)))] + (0 if j % 2 else -12), b / 4 * .8), at, .42, -.95 + 1.9 * pr)
        st.hat(at, .15 + .4 * pr, pan=-.95 + 1.9 * pr)
        if j % 4 == 0: st.kick(at, .35 + .4 * pr, pump=.5)
    st.put('fx', bell(98, 1.8), PH[1], .5, .75); st.put('fx', bell(93, 1.8), PH[1] + .07, .35, .75)
    st.put('drums', k_crash(.6), PH[1], .55)
    G(st, PH[1], T['core'] - 1e-3, PH[1], ['D', 'G'], kick='four', clap=True, hats='16', bassline='drive', chords='8', fills=False, g=.95)

    # ⑥ CORE 26.0–30.6 · "~100,000 YEARS TO ESCAPE": dark drive. Low drone, minor choir, the theme in minor, a heartbeat
    #    kick that accelerates into 16ths, then the roll + uplifter + reverse cymbal into the final drop
    o3 = T['cta']
    st.put('bass', drone(38, o3 - T['core']), T['core'], .8)
    st.put('choir', choir([50, 53, 57], o3 - T['core'], 'oo', att=.6), T['core'], .6)
    st.melody([(62, 2), (69, 2), (74, 2), (72, 1), (70, 1)], T['core'] + .1, g=.5, legato=.97)
    t = T['core'] + .2; gap = .86
    while t < o3 - 4 * b: st.kick(t, .8, pump=.4); st.hat(t + gap / 2, .3); t += gap; gap = max(b / 2, gap * .87)
    for j in range(4): st.kick(o3 - 4 * b + j * b, .85)
    for j in range(4): st.snare(o3 - 4 * b + j * b / 2, .3 + .04 * j)
    for j in range(8): st.snare(o3 - 2 * b + j * b / 4, .45 + .05 * j)
    st.put('fx', k_uplift(2.0), o3 - 2.0, .7); st.put('fx', k_revcymbal(1.4), o3 - 1.4, .6)
    fill(st, o3, 1)

    # ⑦ FINAL DROP 30.6–35.4 · "NEXT SUNRISE…": the full answer with harmony, choir, arps; the last chord rings out
    st.put('fx', k_impact(1.0), o3, 1.0); st.put('drums', k_crash(1.0), o3, .95)
    G(st, o3, o3 + 8 * b - 1e-3, o3, ['D', 'Bm', 'G', 'A'], kick='four', clap=True, hats='16', bassline='drive', chords='8', arps=True, g=1.08)
    st.put('choir', choir([62, 66, 69, 74], 8 * b, 'ah', att=.08), o3, .6)
    st.melody(A2, o3, g=.9, transpose=12); st.melody(A2, o3, g=.32, pan=-.35)
    st.melody([(m - 3 if m else None, d) for m, d in A2], o3, g=.22, transpose=12, pan=.35)
    end = o3 + 8 * b
    st.kick(end, 1.0); st.put('drums', k_crash(1.0, 2.5), end, .8); st.put('fx', k_subdrop(.8), end, .7)
    st.put('chords', chordtone([62, 66, 69, 74, 78], dur - end, a=.005, r=.6, cut=5000), end, .55)
    st.put('choir', choir([50, 57, 62, 66], dur - end, 'ah', att=.05), end, .6)
    st.put('lead', lead(86, dur - end - .05), end, .5)
    return st.mixdown()
