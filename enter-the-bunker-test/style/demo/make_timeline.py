"""Build timeline.json from voice/dur.json + voice/words.json: line starts, caption chunks with word times."""
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
dur = json.load(open(f'{H}/voice/dur.json')); words = json.load(open(f'{H}/voice/words.json'))
START = {'l01': 0.0, 'l02': 3.6, 'l03': 7.35, 'l04': 10.0, 'l05': 11.75, 'l06': 12.6, 'l07': 16.5,
         'l08': 18.8, 'l09': 21.0, 'l10': 23.4, 'l11': 28.9, 'l12': 31.1, 'l12b': 33.7, 'l12c': 36.9, 'l13': 41.8, 'l14': 48.1}
DUR = 52.6
DISP = {
 'l01': 'This bunker has room | for 100,000 people.',
 'l02': '100,000 beds, | and every single one | is empty.',
 'l03': "The blast door won't seal | until it's full.",
 'l04': 'So who sleeps down here?',
 'l05': 'You.',
 'l06': 'Everyone who follows | gets a bed, | with their name on the door.',
 'l07': "Right now, | there's nobody inside.",
 'l08': 'At 1,000, | the lights come on.',
 'l09': 'At 10,000, | the air starts flowing.',
 'l10': 'And at 100,000, | the door seals, | and we wait out | the end of the world.',
 'l11': "But there's something | I haven't told you.",
 'l12': 'This bunker | only has seven levels.',
 'l12b': 'Bed 000 | is on the eighth.',
 'l12c': "And it's locked | from the inside.",
 'l13': 'Pick your spot | in the comments. | By the garden, | next to the armory, | or right beside bed 000.',
 'l14': 'Follow me, | and get inside | before the door closes.'}
lines, caps = [], []
for lid, t0 in START.items():
    d = dur[lid]; w = words[lid]
    # merge "100" ",000" style tokens
    toks = []
    for word, a, b in w:
        a = max(a, 0.0)
        if toks and re.match(r'^[,.]\d', word): toks[-1] = [toks[-1][0] + word, toks[-1][1], b]
        else: toks.append([word, a, b])
    toks = [[x.replace('six six six', '666'), t0 + a, t0 + b] for x, a, b in toks]
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
