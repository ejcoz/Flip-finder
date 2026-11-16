"""Write alcatraz-escape.srt from the caption cards the page exports (events.json → caps)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
caps = [{'t0': e['t'], 't1': e['t1'], 'text': e['text']} for e in json.load(open(os.path.join(HERE, 'events.json')))['ev'] if e['type'] == 'cap']
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
with open(os.path.join(HERE, 'alcatraz-escape.srt'), 'w') as f:
    for i, c in enumerate(caps, 1): f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n\n")
print(len(caps), 'cues')
