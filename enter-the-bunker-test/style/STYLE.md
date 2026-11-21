# Enter the Bunker — Style Prompt

Made from a blank page; techniques from Scale Zoom Explainer (flat-space-explainer) in Lemo-Opuscar.
Default size: 1080×1920, 30 fps.

> A vertical short built around one huge structure seen as a glowing cutaway, its inside packed with thousands of tiny cells. The narrator offers the viewer a cell ("comment to claim yours"), a counter promises what happens as it fills, and a dive into a 3D corridor of cells finds the viewer's own cell glowing gold, and then one cell glowing red that is already taken.
> References (grammar only): vertical "claim your spot" interactive shorts (a hook in the first line, a counter, a twist, a call to comment); technical cutaway posters (one section through a whole structure); corridor fly-throughs from sci-fi title cards. Copy none of their designs, voices, music or text.

## 1. Essence, and what it is not

- **One bunker, cut open.** A buried cylindrical concrete silo seen in a front cutaway: stacked levels (B1–B7), each a concrete floor ringed with rows of bunks on the curved back wall, a stair/lift core down the middle, vent stacks and a hatch shaft rising to a ruined surface, a round blast door with a radiation trefoil at the end of a tunnel.
- **The viewer is a bed.** Every film offers one bed to "you": gold, with a faceless silhouette and the word YOU, then a handle tag (`@YOUR_NAME`).
- **A counter is the promise.** A dark plate with a small-caps tag and a big hazard-yellow number (`0 / 100,000`); milestones roll it up and change the bunker (lights, air, the door seals).
- **One floor shouldn't exist.** The twist is always a hidden level revealed under red emergency light, with one red bed on it that is already taken (bed 000 on B8). Reached by the same corridor, turned red.
- **Into the bunk.** The camera dives from the cutaway into one bed and comes out in a 3D corridor of beds, and pulls back the same way.

Not a sci-fi ship (no rocket fins, engines, starfields or glowing hull outlines), not Sci-fi Hologram HUD (solid concrete, not wireframe), not a 3D product render (the cutaway is drawn flat; only the corridor has depth).

## 2. Materials & rendering

- **Canvas 2D, rebuilt every frame** from a pure function of time; seeded randomness only.
- **Cutaway**: a cylinder seen slightly from above, front half removed. Painter's order per level: back wall (dark, shaded darker toward the sides for curvature), floor disc, bunks on the back arc (rows of small rounded beds with a recess, pillow, blanket and light strip, foreshortened by cos of their angle), the central core, then the front lip of the floor above drawn over them. Cut wall faces left and right in concrete with a hazard-yellow dashed edge. Footing slab with hazard stripes; vent stacks and hatch shaft to the surface.
- **Glow is soft and only from lights**: a blurred copy (canvas `filter: blur`) of lit bunks, beacons, the scanner, the garden and red beds, added on top (`lighter`). Concrete never glows.
- **Atmosphere**: falling ash in screen space (deterministic), a warm smog vignette, concrete stains and formwork lines, a ruined skyline on the surface.
- **Ground**: a rust smog sky with blurred blotches and ash specks; olive-brown strata with flat rocks underground. Never a flat colour.
- **Corridor**: a hand-projected 3D tunnel (perspective, yaw, near-plane clipping) of thick grey cell frames on both walls, ceiling light panels, a dashed floor line in the accent, numbers on the frames, fog to black. Every cell frame is a real quad, so parallax is physical.
- **One camera function** for the cutaway: screen = (p − C)·z, rotated by r, plus the frame centre. Labels, the counter and highlights go through it.

## 3. Colour logic

- **Fallout world:** rust smog sky (#140E0A → #5A3417) over black ruins, olive-brown earth strata (#2C2A1C → #0E0E09), falling ash everywhere, a mushroom cloud only when the world ends.
- **Concrete** (#A9A48C / shade #6C6855) with stains and formwork lines; interiors near-black olive (#1C2016), bunks #2E3625 with a toxic-green light strip (#9CF04A).
- **Hazard yellow** (#F2C230) is the bunker's own mark: dashed edges, stripes on the footing, the trefoil, level labels, every number.
- **Only lights glow:** lit bunks (warm #FFD27A), beacons, the scanner and the garden (toxic green). The structure itself never glows.
- **Gold** (#FFC23A) means *you*. **Red** (#FF3B3B) means *the forbidden*: bed 000, B8, the red corridor. Never both in one bed.

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

- **Into the bunk.** Dive into one bed; the corridor grows from it. *Fits:* showing who lives inside; finding one seat in a stadium.
- **The counter climbs.** The plate rolls through milestones while the structure changes with each one. *Fits:* launches, doors, unlocks, goals.
- **The floor that doesn't exist.** The power cuts, red light comes on, the camera tilts below the lowest level and a hidden floor flickers in; the floor is empty except for one red bed, and a bare corridor dead-ends at its single latched door, which knocks back. *Fits:* any twist where one place is already taken.
- **Pick your spot.** Rooms light up with tags as a comment card names them (two attractive ones, then the forbidden one: e.g. the garden, the armory, or the B7 bed right above bed 000: the closest anyone is allowed). *Fits:* the call to comment.

## 9. Pitfalls

- Captions are big: keep the structure's important parts below y ≈ 330.
- The cell grid at small scale shimmers; draw it on a cached layer and scale it, never redraw sub-pixel lines per frame.
- Blur is expensive: blur a downscaled glow layer, not the full frame.
- Red and gold in the same frame confuse the meaning: keep the twist red apart from the viewer's gold.
- Near-plane clipping: a corridor quad crossing the camera must be clipped, or it flips across the frame.

## 10. Engine

- `demo/index.html`: everything: the silo (`drawCyl`, cells via `cylCellRect`), the hidden floor (`drawB8`), background (`buildBG`), door (`drawDoor`), corridor (`corridorScene`/`drawCorridor` with `proj`, `clipNear`, `texTri`), counter (`counterAt`), captions (`captions`), atmosphere (`atmosphere`), camera (`camAt`), events (`window.EV`). `?shape=box` draws the older box cutaway.
- `demo/timeline.json`: built by `demo/make_timeline.py` from the voice durations and word timings.
- Technique base: `$LIB/styles/flat-space-explainer/STYLE.md`.

## 11. Variation space

The structure (bunker, ark, ship, tower, stadium), the world around it, the number of cells, the milestones and what each one changes, the twist cell's number and what's wrong with it, the zones offered in the call to comment, and the narrator's voice.
