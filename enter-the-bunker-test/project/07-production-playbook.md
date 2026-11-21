# Production playbook

How an episode is made, from idea to posted.

## The pipeline
| Step | Who | Output |
|---|---|---|
| 1. Pick the clue, community beat and ask | You + Claude, from `05-roadmap-and-calendar.md` | One-line brief |
| 2. Write the script | Claude drafts, you edit | Script + recording sheet (like `06-episode-2-script.md`) |
| 3. Pick the roll call | Claude, from the Survivor Registry | 4–6 handles |
| 4. Record the voice | You, in ElevenLabs | One file per line |
| 5. Sample frames | Claude renders 4–8 stills | **You approve before the full render** |
| 6. Render and mix | Claude (film engine: render, sped-up voice, sound effects, −14 LUFS) | `episode-N.mp4`, cover, subtitles |
| 7. Review | You watch it on your phone | Notes, or approve |
| 8. Post | You | Caption, pinned comment, cover |
| 9. Log | Claude | Metrics row in `02-metrics-tracker.md` at 24 h and 7 d |

**Standing rule: Claude never re-renders a full film without asking first.** Sample frames come first.

## Format rules (from what episode 1 taught us)
**Length and pace**
- 40–50 s. Episode 1 at 54.6 s held well, but shorter episodes finish more often.
- **No silence longer than about 0.5 s**, except one deliberate beat before a twist. The 1.7 s pause in episode 1 cost about 10% of viewers.
- The recorded voice may be sped up by up to 7%, with the pitch kept.

**Hook**
- The mystery is moving on screen in the first 2 seconds. Title cards sit over motion, never on a still.
- Promise the twist by about 8 s; bring the mystery back in the middle.

**Layout (phone safe zones)**
- Keep text out of the top ~300 px, the right ~140 px and the bottom ~380 px.
- The bunker fills at least 70% of the frame width.
- Captions: Fredoka 78 px with a heavy outline, first line at y ≈ 330, no punctuation commas (commas inside numbers stay: 100,000).
- Tags at least 40 px at their final on-screen size.

**Story**
- One clue, one community beat, one roll call and one ask per episode.
- Numbers must match everywhere: voice, captions and door plates.
- Bed 0 is "bed 0" in voice and text. Never "000" or "0000".
- Red means the forbidden (bed 0, B8). Gold means *you*. Never both on one bed.
- End on the threat, then loop to the opening frame.

**The roll call (every episode)**
- 4–6 real survivors: door plates (`BED 78,910 · @handle`) and one or two comment cards.
- Mix: named beds, a funny comment, a bed 0 attempt (REQUEST DENIED in red), a less popular level, new faces.
- Skip handles or comments with profanity. Record who was featured in the registry.

## Deliverables per episode
- [ ] `episode-N.mp4` (1080×1920, 30 fps, −14 LUFS)
- [ ] Cover that works in Instagram's 4:5 and TikTok's 3:4 crops
- [ ] Caption and pinned comment
- [ ] Subtitles (`.srt`) for TikTok and YouTube
- [ ] Roll-call list logged as featured in the registry
- [ ] Metrics row added at 24 h

## Voice (ElevenLabs)
- Keep the same voice and settings every episode. The voice is part of the brand.
- Numbers as words in the script ("one thousand").
- One take per line, a beat of silence at each end.
- Emphasis: put the stressed word on its own line in the script, or add a comma before it.
- Calm, low and dry. Never shouting.

## Sound
- Low drone, dark pad, and a pulse that speeds up as the counter climbs.
- A whoosh on dives, a tick-roll on counters, a chime on YOU, a metal thump on doors.
- **Three knocks** is the series' signature sound. Use it at the end of every episode.
