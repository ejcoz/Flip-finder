"""score.py — "The Sun Is Shrinking": original premium-chiptune score, cue by cue against the picture.
D major, 120 bpm (one count = 2 beats). THEME: a rising fifth → octave ("sunrise"), stated as a call in the hook,
carried by the count, dropped huge on the reveal, whispered as a music box at "relax", turned minor in the core,
and paid off in full under the CTA. The count itself climbs the D major scale one note per count."""
import numpy as np
from studio import (Studio, choir, chordtone, arp, bass, bell, drop, pluck, trill, drone, lead,
                    k_crash, k_revcymbal, k_uplift, k_subdrop, k_impact, k_tom, k_snare, SR, ns, hz)

A  = [(62, 1), (69, 1), (74, 1.5), (73, .5), (71, .5), (69, .5), (66, 1), (69, 2)]          # theme, phrase A
A2 = [(62, 1), (69, 1), (74, 1.5), (76, .5), (78, 1), (76, .5), (74, .5), (74, 2)]          # theme, answer
CH = {'D': [62, 66, 69], 'Bm': [59, 62, 66], 'G': [55, 59, 62], 'A': [57, 61, 64], 'Dm': [62, 65, 69], 'Bb': [58, 62, 65], 'C': [60, 64, 67]}
ROOT = {'D': 50, 'Bm': 47, 'G': 43, 'A': 45, 'Dm': 50, 'Bb': 46, 'C': 48}
PROG = ['D', 'Bm', 'G', 'A']
SCALE = [74, 76, 78, 79, 81, 83, 85, 86, 88, 90, 93]        # count pings: D5 → … (one per count), top note on the drop

