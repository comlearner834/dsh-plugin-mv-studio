/**
 * Shot 01 — a window at dusk.
 * Pure function of t: no frameCount, no Math.random, no persistent state.
 */
export const meta = {
  name: 'window',
  note: 'Dusk interior, slow push-in, paper moon.',
};

export function draw(api) {
  const { p, brush, t, u, W, H, palette } = api;

  // --- sky and room, painted as broad opaque fields -----------------------
  const skyTop = p.color('#24384d');
  const skyBottom = p.color('#c98b66');
  for (let i = 0; i < 26; i += 1) {
    p.noStroke();
    p.fill(p.lerpColor(skyTop, skyBottom, i / 25));
    p.rect(-40, (i * H) / 26, W + 80, H / 26 + 1);
  }

  const drift = api.easeInOut(u);
  p.push();
  p.translate(-18 * drift, 4 * drift);

  // Wall: four blocks leave a window-shaped hole.
  const wall = p.color(38, 31, 26, 238);
  p.noStroke();
  p.fill(wall);
  p.rect(-40, -12, W + 80, 188);
  p.rect(-40, 596, W + 80, H - 586);
  p.rect(-40, 176, 348, 420);
  p.rect(972, 176, W - 932, 420);

  // --- window night ------------------------------------------------------
  const nightTop = p.color('#1d3147');
  const nightBottom = p.color('#6f7d78');
  for (let i = 0; i < 22; i += 1) {
    p.noStroke();
    p.fill(p.lerpColor(nightTop, nightBottom, i / 21));
    p.rect(308, 176 + (i * 420) / 22, 664, 420 / 22 + 1);
  }

  // Moon: a watercolour disc with a dry rim.
  brush.field('hand');
  brush.set('HB', p.color(245, 231, 199, 210), 1.1);
  brush.noFill();
  brush.noHatch();
  brush.fill('#f3dfb6', 118);
  brush.fillBleed(0.45, 'out');
  brush.fillTexture(0.62, 0.55);
  brush.circle(812, 286, 88, 0.55);
  brush.noFill();
  brush.set('2H', p.color(255, 250, 232, 170), 0.9);
  brush.arc(812, 286, 86, -2.5, 0.4);

  // Clouds / distant city inside the glass.
  brush.field('waves');
  brush.set('charcoal', p.color(30, 44, 58, 105), 1.2);
  brush.noFill();
  brush.spline(
    [
      [330, 388],
      [440, 360],
      [560, 398],
      [690, 370],
      [820, 398],
      [948, 376],
    ],
    0.45,
  );
  brush.set('HB', '#1f3243', 1.1);
  for (let i = 0; i < 12; i += 1) {
    const x = 330 + i * 54;
    const h = 22 + ((i * 37) % 58);
    brush.line(x, 596, x, 596 - h);
    brush.line(x, 596 - h, x + 24, 596 - h);
    brush.line(x + 24, 596 - h, x + 24, 596);
  }

  // Window frame.
  brush.set('HB', '#201a16', 2.4);
  brush.noFill();
  brush.line(308, 176, 972, 176);
  brush.line(308, 596, 972, 596);
  brush.line(308, 176, 308, 596);
  brush.line(972, 176, 972, 596);
  brush.set('HB', '#2a211b', 1.3);
  brush.line(640, 176, 640, 596);
  brush.line(308, 386, 972, 386);
  brush.set('rotring', p.color(232, 205, 166, 120), 0.8);
  brush.line(322, 190, 626, 190);
  brush.line(654, 190, 958, 190);

  // Sill.
  p.noStroke();
  p.fill(p.color(49, 36, 27, 250));
  p.rect(286, 596, 708, 30);
  brush.set('HB', '#1c1713', 2.2);
  brush.line(286, 596, 994, 596);
  brush.line(286, 626, 994, 626);

  // Curtains: folds and a soft inner shadow.
  brush.set('charcoal', p.color(36, 26, 22, 210), 1.2);
  brush.noFill();
  for (let i = 0; i < 5; i += 1) {
    const x = 318 + i * 27 + 3 * Math.sin(t * 0.8 + i);
    brush.spline(
      [
        [x, 180],
        [x - 18, 370],
        [x + 10, 590],
      ],
      0.55,
    );
  }
  brush.set('pastel', p.color(92, 56, 40, 85), 1.5);
  brush.noFill();
  for (let i = 0; i < 4; i += 1) {
    const x = 900 + i * 22;
    brush.spline(
      [
        [x, 180],
        [x + 12, 380],
        [x - 8, 590],
      ],
      0.55,
    );
  }

  // Plant on the sill.
  const potX = 366;
  const potY = 594;
  brush.set('HB', '#2a241d', 1.0);
  brush.fill('#a5583f', 105);
  brush.fillTexture(0.4, 0.3);
  brush.polygon([
    [potX - 38, potY - 46],
    [potX + 38, potY - 46],
    [potX + 27, potY],
    [potX - 27, potY],
  ]);
  brush.noFill();
  brush.set('charcoal', '#3f513c', 0.9);
  const leaves = [
    [-38, -92, -76, -138],
    [-8, -106, -14, -166],
    [24, -100, 58, -154],
    [8, -80, 36, -118],
    [-22, -72, -54, -108],
  ];
  for (const [x1, y1, x2, y2] of leaves) {
    brush.spline(
      [
        [potX + x1, potY + y1],
        [potX + (x1 + x2) / 2 + 14, potY + (y1 + y2) / 2],
        [potX + x2, potY + y2],
      ],
      0.6,
    );
  }

  // Foreground chair, almost a shadow.
  brush.set('charcoal', p.color(25, 20, 17, 235), 1.1);
  brush.noFill();
  brush.spline(
    [
      [78, 722],
      [68, 610],
      [108, 574],
      [206, 566],
      [246, 600],
      [252, 722],
    ],
    0.45,
  );
  brush.line(110, 636, 242, 632);
  brush.line(126, 700, 126, 724);
  brush.line(224, 700, 224, 724);

  // Dust in the last light.
  const motes = 26;
  for (let i = 0; i < motes; i += 1) {
    const x = 330 + ((i * 173 + t * 14) % 620);
    const y = 210 + ((i * 97 + Math.sin(t * 0.7 + i) * 10) % 350);
    p.noStroke();
    p.fill(p.color(255, 241, 206, 40 + (i % 5) * 8));
    p.circle(x, y, 1.2 + (i % 3) * 0.8);
  }

  p.pop();
}
