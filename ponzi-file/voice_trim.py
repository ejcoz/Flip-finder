"""voice_raw/*.wav → voice/*.wav with every internal pause longer than 0.25 s shortened to 0.2 s.
Prints the pace (words per minute) of the full narration with the gaps from timeline.py."""
import os, json, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, 'lines.json')))
os.makedirs(os.path.join(HERE, 'voice'), exist_ok=True)
MAXP, KEEP = .25, .20
durs = {}
for l in L:
    x, sr = sf.read(os.path.join(HERE, 'voice_raw', l['id'] + '.wav'), dtype='float32')
    w = int(.01 * sr); n = len(x) // w
    e = np.array([np.sqrt(np.mean(x[i * w:(i + 1) * w] ** 2)) for i in range(n)])
    quiet = e < max(e) * 10 ** (-30 / 20)
    out, i, cuts = [], 0, []
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if i > 0 and j < n and (j - i) * .01 > MAXP:
                k = int(KEEP / .01); a = i + k // 2; b = j - k // 2
                out.append(x[i * w:a * w]); out.append(x[b * w:j * w]); cuts.append(round((j - i) * .01, 2))
            else: out.append(x[i * w:j * w])
            i = j
        else:
            j = i
            while j < n and not quiet[j]: j += 1
            out.append(x[i * w:j * w]); i = j
    out.append(x[n * w:])
    y = np.concatenate(out)
    f = int(.004 * sr); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    sf.write(os.path.join(HERE, 'voice', l['id'] + '.wav'), y, sr)
    durs[l['id']] = round(len(y) / sr, 3)
    print(l['id'], round(len(x) / sr, 2), '→', durs[l['id']], 'pauses cut:', cuts)
json.dump(durs, open(os.path.join(HERE, 'voice', 'dur.json'), 'w'), indent=1)
words = sum(len(l['text'].split()) for l in L)
GAP, BEAT = .25, .55
total = sum(durs.values()) + GAP * (len(L) - 2) + BEAT
print(f'words {words}  narration {total:.2f}s  pace {words / total * 60:.0f} wpm')
