"""score.py — original score for "Don't Blink", cue by cue against the picture.
Key F major / D minor. 120 bpm grid (one count second = 2 beats). Reads the film's timings from the 'score' event (main.js)."""
import numpy as np
from groove import (Score, beats, kick, snare, hat, crash, impact, drop, pluck, bell, brass, swell, trill,
                    bassnote, chord8, riser, drone, crush, hz, SR, ns, lp, hp, _rng)

F = 53  # F3
PENTA = [0, 2, 4, 7, 9]
def build(e, dur):
    T = e['TL']; CALM = e['CALM']; TALK = e['TALK']; SCR = e['SCREEN']; S = Score(dur); b = .5
    o = -1.0                                            # count grid: beats on every count second (3.0, 4.0 …)

    # 1 · HOOK (0–3.0) "DON'T BLINK": a playful dare. "dun-dun-DUN!" sting, bouncy staccato bass, tick-tock clock
    for at, m, d in [(.05, F + 19, .16), (.3, F + 19, .16), (.55, F + 24, .7)]:
        S.add(pluck(m, d, .5, tau=.2), at, .38); S.add(pluck(m - 12, d, .25, tau=.2), at, .2)
    S.add(crash(), .55, .15, drum=True)
    S.add(swell([F + 12, F + 16, F + 19, F + 24], T['go'] - .5, att=.3, cut=2200), .55, .22)
    for tb, k in beats(1.0, T['go'] - 1e-3, o, b):
        S.add(bassnote(F - 12 + (7 if k % 2 else 0), b * .4), tb, .5)
        S.add(pluck(F + 36 + (0 if k % 2 else 5), .03, .5, tau=.01), tb, .18, .3 if k % 2 else -.3)   # tick / tock
        if k % 2 == 0: S.kick(tb, .55)

    # 2 · TEAR FILM (3.0–6.8): watery and bright. Water-drop arpeggio in 8ths on F pentatonic with an echo, soft chords
    for tb, k in beats(T['go'], 6.8 - 1e-3, o, b):
        beat = k % 4; ch = [[F, F + 4, F + 7], [F - 3, F, F + 4]][(k // 4) % 2]
        if beat in (0, 2): S.kick(tb, .6)
        S.add(bassnote(ch[0] - 12, b * .7), tb, .45)
        if beat in (0, 2): S.add(chord8([m + 12 for m in ch], b * 1.5, duty=.5, cut=2500), tb, .14)
        for j in range(2):
            m = F + 24 + PENTA[(k * 2 + j) % 5]
            S.add(drop(m), tb + j * b / 2, .3, .3 if j else -.3); S.add(drop(m) * .35, tb + j * b / 2 + .18, .3, -.3 if j else .3)

    # 3 · DRYING (6.8–10.6) "LASTS ABOUT 10 SECONDS": the gauge drains. Bass walks down chromatically, the drops lose
    #     their echo and get shorter and lower (dry), the music slides from F major into D minor
    walk = [F, F - 1, F - 2, F - 3, F - 4, F - 5, F - 6, F - 7]
    for tb, k in beats(6.8, 10.6 - 1e-3, o, b):
        i = int((tb - 6.8) / .5); dry = (tb - 6.8) / 3.8
        if k % 2 == 0: S.kick(tb, .65)
        S.add(bassnote(walk[min(7, i // 1)] - 12, b * .8), tb, .5)
        m = F + 24 + PENTA[k % 5] - int(dry * 5)
        S.add(drop(m) * (1 - .5 * dry), tb, .28, .2 if k % 2 else -.2)
        if k % 2: S.add(chord8([F - 3 + 12, F + 12, F + 4 + 12 - int(dry > .5)], b * .9, cut=2000), tb, .16)
        S.add(hat(), tb + b / 2, .18, .2, drum=True)

    # 4 · STING (10.6–14.4) "BREAKS UP AND STARTS TO STING": dissonance. D pedal with tritone 16ths, a nervous trill
    #     swelling on top, kick on every beat, crackles and a bit-crush that gets worse
    seg = Score(dur)
    for tb, k in beats(10.6, 14.4 - 1e-3, o, b):
        S.kick(tb, .8)
        if k % 2: S.add(snare(), tb, .22, drum=True)
        for j in range(4):
            m = [50 - 12, 56 - 12, 50, 56][j]                     # D – G# (tritone)
            seg.add(pluck(m + 12, b / 4 * .8, .125, tau=.05), tb + j * b / 4, .22, .25 if j % 2 else -.25)
        seg.add(bassnote(38, b * .9, cut=700), tb, .55)
    seg.add(trill(81, 14.4 - 10.6, rate=8, depth=.025), 10.6, .16)
    m = seg.render(); a0, a1 = int(10.6 * SR), int(14.4 * SR); bits = np.linspace(6, 3.5, a1 - a0)
    m[a0:a1] = np.stack([np.round(m[a0:a1, c] * 2 ** bits) / 2 ** bits for c in (0, 1)], 1)
    S.mus[:len(m)] += m

    # 5 · HOLD IT (14.4–17.5): panic. Kick in 8ths, snare roll accelerating, the trill glides up, a riser, a low shake rumble
    for tb, k in beats(14.4, T['silence'] - 1e-3, o, b / 2):
        S.kick(tb, .7 if k % 2 == 0 else .45)
        S.add(bassnote(38 + int((tb - 14.4) / 3.1 * 12), b / 2 * .8, cut=900), tb, .5)
    for tb, k in beats(15.5, T['silence'] - 1e-3, o, b):
        sub = 2 if tb < 16.5 else 4
        for j in range(sub): S.add(snare(), tb + j * b / sub, .18 + .2 * (tb - 15.5) / 2, drum=True)
    n = ns(T['silence'] - 14.4); t = np.arange(n) / SR; f = hz(81) * 2 ** (t / t[-1] * 5 / 12) * (1 + .03 * np.sin(2 * np.pi * 11 * t))
    S.add(lp(np.where(np.cumsum(f / SR) % 1 < .25, 1., -1.), 5000) * np.linspace(.4, 1, n), 14.4, .17)
    S.add(riser(T['silence'] - 14.4, f0=300, oct_=5), 14.4, .3)
    S.add(lp(_rng.standard_normal(n), 120) * np.linspace(.2, 1, n), 14.4, .5, drum=True)
    # (hard silence T['silence'] → T['blink'] is carved in mix.py)

    # 6 · BLINK! (18.0): release. Impact + splash, a cascade of drops falling, an F major bloom
    o2 = T['blink']
    S.add(impact(), o2, .6, drum=True); S.add(crash(), o2 + .1, .3, drum=True)
    for j, m in enumerate([F + 36, F + 33, F + 31, F + 28, F + 26, F + 24, F + 21, F + 19]): S.add(drop(m), o2 + .1 + j * .045, .3, (j % 3 - 1) * .4)
    S.add(swell([F, F + 4, F + 7, F + 12, F + 16], 1.4, att=.03, cut=3500), o2 + .1, .4)

    # 7 · RELAXED (18.6–22.2) "15-20 TIMES A MINUTE": a bouncy happy groove; every blink on screen plays "bl-ink" (two notes)
    def happy(t0, t1, gain=1.0):
        for tb, k in beats(t0, t1 - 1e-3, o2, b):
            beat = k % 4; ch = [[F, F + 4, F + 7], [F - 5, F - 1, F + 2], [F - 3, F, F + 4], [F - 7, F - 3, F]][(k // 4) % 4]
            S.kick(tb, .65 * gain)
            if beat in (1, 3): S.add(snare(), tb, .22 * gain, drum=True)
            S.add(hat(), tb + b / 2, .25 * gain, .2, drum=True)
            S.add(bassnote(ch[0] - 12 + (7 if beat == 2 else 0), b * (.45 if beat % 2 else .8)), tb, .48 * gain)
            for j in range(2):
                if not (beat == 3 and j): S.add(chord8([m + 12 for m in ch], b / 2 * .6, duty=.5, cut=3500), tb + j * b / 2, .2 * gain, .15 if j else -.15)
    happy(T['rate'], T['hour'])
    for bt in CALM: S.add(pluck(F + 26, .1, .5, tau=.05), bt, .3); S.add(pluck(F + 31, .16, .5, tau=.08), bt + .1, .3)

    # 8 · "~1 HOUR A DAY · YOUR BRAIN HIDES IT" (22.2–26.4): reveal sparkle, mysterious sus chords — and the music itself
    #     blinks out for an instant on every on-screen blink (the brain hiding it)
    S.add(bell(F + 36, 1.2), T['hour'], .25); S.add(bell(F + 43, 1.2), T['hour'] + .1, .2)
    for tb, k in beats(T['hour'], T['split'] - 1e-3, o2, b):
        beat = k % 4; root = [F, F - 2][(k // 4) % 2]
        S.kick(tb, .6)
        S.add(hat(), tb + b / 2, .22, .2, drum=True)
        S.add(bassnote(root - 12, b * .8), tb, .45)
        if beat == 0: S.add(swell([root + 12, root + 17, root + 19, root + 24], 2.0, att=.2, cut=2800), tb, .26)
        S.add(bell(root + 24 + [0, 5, 7, 12][beat], .4), tb + b / 2, .1, .3)
    # 9 · SPLIT (26.4–30.0) "ON SCREENS YOU BLINK 3× LESS": left = chatty bouncy tune (talking), right = flat computer hum
    o3 = T['split']
    for tb, k in beats(o3, T['cta'] - 1e-3, o2, b):
        if k % 4 == 0: S.kick(tb, .55)
        for j in range(2):
            m = F + 24 + PENTA[(k * 3 + j * 2) % 5]
            S.add(pluck(m, .12, .5, tau=.05), tb + j * b / 2, .22, -.85)
        if k % 2 == 0: S.add(bassnote(F - 12 + [0, 7, 9, 5][(k // 2) % 4], b * .8), tb, .35, -.5)
        if k % 3 == 0: S.add(pluck(96, .015, .5, tau=.005), tb + .13, .12, .85)         # keyboard tap, right
    n = ns(T['cta'] - o3); t = np.arange(n) / SR
    hum = (np.where((t * 120) % 1 < .5, 1., -1.) * .5 + np.sin(2 * np.pi * 60 * t)) * np.minimum(1, t / .3) * np.minimum(1, (t[-1] - t) / .1)
    S.add(lp(hum, 600), o3, .18, .85)
    for bt in TALK: S.add(pluck(F + 26, .1, .5, tau=.05), bt, .28, -.85); S.add(pluck(F + 31, .14, .5, tau=.07), bt + .1, .28, -.85)
    for bt in SCR: S.add(pluck(F + 31, .25, .5, tau=.15), bt, .28, .85)               # one lonely beep, right

    # 10 · CTA (30.0–34.2) "DID YOU MAKE IT?": the opening dare returns, now as a full happy groove + lead, a wink "ting"
    o4 = T['cta']
    S.add(impact(), o4, .45, drum=True); S.add(crash(), o4, .22, drum=True)
    for at, m, d in [(o4 + .05, F + 19, .16), (o4 + .3, F + 19, .16), (o4 + .55, F + 24, .5)]: S.add(pluck(m, d, .5, tau=.2), at, .36)
    happy(o4, dur - .5, .95)
    tt = o4 + 1.0
    for m, d in [(F + 24, .5), (F + 26, .5), (F + 28, .5), (F + 31, 1.0), (F + 28, .5), (F + 26, .5), (F + 24, 1.5)]:
        S.add(brass(m, d * .9, att=.02), tt, .26, .05); tt += d
    S.add(bell(F + 43, .8), o4 + 1.2, .3, .3)                                           # the tear's wink
    S.add(swell([F, F + 4, F + 7, F + 12], 1.4, att=.02, cut=3000), dur - 1.4, .35); S.add(crash(), dur - 1.4, .2, drum=True)

    # the brain hides blinks: gate the whole score for 130 ms at each blink in the "brain hides it" cue
    for bt in CALM:
        if T['hour'] <= bt < T['split']: S.mute(bt, bt + .13)
    return S.render()
