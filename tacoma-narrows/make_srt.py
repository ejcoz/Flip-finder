"""timeline.js CUES → out/cues.json for srt.py"""
import os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'timeline.js'), encoding='utf-8').read()
cues = [{'t0': float(a), 't1': float(b), 'text': c.replace("\\'", "'")} for a, b, c in
        re.findall(r"\{ t0: ([\d.]+), t1: ([\d.]+),[^}]*?text: [\"'](.+?)[\"'] \}", src)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), indent=1)
print(len(cues), 'cues')
