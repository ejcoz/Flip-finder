"""captions (from events.json) → subtitles_en.srt"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ['LIB']
ev = json.load(open(os.path.join(HERE, 'events.json')))
cues = [{'t0': e['t'], 't1': e['t1'], 'text': e['text']} for e in ev['ev'] if e['type'] == 'cap']
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), indent=1)
subprocess.run([sys.executable, os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'subtitles_en.srt')], check=True)
