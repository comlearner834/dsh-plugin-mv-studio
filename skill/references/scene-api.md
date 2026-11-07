# Scene API

A scene is an ES module in `scenes/` that exports `draw(api)`. It is called
once per frame inside a p5 WEBGL sketch. The engine already:

- created a 1280×720 (or `project.width/height`) design space;
- set `p.randomSeed()` and `p.noiseSeed()` from `shot.seed` and `t`;
- reset brush/fill/hatch/field state;
- painted the base paper colour;
- applied the design-to-output transform.

Draw in **design pixels**: `x` from 0 to `api.W`, `y` from 0 to `api.H`. The
engine scales the whole sketch to the requested output size, including review
renders at half resolution.

## Minimal scene

```js
export const meta = { name: 'window', note: 'dusk interior' };

export function draw(api) {
  const { p, brush, t, u, W, H, palette } = api;

  // Native p5 fills are fine for broad blocks.
  p.noStroke();
  p.fill(palette.paper);
  p.rect(0, 0, W, H);

  brush.field('hand');
  brush.set('HB', palette.ink, 1.2);
  brush.noFill();
  brush.line(100, 120, 1180, 140);

  brush.fill(palette.rust, 110);
  brush.fillBleed(0.35, 'out');
  brush.fillTexture(0.5, 0.35);
  brush.circle(800, 300, 90, 0.7);

  api.text('a small title', W / 2, H * 0.84, {
    size: 34, color: palette.ink, alpha: 0.9, shadow: true,
  });
}
```

## Fields

| Field | Meaning |
|---|---|
| `api.p` | p5 instance |
| `api.brush` | p5.brush namespace |
| `api.t` | seconds inside this shot, `0..duration` |
| `api.u` | normalized `0..1` |
| `api.frame` | frame index within the shot |
| `api.fps` | project fps |
| `api.shot` | shot object from `project.json` |
| `api.project` | full project object |
| `api.palette` | merged palette |
| `api.designW`, `api.designH`, `api.W`, `api.H` | design dimensions |
| `api.lyric` | active lyric object or `null` |
| `api.lyricConfig` | merged lyric config |
| `api.totalDuration` | full video duration |
| `api.seed` | per-frame seed (derived from `t`) |

## Deterministic helpers

| Call | Use |
|---|---|
| `api.rand(a, b)` | seeded random; use instead of `Math.random` |
| `api.noise(x, y, z)` | seeded p5 noise |
| `api.boil(rate = 12)` | quantized time for line texture |
| `api.clamp`, `api.lerp`, `api.mix` | math |
| `api.smoothstep(a, b, x)` | eased 0..1 |
| `api.easeInOut(t)`, `api.easeOut(t)` | camera / motion easing |

## Paint helpers

```js
// Open painted line through points. Uses brush.field('hand') by default.
api.line([[80, 300], [400, 260], [780, 330]], {
  color: palette.ink, weight: 1.1, brush: 'HB', curvature: 0.5,
});

// Closed watercolour shape.
api.fill([[200, 200], [500, 180], [540, 420], [220, 440]], {
  color: palette.rust, opacity: 130, bleed: 0.35, grain: 0.5, border: 0.3,
});

// Hatching inside a polygon.
api.hatch(points, { dist: 8, angle: 42, color: palette.ink, weight: 0.7 });

// Flat poster block (no watercolour diffusion).
api.wash(points, palette.indigo, 190);

// Convenience primitives.
api.circle(640, 300, 80, { color: palette.ink, fill: palette.gold, opacity: 120 });
api.rect(100, 100, 400, 240, { color: palette.ink, weight: 0.8 });
```

All helpers reset conflicting brush state before drawing. If you call raw
`brush` methods, manage `noFill/noHatch/noWash` yourself.

## Text and glow

`api.text(value, x, y, style)` draws on the 2D ink layer above the painting.
Coordinates are design pixels.

```js
api.text('纸月亮', api.W / 2, api.H * 0.82, {
  size: 44,
  font: '"Songti SC", "SimSun", Georgia, serif',
  color: '#f7efdf',
  strokeColor: 'rgba(30,22,16,0.55)',
  strokeWidth: 3,
  weight: 400,
  letterSpacing: '0.12em',
  shadow: true,
  alpha: 0.95,
  rotate: 0,
  align: 'center',
  baseline: 'middle',
});
```

`api.glow(x, y, radius, color, alpha)` paints a soft warm halo on the ink layer.
Use it for lamps and suns; do not use watercolour yellow over blue unless you
want a green pigment mix.

## Custom lyrics

By default the engine draws the active LRC line. To style it yourself:

```json
{ "id": "02-street", "scene": "street", "lyrics": "scene", ... }
```

Then in the scene:

```js
if (api.lyric) {
  const a = api.lyric.alpha;
  const reveal = Math.min(1, api.lyric.progress / 0.7);
  api.text(api.lyric.text, api.W / 2, api.H * 0.84, {
    size: 40, color: '#f7efdf', alpha: a * 0.9,
    strokeColor: 'rgba(30,22,16,0.55)', strokeWidth: 3,
  });
  // Use reveal to clip or underline however you like.
}
```

## Rules

- No `Math.random`, `frameCount`, `millis`, `Date.now`, timers, or module-level
  mutable state. `npm run check` enforces the common cases.
- No `fetch` of stock assets; all geometry and texture must be code.
- Do not write files, start processes, or touch the DOM from a scene.
- Keep each scene under ~200 lines; move repeated marks into local functions.
- Prefer 3–8 large painted gestures over 100 tiny strokes. p5.brush is
  expensive at 1280×720 and 24 fps.
