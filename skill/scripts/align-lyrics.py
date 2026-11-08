#!/usr/bin/env python3
"""Time plain lyrics against a song and write an LRC for the engine.

Adapted from the MIT-licensed paint-mv-skills
(https://github.com/lintsinghua/paint-mv-skills). The original writes SRT;
this version writes the `[mm:ss.xx]line` LRC that this skill reads.

Usage (uv installs faster-whisper on demand):

  uv run --python 3.12 --with faster-whisper --with zhconv python \
    scripts/align-lyrics.py song.mp3 lyrics.txt --out lyrics.lrc --lang zh

  # cache the transcript so re-aligning edited lyrics is fast
  ... --words lyrics.words.json

One sung line per text line. Section markers like [Chorus], (Verse 2), 【副歌】
are skipped. Models download on first use (small ≈0.5 GB, medium ≈1.5 GB).
Set HF_ENDPOINT=https://hf-mirror.com if the download is slow.
"""
import argparse
import difflib
import json
import os
import re
import statistics
import sys

CJK = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]")
MARKER = re.compile(
    r"^\s*(\[[^\]]*\]|\([^)]*\)|【[^】]*】|(verse|chorus|bridge|intro|outro|hook|pre-chorus)\s*\d*\s*:?)\s*$",
    re.I,
)

try:
    from zhconv import convert as _zh

    def simplify(s):
        return _zh(s, "zh-cn")
except ImportError:
    def simplify(s):
        return s


def norm_chars(s):
    s = simplify(s).lower()
    return [c for c in s if CJK.match(c) or c.isalnum()]


def read_lines(path):
    lines = []
    with open(path, encoding="utf-8") as f:
        for raw in f:
            text = raw.strip()
            if not text or MARKER.match(text):
                continue
            if norm_chars(text):
                lines.append(text)
    return lines


def transcribe(audio, model_name, lang, device, hint):
    from faster_whisper import WhisperModel

    model = WhisperModel(
        model_name,
        device=device,
        compute_type="int8" if device in ("cpu", "auto") else "float16",
        cpu_threads=os.cpu_count() or 4,
    )
    segments, info = model.transcribe(
        audio,
        language=lang,
        word_timestamps=True,
        vad_filter=False,
        beam_size=5,
        condition_on_previous_text=False,
        no_speech_threshold=None,
        hotwords=hint,
    )
    words = [(w.start, w.end, w.word) for s in segments for w in (s.words or [])]
    return words, info


