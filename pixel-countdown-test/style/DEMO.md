# Pixel Countdown Science — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Count Your Pulse* (29.5 s, 1080×1920, 30 fps) · `test.mp4` · source in [`demo/`](demo/)

## Story & structure

The viewer finds their pulse and counts along with a heart character for 15 seconds, then turns the count into beats per minute.

| Time | Beat | Native move |
|---|---|---|
| 0–3.4 | A heart asleep in a ribcage wakes up. "FIND YOUR **PULSE**" | Opening with the hero asleep |
| 3.4–18.4 | GO: a 15 s timer runs, the big yellow counter and the gauge rise +1 on each beat at 72 bpm. Facts change every ~3.8 s; push-in on "THAT SURGE IS THE PULSE", with pressure rings | Count along |
| 18.4–18.9 | **STOP!**, then a hard silence | — |
| 18.9–21.8 | White flash: "**18** BEATS × 4 = **72** BPM", the heart smiles | Equation reveal |
| 21.8–25.4 | The heart splits in two: resting (66 bpm) vs sprinting (180 bpm, sweating), live mini counters | Split verdict |
| 25.4–29.5 | Pixel 3D tilt down onto a mode-7 ECG paper plane; the heart sits on the horizon. "COUNT YOURS **BEFORE BED**" over the end melody | CTA |

## Shots & camera

Locked centre (heart left of centre, gauge post on the right); a push-in by redrawing the heart and ribs larger (118 → 158 px); a pull-back on the reveal; a split; a tilt into the mode-7 plane (horizon 520 → 250 native over 1.4 s).

## Palette

ENDESGA-32, plus a teal-navy ground ramp (`#0b1a2e #0f2740 #13344f #1a4560 #235a72`), heart extras (`#ff8a8a #7a1f33 #4a1226`), a protected yellow ramp (`#fff6b0 #fee761 #feae34 #b8701c`) and ECG paper (`#2a0f22 #4a1a3a #7a2e5a`, trace `#3dff9a`). Halo rings: ground → plum → crimson → clay → orange.

## Score & sound

There's no voice. A chip tick plus a lub-dub thump on each beat, an inside-the-body bed (low brown-noise hum and a breathing swish), pulse blips on every caption change and a "GO" fanfare. "STOP" is a crushed noise hit followed by 0.48 s of true silence. The reveal is a rising arpeggio, the split plays its two rhythms panned left and right, and the CTA gets an original 8-bar C-major phrase (pulse 25 % lead, 4-bit triangle bass, noise hats). Mixed to −14 LUFS with no grain.

## Build notes

```
demo/
  px.js     270×480 indexed framebuffer, palette, LUTs, Bayer, glow rings, bloom on brightest tones
  font.js   5×7 caps, regular weight, ink outline + shadow, *highlight* markup, bigNum counter
  hero.js   heart: implicit mask → distance field → 3-tone shading, rim, outline, specular; face + expressions
  scene.js  ground with cell rings, ribcage, gauge post, ECG trace, mode-7 plane
  main.js   TL timings, captions (CAPS), beats, sound events (window.EV), TEXTS for readcheck
  mix.py    all sound from events.json
  build.sh  events → mix → frames → mux (OUT=… to choose the output folder)
```

`node core/render/readcheck.mjs demo --size 1080x1920` passes; "STOP!" is a one-word stinger marked `pass`.
