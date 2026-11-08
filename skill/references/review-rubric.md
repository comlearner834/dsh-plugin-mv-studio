# Review rubric

A pass means: **you looked at the rendered pixels and would ship this shot.**
Reading `review.json` is not a review.

## Before you pass

1. Open the contact sheet with `read_image`. Check all tiles left-to-right,
   top-to-bottom.
2. Open at least one full-size frame from `frames/` at the point of highest
   risk (text, hands, silhouettes, a moving subject, a bright lamp). Crop the
   face/hand region if that is the read; a sheet can hide a broken expression.
3. If the shot has lyrics, open the frame at the line entry and the frame at
   line end.
4. Open the first and last frame of the shot; check the cut in and out.
5. Describe what you actually saw, with a timestamp. "Looks good" is not a
   note.

## The six checks

### 1. Composition

- Does the subject read in under a second?
- Is the frame balanced without being centered every time?
- Is there a clear near/mid/far relationship?
- Does the final frame still have a subject, or did the camera drift off it?

Fail example: a wide shot where the figure is 12 px tall and the eye goes to a
bright window.

### 2. Paint

- Paper grain and dry edges are visible at 100%.
- Watercolour has a pigment edge, not a flat vector fill.
- Line boil is visible at 12 fps but not strobing.
- No neon, no pure black, no plastic gradients.

Fail example: a moon that is a perfect white circle with a 1 px vector outline.

### 3. Motion

- Something changes every second: camera, weather, light, a figure, a curtain.
- No frozen stretch longer than ~0.7 s unless it is a deliberate hold.
- Motion has weight: a bus does not teleport; a curtain does not slide.
- Camera drift is smooth; no jitter from an unseeded random.

Fail example: a static background with only the lyric changing.

### 4. Lyrics

- Active line is readable over both dark and light areas.
- The wipe is in sync with the vocal; no line appears after its phrase.
- Glyphs are not clipped, overlapped, or rendered as tofu.
- The line does not cover the emotional subject (face, hands, moon).

Fail example: bone text with no keyline disappearing into a sunrise.

### 5. Continuity

- Palette and line weight match adjacent shots.
- Horizon, window height, and light direction stay believable.
- Recurring objects (moon, bus, coat) keep their shape and colour.
- No accidental jump in camera height between shots.

### 6. Technical

- No black/blank frame; no all-paper frame.
- No 1 px paper seam at the frame edge.
- No WebGL garbage, torn fill, or half-updated text.
- Frame dimensions are exact; no browser scrollbar or clipped canvas.
- Audio (if present) starts where the picture says it does.

## Five-juror gate

For a full film, score each juror 1–10 and name its worst moment with a
timestamp. Fix every juror below 8, worst first, up to three rounds.

1. **SPEC.** Every S/X/E row is implemented with its exact value. This score
   caps the total.
2. **CONTINUITY.** Every X row is a real transformation; identity and slots
   persist; physics and depth correct.
3. **RHYTHM & SOUND.** Events land on beats; easing matches; energy even; every
   hit has its sound; loop seam clean.
4. **DESIGN.** Hero frames, occupancy, whitespace and every element playbook;
   the look is designed for this film, not a helper default.
5. **CRAFT.** Texture/light per element; deterministic; no anti-slop item.

## Verdict notes

Use a compact form:

```text
pass — 窗框稳定；t=2.36 月光纸纹清楚；歌词在窗台上可读；无边缘缝。
fail — t=1.25 起，右侧窗帘出现 40 px 纸底缝；把背景向右扩 120 px 后重审。
```

Every fail must name a location and a fix. Do not fail on taste alone; if it is
a style preference, say so and pass.

## Final review is a different pass

The final frames are **clean** (no debug overlay) and full resolution. A draft
pass does not automatically pass the final. Check:

- the clean frame has no debug label;
- text edges at 1280/1920 are still crisp;
- no seam that disappeared only at half resolution;
- the encoded file has the expected duration, audio, and subtitle sidecar.
