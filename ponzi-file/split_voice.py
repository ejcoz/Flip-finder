"""voice_src/narration.(mp3|wav) — one continuous read — → voice_raw/l1..l6.wav.
Cuts at the quietest point of each sentence gap (found from Whisper word times),
then trims leading/trailing silence. voice_trim.py then shortens the internal pauses."""
import os, sys, json, glob, subprocess
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
src = sorted(glob.glob(os.path.join(HERE, 'voice_src', 'narration.*')))[0]
wav = os.path.join(HERE, 'voice_src', 'narration_48k.wav')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-ac', '1', '-ar', '48000', wav], check=True)
x, sr = sf.read(wav, dtype='float32')
from faster_whisper import WhisperModel
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'base.en'), compute_type='int8')
segs, _ = m.transcribe(wav, word_timestamps=True)
ws = [w for s in segs for w in s.words if w.end - w.start > .02]      # drop zero-length hallucinated words
# sentence ends: words ending with . ? !  (the six lines of the script)
ends = [i for i, w in enumerate(ws) if w.word.strip()[-1:] in '.?!']
ends = ends[:6]; assert len(ends) == 6, f'expected 6 sentences, got {len(ends)}'
win = int(.01 * sr); env = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) for i in range(0, len(x) - win, win)])
def quietest(a, b):
    i0, i1 = int(a / .01), max(int(a / .01) + 1, int(b / .01)); return (i0 + int(np.argmin(env[i0:i1]))) * .01
cuts = [0.0]
for k in range(5):
    e = ws[ends[k]].end; s = ws[ends[k] + 1].start; cuts.append(quietest(e, s))
cuts.append(len(x) / sr)
thr = env.max() * 10 ** (-42 / 20); pad = .04
os.makedirs(os.path.join(HERE, 'voice_raw'), exist_ok=True)
for k in range(6):
    a, b = int(cuts[k] * sr), int(cuts[k + 1] * sr); y = x[a:b]
    e = env[int(cuts[k] / .01):int(cuts[k + 1] / .01)]; on = np.where(e > thr)[0]
    s0 = max(0, int((on[0] * .01 - pad) * sr)); s1 = min(len(y), int(((on[-1] + 1) * .01 + pad) * sr)); y = y[s0:s1].copy()
    f = int(.005 * sr); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    sf.write(os.path.join(HERE, 'voice_raw', f'l{k + 1}.wav'), y, sr)
    print(f'l{k + 1}: {cuts[k]:.2f}–{cuts[k + 1]:.2f}s → {len(y) / sr:.2f}s')
tail = x[int((ws[ends[5]].end + .3) * sr):]
print('level after the last word:', round(20 * np.log10(np.sqrt(np.mean(tail ** 2)) + 1e-9), 1), 'dBFS' if len(tail) else '(none)')
