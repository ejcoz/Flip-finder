#!/bin/sh
# Rebuild Enter the Bunker: timeline → events → mix → frames → master.
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-/tmp/enter-the-bunker-build}; export OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$OUT"
python3 "$HERE/make_timeline.py"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 4 --out "$OUT/video.mp4"
.venv/bin/python core/render/srt.py "$OUT/cues.json" "$OUT/subtitles_en.srt"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/enter-the-bunker.mp4" 30 0
