#!/bin/sh
# Pet Cam: "Why does your dog sleep with its butt facing you?" One command builds both cuts from the user's recording.
#   sh build.sh  → dog-sleep-back.mp4 (Instagram/TikTok, 8 lines) + subtitles_en.srt
#                  dog-sleep-back-yt.mp4 (YouTube Shorts, ends after line 7) + subtitles_en_yt.srt
#                  poster.jpg (frame 1)                                    work files in out/
# Voice: the user's recording voice_src/butt-dog-narration.mp3, cut into voice/l01–l08.wav at its own pauses (re-takes: voice_src/line-2.mp3, line-3.mp3);
#        voice/offsets.json = where each line starts in the recording. After replacing a clip, refresh the word timings:
#        HF_HUB_DISABLE_XET=1 $LIB/.venv/bin/python $LIB/core/tts/asr_check.py lines.json voice --lang en
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd)
OUTD=$HERE/out; mkdir -p "$OUTD"
PY="$LIB/.venv/bin/python"
cd "$LIB"
for CUT in full yt; do
  if [ "$CUT" = yt ]; then NAME=dog-sleep-back-yt; SRT=subtitles_en_yt.srt; else NAME=dog-sleep-back; SRT=subtitles_en.srt; fi
  node core/render/events.mjs "$HERE" --q "cut=$CUT" --size 1080x1920 --out "$OUTD/events_$CUT.json"
  node core/render/readcheck.mjs "$HERE" --q "cut=$CUT" --size 1080x1920
  "$PY" "$HERE/make_srt.py" "$OUTD/events_$CUT.json" "$HERE/lines.json" "$HERE/voice/dur.json" "$OUTD/cues_$CUT.json"
  "$PY" core/render/srt.py "$OUTD/cues_$CUT.json" "$HERE/$SRT"
  "$PY" "$HERE/music.py" "$OUTD/events_$CUT.json" "$HERE/voice" "$OUTD/mix_$CUT.wav"
  node core/render/video.mjs "$HERE" --q "cut=$CUT" --size 1080x1920 --fps 30 --workers 4 --out "$OUTD/video_$CUT.mp4"
  sh core/render/mux.sh "$OUTD/video_$CUT.mp4" "$OUTD/mix_$CUT.wav" "$HERE/$NAME.mp4" 30 0
done
node core/render/still.mjs "$HERE" 0 --size 1080x1920 --out "$OUTD" >/dev/null && cp "$OUTD/t_0.jpg" "$HERE/poster.jpg"
echo "films: $HERE/dog-sleep-back.mp4  $HERE/dog-sleep-back-yt.mp4"
