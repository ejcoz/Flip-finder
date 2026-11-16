#!/bin/sh
# One command: rebuild "The Water Tanks" (tank-water.mp4) from this folder.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"                 # narration + score + effects -> out/mix.wav
"$LIB/.venv/bin/python" "$HERE/check_mix.py"           # music/effects >= 12 dB under the voice
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/tank-water.mp4" 30 1
node core/render/still.mjs "$HERE" 16.9 --size 1080x1920 --out "$HERE/out"
ffmpeg -v error -y -i "$HERE/out/t_16.9.jpg" -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/tank-water.mp4"
