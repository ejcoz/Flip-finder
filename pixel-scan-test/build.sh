#!/bin/sh
# Pixel Scan demo: "10K steps a day". One command rebuilds the film.
#   sh build.sh                  → film in out/
#   OUT=<dir> sh build.sh        → write everything to <dir>
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd)
OUTD=${OUT:-$HERE/out}; mkdir -p "$OUTD"; OUTD=$(cd "$OUTD" && pwd)
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --out "$OUTD/events.json"
node core/render/readcheck.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/music.py" "$OUTD/events.json" "$OUTD/mix.wav"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 4 --out "$OUTD/video.mp4"
sh core/render/mux.sh "$OUTD/video.mp4" "$OUTD/mix.wav" "$OUTD/test.mp4" 30 0
echo "film: $OUTD/test.mp4"
