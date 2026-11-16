"""Lay the narration out on the 35 s film and pull key times from the word timings -> timeline.json"""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dur = json.load(open(f'{D}/voices/dur.json')); W = json.load(open(f'{D}/voices/words.json'))
START = dict(s1=0.6, s2=5.4, s3=12.6, s4=17.9, s5=21.0)
V = [dict(id=k, t=t, dur=dur[k]) for k, t in START.items()]
for a, b in zip(V, V[1:]): assert a['t'] + a['dur'] < b['t'], (a, b)
def word(line, w, end=False, nth=0):
    hits = [x for x in W[line] if x[0].lower().strip('.,?!') == w]
    return round(START[line] + hits[nth][2 if end else 1], 3)
K = dict(lineStart=word('s2', 'drew'), lineEnd=word('s2', 'parallel', True) + 0.25, dips=word('s3', 'dips'), below=word('s3', 'below'),
         tip=word('s4', 'tip'), carStart=START['s5'] + 0.7, cross1=word('s5', 'cross'), cross2=word('s5', 'rest'), state=word('s5', 'state', True))
K['carEnd'] = K['state'] + 0.5
split = word('s5', 'just') - 0.05
json.dump(dict(dur=35.0, V=V, K=K, s5split=split), open(f'{D}/timeline.json', 'w'), indent=1)
print(json.dumps(K))
