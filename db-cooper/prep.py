"""Caption cues from the user's script + faster-whisper word timings.

Each chunk is [caption text, number of whisper tokens it covers, keyword(s) to highlight].
Caption text follows the user's script word for word (numbers as digits); whisper only supplies timing.
Writes cues.js (for the page), cues.json and db-cooper.srt.
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
W = json.load(open(os.path.join(HERE, 'out/words.json')))

CH = [
    ["A passenger hijacked", 3, ""], ["a plane,", 2, "plane"], ["collected his ransom,", 3, "ransom"],
    ["and jumped out", 3, "jumped"], ["the back.", 2, ""],
    ["The day before Thanksgiving", 4, "Thanksgiving"], ["in 1971", 2, "1971"],
    ["a man calling himself", 4, ""], ["Dan Cooper", 2, "Dan Cooper"],
    ["handed a flight attendant", 4, ""], ["a note.", 2, "note"],
    ["It said he had", 4, ""], ["a bomb.", 2, "bomb"],
    ["In Seattle", 2, "Seattle"], ["he traded the passengers", 4, ""],
    ["for $200,000", 3, "$200,000"], ["and 4 parachutes,", 3, "4 parachutes"],
    ["then ordered the plane", 4, ""], ["toward Mexico.", 2, "Mexico"],
    ["Somewhere over", 2, ""], ["Washington, he lowered", 3, "Washington"], ["the rear stairs", 3, "rear stairs"],
    ["and jumped into", 3, "jumped"], ["the dark.", 2, "dark"],
    ["He was never", 3, "never"], ["seen again.", 2, ""],
    ["9 years later,", 3, "9 years"], ["a boy digging", 3, ""], ["on a riverbank", 3, "riverbank"],
    ["found bundles", 2, "bundles"], ["of the ransom", 3, "ransom"], ["in the sand.", 3, "sand"],
    ["The rest of", 3, ""], ["the money has never", 4, "money"], ["turned up.", 2, ""],
    ["Neither has he.", 3, "he"],
]
SCRIPT = ("A passenger hijacked a plane, collected his ransom, and jumped out the back. The day before Thanksgiving in "
          "nineteen seventy one a man calling himself Dan Cooper handed a flight attendant a note. It said he had a bomb. "
          "In Seattle he traded the passengers for two hundred thousand dollars and four parachutes, then ordered the plane "
          "toward Mexico. Somewhere over Washington, he lowered the rear stairs and jumped into the dark. He was never seen "
          "again. Nine years later a boy digging on a riverbank found bundles of the ransom in the sand. The rest of the "
          "money has never turned up. Neither has he.")

assert sum(c[1] for c in CH) == len(W), (sum(c[1] for c in CH), len(W))
# word-for-word check against the script (numbers spelled back out)
spell = {"1971": "nineteen seventy one", "$200,000": "two hundred thousand dollars", "4": "four", "9": "nine"}
norm = lambda s: re.sub(r"[^a-z ]", "", s.lower()).split()
cap_words = " ".join(" ".join(spell.get(w, w) for w in re.sub(r",(\s|$)", r" \1", c[0]).split()) for c in CH)
assert norm(cap_words) == norm(SCRIPT), "captions drift from the script"

cues, i = [], 0
for text, n, kw in CH:
    toks = W[i:i + n]; i += n
    cues.append({"t0": round(max(0.0, toks[0]["t0"] - 0.04), 3), "end": toks[-1]["t1"], "text": text, "kw": kw})
for k, c in enumerate(cues):
    nxt = cues[k + 1]["t0"] if k + 1 < len(cues) else None
    hold = c["end"] + 0.35
    c["t1"] = round(min(hold, nxt) if nxt is not None and nxt - c["end"] < 0.8 else (nxt if nxt and nxt < hold else hold), 3)
    if nxt is not None and nxt - c["end"] < 0.8: c["t1"] = round(nxt, 3)
    del c["end"]
cues[-1]["t1"] = 36.15
open(os.path.join(HERE, 'cues.js'), 'w').write('window.CUES = ' + json.dumps(cues) + ';\n')
json.dump([{"t0": c["t0"], "t1": c["t1"], "text": c["text"]} for c in cues], open(os.path.join(HERE, 'cues.json'), 'w'), indent=1)
print(len(cues), 'cues; shortest', min(c["t1"] - c["t0"] for c in cues))
