# LRC and lyric sync

## Supported formats

Plain LRC:

```lrc
[ti:纸月亮]
[ar:Paper Engine]
[offset:0]
[00:00.80]纸月亮 挂在窗上
[00:05.20]我把夜晚 折成一只船
```

Enhanced LRC with word times:

```lrc
[00:05.20]<00:05.20>我<00:05.70>把<00:06.10>夜晚<00:06.80>折成<00:07.30>一只船
```

Multiple timestamps per line are supported; each timestamp creates a lyric
line. `[offset:]` is read and combined with `project.lyrics.offsetMs` (both in
milliseconds).

## Project config

```json
"audio": { "file": "audio/song.mp3", "startAt": 0, "gainDb": -1.5 },
"lyrics": {
  "file": "lyrics/song.lrc",
  "enabled": true,
  "offsetMs": 0,
  "style": "wipe",
  "size": 40,
  "bottom": 0.84,
  "color": "#f7efdf",
  "strokeColor": "rgba(34,26,19,0.56)",
  "strokeWidth": 3.2,
  "maxHold": 6.5
}
```

- `audio.startAt`: seconds into the video where the song begins. A 2 s cold
  open means `audio.startAt = 2`; lyrics still use song time.
- `lyrics.offsetMs`: positive shifts lyrics later. Use ±80–200 ms to correct a
  consistent early/late feel; do not randomize per line.
- `maxHold`: how long a line may stay after its timestamp when the next line
  is far away. The engine also clamps the final line to the video end.
- `bottom`: 0..1 position of the baseline; 0.84 is the safe lower third.
- `style`: `"wipe"` (default) or `"fade"`. When enhanced word tags are present,
  `wipe` follows the current word, not the whole line.

## Timing model

`shot.start` is computed from the sum of previous shot durations. At local time
`t`:

```text
videoTime = shot.start + t
songTime  = videoTime - audio.startAt + lyrics.offsetMs / 1000
```

The page fetches `/project.json` and the LRC, parses them at load, and looks up
the active line per frame. Scenes receive `api.lyric`:

```js
{
  index, count,
  start, end,
  progress, alpha,
  wordIndex, wordProgress,
  text,
  line: { time, text, words }
}
```

## Sync checks

1. Run `node render.mjs review --shot <id>` for the shot that contains the
   first vocal. Open frames around the line entry; the first glyph should
   appear within one review frame (125 ms at 8 fps).
2. Check the final line. The engine clamps the last line to the video end, so
   its wipe should finish, not stop halfway.
3. If the whole song is consistently late, set `offsetMs` once. If only one
   line drifts, fix the LRC timestamp.
4. If lyrics are cut off at the bottom, lower `size` or move `bottom` to 0.82.
5. If a lyric sits on a bright bus/sun, keep the dark keyline and a faint
   shadow; never switch to white text without a keyline.

## Common LRC errors

| Symptom | Cause |
|---|---|
| Nothing appears | `[lyrics].enabled` false, wrong file path, or no timestamps |
| All lines appear at once | Timestamps missing `mm:ss.xx` brackets |
| Offset wrong by minutes | `[offset:600]` is milliseconds, not seconds |
| Chinese garbled | File is GBK/Big5, not UTF-8 |
| Word wipe jumps | Enhanced tags are not monotonically increasing; with word tags the wipe now ends on the current word |
| Line disappears too early | `maxHold` is shorter than the phrase |
