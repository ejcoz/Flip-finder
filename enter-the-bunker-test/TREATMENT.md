# Enter the Bunker — Treatment

Style: **Enter the Bunker** (own style, draft in `style/`). 1080×1920, 30 fps, ~47 s. English narrator (Kokoro `am_michael`), burned-in captions appearing word by word.

## 1. Three structures

1. **The offer and the catch** (chosen): hook on the bunker's capacity → you get a bed → the counter's promises → silence → the bed that's already taken → pick your spot → loop back into the grid. It keeps the claim-a-spot format the user asked for, and puts the twist where it lands as a turn rather than a punchline.
2. **Countdown from the surface**: open on the end of the world above, run for the hatch, the counter drops as beds fill. Stronger action, but no room to make "you" personal before the twist.
3. **Tour by bed number**: the corridor push carries the whole film, stopping at bed 1, your bed, then 666. One idea, but it loses the cutaway, which is the style's signature.

I chose 1 because it uses all four signature moves in order and its loop ending suits vertical shorts.

## 2. Logline and arc

A bunker for 100,000 sits empty, and the bed with your name is waiting. But one bed was locked from the inside before anyone arrived.
Setup (empty bunker, the offer) → promise (milestones: lights, air, the door seals) → turn (silence, red corridor, bed 666) → ending (pick your spot, push back into the grid: loop).

## 3. Benchmark

- *Learn from*: vertical "claim your spot" shorts (a hook within 2 s, captions that land on every word, a twist in the second half, a call to comment); technical cutaway posters (one clean section, labelled zones).
- *Don't take*: the reference's ship, planet or any of its text and voice; no brand marks.

## 4. Shot list

| # | t (s) | Framing / move | Why |
|---|---|---|---|
| 1 | 0.0–3.5 | ECU on the bed grid → fast pull back (log zoom) to the wide cutaway in the earth | the hook is the scale |
| 2 | 3.5–7.3 | wide, slow tilt; a light sweeps down the grid, every cell dark | "empty" is shown, not said |
| 3 | 7.3–10.0 | push toward the round blast door; the counter plate springs in, `0 / 100,000` | the rule and the promise |
| 4 | 10.0–11.7 | **into the hull**: dive into one bed cell → corridor grows from it, fast dolly | signature move |
| 5 | 11.7–16.4 | dolly eases + yaws to the left wall: gold bed, silhouette, `YOU` → `@YOUR_NAME` | the viewer becomes a character |
| 6 | 16.4–18.7 | pull back out through the cell to the wide; counter `0 / 100,000` | back to the promise |
| 7 | 18.7–23.3 | wide, slight tilt; counter rolls 1,000 (grid lights warm), 10,000 (fans, cyan air) | **the counter climbs** |
| 8 | 23.3–28.0 | counter 100,000; blast door rolls shut with a slam; crane up and pull out to the surface, the horizon glows | the promise paid off |
| 9 | 28.0–28.8 | the power cuts: near black, silence | the breath before the turn |
| 10 | 28.8–31.0 | red emergency light; dive into a cell → red corridor, slow creeping dolly | **the red cell** begins |
| 11 | 31.0–36.0 | yaw to bed `0666`, red glow; on "locked" a latch bar slams across | the twist lands on a sound |
| 12 | 36.0–42.8 | pull back to the wide (door open, counter 0); comment card "Me by the pantry!"; zones light: PANTRY, GENERATORS, then a red dot `666` at the top | **pick your spot** |
| 13 | 42.8–47.4 | gold `YOUR BED` dot; the door starts to roll; push into the grid, ending on shot 1's frame | loops |

## 5. Beat sheet

Line starts (s): l01 0.35 · l02 3.6 · l03 7.35 · l04 10.0 · l05 11.75 · l06 12.6 · l07 16.5 · l08 18.8 · l09 21.0 · l10 23.4 · silence 28.0–28.8 · l11 28.9 · l12 31.2 · l13 36.1 · l14 42.9 · end 47.4. Word-level times in `timeline.json`.

## 6. Cue map

Tempo 100 bpm (0.6 s beat). A drone throughout; a pad on Dm → B♭ from shot 2; a soft pulse from shot 3 that doubles at each milestone (shot 7–8); the door slam at ~25.6 s on the downbeat; everything out at 28.0; a low hit at 28.9 with a red pad (Dm with a ♭2 cluster); the pulse returns half-time from 36.1; a riser into the final push; a hard cut of sound on the loop point.

## 7. Sound design

| Section | Ambience | Foley | Music |
|---|---|---|---|
| 1–3 | deep earth rumble, faint wind above | whoosh on the pull back, light sweep hum, plate pop | drone, pad enters |
| 4–6 | corridor hum | dive whoosh, chime on YOU, tag pop | pad + pulse |
| 7–8 | rumble rising | counter ticks, lights clunk on, air hiss, door rumble and slam | pulse accelerates, door downbeat |
| 9 | none | power-down whine | silence |
| 10–11 | red hum, drip | low hit, creaking, latch slam | dissonant pad |
| 12–13 | rumble | card pop, zone pings, door rolling | pulse returns, riser, cut |

## 8. Captions and titles

Top-centred Fredoka 700 at 58 px, white with a soft shadow; each phrase chunk (in `make_timeline.py`) builds word by word, and the newest word fades from grey. Tags and the counter as in `style/STYLE.md` §4. Also exported as `subtitles_en.srt`.
