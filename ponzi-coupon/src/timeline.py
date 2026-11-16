"""Timeline: narration starts and subtitle cues -> timeline.json (page, mix, srt) and src/cues.json (subtitle slips to bake).
Run: python src/timeline.py"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
DUR = 35.5
VO = {'L1': 0.5, 'L2': 4.9, 'L3': 10.4, 'L4': 15.0, 'L5': 19.4, 'L6': 24.0, 'L7': 30.4}
dur = json.load(open(os.path.join(ROOT, 'voice', 'dur.json')))
CUES = [  # (line, offset within the line, text)
    ('L1', 0.0, 'In 1920, a Boston clerk found a loophole in the mail.'),
    ('L2', 0.0, 'Buy this postal coupon in Italy for pennies.'),
    ('L2', 2.85, 'Trade it in America for stamps worth more.'),
    ('L3', 0.0, 'Charles Ponzi promised investors 50% in 45 days.'),
    ('L4', 0.0, 'By summer, a quarter million dollars poured in every day.'),
    ('L5', 0.0, 'But he barely bought any coupons.'),
    ('L5', 2.15, 'New money paid old investors.'),
    ('L6', 0.0, 'His promises needed 160 million coupons.'),
    ('L6', 3.75, 'About 27,000 existed.'),
    ('L7', 0.0, 'By August, it collapsed.'),
    ('L7', 1.85, 'The scheme still bears his name.'),
]
cues = []
for i, (lid, off, en) in enumerate(CUES):
    t0 = VO[lid] + off
    nxt = [VO[c[0]] + c[1] for c in CUES[i + 1:]]
    end = VO[lid] + dur[lid]
    if i + 1 < len(CUES) and CUES[i + 1][0] == lid:
        t1 = VO[lid] + CUES[i + 1][1] - 0.04
    else:
        t1 = min(nxt[0] - 0.08 if nxt else DUR, max(end + 0.6, t0 + 1.8))
    cues.append(dict(t0=round(t0, 2), t1=round(t1, 2), en=en))
json.dump([dict(en=c['en']) for c in cues], open(os.path.join(HERE, 'cues.json'), 'w'), indent=1)
json.dump(dict(dur=DUR, vo={k: [v, dur[k]] for k, v in VO.items()}, cues=cues), open(os.path.join(ROOT, 'timeline.json'), 'w'), indent=1)
for c in cues: print(f"{c['t0']:6.2f}-{c['t1']:6.2f} {c['t1']-c['t0']:4.2f}  {c['en']}")
