"""Build timeline.json from voice/dur.json + voice/words.json: line starts, caption chunks with word times."""
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
dur = json.load(open(f'{H}/voice/dur.json')); words = json.load(open(f'{H}/voice/words.json'))
START = {'l01': 0.0, 'l02': 3.66, 'l03': 9.91, 'l04': 12.48, 'l05': 14.57, 'l06': 15.38, 'l07': 18.92, 'l08': 21.11, 'l09': 23.39, 'l10': 25.91, 'l11': 32.49, 'l12': 34.76, 'l12b': 37.39, 'l12c': 39.48, 'l12d': 42.98, 'l12e': 46.44, 'l13': 49.92, 'l13b': 51.55, 'l13c': 53.65, 'l13d': 55.75, 'l14': 59.12}
DUR = 63.35
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
 'l12': 'We thought this bunker | had seven levels.',
 'l12b': 'Then we found | an eighth.',
 'l12c': 'There was only one bed | down there. | Bed 000.',
 'l12d': 'Its door was locked | from the inside.',
 'l12e': 'So we welded | the hatch shut.',
 'l13': 'Pick your spot | in the comments.',
 'l13b': 'By the garden,',
 'l13c': 'next to the armory,',
 'l13d': 'or on B7, | right above bed 000.',
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
for c in caps:
    if c['w'][-1][0] == 'empty.':
        te = c['w'][-1][2]; c['w'].append(['…almost.', te + .35, te + .9]); c['t1'] = max(c['t1'], te + 1.6)
json.dump({'DUR': DUR, 'lines': lines, 'caps': caps}, open(f'{H}/timeline.json', 'w'), indent=1)
json.dump([{'t0': c['t0'], 't1': c['t1'], 'text': ' '.join(x[0] for x in c['w'])} for c in caps], open(os.path.join(os.environ.get('OUT', f'{H}/out'), 'cues.json'), 'w'), indent=1)
print(len(caps), 'captions; last line ends', max(l['t'] + l['d'] for l in lines))
