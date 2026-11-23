# Pixel Countdown Science · 像素倒数科普 — Style Prompt

Made from a blank page; techniques from 16-bit Pixel RPG (pixel-rpg) in Lemo-Opuscar.
Default size: 1080×1920.

> A vertical pixel-art science short the viewer *does*, not just watches: one big object with a face in the middle of the frame, a big yellow number counting with you, and one short fact per caption until the count pays off.
> References (grammar only): the genre of 8-bit "try this right now" science shorts for vertical feeds. Never copy any creator's handle, watermark, characters, scenes, font or music. Learn the grammar, not the assets.

## 1. Essence, and what it is not

- **The viewer takes part.** Every film is built around a count the viewer can follow or perform: chirps, seconds, heartbeats, a timer. The big number is the film's clock and spine.
- **One hero object in the centre** (an insect, a cloud, a mouth, a joint, an organ), drawn large, with a **cute face**: dot eyes with a 1-px glint, small brows, an occasional blush. It reacts to the facts (sleepy, surprised, smug, sweating).
- **One fact per caption**: 1–2 short lines in caps at the top, each building on the last, ending on the pay-off (an equation, a reveal) and a **call to action** ("Next summer night, count the crickets!").
- **Pixel art at 270×480 native**, scaled ×4 nearest-neighbour to 1080×1920; everything, text included, lives in the framebuffer.

Not 16-bit Pixel RPG (no dialog boxes, menus, portraits or save files; no story characters). Not a lecture (no voice-over walls of text, no charts). Not CRT nostalgia (no scanlines, no curvature, no grain).

## 2. Materials & rendering

- **Indexed framebuffer** (`Uint8Array` of palette indices) at **270×480**, presented through a lookup table (index → RGB), ×4 to 1080×1920. Camera moves are integer native pixels; each layer rounds its own offset.
- **Master palette ~40 colours** (ENDESGA-32 plus a few extra ground tones and the yellow highlight ramp). One protected yellow ramp no effect touches.
- **Grounds are textured, never flat**: 4×4 Bayer dither between two or three tones of the mood colour, plus a quiet pattern (stars, dithered circles or cells, grass strokes, field patches).
- **A setting and a measuring prop**: the hero sits in its place (a field, a mouth, a ribcage) and next to a prop that measures the count (a thermometer, a gauge, a clock) whose level moves on every count.
- **Hero objects**: shapes evaluated per pixel (implicit shapes, capsules, ellipses) with **3-tone shading from the upper left**, a 1-px inner rim in the darkest tone, a **1-px ink outline**, a hard 2×2–3×3 specular highlight, and a hand-placed face.
- **Glow halos are allowed** on the hero or the counter: **Bayer-dithered rings** stepping through 2–3 palette tones (no alpha blur). A soft additive bloom in RGB after the LUT is allowed at low strength (≤ 20 %) on the brightest tones only.
- **Pixel 3D shots are allowed**: a perspective floor (mode-7 style plane: per-pixel ray to a textured plane) or simple 3D shapes, computed at native resolution and drawn straight into palette indices, with Bayer for the distance fog. Never a full-resolution 3D render scaled down.
- **Small sparkles**: 1-px stars, `+1` pops, sweat drops, tiny motion lines; ≤ 6 at once.

## 3. Colour logic

- **One saturated mood ground per film**, chosen from the topic: night indigo (outdoors, sky), magenta-plum (inside the body), deep teal-navy (water, cold, medicine), warm violet (joints, bones). The ground is always darker than the hero.
- **Yellow is the only highlight** (`#fee761` body, `#feae34` shade, `#b86f1c`-ish shadow): the counter, key words in captions, `+1` pops. Never use yellow on props, so it always means "this is the number / the key word".
- **Captions are white** (`#ffffff` with a `#181425` shadow); body text never uses another colour.
- The hero gets the warmest or brightest saturated colour in the frame (lime cricket on indigo, red heart on teal, orange joint on violet).
- A whole-palette shift by LUT is allowed for a state change (cold night → bluer LUT; warm → back). Never alpha fades.

## 4. Type & subtitles

- **An original blocky pixel font**: 5×7 glyphs, regular weight (1-px strokes at 1×), all caps, 1-px letter gap; `setBold(true)` is there for a heavier title, not for captions.
- **Caption**: at the top, centred, y ≈ 40–90 native; 1–2 lines at **2×** (cap 14 native, 56 px at 1080 wide), max ~16 characters per line; optional third line at **1×** as a footnote ("≈ 21°C", "(ON AVERAGE)").
- **Key words in yellow**, marked in the source with `*word*`. At most two highlighted spans per caption.
- **Ink**: every glyph pixel gets a full 1-native-px ink outline plus a drop shadow down-right (1–2 px), so text reads on any ground.
- **The counter** sits in the centre band, at **3×–5×** (cap 21–35 native), yellow, with a small 1× white unit label under it ("CHIRPS", "SEC", "BEATS"). Pop on each change: scale up one step for 2 frames, then back.
- Captions **cut**, never type on or fade: a new caption replaces the old one on a count. Each caption stays ≥ max(1.8 s, characters ÷ 15 + 1.0 s).
- No subtitles file: there is no voice. Captions are the text.