def groove(st, t0, t1, origin, prog, kick='four', clap=True, hats='8', bassline='8', chords='8', g=1.0):
    b = st.b
    k0 = int(np.ceil((t0 - origin) / b - 1e-6)); k1 = int(np.floor((t1 - origin) / b - 1e-6))
    for k in range(k0, k1 + 1):
        tb = origin + k * b; beat = k % 4; c = prog[(k // 4) % len(prog)]
        if kick == 'four' or (kick == 'half' and beat == 0) or (kick == 'two' and beat in (0, 2)): st.kick(tb, .95 * g)
        if clap and beat in (1, 3): st.snare(tb, .55 * g); st.clap(tb, .35 * g)
        if hats in ('8', '16'):
            st.hat(tb + b / 2, .55 * g)
            if hats == '16': st.hat(tb + b / 4 + .012, .25 * g, pan=-.25); st.hat(tb + 3 * b / 4 + .012, .25 * g, pan=-.25)
            if beat == 3: st.hat(tb + b / 2, .3 * g, open_=True)
        r = ROOT[c]
        if bassline == '8':
            st.put('bass', bass(r, b / 2 * .85), tb, .55 * g); st.put('bass', bass(r + (12 if beat % 2 else 0), b / 2 * .7), tb + b / 2, .45 * g)
        elif bassline == 'long' and beat == 0:
            st.put('bass', bass(r, 4 * b * .95), tb, .5 * g)
        if chords == '8':
            for j in range(2):
                if beat == 3 and j: continue
                st.put('chords', chordtone([m + 12 for m in CH[c]], b / 2 * .7), tb + j * b / 2, .5 * g, .2 if j else -.2)
        elif chords == 'pad' and beat == 0:
            st.put('chords', chordtone([m + 12 for m in CH[c]], 4 * b, a=.15, r=.4, cut=3000), tb, .4 * g)

def fill(st, t_end, beats_=1):
    b = st.b
    for j, m in enumerate([52, 50, 47, 45, 43, 40, 38, 36][:beats_ * 4]):
        st.put('drums', k_tom(m), t_end - beats_ * b + j * b / 4, .7, (j % 2 - .5) * .6)

def build(e, dur):
    T = e['TL']; PYR = e['PYR']; PH = e['PHOTON']; WK = e['WALK']
    st = Studio(dur, 120); b = st.b; o = -.4

    # ① HOOK 0–3.6 · "THE SUN IS SHRINKING": a sunrise call over a choir, sub boom, sparkle, lift into the count
    st.put('fx', k_subdrop(.9, 2.0), 0, 1.0)
    st.put('choir', choir([50, 57, 62, 66], 3.7, 'ah', att=.9), 0, .9)
    st.melody([(62, 1), (69, 1), (74, 3)], .1, g=.9, legato=.98)
    st.melody([(50, 1), (57, 1), (62, 3)], .1, g=.35, pan=-.2, legato=.98)
    for j, m in enumerate([86, 90, 93, 98]): st.put('fx', bell(m, 1.2), 1.1 + j * .12, .35, (j - 1.5) * .3)
    st.put('fx', k_uplift(1.4, f0=400, octs=4), T['go'] - 1.4, .5); st.put('fx', k_revcymbal(1.2), T['go'] - 1.2, .5)

    # ② COUNT 3.6–13.6 · the march of the weights. Theme A (soft) → "MASS BECOMES LIGHT" at 7.0: chords open, 16th
    #    shimmer arps → theme A2 an octave up → build (roll, toms, uplifter) into STOP
    st.put('drums', k_crash(.6), T['go'], .7)
    groove(st, T['go'], 7.0 - 1e-3, o, PROG, kick='four', clap=False, hats='none', bassline='8', chords='pad', g=.9)
    groove(st, 7.0, 11.6 - 1e-3, o, PROG, kick='four', clap=True, hats='8', bassline='8', chords='8', g=1.0)
    groove(st, 11.6, T['stop'] - 1e-3, o, PROG, kick='four', clap=True, hats='16', bassline='8', chords='8', g=1.0)
    st.melody(A, T['go'], g=.55)
    st.melody(A2, 7.6, g=.6, transpose=12)
    st.melody(A2, 7.6, g=.18, transpose=0, pan=-.3)
    t = 7.0
    while t < T['stop'] - 1e-3:                                    # "light": rising 16th shimmer
        k = int(round((t - 7.0) / (b / 4)))
        c = PROG[int((t - o) // (4 * b)) % 4]; ms = [m + 24 for m in CH[c]] + [CH[c][0] + 36]
        st.put('fx', arp(ms[k % 4], b / 4 * .8), t, .32, .45 if k % 2 else -.45); t += b / 4
    for i, p in enumerate(PYR):                                     # a pyramid lands = a pitched tom on the chord root
        c = PROG[int((p + .5 - o) // (4 * b)) % 4]; st.put('drums', k_tom(ROOT[c] - 2), p + .5, .55, -.3)
    for i in range(9):                                              # the count climbs the scale (count 10 is STOP)
        st.put('fx', bell(SCALE[i], .5), T['go'] + 1 + i, .42, .15); st.put('fx', pluck(SCALE[i], .12, duty=.25), T['go'] + 1 + i, .25)
    for j in range(8):                                              # snare roll 8ths → 16ths
        st.snare(11.6 + j * b / 2, .25 + .03 * j)
    for j in range(8): st.snare(12.6 + j * b / 4, .4 + .04 * j)
    st.put('fx', k_uplift(2.0, f0=300, octs=5), T['stop'] - 2.0, .7)
    fill(st, T['stop'], 1)
    # (true silence T['stop'] → T['reveal'] is carved in mix.py)

    # ③ DROP 14.1–18.0 · "43 MILLION TONNES GONE": the theme slams in an octave up over the full groove + choir
    o2 = T['reveal']
    st.put('fx', k_impact(1.0), o2, 1.0); st.put('drums', k_crash(1.0), o2, .9); st.put('fx', bell(SCALE[10] + 5, 1.6), o2, .45)
    groove(st, o2, T['fuel'] - 1e-3, o2, PROG, kick='four', clap=True, hats='16', bassline='8', chords='8', g=1.05)
    st.put('choir', choir([62, 66, 69, 74], T['fuel'] - o2, 'ah', att=.1), o2, .6)
    st.melody(A, o2, g=.85, transpose=12); st.melody(A, o2, g=.3, transpose=0, pan=-.35)
    st.melody([(m + 4 if m else None, d) for m, d in A], o2, g=.22, transpose=12, pan=.35)     # a third above

    # ④ RELAX 18.0–21.8 · "FUEL FOR 5 BILLION YEARS": breakdown. Half-time, soft pads, the theme as a music box
    groove(st, T['fuel'], T['light'] - 1e-3, o2, PROG, kick='half', clap=False, hats='none', bassline='long', chords='pad', g=.8)
    st.put('choir', choir([62, 66, 69], T['light'] - T['fuel'], 'oo', att=.4), T['fuel'], .55)
    tt = T['fuel']
    for m, d in A2:
        st.put('fx', bell(m + 12, max(.5, d * b * 1.5)), tt, .4, .1); tt += d * b

    # ⑤ LIGHT 21.8–26.0 · "LEFT IT 8 MIN AGO": time stands still; the photon is a rising arpeggio panning left → right,
    #    the clock spins in 16th hats, a chord lands with it on Earth
    st.put('choir', choir([74, 78, 81, 86], T['core'] - T['light'], 'ah', att=.5), T['light'], .45)
    st.put('fx', k_subdrop(.5, 1.0), T['light'], .5)
    n16 = int((PH[1] - PH[0]) / (b / 4)); notes = [62, 66, 69, 74, 78, 81, 86, 90, 93, 98]
    for j in range(n16):
        at = PH[0] + j * b / 4; pr = j / n16
        st.put('fx', arp(notes[min(len(notes) - 1, int(pr * len(notes)))] + (0 if j % 2 else -12), b / 4 * .8), at, .4, -.95 + 1.9 * pr)
        st.hat(at, .15 + .35 * pr, pan=-.95 + 1.9 * pr)
    st.put('fx', bell(98, 1.8), PH[1], .5, .75); st.put('fx', bell(93, 1.8), PH[1] + .07, .35, .75)
    st.put('chords', chordtone([66, 69, 74, 78], T['core'] - PH[1], a=.01, r=.4, cut=4000), PH[1], .45); st.kick(PH[1], .7)
    st.put('drums', k_crash(.5), PH[1], .5)

    # ⑥ CORE 26.0–30.6 · "~100,000 YEARS TO ESCAPE": dark. Low drone, choir 'oo' in D minor, the theme in minor and slow,
    #    a heartbeat kick that speeds up, then a roll + uplifter + reverse cymbal into the final drop
    st.put('bass', drone(38, T['cta'] - T['core']), T['core'], .8)
    st.put('choir', choir([50, 53, 57], T['cta'] - T['core'], 'oo', att=.8), T['core'], .6)
    st.melody([(62, 2), (69, 2), (74, 2), (72, 1), (70, 1)], T['core'] + .2, g=.45, legato=.97)
    t = T['core'] + .4; gap = 1.0
    while t < T['cta'] - 1.0: st.kick(t, .7, pump=.6); t += gap; gap = max(.25, gap * .85)
    for j in range(8): st.snare(T['cta'] - 1.0 + j * b / 4, .3 + .05 * j)
    st.put('fx', k_uplift(2.0), T['cta'] - 2.0, .65); st.put('fx', k_revcymbal(1.5), T['cta'] - 1.5, .6)
    fill(st, T['cta'], 1)

    # ⑦ FINAL DROP 30.6–35.4 · "NEXT SUNRISE…": the full theme answer with harmony, choir, everything; last chord rings out
    o3 = T['cta']
    st.put('fx', k_impact(1.0), o3, 1.0); st.put('drums', k_crash(1.0), o3, .9)
    groove(st, o3, o3 + 8 * b - 1e-3, o3, ['D', 'Bm', 'G', 'A'], kick='four', clap=True, hats='16', bassline='8', chords='8', g=1.05)
    st.put('choir', choir([62, 66, 69, 74], 8 * b, 'ah', att=.1), o3, .6)
    st.melody(A2, o3, g=.85, transpose=12); st.melody(A2, o3, g=.3, pan=-.35)
    st.melody([(m - 3 if m else None, d) for m, d in A2], o3, g=.22, transpose=12, pan=.35)   # harmony below
    end = o3 + 8 * b
    st.kick(end, 1.0); st.put('drums', k_crash(1.0, 2.5), end, .8); st.put('fx', k_subdrop(.8), end, .7)
    st.put('chords', chordtone([62, 66, 69, 74, 78], dur - end, a=.005, r=.6, cut=5000), end, .55)
    st.put('choir', choir([50, 57, 62, 66], dur - end, 'ah', att=.05), end, .6)
    st.put('lead', lead(86, dur - end - .05), end, .5)
    return st.mixdown()
