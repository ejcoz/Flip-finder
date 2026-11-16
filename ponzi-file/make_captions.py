"""words.json + VOICE → captions.js (2–4 word cards, digits shown) and out/cues.json for the .srt"""
import os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
W = json.load(open(os.path.join(HERE, 'voice', 'words.json')))
src = open(os.path.join(HERE, 'timeline.js')).read()
VOICE = json.loads(re.search(r'export const VOICE = (\{.*?\});', src).group(1))
END = json.loads(re.search(r'export const T = (\{.*?\});', src, re.S).group(1))['end']
DUR = json.load(open(os.path.join(HERE, 'voice', 'dur.json')))
# (line, number of ASR tokens, display text, keyword)
CHUNKS = [
 ('l1', 2, 'In 1920,', '1920'), ('l1', 3, 'one man promised', ''), ('l1', 4, 'to grow your money', 'money'),
 ('l1', 3, 'by 50%', '50%'), ('l1', 3, 'in 45 days.', '45 days'),
 ('l2', 3, 'Charles Ponzi said', 'Ponzi'), ('l2', 3, 'he was trading', ''), ('l2', 3, 'international postal coupons.', 'postal coupons'),
 ('l3', 2, "He wasn't.", "wasn't"),
 ('l4', 4, 'He paid early investors', 'early investors'), ('l4', 3, 'with money from', 'money'), ('l4', 2, 'new ones,', 'new ones'),
 ('l4', 3, 'and the crowds', 'crowds'), ('l4', 2, 'kept coming.', ''),
 ('l5', 3, 'When reporters checked,', 'reporters'), ('l5', 4, "there weren't enough coupons", 'enough coupons'),
 ('l5', 3, 'in the world', 'world'), ('l5', 3, 'to cover it.', ''),
 ('l6', 3, 'The scheme collapsed', 'collapsed'), ('l6', 2, 'in August,', 'August'), ('l6', 4, 'and it still carries', ''), ('l6', 2, 'his name.', 'his name'),
]
idx = {k: 0 for k in W}; cards = []
for ln, n, text, kw in CHUNKS:
    toks = W[ln][idx[ln]:idx[ln] + n]; assert len(toks) == n, (ln, text)
    idx[ln] += n
    t0 = VOICE[ln] + max(0.0, toks[0][1]); t1w = VOICE[ln] + toks[-1][2]
    cards.append({'t0': round(t0 - .05, 3), 'tw': round(t1w, 3), 'text': text, 'kw': kw, 'line': ln})
for k in W: assert idx[k] == len(W[k]), ('unused tokens', k, idx[k], len(W[k]))
# each card holds until the next one starts (or its line ends + 0.5 s, whichever is first after a pause)
for i, c in enumerate(cards):
    lineEnd = VOICE[c['line']] + DUR[c['line']]
    nxt = cards[i + 1]['t0'] if i + 1 < len(cards) else 99
    c['t1'] = round(min(nxt, max(c['tw'] + .35, lineEnd + .45)), 3) if cards[i + 1:] and cards[i + 1]['line'] == c['line'] else round(min(nxt - .02, lineEnd + .55), 3)
cards[-1]['t1'] = END
open(os.path.join(HERE, 'captions.js'), 'w').write('export const CARDS = ' + json.dumps(cards, indent=1) + ';\n')
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump([{'t0': c['t0'], 't1': c['t1'], 'text': c['text']} for c in cards], open(os.path.join(HERE, 'out', 'cues.json'), 'w'), indent=1)
for c in cards: print(f"{c['t0']:6.2f} {c['t1']:6.2f} {c['t1']-c['t0']:4.2f}  {c['text']}")
