"""score.py — "Don't Blink": original premium-chiptune score, cue by cue against the picture.
F major / D minor, 120 bpm (one count second = 2 beats). THEME: a sneaky, bouncy "staring contest" tune.
Stated bright over water drops, soured into D minor as the eye dries, broken into a rising motif sequence as it stings
and panics, then dropped huge on BLINK!, whispered as a music box while the music itself "blinks", split talking-left /
screen-right, and paid off under the CTA. The 15 countdown pings climb two octaves of F major as the tension rises."""
import numpy as np
from studio import (Studio, groove, q32, choir, chordtone, arp, bass, bell, drop, pluck, trill, drone, lead,
                    k_crash, k_revcymbal, k_uplift, k_subdrop, k_impact, k_tom, SR, ns, hz, lp, blep_pulse)

A  = [(72, .5), (None, .25), (69, .25), (72, .5), (74, .5), (72, .5), (69, .5), (65, 1), (None, .5), (67, .5), (69, .5), (70, .5), (69, .5), (67, 1)]
A2 = [(72, .5), (None, .25), (69, .25), (72, .5), (77, .5), (76, .5), (74, .5), (72, 1), (None, .5), (70, .5), (69, .5), (67, .5), (65, 1.5), (None, .5)]
AM = [(69, .5), (None, .25), (65, .25), (69, .5), (70, .5), (69, .5), (65, .5), (62, 1), (None, .5), (64, .5), (65, .5), (67, .5), (65, .5), (64, 1)]
MOTIF = [(72, .5), (None, .25), (69, .25), (72, .5), (None, .5)]          # 2 beats: the theme's head
CH = {'F': [65, 69, 72], 'Dm': [62, 65, 69], 'Bb': [58, 62, 65], 'C': [60, 64, 67], 'Gm': [55, 58, 62], 'A': [57, 61, 64], 'Bbsus': [58, 63, 65], 'Csus': [60, 65, 67]}
ROOT = {'F': 53, 'Dm': 50, 'Bb': 46, 'C': 48, 'Gm': 43, 'A': 45, 'Bbsus': 46, 'Csus': 48}
P_MAJ = ['F', 'Dm', 'Bb', 'C']; P_MIN = ['Dm', 'Bb', 'Gm', 'A']; P_SUS = ['Bbsus', 'Csus']
FMAJ = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 82, 84, 86, 88, 89]          # countdown pings, 15 → 1, rising

def G(st, *a, **k): groove(st, *a[:4], CH, ROOT, **k)
def nxt(st, t, origin): return origin + np.ceil((t - origin) / st.b - 1e-6) * st.b      # next beat at/after t

def crushed(x, bits): q = 2 ** bits; return np.round(x * q) / q

