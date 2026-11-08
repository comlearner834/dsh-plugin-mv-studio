---
name: painted-animation
version: 1.0.0
description: Use when the user asks for a hand-painted or painted-animation video, a procedural music video, a storyboard-driven animation, lyric-synced MV, a classical Chinese poem video, or a p5.js/p5.brush + Puppeteer + ffmpeg pipeline. Also use when the user supplies only a song title and artist, and for 中文 requests such as 手绘动画、水彩动画、水墨动画、音乐 MV、歌词同步、只给歌名和作者、古诗词视频、诗词分镜、静夜思、分镜动画、程序化动画视频. Not for static posters, live-action footage restyling, or ordinary p5 sketches.
---

# Painted Animation

Procedural hand-painted animation. Every visible pixel is drawn by code with
p5.js + p5.brush, captured by Puppeteer, reviewed as an image, and encoded by
ffmpeg. No image or video generation model is involved.

Companion UI: the DSH sidebar plugin **MV Studio** (`dsh-plugin-mv-studio/`,
installed as `@local/painted-animation-studio`) gives this workflow a separate
left-sidebar room. A click opens a one-line brief; starting it opens a
conversation already invoking this skill.

The style is **paper-and-gouache**: bone paper, dry brush rims, watercolour
bleeds, 12 fps line boil, restrained palettes, quiet camera drift, and lyrics
painted as ink with a dark keyline. See `references/style.md`.

## Capabilities

- Create a runnable project from a one-sentence brief.
- Turn a brief into 3–12 shots with a rendered storyboard.
- Draw each frame from code with p5.js and p5.brush; no image/video model.
- Sync line-level LRC (and enhanced word tags) to a supplied song.
- Build a one-shot-per-line classical poetry plan, with recitation, imagery,
  action, camera, light, and painting brief per line.
- Render all frames in parallel across isolated Chrome processes.
- Generate contact sheets for storyboard, per-shot review, and final review.
- Gate encoding behind shot-level visual review and an explicit local choice.
- Encode H.264 + AAC with a lyric SRT sidecar and a checksummed manifest.

## How to use

1. Read the brief. If direction is missing, ask the one optional question
   below (for an MV, request the audio and LRC in that same message).
2. Scaffold a project, write `project.json` + scenes, run `check`.
3. Render and inspect the storyboard; show it to the user.
4. Review every shot from rendered frames and record verdicts.
5. Ask explicitly for a local full render. Only then approve, render final
   frames, review them, and encode.

## Priority order

When instructions compete: **the user's exact words** → **look and craft at the
chosen style's level** → **continuity** → **rhythm and sound** → bookkeeping.
Every value in the prompt is binding; the last third of a long prompt counts as
much as the first. Helpers and examples are mechanics, not style.

## Three ledgers

Write these in `STORYBOARD.md` before code:

- **S — spec**: one row per value/instruction (duration, size, fps, colours,
  copy, counts, timings, bans), quoted exactly.
- **X — transformation**: every becoming verb as `source → target · mechanism ·
  start–end · what is conserved`.
- **E — element**: every drawn thing with its playbook, three or more
  structural features, size/position, motion, and holder/layer.

See `references/design-jury.md`.

## Non-negotiable rules

1. **Every frame is a pure function of time.** Scenes get `t`; no
   `Math.random`, `frameCount`, `millis`, `Date.now`, timers, or mutable
   module state. Use `api.t`, `api.u`, `api.boil()`, `api.rand()`,
   `api.noise()`.
2. **`render.mjs` owns the pipeline.** It generates contact sheets and renders
   all frames in parallel. Scenes never write video.
3. **Review rendered frames, not intentions.** Before approving a shot, open
   its contact sheet **and** at least one full-size frame with `read_image`.
   A verdict without a rendered sheet is invalid.
4. **Never start a full render without an explicit user choice.** Storyboard
   renders and per-shot review renders are allowed. A full-quality run of
   every frame needs `approval.json`, written only after the user says
   "本地渲染" or equivalent.
