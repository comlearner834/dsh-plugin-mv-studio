# Plain lyrics → LRC

If the user has a song and plain text lyrics but no LRC, align them locally:

```bash
uv run --python 3.12 --with faster-whisper --with zhconv python \
  scripts/align-lyrics.py song.mp3 lyrics.txt \
  --out lyrics.lrc --lang zh --words lyrics.words.json
```

It transcribes with word timestamps, matches the known lyric characters to the
transcript, and writes `[mm:ss.xx]line` LRC. The transcript cache makes
re-aligning edited text fast. Models download locally on first use; no cloud
service is called.

- One sung line per text line.
- Section labels such as `[Chorus]`, `(Verse 2)`, `【副歌】` are skipped.
- Weakly heard lines are printed with `<- weak`; listen to them and fix the LRC
  before storyboarding. Do not trust a timing you did not hear.
- This is speech recognition, not an image/video generation model.
- If `uv` or the model is unavailable, fall back to a supplied LRC or a manual
  timing pass; do not invent timestamps.

The result is a normal `lyrics/*.lrc`; set `project.lyrics.file` to it.
