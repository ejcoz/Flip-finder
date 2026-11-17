from faster_whisper import WhisperModel
import json
m=WhisperModel('small.en',compute_type='int8')
segs,_=m.transcribe('voice/narration.wav',word_timestamps=True,language='en',initial_prompt='Baker Street, Lloyds bank, Robert Rowlands, walkie-talkie.')
W=[]
for s in segs:
  for w in s.words: W.append(dict(w=w.word.strip(),t0=round(w.start,3),t1=round(w.end,3)))
json.dump(W,open('voice/words_raw.json','w'),indent=0)
print(' '.join(f"{x['w']}[{x['t0']}-{x['t1']}]" for x in W))
