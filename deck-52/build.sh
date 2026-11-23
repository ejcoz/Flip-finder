#!/bin/sh
# Rebuild "52 Cards" (Pixel Countdown Science): sh build.sh   — writes to ${OUT:-./out}
set -e
LIB=/root/lemo-opuscar
D="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$D/out}"; mkdir -p "$OUT"
cd "$LIB"
node core/render/events.mjs "$D" --size 1080x1920 --out "$OUT/events.json"                         # 1. sound events from main.js
LIB="$LIB" .venv/bin/python "$D/mix.py" "$OUT/events.json" "$OUT/mix.wav"                            # 2. synthesised mix
node core/render/video.mjs "$D" --size 1080x1920 --fps 30 --workers 4 --out "$OUT/video.mp4"      # 3. frames
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/deck-52.mp4" 30 0                          # 4. mux, −14 LUFS, no grain
node core/render/still.mjs "$D" 23.0 --size 1080x1920 --prefix poster_ --out "$OUT" && cp "$OUT/poster_23.0.jpg" "$OUT/poster.jpg"
