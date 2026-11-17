#!/bin/sh
# One-command build: picture → events → mix → subtitles → master.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar library folder"; exit 1; }
SRC_MP3=${1:-}
# narration: the user's file with its leading silence trimmed (first word on frame 0)
if [ -n "$SRC_MP3" ]; then
  ffmpeg -hide_banner -loglevel error -y -ss 0.035 -i "$SRC_MP3" -ac 1 -ar 48000 -c:a pcm_s16le "$HERE/audio/narration.wav"
fi
[ -f "$HERE/audio/narration.wav" ] || { echo "pass the narration mp3 as the first argument"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
python3 "$HERE/make_cues.py"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/gardner-heist.srt"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/gardner-heist.mp4" 30 1
ffmpeg -hide_banner -loglevel error -y -ss 1.0 -i "$HERE/gardner-heist.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
