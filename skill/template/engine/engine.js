import { parseLrc, lyricAt } from './lrc.js';
import { scenes } from '../scenes/index.js';

const params = new URLSearchParams(location.search);
const shotId = params.get('shot');
const debug = params.get('debug') === '1';

const qs = (value) => String(value).split('/').map(encodeURIComponent).join('/');

function fail(error) {
  const node = document.getElementById('boot-error');
  const message = error?.stack || error?.message || String(error);
  window.__ERROR__ = message;
  if (node) {
    node.style.display = 'flex';
    node.textContent = message;
  }
  console.error(error);
}

const project = await fetch('/project.json', { cache: 'no-store' }).then((r) => {
  if (!r.ok) throw new Error(`project.json: HTTP ${r.status}`);
  return r.json();
});

let cursor = 0;
for (const shot of project.shots) {
  shot.start = cursor;
  cursor += shot.duration;
}
const totalDuration = cursor;
const shot = project.shots.find((s) => s.id === shotId);
if (!shot) throw new Error(`Unknown shot: ${shotId}`);

const designW = Number(project.width) || 1280;
const designH = Number(project.height) || 720;
const outW = Math.max(2, Math.round(Number(params.get('w')) || designW));
const outH = Math.max(2, Math.round(Number(params.get('h')) || designH));
const fps = Math.max(1, Number(project.fps) || 24);
const scale = outW / designW;
const palette = {
  paper: '#efe4ce',
  paperDeep: '#e4d4b7',
  ink: '#2a231d',
  rust: '#b6543a',
  indigo: '#29465b',
  moss: '#61705a',
  gold: '#c99b4e',
  bone: '#f7efdf',
  ...(project.palette || {}),
};

const songBpm = Number(project.bpm) || 0;
const beatOffset = Number(project.beatOffset ?? project.offset ?? 0);
const beatSeconds = songBpm > 0 ? 60 / songBpm : 0;
const lyricConfig = { enabled: true, style: 'wipe', size: 42, bottom: 0.86, ...(project.lyrics || {}) };
let parsedLyric = null;
if (lyricConfig.enabled && lyricConfig.file) {
  try {
    const text = await fetch(`/${qs(lyricConfig.file)}`, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });
    parsedLyric = parseLrc(text, { offsetMs: lyricConfig.offsetMs ?? 0 });
  } catch (error) {
    console.warn('Lyrics unavailable:', error);
  }
}

const scene = scenes?.[shot.scene];
if (!scene || typeof scene.draw !== 'function') {
  throw new Error(`No scene export for "${shot.scene}". Add it to scenes/index.js.`);
}

const stage = document.getElementById('stage');
const grainCanvas = document.getElementById('grain');
const inkCanvas = document.getElementById('ink');
const grainCtx = grainCanvas.getContext('2d', { alpha: true });
const inkCtx = inkCanvas.getContext('2d', { alpha: true });
stage.style.width = `${outW}px`;
stage.style.height = `${outH}px`;
for (const canvas of [grainCanvas, inkCanvas]) {
  canvas.width = outW;
  canvas.height = outH;
}

let pending = null;
let frameSerial = 0;
let textQueue = [];
let glowQueue = [];
let grainStatic = null;
let grainTile = null;
let vig = null;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = lerp;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = (t) => Math.pow(clamp(t), 3);
const backOut = (t) => {
  const x = clamp(t);
  const s = 1.7;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
const kf = (t, keys, easing = easeInOut) => {
  if (!keys.length) return 0;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1) {
    if (t < keys[i][0]) {
      const [a, va] = keys[i - 1];
      const [b, vb] = keys[i];
      const k = easing((t - a) / (b - a));
      return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
    }
  }
  return keys[keys.length - 1][1];
};
const spring = (t, t0, damping = 6, speed = 12) => {
  if (t < t0) return 0;
  const dt = t - t0;
  return Math.exp(-damping * dt) * Math.sin(speed * dt);
};
const jumpArc = (t, t0, duration, height = 1) => {
  const p = clamp((t - t0) / duration);
  return 4 * height * p * (1 - p);
};
const take = (t, t0, duration = 0.4) => backOut(clamp((t - t0) / duration));
const hashKey = (key) => {
  let h = 2166136261;
  for (const char of String(key)) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
};

