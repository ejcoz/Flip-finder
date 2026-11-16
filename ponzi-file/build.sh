#!/bin/sh
# One command: voice (if missing), pause trim, timeline, captions, picture, sound, master → ponzi-file.mp4
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"; PY="$LIB/.venv/bin/python"
if [ ! -f "$HERE/voice/words.json" ]; then
  if ls "$HERE"/voice_src/narration.* >/dev/null 2>&1; then
    "$PY" "$HERE/split_voice.py"             # the user's recorded read (ElevenLabs), split into lines
  else
    "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voice_raw"   # fallback: Kokoro
  fi
  "$PY" "$HERE/voice_trim.py"
  "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voice"
fi
"$PY" "$HERE/make_timeline.py" > /dev/null
"$PY" "$HERE/make_captions.py"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/ponzi-file.srt"
node core/render/events.mjs "$HERE" --size 1080x1920
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/ponzi-file.mp4" 30 1
node core/render/still.mjs "$HERE" 0 --size 1080x1920 --out "$HERE/out" --prefix poster_
cp "$HERE/out/poster_0.jpg" "$HERE/poster.jpg"