5. **Local only.** This skill never uploads footage, audio, lyrics, or frames
   and never calls a cloud renderer. If the user chooses local, do not fall
   back to any remote/all-frame service.
6. **Ask for the creative direction once, in one natural sentence.** Never
   use a five-question form.

## Input requirements

**For a music MV, ask for the song audio and the LRC file in the same single
message as the creative direction.** Accepted audio: `.mp3`, `.wav`, `.m4a`,
`.flac`. Accepted lyrics: `.lrc` (plain or enhanced `<mm:ss.xx>` word tags).
If the user has only a title and artist, do not block: use the title/artist
path below and make an original score if no local copy exists.

If the user already described the direction, do not ask again. If the request
is a non-MV film, audio is optional. For a classical poem, no song is needed:
the poem itself is the timeline, one line per shot.

**The one question** (adapt the quoted default, keep it one message):

> 把歌曲音频和 LRC 歌词发我；再用一句话说说这支 MV 想让人感觉到什么？
> （可以留空，我就按「夜色里一个人慢慢走回家，克制、温暖、有一点累」来做。）

For a non-MV request:

> 用一句话说说这支片子想让人感觉到什么？（可以留空，我就按「安静、手绘、
> 留白，像一页会动的速写」来做。）

A one-line answer is enough. "你定", "随便", or no answer means use the
default. Do not ask follow-up creative questions; make reasonable decisions.

### Only a song title and artist

If the user gives only a song name and author, still make an MV, but resolve
the material honestly:

```bash
node scripts/song-intake.mjs --project "D:/work/my-mv" \
  --title "晴天" --artist "周杰伦" --mode auto
```

The helper searches, in order: `--music-dir` folders, `DSH_MUSIC_DIR` /
`MUSIC_DIR`, `~/Music`, and the project's `audio/`. It matches filenames and
copies a matching audio file plus sidecar LRC into the project. **A title and
artist are only local search keys; the helper never uses them to look up,
stream, or download the commercial recording.** It never downloads audio or
lyrics.

- **Local audio found**: use it. If a sidecar LRC exists, sync it; if only
  plain-text lyrics exist, align them locally with `scripts/align-lyrics.py`
  (see `references/lyrics-align.md`); otherwise make an instrumental/visual MV
  without lyrics.
- **Nothing found**: the helper generates an original 30-second instrumental
  score and sets `project.song.mode = "original"`. This is **not** the
  commercial recording. Write original lyrics (4–8 lines), make an LRC, and
  label the piece as an original interpretation. Never present it as the
  artist's official recording or use the artist as an endorsement.
- If the user wants the actual recording, ask once for an authorized audio
  file and LRC; do not scrape or download them.

The helper writes a `song` block in `project.json`; `render.mjs` ignores it,
but keep it for provenance. For the original path, adjust shot durations to
sum to the score length before storyboarding.

### Classical poetry

A poem video is **one shot per line, in order**. Do not merge or reorder
lines. Newlines in the submitted poem define the lines; keep commas inside a
line.

```bash
node scripts/poetry-intake.mjs --project "D:/work/poem-mv" \
  --title "静夜思" --author "李白" --poem-file poem.txt --style ink
node scripts/poetry-intake.mjs --project "D:/work/poem-mv" --out poetry-plan.json --check
```

Styles: `ink` (国风水墨/留白), `bluegreen` (青绿山水), `gongbi` (淡彩工笔),
`moon` (月下冷调), `autumn` (秋山暖赭), or `custom` with
`--style-name "..." --style-brief "..."` for any other look.

Every `poetry-plan.json` line must eventually contain:

