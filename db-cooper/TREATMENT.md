# Case File: Dan Cooper — Treatment

Style: Halftone Dossier · 1080×1920 vertical · 30 fps · ~35.3 s, timed to the user's own narration (used as recorded, leading silence trimmed so the first word lands on frame 1).

## Three candidate structures

1. **Missing-person file, read backwards** — open on the last sighting (the jump), then rewind the paper trail, then the riverbank, then the empty folder. Matches the narration's own order: hook = the jump, then "the day before Thanksgiving…".
2. **Evidence board** — every exhibit pinned to one board, the camera panning between them, strings tying the ticket to the map to the money. Strong for connection, but a single board flattens the night/day contrast (the jump in the dark vs. the bright riverbank twist).
3. **The ransom ledger** — the whole film as a count of the $200,000: each scene subtracts or adds to a running figure. Clever, but the money only becomes the story at the end; up front it would spoil the twist.

**Chosen: 1, the missing-person file.** The narration already opens on the last sighting and works through the file, and the user's scene list follows it. Each scene is one exhibit printed on paper; night scenes switch to the dark ink ground, the riverbank is the one bright, sun-washed exhibit (the twist reads as light arriving), and the film closes back on the silhouette from the opening, now dissolving into its own halftone dots: the subject literally disappears into the print.

## Logline and arc

A man in a dark suit takes a plane, a fortune and a parachute, and steps into the night; nine years on, a boy finds part of the money in the sand, and the file still has no man in it.

- Setup (0–11 s): the jump, the date, the note, the bomb.
- Turn (11–21 s): Seattle swap, the map south, the stairs open, the drop.
- Ending (21–35 s): MISSING; the riverbank twist; the money crossed out; the silhouette dissolves on "Neither has he."

## Benchmark

- **Learn from** 1960s–70s newspaper photo-wire prints and pulp paperback covers (single figure against flat night, heavy dot screens), and the editing of short true-crime explainers on vertical video (one exhibit per breath, captions locked to speech).
- **Don't take** any real photograph, the real FBI sketch, airline liveries or names, comic characters, or anyone's typefaces.

## Palette (paper + 5 inks)

Cream paper `#efe4cc` · night navy ink `#16203a` (outlines, text, dark grounds) · slate-blue overprint `#4f6d9a` · mustard highlight `#e7b33b` (keywords, numerals) · stamp red `#c8322b` · river ochre `#b9894a` (sand only, appears nowhere else).

## Shot list

| # | Narration | Framing / angle | Camera | Why |
|---|---|---|---|---|
| 1 | "A passenger hijacked a plane…" | Wide, low angle up at a night sky; jet small at top, silhouette mid-frame | Slow tilt-up drift; jet pulls away up-frame, figure falls & tumbles down | Opens on the most striking image: the act itself. Hook headline sits on top. |
| 2 | "The day before Thanksgiving…" | Insert, top-down on desk: dossier card + ticket | Card slides in, slow push 1→1.08 on the ticket | Scrutiny; stamp "DAN COOPER" slams on the name line. |
| 3 | "…handed a flight attendant a note" | Close-up, side-on at armrest height | Lateral track following the hand; attendant silhouette pauses (stops, leans) | Intimacy of the moment, faces never shown. |
| 4 | "It said he had a bomb." | Insert, top-down: note unfolds, then briefcase | Snap zoom into briefcase, dots pulse red | "Look closer" — the threat. |
| 5 | "In Seattle he traded…" | Wide side view, rainy apron at night | Slow pan right; rain; passengers file down front stairs, bag + 4 chutes go up | One frame shows the trade both ways. |
| 6 | "…toward Mexico." | Map, frontal | Pan/tilt down following a dotted line drawing south | Geography as a chart. |
| 7 | "Somewhere over Washington…" | Medium, rear of the jet from behind/below | Stairs lower, wind streaks, shake; figure steps and drops; camera tilts down after him | The signature move, mirrored from shot 1 but now close. |
| 8 | "He was never seen again." | Wide top-down over forest canopy | Slow drift, rain; MISSING stamp slams | The empty search. |
| 9 | "Nine years later…" | Close, top-down on sand, daylight | Push in; small hand brushes sand from bundles | The twist; first warm daylight. |
| 10 | "The rest of the money…" | Insert, dossier card | Bundles fade to card, "$200,000" with red cross-out strokes drawing | Accounting of absence. |
| 11 | "Neither has he." | Medium, frontal silhouette | Slow push; figure breaks into dots that scatter and vanish | Echo of shot 1; the print eats him. End on the last word. |

## Beat sheet / cue map

Narration is the master clock; sections start on the first word of each line (word timings from faster-whisper, in `out/words.json`). Score: a low synth pulse at 96 bpm (navy-dark), muted kick + bass for the night section, a music-box bell on the riverbank, silence for "Neither has he." Music and foley sit ≥ 12 dB under the voice whenever it speaks; impact foley (stamps, whoosh) is only placed in the gaps between words (checked against word timings).

## Sound design

| Section | Ambience | Foley (in gaps only) | Music |
|---|---|---|---|
| 1 jump | high wind | — (no intro sound) | low pulse fades up under the voice |
| 2–4 file | paper room tone | card slide, stamp in gap, paper unfold | pulse + square bass |
| 5–7 Seattle / flight | rain, jet hum | stairs hydraulic whine, wind gust | bass + kick |
| 8 forest | rain | MISSING stamp (in gap) | drops out — near silence |
| 9–10 riverbank | river burble | sand brush | music-box bell |
| 11 end | — | — | silence; ends on last word |

## Subtitles and titles

- Hook headline (shot 1, top): black slab serif, misregistration shadow, "He jumped out of a plane with $200,000. Then vanished." — per-character pop, held through shot 1.
- Captions: black-weight sans (Archivo Black), large, 2–4 words per card in a navy caption pill, keyword in mustard, centred at 65 % of the frame height; nothing in the bottom 20 %. Numbers in digits (1971, $200,000, 9). Exported as `db-cooper.srt`.
- No title card, no end card.
