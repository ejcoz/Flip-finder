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
- **Pixel grid is sacred.** Figure, organs, props (sparkles, particles, Zs, hearts) and all type share one square-pixel size per shot (default 15 px for the figure on a 30×62 grid, so the body fills about half the frame height and every organ reads on a phone, while the head stays clear of the title block; 3–14 px for type). Pixel positions snap to the grid; scaling is nearest-neighbour; no anti-aliasing on pixel layers.
- **Ordered dither (4×4 Bayer)** for every gradient and glow in the room: the back wall, the floor, the halo around the booth, the glow around an organ. Dither cells are 6 px. The booth's own metal is the only smooth gradient.
- **X-ray body**: Bit's silhouette is filled deep teal at ~90 % with a one-pixel rim in deep cyan `#1597A8` that brightens to `#39E0F0` on each beat (a dim outline, so the body never out-shines the heart and the title); organs inside are opaque pixel icons in fixed places: brain (head), windpipe and lungs, heart (in front of the lungs: the big 9×8 heart, the brightest red in the frame and never below ~85 % health even in a "before" state; it is the frame's focal point), liver and stomach (upper belly), and a muscle strip down each leg. Add another organ (kidneys, gut, skin, bones) only as a simple icon in its real place. Health changes fill each organ from the bottom up, grey to colour. A faint cyan grid sits on the glass behind it.
- **The lab**: dithered teal back wall with faint panel seams, a dithered floor with tile lines, the booth centred and tall (glass y 590–1560, about half the frame), its base on the floor line at about 86 % of the frame height. Only the booth's base and Bit's feet reach the bottom platform-UI band, where nothing needs reading.
- **Spotlight and vignette**: a dithered light cone falls from the ceiling onto the booth and pools on the floor; the frame edges dither down to near-black. Together with a gunmetal booth (`#8FA4A8` → `#25363A`) this concentrates the light, so on frame 1 only the hook and the heart are bright (aim for ~4 % of the frame or less above 70 % luminance).
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
| Booth metal | gunmetal `#8FA4A8` → `#4C6166` → `#25363A` |
| **Hook key line** | heart red `#FF5A5F` text and underline on a dark bar: the one warm accent against the teal world |

- The room is always teal-dark; light comes from the scanner.
- Lime appears only when something has improved; amber only for a setback. A viewer reads the beat's direction from the accent before reading the words.

## 4. Type & subtitles

- **One pixel font, drawn in code** (5×7 cells, uppercase, digits, `. , - ! ? ' % + / : ~ @`). No external font file. Text that must be read (hook, title, caption, callout) is drawn **bold**: each cell ~45 % wider and ~25 % taller, so strokes stay solid at phone size.
- **Safe area (Reels, Shorts, TikTok).** Everything that must be read (hook, titles, captions, callouts, lens, readout, chart labels) stays inside x 60–920, y 250–1480 of the 1080×1920 frame: clear of the top header, the right-hand like/comment/share buttons and the bottom caption/username band. Centred text keeps its right edge inside x 920, so it is at most 760 px wide; the engine shrinks the cell size to fit. Callouts, the lens and the readout live on the **left** edge, which no app covers.
- **Title bar** at the top of the safe area (y 250): the milestone label in **dark navy bold pixel text on a bright cyan bar** (`#39E0F0`), with a 1-cell underline in the direction colour; the finale's bar is lime. 2–4 words, cell up to 13 px. The title bar is the brightest block on screen. One title per milestone; it swaps on the scan sweep.
- **Text budget: title + caption, nothing more.** A beat shows its title and its caption (plus at most one callout or lens label). The subline is used only when a beat has no caption. Scrollers read about one line a second.
- **Subline**, only without a caption: one short fact (≤ 4 words) in a smaller bar, cell 6 px.
- **HUD labels** inside readout panels: 4–6 px cells.
- **Hook** (the first 2 bars, before any milestone title): the film's promise as a stacked title. **Lines 1–2 are on screen from the very first frame** (the scroll decision happens in under a second): a white line on a dark bar, then the key line larger on the deep-cyan bar with its underline. Line 2, the key word, is heart red on a dark bar (`#FF5A5F`, underline in the same red). Line 3, a small cyan bar ("HERE'S WHAT HAPPENS"), lands on beat 2; the habit's prop gets crossed out on beat 3. At most ~12 characters per big line; split the sentence rather than shrink it.
- **Captions**: every milestone after the hook has a one- or two-line caption in a box **directly under the title**: **dark bold pixel text on a near-white card** (`#F2FBFC`), 7 px border in the beat's direction colour (lime / amber / cyan), cell 6, at most ~18 characters per line. Never on the floor: the bottom of the frame belongs to the platform's UI. It explains *why* the change happens in plain words; the title says *when*, the caption says *what and why*. It pops in with the title, never typed on.
- **Callout labels**: when one organ is the subject, a box at the left edge with a leader line to that organ says **what is happening to it**, never just its name (the line already names it): the organ's name tiny on top (cell 3, dim cyan), then two short lines of change (cell 4, ≤ 11 characters each) in the direction colour, e.g. HEART · "PUMPS MORE / PER BEAT", LEG MUSCLES · "MICRO-TEARS / REBUILDING". The callout gives the organ-level *how*; the caption gives the outcome; they never repeat each other. One callout at a time, never covering the body.
- **Two layers**: the hook, titles, captions, callouts and readouts sit on a text layer the camera never moves; only the world (lab, booth, body) zooms and shakes. Callout lines follow the organ's on-screen position.
- Every hook line, title and caption passes readcheck.
- **Watermark**: the account handle `@8bitbodyscan` in the pixel font (cell 4, `#A8D8E0`, ~70 % opacity, dark drop shadow), centred on the booth's base plate (y ≈ 1590), on the text layer so camera moves, sweeps and the loop never shift it. It is for downloads and reposts; the apps already show the username. No ™ or ® (® only once a mark is registered).

