"""score.py — "Don't Blink": original premium-chiptune score, cue by cue against the picture.
F major / D minor, 120 bpm (one count second = 2 beats). THEME: a sneaky, bouncy "staring contest" tune.
Stated bright over water drops, soured into D minor as the eye dries, broken into a rising motif sequence as it stings
and panics, then dropped huge on BLINK!, whispered as a music box while the music itself "blinks", split talking-left /
screen-right, and paid off under the CTA. The 15 countdown pings climb two octaves of F major as the tension rises."""
import numpy as np
from studio import (Studio, choir, chordtone, arp, bass, bell, drop, pluck, trill, drone, lead,
                    k_crash, k_revcymbal, k_uplift, k_subdrop, k_impact, k_tom, SR, ns, hz, lp, blep_pulse)

A  = [(72, .5), (None, .25), (69, .25), (72, .5), (74, .5), (72, .5), (69, .5), (65, 1), (None, .5), (67, .5), (69, .5), (70, .5), (69, .5), (67, 1)]
A2 = [(72, .5), (None, .25), (69, .25), (72, .5), (77, .5), (76, .5), (74, .5), (72, 1), (None, .5), (70, .5), (69, .5), (67, .5), (65, 1.5), (None, .5)]
AM = [(69, .5), (None, .25), (65, .25), (69, .5), (70, .5), (69, .5), (65, .5), (62, 1), (None, .5), (64, .5), (65, .5), (67, .5), (65, .5), (64, 1)]
MOTIF = [(72, .5), (None, .25), (69, .25), (72, .5), (None, .5)]          # 2 beats: the theme's head
CH = {'F': [65, 69, 72], 'Dm': [62, 65, 69], 'Bb': [58, 62, 65], 'C': [60, 64, 67], 'Gm': [55, 58, 62], 'A': [57, 61, 64], 'Bbsus': [58, 63, 65], 'Csus': [60, 65, 67]}
ROOT = {'F': 53, 'Dm': 50, 'Bb': 46, 'C': 48, 'Gm': 43, 'A': 45, 'Bbsus': 46, 'Csus': 48}
P_MAJ = ['F', 'Dm', 'Bb', 'C']; P_MIN = ['Dm', 'Bb', 'Gm', 'A']; P_SUS = ['Bbsus', 'Csus']
FMAJ = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 82, 84, 86, 88, 89]          # countdown pings, 15 → 1, rising