## 5. Motion quality

**Feel comes first: nothing stands still, and every event is a small animation.** (Measured: the genre's best videos have under 25 % of frames with no motion; a film that only changes on its events sits near 50 % and feels like a slideshow.)

- **Constant life** (target: < 20 % still frames). Every character idles out of phase (a 1–2 px bob), the hero breathes, light rays or parallax drift in the ground, signals run along any lines, numbers ease to their new value instead of jumping, a glint crosses the gauge, captions drop in over 3 frames.
- **Every event has three parts.** *Wind-up*: the thing drops, charges or glows for ~0.15 s before it lands. *Hit*: squash, an expanding ring (white → cyan → pink), sparks, a 1 px screen shake, the counter slams one size up. *Aftermath*: consequences travel (lines shoot out with a bright head, targets hop when reached), then settle.
- **Big hits** (the pay-offs): a 3-2-1 px shake, a 3-frame flash, a shockwave across the frame, confetti or debris, the matching things glow and jump.
- **Sound lands on the same frame** as the picture's hit: generate both from one event list, including each travelling line's arrival time.

- Output **30 fps**. Sprites step at **12 fps**; camera and parallax move on ones at integer native pixels.
- **The count is the clock**: every count is a visible event (number pops, the hero reacts, a `+1` rises 6 px and vanishes over 0.4 s) and an audible tick.
- **Hero acting**: blinks every 2–4 s (2 frames), squash and stretch on each beat (1–2 native px), eyes follow the counter, sweat drops when under pressure, a happy squint on the pay-off.
- **Ambient life** never stops: stars twinkle (1-px on/off at 4 fps), grass or cells drift by 1 px, the halo breathes on a 2 s cycle.
- **Transitions**: hard cuts on a count; a **push-in or pull-back** made by redrawing the hero and setting larger or smaller at native resolution (procedural shapes, never scaled pixels) across 0.4–0.8 s with ease-out; a **split** where the frame divides into two halves for a comparison; a 3-frame white flash for a reveal. Never cross-dissolves.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked centre frame, hero in the middle third | "look at this one thing" | any count |
| Push-in on the hero (integer zoom step) | "here's the mechanism" | wings rubbing, a valve, a bubble |
| Pull-back to reveal context | "now you see the whole" | a field, a body, a map |
| Vertical tilt along a long object | travel, flow | a throat, a bone, a tree, a cable |
| Split screen, two heroes side by side | comparison, myth vs fact | cold vs warm, rest vs sprint, cracked vs never |
| Pixel 3D tilt to a perspective plane | distance, scale | a storm's range, a field, a graph floor |
| Hold while the LUT shifts | a state change without motion | night cooling, a fever, dusk |

Framing: captions own the top 20 %; the counter the band below; the hero the middle third; the bottom 15 % stays for ground and platform UI.

## 7. Sound palette

**The soundtrack is the film's main driver, and it works by sonifying what is on screen, then paying it off with a cinematic swell.** This is the model of a genre video with 7M views whose top comment ("insane soundtrack") had 60k likes. Measured on it: almost no drums (8 % of the energy below 100 Hz), 88 % of the energy in 100 Hz–2 kHz, 95 % of frames tonal, near-mono, −14 LUFS. Code: `demo/studio.py`; one `score.py` per film, fed the film's timings from `main.js`.

- **No voice.** Captions carry the words.
- **Notes are punchy and dry (`zap`)**: a fast downward pitch zap (about 10 ms) into a clear ringing tone, loud, on a bus with almost no reverb, over a bed kept quiet enough that there is dark space around every note. A soft ping buried in pad and reverb sounds like background, not like something happening.
- **Sonify the process.** Every on-screen event the film counts is a note (`zap`, or the softer `ping`): a split, a second, a tonne, a blink, a step of a random walk. On a 120 bpm grid (one count per second = 2 beats):
  - **density follows the process**: the stream between counts goes 8ths → 16ths → 32nds as the thing grows, dries or speeds up;
  - **pitch follows the process**: each count steps a semitone up, so the number climbing on screen is a melody climbing in the ear;
  - **side events are extra notes**: a crack is a high off-grid ping, a pyramid landing a deep choir stab, a photon a stream panning left → right.
- **A held tension underneath**: a soft drone (mid register, not sub) and a chip choir that turns more dissonant as the build goes on (fifth → minor → added minor 2nd → cluster); a nervous trill when it hurts.
- **The synth slide (`gliss`)**: a rising pulse glissando opens the film and fires into every pay-off.
- **True silence** (0.3–0.8 s, music included) right before the pay-off.
- **The pay-off is a cinematic swell (`swell`)**, not a drum drop: chip choir + two stacked detuned chord layers + a soft sine bass, slow attack, big reverb (RT ≈ 2.6 s). The key turns on the pay-off (dark build → bright relief, or minor awe → major warmth); the harmony then moves slowly (one chord per ~2 s). A lyrical lead line (long notes, delayed vibrato) and a high 16th arpeggio come in after it.
- **Facts can be played**: "your brain hides blinks" → the track cuts out for 130 ms on every blink; "screens: 3× less" → a lively stream on the left, a flat hum and one lonely ping on the right.
- **The CTA is the biggest swell**, with the opening slide's answer on top, ringing out.
- **Drums**: only accents (a crash, a soft sub drop at a swell, a faint count click). No groove, no four-on-the-floor.
- **Mix**: mid-range forward, low end small (≤ 10 % below 100 Hz), reverb mostly centred (`narrow`), near-mono (S/M ≈ 0.2–0.35), −14 LUFS, true peak ≤ −1 dB, grain 0.

## 8. Native moves

A menu: use the ones your topic needs.

- **Count along.** The big number counts a real thing at its real tempo while facts arrive one per few counts. *Fits:* pulse, crickets, seconds after lightning, breaths.
- **Countdown challenge.** The number counts down from a goal ("don't swallow for 20 seconds"); the hero struggles; the pay-off tells you why it was hard. *Fits:* reflexes, holding breath, blinking.
- **The equation reveal.** After a hard silence, the count turns into a formula in the caption: `30 CHIRPS + 40 = 70°F`. *Fits:* any rule of thumb.
- **Split verdict.** Two copies of the hero side by side, labelled; one fact settles it. *Fits:* myths, cold vs warm, before vs after.
- **Reload timer.** A clock runs down while the hero recovers. *Fits:* refractory periods, recharge times, cooling.
- **The CTA return.** The film ends on its opening frame with a call to action, so the loop restarts seamlessly.

## 9. Pitfalls of the medium

- Yellow on a prop kills the highlight's meaning → keep yellow for numbers and key words only.
- Caption over a busy ground is unreadable → ink shadow + left/top outline, and keep the top 20 % of the ground quiet.
- A face drawn smaller than 3-px eyes reads as dirt → hero faces at least 3×3 eyes with a glint.
- Smooth gradients betray the pixel grid → every gradient is Bayer dither between palette tones.
- Sub-pixel motion shimmers → round every position to whole native pixels.
- Glow as an alpha blur turns the frame to mush → dithered rings; bloom only on the brightest tones, ≤ 20 %.
- A count tick that drifts from the number's change reads as a mistake → generate both from the same event list.
- A noise bed instead of music makes the film feel empty next to the genre → always run the groove; ambience stays faint.
- One generic loop under every film feels lacklustre → score each film to its own picture (see §7).
- A film that only moves on its events feels like a slideshow → constant idle life and three-part events (§5).
- Notes smeared in reverb and pad have no punch → dry `zap` hits over a quiet bed (§7).
- A drum groove under the count fights the sonification → let density and pitch carry the energy; save the weight for the swell.
- Over-limiting flattens the pump → limit lightly so the bar-end rests stay audible.
- Facts in a counting film must be true and sourced → write the source next to each caption in the treatment.
- Negative modulo indexes `undefined` → `((n % m) + m) % m`.

## 10. Engine

In `demo/` (this style's own code, adapted from `$LIB/styles/pixel-rpg/demo/`): `px.js` (270×480 indexed framebuffer, palette, LUTs, Bayer dither, glow rings, RGB bloom), `font.js` (5×7 pixel font, scales, ink outline, `*highlight*` markup, `bigNum`), `world.js` (the demo's views, landmarks, hero and `face()`), `main.js` (timings, counts, captions, sound events), `studio.py` (instruments and mix: `ping`, `gliss`, `swell`, choir, reverb, delay, glue), `score.py` (the film's score, cue by cue), `mix.py` (score + foley + the true silence). Build steps: [DEMO.md](DEMO.md) "Build notes". Then `$LIB/styles/pixel-rpg/DEMO.md` for the base techniques.

## 10b. Built for an action (topic choice)

A film can be interesting and still give nobody a reason to act. Choose topics where the viewer learns something about **themselves**, and design the reason for each action before writing the treatment:

| Action | Give them |
|---|---|
| Comment | a personal result to report (a score, a camp, a date, "which one are you?") |
| Share | a challenge to do with or against a specific friend |
| Like | a moment of being seen, surprised or flattered |
| Follow | an obvious next part (number the series) |

Prefer tests the viewer performs during the film (a 3-2-1 "try it now"), with the share of people who can shown as a crowd. Facts about distant things (a deck, a sheet of paper, the Sun) are a weaker choice unless the viewer is put inside them.

## 11. Variation space

Free in every film: the topic, the hero object, the count, the mood ground, the facts, the opening and the CTA. Far from the demo:

- Structures: **countdown challenge** (count down, the hero struggles, the pay-off explains); **count-and-convert** (count a natural signal, turn it into a measurement); **myth on trial** (split verdict, a clock, a study).
- Openings: **the hero asleep** and the first count wakes it; **the challenge stated** ("DON'T BLINK FOR 10 SECONDS"); **a cold open on the pay-off number**, then rewind.
- Endings: **return to the first frame** with the CTA; **"send this to…"** with the hero winking; **the number frozen** with the rule as a one-line caption.

---

How the demo was made (story, shots, score, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
