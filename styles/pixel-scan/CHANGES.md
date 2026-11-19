# Pixel Scan — changes

Made from a blank page. Technique base: Mascot Screencast (`living-screencast`). Borrows: Rhythm Game Show (`game-show`), 16-bit Pixel RPG (`pixel-rpg`).

| Section | Base | Now | Why |
|---|---|---|---|
| Size / use | 1920×1080 software walkthrough, 45–75 s | 1080×1920 health timeline, 30–60 s, Reels/TikTok | Vertical feed; the user's format |
| §1 Essence | low-res mascot inside a hi-res product UI | low-res pixel human figure ("Bit", full body) inside a smooth hi-res x-ray scanner; its organs change per milestone | Keeps the two-resolution clash, applied to the body |
| §2 Materials | HTML/CSS/SVG UI, mascot on DOM edges | Canvas 2D; tall hi-res booth and glass; pixel figure at 16 px cells (half the frame height), organs and type; 4×4 Bayer dither on room gradients and glows | Retro texture without losing the smooth world (dither from pixel-rpg) |
| §3 Colour | the product's colours | teal-black lab, cyan scanner, coral organs; lime = healed, amber = setback, reserved | Reads at a glance in the feed; direction by colour |
| §4 Type | product fonts, caption pills | one 5×7 pixel font drawn in code; a platform safe area (x 60–920, y 250–1480) for everything read; hook lines 1–2 on frame 1; title + caption under it (subline only without a caption); callouts, lens and readout on the left edge; all on a text layer the camera never moves | Shorts/Reels UI covers the top, right and bottom; scrollers decide in under a second and read ~1 line a second |
| §5 Motion | UI on ones, mascot stepped | pixel layers on twos, camera smooth; idle squash on the beat | Pixel feel with smooth camera |
| §6 Camera | recording-software camera, whips between panes | one lab, push-ins, punch-in to an organ, pull-back, shake on setback | One set; the body is the subject |
| §7 Sound | hi-fi band + chiptune mascot voice, voiceover | pure chiptune at 120 BPM, score from the timeline, mood by arrangement, sweeps for direction, no voice | Cuts on bar lines (from game-show) |
| §8 Native moves | match-cut origin, diegetic title, etc. | scan sweep reveal (signature); monitor mode (charts on the scanner glass), HUD readout, zoom lens, status props, particle clear-out, level-up finale as a menu | The new recurring transition |
| Ending | — | every film ends with a loop rewind (scan runs back up to the opening frame; music turns back to bar 1, no fade) | Seamless replays count as rewatches |
| Frame-1 look | — | red hook key word; gunmetal booth; dithered spotlight + vignette; dim body outline; big always-bright heart; glowing particles and the habit's prop on frame 1 | The first frame needs one focal point and a warm accent against the teal (bright area 10 % → ~4 %) |
| Text contrast | — | dark bold pixel text on a bright cyan title bar and a near-white caption card; bold strokes for anything read | Light-on-teal text with one-cell strokes didn't grab the eye at phone size |
| Scene variety | — | away shots: organ dives, life scenes, full-screen charts, with full-screen scanline wipes; booth as home base | Viewers need full scene changes every 2–4 s, like the reference |
