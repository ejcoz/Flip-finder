# Enter the Bunker — Style Prompt

Made from a blank page; techniques from Scale Zoom Explainer (flat-space-explainer) in Lemo-Opuscar.
Default size: 1080×1920, 30 fps.

> A vertical short built around one huge structure seen as a glowing cutaway, its inside packed with thousands of tiny cells. The narrator offers the viewer a bed ("follow to claim yours"; comment to pick your spot), a counter promises what happens as it fills, and a dive into a 3D corridor of cells finds the viewer's own cell glowing gold, and then one cell glowing red that is already taken.
> References (grammar only): vertical "claim your spot" interactive shorts (a hook in the first line, a counter, a twist, a call to comment); technical cutaway posters (one section through a whole structure); corridor fly-throughs from sci-fi title cards. Copy none of their designs, voices, music or text.

## 1. Essence, and what it is not

- **One bunker, cut open.** A buried cylindrical concrete silo seen in a front cutaway: stacked levels (B1–B7), each a concrete floor ringed with rows of bunks on the curved back wall, a stair/lift core down the middle, vent stacks and a hatch shaft rising to a ruined surface, a round blast door with a radiation trefoil at the end of a tunnel.
- **The viewer is a bed.** Every film offers one bed to "you": gold, with a faceless silhouette and the word YOU, then the account's handle tag (`@jointhebunker`) under it.
- **A counter is the promise.** A dark plate with a small-caps tag and a big hazard-yellow number (`0 / 100,000`); milestones roll it up and change the bunker (lights, air, the door seals).
- **One floor shouldn't exist.** The twist is always a hidden level revealed under red emergency light, with one red bed on it that is already taken (bed 0 on B8). Reached by the same corridor, turned red.
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
- **Gold** (#FFC23A) means *you*. **Red** (#FF3B3B) means *the forbidden*: bed 0, B8, the red corridor. Never both in one bed.

## 4. Type & subtitles

- **Captions are the subtitles**: Fredoka 700, **78 px**, white with a **12 px black outline** and a soft shadow, centred near the top (**first line at y ≈ 330**, below the apps' top tabs), max two lines. Words appear one by one as they are spoken; the newest word fades from grey to white. Each caption is a short chunk (≤ 5 words) that clears when its line ends. **No punctuation commas** (keep them inside numbers: 100,000). Teaser words in red (e.g. "…almost.").
- **Title card**: Anton, the hook number in amber (~210 px) over a white line (~100 px), heavy black outline, slammed in over the first 0–3 s ("100,000 / EMPTY BEDS").
- **Tags**: Fredoka 600, **at least 40 px on screen at the shot's final size** (judge them at phone size, not in the source), small caps, on a dark rounded plate with a 2–3 px border. Short words: GARDEN, ARMORY, BED 0. If a tag can't be that big, say it in the caption instead.
- **Counter**: a dark rounded plate (border amber at 35 %), a 16 px small-caps tag above, a 44 px amber number with a soft glow. Numbers roll through values, never jump.
- **Comment card**: a white rounded card, an avatar dot, a grey user line and a bold black comment. Fictional handles only (e.g. `survivor_77`). Placed high (y ≈ 540), never in the bottom third.
- **Bed numbers**: plain numbers 1–100,000, levels as number ranges (see the film's `LORE.md`); door plates show them with a thousands comma (48,143). The forbidden bed is **Bed 0** in voice, captions and on its door alike.

## 5. Motion

- Constant slow life: the structure breathes (scale ±1 %), tilts a few degrees between shots, lights blink in a slow sequence.
- Moves ease in and out; hits (YOU, the counter landing, the latch) spring with one small overshoot.
- One cut per narrated line at most; most changes happen inside the shot (a tilt, a push, a light change).
- **Pacing for short-form**: target **≤ 50 s**. Gaps between lines ~0.06–0.2 s; real silences only at the power cut (~0.8 s) and after the knocks. A recorded narrator may be played up to ~7 % faster (pitch kept) to tighten it.
- **Hooks**: something must promise the twist **by ~8 s** (a red pulse under the bunker at ~2 s, a power flicker with B8 flashing and a red "…almost." on the first beat that says "empty"), and the mystery must reappear once in the middle (a B8 flicker as the door seals).

## 6. Camera grammar

- **Wide**: the bunker fills **at least 70–75 % of the frame width** (crop the surface strip rather than shrink the bunker); slightly tilted. The hidden level, when it is in play, stays in frame above the bottom safe zone.
- **Contrast**: the bunker must separate from the ground at a glance on a dim phone: a bright rim of light on the concrete edges (light, not a glow), lit bunks bright enough to read as lights, and the background kept darker than the structure.
- **Dive**: a log-space zoom into one cell until it fills the frame; the corridor grows from that cell.
- **Corridor push**: a fast dolly down the corridor that eases into a yaw toward one cell.
- **Pull-out**: the reverse of the dive, or a wide pull back to show the world around the structure.
- **Room swoops**: when the call to comment names a room, the camera swoops into that level (~1.5 s each), detailed props on the floor ring (planters, racks, crates), then pulls back for the dare.
- **Final push**: first toward the threat as the last line names it (the red glow swells and grows in frame), then back into the grid, ending on the frame the film opened on (the short loops).

## 7. Sound palette

- A low drone bed (sub sine + filtered noise), a dark synth pad on two chords, a soft pulse that speeds up as the counter climbs.
- Foley: whoosh on dives, tick-roll on counters, a bright chime on YOU, a heavy metal thump and rumble on doors and latches, hum on lights, air hiss.
- One real silence right before the twist; the first sound after it is a low hit.

## 8. Native moves

- **Into the bunk.** Dive into one bed; the corridor grows from it. *Fits:* showing who lives inside; finding one seat in a stadium.
- **The counter climbs.** The plate rolls through milestones while the structure changes with each one. *Fits:* launches, doors, unlocks, goals.
- **The floor that doesn't exist.** The power cuts, red light comes on, the camera tilts below the lowest level and a hidden floor flickers in; the floor is empty except for one red bed, and a bare corridor dead-ends at its single latched door, which knocks back. *Fits:* any twist where one place is already taken.
- **Pick your spot.** Rooms light up with tags as a comment card names them (two attractive ones, then the forbidden one: e.g. the garden, the armory, or the B7 bed right above bed 0: the closest anyone is allowed). *Fits:* the call to comment.

## 9. Pitfalls

- **App safe zones**: keep text and key action out of the top ~300 px (app tabs), the right ~140 px (like/comment buttons) and the bottom ~380 px (caption/username block). Cover art must work in the TikTok 3:4 and Instagram 4:5 centre crops.
- Captions are big: keep the structure's important parts below y ≈ 430.
- **Small subjects lose**: the reference format works because one bright subject fills the frame. If the bunker shrinks to show context, the shot loses impact; push in instead.
- **Every number must make sense** against the premise (bed numbers vs 100,000 capacity, levels vs ranges) and match between voice, captions and doors; viewers comment on inconsistencies.
- **The lore must explain what the narrator knows** (e.g. they went down once and welded the hatch shut), or the twist reads as a plot hole.
- The cell grid at small scale shimmers; draw it on a cached layer and scale it, never redraw sub-pixel lines per frame.
- Blur is expensive: blur a downscaled glow layer, not the full frame.
- Red and gold in the same frame confuse the meaning: keep the twist red apart from the viewer's gold.
- Near-plane clipping: a corridor quad crossing the camera must be clipped, or it flips across the frame.

## 10. Engine

- `demo/index.html`: everything: the silo (`drawCyl`, cells via `cylCellRect`), the hidden floor (`drawB8`), background (`buildBG`), door (`drawDoor`), corridor (`corridorScene`/`drawCorridor` with `proj`, `clipNear`, `texTri`), counter (`counterAt`), captions (`captions`), atmosphere (`atmosphere`), camera (`camAt`), events (`window.EV`). `?shape=box` draws the older box cutaway.
- `demo/timeline.json`: built by `demo/make_timeline.py` from the voice durations and word timings.
- Technique base: `$LIB/styles/flat-space-explainer/STYLE.md`.

## 11. Variation space

The episode's milestone and new clue (one of each per episode), the structure (bunker, ark, ship, tower, stadium), the world around it, the number of cells, the milestones and what each one changes, the twist cell's number and what's wrong with it, the zones offered in the call to comment, and the narrator's voice.

## Episode checklist (from ep. 1)

1. Hook card in the first second; the twist promised by ~8 s; mystery recurs mid-video.
2. ≤ 50 s; one milestone beat and one new clue per episode.
3. Bunker ≥ 70 % of frame width; rim light; tags ≥ 40 px on screen.
4. Captions 78 px, outlined, no punctuation commas, below the top tabs; nothing in the app safe zones.
5. Numbers consistent everywhere (voice = captions = doors); the narrator's knowledge explained by the lore.
6. Call to comment: two attractive rooms + one dare, each shown in a close-up; end on the threat, then loop.
7. **Roll call (every episode):** 4–6 real commenters on screen: their comment on a card, their handle on a door plate (with the bed number if they named one). Rotate who's featured; skip handles with profanity.
8. Deliverables: video, cover (3:4 / 4:5 safe), caption, pinned comment, and the handle list for the next episode's Founders Wall.