## 5. Motion quality

- 30 fps. Pixel layers step on twos (15 fps) and snap to the grid; the camera, glows and scanline move smoothly every frame.
- **Figure idle**: the cyan rim brightens for a moment on every beat (it breathes with the music; still during a drop-out bar). The face carries the acting: `flat`, `tired`, `wide`, `happy`, `shut`.
- Organ changes happen behind the scanline, never as fades.
- Particles (toxins, plaque, sugar) are bright single cells with a dim 3×3 amber glow, drifting on a seeded path; on frame 1 there are plenty of them (the problem should be loud); they clear in bursts on beats.
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

Framing: the title block and the figure never overlap; the readout panel sits bottom-left beside the booth (y ≤ 1480), never on the glass. The camera moves the world only; text never leaves the safe area.

## 7. Sound palette

- **Pure chiptune at 120 BPM**, synthesized in numpy: pulse lead (12.5/25/50 % duty), triangle bass, noise-channel drums, an optional second pulse for arpeggios. No sampled instruments.
- **One loop, arranged by mood**: *groove* (full), *stripped* (held bass drone and one chord, no drums) for setbacks, *glitch* (vibrato, bit-crushed noise, detuned lead) for struggle, *triumph* (key up, fast arpeggios, crash) for the win.
- **Text has sound**: a short rising blip as each hook line lands; a soft two-note chirp when a caption pops in.
- **Sweeps carry direction**: a falling pitch sweep into a setback, a rising sweep into progress; a short blip on every scan sweep; a coin-like arpeggio when a readout hits its target.
- **Silence**: one bar of drop-out before the final milestone.
- **The loop**: the last bar turns back (a groove bar on the chord that leads into bar 1), with no ring-out and no fade, so the track loops cleanly with the picture.
- No voice by default; if a voice is added, duck the music and keep blips off word onsets. Master at −14 LUFS.

## 8. Native moves

The scan sweep is in every film; the others are a menu.

