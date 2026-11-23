# Pixel Countdown Science — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Paper to the Moon* (37.5 s, 1080×1920, 30 fps) · `test.mp4` · source in [`demo/`](demo/)

## Story & structure

Fold a sheet of paper in half 42 times and it reaches the Moon. The viewer counts the folds; each fold is a note one semitone up and a lurch of the scenery, so exponential growth is seen and heard. Two climaxes (the Moon at fold 42, the visible universe at fold 103), a reality check between them (the record is 12 folds), and a dare to finish ("can you pass 7 folds?").

| Time | Beat | Native move |
|---|---|---|
| 0–3.5 | The sheet character on a desk: "FOLD A PAPER 42 TIMES. HOW TALL?" | The challenge stated |
| 3.5–21 | Folds 1–41 in five 3.5 s windows (5, 7, 9, 10, 10 folds), past a coin, a mug, you, a house, 30 floors, the tallest building, Everest, jets, the edge of space, the space station | Count along |
| 21–21.5 | The frame dims; true silence | — |
| 21.5–25.5 | Fold 42: Earth, the Moon and a line of paper between them | Equation reveal (the number becomes a picture) |
| 25.5–29.5 | A straining 12-fold block: "THE REAL RECORD: 12 FOLDS" | Split verdict, as one beat |
| 29.5–33.5 | Folds 43–103 in 1.75 s, to the edge of sight | Count along, second climax |
| 33.5–37.5 | Back on the desk: "GRAB A PAPER. CAN YOU PASS 7 FOLDS?" | The CTA return |

## Shots & camera

Three views. **The desk portrait** (hook, record, CTA). **The log-altitude view**: every screen row is an altitude, 70 px per ×10, with the tower top fixed at y = 300, so landmarks enter from the top and slide down past the hero as it reaches them; the sky zones (room → day sky → dusk → space with stars → deep space) live on the same axis and scroll with the folds. **The Earth–Moon portrait** for the pay-off.

## Palette

ENDESGA-32 plus an indigo ground ramp, the protected yellow ramp, and a few Earth and Sun tones. Paper is white with a silver shade; yellow is only the counter and key words.

## Score & sound

There's no voice. The score follows STYLE.md §7. Each fold is a ping one semitone up (A3 at fold 0 to D#7 at fold 42). Between folds a filler stream thickens window by window (none → 8ths → 16ths → 16ths doubled → 32nds) over a choir that darkens (fifth → minor → added 2nd → cluster) and a trill. A synth slide and an uplifter run into 0.48 s of true silence. Fold 42 lands as a huge slow C-major swell with a lyrical line. The record beat is a slide down and a few dry plucks. The universe burst is a 32nd stream racing up with a slide, into the biggest swell (F), which resolves home to C under the CTA with high arpeggios. Paper foley (a dry crease) sits on every fold. Mixed to −14 LUFS with no grain.

## Build notes

```
demo/
  px.js     270×480 indexed framebuffer, palette, LUTs, Bayer, bloom on brightest tones
  font.js   5×7 caps, ink outline + shadow, *highlight* markup, bigNum counter
  world.js  the three views: logScene (sky zones, landmarks, stars, tower, hero), deskScene, moonShot; face()
  main.js   TL timings, fold schedule, captions (CAPS), counter, sound events (window.EV), TEXTS for readcheck
  studio.py instruments and mix: ping, gliss, swell, choir, reverb, delay, glue
  score.py  this film's score, cue by cue, fed TL and the fold times
  mix.py    score + paper foley + the true silence
  build.sh  events → mix → frames → mux (OUT=… to choose the output folder)
```

`node core/render/readcheck.mjs demo --size 1080x1920` passes with every caption timed.
