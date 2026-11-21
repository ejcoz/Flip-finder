# Enter the Bunker — Style Prompt

Made from a blank page; techniques from Scale Zoom Explainer (flat-space-explainer) in Lemo-Opuscar.
Default size: 1080×1920, 30 fps.

> A vertical short built around one huge structure seen as a glowing cutaway, its inside packed with thousands of tiny cells. The narrator offers the viewer a cell ("comment to claim yours"), a counter promises what happens as it fills, and a dive into a 3D corridor of cells finds the viewer's own cell glowing gold, and then one cell glowing red that is already taken.
> References (grammar only): vertical "claim your spot" interactive shorts (a hook in the first line, a counter, a twist, a call to comment); technical cutaway posters (one section through a whole structure); corridor fly-throughs from sci-fi title cards. Copy none of their designs, voices, music or text.

## 1. Essence, and what it is not

- **One structure, cut open.** A bunker, ship, tower, ark or vault drawn as a single flat silhouette: a silver shell with one shade step, an amber dashed inner outline, a soft cyan rim glow, small glowing lights at its corners, and inside, a dark navy field gridded into thousands of tiny cells.
- **The viewer is a cell.** Every film offers one cell to "you": gold, with a faceless silhouette and the word YOU, then a handle tag (`@YOUR_NAME`).
- **A counter is the promise.** A dark plate with a small-caps tag and a big amber number (`0 / 100,000`) sits on the structure; milestones roll it up and change the structure (lights, air, engines, a door).
- **One cell is wrong.** The twist is always a single cell in red, already taken, reached by the same corridor turned red.
- **Into the hull.** The camera dives from the cutaway into one cell and comes out in a 3D corridor of cells, and pulls back the same way.

Not Scale Zoom Explainer (no guide character, no scale ribbon, no hard-ring glows), not Sci-fi Hologram HUD (the structure is solid and filled, not a wireframe), not a 3D product render (the cutaway is flat; only the corridor has depth).

## 2. Materials & rendering

- **Canvas 2D, rebuilt every frame** from a pure function of time; seeded randomness only.
- **Cutaway**: flat fills, one shade step on the shell (a lighter face upper left, a darker band lower right). The cell grid is drawn as rows of tiny rounded rectangles one step lighter than the navy interior, with floor slabs every few rows and a vertical spine.
- **Glow is soft**: a blurred copy (canvas `filter: blur`) of the rim, lights, cells and counter, added on top (`lighter`). Glow belongs to light sources only.
- **Ground**: a soft gradient with blurred cloudy blotches and fixed star dots (sky), or soft strata (earth). Never a flat colour.
- **Corridor**: a hand-projected 3D tunnel (perspective, yaw, near-plane clipping) of thick grey cell frames on both walls, ceiling light panels, a dashed floor line in the accent, numbers on the frames, fog to black. Every cell frame is a real quad, so parallax is physical.
- **One camera function** for the cutaway: screen = (p − C)·z, rotated by r, plus the frame centre. Labels, the counter and highlights go through it.

## 3. Colour logic

- Ground deep blue (#0E1838 → #1D2C66 in the sky; navy-violet strata underground).
- Shell silver-cream (#DCE3EE / shade #9AA6BC), interior navy (#1A2647) with cells #26345C.
- **Amber** (#FFB52E) is the structure's own line and every number: the dashed outline, the counter.
- **Cyan** (#7FE3FF) is rim light, air and neutral labels.
- **Gold** (#FFC23A → #FF8A00) means *you*. **Red** (#FF3B3B) means *the wrong cell*. Never both in one cell, and red appears only after the twist.
- No pure white text except captions; no pure black except the corridor's far fog.

## 4. Type & subtitles

- **Captions are the subtitles**: Fredoka 700, 58 px, white with a soft dark shadow, centred at the top (y ≈ 150), max two lines. Words appear one by one as they are spoken; the newest word fades from mist grey to white. Each caption is a short chunk (≤ 5 words) that clears when its line ends.
- **Tags**: Fredoka 600, 18–22 px, small caps, letter-spaced, in cyan or amber on a dark rounded plate with a 2 px border.
- **Counter**: a dark rounded plate (border amber at 35 %), a 16 px small-caps tag above, a 44 px amber number with a soft glow. Numbers roll through values, never jump.
- **Comment card**: a white rounded card, an avatar dot, a grey user line and a bold black comment. Fictional handles only.

## 5. Motion

- Constant slow life: the structure breathes (scale ±1 %), tilts a few degrees between shots, lights blink in a slow sequence.
- Moves ease in and out; hits (YOU, the counter landing, the latch) spring with one small overshoot.
- One cut per narrated line at most; most changes happen inside the shot (a tilt, a push, a light change).

## 6. Camera grammar

- **Wide**: the whole structure fills ~70 % of the frame height, slightly tilted.
- **Dive**: a log-space zoom into one cell until it fills the frame; the corridor grows from that cell.
- **Corridor push**: a fast dolly down the corridor that eases into a yaw toward one cell.
- **Pull-out**: the reverse of the dive, or a wide pull back to show the world around the structure.
- **Final push**: back into the grid, ending on the frame the film opened on (the short loops).

## 7. Sound palette

- A low drone bed (sub sine + filtered noise), a dark synth pad on two chords, a soft pulse that speeds up as the counter climbs.
- Foley: whoosh on dives, tick-roll on counters, a bright chime on YOU, a heavy metal thump and rumble on doors and latches, hum on lights, air hiss.
- One real silence right before the twist; the first sound after it is a low hit.

## 8. Native moves

- **Into the hull.** Dive into one cell; the corridor grows from it. *Fits:* showing who lives inside; finding one seat in a stadium.
- **The counter climbs.** The plate rolls through milestones while the structure changes with each one. *Fits:* launches, doors, unlocks, goals.
- **The red cell.** The corridor turns red; one cell glows red, numbered, and something inside locks it. *Fits:* any twist where one place is already taken.
- **Pick your spot.** Zones of the structure light up with tags as a comment card names them. *Fits:* the call to comment.

## 9. Pitfalls

- Captions are big: keep the structure's important parts below y ≈ 330.
- The cell grid at small scale shimmers; draw it on a cached layer and scale it, never redraw sub-pixel lines per frame.
- Blur is expensive: blur a downscaled glow layer, not the full frame.
- Red and gold in the same frame confuse the meaning: keep the twist red apart from the viewer's gold.
- Near-plane clipping: a corridor quad crossing the camera must be clipped, or it flips across the frame.

## 10. Engine

- `demo/index.html`: everything: cutaway (`drawBunker`), ground (`drawEarth`, `drawSky`), corridor (`drawCorridor` with `proj`, `clipNear`), counter (`counterPlate`), captions (`captions`), camera (`camAt`), events (`window.EV`).
- `demo/timeline.json`: built by `demo/make_timeline.py` from the voice durations and word timings.
- Technique base: `$LIB/styles/flat-space-explainer/STYLE.md`.

## 11. Variation space

The structure (bunker, ark, ship, tower, stadium), the world around it, the number of cells, the milestones and what each one changes, the twist cell's number and what's wrong with it, the zones offered in the call to comment, and the narrator's voice.