- **Scan sweep reveal (signature).** On the downbeat, a cyan scanline with a dithered trail runs down the glass in half a bar; above it, the new state; below it, the old one. The title swaps as it passes the head. *Fits content like:* every milestone change.
- **Monitor mode (charts on the glass).** The scan sweep turns the glass into a monitor: Bit drops to ~30 % behind it, and a pixel chart draws itself in steps on the beat (one step per half-beat): cyan axes and dotted grid, a 12 px stepped line with a white leading pixel, a dithered fill under it. The line is lime when the trend is good, amber when it's bad. The chart's label names what is measured (URGE, ENERGY, SLEEP); the title bar keeps the time ("WEEKS 2-8"), never the same word twice. The next sweep brings the body back. Kinds: a line over time, a bar meter, a before/after pair of bars, a one-number counter. *Fits content like:* cravings peaking then fading; energy building; resting heart rate dropping; sleep hours rising.
- **HUD readout.** A pixel panel beside the booth (heart rate, O₂, mood bar, a cravings graph) counting or filling on the beat. *Fits content like:* a number that changes; a feeling that rises or falls.
- **Zoom lens.** A round lens (r ≈ 168, at the left edge) grows from one organ on the text layer and explains the mechanism with pixel icons inside it; the count or state of the icons is the story ("TOO MANY" → "NORMAL"), so it works best used twice as a before/after rhyme. *Fits content like:* receptors; insulin; blood vessels.
- **Particle clear-out.** Pixel particles inside the body burst out of the silhouette in batches on beats. *Fits content like:* nicotine leaving; sugar dropping; inflammation easing.
- **Status props.** Small pixel props next to Bit's head or body, on its grid: sleep Zs, sweat drops, a pixel X over a crossed-out habit (a cigarette, a soda, a phone), a vapor puff drifting from the mouth, a "!" for a warning, lime sparkles on healed organs. One or two at a time. *Fits content like:* better sleep; withdrawal; quitting the habit; a recovered organ.
- **Level-up finale.** Full-lab pull-back, a lime title, pixel confetti and a share/save call to action in the caption. *Fits content like:* the final milestone.
- **Loop rewind (every film's last bar).** The scanline runs back *up* the glass, restoring the opening body, readout, prop and hook lines 1–2, so the last frame matches frame 1 and the film replays seamlessly (rewatches count on every platform).

## 9. Pitfalls of the medium

- Anti-aliased or blurry pixels (sub-pixel positions, smooth scaling) → snap pixel layers to the grid, `imageSmoothingEnabled = false`.
- Lime or amber used decoratively → reserved for direction; nothing else uses them.
- A change that fades in instead of sweeping → every state change rides the scanline.
- Cuts drifting off the beat → milestones are whole bars from one timeline; the score is generated from it.
- Unverified health claims → every milestone fact goes in `FACTS.md` with a source; prefer ranges ("2–12 weeks").
- Titles too long for the bar → 2–4 words; move detail to the subline, the caption or a readout.
- A body too small to read on a phone → keep the figure at 16 px cells (about half the frame height); punch in for detail rather than shrinking anything.
- Captions that state health facts without a source → every caption claim goes in `FACTS.md` with its source before the film is posted.
- A chart that cuts away to a flat infographic screen → charts live on the scanner glass, arriving with a sweep, with Bit faint behind.
- Realistic anatomy creeping in → organs stay simple pixel icons.
- The figure drifting back into a blob or mascot → always a full human silhouette with arms and legs; it is the viewer's body.
- Dither on the booth's metal makes it read as pixel art → only the room is dithered.
- Text that doesn't grab the eye (light text on dark teal, thin one-cell strokes) → inverted, high-contrast text: dark bold type on the bright cyan title bar and the near-white caption card.
- Text under the platform UI (top header, right-hand buttons, bottom caption band) → keep to the safe area (§4); check with a UI-zone overlay before delivery.
- A first frame without the promise → hook lines 1–2 are on frame 1.
- A first frame with no focal point (many bright things of one colour) → only the red hook word and the heart are bright; booth gunmetal, outline dim, spotlight + vignette; show the habit loudly (its prop, a vapor puff or particles).
- Too much to read per beat → title + caption only; drop the subline.
- An ending that fades out → loop rewind, so the film replays cleanly.

## 10. Engine

In [`demo/`](demo/) (how it was made: [DEMO.md](DEMO.md)): `font.js` (5×7 pixel font: `drawText`), `pix.js` (Bayer dither fills, pixel-grid drawing), `bit.js` (the human figure "Bit": 30×62 body grid, faces, organ icons and their health states), `lab.js` (the room and the scanner booth, pre-rendered), `engine.js` (the shared Pixel Scan engine: page contract, timeline in bars, scan sweep and loop rewind, monitor-mode charts, hook, title, caption, callout, lens, readout, props, camera, safe area, `EV` and `TEXTS`), `main.js` (the film as data: beats, readout, callouts). A new film copies `demo/` and rewrites only `main.js` and `music.py`'s cues. Techniques from `$LIB/styles/living-screencast/demo/` (pixel sprite grid) and `$LIB/styles/game-show/demo/` (score generated from the picture's timeline).

## 11. Variation space

You decide the habit, the milestones and their order, which organ or meter changes in each, the readouts, the ending and the music's melody.

- Structures: **stop a habit** (quit vaping, sugar, alcohol: harm reverses over time); **start a habit** (walking, sleep, water: gains build); **a single day** (hour by hour: caffeine, a fast); **a versus** (two scanners side by side, with and without the habit).
- Openings: **the before scan** (the body at its worst, amber warnings); **the decision** (the habit's prop shown and crossed out with a pixel X); **an empty booth** (Bit steps in, the scanner powers up).
- Endings: **level-up finale** or **Bit steps out** of the booth healthy, always closed by the loop rewind.
