# Workflow and gates

## The gate diagram

```text
describe video
   |
   +-- one optional question (direction; MV: audio + LRC in same message)
   v
scaffold project -> doctor -> check
   v
storyboard (3 keyframes/shot)
   |
   +-- inspect sheet, fix, show user, ask "这个分镜可以吗？"
   v
per-shot review (8 fps, half res)
   |
   +-- inspect sheet + full-size frame -> verdict pass/fail
   |        ^                                  |
   |        +---------- fix scene <-----------+
   v
all shots pass
   v
ASK: local render or stop   [no default, no cloud]
   |
   +-- explicit local choice -> approve --mode local --quote "..."
   v
final frames (full res, clean) -> final sheets
   |
   +-- inspect every sheet -> final-verdict pass/fail
   v
final --encode -> MP4 + SRT + manifest
```

## Who approves what

| Gate | Who | Artifact |
|---|---|---|
| Creative direction | User, once, optional | One sentence or default |
| Storyboard | User looks; agent fixes | `build/storyboard/sheet-*.jpg` |
| Each shot draft | Agent inspects rendered frames | `reviews/<shot>.json` |
| Full render choice | **User explicitly** | `approval.json` with quote |
| Each final shot | Agent inspects clean frames | `reviews/final-<shot>.json` |
| Encode | `render.mjs` checks all hashes | `output/<slug>.mp4` |

The agent may not skip a gate because it is "obvious" or because time is short.

## Storyboard JSON

`project.json`:

```json
{
  "shots": [
    {
      "id": "01-window",
      "scene": "window",
      "title": "窗",
      "summary": "黄昏的窗，纸月亮，屋里的人还没有起身。",
      "duration": 4,
      "seed": 101,
      "keyframes": [0.16, 0.5, 0.84]
    }
  ]
}
```

- `id`: ASCII, unique, used in file paths and verdicts.
- `scene`: key exported by `scenes/index.js`.
- `duration`: seconds; `duration * fps` must be an integer.
- `seed`: unique integer; drives brush texture and boil.
- `keyframes`: relative 0..1 positions sampled for the storyboard.

## Shot grammar

For a 3-shot / 12 s demo:

1. **Establish** (0–4 s): where are we, what is the light, what is the want?
2. **Move** (4–8 s): the figure/vehicle/weather changes the situation.
3. **Resolve** (8–12 s): a small arrival, not a plot twist.

For a 60–90 s MV, repeat this in 5–8 movements; each movement gets 2–4 shots.
Do not make every shot a new world. Reuse one window, one street, one horizon.

## Changing a shot after review

1. Edit `scenes/<shot>.js` or `project.json`.
2. Run `node render.mjs check`.
3. Run `node render.mjs review --shot <id>` again.
4. The old verdict is invalid because `sourceHash` changed.
5. Record a new verdict.

The same applies after changing `render.mjs`, the engine, the LRC, the audio,
or the font. This is intentional: a review is of a specific build.

## Local command block

After the user chooses local, hand them this exact block with the real absolute
path filled in (do not paraphrase):

```powershell
cd "D:\work\my-mv"
node render.mjs final
# inspect build\final\<shot>\contact-sheet.jpg for every shot, then:
node render.mjs final-verdict --shot 01-window --pass --notes "..." --sheet build/final/01-window/contact-sheet.jpg
node render.mjs final --encode
```

No `--cloud`, no upload, no remote queue.
