"""Subtitles from the page's voice placements: python make_srt.py <events.json> <lines.json> <voice/dur.json> <cues.json>"""
import json, sys
ev, lines, dur = (json.load(open(p)) for p in sys.argv[1:4])
DISPLAY = {'l06': 'A UK study found over 86% of dogs near people at night chose to be close.'}   # digits on screen; the recording says the number in words
vo = [e for e in ev['ev'] if e['type'] == 'vo']
cues = []
for i, e in enumerate(vo):
    t1 = vo[i + 1]['t'] - 0.05 if i + 1 < len(vo) else e['t'] + dur[e['id']] + 1.5
    text = DISPLAY.get(e['id']) or next(l['text'] for l in lines if l['id'] == e['id'])
    cues.append({'t0': round(e['t'], 3), 't1': round(t1, 3), 'text': text})
json.dump(cues, open(sys.argv[4], 'w'), indent=1)
