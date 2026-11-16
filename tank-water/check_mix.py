# Check: wherever the voice sounds (100 ms windows above -45 dBFS), music + effects stay >= 12 dB under it.
import numpy as np, wave, subprocess, os
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 44100
v = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'narration.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], capture_output=True).stdout, dtype=np.float32).astype(float)
v = np.concatenate([np.zeros(int(.6 * SR)), v])
w = wave.open(os.path.join(HERE, 'out', 'mix.wav')); m = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2)[:, 0] / 32767
n = min(len(v), len(m)); k = np.dot(m[:n], v[:n]) / np.dot(v[:n], v[:n]); bed = m[:n] - k * v[:n]
W = int(.1 * SR); worst = 99; wt = 0
for s in range(0, n - W, W):
    vv = np.sqrt(np.mean((k * v[s:s + W]) ** 2))
    if 20 * np.log10(vv + 1e-9) < -45: continue
    d = 20 * np.log10(vv / (np.sqrt(np.mean(bed[s:s + W] ** 2)) + 1e-9))
    if d < worst: worst, wt = d, s / SR
print('worst margin wherever the voice sounds: %.1f dB at %.2f s' % (worst, wt))
raise SystemExit(0 if worst >= 12 else 1)
