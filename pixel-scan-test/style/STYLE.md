# Pixel Scan · 像素扫描 — Style Prompt

Made from a blank page; techniques from Mascot Screencast (living-screencast) in Lemo-Opuscar.
Default size: 1080×1920.

> A vertical health-timeline explainer: a big-pixel human figure stands in a smooth, hi-res x-ray scanner, and every milestone ("20 MIN", "DAY 3", "1 YEAR") sweeps a scanline down the glass to reveal how its insides have changed. Chiptune at 120 BPM; every cut lands on a bar line.
> References (grammar only):
> - **"Here's what happens to your body" timeline reels:** one subject, one set, a time label per beat, a visible change per beat.
> - **Medical imaging UI:** scan bars, calibration ticks, readouts at the edge of the glass.
> - **8-bit game feedback:** pixel type, fanfares, health bars, falling and rising pitch sweeps.
>
> Never copy their characters, sets, titles, music or footage.

A 30–60 s vertical film about what changes in the body over time after one habit starts or stops. The user gives the habit and the facts; you decide the milestones, the changes shown, the order, the score and the ending.

## 1. Essence, and what it is not

- **Two resolutions.** The world is smooth and hi-res: the scanner booth, its glass, its glow, the lab. The figure, its organs, its props and all type are **big square pixels** on one grid. The clash is the look.
- **One set, one body.** The camera never leaves the lab; graphs and diagrams appear *on the scanner glass*, never as a cut to a separate screen. **Bit is a human figure** (head, neck, shoulders, arms, torso, legs, feet), standing front-on in the scanner like a full-body scan. The glass shows Bit in x-ray: a dark silhouette with a cyan rim and its organs inside. It is the viewer's own body: generic, no gender, age or skin markers.
- **A milestone = a time label + one visible change.** Each beat titles a moment in time and changes one thing inside the body (an organ's colour, a particle cloud clearing, a meter filling, the mascot's face).
- **The scan sweep is the cut.** A new milestone never just appears: a cyan scanline sweeps down the glass on the downbeat, and the new state is behind it.
- **The picture and the score are one timeline.** 120 BPM, one bar = 2 s; every milestone lasts a whole number of bars and starts on a bar line.

Not Mascot Screencast (no product UI, no cursor, no window recording), not a pixel-art game (the booth and lab are hi-res and smooth; only the figure, organs, props and type are pixels), not a medical animation (no realistic anatomy: organs are simple pixel icons), not the purple glass-body reels (no limbless bottle-shaped figure on a stage, no purple/yellow: a full human body in a scanner).

## 2. Materials & rendering

