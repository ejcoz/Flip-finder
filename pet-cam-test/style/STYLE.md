# Pet Cam · 宠物镜头 — Style Prompt

Made from a blank page; techniques from Sci-Fi Sitcom Toon (scifi-toon) in Lemo-Opuscar.
Default size: 1080×1920.

> A vertical pet-science explainer: a narrator answers one question about a pet ("Why does your dog tilt its head?") over a soft flat-vector scene, and the answer is shown through **CAM-feed cards**: rounded inset "camera" views (x-ray, inside the body, thermal, a survey crowd) with HUD tags. Word-by-word captions, the key phrase in a selection box.
> References (grammar only):
> - **Pet-explainer reels with camera-feed insets:** one animal, one question, a card per idea.
> - **Design-tool selection boxes:** corner handles around the key phrase.
> - **Documentary HUDs:** CAM tags, timers, mono labels, gauges.
>
> Never copy their characters, scenes, wording, music or footage.

A 45–65 s vertical film about why a pet does something, or how to keep it well. The user gives the question and the facts; you decide the beats, the cards, the scenes, the cast and the ending.

## 1. Essence, and what it is not

- **A narrator explains; the picture proves.** Every beat is one spoken idea and one visual that shows it.
- **CAM-feed cards are the signature.** The answer lives in rounded inset "camera" views that cut in over the scene: inside the head, inside the gut, a thermal cam, a survey. Each card has an italic title, a small italic subtitle, a mono `CAM 04` tag and a timer icon.
- **Soft flat vector, no outlines.** Friendly rounded animals and people built from clean shapes with soft top-to-bottom shading; the scene is lit for the story's mood.
- **Captions are the voice.** Grey lead-in words, then the key phrase big and bold in a selection box with corner handles, coloured by meaning.

Not Sci-Fi Sitcom Toon (no boiling outlines, no dialogue comedy, no portal), not a whiteboard explainer (finished illustration, not drawing-on), not a 3D render, not the reference reels (own cast, palette, wording and music).

## 2. Materials & rendering

- **Canvas 2D at 1080×1920**, vector paths. **No outlines** on characters or sets: shape edges are colour edges.
- **Soft shading**: each form gets a vertical gradient highlight → base → shadow (about 20 % darker), one soft inner highlight where light hits, and a soft ground shadow ellipse. No hard cel shadows, no textures.
- **Characters**: rounded, friendly, big dark eyes with one white highlight; brows carry the emotion; mouths are simple lines. Pets are original designs with one memorable marking (e.g. the demo dog: cream coat, brown ears, brown saddle and one brown eye patch, teal collar). Prefer three-quarter front views for expressions (a head tilt reads front-on, not in profile).
- **Scenes**: a few big layers: sky gradient, a moon or sun, round trees or buildings as soft silhouettes, a ground gradient, tapered grass blades in two greens in front and behind the pet.
- **CAM-feed card**: rounded rectangle (radius ~28), navy `#111A2E`, 2 px border `rgba(120,150,210,.28)`, a soft drop shadow; italic title (Inter Italic 700, 34 px) and subtitle (Inter Italic 400, 25 px, grey) top-left; mono `CAM 04` (JetBrains Mono 24 px) and a timer ring top-right. Inside: a diagram view (x-ray in glowing blue strokes, the inside of an organ in its own colours, a thermal palette, a grid of icons).
- **X-ray views** redraw the same character in glowing blue strokes (`#9FD0FF` with a blue glow) at the same pose and angle as in the scene; organs inside are soft-shaded colour shapes.

## 3. Colour logic

| Role | Colour |
|---|---|
| Night scene (calm, curious) | sky `#0A1124` → `#1B2C4E`, trees `#102219`/`#13281F`, ground `#1F4B2F` → `#0C2014`, grass `#2A6B3D`/`#358A4C` |
| Dusk scene (heat, danger) | orange `#F07A2A` → rust `#7A2E14`, buildings `#3A1C14` |
| Cards, HUD | navy `#111A2E`, border blue-grey, text `#F2F5FF` / grey `#8B95AD` |
| X-ray | `#9FD0FF` strokes, `#5AB4FF` glow |
| **Meaning accents** (caption box, pill tags, icons) | good `#3DDC97` · bad `#FF5C6C` · question `#FFC94D` · fact `#5AB4FF` |

- The scene's light sets the mood; the accents carry meaning and are used for nothing else.
- Characters keep their natural colours in every scene.

## 4. Type & subtitles

