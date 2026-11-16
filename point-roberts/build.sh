#!/bin/sh
# Rebuild "Point Roberts" from scratch: sh build.sh   (LIB = the Lemo-Opuscar library folder)
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd); export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; NAME=point-roberts; SIZE=1080x1920
sh "$HERE/tools/fonts.sh"                                                       # OFL fonts → fonts/
if [ ! -f "$HERE/data/map.json" ]; then                                          # map data (Natural Earth, public domain)
  mkdir -p "$HERE/data/raw"
  curl -fsSL -o "$HERE/data/raw/admin0.geojson" https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson
  python3 -I "$HERE/tools/clip.py" "$HERE/data/raw/admin0.geojson" "$HERE/data/region.json" && $PY "$HERE/tools/prep.py"
fi
cd "$LIB"
$PY core/tts/tts.py "$HERE/lines.json" "$HERE/voices"                           # 1. narration (Kokoro am_michael)
$PY "$HERE/tools/tighten.py" "$HERE/lines.json" "$HERE/voices"                  #    cap pauses inside lines
HF_HUB_DISABLE_XET=1 $PY core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"   # 2. every line must transcribe back
python3 "$HERE/tools/timeline.py"                                               # 3. timeline from word timings
$PY "$HERE/music/score.py"                                                      # 4. harpsichord + cello score
node core/render/events.mjs "$HERE"                                             # 5. picture events
$PY "$HERE/mix.py"                                                              # 6. foley + voice + silence
node "$HERE/tools/cues.mjs" > "$HERE/out/cues.json" && $PY core/render/srt.py "$HERE/out/cues.json" "$HERE/$NAME.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size $SIZE --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 2
node core/render/still.mjs "$HERE" 33 --q nosubs=1 --size $SIZE --prefix poster_ --out "$HERE/out/still"
cp "$HERE/out/still/poster_33.jpg" "$HERE/poster.jpg"
