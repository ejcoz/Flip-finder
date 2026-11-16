#!/bin/sh
# One command: picture, sound, subtitles, master → tacoma-narrows.mp4
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
"$PY" core/audio/sampler.py --need "$HERE/mix.py"
# voice (Kokoro) + speech-to-text check, only if missing
[ -f "$HERE/voice/l5.wav" ] || { "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voice"; "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voice"; }
node core/render/events.mjs "$HERE" --size 1080x1920
"$PY" "$HERE/mix.py"
"$PY" "$HERE/make_srt.py"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/tacoma-narrows.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/tacoma-narrows.mp4" 24 1
node core/render/still.mjs "$HERE" 34.9 --size 1080x1920 --out "$HERE/out" --prefix poster_
cp "$HERE/out/poster_34.9.jpg" "$HERE/poster.jpg"
