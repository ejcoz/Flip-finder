# Sync plan: your recording drives everything

`audio/narration.mp3` (27.17 s, mono 44.1 kHz) is the clock. It is never stretched, cut inside a line or re-timed. Scenes and captions follow it.

## 1. Word timings
- faster-whisper transcribes the whole file with word timestamps (`audio/check/words_raw.json`).
- Captions show **your script's words**, not Whisper's spelling. Each script word is matched to a Whisper word by sequence alignment, so "eighty-six percent" takes the timing of Whisper's "86 %". Where you said something different from the script (line 2, see below), the captions follow **what you actually said**.
- Captions are word by word: each word lights up from its start time to its end time, 2–4 words per caption group, with breaks at the line's natural pauses.

## 2. Scene cuts = line boundaries
Cuts land in the silence between lines, at the midpoint of each gap:

| # | line | speech (s) | scene window (s) |
|---|---|---|---|
| 1 | Why does your dog sleep… | 0.00–2.2 | 0.00–2.35 |
| 2 | You'd think it's rude… | 2.78–5.8 | 2.35–5.95 |
| 3 | Vets say it may be the opposite. | 6.44–7.7 | 5.95–7.90 |
| 4 | Turning its back… trust. | 8.40–9.9 | 7.90–10.20 |
| 5 | In packs… watching. | 10.70–14.1 | 10.20–14.40 |
| 6 | A UK study… close. | 15.04–19.6 | 14.40–19.80 |
| 7 | So that butt may be saying… | 20.28–23.0 | 19.80–23.30 |
| 8 | Send this to someone… | 23.76–26.6 | 23.30–27.17 |

## 3. Movement inside scenes, keyed to words
Something moves every 2–3 s, and each move starts **on a word**, not on a guessed time:
- "butt" (1.32): pinned tag pops onto the rear. "facing you" (1.56): a slow push begins.
- "rude" (3.38): myth card in. "gassy" (5.4): strike-through slashes across it.
- "opposite" (7.32): the dog's expression changes (ears soften).
- "trust" (9.58): "TRUST?" tag pops.
- "back-to-back" (12.14): wild-ancestor takeover card. The two dogs settle back to back. "watching" (13.68): one dog's ear and eye flick open.
- "eighty-six" (16.34): "86%" counts up and the study tag pins.
- "safe" (22.14): the payoff tag. The camera returns to the frame 1 framing.
- "Send" (23.76): the share card. **No follow line.**
- The progress strip fills along the full length.

## 4. The two cuts
- **dog-sleep-back** (IG/TikTok): 0–27.17 s. The last ~0.5 s eases back to the frame 1 composition so the loop restarts cleanly.
- **dog-sleep-back-yt** (Shorts): ends at **23.30 s**, after "with you" (speech ends ≈23.0 s). From "safe" the camera is already moving back to the frame 1 shot, so the last frame matches frame 1. The audio gets a 120 ms fade-out at the tail so there's no click when it loops. The share line is not included.

## 5. Checks before delivery
Captions are checked against the waveform at each scene start. Frame 1 and the last frame are compared side by side for both cuts. The final length must equal the audio length (±1 frame).