- **Canvas 2D at 1080×1920.** Hi-res layer: anti-aliased vector shapes with soft gradients and real shadows (the booth's metal frame, glass, light strip, platform, side ticks).
- **Pixel grid is sacred.** Figure, organs, props (sparkles, particles, Zs, hearts) and all type share one square-pixel size per shot (default 12 px for the figure on a 30×62 grid, 4–13 px for type). Pixel positions snap to the grid; scaling is nearest-neighbour; no anti-aliasing on pixel layers.
- **Ordered dither (4×4 Bayer)** for every gradient and glow in the room: the back wall, the floor, the halo around the booth, the glow around an organ. Dither cells are 6 px. The booth's own metal is the only smooth gradient.
- **X-ray body**: Bit's silhouette is filled deep teal at ~90 % with a one-pixel cyan rim; organs inside are opaque pixel icons in fixed places: brain (head), windpipe and lungs, heart (in front of the lungs, the brightest red), liver and stomach (upper belly), and a muscle strip down each leg. Add another organ (kidneys, gut, skin, bones) only as a simple icon in its real place. Health changes fill each organ from the bottom up, grey to colour. A faint cyan grid sits on the glass behind it.
- **The lab**: dithered teal back wall with faint panel seams, a dithered floor with tile lines, the booth centred, its base on the floor line at about 78 % of the frame height.
- **Pre-render static layers** (wall, floor, booth) once to offscreen canvases; draw only what moves per frame.

## 3. Colour logic

| Role | Colour |
|---|---|
| Room, darkest → lightest | `#041417` `#0A2A30` `#0F3A41` |
| Scanner glow, rim, scanline | cyan `#39E0F0`, deep cyan `#0B8EA0` |
| Type | white `#F2FBFC` with a 1-cell `#03262C` drop shadow |
| Organs, healthy | lungs `#F4A196`, heart `#FF5A5F` / `#C23A46` (always the strongest red), brain `#FF9BB0`, liver `#E0675E`, stomach `#FFB0A3`, muscle `#F07F74` |
| Organs, harmed | grey `#6F8A8E` / `#4E6569` |
| **Healed / good news** | lime `#A6F04A`, used for nothing else |
| Warning / setback | amber `#FFB547`, used for nothing else |
| Booth metal | `#D5E7EA` → `#5D7C82` |

- The room is always teal-dark; light comes from the scanner.
- Lime appears only when something has improved; amber only for a setback. A viewer reads the beat's direction from the accent before reading the words.

## 4. Type & subtitles

- **One pixel font, drawn in code** (5×7 cells, uppercase, digits, `. , - ! ? ' % + / :`). No external font file.
- **Title bar** at the top (centre ~14 % of height): the milestone label in white on a deep-cyan bar (`#0B8EA0`) with a 1-cell cyan underline, 2–4 words, cell 12–14 px. One title per milestone; it swaps on the scan sweep.
- **Subline** under it, optional: one short fact (≤ 4 words) in a smaller bar, cell 6–7 px.
- **HUD labels** inside readout panels: 4–6 px cells.
- No captions or subtitles by default; titles carry the words. Every title stays at least 2 s (one bar) and passes readcheck.

## 5. Motion quality

- 30 fps. Pixel layers step on twos (15 fps) and snap to the grid; the camera, glows and scanline move smoothly every frame.
- **Figure idle**: a one-pixel breath on every beat, irregular blinks. The face carries the acting: `flat`, `tired`, `wide`, `happy`, `shut`.
- Organ changes happen behind the scanline, never as fades.
- Particles (toxins, plaque, sugar) are single pixels or 2×2 blocks drifting on a seeded path; they clear in bursts on beats.
- Readouts count and fill in steps on beats (one step per beat or half-beat).

## 6. Camera grammar

One continuous camera inside the lab. Cuts only as scan sweeps. A chart or diagram is never a cut away: the glass switches into monitor mode (§8).

| Move | What it expresses | Can serve |
|---|---|---|
| Slow push-in on the booth | time passing, we look closer | early milestones; a calm stretch |
| Punch-in to one organ on a downbeat | "this is the change" | lungs clearing; heart rate dropping |
| Pull back to the full lab | the whole picture | the summary; the final milestone |
| Hold, no move | let a number land | a readout; a striking fact |
| Small shake (2–4 px, 2 beats) | a setback hits | withdrawal; a craving spike |

Framing: the title bar and the mascot never overlap; readout panels sit beside the booth, never on the glass.

## 7. Sound palette

- **Pure chiptune at 120 BPM**, synthesized in numpy: pulse lead (12.5/25/50 % duty), triangle bass, noise-channel drums, an optional second pulse for arpeggios. No sampled instruments.
- **One loop, arranged by mood**: *groove* (full), *stripped* (held bass drone and one chord, no drums) for setbacks, *glitch* (vibrato, bit-crushed noise, detuned lead) for struggle, *triumph* (key up, fast arpeggios, crash) for the win.
- **Sweeps carry direction**: a falling pitch sweep into a setback, a rising sweep into progress; a short blip on every scan sweep; a coin-like arpeggio when a readout hits its target.
- **Silence**: one bar of drop-out before the final milestone.
- No voice by default; if a voice is added, duck the music and keep blips off word onsets. Master at −14 LUFS.

## 8. Native moves

The scan sweep is in every film; the others are a menu.

- **Scan sweep reveal (signature).** On the downbeat, a cyan scanline with a dithered trail runs down the glass in half a bar; above it, the new state; below it, the old one. The title swaps as it passes the head. *Fits content like:* every milestone change.
- **Monitor mode (charts on the glass).** The scan sweep turns the glass into a monitor: Bit drops to ~30 % behind it, and a pixel chart draws itself in steps on the beat (one step per half-beat): cyan axes and dotted grid, a 12 px stepped line with a white leading pixel, a dithered fill under it. The line is lime when the trend is good, amber when it's bad. The chart's label names what is measured (URGE, ENERGY, SLEEP); the title bar keeps the time ("WEEKS 2-8"), never the same word twice. The next sweep brings the body back. Kinds: a line over time, a bar meter, a before/after pair of bars, a one-number counter. *Fits content like:* cravings peaking then fading; energy building; resting heart rate dropping; sleep hours rising.
- **HUD readout.** A pixel panel beside the booth (heart rate, O₂, mood bar, a cravings graph) counting or filling on the beat. *Fits content like:* a number that changes; a feeling that rises or falls.
- **Zoom lens.** A round lens grows from one organ and explains the mechanism with tiny pixel diagrams inside it. *Fits content like:* receptors; insulin; blood vessels.
- **Particle clear-out.** Pixel particles inside the body burst out of the silhouette in batches on beats. *Fits content like:* nicotine leaving; sugar dropping; inflammation easing.
- **Status props.** Small pixel props next to Bit's head or body, on its grid: sleep Zs, sweat drops, a pixel X over a crossed-out habit (a cigarette, a soda, a phone), a "!" for a warning, lime sparkles on healed organs. One or two at a time. *Fits content like:* better sleep; withdrawal; quitting the habit; a recovered organ.
- **Level-up finale.** Full-lab pull-back, a lime "HEALTH RESTORED" style title, pixel confetti, mascot arms up. *Fits content like:* the final milestone; a call to action.

## 9. Pitfalls of the medium

- Anti-aliased or blurry pixels (sub-pixel positions, smooth scaling) → snap pixel layers to the grid, `imageSmoothingEnabled = false`.
- Lime or amber used decoratively → reserved for direction; nothing else uses them.
- A change that fades in instead of sweeping → every state change rides the scanline.
- Cuts drifting off the beat → milestones are whole bars from one timeline; the score is generated from it.
- Unverified health claims → every milestone fact goes in `FACTS.md` with a source; prefer ranges ("2–12 weeks").
- Titles too long for the bar → 2–4 words; move detail to the subline or a readout.
- A chart that cuts away to a flat infographic screen → charts live on the scanner glass, arriving with a sweep, with Bit faint behind.
- Realistic anatomy creeping in → organs stay simple pixel icons.
- The figure drifting back into a blob or mascot → always a full human silhouette with arms and legs; it is the viewer's body.
- Dither on the booth's metal makes it read as pixel art → only the room is dithered.

## 10. Engine

In `demo/`: `font.js` (5×7 pixel font: `drawText`), `pix.js` (Bayer dither fills, pixel-grid drawing), `bit.js` (the human figure "Bit": 30×62 body grid, faces, organ icons and their health states), `lab.js` (the room and the scanner booth, pre-rendered), `main.js` (page contract, timeline of milestones in bars, scan sweep, monitor-mode charts, title bar, readouts, camera). Techniques from `$LIB/styles/living-screencast/demo/` (pixel sprite grid) and `$LIB/styles/game-show/demo/` (score generated from the picture's timeline).

## 11. Variation space

You decide the habit, the milestones and their order, which organ or meter changes in each, the readouts, the ending and the music's melody.

- Structures: **stop a habit** (quit vaping, sugar, alcohol: harm reverses over time); **start a habit** (walking, sleep, water: gains build); **a single day** (hour by hour: caffeine, a fast); **a versus** (two scanners side by side, with and without the habit).
- Openings: **the before scan** (the body at its worst, amber warnings); **the decision** (the habit's prop shown and crossed out with a pixel X); **an empty booth** (Bit steps in, the scanner powers up).
- Endings: **level-up finale**; **Bit steps out** of the booth healthy, the scanner powers down; **the loop** (the last scan matches the first frame, for a seamless replay).
