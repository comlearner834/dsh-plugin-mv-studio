# Design ledger and jury

Adapted from the MIT-licensed `deepseek-opus-motion-skill` method. The point is
not to copy its Remotion code; it is to make the missing behaviour explicit:
read every value, plan before coding, design every element, and judge the
result against the brief.

## Priority order

When instructions compete, use this order:

1. **The user's words** — every value, beat, copy line, count, colour, duration
   and ban.
2. **Look and craft at the chosen style's level** — composition, palette, type,
   material, light and every element designed properly.
3. **Continuity** — real transformations, persistent identity, plausible
   physics.
4. **Rhythm and sound.**
5. **Bookkeeping** — ledgers, tables and checks. They serve 1–4; they never
   replace them.

Helpers are mechanics, not style. A helper's default box, stick limb or plain
gradient is never the design.

## Three ledgers

Write these in `STORYBOARD.md` before code.

### S — spec ledger

One row per binding value or instruction, quoted exactly:

```text
S01  duration 12 s
S02  1280×720, 24 fps
S03  palette paper #efe4ce / ink #2a231d / rust #b6543a
S04  lyric "回家的路，比夜里更长" at 0.50 s
S05  no pure black, no watermark
```

Numbers are binding. Do not round, rename, recolour, re-time or drop a row.
The last third of a long prompt counts as much as the first.

### X — transformation ledger

One row per becoming verb (becomes, turns into, gathers, dissolves, unfolds,
grows into, 变成, 化成, 收拢, 汇聚, 展开):

```text
X01  rain lines → lyric rule  · stitch by shared endpoints · 0.8–2.4 s
X02  paper moon → window lamp · same circle, colour and glow change · 2.8–4.0 s
```

A transformation is real: the same object or shared slot carries through; the
source is gone when the target forms. An overlay, crossfade or whole-frame scale
is not a transformation.

### E — element ledger

One row per drawn element, typed by its playbook:

```text
E01  character  Mei — front/side sheet, calm/worried/glad poses, coat and bag
E02  environment  night street — far buildings / mid road / near rain / foreground curb
E03  type  lyric line — 40 px, bone over ink keyline, lower third
E04  texture  paper grain + 12 fps ink boil, seeded per element
```

For each element list at least three structural features, its size/position,
how it moves, and what holds it or what it is held by. Each scene also gets a
back-to-front layer list.

## Timeline before code

Write one row per scene:

```text
0.0–4.0  window  · learns: she is still home · carries: moon → lamp · out: match cut
4.0–8.0  street  · learns: the road is long · carries: lamp → rain line · out: pan
8.0–12.0 dawn    · learns: the bus arrives · carries: rain line → horizon · out: pull back
```

Then list every event as `t · element · action · numbers`. Name key times in a
`T` block. Check:

- beats fall on the grid;
- each scene's exit state is the next scene's entry state;
- no two actions drive one property at once;
- everything finishes before the end;
- for a loop, the virtual end frame equals frame 0 with motion at rest.

## Design before motion

1. Build element geometry at module level from its features.
2. For characters, draw a character sheet first: every character in every named
   pose, holding its props.
3. Fix key compositions as exact layouts: first frame, each scene's first full
   frame, final frame.
4. Code the stills before the motion between them. A weak still is not rescued
   by motion.

## Element playbooks

| Element | Build | Move | Check |
|---|---|---|---|
| Type | One family; hierarchy by weight/size; tracking per size; CJK may run vertical | Arrive with ease-out; stagger 0.02–0.06 s; hold before exit | Words run together, orphan lines, caption too small/low contrast, payoff not heaviest |
| Object | Three or more real features; one shade side; consistent outline policy; built once as a function | Motion from its nature: paper folds, liquid ripples, metal rotates, lamp switches | Symbol instead of thing, floating parts, scale drift between shots |
| Character | One drawing function; silhouette, proportions, colours, face, named poses | `poseMix`/`spring` between poses; small acting beats; hands on props | Off-model between shots, hands miss props, limbs through head, feet off ground |
| Environment | Back-to-front layers: sky/wall, far, mid, ground, foreground; motivated light | Ambient life that never stops; camera still unless asked | Flat backdrop, weather through solids, missing light logic, edge clutter |
| Data | Axes/units first; values exact; labels attached to marks; one chart per scene | Axes, then data, then annotation; counters roll with their mark | Wrong numbers, unlabelled axes, decoration over data |
| UI | Real screens or faithful reconstruction; crisp rectangles; real hierarchy | Cursor/state-driven; zoom into the changing region | Stretched screenshots, fake noise, unreadable small text |
| Transition | Physical mechanism: morph, converge, wipe, material change, unfold, match cut | Hard edges, planned on a beat; source vanishes as target forms | Crossfade/cut the prompt did not ask for, pop-in, identity lost |
| Texture/light | Paper and ink as separate layers; halftone/hatch patterns; light as shapes | Seeded and stable, or boiling at a fixed step rate | Uniform texture on everything, decorative glow/bloom, unseeded flicker |
| Sound | Pitched bed/figure or ambience; event on every visual hit | Synced to the `T` block; loop tail folds into start | Silence by omission, noise as music, hits out of sync |

## Universal rules

1. **Becoming is real.** Shared slot or equal point count; source gone when
   target forms; target fully reached; parts born at their source.
2. **Identity persists.** Colour, shape and slot survive scene and material
   changes unless the prompt says otherwise.
3. **Physics and depth are explicit.** Layer list per scene; weather respects
   occluders; things behind glass are tinted; reflections mirror; contacts are
   computed.
4. **Space words are coordinates.** For 1280×720, centre is (640, 360); thirds
   are x≈427 and x≈853; upper y≈240; lower y≈507. Use the project's designW/H.
5. **Energy is even.** On-screen change follows the tempo; spikes are planned
   hits; no dead seconds unless a hold is planned.
6. **Finish and check.** Write every scene; run the jury; fix until every juror
   scores 8 or more.

## Five-juror review

Each juror scores 1–10 and names its worst moment with a timestamp.

1. **SPEC.** Every S/X/E row is implemented with its exact value. List missing
   or changed ids. This score caps the total.
2. **CONTINUITY.** Every X row is a real transformation; identity and slots
   persist; physics and depth correct.
3. **RHYTHM & SOUND.** Events land on beats; easing matches the contract;
   energy even; every hit has its sound; loop seam clean.
4. **DESIGN.** Hero frames match layouts; occupancy/whitespace; every element
   passes its playbook; look is designed for this film, not a helper default.
5. **CRAFT.** Texture/light per element; deterministic; no anti-slop items.

Fix every issue from a juror below 8, worst first, up to three rounds.

## Anti-slop list

Do not ship without a prompt reason:

- unrequested gradients, bloom, neon halos, lens flares;
- generic fade-ins everywhere;
- bounce where the style is calm;
- particle bursts, camera shake, RGB split;
- centred-title-over-cards layout;
- stock icons or emoji as the design;
- placeholder copy or lorem ipsum;
- the same helper default in a different film.

Motivated light drawn as a shape is allowed. Texture is allowed when the
material calls for it.

## Post-render check

Run `node scripts/check-film.mjs` after `final --encode`. It checks format,
first-frame flash, loop seam (when looped), audio presence, a 12-frame sheet,
and a motion curve with unplanned spikes or dead spots flagged. Trust the stills
over the code.
