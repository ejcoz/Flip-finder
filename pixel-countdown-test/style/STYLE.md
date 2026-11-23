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

The genre's sound is **a continuous beat-driven chip track from the first frame**, not ambience. (Measured on the references: 120–128 bpm, ~65 % of the energy below 100 Hz in pitched bass and kick, tonal content in ~80 % of frames, 3–4 onsets a second, near-mono.)

- **No voice.** Captions carry the words.
- **The soundtrack is the film's main driver: premium chiptune.** 8-bit voices, produced like a modern track (`demo/studio.py`):
  - **an earworm theme per film**: a singable 2-bar phrase plus an answer, stated in the hook, developed through the film (soured, fragmented, sequenced upward under tension), **dropped huge on the pay-off** (an octave up, doubled, with a third), and resolved under the CTA;
  - **the count plays music**: each count is a pitched ping stepping up the key's scale, so the visuals perform the melody, and the pay-off lands on the top note;
  - **a real drop**: build (snare roll 8ths → 16ths, uplifter, reverse cymbal, tom fill) → true silence → impact + sub drop + crash + full arrangement;
  - **instruments**: PWM chip lead with glides and delayed vibrato, chip "choir" (formant vowels ah/oo/ee), detuned chip chords, chip bass with a sine sub, layered kick/snare/clap, hats with velocity and 16th variation, pitched toms;
  - **mix**: buses with sends to a stereo reverb and a dotted-8th ping-pong delay, chorus on chords and choir, side-chain pump from the kick, mono bass, glue compression and soft saturation, a touch of air. Stereo width S/M ≈ 0.3–0.4 (still mono-safe).
- **Every film gets its own score, written cue by cue against its picture** (`score.py`, fed the film's timings from `main.js`). The groove below is the shared instrument kit and grammar, not a loop to paste under every film. For each caption beat, ask what is happening on screen and give the music that job:
  - **the topic sets the palette and key**: water → pitch-drop "drop" arps; the Sun → choir swells, heroic brass motif; weights → a march; a computer → a flat square hum;
  - **the hero's state sets harmony and texture**: calm → major, open; drying or stress → the bass walks down, echoes dry out, a bit-crush deepens, tritones and a nervous trill appear; panic → 8th kicks, an accelerating roll, everything gliding up; relief → a major bloom;
  - **on-screen events become musical notes**: each pyramid that lands plays the next bass note; each blink plays a two-note "bl-ink"; a photon crossing the frame is an arpeggio panning left → right; a random walk is random notes in the key; a wink is a bell;
  - **a fact can be played, not only shown**: "your brain hides blinks" → the music itself cuts out for 130 ms on every blink; "screens: 3× less" → talking on the left channel, a dull hum on the right;
  - **a motif bookends the film**: the hook's sting or theme returns, resolved, under the CTA.
- **The groove** (`demo/groove.py`), running under every second except the hard silence:
  - **kick**: a sine with a fast pitch drop (≈ 216 → 46 Hz), on every beat (or every other beat in a half-time section);
  - **chip bass**: square + 4-bit triangle on the chord root, one note per beat, gated (~80 %), with a rest on the last 8th of every bar so the track breathes. It is side-chained to the kick;
  - **pumping chords**: 25 % pulse triads, 8th-gated, slightly detuned, low-passed ~4.8 kHz, with a breath at the bar end;
  - **hats** on the off-beats (an open hat closing each bar), a **16th arp** (12.5 % pulse) in denser sections, and a bit-crushed **snare** on 2 and 4 in full sections;
  - a one-chord-per-bar progression (four bars, original), restarting on the pay-off.
- **Tempo: 140 bpm, high energy** (the default for this style). Real-time counts don't fall on a 140 grid (3 s = 7 beats), so: every **drop and hard stop sits exactly on the grid** (the pre-drop grid is anchored to the silence, each drop starts its own grid), and every **count ping snaps to the next 1/32 note** after its second (≤ 54 ms late, about 1.5 frames). A count that is a pulse (a heartbeat) may instead set the tempo itself.
- **Energy:** four-on-the-floor in nearly every section, a driving offbeat bass (8ths with an octave pop on the last 16th), 16th hats with open hats on the offbeats, running 16th arps in the big sections, a snare fill at the end of every 4-bar phrase, a hard kick pump. Breakdowns lighten (fewer layers) but keep the kick moving.
- **Default arc** (bend it to the picture): groove from frame 1 → add hats, then arps, as the count goes on → a **snare roll + noise riser** over the last bar → **hard silence** (0.3–0.8 s, true zero, music included) → an **impact + crash** and the full groove on the pay-off → **half-time** for a calm comparison or a camera pull-back → **impact + lead melody** (pulse 25 %, one echo tap) under the call to action.
- **Count sounds on top**: a short square click plus a bright 3.5–4.2 kHz ping on every count, alternating pitch. This is the steadiest, brightest sound in the film.
- **Topic foley on the grid**: the hero's own sounds (a thump, a lid tick, a drip, a whoosh), bit-crushed and placed on or between beats.
- **Ambient bed**: only a faint layer (≤ −20 dB under the groove) for place; never a noise wash that fills the low end.
- **Mix**: groove + ticks on top, near-mono (S/M ≈ 0.05), light limiting (keep the bar-end breaths audible), −14 LUFS, true peak ≤ −1 dB, grain 0.

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
- Over-limiting flattens the pump → limit lightly so the bar-end rests stay audible.
- Facts in a counting film must be true and sourced → write the source next to each caption in the treatment.
- Negative modulo indexes `undefined` → `((n % m) + m) % m`.

## 10. Engine

In `demo/` (this style's own code, adapted from `$LIB/styles/pixel-rpg/demo/`): `px.js` (270×480 indexed framebuffer, palette, LUTs, Bayer dither, glow rings, integer zoom, RGB bloom), `font.js` (bold 5×7 pixel font, scales, ink shadow/outline, `*highlight*` markup), `hero.js` (the demo's heart: implicit shape, 3-tone shading, face and expressions), `scene.js` (ground, cells, ribcage setting, gauge prop, ECG mode-7 plane), `studio.py` (premium-chiptune instruments and mix: buses, reverb, delay, chorus, pump, glue), `groove.py` (simpler groove kit), `mix.py` (all sound, from the page's events), `main.js` (shots, counts, captions, sound events). Build steps: [DEMO.md](DEMO.md) "Build notes". Then `$LIB/styles/pixel-rpg/DEMO.md` for the base techniques.

## 11. Variation space

Free in every film: the topic, the hero object, the count, the mood ground, the facts, the opening and the CTA. Far from the demo:

- Structures: **countdown challenge** (count down, the hero struggles, the pay-off explains); **count-and-convert** (count a natural signal, turn it into a measurement); **myth on trial** (split verdict, a clock, a study).
- Openings: **the hero asleep** and the first count wakes it; **the challenge stated** ("DON'T BLINK FOR 10 SECONDS"); **a cold open on the pay-off number**, then rewind.
- Endings: **return to the first frame** with the CTA; **"send this to…"** with the hero winking; **the number frozen** with the rule as a one-line caption.

---

How the demo was made (story, shots, score, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
