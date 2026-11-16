# The Ponzi File — treatment

Style: Halftone Dossier. 1080×1920 vertical, 30 fps, 25.0 s, ending on the last spoken word. English voice (Kokoro `am_michael`, brisk read at about 160 words per minute; every pause under 0.3 s except one 0.55 s beat after "He wasn't."). Numbers are spelled out for the voice and shown as digits in the captions. Captions in Archivo Black, 2–4 words per card, centred at 65 % of the frame height (y ≈ 1248). Nothing is placed in the bottom 20 % (below y = 1536). No title card. No user material: everything is drawn in code, and the portrait is a generic 1920s man, not a likeness.

## Three candidate structures

1. **Verdict first, then the file (chosen).** Open on the closed case: the portrait, a red CLOSED stamp and the hook "50% profit in 45 days?". The folder opens, and each line of narration becomes an exhibit: the promise, the man and his coupon, the crowd, the chain, the clippings. The film closes back on the stamped file, now labelled with his name.
2. **Evidence board.** Every exhibit is pinned to one board and linked with string, and the string becomes the money chain. This is clear, but the chain payoff would be smaller than a full-frame shot.
3. **Countdown of 45 days.** A calendar ticks through the film while the money chain grows. It's tense, but it competes with the narration's own timeline (1920 → August).

## Logline and arc

A case file shows a promise that was too good. The money chain that paid it grows until it snaps. Setup: the promise (50 %, 45 days) and the cover story (postal coupons) → turn: "He wasn't." and the chain → ending: the snap, clippings pile up, CLOSED, his name on the file.

## Benchmark

Ben-Day print and police case-file graphics, used for grammar only. **Learn**: dot density as shading, misregistered headlines, stamps as verdicts, numbered exhibits. **Don't take**: any comic panels, real newspaper mastheads or real document designs. The office sign and clippings are generic.

## Shots / beat sheet (s)

| # | Time | Shot | Move |
|---|---|---|---|
| A | 0.0–3.6 | Payoff frame: folder, halftone portrait, CLOSED stamp, hook headline at the top | locked, stamp bounce + shake at 0 |
| B | 3.6–8.4 | The folder flap opens. EXHIBIT 1 "THE PROMISE": giant halftone 50%, a calendar flipping to 45 | slow push-in |
| C | 8.4–15.0 | EXHIBIT 2: mugshot with height chart, name plate CHARLES PONZI (flash), postal coupon slides in; FAKE stamp after "He wasn't." | push-in, flash, shake |
| D | 15.0–17.0 | Crowd lining up outside an office, hats bobbing | lateral pan |
| E | 17.0–28.6 | The chain: tiers of investors double downward, and money flows up the chain links from new to old. Camera pulls back as the chain grows, with counters NEEDED vs IN CIRCULATION. Silence, then the chain SNAPS at 28.6 | pull back (scale reveal), hard hit |
| F | 28.6–35.0 | Clippings slap down and pile up. Silence, then CLOSED stamp (30.6). The tab is typed PONZI SCHEME on "his name" | push-in, shake, end on 35.0 |

Signature shot: E, the chain growing to fill the frame and snapping.

## Sound

Synth pop-print kit (kick, snare, hats, square bass, marimba-like pluck, finger snaps), all synthesized. Foley: stamp booms, camera flash, paper slides, glyph pops, crowd murmur, coin and bill flutters, chain clinks, the snap (boom + crackle + metal), paper slaps. Silences: before the snap (28.2–28.6) and before the closing stamp (30.3–30.6). The music ends with a bell tag on the last word.

## Revision 2 (voice and mix)

- Voice: Kokoro `am_fenrir` at speed 0.9. Internal pauses are trimmed (`voice_trim.py`), with 0.25 s between sentences and a 0.55 s beat after "He wasn't." The narration runs 24.3 s at about 162 wpm, so the film is now 25.0 s.
- Every cue is anchored to a spoken word (`make_timeline.py` → `timeline.js`). The order is now man → chain → crowd ("and the crowds kept coming") → chain (reporters' math, snap) → clippings, CLOSED on "August".
- Mix: sound effects play only in the silent gaps (opening stamp, FAKE stamp, chain snap) and are cut 20 ms before the next word. Visual hits inside speech are accented by the score instead. Music and effects are held 16 dB under the voice wherever it speaks; `mix.py` measures it in 100 ms windows (worst 14.2 dB, none under 12 dB).

## Revision 3 (voice choice)

- Voice changed to Kokoro `am_michael` (picked from the audition reel), speed 0.98, internal pauses trimmed to 0.2 s or less. The narration runs 24.3 s at about 163 wpm, and the film is 24.9 s.
- Mix check: worst 12.8 dB of voice over music + effects while speaking, no 100 ms window under 12 dB.

## Revision 4 (your ElevenLabs narration)

- Voice: your ElevenLabs recording (`voice_src/narration.mp3`), used as supplied. `split_voice.py` cuts it into six lines at the quietest point of each sentence gap, and `voice_trim.py` shortens the two comma pauses (0.26–0.27 s → 0.2 s). Sentence gaps are 0.25 s, with a 0.55 s beat after "He wasn't." No time-stretching.
- The read is faster than the 160 wpm target: with those gaps it runs about 182 wpm, and the film is 22.3 s.
- The chain layout never lags behind the tiers on screen (they now arrive faster).
- Mix check: worst 15.6 dB of voice over music + effects while speaking, none under 12 dB.
