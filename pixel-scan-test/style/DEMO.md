# Pixel Scan — demo film: "10K steps a day"

One example among many. Don't reuse its story, arc, shots, props or timings.

28 s, 1080×1920, 30 fps, 120 BPM (14 bars). Music and effects, no voice. Rebuild: `sh demo/build.sh`.

## Story

A body starts walking 10,000 steps a day. Day 1 is grey and toxic; Week 1 is a setback (sore legs); a chart shows energy building; sleep deepens; the heart gets stronger; level up.

| Bars | Time | Milestone | On screen | Sound |
|---|---|---|---|---|
| 0–2 | 0–4 s | hook: YOU WALK 10K / STEPS A DAY. / HERE'S WHAT HAPPENS | one hook line per beat; grey organs, amber toxins, tired face, amber "!"; slow push-in begins | groove, Am–F–C–G; a blip per hook line |
| 2–4 | 4–8 s | WEEK 1 · SORE LEGS | caption "MUSCLES ADAPT TO THE NEW LOAD", LEGS callout; amber sweep and underline, legs flash amber on beats, sweat drops, 2-beat shake | falling sweep; stripped: drone, held chord, detuned lead, no drums |
| 4–6 | 8–12 s | WEEKS 2-8 · ENERGY BUILDS | caption "MORE ENERGY, LESS FATIGUE"; monitor mode: lime line draws in half-beat steps, Bit faint behind | groove + arpeggio voice; a tick per chart step |
| 6–8 | 12–16 s | MONTH 2 · SLEEP DEEPER | caption "ACTIVE DAYS, DEEPER SLEEP", BRAIN callout; brain fills, Zs drift up, legs heal, lime sparkles | groove |
| 8–11 | 16–22 s | MONTH 3 · HEART STRONGER | caption "RESTING HEART RATE DROPS", HEART callout that tracks the punch-in; to the chest on bar 2; HR counts 84→68 on beats; bar 3 is held still | coin arpeggio as HR lands; bar 3 = near-silence (faint chord) |
| 11–14 | 22–28 s | LEVEL UP! · KEEP WALKING | caption "SAVE THIS FOR YOUR DAY 1"; pull back to the full lab, lime title types on, pixel confetti | key up to C major, fast arps, double hats, crash; confetti sparkle |

Every cut is a scan sweep on a bar line.

## Palette

Room `#041417` `#0A2A30` `#0F3A41` `#14505A` (dithered) · cyan `#39E0F0` / `#0B8EA0` · organs coral/pink · heart `#FF5A5F` · lime `#A6F04A` only for improvement · amber `#FFB547` only for the setback and toxins.

## Build notes

- `main.js` holds the one timeline (`MS`, in bars). It also exports `window.EV`: section starts with mood, sweeps, the falling sweep, chart ticks, the coin and confetti. `music.py` reads those events (via `events.json`) and writes the score, so picture and music can't drift.
- Two layers: the world (lab, booth, body, props) is drawn to an offscreen canvas and placed with the camera transform (zoom, focus, setback shake, clamped to the frame). The text layer (hook, titles, captions, callouts, HR readout) is drawn on top without the camera; callout lines map the organ through the camera.
- The figure is drawn at 16 px cells in a booth whose glass is 1040 px tall.
- Captions are placeholder copy: see `FACTS.md`.
- Pixel layers step on twos (props, confetti, chart steps on quarter-beats); the camera, glows and scanline move every frame.
- Low end measured per section (20–120 Hz vs the rest): −1.4 to −3.3 dB. Master −14.1 LUFS, peak −1.3 dBFS.

## Which file draws what

| File | Draws |
|---|---|
| `demo/font.js` | 5×7 pixel font, `drawText`, `textW` |
| `demo/pix.js` | 4×4 Bayer dither: `ditherField`, `ditherGlow` |
| `demo/bit.js` | the figure "Bit" (30×62 body grid), organs with health 0..1 filling bottom-up, faces, toxins, sore legs, `sparkle` |
| `demo/lab.js` | the dithered lab and the smooth scanner booth (pre-rendered), glass sheen |
| `demo/main.js` | timeline, scan sweep, monitor-mode chart, hook, title bar, captions, callouts, HR readout, props (`bang`, `sweat`, `zzz`), confetti, camera, `EV`, `TEXTS` |
| `demo/music.py` | chiptune score and effects from `events.json` |
