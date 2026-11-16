#!/bin/sh
# Rebuild the film from scratch: sh build.sh   (LIB = the Lemo-Opuscar library folder)
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd); export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=nb-housing-reel; SIZE=1080x1920
sh "$HERE/tools/fonts.sh"                                                     # OFL fonts → fonts/
cd "$LIB"
$PY core/tts/tts.py "$HERE/lines.json" "$HERE/voices"                         # 1. Kokoro narration (af_heart)
$PY "$HERE/tools/tighten.py" "$HERE/lines.json" "$HERE/voices"                 #    cap the pauses inside each line
HF_HUB_DISABLE_XET=1 $PY core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" || echo "! voice check skipped or failed (needs huggingface.co for the Whisper model)"
$PY "$HERE/music/score.py"                                                    # 2. original cool-jazz score
node core/render/events.mjs "$HERE"                                           # 3. picture events → events.json
$PY "$HERE/mix.py"                                                            # 4. foley + voice + ducking + silences
node "$HERE/tools/cues.mjs" > "$HERE/out/cues.json" && $PY core/render/srt.py "$HERE/out/cues.json" "$HERE/$NAME.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size $SIZE --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 3
node core/render/still.mjs "$HERE" 57.9 --q nosubs=1 --size $SIZE --prefix poster_ --out "$HERE/out/still"
cp "$HERE/out/still/poster_57.9.jpg" "$HERE/poster.jpg"
