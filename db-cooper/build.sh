#!/bin/sh
# One-command build: captions → events → picture → mix → master.
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
# word timings (faster-whisper) are kept in out/words.json; regenerate with: $PY -I whisper_words.py
"$PY" "$HERE/prep.py"
cd "$LIB"
"$PY" core/render/srt.py "$HERE/cues.json" "$HERE/db-cooper.srt"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 4 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/db-cooper.mp4" 30 1