def build(e, dur):
    T = e['TL']; CALM = e['CALM']; TALK = e['TALK']; SCR = e['SCREEN']
    st = Studio(dur, 140); b = st.b
    o1 = T['silence']                                  # pre-drop grid: the panic slams exactly into the silence

    # ① HOOK 0–3.0 · "DON'T BLINK": the dare. "dun-dun-DUN!" stab, then a sneaky driving bass + tick-tock clock
    for at, m, d in [(.05, 72, .18), (.27, 72, .18), (.49, 77, .8)]:
        st.put('lead', lead(m, d), at, .8); st.put('chords', chordtone([m - 12, m - 8, m - 5], d * .9, duty=.5), at, .45)
    st.put('drums', k_crash(.5), .49, .5); st.put('fx', k_subdrop(.6), .49, .7)
    st.put('choir', choir([65, 69, 72], 2.4, 'oo', att=.3), .5, .6)
    h0 = nxt(st, 1.0, o1)
    G(st, h0, T['go'] - 1e-3, o1, ['F'], kick='two', clap=False, hats='none', bassline='drive', chords='none', fills=False, g=.85)
    for k, tb in enumerate(np.arange(h0, T['go'] - 1e-3, b)): st.put('fx', pluck(96 if k % 2 else 101, .03, duty=.5, tau=.01), tb, .35, .35 if k % 2 else -.35)
    st.put('fx', k_uplift(1.0, f0=500, octs=3), T['go'] - 1.0, .5)

    # ② TEAR FILM 3.0–6.8: watery, bright, already driving. The theme over echoing water-drop 8ths
    st.put('drums', k_crash(.5), T['go'], .55)
    t2 = nxt(st, T['go'], o1); t3 = nxt(st, 6.8, o1)
    G(st, T['go'], t3 - 1e-3, o1, P_MAJ, kick='four', clap=False, hats='8', bassline='drive', chords='pad', fills=False, g=.92)
    st.melody(A, t2, g=.62)
    t = t2; i = 0
    while t < t3 - 1e-3:
        c = P_MAJ[int((t - o1) // (4 * b)) % 4]; ms = [m + 12 for m in CH[c]] + [CH[c][0] + 24]
        st.put('fx', drop(ms[i % 4] + 12), t, .45, .4 if i % 2 else -.4); t += b / 2; i += 1

    # ③ DRYING 6.8–10.6 · "LASTS ABOUT 10 SECONDS": the theme sours into D minor, the bass walks down, drops dry up
    t4 = nxt(st, 10.6, o1)
    G(st, t3, t4 - 1e-3, o1, P_MIN, kick='four', clap=True, hats='8', bassline='none', chords='pad', fills=False, g=.92)
    for j, tb in enumerate(np.arange(t3, t4 - 1e-3, b / 2)): st.put('bass', bass(53 - j // 2, b / 2 * .8), tb, .55)
    tt = t3
    for m, d in AM:
        if tt >= t4 - 1e-3: break
        if m is not None: st.put('lead', lead(m, d * b * .9), tt, .58)
        tt += d * b
    for j, tb in enumerate(np.arange(t3, t4 - 1e-3, b / 2)):
        dry = (tb - t3) / (t4 - t3)
        if j % (1 + int(dry * 3)) == 0: st.put('chords', drop(81 - int(dry * 9)), tb, .35 * (1 - .5 * dry), .3)

    # ④ STING 10.6–14.4 · "BREAKS UP AND STARTS TO STING": the theme's head climbs a semitone each bar over a
    #    D pedal with tritone 16ths, a nervous trill and a worsening bit-crush
    t5 = nxt(st, 14.4, o1)
    G(st, t4, t5 - 1e-3, o1, ['Dm'], kick='four', clap=True, hats='16', bassline='none', chords='none', fills=False, g=.98)
    for tb in np.arange(t4, t5 - 1e-3, b / 4):
        j = int(round((tb - t4) / (b / 4))); bits = 6 - 2.5 * (tb - t4) / (t5 - t4)
        st.put('chords', crushed(arp([62, 68][j % 2] + (12 if j % 4 > 1 else 0), b / 4 * .85), bits), tb, .5, .3 if j % 2 else -.3)
        if j % 2 == 0: st.put('bass', bass(38, b / 2 * .9), tb, .55)
    for n, bar in enumerate(np.arange(t4, t5 - 1e-3, 2 * b)): st.melody(MOTIF, bar, g=.66, transpose=n)
    st.put('lead', trill(93, t5 - t4), t4, .25, .2)

    # ⑤ HOLD IT 14.4–17.5: panic. 8th kicks, accelerating roll, the head climbing every beat, rising bass, uplifter,
    #    reverse cymbal and a tom fill slamming into the silence
    G(st, t5, o1 - 1e-3, o1, ['Dm'], kick='eighths', clap=False, hats='16', bassline='none', chords='none', fills=False, g=1.0)
    for j, tb in enumerate(np.arange(t5, o1 - 1e-3, b / 2)): st.put('bass', bass(38 + j // 2, b / 2 * .8), tb, .55)
    for n, bar in enumerate(np.arange(t5, o1 - 1e-3, b)): st.melody([(72, .5), (69, .5)], bar, g=.62, transpose=4 + n)
    for tb in np.arange(o1 - 4 * b, o1 - 1e-3, b / 4): st.snare(tb, .25 + .35 * (tb - o1 + 4 * b) / (4 * b))
    st.put('fx', k_uplift(o1 - 14.4, f0=300, octs=5), 14.4, .75)
    st.put('fx', k_revcymbal(1.4), o1 - 1.4, .6)
    for j, m in enumerate([55, 52, 48, 45]): st.put('drums', k_tom(m), o1 - b + j * b / 4, .7, (j % 2 - .5) * .6)
    for i in range(15): st.put('fx', bell(FMAJ[i] + 12, .4), q32(st, T['go'] + i, o1), .34, .15)    # countdown climbs
    # (true silence T['silence'] → T['blink'] is carved in mix.py)

    # ⑥ BLINK! DROP 18.0–22.2: the theme slams in over the full groove, arps + choir; a splash cascade; blinks ring
    o2 = T['blink']
    st.put('fx', k_impact(1.0), o2, 1.0); st.put('drums', k_crash(1.0), o2, .95)
    for j, m in enumerate([96, 93, 91, 89, 86, 84, 81, 79, 77]): st.put('fx', drop(m), o2 + .04 + j * .035, .4, (j % 3 - 1) * .5)
    G(st, o2, T['hour'] - 1e-3, o2, P_MAJ, kick='four', clap=True, hats='16', bassline='drive', chords='8', arps=True, g=1.08)
    st.put('choir', choir([65, 69, 72, 77], T['hour'] - o2, 'ah', att=.08), o2, .6)
    st.melody(A, o2, g=.9, transpose=12); st.melody(A, o2, g=.32, pan=-.35)
    st.melody([(m - 3 if m else None, d) for m, d in A], o2, g=.22, transpose=12, pan=.35)
    st.melody(A2, o2 + 8 * b, g=.9, transpose=12); st.melody(A2, o2 + 8 * b, g=.32, pan=-.35)
    for bt in CALM:
        if bt < T['hour']: st.put('fx', bell(89, .3), bt, .4, .3); st.put('fx', bell(96, .45), bt + .08, .4, .3)

    # ⑦ "YOUR BRAIN HIDES IT" 22.2–26.4: mysterious but moving. Sus chords, 'ee' choir, steady kick, the theme as a
    #    music box, and the whole track blinks out for 130 ms on every on-screen blink
    G(st, T['hour'], T['split'] - 1e-3, o2, P_SUS, kick='four', clap=False, hats='8', bassline='8', chords='pad', fills=False, g=.8)
    st.put('choir', choir([70, 75, 77], T['split'] - T['hour'], 'ee', att=.4), T['hour'], .5)
    tt = nxt(st, T['hour'], o2)
    for rep in range(2):
        for m, d in A:
            if m is not None and tt < T['split'] - .05: st.put('fx', bell(m + 12, max(.35, d * b * 1.6)), tt, .42, .15)
            tt += d * b
    for bt in CALM:
        if T['hour'] <= bt < T['split']: st.gate(bt, bt + .13)

    # ⑧ SPLIT 26.4–30.0 · "ON SCREENS YOU BLINK 3× LESS": left = the theme as a chatty bouncy tune (talking),
    #    right = a flat computer hum with key taps and one lonely beep
    G(st, T['split'], T['cta'] - 1e-3, o2, P_MAJ, kick='four', clap=False, hats='none', bassline='bounce', chords='none', fills=False, g=.8, pan=-.6)
    tt = nxt(st, T['split'], o2)
    for rep in range(3):
        for m, d in A:
            if m is not None and tt < T['cta'] - .05: st.put('fx', pluck(m + 12, d * b * .8, duty=.5, tau=.08), tt, .5, -.85)
            tt += d * b
    for bt in TALK: st.put('fx', bell(89, .25), bt, .35, -.85); st.put('fx', bell(96, .35), bt + .08, .35, -.85)
    n = ns(T['cta'] - T['split']); t = np.arange(n) / SR
    hum = (blep_pulse(np.full(n, 120.), np.full(n, .5)) * .4 + np.sin(2 * np.pi * 60 * t)) * np.minimum(1, t / .3) * np.minimum(1, (t[-1] - t) / .1)
    st.put('fx', lp(hum, 700), T['split'], .35, .9)
    for tb in np.arange(T['split'] + .11, T['cta'], b * .75): st.put('fx', pluck(100, .012, tau=.004), tb, .2, .9)
    for bt in SCR: st.put('fx', bell(84, .6), bt, .45, .9)
    for j in range(8): st.snare(T['cta'] - 2 * b + j * b / 4, .3 + .05 * j)
    st.put('fx', k_revcymbal(1.0), T['cta'] - 1.0, .5)

    # ⑨ CTA 30.0–34.2 · "DID YOU MAKE IT?": the dare stab, then the theme's answer, full with arps; a wink bell
    o3 = T['cta']
    st.put('fx', k_impact(.9), o3, .95); st.put('drums', k_crash(.9), o3, .85)
    for at, m, d in [(o3 + .02, 72, .18), (o3 + .02 + b / 2, 72, .18), (o3 + .02 + b, 77, .35)]: st.put('lead', lead(m + 12, d), at, .7)
    G(st, o3 + 2 * b, dur - .3, o3, P_MAJ, kick='four', clap=True, hats='16', bassline='drive', chords='8', arps=True, g=1.05)
    st.put('choir', choir([65, 69, 72, 77], dur - o3 - 2 * b, 'ah', att=.15), o3 + 2 * b, .55)
    st.melody(A2, o3 + 2 * b, g=.9, transpose=12); st.melody(A2, o3 + 2 * b, g=.32, pan=-.35)
    st.put('fx', bell(101, .9), o3 + 1.2, .5, .4)
    st.put('drums', k_crash(.8, 1.5), dur - 1.2, .6); st.put('chords', chordtone([65, 69, 72, 77], 1.2, a=.005, r=.5), dur - 1.2, .5)
    return st.mixdown()