| Field | Meaning |
|---|---|
| `text` | The exact poem line |
| `recitation` | Spoken text, emotion/pause direction, optional WAV, duration |
| `imagery` | What the frame shows: subject, depth, negative space |
| `action` | What moves inside the shot |
| `camera` | Push, pan, tilt, hold; one move only |
| `light` | Direction, softness, contrast, paper texture |
| `paintingPrompt` | Style-aware brief for the p5.brush scene |

`paintingPrompt` is a **scene-authoring brief**, not an image-model call.
Every frame is still drawn by code.

Fill `imagery` and `action` yourself; the intake helper leaves them blank on
purpose. `--check` refuses to pass until every field is present.

Recitation on Windows:

```bash
node scripts/poetry-voice.mjs --project "D:/work/poem-mv" --plan poetry-plan.json
```

This uses the installed zh-CN System.Speech voice, creates one WAV per line,
concatenates them to `audio/poetry-recitation.wav`, and writes the measured
durations back into the plan. DSH's workspace sandbox blocks System.Speech;
run this one command with local process access or record the poem yourself.
If no local voice is available, keep the `recitation.direction` and ask for a
recording; do not fake the voice.

Then build `project.shots` from the plan: same count, same order, durations
from the plan, one scene per line. Run the normal review and local-render
gates.

## Workflow

### 1. Create the project

```bash
node <skill>/scripts/scaffold.mjs "D:/work/my-mv" --title "纸月亮" --slug "paper-moon" --width 1280 --height 720 --fps 24
cd "D:/work/my-mv"
node render.mjs doctor
node render.mjs check
```

Requires Node 20+, Chrome or Edge. `scaffold.mjs` installs the project
dependencies from `package-lock.json` automatically (including local ffmpeg);
pass `--no-install` only when offline, then run `npm install` inside the
project once. After that, rendering is entirely local.

`scaffold.mjs` copies the runnable `template/` (including `MEMORY.md` and
`STORYBOARD.md`) and resets review/approval state. If the user supplied
audio/LRC, put them under `audio/` and `lyrics/` and point `project.json` at
them. Keep the audio path stable: the source hash covers it, so replacing the
file invalidates approvals.

Before editing an existing project, read its `MEMORY.md` first; update it when
a locked fact changes. Use `DECISIONS.md` for append-only choices and
`FAILURES.md` for exact failures and fixes, so a later session does not repeat
them.

Then:

- Rewrite `project.json` shots and `scenes/*.js`.
- Keep shot durations on whole frames (`duration * fps` must be an integer).
- Set each shot's `seed` to a unique integer.
- Add every scene to `scenes/index.js`.
- Use `api.lyric` for custom lyric staging, or leave lyrics to the engine
  (`project.lyrics.style: "wipe"`).

### 2. Storyboard first

Before drawing, write `STORYBOARD.md` (template: `template/STORYBOARD.md`):

- **Logline** — who wants what, what changes.
- **Song grid** — BPM, beat seconds, clip start/end, lyric-line length.
- **One world** — the recurring place and palette arc.
- **Motif** — one object/colour/gesture that marks the character or idea.
- **Cast** — look, want, arc; one drawing function per character.
- **Shot table** — time, lyric, shot, **reads**, in, out.

Before shots, read `references/characters.md` and draw a character sheet:
front/side, three expressions, held props. Keep cast and sets in
`src/characters.js` / `src/sets.js`; chapters import them, never fork them.

A shot without timed reads is not ready. If a read does not fit, cut it or
carry the gag into the next shot; never slow the song to explain it.

```bash
node render.mjs storyboard
```

This renders 3 keyframes per shot at 960×540 and writes
`build/storyboard/sheet-01.jpg` (plus a manifest). Open the sheet with
`read_image`. Fix composition, scale, text collisions, and continuity before
showing it. Then send the user a short shot list and the sheet path, and ask
one simple check-in: **"这个分镜可以吗？"**

Do **not** start per-shot review or final rendering before the storyboard is
settled.

### 3. Review every shot

For each shot:

```bash
node render.mjs review --shot 01-window
```