function hash32(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

function hash01(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function makeGrainStatic() {
  const c = document.createElement('canvas');
  c.width = outW;
  c.height = outH;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, outW, outH);

  const dots = Math.round((outW * outH) / 900);
  for (let i = 0; i < dots; i += 1) {
    const x = hash01(i * 3.13 + 0.7) * outW;
    const y = hash01(i * 7.71 + 2.1) * outH;
    const r = 0.35 + hash01(i * 9.31) * 1.45;
    ctx.globalAlpha = 0.12 + hash01(i * 5.53) * 0.2;
    ctx.fillStyle = hash01(i * 2.17) > 0.56 ? '#7f654c' : '#fffaf0';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.055;
  ctx.strokeStyle = '#745a43';
  ctx.lineWidth = 0.8;
  const fibers = Math.round((outW + outH) * 0.16);
  for (let i = 0; i < fibers; i += 1) {
    const y = hash01(i * 4.7) * outH;
    const x = hash01(i * 8.3) * outW;
    const len = 12 + hash01(i * 12.1) * 90;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.45, y + (hash01(i * 3.9) - 0.5) * 5, x + len, y + (hash01(i * 6.1) - 0.5) * 3);
    ctx.stroke();
  }

  grainStatic = c;

  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(tile.width, tile.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(hash01(i * 0.77) * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
}

function drawGrain(seed) {
  grainCtx.clearRect(0, 0, outW, outH);
  if (grainStatic) grainCtx.drawImage(grainStatic, 0, 0);

  const pattern = grainCtx.createPattern(grainTile, 'repeat');
  if (pattern) {
    grainCtx.save();
    grainCtx.globalAlpha = 0.035;
    grainCtx.globalCompositeOperation = 'multiply';
    grainCtx.translate((seed % 160), ((seed >>> 7) % 160));
    grainCtx.fillStyle = pattern;
    grainCtx.fillRect(-160, -160, outW + 320, outH + 320);
    grainCtx.restore();
  }

  if (!vig) {
    vig = grainCtx.createRadialGradient(
      outW * 0.5,
      outH * 0.47,
      Math.min(outW, outH) * 0.22,
      outW * 0.5,
      outH * 0.5,
      Math.max(outW, outH) * 0.72,
    );
    vig.addColorStop(0, 'rgba(44,32,21,0)');
    vig.addColorStop(0.72, 'rgba(44,32,21,0.055)');
    vig.addColorStop(1, 'rgba(33,23,15,0.24)');
  }
  grainCtx.save();
  grainCtx.fillStyle = vig;
  grainCtx.fillRect(0, 0, outW, outH);
  grainCtx.globalAlpha = 0.26;
  grainCtx.strokeStyle = 'rgba(55,39,25,0.55)';
  grainCtx.lineWidth = Math.max(1, outW / 1280);
  grainCtx.strokeRect(0.5, 0.5, outW - 1, outH - 1);
  grainCtx.restore();
}

function fontString(style) {
  const weight = style.weight ?? 400;
  const size = Number(style.size ?? 32);
  const family = style.font ?? '"Cormorant Garamond", Georgia, "Songti SC", "SimSun", serif';
  return `${weight} ${size}px ${family}`;
}

function paintText(ctx, value, x, y, style = {}) {
  if (value === undefined || value === null || value === '') return;
  const alpha = clamp(style.alpha ?? 1);
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.translate(x, y);
  if (style.rotate) ctx.rotate(style.rotate);
  ctx.font = fontString(style);
  ctx.textAlign = style.align || 'center';
  ctx.textBaseline = style.baseline || 'middle';
  ctx.fillStyle = style.color || palette.ink;
  ctx.globalAlpha = alpha;
  try {
    ctx.letterSpacing = style.letterSpacing || '0.015em';
  } catch {
    /* older canvas builds */
  }
  if (style.shadow) {
    ctx.shadowColor = style.shadowColor || 'rgba(239,228,206,0.72)';
    ctx.shadowBlur = style.shadowBlur ?? 8;
    ctx.shadowOffsetY = style.shadowOffsetY ?? 2;
  }
  const maxWidth = style.maxWidth ? style.maxWidth : undefined;
  if (style.strokeColor) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = style.strokeWidth ?? 3;
    ctx.strokeStyle = style.strokeColor;
    ctx.strokeText(String(value), 0, 0, maxWidth);
  }
  ctx.fillText(String(value), 0, 0, maxWidth);
  if (style.inkBleed) {
    ctx.globalAlpha = alpha * 0.22;
    ctx.fillText(String(value), 0.8, 0.5, maxWidth);
  }
  ctx.restore();
}

function makeApi(t, frame, activeLyric) {
  const sceneSeed = hash32((shot.seed || 1) * 100003 + Math.floor(t * 12) * 7919 + 17);
  const api = {
    p: null,
    brush: null,
    t,
    u: shot.duration > 0 ? clamp(t / shot.duration) : 0,
    frame,
    fps,
    shot,
    project,
    palette,
    designW,
    designH,
    W: designW,
    H: designH,
    scale,
    seed: sceneSeed,
    lyric: activeLyric,
    lyricConfig,
    totalDuration,
    bpm: songBpm || null,
    beatSeconds: beatSeconds || null,
    beatOffset,
    clamp,
    lerp,
    mix,
    smoothstep,
    easeInOut,
    easeOut,
    easeIn,
    backOut,
    kf,
    spring,
    jump: jumpArc,
    take,
    onTwos: (rate = 12) => Math.floor(t * rate) / rate,
    beat: (time = t) => (beatSeconds ? (time - beatOffset) / beatSeconds : 0),
    beatN: (time = t) => (beatSeconds ? Math.floor((time - beatOffset) / beatSeconds) : 0),
    pulse: (k = 6) => {
      if (!beatSeconds) return 0;
      const beat = (t - beatOffset) / beatSeconds;
      return Math.exp(-(beat - Math.floor(beat)) * k);
    },
    reseed(key) {
      const localSeed = hash32(sceneSeed ^ hashKey(key));
      api.p.randomSeed(localSeed);
      api.p.noiseSeed(localSeed);
      return localSeed;
    },
    rand: (a = 0, b = 1) => api.p.random(a, b),
    noise: (x, y = 0, z = 0) => api.p.noise(x, y, z),
    boil: (rate = 12) => Math.floor(t * rate) / rate,
    text(value, x, y, style = {}) {
      textQueue.push({ value, x, y, style });
    },
    glow(x, y, radius, color = palette.gold, alpha = 0.35) {
      glowQueue.push({ x, y, radius, color, alpha });
    },
    lyricText(value, style = {}) {
      textQueue.push({ value, x: designW / 2, y: designH * (lyricConfig.bottom ?? 0.86), style });
    },
    line(points, style = {}) {
      if (!Array.isArray(points) || points.length < 2) return;
      const brush = window.brush;
      brush.set(style.brush || 'HB', style.color || palette.ink, style.weight ?? 1);
      brush.noFill();
      brush.noHatch();
      brush.noMass();
      brush.noWash();
      if (style.field === null) brush.noField();
      else brush.field(style.field || 'hand');
      brush.spline(points, style.curvature ?? 0.5);
    },
    fill(points, style = {}) {
      if (!Array.isArray(points) || points.length < 3) return;
      const brush = window.brush;
      brush.set(style.brush || 'HB', style.color || palette.ink, style.weight ?? 0.6);
      brush.noHatch();
      brush.noMass();
      brush.noWash();
      if (style.field === null) brush.noField();
      else brush.field(style.field || 'hand');
      if (style.texture !== false) {
        brush.fill(style.color || palette.rust, style.opacity ?? 150);
        brush.fillBleed(style.bleed ?? 0.3, style.bleedDirection || 'out');
        brush.fillTexture(style.grain ?? 0.45, style.border ?? 0.35);
      } else {
        brush.wash(style.color || palette.rust, style.opacity ?? 150);
      }
      brush.polygon(points);
      brush.noFill();
      brush.noWash();
    },
    hatch(points, style = {}) {
      if (!Array.isArray(points) || points.length < 3) return;
      const brush = window.brush;
      brush.set(style.brush || 'HB', style.color || palette.ink, style.weight ?? 0.7);
      brush.noFill();
      brush.noMass();
      brush.noWash();
      if (style.field === null) brush.noField();
      else brush.field(style.field || 'hand');
      brush.hatch(style.dist ?? 9, style.angle ?? 38, {
        rand: style.random ?? 0.22,
        continuous: style.continuous ?? true,
        gradient: style.gradient ?? 0.18,
      });
      brush.hatchStyle(style.hatchBrush || 'rotring', style.hatchColor || style.color || palette.ink, style.hatchWeight ?? 0.8);
      brush.polygon(points);
      brush.noHatch();
      brush.noFill();
    },
    wash(points, color = palette.rust, opacity = 120) {
      if (!Array.isArray(points) || points.length < 3) return;
      const brush = window.brush;
      brush.noHatch();
      brush.noMass();
      brush.noFill();
      brush.wash(color, opacity);
      brush.polygon(points);
      brush.noWash();
    },
    circle(x, y, r, style = {}) {
      const brush = window.brush;
      brush.set(style.brush || 'HB', style.color || palette.ink, style.weight ?? 0.8);
      if (style.fill) {
        brush.fill(style.fill, style.opacity ?? 140);
        brush.fillBleed(style.bleed ?? 0.25, 'out');
        brush.fillTexture(style.grain ?? 0.4, style.border ?? 0.3);
      } else {
        brush.noFill();
      }
      if (style.hatch) {
        brush.hatch(style.hatchDist ?? 8, style.hatchAngle ?? 35, { rand: 0.2, continuous: true });
      } else {
        brush.noHatch();
      }
      brush.circle(x, y, r, style.wobble ?? 0.75);
      brush.noFill();
      brush.noHatch();
    },
    rect(x, y, w, h, style = {}) {
      const brush = window.brush;
      brush.set(style.brush || 'HB', style.color || palette.ink, style.weight ?? 0.7);
      if (style.fill) {
        brush.fill(style.fill, style.opacity ?? 120);
        brush.fillBleed(style.bleed ?? 0.2, 'out');
        brush.fillTexture(style.grain ?? 0.35, style.border ?? 0.25);
      } else {
        brush.noFill();
      }
      if (style.hatch) brush.hatch(style.hatchDist ?? 8, style.hatchAngle ?? 35, { rand: 0.2, continuous: true });
      else brush.noHatch();
      brush.rect(x, y, w, h, style.mode || 'corner');
      brush.noFill();
      brush.noHatch();
    },
  };
  return api;
}

function resetBrush() {
  const brush = window.brush;
  brush.noStroke();
  brush.noFill();
  brush.noHatch();
  brush.noMass();
  brush.noWash();
  brush.noField();
  brush.noClip();
}

function drawLyric(activeLyric) {
  if (!activeLyric || shot.lyrics === 'scene') return;
  const hasWordTiming = activeLyric.line.words.some((word) => word.time !== null);
  const style = hasWordTiming ? 'wipe' : lyricConfig.style || 'wipe';
  const base = {
    size: lyricConfig.size ?? 42,
    weight: lyricConfig.weight ?? 400,
    font: lyricConfig.font ?? '"Cormorant Garamond", Georgia, "Songti SC", "SimSun", serif',
    color: lyricConfig.color || '#f7efdf',
    letterSpacing: lyricConfig.letterSpacing || '0.08em',
    shadow: true,
    shadowBlur: 8,
    shadowColor: 'rgba(24,17,12,0.55)',
    strokeColor: lyricConfig.strokeColor || 'rgba(34,26,19,0.58)',
    strokeWidth: lyricConfig.strokeWidth ?? 3.2,
    inkBleed: false,
  };
  const x = designW * (lyricConfig.x ?? 0.5);
  const y = designH * (lyricConfig.bottom ?? 0.86);
  const alpha = activeLyric.alpha * (lyricConfig.alpha ?? 0.94);

  inkCtx.save();
  paintText(inkCtx, activeLyric.text, x, y, {
    ...base,
    alpha: alpha * 0.09,
    strokeColor: null,
    shadow: false,
    inkBleed: false,
  });

  if (style === 'wipe') {
    inkCtx.save();
    inkCtx.font = fontString(base);
    inkCtx.textAlign = 'center';
    inkCtx.textBaseline = 'middle';
    try {
      inkCtx.letterSpacing = base.letterSpacing;
    } catch {
      /* noop */
    }
    const width = inkCtx.measureText(activeLyric.text).width;
    const pad = 24;
    let reveal = Math.min(1, activeLyric.progress / 0.72);
    if (hasWordTiming) {
      if (activeLyric.wordIndex < 0) {
        reveal = 0;
      } else {
        let prefix = '';
        for (let i = 0; i <= activeLyric.wordIndex; i += 1) {
          const word = activeLyric.line.words[i];
          prefix += i < activeLyric.wordIndex
            ? word.text
            : word.text.slice(0, Math.ceil(word.text.length * activeLyric.wordProgress));
        }
        reveal = clamp(inkCtx.measureText(prefix).width / Math.max(1, width));
      }
    }
    inkCtx.beginPath();
    inkCtx.rect(x - width / 2 - pad, y - base.size * 1.1, (width + pad * 2) * reveal, base.size * 2.2);
    inkCtx.clip();
    paintText(inkCtx, activeLyric.text, x, y, { ...base, alpha });
    inkCtx.restore();
  } else {
    paintText(inkCtx, activeLyric.text, x, y, { ...base, alpha });
  }
  inkCtx.restore();
}

function colorWithAlpha(color, alpha) {
  const value = String(color).trim();
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => p.trim());
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }
  return `rgba(201,155,78,${alpha})`;
}

