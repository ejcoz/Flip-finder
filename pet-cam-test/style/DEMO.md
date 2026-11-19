# Pet Cam — demo film: "Why does your dog tilt its head?"

One example among many. Don't reuse its story, arc, shots, props or timings.

35.2 s · 1080×1920 · 30 fps · narrator (Kokoro `af_heart`, speed 0.95) · soft underscore at 90 BPM · loops. Rebuild: `sh demo/build.sh` (voice already generated in `demo/voice/`).

## Story (10 narration lines, 7 scenes)
A new scene for each idea, whip-panned with motion blur; cards cut in on the word that needs them.

| Line | Narration | Scene |
|---|---|---|
| l01 | Why does your dog tilt its head when you talk? | **Living room**: the owner kneels and says "Who's a good dog?" (speech bubble, mouth moving); the dog tilts on "tilt", a "?" pops. The question is whole from frame 1. |
| l02 | One idea: its muzzle blocks part of your face. | **Dog's-eye view**: the owner's face full-frame, the dog's own blurred muzzle rising into the bottom of the frame; THEORY tag |
| l03 | In one owner survey, long-muzzled dogs tilted more often than flat-faced ones. | **Day park**: a long-muzzled hound and a flat-faced pug side by side; the hound tilts on "long-muzzled", the pug barely; the survey card (71% vs 52%) cuts in on "tilted" |
| l04 | But a 2021 study found something stranger. | **Living room**: tilt + "?" |
| l05–l06 | Dogs that had learned their toys' names tilted their heads very often… Most other dogs rarely did. | **Toy pile** on the rug: "Get the duck!", the dog tilts on "names"; the x-ray card cuts in on "tilted", then the study card (7 word learners vs 33 typical dogs) |
| l07 | And each dog tended to tilt to the same side. | **Three-dog split screen** (CAM 06–08): cream, black and hound, each tilting its own way on "tilt", "the", "side", with ↺/↻ ×n counters |
| l08–l09 | So that little tilt may mean one thing. Your dog is listening hard. | **Living room close-up**: slow push-in, sound arcs at the perked ear, chime |
| l10 | Say the name of their favorite ball, and watch. | **Living room**: "Where's your ball?", the owner reaches, the ball rolls in, tail wags, tilt; returns to the opening frame for the loop |

## Build notes
- **Voice first.** `lines.json` → Kokoro (`tts.py`) → whisper check (`asr_check.py`, run with `HF_HUB_DISABLE_XET=1` behind this proxy) → `voice/words.json`. The page reads `voice/dur.json` and `voice/words.json` and lays every line, card, tilt, caption word and sound event on the narration. "toy" was misread as "tie" at the end of a sentence, so the last line says "ball".
- **Captions**: script words carry the whisper word times; the key phrase pops in whole on its first word; lead and follow words appear as spoken; on-screen digits ("2021") come from a `display` override while the voice says "twenty twenty-one". Captions are subtitles (`test.srt`); readcheck covers the cards.
- **Two layers**: the world (scene, dog, props) through the camera; cards and captions on top, inside the safe area.
- **Mix** (`music.py`): RMS-matched narrator, underscore ducked −10 dB under the voice, foley on events; final mix transcribed back with whisper to confirm the voice reads over the music. −14.0 LUFS.

## Which file draws what
| File | Draws |
|---|---|
| `demo/art.js` | night scene, living room, day park; the dog rig with breeds (cream, hound, pug, black), tilt, blink, ear perk, brows, tail wag, breathing; the owner (kneeling, talking, reaching), speech bubble, owner face, toys, ball, dog icons, CAM card, pill tags, x-ray head, two-tier caption with a dark plate |
| `demo/film.js` | shot list from the narration (a shot wherever the scene changes), whip-pans with motion blur, card windows inside lines, per-scene animation curves, captions per word, watermark, `EV`, `TEXTS` |
| `demo/frame.js` | the original style frame |
| `demo/music.py`, `demo/make_srt.py` | mix and subtitles |
