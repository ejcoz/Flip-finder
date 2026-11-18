# Your Cat Is Doing It On Purpose — Treatment

Vertical 1080×1920, 24 fps, 25.8 s (the length of the user's own narration after trimming its 0.17 s lead-in; the film ends on the last spoken word, "over").
Style: Low-poly Isometric Island (orthographic isometric camera, flat-shaded low-poly geometry, no textures, pop/bounce arrival curves, pitched-percussion score), moved indoors into small room dioramas as the user asked.

## Brief overrides (the user's instructions win over STYLE.md)

| STYLE.md says | This film does | Why |
|---|---|---|
| Pastel, low contrast | Bright, high-contrast warm palette: cream walls, wood tones, teal and orange accents | user: "bright and high-contrast, never dim" |
| Islands floating in a sea | Cut-away room dioramas (kitchen table, living room) and one hex grass patch; the sky-gradient void stays behind them | user |
| Subtitles without a box, low on screen | Bold rounded sans (Quicksand 700), 2–4 words at a time, centred at 65 % height on a black 75 % rounded box; nothing in the bottom 20 % | user |
| Titles rise letter by letter | Hook text fully readable on frame 1 | user |
| Grain 0, −14 LUFS | kept | |
| Foley on every arrival | No sound effects over speech; one small glass smash in the gap after "fall" | user |
| GTAO mandatory | Soft shadow maps + hemisphere fill + a contact-shadow disc under each object; GTAO would be too slow on this machine's software WebGL renderer and the seams it draws are replaced by visible bevel gaps between planks and tiles | render budget |

## Three candidate structures

1. **The confession (chosen).** The cat performs the crime straight to camera, the narration explains the hunter instinct, then the cat turns and looks at us: the "second reason" is you. Setup = instinct, turn = attention, ending = the cat ready to do it again, paw over the next glass, looking at us. The look to camera is the spine: it opens the film (paw on glass, eyes on the viewer), returns at the turn (scene 6) and closes it (scene 9).
2. **Crime-scene reconstruction.** A detective-style walk across one diorama, evidence markers on the fallen objects. Clever but the markers fight the captions and the user's scene list.
3. **Two dioramas side by side** (cat world / human world) trading pieces until they join. Native to the style, but it hides the cat small in a big composition; rejected because the cat must always be large.

Chosen: 1, because the user's scene list already is a confession and the repeated stare is the best hook-and-payoff for a vertical short.

## Logline and arc

An orange tabby knocks a glass off the table while staring at you; it looks like hunting, until it turns out the real prey is your attention.
Setup (0–14.7 s): instinct (push, tap, watch it fall, crouch). Turn (14.7–21.5 s): the cat looks at us; flashback to the owner leaping off the couch. Ending (21.5–25.8 s): smug squint, a row of glasses, paw raised.

## Benchmark

- *Learn from*: short-form animal explainers on vertical video (one idea per shot, the subject filling the frame, the payoff look to camera); isometric diorama illustration (cut-away rooms on a block base, warm lamplight, chunky props).
- *Don't take*: any existing character design, any app's caption template, any game's tiles or UI.

## The cat (one model, every scene)

Chunky low-poly orange tabby: icosahedron head (wider than tall), cone ears with pink insides, cream muzzle and chest, three dark-orange forehead stripes and body bands, big flattened-ellipsoid eyes (white, amber iris, black pupil that scales from slit to huge), clipped eyelids that can narrow and tilt (smug), chunky cylinder legs with cream toe tips, a six-segment tail. Exaggerated reactions come from pupils, lids, ears and head tilt.

The owner: a simple low-poly figure (teal shirt, dark trousers, sphere head with a hair cap, no face).

## Shot list

| # | Time | Framing / angle | Camera move | Action | Why |
|---|---|---|---|---|---|
| 1 | 0.00–2.90 | Close, isometric 3/4, table edge; cat face upper half, paw + glass mid frame; hook text top | slow orthographic push-in | Paw mid-push; glass tips by 0.4 s, slides over the edge and drops out by 1.4 s; cat keeps staring at us, tail flicks, ear twitch | the hook: the crime, done to our face |
| 2 | 2.90–5.00 | Insert, higher angle: paw and pen big in front, cat eyes behind | lateral truck following the paw | Paw slides a pen slowly to the edge; eyes locked on it; pen teeters at the edge | "slow push with one paw" |
| 3 | 5.00–10.30 | Full, hex grass patch (the style's own tiles) | slow turntable, ~18° azimuth | Cat crouched, mouse sniffing; tap (7.8 s) → mouse hops; second tap (8.7 s); mouse darts out of frame on "runs" (9.4 s), cat's head follows | the hunting parallel |
| 4 | 10.30–12.20 | Medium, side 3/4: table edge, floor below | slow drift down + push | Cup falls (10.6–11.7 s), cat's head tilts down following, pupils huge; cup lands and cracks in two halves that slump apart (no flying parts) | "watch it fall" |
| 5 | 12.20–14.70 | Medium-close, low angle on the table top | slow push-in | Crouch, rear wiggle, tail flicking, eyes on a teal mug | "the hunter in their brain" |
| 6 | 14.70–18.00 | Medium-close, same set | slow lateral truck | Cat freezes, ears swivel, head turns to look straight at us, blink | the turn |
| 7 | 18.00–21.50 | Wide living-room diorama, couch (left) and table (right) side by side so everything sits above the caption; cat ≈ 17 % of frame height | slow push toward the table | Owner on couch from 18.0 s (never before); jumps up arms high (19.4 s), shouts arms shaking (20.0 s), runs to the table (20.6 s) | the twist: the reward |
| 8 | 21.50–22.80 | Close-up face | slow push | Eyes narrow slowly into a smug squint, lids tilt | "your cat noticed" |
| 9 | 22.80–25.80 | Medium: cat sits beside a row of four glasses on the edge | lateral truck along the row | Paw raised over the next glass, bobbing; looking at us; ends on "over" | bookend of shot 1 |

Moves used: push-in (ortho zoom), lateral truck, turntable, drift/tilt, push toward subject. No swoops, no perspective change. Something moves in every frame (tail, ears, breathing, camera drift).

## Beat sheet (trimmed narration time)

- 0.00 hook text + caption "Your cat isn't" on screen; paw pushing; 0.40 glass tilting; 1.40 glass gone.
- 2.44 line ends; 2.90 cut to pen.
- 5.00 cut to grass. 7.76 "Tap" = tap 1. 8.66 tap 2. 9.40 "runs" = mouse darts.
- 10.30 cut to table. 10.52 "Then"; cup leaves the edge 10.86; 11.88 cup lands, smash SFX 11.88–12.24 (the voice tail of "fall." ends 11.85, "Motion" starts 12.30).
- 12.20 cut to crouch. 14.40 line ends.
- 14.70 cut; 15.4 freeze; 15.9–16.6 head turns to camera.
- 17.56 line ends, music thins to near silence; 18.00 cut to living room on "The"; owner visible.
- 19.46 "jumped" = leap; 20.06 "shouted" = arms shake; 20.62 "came running" = run.
- 21.50 cut to face; 21.84 "Your cat noticed": lids close down to 22.6.
- 22.80 cut to glasses row; 25.58 "over"; film ends 25.80.

## Cue map

96 bpm (beat 0.625 s), C major pentatonic, 4/4.
- 0.00–2.90: no lead-in; soft pad + kalimba on beat 1 from frame 1 (quiet), marimba "push" motif.
- 2.90–14.70: kalimba ostinato in eighths, light shaker, soft kick on 1 and 3; marimba note on each tap (7.76, 8.66) and a falling 3-note figure on the mouse dart (9.4) and cup fall (10.6).
- 14.70–17.90: ostinato thins to one voice; 17.60–18.00 near silence (silence 1).
- 18.00–21.30: brighter, busier: woodblock + marimba eighths, a rising run on "came running".
- 21.30–21.80: near silence (silence 2), then a low sly vibraphone motif under "noticed".
- 22.80–25.80: the opening kalimba motif returns, resolving on the tonic at 25.6 ("over").
Music sits ≥ 12 dB below the voice (measured as speech-gated RMS), ducked further while speaking.

## Sound design

| Section | Bed | Foley | Music |
|---|---|---|---|
| 1–2 kitchen | none (no SFX over speech) | none | pad + kalimba motif |
| 3 grass | none | none | ostinato, tap notes |
| 4 fall | none | small glass smash at 11.88 in the gap | falling figure |
| 5–6 | none | none | thinning to one voice, silence 17.6 |
| 7 owner | none | none | busy woodblock/marimba |
| 8–9 | none | none | silence 21.3, sly vibes, motif returns |

## Subtitles and title

- Hook: "Your cat is doing it on purpose." Quicksand 700, 104 px, white / yellow with a dark outline, two lines in the top 19 % of frame, 0–2.9 s (the whole first shot), fully drawn on frame 1.
- Captions: Quicksand 700, 76 px, white on rgba(0,0,0,0.75) rounded box (radius 28), centred at y = 0.65 H; chunks of 2–4 words from the word timings; the cat is staged above or beside the box in every shot; nothing below y = 0.80 H.
- Burned in; exported as `subtitles_en.srt`.

## Changes made during the look pass

- Every shot is framed so the cat stays above the caption box (top ~61 % of the frame); the opening close-up is a little wider than first planned to fit under the hook text.
- Kitchen table lowered (top 1.3 units above the floor) so the cup's fall to the floor fits above the caption in shot 4; the cup now falls off the table's right edge, beside the cat, so its face stays visible as it watches.
- Shot 7 re-staged side by side (couch left, table right); the owner runs across the frame to the table.
- Hook shown for the whole first shot (2.9 s) and gone at the first cut.
