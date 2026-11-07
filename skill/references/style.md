# The paper-and-gouache style

## Palette

Start from these tokens in `project.json`. Use 3–5 per shot, not all seven.

| Token | Hex | Use |
|---|---|---|
| `paper` | `#efe4ce` | base sheet, lyric keyline halo |
| `paperDeep` | `#e4d4b7` | aged edges, sky wash |
| `ink` | `#2a231d` | line work, silhouettes |
| `rust` | `#b6543a` | warmth, brick, skin, bus |
| `indigo` | `#29465b` | night, rain, distance |
| `moss` | `#61705a` | fields, plants, quiet midtone |
| `gold` | `#c99b4e` | lamps, sun, one accent |
| `bone` | `#f7efdf` | moon, windows, lyric fill |

Keep saturation low. A shot should look like it was mixed from the same three
tubes of paint.

## Brushes

| Need | Call |
|---|---|
| Contour, architecture | `brush.set('HB', color, 1.0–2.4)` |
| Dry shadow / folds | `brush.set('charcoal', color, 0.8–1.5)` |
| Hatched volume | `brush.hatch(6–10, 30–75, { rand: 0.2, continuous: true })` |
| Watercolour mass | `brush.fill(color, 90–160)` + `fillBleed` + `fillTexture` |
| Flat poster block | `brush.wash(color, 160–230)` |
| Fine rain / wire | `brush.set('rotring', color, 0.5–0.9)` |
| Soft graphite | `brush.set('2H', color, 0.6–1.0)` |

Scale built-ins once in the engine. For a 1280×720 design, `brushScale` around
`3.2` is a good start. Check at 100%: lines should read at arm's length, not
look like hairlines.

## Line boil

Hand-drawn animation breathes at a lower rate than the video. The engine seeds
the random field from `floor(t * 12)`, so brush texture updates at 12 fps while
positions and camera can move at 24 fps. Do not add per-frame jitter to every
outline; that becomes noise. Let `api.boil(12)` drive small offsets when needed.

## Camera grammar

- One idea per shot. A shot is a painted thought, not a montage.
- Slow push-in (`translate` + slight `scale`) for interior realization.
- Lateral drift for walking; no handheld shake unless the story needs it.
- Hold the last 0.4–0.8 s of a shot; do not cut on the exact beat every time.
- If the camera moves, overscan the background by 80–140 px so no paper seam
  appears at the edge.

## Lyrics as paint

- Use a bone fill with a dark keyline, not pure white. It reads on night and
  dawn plates.
- Keep the lyric in the lower third, clear of the busiest silhouette.
- Wipe on over roughly 70% of the line duration; hold the rest.
- A faint unsung line at 9% opacity is enough; never use a solid subtitle bar.
- For a custom lyric treatment, set `shot.lyrics: "scene"` and draw
  `api.lyric` yourself.

## Sound and silence

The soundtrack is the clock. Set `audio.startAt` and `lyrics.offsetMs` before
review, not after. If the audio is longer than the timeline, the encoder uses
`-shortest`; if the picture is longer, trim shots so the last frame lands on a
musical phrase.

## What breaks the style

- Neon gradients, pure black, pure white, chrome, glow without pigment.
- Uniform digital line weight on every edge.
- Camera shake on every cut.
- A lyric bar with a hard rectangle and no paper texture.
- Filling the frame edge-to-edge with detail; leave air.
