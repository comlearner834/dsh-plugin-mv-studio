# Chapter brief: <c01>

This file is for one chapter agent. Read only what is listed here plus the
paths below; do not read or edit the whole project.

## Read first

1. `skills/painted-animation/SKILL.md`
2. `skills/painted-animation/template/ANIMATION_GUIDE.md` equivalent notes in
   this project (`ANIMATION_GUIDE.md` if present)
3. `MEMORY.md`
4. `STORYBOARD.md` — only the rows for this chapter

## Ownership

- Edit only `scenes/<c01>.js`.
- Do not edit `scenes/shared.js`, `scenes/index.js`, `project.json`,
  `MEMORY.md`, or another chapter.
- If a shared helper is missing, write it privately inside this chapter and
  report it. Do not fork the shared character.
- The orchestrator owns scene registration, shot IDs, durations and final
  review.

## Fixed

- Chapter:
- Time range / frames:
- Shot IDs and durations:
- Lyric lines:
- Palette:
- Cast and scale:
- Motif:
- In / out transitions:
- Canvas / fps:

## Reads

| Shot | Time | Lyric | Reads | In | Out |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Rules

- Every frame is a pure function of `t`; no state, `Math.random`, `frameCount`,
  `millis`, `Date.now`, or timers.
- Use the shared cast function; no redrawing the character.
- One idea per shot; act the lyric, do not caption it.
- Keep the action above the lyric band.
- Budget: ≤ ~2.5 s/frame; prefer fewer, bigger shapes.
- Handle the chapter's first and last frame as transition frames.

## Deliver

- `scenes/<c01>.js` exporting the scene functions.
- Review sheets and full-size frames for every shot.
- A short report: scene export names, frame counts, what was rejected, known
  seams at the chapter boundaries.
