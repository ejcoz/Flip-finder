"""Regenerate one narration line from phonemes, to put the stress where the text alone can't (Kokoro has no emphasis markup).
Usage (from the library root): .venv/bin/python <project>/tools/voice_stress.py <project>/lines.json <project>/voice
Each line in lines.json with a "phonemes" field is re-voiced from it (same voice, speed and trim as core/tts/tts.py); dur.json is updated.
Run it after core/tts/tts.py (which voices every line from text), then asr_check.py for the word times."""
import json, os, sys
import numpy as np, soundfile as sf
lines, out = json.load(open(sys.argv[1])), sys.argv[2]
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join('core', 'tts', 'kokoro-v1.0.onnx'), os.path.join('core', 'tts', 'voices-v1.0.bin'))
dpath = os.path.join(out, 'dur.json'); dur = json.load(open(dpath))
for L in lines:
    if 'phonemes' not in L: continue
    a, sr = k.create(L['phonemes'], voice=L['voice'], speed=L.get('speed', .92), lang='en-us', is_phonemes=True)
    nz = np.where(np.abs(a) > np.abs(a).max() * .02)[0]
    a = a[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)]
    sf.write(os.path.join(out, L['id'] + '.wav'), a, sr); dur[L['id']] = round(len(a) / sr, 3)
    print(L['id'], dur[L['id']], L['phonemes'])
json.dump(dur, open(dpath, 'w'), indent=1)
