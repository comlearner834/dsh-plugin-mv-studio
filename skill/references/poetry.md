# Classical poetry mode

One poem line becomes one shot, in order. Each shot records what the line
means, how it is spoken, what moves, how the camera moves, how the light sits,
and the painting brief that a p5.brush scene must implement.

This mode does not call an image or video generation model. `paintingPrompt`
is a **scene-authoring brief** for procedural code, not a prompt sent to an
image service.

## 1. Intake

```powershell
cd "D:/work/poem-mv"
node scripts/poetry-intake.mjs `
  --title "静夜思" --author "李白" `
  --poem-file "poem.txt" --style ink
```

Paste one poem line per row. The splitter uses newlines first; with
`--split sentence` or `--split comma` it can split a pasted paragraph, but the
default is the safest for "one line = one shot".

Styles:

| `--style` | Name | Direction |
|---|---|---|
| `ink` | 国风水墨 | ink wash, paper, negative space |
| `bluegreen` | 青绿山水 | mineral blue-green landscape |
| `gongbi` | 淡彩工笔 | fine line, thin colour |
| `moon` | 月下冷调 | indigo, silver, mist, water |
| `autumn` | 秋山暖赭 | ochre, dry branches, warm paper |
| `custom` | 自定义 | pass `--style-name` and `--style-brief` |

Custom style example:

```bash
node scripts/poetry-intake.mjs --project . --title "静夜思" --poem-file poem.txt \
  --style custom --style-name "敦煌壁画" \
  --style-brief "土红、石青、金线，斑驳墙面，烛光，矿物颜料颗粒"
```

A custom brief is used verbatim in each line's `paintingPrompt`; it should
name colour, material, line quality, light and mood. The generic "leave blank
paper" suffix is only added for the built-in presets.

The command writes:

- `poetry-plan.json` — the shot plan
- `poetry-brief.md` — a human-readable shot table
- `project.json` → `poetry` block

## 2. Fill the plan

Every line has these fields:

```json
{
  "index": 1,
  "text": "床前明月光，",
  "recitation": {
    "text": "床前明月光，",
    "direction": "轻声起句，逗号处短停，句尾不要急着收。",
    "wav": null,
    "durationSec": 3.3
  },
  "imagery": "",
  "action": "",
  "camera": "缓慢轻推或横移；镜头只做一件事，留出呼吸。",
  "light": "柔光、低对比，亮部不过曝，暗部保留纸的纹理。",
  "paintingPrompt": "国风水墨……诗句……留白大于实体……",
  "durationSec": 3.3
}
```

Fill `imagery` and `action` with concrete, drawable decisions (not adjectives
alone). Refine `camera`, `light`, and `paintingPrompt` per line. Keep the line
text exactly as the poem.

Check completeness:

```bash
node scripts/poetry-intake.mjs --out poetry-plan.json --check
```

## 3. Recitation

On Windows, with a zh-CN voice installed:

```powershell
node scripts/poetry-voice.mjs --project "D:/work/poem-mv" --plan poetry-plan.json
```

It uses System.Speech (Huihui in this environment), speaks each line with a
slower rate and a pause, measures the real WAVs, concatenates them to
`audio/poetry-recitation.wav`, and updates each line's `durationSec` plus
`project.audio`.

The DSH workspace sandbox blocks System.Speech. Run this one command in a
normal terminal or with local process access; do not treat a sandbox refusal
as an audio failure.

Fallback: record the poem yourself and set `project.audio.file` to the
recording. Keep the per-line `durationSec` values aligned with the recording.

## 4. Build the project

For each `plan.lines[i]`:

1. Create one shot in `project.shots` in the same order.
2. Use `durationSec` as the shot duration at project fps (round to whole
   frames).
3. Give it a scene module whose `draw(api)` realizes `imagery`, `action`,
   `camera`, `light`, and `paintingPrompt` with p5.brush.
4. Draw the poem line with `api.text` if the scene needs it; do not add a
   subtitle bar. Keep the line legible over paper.
5. Respect the style palette; do not turn every line into a different film.

Then run the normal gates: `doctor`, `check`, `storyboard`, shot reviews,
explicit local choice, final reviews, encode.

## 5. What to present to the user

Show a table with every field before the storyboard images:

| # | 诗句 | 朗诵 | 画面意境 | 动态动作 | 运镜 | 光影 | 绘画提示词 |
|---|---|---|---|---|---|---|---|

The user should be able to read the plan and say "这句改成……" without opening
code.

## 6. Rules

- One line = one shot. Do not merge or reorder.
- Recitation is part of the shot, not a generic background track.
- `paintingPrompt` describes a drawn scene; it is not an image-model call.
- Keep the poem text exact; punctuation belongs to the line.
- The full render gates from the main skill still apply.
