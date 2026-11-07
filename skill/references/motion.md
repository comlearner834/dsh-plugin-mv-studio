# Motion, beats and characters

Adapted from the MIT-licensed PDoomVideo / ClaudeAnimationBase approach used
by [claude-mv-skill](https://github.com/Joker-chichi/claude-mv-skill).

## One character, one drawing function

Give every recurring character a single function:

```js
function mei(api, x, y, s, t, mood = 'calm') {
  // head, hair, body, limbs, face; every part uses the same proportions
}
```

All shots call it with position, scale, time and mood. Do not redraw the
character separately in each scene. A character sheet (front, side, close-up,
five expressions) is worth drawing once at the start; it catches off-model
faces before they spread through the video.

Expressions are states, not separate characters:

```js
const MOODS = {
  calm:  { brow: 0.0, eye: 1.0, mouth: 0.15 },
  worried:{ brow: -0.2, eye: 0.8, mouth: -0.15 },
  glad:  { brow: 0.1, eye: 1.1, mouth: 0.5 },
};
```

## Shot "reads"

Before writing a shot, write the timed list of what the viewer must understand:

```text
reads: 0.0 rain on the window · 0.8 she looks up · 1.6 the bus is already leaving
```

If a read does not land in the time available, cut something or move it to the
next line. Do not solve it by slowing the song.

## Motion helpers

The engine now exposes pure functions of time:

| Helper | Use |
|---|---|
| `api.kf(t, [[t0, v0], [t1, v1]], ease)` | Keyframed numbers or arrays |
| `api.spring(t, t0, damping, speed)` | Settles, secondary motion, dangling props |
| `api.jump(t, t0, duration, height)` | A parabola for hops, drops and thrown objects |
| `api.take(t, t0, duration)` | Anticipation / snap-back with overshoot |
| `api.easeIn`, `api.easeOut`, `api.easeInOut`, `api.backOut` | Easing |
| `api.onTwos(t, 12)` | Quantise to a lower drawing rate |
| `api.reseed(key)` | Restart the random stream for one element |

Use `api.reseed('window-frame')` at the start of an independently moving
element when its random details must stay stable while another element moves.
Otherwise one moving object can shift the random stream and make everything
after it jitter every frame.

## Beat grid

Set the song grid in `project.json`:

```json
{ "bpm": 154, "beatOffset": 0.18 }
```

Then scenes can use:

```js
const beat = api.beat();          // beat number at this time
const n = api.beatN();            // integer beat
const hit = api.pulse(6);         // 1 on the beat, decays
api.beatSeconds;                  // 60 / bpm
```

Measure the grid instead of guessing:

```bash
python scripts/beat-grid.py song.mp3 --from=0 --to=90 --lrc=song.lrc
```

If `ffmpeg` is not on `PATH`, add `--ffmpeg=/path/to/ffmpeg` (or set
`FFMPEG_PATH`). It prints BPM, a beat time and each LRC line's beat index. For a ballad, use
the half-time pulse in `project.bpm` so idles do not look frantic.

## Word karaoke

Enhanced LRC word tags (`<mm:ss.xx>`) are parsed into `line.words`. When word
timings exist, the lyric wipe follows the current word instead of the whole
line. Use them for fast lines; plain LRC still works unchanged.

## Close-up review

A full-frame contact sheet hides faces and hands. Crop the frames that carry
the read:

```bash
ffmpeg -i build/review/01-window/frames/00016.png \
  -vf "crop=360:300:460:110,scale=720:-1" review-face.png
```

For a motion strip, tile consecutive frames:

```bash
ffmpeg -framerate 8 -start_number 13 -i build/review/01-window/frames/%05d.png \
  -frames:v 1 -vf "select='between(n,0,7)',scale=320:-1,tile=8x1" review-strip.jpg
```

Inspect the sheet, at least one full frame, one face/hand crop, and the first
and last frame of every shot. That is the review bar; a pretty sheet alone is
not enough.

## Long videos

- One idea and one recurring motif for the whole piece.
- One chapter per song section; one scene file per chapter.
- One shot per lyric line, usually 1.4–4 s.
- Shared characters and props live in files chapter authors do not edit.
- Render chapter seams and check palette, character scale and screen direction.