- **Inter** (OFL) for captions and card titles; **JetBrains Mono** (OFL) for HUD tags and CAM labels. Both self-hosted in `fonts/`.
- **Safe area (Reels, Shorts, TikTok)**: everything read stays inside x 60–920, y 250–1480.
- **Two-tier caption, synced to the voice word by word** (from the voice's word timestamps): a grey lead-in line (Inter 400, ~44 px, `#A7B0C4`) with the words around the key phrase; the **key phrase** (Inter 800, ~84 px, white) in a selection box: thin border and four round corner handles in the meaning colour, a faint dark fill. An optional grey follow line underneath. The box pops in on the first word of the key phrase.
- **Pill tags** (JetBrains Mono 600, ~26 px) in the meaning colour inside cards and the HUD: one short label (`TILT = BETTER SIGNAL?`, `WORMS OUT ✓`).
- Every caption and tag passes readcheck against the voice timing.

## 5. Motion quality

- 30 fps. Characters animate on ones with eased poses: blinks, ear flicks, head tilts with a small overshoot, breathing.
- Cards cut in on a quick scale-up from 96 % with a motion-blur whip; content inside animates once (waves pulse, a glow fades up, icons count up).
- Caption words appear exactly on their spoken word; the key box pops in with a small overshoot.

## 6. Camera grammar

Mostly a locked camera on one scene; movement is purposeful.

| Move | Expresses | Serves |
|---|---|---|
| Hold on the scene | the question, the everyday moment | the opening; a behaviour |
| Card cut-in (whip + blur) | "look inside" | the mechanism; the evidence |
| Slow push-in on the pet | attention, feeling | an emotional beat |
| Whip-pan between scenes | another time or place | a comparison; a myth vs fact |

## 7. Sound palette

- **Narrator voice**: calm, curious, clear (generated with Kokoro by default; the user's recordings swap in). Checked line by line with whisper; word timestamps drive the captions.
- **Underscore**: soft and curious (plucked strings, warm pads, light percussion), ducked ~10 dB under the voice.
- **Foley**: a whoosh on every card cut, a soft tick per checklist item, a gentle stinger on the answer, small cartoon sounds for the pet (a sniff, a tag jingle).
- Master −14 LUFS.

## 8. Native moves

The CAM-feed card is in every film; the others are a menu.

- **CAM-feed card (signature).** A rounded inset camera view cuts in to show what can't be seen: x-ray of the head, inside the gut, thermal cam, a survey crowd of icons. *Fits content like:* a brain reacting; worms in the gut; body heat; "1,500 owners were asked".
- **Live readout graph.** A HUD timeline under a card with labelled lines (STRESS, CALM, CORTISOL) that move with the story. *Fits content like:* a feeling rising and falling.
- **HUD side kit.** A gauge (thermometer), numbered step dots, a checklist that ticks on beats, zoom lenses, a red X or strikethrough for a myth. *Fits content like:* warning signs; a five-step routine; myth vs fact.

## 9. Pitfalls of the medium

- Outlines creeping in, or hard cel shadows → soft shading only.
- A behaviour shown in profile that only reads front-on (head tilt, a look) → turn the character three-quarter front.
- An x-ray that doesn't match the character's pose → redraw the same pose and angle.
- Caption words off the voice → captions come from the voice's word timestamps.
- Text under the platform UI → keep to the safe area.
- Unsourced pet-health claims → every claim in `FACTS.md` with its source; prefer vets, veterinary schools and peer-reviewed studies.
- Copying the reference characters (breeds, markings, poses) → original pets with their own marking.

## 10. Engine

In [`demo/`](demo/) (how it was made: [DEMO.md](DEMO.md)): `art.js` (soft-shading kit: scene, grass, the dog rig with tilt / blink / ear perk / brows, icons, owner face, ball, CAM card, pill tags, x-ray head, two-tier caption), `film.js` (page contract: a timeline laid on the narration's `dur.json` + `words.json`, card cut-ins, animation curves, word-timed captions, camera on the world layer only, `EV`, `TEXTS`), `music.py` (narrator + ducked underscore + foley), `make_srt.py`, `build.sh`. A new film copies `demo/`, writes a new `lines.json`, regenerates the voice and rewrites `LINES` and the card contents in `film.js`. Techniques from `$LIB/styles/scifi-toon/demo/` (parametric faces, voice processing).

## 11. Variation space

You decide the question, the beats, the cards, the scenes, the cast and the ending.

- Structures: **the mystery** (a behaviour, wrong guesses crossed out, the real answer in a card); **the warning** (signs as a ticking checklist, then what to do); **the routine** (numbered steps with a gauge).
- Openings: **the behaviour caught in the act**; **the myth** stated, then struck through; **"save this"** for a safety topic.
- Endings: **the answer, one line**; **a reassurance** ("so it's normal"); **a call to save or share**; always a clean loop back to the opening scene.
