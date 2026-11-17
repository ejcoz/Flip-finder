from faster_whisper import WhisperModel
import json,sys
m=WhisperModel("base.en",compute_type="int8")
segs,_=m.transcribe("voice/narration.wav",word_timestamps=True,language="en")
W=[]
for s in segs:
    for w in s.words: W.append({"w":w.word.strip(),"t0":round(w.start,3),"t1":round(w.end,3)})
json.dump(W,open("out/words.json","w"),indent=0)
print(" ".join(f'{x["w"]}[{x["t0"]}-{x["t1"]}]' for x in W))
