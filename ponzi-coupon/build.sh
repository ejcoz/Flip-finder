#!/bin/sh
# One command: The Coupon. sh build.sh   (PARTS=1 re-bakes the paper parts; WORKERS=n render workers)
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"
NAME=the-coupon
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/mix.py"
"$PY" "$HERE/make_fonts.py"
[ -f "$HERE/voice/L7.wav" ] || "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voice/"
HF_HUB_DISABLE_XET=1 "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voice" --lang en
"$PY" "$HERE/src/timeline.py" > /dev/null
if [ "${PARTS:-0}" = "1" ] || [ ! -f "$HERE/parts/manifest.json" ]; then "$PY" "$HERE/src/bake.py"; fi
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers "${WORKERS:-3}" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 1
"$PY" -c "import json,sys; c=json.load(open(sys.argv[1]))['cues']; json.dump([dict(t0=x['t0'],t1=x['t1'],text=x['en']) for x in c], open(sys.argv[2],'w'))" "$HERE/timeline.json" "$HERE/out/cues.json"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/$NAME.srt"
node core/render/readcheck.mjs "$HERE" > "$HERE/out/readcheck.txt" && echo "readcheck ok" || grep -i bad "$HERE/out/readcheck.txt" || true
ffmpeg -v error -y -ss 12.8 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
