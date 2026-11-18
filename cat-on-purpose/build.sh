#!/bin/sh
# One-command rebuild: picture, events, captions, score + mix, master.
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar library folder"; exit 1; }
# on machines without a GPU WebGL needs software rendering
export LEMO_ANGLE=${LEMO_ANGLE:-swiftshader}
# trim the narration's leading silence (the voice starts on frame 1)
ffmpeg -loglevel error -y -i "$HERE/audio/narration_original.mp3" -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse" -ar 48000 -ac 1 "$HERE/audio/narration.wav"
"$LIB/.venv/bin/python" "$HERE/captions.py" 25.8
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/your-cat-on-purpose.mp4" 24 0
ffmpeg -loglevel error -y -ss 0 -i "$HERE/your-cat-on-purpose.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