function drawInk(activeLyric, t, frame) {
  inkCtx.clearRect(0, 0, outW, outH);
  inkCtx.save();
  inkCtx.scale(scale, scale);

  for (const glow of glowQueue) {
    const gradient = inkCtx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
    gradient.addColorStop(0, colorWithAlpha(glow.color, glow.alpha));
    gradient.addColorStop(0.45, colorWithAlpha(glow.color, glow.alpha * 0.45));
    gradient.addColorStop(1, colorWithAlpha(glow.color, 0));
    inkCtx.save();
    inkCtx.globalCompositeOperation = 'screen';
    inkCtx.fillStyle = gradient;
    inkCtx.fillRect(glow.x - glow.radius, glow.y - glow.radius, glow.radius * 2, glow.radius * 2);
    inkCtx.restore();
  }

  for (const call of textQueue) {
    paintText(inkCtx, call.value, call.x, call.y, call.style);
  }
  drawLyric(activeLyric);

  if (debug) {
    inkCtx.save();
    inkCtx.font = '400 14px "IBM Plex Mono", "Cascadia Mono", Consolas, monospace';
    inkCtx.textAlign = 'left';
    inkCtx.textBaseline = 'top';
    inkCtx.fillStyle = 'rgba(42,35,29,0.62)';
    inkCtx.fillText(
      `SHOT ${shot.id}  ${t.toFixed(2)}s  f${String(frame).padStart(4, '0')}  ${fps}fps  ${shot.scene}`,
      24,
      22,
    );
    inkCtx.restore();
  }

  inkCtx.restore();
}

