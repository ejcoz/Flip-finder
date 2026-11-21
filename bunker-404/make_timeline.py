"""Build timeline.json from voice/dur.json + voice/words.json: line starts, caption chunks with word times."""
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
dur = json.load(open(f'{H}/voice/dur.json')); words = json.load(open(f'{H}/voice/words.json'))
START = {'l01': .3, 'l02': 2.8, 'l03': 6.9, 'l04': 11.4, 'l05': 14.7, 'l06': 16.0, 'l07': 17.7, 'l08': 23.4, 'l09': 25.7}
DUR = 30.0
DISP = {
 'l01': '100,000 | empty bunks.',
 'l02': 'Hidden deep underground, | waiting for the day | everything ends.',
 'l03': 'Every bunk has a number. | Comment yours, | and it\'s reserved | under your name.',
 'l04': 'Right now, | not a single one is taken.',
 'l05': 'All but one.',
 'l06': 'Bunk 404.',
 'l07': 'It was sealed | before we ever opened the bunker. | And when we knocked, | something knocked back.',
 'l08': 'So comment your bunk number below.',
 'l09': "Just don't pick 404."}
lines, caps = [], []
for lid, t0 in START.items():
    d = dur[lid]; w = words[lid]
    # merge "100" ",000" style tokens
    toks = []
    for word, a, b in w:
        a = max(a, 0.0)
        if toks and re.match(r'^[,.]\d', word): toks[-1] = [toks[-1][0] + word, toks[-1][1], b]
        else: toks.append([word, a, b])
    toks = [[x, t0 + a, t0 + b] for x, a, b in toks]
    groups = [g.split() for g in DISP[lid].split('|')]
    flat = [x for g in groups for x in g]
    assert len(flat) == len(toks), (lid, flat, [x[0] for x in toks])
    lines.append({'id': lid, 't': t0, 'd': d, 'w': [[x, toks[i][1], toks[i][2]] for i, x in enumerate(flat)]})
    k = 0
    for g in groups:
        chunk = [[x, toks[k + j][1], toks[k + j][2]] for j, x in enumerate(g)]; k += len(g)
        caps.append({'w': chunk, 't0': chunk[0][1], 't1': chunk[-1][2]})
# each caption holds until the next starts (max 0.9 s after its last word)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['t0'] if i + 1 < len(caps) else DUR
    c['t1'] = min(nxt - .02, c['t1'] + .9)
json.dump({'DUR': DUR, 'lines': lines, 'caps': caps}, open(f'{H}/timeline.json', 'w'), indent=1)
json.dump([{'t0': c['t0'], 't1': c['t1'], 'text': ' '.join(x[0] for x in c['w'])} for c in caps], open(os.path.join(os.environ.get('OUT', f'{H}/out'), 'cues.json'), 'w'), indent=1)
print(len(caps), 'captions; last line ends', max(l['t'] + l['d'] for l in lines))