def align(lines, words):
    lyric_chars, owner = [], []
    for i, text in enumerate(lines):
        for c in norm_chars(text):
            lyric_chars.append(c)
            owner.append(i)

    heard_chars, heard_at, last = [], [], None
    for start, end, word in words:
        chars = norm_chars(word)
        if not chars or end - start < 0.02 or chars == last:
            continue
        last = chars
        cjk = sum(1 for c in chars if CJK.match(c))
        cap = 0.7 * cjk + (0.4 + 0.1 * (len(chars) - cjk) if len(chars) > cjk else 0)
        start = max(start, end - cap)
        for k, c in enumerate(chars):
            heard_chars.append(c)
            heard_at.append((
                start + (end - start) * k / len(chars),
                start + (end - start) * (k + 1) / len(chars),
            ))

    hit = {}
    for i, j, n in difflib.SequenceMatcher(None, lyric_chars, heard_chars, autojunk=False).get_matching_blocks():
        for k in range(n):
            hit[i + k] = heard_at[j + k]

    durations = [b - a for a, b in hit.values() if b > a]
    char_dur = statistics.median(durations) if durations else 0.25
    first = {}
    for idx, line_no in enumerate(owner):
        first.setdefault(line_no, idx)

    rows = []
    for line_no, text in enumerate(lines):
        first_idx = first[line_no]
        count = sum(1 for o in owner if o == line_no)
        matches = [(k - first_idx, hit[k]) for k in range(first_idx, first_idx + count) if k in hit]
        if matches:
            median = statistics.median(t[0] for _, t in matches)
            matches = [(k, t) for k, t in matches if abs(t[0] - median) < 6]
        coverage = len(matches) / count
        if coverage >= 0.2:
            (k0, t0), (k1, t1) = matches[0], matches[-1]
            if t1[1] - t0[0] < sum(
                0.08 if CJK.match(c) else 0.03
                for c in lyric_chars[first_idx + k0:first_idx + k1 + 1]
            ):
                coverage = 0
        if coverage < 0.2:
            rows.append([None, None, text, coverage])
            continue
        rows.append([
            max(0, t0[0] - k0 * char_dur),
            t1[1] + (count - 1 - k1) * char_dur,
            text,
            coverage,
        ])

    # Unheard lines share the gap between known neighbours by character count.
    i = 0
    while i < len(rows):
        if rows[i][0] is not None:
            i += 1
            continue
        j = i
        while j < len(rows) and rows[j][0] is None:
            j += 1
        a = rows[i - 1][1] if i else 0.0
        b = rows[j][0] if j < len(rows) else a + sum(len(r[2]) for r in rows[i:j]) * char_dur * 1.5
        weights = [len(norm_chars(r[2])) for r in rows[i:j]]
        x = a
        for row, weight in zip(rows[i:j], weights):
            span = (b - a) * weight / max(1, sum(weights))
            row[0], row[1] = x + 0.05, x + span - 0.05
            x += span
        i = j

    for k in range(len(rows)):
        if k and rows[k][0] < rows[k - 1][1] + 0.05:
            rows[k][0] = rows[k - 1][1] + 0.05
        rows[k][1] = max(rows[k][1], rows[k][0] + 0.5)
    for k in range(len(rows) - 1):
        if rows[k][1] > rows[k + 1][0] - 0.05:
            rows[k][1] = max(rows[k][0] + 0.3, rows[k + 1][0] - 0.05)
    return rows


def lrc_time(seconds):
    ms = int(round(max(0, seconds) * 1000))
    return f"[{ms // 60000:02d}:{ms // 1000 % 60:02d}.{ms % 1000 // 10:02d}]"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("audio")
    parser.add_argument("lyrics", help="UTF-8 text, one sung line per line")
    parser.add_argument("--out", default="lyrics.lrc")
    parser.add_argument("--lang", default=None, help="zh, en, ja, ...; detected when omitted")
    parser.add_argument("--model", default="small", help="tiny | base | small | medium | large-v3")
    parser.add_argument("--device", default="auto", help="auto | cpu | cuda")
    parser.add_argument("--prompt", action="store_true", help="hotwords from the lyrics; can mislead on instrumentals")
    parser.add_argument("--words", help="transcript cache JSON")
    args = parser.parse_args()

    lines = read_lines(args.lyrics)
    if not lines:
        sys.exit(f"no lyric lines in {args.lyrics}")

    if args.words and os.path.exists(args.words):
        with open(args.words, encoding="utf-8") as f:
            words = [tuple(w) for w in json.load(f)]
        print(f"reusing {len(words)} transcribed words", file=sys.stderr)
    else:
        hint = " ".join(dict.fromkeys(lines)) if args.prompt else None
        print(f"transcribing {args.audio} with faster-whisper {args.model} ...", file=sys.stderr)
        words, info = transcribe(args.audio, args.model, args.lang, args.device, hint)
        print(f"  language {info.language} ({info.language_probability:.2f}), {len(words)} words", file=sys.stderr)
        if args.words:
            with open(args.words, "w", encoding="utf-8") as f:
                json.dump(words, f, ensure_ascii=False)

    rows = align(lines, words)
    with open(args.out, "w", encoding="utf-8") as f:
        for start, _end, text, _coverage in rows:
            f.write(f"{lrc_time(start)}{text}\n")

    weak = [i for i, row in enumerate(rows) if row[3] < 0.5]
    print(f"{len(rows)} lines -> {args.out}; {len(weak)} weakly heard", file=sys.stderr)
    for i, (start, end, text, coverage) in enumerate(rows):
        flag = "  <- weak" if i in weak else ""
        print(f"  {start:7.2f}-{end:7.2f} {coverage:4.0%} {text}{flag}", file=sys.stderr)


if __name__ == "__main__":
    main()