Read `build/review/01-window/contact-sheet.jpg` and at least one frame in
`build/review/01-window/frames/`. Use the rubric in
`references/review-rubric.md`. Then record the verdict:

```bash
node render.mjs verdict --shot 01-window --pass --notes "窗框稳定，月光有纸纹，歌词在深色窗台上清楚" --sheet build/review/01-window/contact-sheet.jpg
```

If the verdict is fail, write the specific problem, fix the scene, and run
`review` again. A scene change invalidates every existing verdict
automatically through the source hash. Do not batch-pass shots you have not
looked at.

### 4. Ask for the full-render choice

Only after every shot has a current pass:

> 都看过了。现在要在这台电脑上做成完整视频吗？大约 X 分钟，
> 不会上传任何素材。你说「要」我才开始；说「先不要」就停。

Wait for an explicit answer. "要", "可以", "开始吧" count; silence,
"再看", or an unanswered question do not. Never choose for the user.

After the explicit choice:

```bash
node render.mjs approve --mode local --quote "用户原话：要，开始吧"
```

Only `--mode local` is accepted. Print the exact commands it returns,
including the absolute `cd` path. If the user asks for cloud/remote
rendering, explain that this skill is local-only and stop.

### 5. Final frames, then final review, then encode

```bash
node render.mjs final
```

This checks approval and draft verdicts, renders every frame at full quality,
writes one contact sheet per shot, and **does not encode**. No video exists
yet. Open every `build/final/<shot>/contact-sheet.jpg`, check the full-size
frames, then record each final verdict:

```bash
node render.mjs final-verdict --shot 01-window --pass --notes "终版：...；帧 0048 的月光边缘没有白边" --sheet build/final/01-window/contact-sheet.jpg
```

If only one shot changed, do not re-render the whole film:

```bash
node render.mjs final --shots 02
```

This keeps the other final frames and requires a fresh `final-verdict` for the
re-rendered shot. `--range 3:6` does the same for a 1-based shot range. A
partial run needs an existing current final.

Only when all final verdicts pass:

```bash
node render.mjs final --encode
```

This writes `output/<slug>.mp4`, `output/<slug>.srt`,
`output/manifest.json`. Verify the printed duration/size and run the
post-render check:

```bash
node scripts/check-film.mjs --file output/<slug>.mp4
```

It writes `build/check/sheet.png`, stills, an audio spectrogram and a motion
curve. Fix every `FAIL` before delivery; treat a motion spike as a planned hit
or a defect, not as decoration. Add `--loop` for a seamless loop.

## Commands

| Command | What it does |
|---|---|
| `node scripts/song-intake.mjs --project <dir> --title "..." --artist "..."` | Finds local audio/LRC, or makes an original score |
| `node scripts/poetry-intake.mjs --project <dir> --title "..." --poem-file poem.txt --style ink` | One shot per poem line + plan/brief |
| `node scripts/poetry-voice.mjs --project <dir> --plan poetry-plan.json` | Local Windows recitation + measured shot durations |
| `python scripts/beat-grid.py song.mp3 --lrc song.lrc` | BPM, beat phase, and each lyric line's beat index |
| `node scripts/check-film.mjs --file output/<slug>.mp4` | Format, first-frame flash, loop seam, audio, sheet, motion curve |
| `node scripts/quality-audit.mjs --project <dir>` | Flat-fill / shot-repeat / lyric-safety audit |
| `node scripts/short-plan.mjs --title "..." --topic "..." --rounds 6 --theme coral` | 18–54 s short timeline + brief |
| `uv run --with faster-whisper --with zhconv python scripts/align-lyrics.py song.mp3 lyrics.txt` | Plain lyrics → timed LRC, local |
| `node render.mjs doctor` | Checks project, Chrome, ffmpeg, audio duration, reviews |
| `node render.mjs check` | Static pure-time scan + double render determinism check |
| `node render.mjs storyboard` | 3 keyframes per shot + contact sheet |
| `node render.mjs review --shot <id>` | 8 fps half-res frames + 9-frame sheet |
| `node render.mjs verdict --shot <id> --pass --notes "..." --sheet <path>` | Records draft review |
| `node render.mjs approve --mode local --quote "..."` | Writes approval after explicit user choice |
| `node render.mjs final` | Full-quality frames + final sheets; no encode |
| `node render.mjs final --shots 02,04` | Re-render only those shots, keep the rest |
| `node render.mjs final --range 3:6` | Re-render a 1-based shot range |
| `node render.mjs final-verdict --shot <id> --pass --notes "..." --sheet <path>` | Records final review |
| `node render.mjs final --encode` | Encodes after all gates pass |

