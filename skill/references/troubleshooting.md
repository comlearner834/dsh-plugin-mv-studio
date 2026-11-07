# Troubleshooting

## Chrome will not start

Symptom:

```text
Chrome did not expose a DevTools endpoint
platform_channel.cc ... Check failed ... 0x5
spawn EPERM
```

Cause: a restricted DSH/CI sandbox blocks Chromium's named-pipe/IPC setup.
This is a sandbox boundary, not a code bug.

- Run the exact render command in a normal local terminal, or
- ask for local process access for that command once, then rerun it unchanged.
- Do **not** switch to a cloud renderer, and do **not** lower the pipeline to
  an un-reviewed encode.

Set `CHROME_PATH` if Chrome is installed outside the usual paths. Edge is a
valid fallback and is auto-detected on Windows.

## `ffmpeg not found`

`ffmpeg-static` downloads a binary during `npm install`. If scripts were
skipped:

```bash
npm rebuild ffmpeg-static
# or
set FFMPEG_PATH=C:\path\to\ffmpeg.exe
```

Check with `node render.mjs doctor`. The bundled build must include
`libx264` and `aac`.

## `p5.brush` fails / WebGL2 unavailable

- Use Chrome/Edge, not a minimal Electron shell without WebGL.
- Keep the flags in `launchChrome` (`--use-angle=swiftshader`,
  `--enable-unsafe-swiftshader`). They make headless rendering work on CPU.
- `p5.brush` requires p5 2.x and a WEBGL canvas. Do not switch the canvas to
  `P2D`.
- If a page is blank, run with `DEBUG=1` and read the page console. A missing
  `scenes/index.js` export is the usual cause.

## GPU is present but rendering is still slow

Look at the first line of a render:

```text
gpu: hardware  ANGLE (NVIDIA ... Direct3D11 ...)
gpu: software  ANGLE (Google, Vulkan ... SwiftShader ...)
```

- `software` means the GPU is not being used. The renderer fell back because
  headless Chrome could not create a hardware WebGL context, or the sandbox
  blocked Chrome's GPU process.
- Use `--gpu on` to fail loudly instead of falling back.
- Use `--gpu auto` for normal use; `--gpu off` for the old SwiftShader path.
- GPU only speeds up WebGL painting. PNG screenshot, disk writes, and ffmpeg
  are still CPU work; 30 seconds at 720p should not take 40 minutes on a
  working GPU.
- A GPU review and a software final render produce slightly different brush
  textures. `review.json` records the renderer, and `final` refuses a
  mismatched pair; re-review after changing renderer.

## The render hangs after one frame

Do not open several pages of p5.brush in **one** Chrome process. The renderer
uses one Chrome process per worker (`createChromePool`). If you customize it,
keep that isolation. Four workers is the default; use two on a low-RAM machine.

## Contact sheet fails with "Input width does not match"

The tile grid had a short last row. `makeSheet` pads missing cells with a dark
tile. If you call it yourself, pass a layout where `count <= cols * rows` and
let it pad; do not build a manual `hstack` with unequal counts.

## A seam at the frame edge

Cause: a camera pan or transform moved the painted background, revealing the
paper base at the edge.

Fix: overscan the background by 80–140 design px. In scenes that pan, draw the
sky/street with `x = -140, width = W + 280`. Do not add a border in CSS.

## Lyrics are wrong or invisible

- Check `[offset:]`, `lyrics.offsetMs`, and `audio.startAt`.
- Ensure the LRC file is UTF-8.
- The default is bone fill + dark keyline. If a scene is very bright, keep the
  keyline; do not set the fill to pure white.
- Last line stops halfway: `maxHold`/video end clamp; check the source hash and
  rerender.
- `api.lyric` is null between lines; guard before using it.

## A verdict is rejected as stale

The source hash covers `project.json`, `render.mjs`, `engine/`, `scenes/`, the
LRC, the audio, and the lockfile. Any change invalidates old reviews. Re-run
`review --shot <id>` and record a new verdict. This is the intended safety
behaviour.

## `approve` refuses

It requires:

- every shot has a current `pass` verdict;
- the quote is at least 4 characters;
- `--mode local`.

It is not a way to bypass review. If the user only said "looks nice", ask for
the render choice.

## Output has no audio

- `project.audio.file` path is relative to the project root.
- `ffmpeg` failed the mux; read the last `build/logs/mux-audio-*.log`.
- `-shortest` can cut the picture if the audio is shorter; `doctor` warns when
  durations differ by more than 0.18 s.

## Fonts differ between machines

CJK text uses the system stack (`Songti SC`, `SimSun`, `Noto Serif SC`,
Georgia). For a festival/master deliverable, install Noto Serif SC and add it
to `project.lyrics.font`. The bundled IBM Plex Mono is only for contact-sheet
labels.
