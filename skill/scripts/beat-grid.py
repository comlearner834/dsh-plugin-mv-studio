#!/usr/bin/env python3
"""Tempo, beat phase, and LRC-line positions for a song.

Adapted from the MIT-licensed painted-animation skill:
https://github.com/Joker-chichi/claude-mv-skill

Usage:
  python scripts/beat-grid.py song.mp3 --from=0 --to=60 --lrc=song.lrc

Requires ffmpeg on PATH (or FFMPEG_PATH) and numpy.
Prints BPM, a beat time near --from, and each LRC line's beat index.
"""
import os
import re
import subprocess
import sys

import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

args = dict(a.lstrip("-").split("=", 1) if "=" in a else (a, True) for a in sys.argv[2:])
src = sys.argv[1]
t0 = float(args.get("from", 0))
t1 = float(args.get("to", 0)) or None
sr, hop, win = 22050, 128, 2048
ffmpeg = args.get("ffmpeg") or os.environ.get("FFMPEG_PATH") or "ffmpeg"
cmd = [ffmpeg, "-v", "error", "-ss", str(t0)]
if t1:
    cmd += ["-t", str(t1 - t0)]
cmd += ["-i", src, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)
if x.size < win * 2:
    raise SystemExit("audio is too short to measure")

# spectral-flux onset envelope
frames = np.lib.stride_tricks.sliding_window_view(x, win)[::hop]
spectrum = np.log1p(np.abs(np.fft.rfft(frames * np.hanning(win), axis=1)))
flux = np.maximum(0, np.diff(spectrum, axis=0)).sum(1)
flux = np.maximum(flux - np.convolve(flux, np.ones(64) / 64, "same"), 0)
fps = sr / hop

# tempo: interpolated autocorrelation peak between 70 and 170 BPM
ac = np.correlate(flux, flux, "full")[len(flux) - 1:]


def score(bpm):
    lag = fps * 60 / bpm
    whole = int(lag)
    frac = lag - whole
    return ac[whole] * (1 - frac) + ac[whole + 1] * frac


bpm = max(np.arange(70, 170, 0.05), key=score)
beat = 60 / bpm


def comb(phase):
    idx = (np.arange(phase, len(flux) / fps, beat) * fps).astype(int)
    return flux[idx[idx < len(flux)]].sum()


phase = max(np.arange(0, beat, 0.005), key=comb)
first = t0 + phase
print(f"bpm {bpm:.2f}  (half-time {bpm / 2:.3f})   beat {beat:.4f} s   a beat at {first:.3f} s")

if "lrc" in args:
    for line in open(args["lrc"], encoding="utf-8"):
        match = re.match(r"\[(\d+):(\d+(?:\.\d+)?)\](.*)", line.strip())
        if not match:
            continue
        at = int(match[1]) * 60 + float(match[2])
        print(f"{at:8.2f}  beat {(at - first) / beat:7.2f}  {match[3]}")
