"""cues.json from the caption table in index.html (same timing rule as the page)."""
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'index.html')).read()
body = src.split('const CAPS = [', 1)[1].split('];', 1)[0]
caps = [(float(a), float(b), (c or d)) for a, b, c, d in re.findall(r"\[([\d.]+),\s*([\d.]+),\s*(?:'([^']*)'|\"([^\"]*)\")", body)]
DUR = float(re.search(r'DUR = ([\d.]+)', src).group(1))
cues = []
for i, (a, b, s) in enumerate(caps):
    t0 = max(0, a - 0.04)
    t1 = min(caps[i + 1][0] - 0.04, b + 0.6) if i + 1 < len(caps) else DUR
    cues.append({'t0': round(t0, 3), 't1': round(t1, 3), 'text': s})
json.dump(cues, open(os.path.join(HERE, 'cues.json'), 'w'), indent=1)
print(len(cues), 'cues')
