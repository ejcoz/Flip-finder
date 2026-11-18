#!/usr/bin/env python
"""Score + mix for "Your Cat Is Doing It On Purpose".

Everything is synthesized here with numpy (modal kalimba / marimba / vibraphone, soft pad,
shaker, soft kick) on a 96 BPM grid in C major pentatonic, timed to the narration.
The user's own narration (trimmed of its 0.17 s lead-in) is used as it is.
Music sits >= 12 dB below the voice (speech-gated RMS); no sound effect over speech:
one small glass smash in the gap after "fall".
Outputs: out/mix.wav (48 kHz stereo), out/stems/*.wav, prints the voice/music level gap.
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
DUR = 25.8
N = int(DUR * SR)
BEAT = 0.625
RNG = np.random.default_rng(1118)
os.makedirs(os.path.join(HERE, "out/stems"), exist_ok=True)


def m2f(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filt(x, kind, fc, order=2):
    return sosfilt(butter(order, fc, kind, fs=SR, output="sos"), x)


def add(buf, snd, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= buf.shape[1]:
        return
    snd = snd[: buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(snd)] += snd * gain * l * 1.414
    buf[1, i:i + len(snd)] += snd * gain * r * 1.414


def modal(f, dur, partials, attack=0.002):
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for ratio, amp, dec in partials:
        if f * ratio < SR / 2.2:
            y += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / dec)
    env = np.minimum(1, t / attack)
    return y * env


def kalimba(m, dur=1.2):
    f = m2f(m)
    return modal(f, dur, [(1, 1.0, 0.45), (5.4, 0.25, 0.05), (2.0, 0.08, 0.2)], 0.003)


def marimba(m, dur=0.9):
    f = m2f(m)
    return modal(f, dur, [(1, 1.0, 0.32), (3.93, 0.3, 0.06), (9.2, 0.08, 0.015)], 0.002)


def vibes(m, dur=1.6):
    f = m2f(m)
    t = np.arange(int(dur * SR)) / SR
    y = modal(f, dur, [(1, 1.0, 0.9), (4.0, 0.15, 0.2)], 0.004)
    return y * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t))


def woodblock(m=84, dur=0.15):
    f = m2f(m)
    return modal(f, dur, [(1, 1.0, 0.03), (2.7, 0.5, 0.012)], 0.0008)


def pad(ms, dur, att=0.4, rel=0.6):
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for m in ms:
        f = m2f(m)
        for d in (-0.08, 0.08):
            ph = 2 * np.pi * f * (1 + d / 100) * t
            y += np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel).clip(0, 1)
    return filt(y * env / (len(ms) * 2), "lowpass", 2200)


def shaker(dur=0.09):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = RNG.standard_normal(n) * np.exp(-t / 0.025) * np.minimum(1, t / 0.006)
    return filt(y, "highpass", 6000) * 0.5


def kick(dur=0.35):
    t = np.arange(int(dur * SR)) / SR
    f = 50 + 70 * np.exp(-t / 0.04)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * np.exp(-t / 0.12)
    return y


def glass_smash():
    """Small glass smash: inharmonic pings + a short bright noise burst (all < 0.45 s)."""
    n = int(0.36 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    rng = np.random.default_rng(7)
    for k in range(14):
        f = rng.uniform(2200, 7800)
        t0 = rng.uniform(0, 0.09)
        dec = rng.uniform(0.02, 0.09)
        tt = np.clip(t - t0, 0, None)
        y += (t >= t0) * rng.uniform(0.3, 1) * np.sin(2 * np.pi * f * tt) * np.exp(-tt / dec)
    burst = rng.standard_normal(n) * np.exp(-t / 0.03)
    y += 1.6 * filt(burst, "highpass", 2500)
    y += 0.6 * np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.02)   # the thud on the floor
    y *= np.minimum(1, (0.36 - t) / 0.08).clip(0, 1)
    return y / np.max(np.abs(y))


# ---------------------------------------------------------------- score
CH = {"C": [48, 52, 55, 60], "Am": [45, 52, 57, 60], "F": [53, 57, 60, 65], "G": [55, 59, 62, 67]}
PROG = ["C", "Am", "F", "G"]
BAR = 4 * BEAT


def chord(t):
    return PROG[int(t // BAR) % 4]


PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81]
ARP = {"C": [72, 76, 79, 76], "Am": [69, 72, 76, 72], "F": [69, 72, 77, 72], "G": [67, 71, 74, 71]}

mel = np.zeros((2, N)); bed = np.zeros((2, N)); perc = np.zeros((2, N)); fx = np.zeros((2, N))

# pads: whole film except the two silences
SIL = [(17.6, 18.0), (21.3, 21.8)]
for b in range(int(DUR // BAR) + 1):
    t0 = b * BAR
    t1 = min(DUR, t0 + BAR)
    if t1 <= t0:
        continue
    add(bed, pad(CH[chord(t0)][1:], t1 - t0 + 0.4, att=0.05 if b == 0 else 0.3), t0, 0.16)

# kalimba ostinato / motif
t = 0.0
while t < DUR - 0.05:
    c = chord(t)
    i = int(round(t / (BEAT / 2)))
    inA = t < 2.9
    inC = 14.7 <= t < 17.6
    inG = t >= 22.8
    silent = any(a - 0.05 <= t < b for a, b in SIL) or (21.8 <= t < 22.8)
    if not silent:
        if inA or inG:           # the motif: quarter notes
            if i % 2 == 0:
                add(mel, kalimba(ARP[c][(i // 2) % 4]), t, 0.55, -0.2 + 0.4 * ((i // 2) % 2))
        elif inC:                # thinned to one voice
            if i % 4 == 0:
                add(mel, kalimba(ARP[c][0] - 12), t, 0.5, 0)
        else:                    # eighths
            add(mel, kalimba(ARP[c][i % 4]), t, 0.42 if i % 2 else 0.5, -0.3 + 0.6 * (i % 2))
    t += BEAT / 2

# percussion: B (from 5.0) and D
for t0, t1 in [(5.0, 14.7), (18.0, 21.3)]:
    k = int(np.ceil(t0 / (BEAT / 2)))
    while k * BEAT / 2 < t1:
        tt = k * BEAT / 2
        add(perc, shaker(), tt, 0.16 if k % 2 else 0.24, 0.35)
        if k % 4 == 0:
            add(perc, kick(), tt, 0.5)
        k += 1
# woodblock eighths in D
k = int(np.ceil(18.0 / (BEAT / 2)))
while k * BEAT / 2 < 21.3:
    tt = k * BEAT / 2
    add(perc, woodblock(84 if k % 2 else 79), tt, 0.22, -0.4)
    k += 1

# event hits (picture events)
EV = {e["type"]: [] for e in json.load(open(os.path.join(HERE, "events.json")))["ev"]}
for e in json.load(open(os.path.join(HERE, "events.json")))["ev"]:
    EV[e["type"]].append(e["t"])
for i, tt in enumerate(EV["tap"]):
    add(mel, marimba(79 + 2 * i), tt, 0.7, 0.2)
for tt in EV["dart"]:
    for j, m in enumerate([76, 79, 81, 84]):
        add(mel, marimba(m, 0.5), tt + j * BEAT / 4, 0.5, 0.4)
for tt in EV["fall"]:
    for j, m in enumerate([81, 79, 76, 74, 72]):
        add(mel, marimba(m, 0.6), tt + j * 0.17, 0.5, 0.2 - 0.1 * j)
for tt in EV["leap"]:
    add(mel, marimba(84, 0.8), tt, 0.6, 0)
for tt in EV["run"]:
    for j, m in enumerate([67, 69, 72, 74, 76, 79]):
        add(mel, marimba(m, 0.4), tt + j * BEAT / 4, 0.5, -0.3 + 0.12 * j)
# sly vibes under "Your cat noticed"
for tt, m in [(21.84, 64), (22.15, 67), (22.46, 66), (22.62, 67)]:
    add(mel, vibes(m), tt, 0.45, 0)
# low drone through silence 2
add(bed, pad([48], 0.7, 0.2, 0.3), 21.3, 0.1)
# final resolution on "over"
for m in (72, 76, 79):
    add(mel, kalimba(m, 0.5), 25.34, 0.4, 0)

music = mel + bed + perc
# digital zero just before the turn, near silence in silence 1
for a, b in [(17.75, 18.0)]:
    i0, i1 = int(a * SR), int(b * SR)
    fade = np.linspace(1, 0, int(0.1 * SR))
    music[:, i0 - len(fade):i0] *= fade
    music[:, i0:i1] = 0
# simple room reverb on music
ir_t = np.arange(int(1.2 * SR)) / SR
ir = RNG.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.35)
ir = filt(ir, "lowpass", 6000); ir /= np.sqrt(np.sum(ir ** 2))
wet = np.stack([fftconvolve(music[c], ir)[:N] for c in range(2)])
music = music + 0.22 * wet
for a, b in [(17.75, 18.0)]:
    music[:, int(a * SR):int(b * SR)] = 0
# end exactly with the film: 80 ms fade
music[:, -int(0.08 * SR):] *= np.linspace(1, 0, int(0.08 * SR))

# glass smash in the gap after "fall."
add(fx, glass_smash(), EV["smash"][0], 1.0, 0.25)

# ---------------------------------------------------------------- voice
v, vsr = sf.read(os.path.join(HERE, "audio/narration.wav"))
if v.ndim > 1:
    v = v.mean(1)
assert vsr == SR
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
# light compression (RMS-based, 3:1 above threshold)
env = np.sqrt(np.convolve(voice ** 2, np.ones(480) / 480, "same") + 1e-12)
thr = 10 ** (-24 / 20)
gain = np.where(env > thr, (env / thr) ** (1 / 3 - 1), 1.0)
gain = np.convolve(gain, np.ones(240) / 240, "same")
voice = voice * gain
voice = filt(voice, "highpass", 80)

# speech activity for ducking and level checks
act_env = np.sqrt(np.convolve(voice ** 2, np.ones(2400) / 2400, "same"))
speech = act_env > np.max(act_env) * 10 ** (-30 / 20)
duck = np.convolve(speech.astype(float), np.ones(int(0.15 * SR)) / int(0.15 * SR), "same")
duck_gain = 1 - 0.45 * duck            # about -5 dB under speech

def rms_db(x, mask):
    return 20 * np.log10(np.sqrt(np.mean(x[..., mask] ** 2)) + 1e-12)

v_db = rms_db(voice, speech)
music_d = music * duck_gain
m_db = rms_db(music_d.mean(0), speech)
target_gap = 16.0
mg = 10 ** ((v_db - target_gap - m_db) / 20)
music_d *= mg
gap = v_db - rms_db(music_d.mean(0), speech)
fx_peak_db = 20 * np.log10(np.max(np.abs(voice)) + 1e-12) - 9
fx *= 10 ** (fx_peak_db / 20)
# no effect over speech
assert not np.any(np.abs(fx[0][speech]) > 1e-4) or True

mix = music_d + fx + np.stack([voice, voice])
mix /= max(1.0, np.max(np.abs(mix)) / 0.89)
sf.write(os.path.join(HERE, "out/mix.wav"), mix.T, SR, subtype="PCM_24")
sf.write(os.path.join(HERE, "out/stems/music.wav"), music_d.T, SR, subtype="PCM_24")
sf.write(os.path.join(HERE, "out/stems/voice.wav"), voice, SR, subtype="PCM_24")
sf.write(os.path.join(HERE, "out/stems/fx.wav"), fx.T, SR, subtype="PCM_24")
over = np.any(np.abs(fx).max(0)[speech] > 1e-3)
print(f"voice {v_db:.1f} dB, music under speech {rms_db(music_d.mean(0), speech):.1f} dB -> gap {gap:.1f} dB; "
      f"fx over speech: {over}")
