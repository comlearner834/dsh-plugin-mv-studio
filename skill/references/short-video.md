# Short video (beat-synced showcase)

A 15–60 s vertical short with a fixed grammar: opening, big-card/style rounds,
ending. It is a structure, not a template of someone else's art.

## Formula

```text
total = 3 + N × 4 + 3 = 6 + 4N
round = 1 s big card + 3 s style segment
N = 3..12  →  18..54 s
```

At 30 fps, each round is 120 frames: 30 card + 90 style. The first frame of
every style segment is the beat hit. Use `scripts/short-plan.mjs` to write the
timeline and brief; do not re-derive it by hand.

```bash
node scripts/short-plan.mjs --title "纸灯" --topic "一盏纸灯的新品预热" \
  --rounds 6 --ratio vertical --theme coral --out short-plan.json
```

## Format

| Ratio | Pixels | Use |
|---|---|---|
| 9:16 | 1080×1920 | default vertical short |
| 16:9 | 1920×1080 | landscape cut |
| 1:1 | 1080×1080 | square feed |

Keep type and faces inside the middle 80%. No bottom subtitle bar; text is part
of the composition (capsule, label, card).

## Themes

Themes are role palettes, not three swapped colours. Start with one:

| id | Name | Background | Accent |
|---|---|---|---|
| `coral` | 珊瑚暗夜 | `#0e0e0d` | `#d97757` |
| `claude` | 橙光白 | `#f4efe6` | `#d97757` |
| `aqua` | 水蓝莫兰迪 | `#eef3f0` | `#6f9e9a` |
| `amber` | 琥珀黑金 | `#15120e` | `#c99b4e` |
| `blueprint` | 蓝图纸 | `#e9eef4` | `#2c5d8a` |
| `graphite` | 石墨信号 | `#15171a` | `#8a939b` |
| `celadon` | 青瓷白 | `#eef1e9` | `#7b9b86` |
| `crimson` | 绯墨剧场 | `#160d10` | `#b23a48` |

A custom theme must name colour, material, type, light and accent. It still
uses the same structure.

## Round grammar

- **Big card (1 s / 2 beats).** One line of context plus one keyword. Alternate
  layouts; do not repeat the same card twice in a row. A card can slam in, wipe,
  or cut; the next style segment opens on the hit.
- **Style segment (3 s / 6 beats).** One idea, one composition, one motion
  system. Every element is designed; no placeholder shapes. Carry one object or
  colour out of the card into the segment.
- **No repeated layout.** Rotate composition, scale, palette emphasis and
  transition; a short reads as a showcase, not a slideshow.
- **One idea per round.** If the idea needs more than 3 s, cut it; do not slow
  the whole short.

## Fast review loop

```text
plan -> 5–6 stills per round -> contact sheet -> one full render -> inspect
```

For each round render `t = 0.2, 0.8, 1.4, 2.0, 2.6` within the round; then a
1 fps sheet of the whole short. Look at the stills before spending render time.
After encode, run `node scripts/check-film.mjs` and inspect its sheet, stills,
audio spectrogram and motion curve.

## Sound

If the brief calls for sound, use one bed and one hit family. Cards can drop the
music; the style segment opens with a hit on frame one. Keep hits within 30 ms
of the edit table. A silent short is allowed only when the brief is silent.

## Do not copy

- Do not adopt HTML/Canvas/Three.js just because the reference uses it; keep
  the p5.brush pipeline.
- Do not force 61 s, 30 fps or eleven styles; use 18–54 s and the number of
  rounds the idea needs.
- Do not copy the reference's copy, palettes or layouts; use it as grammar.
- Do not bake subtitles into the bottom of the frame.
- Do not start a full render without explicit approval.
