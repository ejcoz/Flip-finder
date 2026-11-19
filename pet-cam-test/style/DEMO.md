# Pet Cam — demo film: "Why does your dog tilt its head?"

One example among many. Don't reuse its story, arc, shots, props or timings.

35.2 s · 1080×1920 · 30 fps · narrator (Kokoro `af_heart`, speed 0.95) · soft underscore at 90 BPM · loops. Rebuild: `sh demo/build.sh` (voice already generated in `demo/voice/`).

## Story (10 narration lines)
| Line | Narration | Picture |
|---|---|---|
| l01 | Why does your dog tilt its head when you talk? | night scene, the dog tilts on "tilt", a "?" pops; the caption is whole from frame 1 |
| l02 | One idea: its muzzle blocks part of your face. | CAM 01 *the view*: an owner's face with the dog's blurred muzzle hiding the mouth; THEORY tag |
| l03 | In one owner survey, long-muzzled dogs tilted more often than flat-faced ones. | CAM 02 *the survey*: 71% vs 52% bars fill |
| l04 | But a 2021 study found something stranger. | back to the scene, tilt + "?" |
| l05 | Dogs that had learned their toys' names tilted their heads very often… | CAM 04 *inside the head*: x-ray of the same dog, sound waves, listening area lights up |
| l06 | Most other dogs rarely did. | CAM 05 *the study*: 7 word learners tilted vs 33 typical dogs |
| l07 | And each dog tended to tilt to the same side. | three tilts on the beat of the words, "SAME SIDE ×3" |
| l08–l09 | So that little tilt may mean one thing. Your dog is listening hard. | slow push-in to the face, sound arcs at the perked ear, chime |
| l10 | Say the name of their favorite ball, and watch. | a red ball drops and bounces, the dog tilts; pull back; the opening question returns for the loop |

## Build notes
- **Voice first.** `lines.json` → Kokoro (`tts.py`) → whisper check (`asr_check.py`, run with `HF_HUB_DISABLE_XET=1` behind this proxy) → `voice/words.json`. The page reads `voice/dur.json` and `voice/words.json` and lays every line, card, tilt, caption word and sound event on the narration. "toy" was misread as "tie" at the end of a sentence, so the last line says "ball".
- **Captions**: script words carry the whisper word times; the key phrase pops in whole on its first word; lead and follow words appear as spoken; on-screen digits ("2021") come from a `display` override while the voice says "twenty twenty-one". Captions are subtitles (`test.srt`); readcheck covers the cards.
- **Two layers**: the world (scene, dog, props) through the camera; cards and captions on top, inside the safe area.
- **Mix** (`music.py`): RMS-matched narrator, underscore ducked −10 dB under the voice, foley on events; final mix transcribed back with whisper to confirm the voice reads over the music. −14.0 LUFS.

## Which file draws what
| File | Draws |
|---|---|
| `demo/art.js` | scene, grass, the dog rig (tilt, blink, ear perk, brows), dog icons, owner face, ball, CAM card, pill tags, x-ray head, two-tier caption |
| `demo/film.js` | timeline from the narration, card cut-ins and contents, tilt/blink/camera curves, captions per word, `EV`, `TEXTS` |
| `demo/frame.js` | the original style frame |
| `demo/music.py`, `demo/make_srt.py` | mix and subtitles |