function songTimeFor(localT) {
  const lyricOffset = (lyricConfig.offsetMs ?? 0) / 1000;
  const audioStart = Number(project.audio?.startAt ?? 0);
  return shot.start + localT - audioStart + lyricOffset;
}

let p5Instance = null;
let ready = false;

function boot() {
  makeGrainStatic();

  const sketch = (p) => {
    window.brush.instance(p);
    p5Instance = p;
    p.setup = () => {
      const canvas = p.createCanvas(outW, outH, p.WEBGL);
      canvas.parent(document.getElementById('brush'));
      canvas.elt.setAttribute('aria-hidden', 'true');
      p.pixelDensity(1);
      p.noLoop();
      p.frameRate(fps);
      p.randomSeed(1);
      p.noiseSeed(1);
      window.brush.scaleBrushes(Number(project.brushScale) || 3.4);
      ready = true;
    };

    p.draw = () => {
      if (!pending) return;
      const { t, frame, resolve, reject } = pending;
      pending = null;
      frameSerial = frame;
      try {
        const songTime = songTimeFor(t);
        const activeLyric =
          shot.lyrics === false || !lyricConfig.enabled || shot.lyrics === 'none'
            ? null
            : lyricAt(parsedLyric, songTime, { maxHold: lyricConfig.maxHold ?? 7, endTime: totalDuration });
        const seed = hash32((shot.seed || 1) * 100003 + Math.floor(t * 12) * 7919 + 17);
        textQueue = [];
        glowQueue = [];

        p.randomSeed(seed);
        p.noiseSeed(seed);
        resetBrush();
        p.blendMode(p.BLEND);
        p.background(palette.paper);
        p.push();
        p.translate(-outW / 2, -outH / 2);
        p.scale(scale);

        const api = makeApi(t, frame, activeLyric);
        api.p = p;
        api.brush = window.brush;
        scene.draw(api);

        p.pop();
        drawGrain(seed);
        drawInk(activeLyric, t, frame);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve({ shot: shot.id, t, frame }));
        });
      } catch (error) {
        reject(error);
      }
    };
  };

  new p5(sketch);

  (async () => {
    await document.fonts.ready;
    for (let i = 0; i < 300 && !ready; i += 1) await new Promise((r) => setTimeout(r, 20));
    if (!ready) throw new Error('p5 setup did not finish');
    window.__READY__ = true;
  })().catch(fail);
}

window.__renderFrame = (t, frame = Math.round(t * fps)) =>
  new Promise((resolve, reject) => {
    if (!p5Instance) {
      reject(new Error('p5 is not ready'));
      return;
    }
    pending = { t: Number(t), frame: Number(frame), resolve, reject };
    p5Instance.redraw();
  });

window.__META__ = {
  shot: shot.id,
  duration: shot.duration,
  fps,
  width: outW,
  height: outH,
  designWidth: designW,
  designHeight: designH,
  totalDuration,
};

try {
  boot();
} catch (error) {
  fail(error);
}


