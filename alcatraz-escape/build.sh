#!/bin/sh
# One command: picture, events, score + foley + voice mix, master. Run from anywhere.
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
[ -f "$HERE/voice/narration.wav" ] || ffmpeg -v error -y -i "$HERE/voice/narration.mp3" -ar 48000 -ac 1 "$HERE/voice/narration.wav"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
"$LIB/.venv/bin/python" "$HERE/srt.py"
node core/render/video.mjs "$HERE" --fps 30 --size 1080x1920 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/alcatraz-escape.mp4" 30 1
ffmpeg -v error -y -ss 30.9 -i "$HERE/alcatraz-escape.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
