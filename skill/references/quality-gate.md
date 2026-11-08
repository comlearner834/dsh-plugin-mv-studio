# Quality gate

The failure mode is not "the model cannot draw". It is shipping a film whose
scenes are flat fills, repeated compositions and thumbnail-only review.

## Hard gates

1. **One 6-second pilot before the film.**
   Build one shot at full quality. Inspect it at 100%: paper fibre, watercolour
   edge, a face or hand, three depth layers, a motivated light, and the lyric
   inside the safe area. Do not expand until the user says the pilot is good.

2. **Brush fills, not flat fills, for large areas.**
   Use `fillPoly` / `washPoly` / `hatchPoly` for walls, ground, sky, coats and
   large props. `p.fill()` is for small hard things (window bars, cable, eye),
   and even those need a brush edge or rim.

3. **One composition is not a shot list.**
   If `shots > distinct scene/variant pairs × 2`, the film is repeating itself.
   Cut shots or design new compositions. A 3-minute film usually needs 10–15
   strong shots, not 27 variations of one window.

4. **No shot longer than ~9 s without a real internal event.**
   Long holds are allowed only when something changes inside them.

5. **Lyrics are safe.**
   Size ≥ 34 px at 720p, baseline ≤ 0.88, whole line inside the middle 80%; open
   the line-entry and line-end frames.

6. **Review is not a thumbnail pass.**
   Open the contact sheet, one full-size frame, one face/hand crop, and the
   first/last frame of every shot. A 27/27 pass with no 100% look is invalid.

## Audit

```bash
node scripts/quality-audit.mjs --project ../night-train
node scripts/quality-audit.mjs --project ../night-train --strict
```

It reports flat fills vs brush fills, shot/pair ratio, long shots and lyric
safety. Warnings are not proof of bad art, but a scene with 100+ flat fills and
almost no brush fills is a shortcut.

Do not run a full render while the audit has unresolved warnings. Fix the pilot
or cut shots first.

## The 6-second pilot

- one character, one room, one light change;
- at least three depth layers (foreground, subject, far wall);
- a face or hands with contact;
- paper texture visible at 100%, not just grain;
- lyric on a safe line if it has one;
- 144 frames at 24 fps (or 180 at 30).

Show the pilot as a contact sheet and one full frame. Ask one question: “这个
6 秒能看吗？” Only after yes do the next three shots.
