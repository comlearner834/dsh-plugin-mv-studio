/**
 * Shot 03 — first light, the bus, the end of the walk.
 * Pure function of t.
 */
export const meta = {
  name: 'dawn',
  note: 'Warm horizon, approaching bus, a small departure.',
};

export function draw(api) {
  const { p, brush, t, u, W, H } = api;

  const top = p.color('#536b7c');
  const mid = p.color('#d9a06e');
  const low = p.color('#f2d6a4');
  for (let i = 0; i < 34; i += 1) {
    const k = i / 33;
    const c = k < 0.58 ? p.lerpColor(top, mid, k / 0.58) : p.lerpColor(mid, low, (k - 0.58) / 0.42);
    p.noStroke();
    p.fill(c);
    p.rect(0, (i * H * 0.66) / 34, W, (H * 0.66) / 34 + 1);
  }

  // Distant hills.
  brush.field('waves');
  brush.set('charcoal', p.color(70, 79, 78, 150), 1.3);
  brush.noFill();
  brush.spline(
    [
      [0, 438],
      [170, 408],
      [330, 438],
      [520, 412],
      [700, 448],
      [900, 418],
      [1080, 446],
      [1280, 420],
    ],
    0.5,
  );
  brush.set('HB', p.color(84, 92, 88, 100), 1.0);
  brush.spline(
    [
      [0, 470],
      [220, 452],
      [430, 478],
      [650, 456],
      [880, 482],
      [1100, 458],
      [1280, 472],
    ],
    0.5,
  );

  // Sun, low and generous.
  brush.set('HB', p.color(255, 225, 160, 230), 1.0);
  brush.fill('#f6cd85', 150);
  brush.fillBleed(0.5, 'out');
  brush.fillTexture(0.5, 0.4);
  brush.circle(964, 402, 74, 0.6);
  brush.noFill();
  brush.set('2H', p.color(255, 244, 214, 120), 0.8);
  for (let i = 0; i < 3; i += 1) brush.arc(964, 402, 84 + i * 18, 2.6, 5.9);

  // Field and road.
  p.noStroke();
  p.fill(p.color(96, 93, 74));
  p.rect(0, 480, W, H - 480);
  p.fill(p.color(57, 54, 49));
  p.beginShape();
  p.vertex(500, 480);
  p.vertex(780, 480);
  p.vertex(1240, 720);
  p.vertex(40, 720);
  p.endShape(p.CLOSE);

  // Road edges, drawn like a long exhale.
  brush.set('charcoal', p.color(33, 31, 28, 210), 1.2);
  brush.noFill();
  brush.spline(
    [
      [500, 486],
      [468, 548],
      [388, 636],
      [220, 724],
    ],
    0.45,
  );
  brush.spline(
    [
      [780, 486],
      [820, 548],
      [900, 636],
      [1088, 724],
    ],
    0.45,
  );
  brush.set('rotring', p.color(218, 194, 154, 120), 0.9);
  brush.line(640, 500, 640, 540);
  brush.line(636, 566, 644, 620);
  brush.line(630, 660, 650, 716);

  // Telephone poles receding.
  brush.set('HB', p.color(44, 37, 31, 180), 0.9);
  for (let i = 0; i < 5; i += 1) {
    const x = 1160 - i * 148;
    const y = 540 + i * 18;
    const h = 104 - i * 10;
    brush.line(x, y, x, y - h);
    brush.line(x - 14, y - h + 12, x + 14, y - h + 12);
    brush.line(x - 9, y - h + 22, x + 9, y - h + 22);
  }

  // Grass: short, wind-bent marks, not a green carpet.
  brush.field('waves');
  brush.set('HB', p.color(77, 82, 57, 105), 0.65);
  brush.noFill();
  for (let i = 0; i < 64; i += 1) {
    const x = ((i * 83 + 19) % 1360) - 40;
    const y = 492 + (i % 14) * 15;
    const lean = Math.sin(i * 1.7 + t * 0.6) * 4;
    brush.line(x, y, x + 7 + lean, y - 10 - (i % 5) * 2);
  }

  // Bus: a warm block that grows out of the horizon.
  const arrive = api.easeOut(Math.min(1, u * 1.25));
  const bx = 360 + (1 - arrive) * 190;
  const by = 548 + (1 - arrive) * 12;
  const bw = 330;
  const bh = 116;

  p.noStroke();
  p.fill(p.color(183, 111, 65, 245));
  p.rect(bx, by, bw, bh);
  p.fill(p.color(225, 198, 153, 245));
  p.rect(bx + 18, by + 16, bw - 36, 42);
  // front glass and a dark door post
  p.fill(p.color(39, 45, 46, 235));
  p.rect(bx + 5, by + 16, 17, 42);
  p.fill(p.color(40, 42, 41, 235));
  p.rect(bx + 12, by + 68, bw - 24, 28);
  p.fill(p.color(30, 29, 27, 245));
  p.circle(bx + 64, by + bh, 22);
  p.circle(bx + bw - 58, by + bh, 22);
  p.fill(p.color(229, 215, 187, 240));
  p.circle(bx + 64, by + bh, 11);
  p.circle(bx + bw - 58, by + bh, 11);

  brush.set('HB', p.color(45, 34, 27, 210), 1.0);
  brush.noFill();
  brush.rect(bx, by, bw, bh, 'corner');
  brush.line(bx + 18, by + 58, bx + bw - 18, by + 58);
  for (let i = 0; i < 4; i += 1) brush.line(bx + 58 + i * 58, by + 16, bx + 58 + i * 58, by + 58);
  // dry-brushed rust and a little window glare
  brush.set('HB', p.color(94, 53, 31, 65), 0.5);
  brush.field('hand');
  for (let i = 0; i < 7; i += 1) {
    const sx = bx + 22 + i * 43;
    brush.line(sx, by + 66, sx + 8, by + bh - 8);
  }
  brush.line(bx + 6, by + 100, bx + bw - 6, by + 98);
  brush.line(bx + 6, by + 106, bx + bw - 8, by + 104);
  brush.set('2H', p.color(255, 247, 218, 105), 0.7);
  brush.line(bx + 34, by + 54, bx + 70, by + 22);
  brush.line(bx + 96, by + 54, bx + 132, by + 22);
  // Headlight.
  brush.set('HB', p.color(255, 231, 167, 235), 0.9);
  brush.fill(p.color(255, 220, 143, 120), 130);
  brush.circle(bx - 3, by + 84, 12, 0.7);
  brush.noFill();

  // Waiting figure, small against the morning.
  const fx = 930;
  const fy = 610;
  brush.set('charcoal', p.color(29, 27, 24, 240), 1.3);
  brush.fill(p.color(29, 27, 24, 235), 150);
  brush.circle(fx, fy - 96, 11, 0.7);
  brush.noFill();
  brush.spline(
    [
      [fx - 13, fy - 78],
      [fx - 5, fy - 28],
      [fx - 12, fy],
    ],
    0.4,
  );
  brush.spline(
    [
      [fx + 13, fy - 78],
      [fx + 6, fy - 28],
      [fx + 14, fy],
    ],
    0.4,
  );
  brush.line(fx - 15, fy - 62, fx + 15, fy - 62);
  // Small bag.
  brush.rect(fx + 12, fy - 44, 22, 24, 'corner');

  // Birds, a last punctuation.
  brush.set('HB', p.color(45, 40, 35, 160), 0.8);
  for (let i = 0; i < 3; i += 1) {
    const x = 820 + i * 44 + Math.sin(t * 0.4 + i) * 5;
    const y = 190 + i * 17;
    brush.arc(x, y, 8, -0.8, 0.7);
    brush.arc(x + 15, y, 8, 2.4, 3.9);
  }
}