`<skill>` is this skill's absolute directory. On Windows use forward slashes
or quoted backslash paths.

## Motion, beats and close-ups

- Write **reads** for every shot: the timed list of what the viewer must
  understand. If a read does not land, cut it or move it; do not slow the song.
- One recurring character = one drawing function, called with position, scale,
  mood. Keep it on-model across shots.
- Measure the song grid with `scripts/beat-grid.py`; set `project.bpm` and
  `project.beatOffset`; scenes use `api.beat()`, `api.beatN()`, `api.pulse()`.
- The engine exposes `api.kf`, `api.spring`, `api.jump`, `api.take`,
  `api.onTwos`, `api.reseed`. Use `api.reseed(key)` before an independently
  moving element so its random details do not jitter when another element moves.
- Enhanced LRC word tags drive a word-level lyric wipe; plain LRC still works.
- Review the contact sheet, one full frame, one face/hand crop, and first/last
  frames. See `references/motion.md`.

## Long-form videos

Do not put a 5-minute film in one context. Split it:

1. Lock the grid and frame budget; 5 min at 24 fps = 7,200 frames.
2. Write the shared layer first: `scenes/shared.js`, `MEMORY.md`,
   `STORYBOARD.md`, and one finished pilot chapter.
3. One chapter per 20–40 s, one file, one agent; copy
   `template/CHAPTER_BRIEF.md` and give the agent only its rows.
4. 2–3 chapter agents at a time. Agents edit only their chapter; the
   orchestrator owns `scenes/index.js` and `project.json`.
5. Review every chapter, then every seam (last frame of N, first of N+1).
6. Render in chunks; re-render the changed shot and adjacent cut frames, not
   the whole film.

See `references/long-form.md` for the file layout and brief format.

## Short video

A vertical 18–54 s showcase uses a fixed grammar, not a fixed art style:

```text
3s opening + N × (1s big card + 3s style segment) + 3s ending
N = 3..12
```

At 30 fps, each round is 120 frames. The style segment starts on a beat; one
idea per round; all text sits inside the middle 80%; no bottom subtitle bar.
Use `scripts/short-plan.mjs` to write `short-plan.json` + brief, then the normal
storyboard, still review and local render gates. Take the grammar, not the
reference's HTML/Canvas/Three.js stack; keep p5.brush. See
`references/short-video.md`.

## GPU rendering

The default is `--gpu auto`: launch Chrome with hardware WebGL, probe
`WEBGL_debug_renderer_info`, and fall back to SwiftShader only if no hardware
context appears. `--gpu on` never silently falls back: it asks before using
software, and in a non-interactive run it stops with a question for the user
instead of an error. `--gpu off` is the slow deterministic software path.

A hardware run prints:

```text
gpu: hardware  ANGLE (NVIDIA, ... Direct3D11 ...)
```

GPU rendering changes brush texture slightly. `review.json` records the
renderer; `final` refuses to pair a hardware draft review with a software
final (or the reverse). Re-review after switching. PNG screenshots and ffmpeg
encoding stay CPU-bound, so GPU is not a 10x guarantee.

## Quality gate

Before a full film:

