#!/bin/sh
# Pet Cam: "Why does your dog yawn when you yawn?" One command rebuilds the film from the voice files.
#   sh build.sh            → dog-yawn.mp4, poster.jpg and subtitles_en.srt in this folder (work files in out/)
# Voice: the user's recording voice_src/yawn-narration.mp3, cut into voice/l01–l10.wav plus voice_src/line-7.mp3 for l07.
# Word timings after replacing a clip:
#   HF_HUB_DISABLE_XET=1 $LIB/.venv/bin/python $LIB/core/tts/asr_check.py lines.json voice --lang en
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd)
OUTD=$HERE/out; mkdir -p "$OUTD"
PY="$LIB/.venv/bin/python"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --out "$OUTD/events.json"
node core/render/readcheck.mjs "$HERE" --size 1080x1920
"$PY" "$HERE/make_srt.py" "$OUTD/events.json" "$HERE/lines.json" "$HERE/voice/dur.json" "$OUTD/cues.json"
"$PY" core/render/srt.py "$OUTD/cues.json" "$HERE/subtitles_en.srt"
"$PY" "$HERE/music.py" "$OUTD/events.json" "$HERE/voice" "$OUTD/mix.wav"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 30 --workers 4 --out "$OUTD/video.mp4"
sh core/render/mux.sh "$OUTD/video.mp4" "$OUTD/mix.wav" "$HERE/dog-yawn.mp4" 30 0
node core/render/still.mjs "$HERE" 0 --size 1080x1920 --out "$OUTD" >/dev/null && cp "$OUTD/t_0.jpg" "$HERE/poster.jpg"
echo "film: $HERE/dog-yawn.mp4"
