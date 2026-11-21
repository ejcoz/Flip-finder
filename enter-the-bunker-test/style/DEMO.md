# Enter the Bunker — demo film

One example among many. Don't reuse its story, arc, shots, props or timings.

**Story.** A bunker cut into the earth has 100,000 empty beds; the blast door seals when it's full. The viewer's bed glows gold in a corridor; the counter promises lights (1,000), air (10,000) and the seal (100,000). Silence, power cut, red corridor: bed 666 was locked from the inside. Pick your spot in the comments; the camera pushes back into the grid, ending on its first frame (loop).

**Shots.** ECU grid → pull back · wide with light sweep · push to the door, counter springs in · dive into a cell → corridor → gold bed (YOU → @YOUR_NAME) · pull back · counter climbs (lights, air) · door rolls shut, pull out to the burning horizon · power cut · red dive → bed 0666, latch · pull back, comment card, zones (PANTRY, GENERATORS, 666), YOUR BED · push into the grid.

**Palette.** Sky #081130→#1B2A66, earth strata navy-violet, shell #DCE3EE/#9AA6BC, interior #1A2647, cells #27365F, amber #FFB52E, cyan #7FE3FF, gold #FFC23A, red #FF3B3B.

**Score.** 100 bpm grid; D drone; Dm/B♭ saw pad; a D2 pluck pulse that doubles at each milestone and stops on the slam; 0.9 s silence; low hit into a D–E♭–A cluster; pulse returns half-time, doubles at "Follow me", riser, hard stop on the loop.

**Build.** `sh demo/build.sh` (LIB at the top). `make_timeline.py` turns the Kokoro durations and Whisper word times into `timeline.json` (line starts are set by hand in `START`, caption phrase breaks in `DISP`). `index.html` draws everything in Canvas 2D: `drawCutaway` (bunker, earth, door, cells, zones, counter), `corridorScene`/`drawCorridor` (hand-projected 3D with near-plane clipping, painter's sort, affine-mapped panel textures), `bloom` (quarter-res blurred emissive layer added with `lighter`), `captions`, `commentCard`, and `window.EV` for the mixer. `mix.py` synthesises score and foley from `events.json` and mixes the voice.
