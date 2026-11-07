/**
 * Shot 02 - the walk home in rain.
 * Pure function of t.
 */
export const meta = {
  name: 'street',
  note: 'Rain, sodium light, one figure under an umbrella.',
};

export function draw(api) {
  const { p, brush, t, u, W, H } = api;

  const skyTop = p.color('#15253a');
  const skyBottom = p.color('#50616a');
  for (let i = 0; i < 28; i += 1) {
    p.noStroke();
    p.fill(p.lerpColor(skyTop, skyBottom, i / 27));
    p.rect(-140, (i * H * 0.72) / 28, W + 280, (H * 0.72) / 28 + 1);
  }

  // Camera pans left as the figure walks right.
  const pan = -42 * api.easeInOut(u);
  p.push();
  p.translate(pan, 0);

  // Distant houses: flat washes, then dry linework.
  const houses = [
    [40, 430, 190, 270, '#3d3532'],
    [230, 466, 150, 234, '#4b3a32'],
    [392, 398, 210, 302, '#332f2e'],
    [612, 448, 160, 252, '#47382f'],
    [780, 420, 210, 280, '#35302d'],
    [1000, 458, 240, 242, '#4a3930'],
  ];
  for (const [x, y, w, h, color] of houses) {
    p.noStroke();
    p.fill(p.color(color));
    p.rect(x, y, w, h + 70);
    brush.set('charcoal', p.color(20, 18, 17, 180), 0.7);
    brush.noFill();
    brush.rect(x, y, w, h + 70, 'corner');
    // windows
    for (let wy = y + 34; wy < y + h - 30; wy += 48) {
      for (let wx = x + 22; wx < x + w - 26; wx += 44) {
        if ((wx + wy) % 7 === 0) continue;
        const lit = (wx * 13 + wy * 7) % 5 < 2;
        p.noStroke();
        p.fill(lit ? p.color(211, 164, 91, 168) : p.color(27, 33, 38, 210));
        p.rect(wx, wy, 18, 26);
      }
    }
  }

  // Street and wet reflections.
  const street = p.color('#24272a');
  p.noStroke();
  p.fill(street);
  p.rect(-140, 552, W + 280, H - 552);
  p.fill(p.color(49, 48, 45, 220));
  p.rect(-140, 552, W + 280, 12);

  // Sodium lamps: the only warm thing.
  const lamps = [
    [166, 522],
    [702, 520],
    [1176, 518],
  ];
  for (const [x, base] of lamps) {
    brush.set('HB', '#171b1f', 1.3);
    brush.noFill();
    brush.line(x, base, x, base - 256);
    brush.line(x, base - 256, x + 46, base - 256);
    brush.line(x + 46, base - 256, x + 54, base - 238);
    const flicker = 0.84 + 0.08 * Math.sin(t * 6.3 + x);
    brush.noField();
    brush.set('HB', p.color(244, 188, 92, 245), 1.2);
    brush.noFill();
    brush.wash('#f4b75c', 220);
    brush.circle(x + 48, base - 240, 26, 0.55);
    brush.noWash();
    api.glow(x + 48, base - 240, 150, '#f4b75c', 0.2 * flicker);
    api.glow(x + 48, base - 240, 52, '#ffd58a', 0.32 * flicker);
    brush.noFill();
    brush.set('2H', p.color(255, 228, 168, 82 * flicker), 0.9);
    brush.arc(x + 48, base - 240, 82, 0.25, 2.9);
    // reflection
    brush.set('rotring', p.color(224, 172, 86, 92), 0.8);
    brush.noFill();
    for (let i = 0; i < 4; i += 1) {
      const yy = 568 + i * 18;
      brush.spline(
        [
          [x - 26 + Math.sin(t + i) * 7, yy],
          [x + 42, yy + 4],
          [x + 88 + Math.cos(t + i) * 5, yy - 2],
        ],
        0.45,
      );
    }
  }

  // Rain: deterministic diagonals, never Math.random.
  brush.set('rotring', p.color(218, 230, 231, 74), 0.55);
  brush.noFill();
  for (let i = 0; i < 66; i += 1) {
    const x = ((i * 197 + 41) % 1360) + pan * 0.35;
    const y = ((i * 83 + t * 360) % 610) + 18;
    const len = 18 + (i % 7) * 8;
    brush.line(x, y, x - 10, y + len);
  }

  // Figure under an umbrella.
  const fx = 520 + 34 * api.easeOut(u) + Math.sin(t * 1.15) * 2;
  const fy = 600 + Math.sin(t * 3.2) * 2;
  brush.field('hand');
  brush.set('charcoal', p.color(21, 22, 23, 245), 1.15);
  brush.noFill();
  // umbrella
  brush.spline(
    [
      [fx - 98, fy - 108],
      [fx - 54, fy - 152],
      [fx + 18, fy - 156],
      [fx + 84, fy - 112],
    ],
    0.7,
  );
  brush.line(fx - 98, fy - 108, fx + 84, fy - 112);
  brush.line(fx - 18, fy - 152, fx - 18, fy - 36);
  brush.set('charcoal', p.color(18, 19, 20, 232), 1.4);
  brush.spline(
    [
      [fx - 16, fy - 36],
      [fx - 13, fy + 24],
      [fx - 22, fy + 94],
      [fx - 8, fy + 170],
    ],
    0.5,
  );
  brush.spline(
    [
      [fx + 8, fy + 10],
      [fx + 15, fy + 88],
      [fx + 26, fy + 172],
    ],
    0.5,
  );
  brush.line(fx - 22, fy + 80, fx + 15, fy + 86);
  // head and coat mass
  brush.set('charcoal', p.color(24, 23, 22, 230), 1.1);
  brush.fill(p.color(25, 24, 23, 220), 150);
  brush.fillTexture(0.3, 0.2);
  brush.circle(fx - 2, fy - 14, 15, 0.7);
  brush.noFill();
  brush.spline(
    [
      [fx - 22, fy + 4],
      [fx - 4, fy + 28],
      [fx + 18, fy + 8],
    ],
    0.45,
  );

  // Puddle ripples around the feet.
  brush.set('2H', p.color(213, 226, 225, 76), 0.65);
  brush.noFill();
  for (let i = 0; i < 5; i += 1) {
    const rr = 18 + ((t * 22 + i * 22) % 110);
    brush.arc(fx + 4, fy + 176, rr, 0.1, Math.PI - 0.1);
  }

  p.pop();
}

