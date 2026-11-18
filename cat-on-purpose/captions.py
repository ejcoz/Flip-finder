"""Build caption cues (2-4 words) from the narration's word timings -> cues.json + subtitles_en.srt"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = ("Your cat isn't | knocking things off | the table | by accident. | That slow push | with one paw | "
          "is the same move | cats use on prey. | Tap it, and see | if it runs. | Then they watch | it fall. | "
          "Motion switches on | the hunter | in their brain. | But cat behaviorists | say there's | a second reason. | "
          "The first time | it happened, | you jumped up, shouted, | and came running. | Your cat noticed. | "
          "Now every glass | on the edge | is a way | to call you over.")
chunks = [c.strip() for c in SCRIPT.split("|")]
W = json.load(open(os.path.join(HERE, "audio/words.json")))
norm = lambda s: re.sub(r"[^a-z']", "", s.lower())
i, cues = 0, []
for c in chunks:
    toks = c.split()
    ws = W[i:i + len(toks)]
    assert [norm(w["w"]) for w in ws] == [norm(t) for t in toks], (c, [w["w"] for w in ws])
    cues.append({"text": c, "t0": ws[0]["t0"], "end": ws[-1]["t1"]})
    i += len(toks)
assert i == len(W)
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 25.8
for k, q in enumerate(cues):
    q["t0"] = max(0.0, round(q["t0"] - 0.06, 3))
for k, q in enumerate(cues):
    nxt = cues[k + 1]["t0"] if k + 1 < len(cues) else DUR
    q["t1"] = round(min(nxt, q["end"] + 0.45), 3) if k + 1 < len(cues) else DUR
    del q["end"]
cues[0]["t0"] = 0.0
json.dump(cues, open(os.path.join(HERE, "cues.json"), "w"), indent=1)
lib = os.environ.get("LIB", "/root/lemo-opuscar")
subprocess.run([os.path.join(lib, ".venv/bin/python"), os.path.join(lib, "core/render/srt.py"),
                os.path.join(HERE, "cues.json"), os.path.join(HERE, "subtitles_en.srt")], check=True)
print(len(cues), "cues")
