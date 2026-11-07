# Long-form videos

A 5-minute film at 24 fps is 7,200 frames. Do not hold the whole thing in one
context or one agent. Split by song section, then by shot.

## 1. Lock the grid and the budget

Measure the song (`scripts/beat-grid.py`), pick the clip range, and compute:

```text
frames = duration * fps
chapter ≈ 20–40 s (480–960 frames)
shot ≈ 1.4–4 s (one lyric line)
```

A 5-minute song is usually 8–12 chapters and 80–160 shots. If a "chapter" has
more than ~15 shots, split it again.

## 2. One shared layer, written first

Before any chapter agent runs, the orchestrator writes and freezes:

- `scenes/shared.js` — cast functions, props, palette, transitions.
- `MEMORY.md` — locked facts, cast, do-nots.
- `STORYBOARD.md` — one logline, one world, one motif, chapters and reads.
- `scenes/index.js` — imports every chapter.
- One **pilot chapter** — a finished reference for style, scale and API.

Only after the pilot passes review do the other chapters start.

## 3. File layout

```text
scenes/
  shared.js          cast, props, palette; orchestrator only
  index.js           imports all chapters; orchestrator only
  c01-dusk.js        one chapter, one agent
  c02-memory.js
  c03-night.js
chapters/
  c01.md             chapter brief (copy template/CHAPTER_BRIEF.md)
  c02.md
```

Each `cNN.js` exports several scenes. `project.json` references their export
names. The orchestrator owns `project.json`; chapter agents never change shot
IDs or durations.

## 4. Brief each chapter

Copy `template/CHAPTER_BRIEF.md` to `chapters/cNN.md` and fill:

- exact time range and frame count;
- shot IDs, durations, lyric lines, timed reads, in/out;
- palette, cast, motif, character scale;
- ownership: only `scenes/cNN.js`;
- budget and review bar.

Give the agent the brief and only its `STORYBOARD.md` rows. Do not give it the
whole 5-minute plan.

## 5. Parallel agents

Run 2–3 chapters at a time, not all at once. Each agent:

1. reads the brief, `MEMORY.md`, the shared guide and the pilot chapter;
2. writes only its chapter;
3. runs `node render.mjs check`;
4. renders review sheets and full-size frames for its shots;
5. reports export names, frame counts, rejected ideas and boundary seams.

The orchestrator merges, fixes `scenes/index.js`, and never lets agents edit
shared files.

## 6. Review seams, not just shots

For every chapter boundary, render:

- last frame of chapter N;
- first frame of chapter N+1;
- one frame just before and after the cut.

Check palette, character scale, screen direction, horizon, light direction and
the transition. A chapter can pass every shot and still fail the seam.

## 7. Render in chunks

Review per chapter. Only after every chapter and seam passes, run the full
render and final review. If one shot changes, re-render that shot and the two
frames around each adjacent cut; do not re-render the whole film by reflex.

## 8. Keep status in memory

After each chapter, update `MEMORY.md`:

```text
c01  pass  scenes/c01-dusk.js  4 shots  12.0 s  reviewed 2026-11-07
c02  wip   ...
```

Do not keep status only in chat.
