# Covers (Shorts thumbnail / Reels cover)

1080×1920. Everything that matters sits inside the middle 1080×1440, the Instagram profile grid's 3:4 crop.

- **@pupexplained (Pet Cam):** a clean close-up from the film, with the hook set on top: a small grey lead line, then the key phrase in a selection box with corner handles. Amber for a question, blue for a fact. The handle pill sits near the bottom of the crop.
- **@8bitbodyscan (Pixel Scan):** the film's own title-slam frame at 2 s, scaled to 95% so the title and the booth plate both clear the crop.

Rebuild:
```
mkdir -p /tmp/cov
for d in dog-stare dog-words pet-cam-test; do node covers/frames.cjs $PWD/$d /tmp/cov 0.6 1.3; done   # Pet Cam: scene only (window.COVER)
for d in quit-alcohol quit-vaping quit-sugar; do node covers/frames.cjs $PWD/$d /tmp/cov 2; done
$LIB/.venv/bin/python covers/make_covers.py /tmp/cov
```
A new film adds one row to `PET` in `make_covers.py`, or its folder to the Pixel list.