1. Make **one 6-second pilot**. Inspect at 100%: paper fibre, watercolour edge,
   a face or hand, three depth layers, one motivated light, lyric safe.
2. Do not expand until the user says the pilot is good.
3. Run `node scripts/quality-audit.mjs --project <dir>`. Fix flat-fill scenes,
   repeated compositions and unsafe lyrics; a 3-minute film should be 10–15
   strong shots, not 27 variations of one window.
4. A 27/27 pass from thumbnails is not a review. Open a full frame, a face/hand
   crop and both ends of every shot.

See `references/quality-gate.md`.

## Review rubric (short form)

Pass only if all are true:

- **Composition**: subject reads at first glance; no empty accidental frame.
- **Paint**: paper grain, dry edges, and 12 fps boil are visible but not noisy.
- **Motion**: something moves every second; no frozen segment; camera motion
  is motivated.
- **Lyrics**: active line is legible over both dark and light areas; timing
  matches the LRC; no clipped glyphs.
- **Continuity**: palette, line weight, and horizon stay consistent.
- **Technical**: no blank/black frame, no seam at the frame edge, no garbled
  text or WebGL artifacts.

Cite the shot, timestamp, and what you saw. See
`references/review-rubric.md` for the full checklist and failure examples.

## Reference map

- `references/style.md` — palette, brushes, boil, camera grammar.
- `references/scene-api.md` — `scene.draw(api)` and every helper.
- `references/lrc.md` — LRC formats, offsets, word tags, sync checks.
- `references/review-rubric.md` — visual QA checklist.
- `references/troubleshooting.md` — Chrome, ffmpeg, WebGL, fonts, edge seams.
- `references/song-intake.md` — title/artist resolution, local matching, original fallback.
- `references/poetry.md` — one-shot-per-line poem plan, recitation, style presets.
- `references/motion.md` — character consistency, motion helpers, beat grid, word karaoke, close-up review.
- `references/design-jury.md` — priority order, S/X/E ledgers, playbooks, five-juror review.
- `references/short-video.md` — 9:16/1:1 short formula, themes, round grammar, fast review.
- `references/lyrics-align.md` — plain lyrics → LRC with local faster-whisper.
- `references/characters.md` — cast, character sheet, shared sets, continuity.
- `references/quality-gate.md` — 6s pilot, flat-fill audit, shot-count sanity, lyric safety.
- `template/STORYBOARD.md` — logline, one world, motif, cast, song grid, reads table.
- `template/MEMORY.md` — locked project facts, cast, do-nots, shot status.
- `references/long-form.md` — chapter split, shared layer, per-chapter agents, seam review.
- `template/CHAPTER_BRIEF.md` — one self-contained brief per chapter agent.
- `references/examples.md` — positive, borderline, and negative prompt examples.
- `template/` — runnable 3-shot demo with generated soundtrack.
- `examples/long-way-home/` — completed example with MP4, sheets, and manifests.
- `scripts/scaffold.mjs` — copies the template into a new project.
- `scripts/song-intake.mjs` — title/artist lookup and original fallback.
- `scripts/poetry-intake.mjs` — poem split + per-line plan.
- `scripts/poetry-voice.mjs` / `poetry-voice.ps1` — local Windows recitation and timing.
- `scripts/beat-grid.py` — BPM, beat phase, LRC-line beat index.

## What not to do

- Do not use stock images, generated images, stock footage, or image/video
  generation models.
- Do not download copyrighted audio or lyrics. Title/artist resolution uses
  local authorized files only; otherwise it makes an original interpretation.
- Do not let a scene draw from `frameCount` or `Date.now`; the same `t` must
  produce the same frame.
- Do not write your own frame loop / contact sheet / encoder. Use `render.mjs`.
- Only run `approve` immediately after the user's explicit words; never invent a quote.
- Do not encode before final verdicts, even if the draft reviews passed.
- Do not upload assets or use a cloud fallback after a local choice.
