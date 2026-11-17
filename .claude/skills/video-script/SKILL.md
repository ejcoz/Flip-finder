---
name: video-script
description: Write full, retention-engineered video scripts for YouTube long-form (8-30 min), YouTube Shorts, Instagram Reels and TikTok. Plans the packaging (title + thumbnail + hook as one promise), opens with a tested hook from viral-hooks, structures the body around open loops and re-hooks, and marks on-screen text, b-roll and pacing cues. Triggers on "write a script for", "YouTube video about X", "script a Reel/TikTok/Short", "outline my video", "my retention drops off", or any request for a spoken video script.
argument-hint: "[topic] [platform] [optional: length, angle, CTA]"
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# Video Script

You write scripts people finish watching. Every line either moves the viewer toward the payoff they were promised or it gets cut.

Use [viral-hooks](../viral-hooks/SKILL.md) for every opening line and [post-grader](../post-grader/SKILL.md)'s hook standard (would the first 3-5 words stop a scroll?) for every re-hook. Read `brand-brief.md` if it exists for voice, audience, CTA and the Strong Opinion / Wedge. If it's missing, don't block: ask for the audience and CTA in one question, then write.

## Step 1: Lock the brief (one round of questions max)

You need:

1. **Topic and angle**: the specific claim, story or result, not the subject area. "Budget travel" is a subject. "I flew to Japan for $412 using 3 loopholes" is an angle.
2. **Platform and length**: YouTube long-form, Shorts, Reels or TikTok. Default lengths below.
3. **The payoff**: the one thing the viewer will have, know or feel by the end.
4. **CTA**: subscribe, follow, comment keyword, link, next video.
5. **Raw assets**: real numbers, stories, screenshots, footage the creator actually has. Never invent results, stats or quotes. Use `[CREATOR: add real number]` placeholders instead.

If the user gave enough, skip the questions and write.

## Step 2: Package before you script

The title, thumbnail and first line are one promise. Write them first so the script delivers on it.

- **Long-form YouTube**: give 3 title options (under 60 chars, curiosity + specificity) and 2 thumbnail concepts (3 words of text max, one clear focal image, an emotion on a face or a visual contrast). The hook must confirm the click within 5 seconds, not repeat the title word for word.
- **Short-form**: write the on-screen text hook (under 8 words) and the caption first line.

## Step 3: Write the script for the format

### Short-form (TikTok, Reels, Shorts): 20-60 s, default 35 s

| Beat | Time | Job |
|---|---|---|
| HOOK | 0-2 s | Spoken line + on-screen text + a visual change in frame 1. Pull from viral-hooks. No greeting, no name, no "so". |
| CONTEXT | 2-6 s | Why this matters to *this* viewer. One sentence. |
| BODY | 6 s-end-5 s | 3-5 beats, one idea per line. A visual or text change every 2-3 s. Put a mini re-hook ("but here's the part nobody does") before the final beat. |
| PAYOFF | | Deliver exactly what the hook promised. |
| CTA / LOOP | last 3-5 s | One ask. Or end on a line that flows back into the first line so the video loops. |

Platform tweaks:
- **TikTok**: rawest tone, talk to camera, trend-aware audio note, keyword spoken in the first 3 s (TikTok search reads speech and captions).
- **Reels**: slightly more polished, optimize for saves and sends ("Save this for..."), keep key text out of the bottom 20% and right edge (UI overlap).
- **Shorts**: under 60 s, the loop ending matters most, CTA can point to a related long-form video.

### Long-form YouTube: 8-30 min, default 10-12 min (~1,500-1,800 spoken words)

| Section | Time | Job |
|---|---|---|
| COLD OPEN / HOOK | 0-15 s | Confirm the click, raise the stakes, show proof you can deliver. Formula: *promise* + *proof* + *plan* ("By the end you'll know X. I've done Y. Here's how this goes."). |
| SETUP | 15-60 s | Open the main loop: the question the whole video answers. Tease the best moment ("and #3 is the one that actually saved me $2k"). |
| BODY | chapters | 3-7 chapters. Each chapter = mini hook → point → proof/example/story → takeaway → re-hook into the next. Order: strong, stronger, strongest-but-one, then the best last. |
| RE-HOOKS | every 60-90 s | A new open loop, pattern interrupt, or stakes raise so viewers never hit a natural exit point. |
| PAYOFF | | Close the main loop opened in SETUP. |
| CTA / END SCREEN | last 20 s | No "that's it for today". Hand off to one specific next video with a reason to click it. Subscribe ask goes after a value moment mid-video, not only at the end. |

Also provide **chapter timestamps** for the description and mark the **mid-roll ad / sponsor slot** at a natural chapter break if relevant.

## Step 4: Format the script

Write spoken lines exactly as they'll be said: contractions, short sentences, numbers as digits, no em dashes. Put production cues in brackets on their own lines:

```
[ON-SCREEN: "I spent $0 on ads"]
[B-ROLL: empty shop → packed shop]
[CUT / ZOOM / SFX: whoosh]
[PAUSE]
```

Output layout:

```
## Packaging
Titles: 1) ... 2) ... 3) ...
Thumbnails: A) ... B) ...      (long-form only)
On-screen hook: ...            (short-form only)

## Script — [platform] — ~[length] — hook category: [category]
HOOK (0:00)
...
[CHAPTER / BEAT NAME] (0:15)
...
CTA (x:xx)
...

## Extras
Caption / description first line, chapter timestamps, 3-5 hashtags (TikTok/Reels only), pinned comment.
## Alternate hooks
2 more hook options from different viral-hooks categories.
```

## Step 5: Self-check before returning

- [ ] First 3 words stop the scroll on their own.
- [ ] The hook's promise is paid off explicitly, and nowhere earlier than it should be.
- [ ] No section longer than 90 s (long-form) or 5 s (short-form) without a re-hook, visual change or new beat.
- [ ] Zero filler: "hey guys", "welcome back", "before we start", "in this video I'm going to", "basically", "literally", "without further ado".
- [ ] Every claim is either from the creator's real assets or marked as a placeholder.
- [ ] One CTA, placed where it fits the platform.
- [ ] Reads naturally out loud. Spot-check the hook and one transition by "saying" them.

## Repurposing

When the user has a finished long-form script or transcript and wants clips, hand off to [repurpose](../repurpose/SKILL.md), or pull 3 short-form scripts yourself from the moments with the strongest standalone payoff.

## What not to do

- Don't open with a greeting, intro music cue or channel plug.
- Don't front-load the best point in long-form. Tease it, deliver it late.
- Don't write paragraphs. Viewers hear lines, not prose.
- Don't paste the same script across TikTok, Reels and Shorts. Adjust the hook, text placement and CTA per platform.
- Don't fabricate stats, testimonials or results.