def groove(st, t0, t1, origin, prog, kick='four', clap=True, hats='8', bassline='8', chords='8', g=1.0, pan=0.0):
    b = st.b
    k0 = int(np.ceil((t0 - origin) / b - 1e-6)); k1 = int(np.floor((t1 - origin) / b - 1e-6))
    for k in range(k0, k1 + 1):
        tb = origin + k * b; beat = k % 4; c = prog[(k // 4) % len(prog)]
        if kick == 'four' or (kick == 'half' and beat == 0) or (kick == 'two' and beat in (0, 2)): st.kick(tb, .95 * g)
        if kick == 'eighths': st.kick(tb, .9 * g); st.kick(tb + b / 2, .6 * g)
        if clap and beat in (1, 3): st.snare(tb, .55 * g); st.clap(tb, .35 * g)
        if hats in ('8', '16'):
            st.hat(tb + b / 2, .55 * g)
            if hats == '16': st.hat(tb + b / 4 + .012, .25 * g, pan=-.25); st.hat(tb + 3 * b / 4 + .012, .25 * g, pan=-.25)
            if beat == 3: st.hat(tb + b / 2, .3 * g, open_=True)
        r = ROOT[c]
        if bassline == '8':
            st.put('bass', bass(r, b / 2 * .8), tb, .55 * g, pan * .3); st.put('bass', bass(r + (12 if beat % 2 else 7), b / 2 * .6), tb + b / 2, .42 * g, pan * .3)
        elif bassline == 'bounce':
            st.put('bass', bass(r + (0, 12, 7, 12)[beat], b * .4), tb, .55 * g)
        elif bassline == 'long' and beat == 0:
            st.put('bass', bass(r, 4 * b * .95), tb, .5 * g)
        if chords == '8':
            for j in range(2):
                if beat == 3 and j: continue
                st.put('chords', chordtone([m + 12 for m in CH[c]], b / 2 * .65, duty=.5), tb + j * b / 2, .5 * g, (.2 if j else -.2) + pan)
        elif chords == 'pad' and beat == 0:
            st.put('chords', chordtone([m + 12 for m in CH[c]], 4 * b, a=.12, r=.4, cut=3000), tb, .4 * g, pan)

def crushed(x, bits): q = 2 ** bits; return np.round(x * q) / q

def build(e, dur):
    T = e['TL']; CALM = e['CALM']; TALK = e['TALK']; SCR = e['SCREEN']
    st = Studio(dur, 120); b = st.b; o = -1.0

    # ① HOOK 0–3.0 · "DON'T BLINK": the dare. "dun-dun-DUN!" stab, then a sneaky bouncy bass + tick-tock clock
    for at, m, d in [(.05, 72, .2), (.3, 72, .2), (.55, 77, .9)]:
        st.put('lead', lead(m, d), at, .8); st.put('chords', chordtone([m - 12, m - 8, m - 5], d * .9, duty=.5), at, .45)
    st.put('drums', k_crash(.5), .55, .5); st.put('fx', k_subdrop(.6), .55, .7)
    st.put('choir', choir([65, 69, 72], 2.4, 'oo', att=.4), .6, .6)
    groove(st, 1.0, T['go'] - 1e-3, o, ['F'], kick='two', clap=False, hats='none', bassline='bounce', chords='none', g=.85)
    for k in range(4): st.put('fx', pluck(96 if k % 2 else 101, .03, duty=.5, tau=.01), 1.0 + k * b, .35, .35 if k % 2 else -.35)
    st.put('fx', k_uplift(1.0, f0=500, octs=3), T['go'] - 1.0, .45)

    # ② TEAR FILM 3.0–6.8: watery and bright. The theme over a drop arpeggio (8ths, echoing), light groove
    st.put('drums', k_crash(.5), T['go'], .5)
    groove(st, T['go'], 6.8 - 1e-3, o, P_MAJ, kick='two', clap=False, hats='8', bassline='bounce', chords='pad', g=.9)
    st.melody(A, T['go'], g=.6)
    t = T['go']; i = 0
    while t < 6.8 - 1e-3:
        c = P_MAJ[int((t - o) // (4 * b)) % 4]; ms = [m + 12 for m in CH[c]] + [CH[c][0] + 24]
        st.put('fx', drop(ms[i % 4] + 12), t, .45, .4 if i % 2 else -.4); t += b / 2; i += 1

    # ③ DRYING 6.8–10.6 · "LASTS ABOUT 10 SECONDS": the theme sours into D minor, the drops thin out and dry up,
    #    the bass walks down chromatically
    groove(st, 6.8, 10.6 - 1e-3, o, P_MIN, kick='two', clap=True, hats='8', bassline='none', chords='pad', g=.9)
    for j, tb in enumerate(np.arange(7.0, 10.6 - 1e-3, b)): st.put('bass', bass(53 - j, b * .85), tb, .55)
    tt = 7.0
    for m, d in AM:
        if tt >= 10.6 - 1e-3: break
        if m is not None: st.put('lead', lead(m, d * b * .9), tt, .55)
        tt += d * b
    for j, tb in enumerate(np.arange(7.0, 10.6 - 1e-3, b)):
        dry = (tb - 7.0) / 3.6
        if j % (1 + int(dry * 3)) == 0: st.put('chords', drop(81 - int(dry * 9)), tb, .35 * (1 - .5 * dry), .3)    # dry: no echo bus

    # ④ STING 10.6–14.4 · "BREAKS UP AND STARTS TO STING": the theme's head repeats, climbing a semitone each bar, over
    #    a D pedal with tritone 16ths, a nervous trill and a bit-crush that worsens
    groove(st, 10.6, 14.4 - 1e-3, o, ['Dm'], kick='four', clap=True, hats='16', bassline='none', chords='none', g=.95)
    for tb in np.arange(10.6, 14.4 - 1e-3, b / 4):
        j = int(round((tb - 10.6) / (b / 4))); bits = 6 - 2.5 * (tb - 10.6) / 3.8
        st.put('chords', crushed(arp([62, 68][j % 2] + (12 if j % 4 > 1 else 0), b / 4 * .85), bits), tb, .5, .3 if j % 2 else -.3)
        if j % 2 == 0: st.put('bass', bass(38, b / 2 * .9), tb, .55)
    for n, bar in enumerate(np.arange(11.0, 14.4 - 1e-3, 2 * b)):
        st.melody(MOTIF, bar, g=.65, transpose=n)
    st.put('lead', trill(93, 14.4 - 10.6), 10.6, .25, .2)

    # ⑤ HOLD IT 14.4–17.5: panic. 8th kicks, accelerating roll, the motif climbing faster, rising bass, uplifter,
    #    reverse cymbal and a tom fill slamming into the silence
    groove(st, 14.4, T['silence'] - 1e-3, o, ['Dm'], kick='eighths', clap=False, hats='16', bassline='none', chords='none', g=1.0)
    for j, tb in enumerate(np.arange(14.5, T['silence'] - 1e-3, b / 2)): st.put('bass', bass(38 + j // 2, b / 2 * .8), tb, .55)
    for n, bar in enumerate(np.arange(15.0, T['silence'] - 1e-3, b)):
        st.melody([(72, .5), (69, .5)], bar, g=.6, transpose=4 + n)
    for tb in np.arange(15.5, T['silence'] - 1e-3, b / 4): st.snare(tb, .2 + .3 * (tb - 15.5) / 2)
    st.put('fx', k_uplift(T['silence'] - 14.4, f0=300, octs=5), 14.4, .7)
    st.put('fx', k_revcymbal(1.5), T['silence'] - 1.5, .6)
    for j, m in enumerate([55, 52, 48, 45]): st.put('drums', k_tom(m), T['silence'] - b + j * b / 4, .7, (j % 2 - .5) * .6)
    for i in range(15): st.put('fx', bell(FMAJ[i] + 12, .45), T['go'] + i, .32, .15)    # countdown pings climb the scale
    # (true silence T['silence'] → T['blink'] is carved in mix.py)

    # ⑥ BLINK! DROP 18.0–22.2: the theme slams in over the full groove + choir; a splash cascade; each blink rings "bl-ink"
    o2 = T['blink']
    st.put('fx', k_impact(1.0), o2, 1.0); st.put('drums', k_crash(1.0), o2, .9)
    for j, m in enumerate([96, 93, 91, 89, 86, 84, 81, 79, 77]): st.put('fx', drop(m), o2 + .05 + j * .04, .4, (j % 3 - 1) * .5)
    groove(st, o2, T['hour'] - 1e-3, o2, P_MAJ, kick='four', clap=True, hats='16', bassline='8', chords='8', g=1.05)
    st.put('choir', choir([65, 69, 72, 77], T['hour'] - o2, 'ah', att=.1), o2, .6)
    st.melody(A, o2, g=.85, transpose=12); st.melody(A, o2, g=.3, pan=-.35)
    st.melody([(m - 3 if m else None, d) for m, d in A], o2, g=.22, transpose=12, pan=.35)
    st.melody(A2, o2 + 8 * b, g=.85, transpose=12); st.melody(A2, o2 + 8 * b, g=.3, pan=-.35)
    for bt in CALM:
        if bt < T['hour']: st.put('fx', bell(89, .3), bt, .4, .3); st.put('fx', bell(96, .45), bt + .1, .4, .3)

    # ⑦ "YOUR BRAIN HIDES IT" 22.2–26.4: mysterious. Sus chords, 'ee' choir, half-time, the theme as a music box,
    #    and the whole track blinks out for 130 ms on every on-screen blink
    groove(st, T['hour'], T['split'] - 1e-3, o2, P_SUS, kick='half', clap=False, hats='8', bassline='long', chords='pad', g=.85)
    st.put('choir', choir([70, 75, 77], T['split'] - T['hour'], 'ee', att=.5), T['hour'], .5)
    tt = T['hour']
    for m, d in A:
        if m is not None: st.put('fx', bell(m + 12, max(.4, d * b * 1.6)), tt, .4, .15)
        tt += d * b
    for bt in CALM:
        if T['hour'] <= bt < T['split']: st.gate(bt, bt + .13)

    # ⑧ SPLIT 26.4–30.0 · "ON SCREENS YOU BLINK 3× LESS": left = the theme as a chatty bouncy tune (talking),
    #    right = a flat computer hum with key taps and one lonely beep
    groove(st, T['split'], T['cta'] - 1e-3, o2, P_MAJ, kick='half', clap=False, hats='none', bassline='bounce', chords='none', g=.8, pan=-.6)
    tt = T['split']
    for rep in range(2):
        for m, d in A:
            if m is not None and tt < T['cta'] - .05: st.put('fx', pluck(m + 12, d * b * .8, duty=.5, tau=.08), tt, .5, -.85)
            tt += d * b * .9
    for bt in TALK: st.put('fx', bell(89, .25), bt, .35, -.85); st.put('fx', bell(96, .35), bt + .1, .35, -.85)
    n = ns(T['cta'] - T['split']); t = np.arange(n) / SR
    hum = (blep_pulse(np.full(n, 120.), np.full(n, .5)) * .4 + np.sin(2 * np.pi * 60 * t)) * np.minimum(1, t / .3) * np.minimum(1, (t[-1] - t) / .1)
    st.put('fx', lp(hum, 700), T['split'], .35, .9)
    for tb in np.arange(T['split'] + .13, T['cta'], b * .75): st.put('fx', pluck(100, .012, tau=.004), tb, .2, .9)
    for bt in SCR: st.put('fx', bell(84, .6), bt, .45, .9)

    # ⑨ CTA 30.0–34.2 · "DID YOU MAKE IT?": the dare stab returns, then the theme's answer, full, with a wink bell
    o3 = T['cta']
    st.put('fx', k_impact(.9), o3, .9); st.put('drums', k_crash(.9), o3, .8)
    for at, m, d in [(o3 + .02, 72, .2), (o3 + .27, 72, .2), (o3 + .52, 77, .4)]: st.put('lead', lead(m + 12, d), at, .7)
    groove(st, o3 + 1.0, dur - .3, o3, P_MAJ, kick='four', clap=True, hats='16', bassline='8', chords='8', g=1.0)
    st.put('choir', choir([65, 69, 72, 77], dur - o3 - 1.0, 'ah', att=.2), o3 + 1.0, .55)
    st.melody(A2, o3 + 1.0, g=.85, transpose=12); st.melody(A2, o3 + 1.0, g=.3, pan=-.35)
    st.put('fx', bell(101, .9), o3 + 1.2, .5, .4)                                            # the tear's wink
    st.put('drums', k_crash(.8, 1.5), dur - 1.2, .6); st.put('chords', chordtone([65, 69, 72, 77], 1.2, a=.005, r=.5), dur - 1.2, .5)
    return st.mixdown()
