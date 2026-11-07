#!/usr/bin/env node
/**
 * painted-animation renderer.
 *
 * Commands:
 *   node render.mjs doctor
 *   node render.mjs storyboard
 *   node render.mjs review --shot 01
 *   node render.mjs verdict --shot 01 --pass --notes "..." --sheet build/review/shot-01/contact-sheet.jpg
 *   node render.mjs approve --mode local --quote "user's exact choice"
 *   node render.mjs final
 *   node render.mjs final-verdict --shot 01 --pass --notes "..." --sheet build/final/shot-01/contact-sheet.jpg
 *   node render.mjs final --encode
 *
 * The only allowed full-render mode is local. This file never uploads a
 * project or calls a remote renderer.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, openSync, closeSync, readFileSync, statSync } from 'node:fs';
import { readFile, writeFile, mkdir, rm, readdir, copyFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import ffmpegStatic from 'ffmpeg-static';
import { parseLrc, toSrt } from './engine/lrc.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(ROOT, 'build');
const REVIEWS = path.join(ROOT, 'reviews');
const OUTPUT = path.join(ROOT, 'output');
const LOGS = path.join(BUILD, 'logs');
const FONT_REL = 'engine/fonts/IBMPlexMono-Regular.ttf';
const FFMPEG = process.env.FFMPEG_PATH || ffmpegStatic;

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const paint = (color, text) => `${color}${text}${C.reset}`;
const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');
const abs = (p) => path.resolve(ROOT, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      flags._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function hashFiles(files) {
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    hash.update(rel(file));
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function loadProject() {
  const projectFile = path.join(ROOT, 'project.json');
  if (!existsSync(projectFile)) {
    throw new Error('project.json not found. Run this command from a painted-animation project root.');
  }
  const project = await readJson(projectFile);
  if (!Array.isArray(project.shots) || !project.shots.length) {
    throw new Error('project.json must define at least one shot in "shots".');
  }
  const fps = Number(project.fps);
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) throw new Error('project.fps must be an integer from 1 to 60.');
  const width = Number(project.width);
  const height = Number(project.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16) {
    throw new Error('project.width and project.height must be integers.');
  }
  if (width % 2 || height % 2) throw new Error('project.width and project.height must be even for H.264 output.');

  const ids = new Set();
  let cursor = 0;
  for (const [index, shot] of project.shots.entries()) {
    if (!shot.id || typeof shot.id !== 'string') throw new Error(`shots[${index}].id is required.`);
    if (!/^[a-zA-Z0-9_-]+$/.test(shot.id)) throw new Error(`Shot id "${shot.id}" may only contain letters, digits, _ and -.`);
    if (ids.has(shot.id)) throw new Error(`Duplicate shot id: ${shot.id}`);
    ids.add(shot.id);
    const duration = Number(shot.duration);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Shot ${shot.id}: duration must be positive.`);
    const frames = duration * fps;
    if (Math.abs(frames - Math.round(frames)) > 1e-6) {
      throw new Error(
        `Shot ${shot.id}: ${duration}s x ${fps}fps = ${frames} frames. Use a duration that lands on a whole frame.`,
      );
    }
    shot.frames = Math.round(frames);
    shot.start = cursor;
    shot.end = cursor + shot.frames / fps;
    cursor = shot.end;
  }
  project.totalDuration = cursor;
  project.totalFrames = project.shots.reduce((n, s) => n + s.frames, 0);
  project.width = width;
  project.height = height;
  project.fps = fps;
  project.shots = project.shots.map((shot) => ({
    ...shot,
    keyframes: Array.isArray(shot.keyframes) && shot.keyframes.length ? shot.keyframes : [0.16, 0.5, 0.84],
  }));
  return project;
}

async function sourceHash(project) {
  const files = [
    path.join(ROOT, 'project.json'),
    path.join(ROOT, 'render.mjs'),
    ...(await walk(path.join(ROOT, 'engine'))),
    ...(await walk(path.join(ROOT, 'scenes'))),
  ];
  if (project.lyrics?.file) {
    const lyricFile = abs(project.lyrics.file);
    if (existsSync(lyricFile)) files.push(lyricFile);
  }
  if (project.audio?.file) {
    const audioFile = abs(project.audio.file);
    if (existsSync(audioFile)) files.push(audioFile);
  }
  for (const optional of ['package.json', 'package-lock.json']) {
    const file = path.join(ROOT, optional);
    if (existsSync(file)) files.push(file);
  }
  return hashFiles(files);
}

async function validateProject(project) {
  const warnings = [];
  const errors = [];
  const sceneIndex = path.join(ROOT, 'scenes', 'index.js');
  if (!existsSync(sceneIndex)) errors.push('scenes/index.js is missing.');
  else {
    try {
      const mod = await import(`${pathToFileURL(sceneIndex).href}?validate=${Date.now()}`);
      for (const shot of project.shots) {
        if (!mod.scenes?.[shot.scene]) errors.push(`Shot ${shot.id}: scenes/index.js has no "${shot.scene}" export.`);
      }
    } catch (error) {
      errors.push(`scenes/index.js failed to import: ${error.message}`);
    }
  }

  if (project.lyrics?.enabled && project.lyrics.file) {
    const lyricFile = abs(project.lyrics.file);
    if (!existsSync(lyricFile)) {
      errors.push(`Lyrics file not found: ${project.lyrics.file}`);
    } else {
      const parsed = parseLrc(await readFile(lyricFile, 'utf8'), { offsetMs: project.lyrics.offsetMs ?? 0 });
      if (!parsed.lines.length) warnings.push('Lyrics file contains no timed lines.');
      const last = parsed.lines.at(-1);
      if (last && last.time > project.totalDuration + 0.25) {
        warnings.push(`Last lyric starts at ${last.time.toFixed(2)}s, after the video ends at ${project.totalDuration.toFixed(2)}s.`);
      }
    }
  } else if (!project.lyrics?.file) {
    warnings.push('No lyrics file configured. The MV will render without lyrics.');
  }

  if (project.audio?.file) {
    if (!existsSync(abs(project.audio.file))) warnings.push(`Audio file not found: ${project.audio.file}`);
  } else {
    warnings.push('No audio configured. The final video will be silent.');
  }

  const chrome = findChrome();
  if (!chrome) errors.push('Chrome/Edge not found. Set CHROME_PATH to a Chromium executable.');
  if (!FFMPEG || !existsSync(FFMPEG)) errors.push('ffmpeg not found. Run npm install or set FFMPEG_PATH.');

  return { warnings, errors, chrome };
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find((candidate) => candidate && existsSync(candidate)) || null;
}

async function runProcess(exe, args, options = {}) {
  const { cwd = ROOT, allowFailure = false, label = 'process' } = options;
  await ensureDir(LOGS);
  const logFile = path.join(LOGS, `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}.log`);
  const fd = openSync(logFile, 'w');
  return new Promise((resolve, reject) => {
    let proc;
    try {
      proc = spawn(exe, args, {
        cwd,
        windowsHide: true,
        stdio: ['ignore', fd, fd],
      });
    } catch (error) {
      closeSync(fd);
      reject(error);
      return;
    }
    proc.on('error', (error) => {
      try {
        closeSync(fd);
      } catch {
        /* noop */
      }
      reject(new Error(`${label}: ${error.message}`));
    });
    proc.on('close', (code) => {
      try {
        closeSync(fd);
      } catch {
        /* noop */
      }
      const text = readFileSync(logFile, 'utf8');
      if (code !== 0 && !allowFailure) {
        reject(new Error(`${label} failed (exit ${code}).\n${text.split('\n').slice(-24).join('\n')}`));
      } else {
        resolve({ code, text, logFile });
      }
    });
  });
}

async function ffmpegDuration(file) {
  if (!file || !existsSync(file)) return null;
  const { text } = await runProcess(FFMPEG, ['-hide_banner', '-i', file], {
    allowFailure: true,
    label: 'ffmpeg-probe',
  });
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

async function ffmpegVersion() {
  if (!FFMPEG || !existsSync(FFMPEG)) return null;
  const { text } = await runProcess(FFMPEG, ['-version'], { allowFailure: true, label: 'ffmpeg-version' });
  return text.split('\n')[0]?.trim() ?? null;
}

function escapeDrawtext(value) {
  return String(value)
    .replaceAll('\\', ' ')
    .replaceAll("'", ' ')
    .replaceAll(':', ' ')
    .replaceAll('%', ' ')
    .slice(0, 78);
}

function chooseCols(count) {
  if (count >= 8 && count % 4 === 0) return 4;
  return 3;
}

async function makeSheet(frames, labels, outFile, cols = chooseCols(frames.length)) {
  if (!frames.length) throw new Error('makeSheet needs at least one frame.');
  if (!FFMPEG || !existsSync(FFMPEG)) throw new Error('ffmpeg is required for contact sheets.');
  await ensureDir(path.dirname(outFile));
  const tileW = 480;
  const tileH = 270;
  const padW = 488;
  const padH = 294;
  const fontFile = path.join(ROOT, FONT_REL);
  const useFont = existsSync(fontFile);
  const rows = Math.ceil(frames.length / cols);
  const filters = [];
  const args = ['-y'];
  let inputIndex = 0;
  for (let i = 0; i < rows * cols; i += 1) {
    if (i < frames.length) {
      args.push('-i', frames[i]);
      const label = escapeDrawtext(labels[i] ?? '');
      const draw = useFont
        ? `,drawbox=x=0:y=270:w=488:h=24:color=0x14110e@0.9:t=fill,drawtext=fontfile=${FONT_REL}:text='${label}':fontcolor=0xefe4ce:fontsize=11:x=10:y=277`
        : '';
      filters.push(
        `[${inputIndex}:v]scale=${tileW}:${tileH}:flags=lanczos,pad=${padW}:${padH}:4:4:color=0x14110e${draw}[v${i}]`,
      );
    } else {
      args.push('-f', 'lavfi', '-t', '1', '-i', `color=c=0x14110e:s=${padW}x${padH}`);
      filters.push(`[${inputIndex}:v]null[v${i}]`);
    }
    inputIndex += 1;
  }
  for (let r = 0; r < rows; r += 1) {
    const inputs = [];
    for (let c = 0; c < cols; c += 1) inputs.push(`[v${r * cols + c}]`);
    filters.push(`${inputs.join('')}hstack=inputs=${inputs.length}[r${r}]`);
  }
  let finalLabel;
  if (rows === 1) {
    finalLabel = '[r0]';
  } else {
    const inputRows = Array.from({ length: rows }, (_, r) => `[r${r}]`).join('');
    filters.push(`${inputRows}vstack=inputs=${rows}[out]`);
    finalLabel = '[out]';
  }
  args.push('-filter_complex', filters.join(';'), '-map', finalLabel, '-frames:v', '1', '-q:v', '2', outFile);
  await runProcess(FFMPEG, args, { label: 'ffmpeg-sheet' });
  return outFile;
}

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') pathname = '/engine/page.html';
      let file;
      if (pathname === '/vendor/p5.min.js') file = path.join(ROOT, 'node_modules/p5/lib/p5.min.js');
      else if (pathname === '/vendor/p5.brush.js') file = path.join(ROOT, 'node_modules/p5.brush/dist/p5.brush.js');
      else {
        file = path.join(ROOT, pathname);
        if (!path.resolve(file).startsWith(path.resolve(ROOT))) {
          res.writeHead(403);
          res.end('forbidden');
          return;
        }
      }
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = path.extname(file).toLowerCase();
      const mime =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.js'
            ? 'text/javascript; charset=utf-8'
            : ext === '.json'
              ? 'application/json; charset=utf-8'
              : ext === '.css'
                ? 'text/css; charset=utf-8'
                : ext === '.ttf'
                  ? 'font/ttf'
                  : 'application/octet-stream';
      res.writeHead(200, {
        'content-type': mime,
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      });
      createReadStream(file).pipe(res);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  return { server, url: `http://127.0.0.1:${port}` };
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

const GPU_MODES = new Set(['auto', 'on', 'off']);

function resolveGpuMode(flags, project) {
  const raw = flags?.gpu === true
    ? 'auto'
    : String(flags?.gpu ?? project?.render?.gpu ?? process.env.DSH_RENDER_GPU ?? 'auto').toLowerCase();
  return GPU_MODES.has(raw) ? raw : 'auto';
}

function gpuFlags() {
  if (process.platform === 'win32') return ['--use-gl=angle', '--use-angle=d3d11'];
  if (process.platform === 'darwin') return ['--use-angle=metal'];
  return ['--use-gl=egl'];
}

function softwareRenderer(renderer) {
  return /swiftshader|software|llvmpipe|lavapipe|basic render|mesa offscreen/i.test(String(renderer));
}

async function probeWebGL(browser) {
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 64, height: 64, deviceScaleFactor: 1 });
    await page.goto('about:blank', { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) return { ok: false, renderer: 'no-webgl2', vendor: '', version: '' };
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        ok: true,
        renderer: String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
        vendor: String(ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
        version: String(gl.getParameter(gl.VERSION)),
      };
    });
    return {
      ...info,
      hardware: Boolean(info.ok && !softwareRenderer(info.renderer)),
    };
  } catch (error) {
    return { ok: false, renderer: 'probe-failed', vendor: '', version: '', hardware: false, error: error.message };
  } finally {
    await page?.close().catch(() => {});
  }
}

async function startChrome(executable, useGpu) {
  const port = await freePort();
  const profile = path.join(BUILD, '.chrome', `profile-${process.pid}-${Date.now()}-${useGpu ? 'gpu' : 'sw'}`);
  await ensureDir(profile);
  const args = [
    '--headless=new',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--disable-breakpad',
    '--disable-crash-reporter',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-dev-shm-usage',
    ...(useGpu
      ? [...gpuFlags(), '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-webgl']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
    '--force-device-scale-factor=1',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ];
  const proc = spawn(executable, args, {
    cwd: ROOT,
    windowsHide: true,
    stdio: 'ignore',
    detached: false,
  });
  let spawnError = null;
  proc.on('error', (error) => {
    spawnError = error;
  });

  let version = null;
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    if (spawnError) throw new Error(`Chrome could not start: ${spawnError.message}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) {
        version = await response.json();
        break;
      }
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  if (!version) {
    try {
      proc.kill();
    } catch {
      /* noop */
    }
    throw new Error('Chrome did not expose a DevTools endpoint. Check CHROME_PATH and the sandbox.');
  }

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${port}`,
    defaultViewport: null,
    protocolTimeout: 600000,
  });
  return {
    browser,
    proc,
    executable,
    profile,
    port,
    async close() {
      try {
        await browser.close();
      } catch {
        /* noop */
      }
      try {
        proc.kill();
      } catch {
        /* noop */
      }
      await sleep(200);
      try {
        await rm(profile, { recursive: true, force: true, maxRetries: 2 });
      } catch {
        /* Chrome may still hold the profile on Windows. */
      }
    },
  };
}

async function launchChrome({ gpuMode = 'auto', skipProbe = false } = {}) {
  const executable = findChrome();
  if (!executable) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');
  if (gpuMode === 'off') {
    const software = await startChrome(executable, false);
    software.gpuInfo = skipProbe
      ? { hardware: false, renderer: 'software (assumed)' }
      : await probeWebGL(software.browser);
    return software;
  }
  if (gpuMode === 'on' && skipProbe) {
    const hardware = await startChrome(executable, true);
    hardware.gpuInfo = { hardware: true, renderer: 'GPU (assumed)' };
    return hardware;
  }

  let hardware = null;
  let failure = null;
  try {
    hardware = await startChrome(executable, true);
    const info = await probeWebGL(hardware.browser);
    if (info.hardware) {
      hardware.gpuInfo = info;
      return hardware;
    }
    failure = new Error(`GPU WebGL probe returned: ${info.renderer || 'no renderer'}`);
    await hardware.close();
    hardware = null;
  } catch (error) {
    failure = error;
    await hardware?.close().catch(() => {});
    hardware = null;
  }

  if (gpuMode === 'on') {
    throw new Error(
      `GPU rendering was requested but no hardware WebGL context was available. ${failure?.message || ''} ` +
      'Use --gpu auto or --gpu off.',
    );
  }
  const software = await startChrome(executable, false);
  software.gpuInfo = skipProbe
    ? { hardware: false, renderer: 'software (assumed)' }
    : await probeWebGL(software.browser);
  return software;
}

async function createChromePool(count, gpuMode = 'auto') {
  const instances = [];
  const wanted = Math.max(1, Math.min(Number(count) || 1, 6));
  try {
    const first = await launchChrome({ gpuMode });
    const info = first.gpuInfo || { hardware: false, renderer: 'unknown' };
    console.log(`  gpu: ${info.hardware ? 'hardware' : 'software'}  ${info.renderer}`);
    instances.push(first);
    for (let i = 1; i < wanted; i += 1) {
      const instance = await launchChrome({
        gpuMode: info.hardware ? 'on' : 'off',
        skipProbe: true,
      });
      instance.gpuInfo = info;
      instances.push(instance);
    }
  } catch (error) {
    await Promise.all(instances.map((instance) => instance.close().catch(() => {})));
    throw error;
  }
  return {
    instances,
    async close() {
      await Promise.all(instances.map((instance) => instance.close().catch(() => {})));
    },
  };
}

function gpuSummary(pool) {
  const info = pool?.instances?.[0]?.gpuInfo || {};
  return {
    hardware: Boolean(info.hardware),
    renderer: info.renderer || 'unknown',
    vendor: info.vendor || null,
    version: info.version || null,
  };
}

async function openPool(server, count, gpuMode = 'auto') {
  try {
    return await createChromePool(count, gpuMode);
  } catch (error) {
    await new Promise((resolve) => server.server.close(resolve));
    throw error;
  }
}

async function openPage(browser, baseUrl, project, shot, width, height, debug) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (process.env.DEBUG) console.log(`PAGE ${message.type()}: ${message.text()}`);
    if (message.type() === 'error') errors.push(message.text());
  });
  const query = new URLSearchParams({
    shot: shot.id,
    w: String(width),
    h: String(height),
    fps: String(project.fps),
    debug: debug ? '1' : '0',
  });
  await page.goto(`${baseUrl}/engine/page.html?${query}`, { waitUntil: 'load', timeout: 60000 });
  try {
    await page.waitForFunction('window.__READY__ === true || window.__ERROR__', { timeout: 60000 });
  } catch {
    throw new Error(`Page for ${shot.id} did not become ready.\n${errors.join('\n')}`);
  }
  const pageError = await page.evaluate(() => window.__ERROR__ || null);
  if (pageError) throw new Error(pageError);
  return page;
}

async function renderFrameSet({ pool, baseUrl, project, shot, width, height, fps, debug, outDir, times, workers, label }) {
  await ensureDir(LOGS);
  await rm(outDir, { recursive: true, force: true });
  await ensureDir(outDir);
  const internalFps = Number(fps) || project.fps;
  const frames = times ?? Array.from({ length: shot.frames }, (_, i) => i / internalFps);
  const poolSize = pool?.instances?.length || 1;
  const workerCount = Math.max(1, Math.min(Number(workers) || project.render?.workers || 4, frames.length, poolSize));
  const pages = [];
  try {
    for (let i = 0; i < workerCount; i += 1) {
      pages.push(await openPage(pool.instances[i].browser, baseUrl, project, shot, width, height, debug));
    }
    let next = 0;
    let done = 0;
    const started = Date.now();
    const step = Math.max(1, Math.floor(frames.length / 10));
    await Promise.all(
      pages.map(async (page) => {
        while (true) {
          const index = next;
          next += 1;
          if (index >= frames.length) break;
          const t = Number(frames[index]);
          const file = path.join(outDir, `${String(index + 1).padStart(5, '0')}.png`);
          try {
            if (process.env.DEBUG) console.log(`  frame ${index + 1} start t=${t.toFixed(3)}`);
            await page.evaluate(
              ({ time, frame }) => window.__renderFrame(time, frame),
              { time: t, frame: Math.round(t * internalFps) },
            );
            await page.screenshot({
              path: file,
              type: 'png',
              clip: { x: 0, y: 0, width, height },
              captureBeyondViewport: false,
            });
          } catch (error) {
            const pageError = await page.evaluate(() => window.__ERROR__ || null).catch(() => null);
            throw new Error(`Frame ${index + 1} of ${shot.id} failed: ${pageError || error.message}`);
          }
          done += 1;
          if (done === 1 || done % step === 0 || done === frames.length) {
            const elapsed = ((Date.now() - started) / 1000).toFixed(1);
            console.log(`  ${label} ${done}/${frames.length} frames  (${elapsed}s)`);
          }
        }
      }),
    );
    const files = (await readdir(outDir)).filter((f) => f.endsWith('.png')).sort();
    if (files.length !== frames.length) {
      throw new Error(`${shot.id}: rendered ${files.length}/${frames.length} frames.`);
    }
    for (const file of files) {
      const info = await stat(path.join(outDir, file));
      if (info.size < 1200) throw new Error(`${shot.id}: frame ${file} looks empty (${info.size} bytes).`);
    }
    return { files: files.map((f) => path.join(outDir, f)), times: frames };
  } finally {
    await Promise.all(pages.map((page) => page.close().catch(() => {})));
  }
}

async function pickEvenly(items, count) {
  if (items.length <= count) return items.map((item, i) => ({ item, index: i }));
  const picked = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.round((i * (items.length - 1)) / (count - 1));
    if (!picked.some((p) => p.index === index)) picked.push({ item: items[index], index });
  }
  return picked;
}

function frameLabel(shot, t, fps) {
  return `SHOT ${shot.id}  /  ${t.toFixed(2)}s  /  f${String(Math.round(t * fps) + 1).padStart(3, '0')}`;
}

function printHeader(text) {
  console.log(`\n${paint(C.bold, text)}\n`);
}

async function commandDoctor(flags) {
  printHeader('painted-animation / doctor');
  const project = await loadProject();
  const { warnings, errors, chrome } = await validateProject(project);
  const version = await ffmpegVersion();
  const audioDuration = project.audio?.file ? await ffmpegDuration(abs(project.audio.file)) : null;
  if (project.audio?.file && audioDuration === null) warnings.push('Audio duration could not be read.');
  if (audioDuration !== null && Math.abs(audioDuration - project.totalDuration) > 0.18) {
    warnings.push(
      `Audio is ${audioDuration.toFixed(2)}s; video timeline is ${project.totalDuration.toFixed(2)}s. The final mix uses -shortest.`,
    );
  }

  const hash = await sourceHash(project);
  const reviewRows = [];
  for (const shot of project.shots) {
    const file = path.join(REVIEWS, `${shot.id}.json`);
    if (existsSync(file)) {
      try {
        const review = await readJson(file);
        const ok = review.verdict === 'pass' && review.sourceHash === hash;
        reviewRows.push({ shot: shot.id, status: ok ? 'pass' : 'stale/fail', notes: review.notes || '' });
      } catch {
        reviewRows.push({ shot: shot.id, status: 'unreadable', notes: '' });
      }
    } else {
      reviewRows.push({ shot: shot.id, status: 'missing', notes: '' });
    }
  }
  let approval = null;
  if (existsSync(path.join(ROOT, 'approval.json'))) {
    try {
      approval = await readJson(path.join(ROOT, 'approval.json'));
      if (approval.mode !== 'local') warnings.push(`approval.json has unsupported mode "${approval.mode}".`);
    } catch {
      warnings.push('approval.json is unreadable.');
    }
  }

  const report = {
    ok: errors.length === 0,
    project: {
      title: project.title,
      slug: project.slug,
      width: project.width,
      height: project.height,
      fps: project.fps,
      shots: project.shots.length,
      duration: project.totalDuration,
      frames: project.totalFrames,
    },
    tools: {
      node: process.version,
      chrome: chrome || null,
      ffmpeg: FFMPEG || null,
      ffmpegVersion: version,
    },
    audio: { file: project.audio?.file ?? null, duration: audioDuration },
    sourceHash: hash,
    reviews: reviewRows,
    approval,
    warnings,
    errors,
  };
  if (flags.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`project   ${paint(C.cyan, project.title)}  ${project.width}x${project.height} @ ${project.fps}fps`);
    console.log(`shots     ${project.shots.length}  /  ${project.totalDuration.toFixed(2)}s  /  ${project.totalFrames} frames`);
    console.log(`node      ${process.version}`);
    console.log(`chrome    ${chrome || paint(C.red, 'not found')}`);
    console.log(`ffmpeg    ${version || paint(C.red, 'not found')}`);
    if (audioDuration !== null) console.log(`audio     ${project.audio.file}  ${audioDuration.toFixed(2)}s`);
    console.log(`hash      ${hash.slice(0, 16)}...`);
    console.log(`reviews   ${reviewRows.map((r) => `${r.shot}:${r.status}`).join('  ')}`);
    if (approval) console.log(`approval  ${approval.mode}  ${approval.quote}`);
    if (warnings.length) {
      console.log(`\n${paint(C.yellow, 'warnings')}`);
      for (const warning of warnings) console.log(`  - ${warning}`);
    }
    if (errors.length) {
      console.log(`\n${paint(C.red, 'errors')}`);
      for (const error of errors) console.log(`  - ${error}`);
    } else {
      console.log(`\n${paint(C.green, 'ready')} - storyboard next: node render.mjs storyboard`);
    }
  }
  if (errors.length) process.exitCode = 1;
}

async function commandStoryboard(flags) {
  printHeader('painted-animation / storyboard');
  const project = await loadProject();
  const { errors } = await validateProject(project);
  if (errors.length) throw new Error(errors.join('\n'));
  const width = Math.min(Number(project.storyboard?.width) || 960, project.width);
  const height = Math.round((width * project.height) / project.width / 2) * 2;
  const base = path.join(BUILD, 'storyboard');
  await rm(base, { recursive: true, force: true });
  await ensureDir(base);

  const server = await startServer();
  const workers = Math.min(Number(flags.workers) || project.render?.workers || 4, 3);
  const gpuMode = resolveGpuMode(flags, project);
  const pool = await openPool(server, workers, gpuMode);
  const manifest = { generatedAt: new Date().toISOString(), width, height, sheets: [], shots: [] };
  try {
    for (const shot of project.shots) {
      const times = shot.keyframes.map((k) => Math.min(shot.duration - 1 / project.fps, Math.max(0, Number(k) * shot.duration)));
      const outDir = path.join(base, shot.id);
      const result = await renderFrameSet({
        pool,
        baseUrl: server.url,
        project,
        shot,
        width,
        height,
        fps: project.fps,
        debug: true,
        outDir,
        times,
        workers: Number(flags.workers) || project.render?.workers || 4,
        label: shot.id,
      });
      manifest.shots.push({
        id: shot.id,
        title: shot.title,
        summary: shot.summary,
        duration: shot.duration,
        keyframes: result.files.map((file, i) => ({ time: times[i], file: rel(file) })),
      });
    }

    for (let i = 0; i < manifest.shots.length; i += 4) {
      const group = manifest.shots.slice(i, i + 4);
      const frames = group.flatMap((s) => s.keyframes.map((k) => abs(k.file)));
      const labels = group.flatMap((s) => s.keyframes.map((k) => frameLabel(s, k.time, project.fps)));
      const sheet = path.join(base, `sheet-${String(i / 4 + 1).padStart(2, '0')}.jpg`);
      await makeSheet(frames, labels, sheet, 3);
      manifest.sheets.push({ file: rel(sheet), shots: group.map((s) => s.id) });
    }
  } finally {
    await pool.close();
    await new Promise((resolve) => server.server.close(resolve));
  }
  await writeFile(path.join(base, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n${paint(C.green, 'storyboard ready')}`);
  for (const sheet of manifest.sheets) console.log(`  ${sheet.file}`);
  console.log(`\nInspect the sheet(s), then send them to the user. Do not call final yet.`);
}

async function commandReview(flags) {
  const shotId = flags.shot;
  if (!shotId) throw new Error('review needs --shot <id>.');
  printHeader(`painted-animation / review ${shotId}`);
  const project = await loadProject();
  const shot = project.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error(`Unknown shot "${shotId}". Available: ${project.shots.map((s) => s.id).join(', ')}`);
  const { errors } = await validateProject(project);
  if (errors.length) throw new Error(errors.join('\n'));
  const scale = Number(flags.scale) || Number(project.review?.scale) || 0.5;
  const width = Math.round(project.width * scale / 2) * 2;
  const height = Math.round(project.height * scale / 2) * 2;
  const fps = Math.max(1, Math.min(Number(flags.fps) || Number(project.review?.fps) || 8, project.fps));
  const base = path.join(BUILD, 'review', shot.id);
  await rm(base, { recursive: true, force: true });
  await ensureDir(base);
  const hash = await sourceHash(project);
  const times = Array.from({ length: Math.round(shot.duration * fps) }, (_, i) => i / fps);

  const server = await startServer();
  const workers = Number(flags.workers) || project.render?.workers || 4;
  const gpuMode = resolveGpuMode(flags, project);
  const pool = await openPool(server, workers, gpuMode);
  const gpu = gpuSummary(pool);
  try {
    const result = await renderFrameSet({
      pool,
      baseUrl: server.url,
      project,
      shot,
      width,
      height,
      fps,
      debug: true,
      outDir: path.join(base, 'frames'),
      times,
      workers: Number(flags.workers) || project.render?.workers || 4,
      label: shot.id,
    });
    const picked = await pickEvenly(result.files, 9);
    const sheet = path.join(base, 'contact-sheet.jpg');
    await makeSheet(
      picked.map((p) => p.item),
      picked.map((p) => frameLabel(shot, times[p.index], fps)),
      sheet,
      chooseCols(picked.length),
    );
    const framesHash = await hashFiles(result.files);
    const review = {
      shot: shot.id,
      title: shot.title,
      fps,
      width,
      height,
      frameCount: result.files.length,
      framesHash,
      sourceHash: hash,
      gpu,
      times,
      picked: picked.map((p) => ({ frame: p.index + 1, time: times[p.index] })),
      contactSheet: rel(sheet),
      framesDir: rel(path.join(base, 'frames')),
      createdAt: new Date().toISOString(),
    };
    await writeFile(path.join(base, 'review.json'), JSON.stringify(review, null, 2));
    console.log(`\n${paint(C.green, 'review frames ready')}  (${result.files.length} frames @ ${width}x${height}, ${fps}fps)`);
    console.log(`  sheet: ${rel(sheet)}`);
    console.log(`\nNow inspect the sheet AND at least one full-size frame. Then record the verdict:`);
    console.log(`  node render.mjs verdict --shot ${shot.id} --pass --notes "what you saw" --sheet ${rel(sheet)}`);
  } finally {
    await pool.close();
    await new Promise((resolve) => server.server.close(resolve));
  }
}

async function commandVerdict(flags) {
  const shotId = flags.shot;
  if (!shotId) throw new Error('verdict needs --shot <id>.');
  const pass = Boolean(flags.pass);
  const fail = Boolean(flags.fail);
  if (pass === fail) throw new Error('Use exactly one of --pass or --fail.');
  const notes = String(flags.notes || '').trim();
  if (!notes) throw new Error('Write --notes describing what you actually inspected.');
  if (!flags.sheet) throw new Error('Pass the --sheet you inspected. A verdict without a rendered sheet is not a review.');
  const project = await loadProject();
  const shot = project.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error(`Unknown shot "${shotId}".`);
  const reviewDir = path.join(BUILD, 'review', shot.id);
  const reviewFile = path.join(reviewDir, 'review.json');
  if (!existsSync(reviewFile)) throw new Error(`No review render for ${shot.id}. Run: node render.mjs review --shot ${shot.id}`);
  const review = await readJson(reviewFile);
  const expectedSheet = path.join(reviewDir, 'contact-sheet.jpg');
  const givenSheet = abs(flags.sheet);
  if (path.resolve(givenSheet) !== path.resolve(expectedSheet)) {
    throw new Error(`--sheet must be the render you inspected: ${rel(expectedSheet)}`);
  }
  if (!existsSync(givenSheet)) throw new Error(`Review sheet not found: ${flags.sheet}`);
  const hash = await sourceHash(project);
  if (review.sourceHash !== hash) throw new Error('The project changed after this review render. Re-run review.');
  const frames = (await readdir(path.join(reviewDir, 'frames'))).filter((f) => f.endsWith('.png')).sort();
  const framesHash = await hashFiles(frames.map((f) => path.join(reviewDir, 'frames', f)));
  if (framesHash !== review.framesHash) throw new Error('Review frames changed on disk. Re-run review.');

  await ensureDir(REVIEWS);
  const record = {
    shot: shot.id,
    verdict: pass ? 'pass' : 'fail',
    notes,
    sheet: rel(expectedSheet),
    framesHash,
    sourceHash: hash,
    gpu: review.gpu ?? null,
    reviewedAt: new Date().toISOString(),
  };
  await writeFile(path.join(REVIEWS, `${shot.id}.json`), JSON.stringify(record, null, 2));
  if (!pass) {
    console.log(paint(C.red, `recorded FAIL for ${shot.id}; fix the shot and review again.`));
    process.exitCode = 2;
    return;
  }
  const remaining = project.shots.filter((s) => {
    const file = path.join(REVIEWS, `${s.id}.json`);
    if (!existsSync(file)) return true;
    try {
      return JSON.parse(readFileSync(file, 'utf8')).sourceHash !== hash;
    } catch {
      return true;
    }
  });
  console.log(paint(C.green, `recorded PASS for ${shot.id}.`));
  console.log(`  notes: ${notes}`);
  if (remaining.length) console.log(`\nStill to review: ${remaining.map((s) => s.id).join(', ')}`);
  else console.log(`\nAll shots have a current pass. Ask the user explicitly before approving a full local render.`);
}

async function commandApprove(flags) {
  const mode = String(flags.mode || '');
  if (mode !== 'local') {
    throw new Error('This skill only supports --mode local. Cloud/all-frame remote rendering is forbidden.');
  }
  const quote = String(flags.quote || '').trim();
  if (quote.length < 4) {
    throw new Error('Pass --quote with the user\'s exact wording that chose a local full render.');
  }
  const project = await loadProject();
  const { errors } = await validateProject(project);
  if (errors.length) throw new Error(errors.join('\n'));
  const hash = await sourceHash(project);
  const missing = [];
  for (const shot of project.shots) {
    const file = path.join(REVIEWS, `${shot.id}.json`);
    if (!existsSync(file)) {
      missing.push(`${shot.id}: no review`);
      continue;
    }
    const review = await readJson(file);
    if (review.verdict !== 'pass') missing.push(`${shot.id}: ${review.verdict}`);
    else if (review.sourceHash !== hash) missing.push(`${shot.id}: stale review`);
  }
  if (missing.length) throw new Error(`Cannot approve yet:\n  ${missing.join('\n  ')}`);

  const approval = {
    mode: 'local',
    quote,
    approvedAt: new Date().toISOString(),
    sourceHash: hash,
    shots: project.shots.map((s) => s.id),
  };
  await writeFile(path.join(ROOT, 'approval.json'), JSON.stringify(approval, null, 2));
  console.log(`\n${paint(C.green, 'local render approved')}  ${project.title}`);
  console.log('All rendering stays on this machine: headless Chrome + local ffmpeg. Nothing is uploaded.\n');
  console.log('Exact commands:');
  console.log(`  cd "${ROOT}"`);
  console.log('  node render.mjs final');
  console.log('  # inspect every final sheet, then record final verdicts');
  console.log('  node render.mjs final --encode');
}

async function verifyApproval(project, hash) {
  const file = path.join(ROOT, 'approval.json');
  if (!existsSync(file)) throw new Error('No approval.json. The user must explicitly choose a local full render first.');
  const approval = await readJson(file);
  if (approval.mode !== 'local') throw new Error(`Unsupported render mode "${approval.mode}". Only local rendering is allowed.`);
  if (approval.sourceHash !== hash) throw new Error('Approval is stale: the project changed after the user approved it.');
  return approval;
}

async function verifyDraftReviews(project, hash) {
  const missing = [];
  for (const shot of project.shots) {
    const file = path.join(REVIEWS, `${shot.id}.json`);
    if (!existsSync(file)) {
      missing.push(`${shot.id}: run node render.mjs review --shot ${shot.id}`);
      continue;
    }
    const review = await readJson(file);
    if (review.verdict !== 'pass') missing.push(`${shot.id}: draft verdict is ${review.verdict}`);
    else if (review.sourceHash !== hash) missing.push(`${shot.id}: draft review is stale`);
  }
  if (missing.length) throw new Error(`Draft reviews are not ready:\n  ${missing.join('\n  ')}`);
}

async function commandFinal(flags) {
  if (flags.encode) return commandEncode(flags);
  printHeader('painted-animation / final frames');
  const project = await loadProject();
  const hash = await sourceHash(project);
  await verifyApproval(project, hash);
  await verifyDraftReviews(project, hash);
  const { errors } = await validateProject(project);
  if (errors.length) throw new Error(errors.join('\n'));

  const base = path.join(BUILD, 'final');
  await rm(base, { recursive: true, force: true });
  await ensureDir(base);
  const server = await startServer();
  const workers = Number(flags.workers) || project.render?.workers || 4;
  const gpuMode = resolveGpuMode(flags, project);
  const pool = await openPool(server, workers, gpuMode);
  const gpu = gpuSummary(pool);
  const finalShots = [];
  try {
    for (const shot of project.shots) {
      const previousFile = path.join(REVIEWS, `${shot.id}.json`);
      if (existsSync(previousFile)) {
        const previous = await readJson(previousFile);
        if (previous.gpu && Boolean(previous.gpu.hardware) !== gpu.hardware) {
          throw new Error(
            `Renderer changed since the draft review of ${shot.id}: draft was ${previous.gpu.hardware ? 'hardware GPU' : 'software'}, ` +
            `final is ${gpu.hardware ? 'hardware GPU' : 'software'}. Re-run final with --gpu ${previous.gpu.hardware ? 'on' : 'off'} ` +
            'or re-review the shots with the current renderer.',
          );
        }
      }
      console.log(`\n${paint(C.cyan, `shot ${shot.id}`)}  ${shot.frames} frames @ ${project.width}x${project.height}`);
      const result = await renderFrameSet({
        pool,
        baseUrl: server.url,
        project,
        shot,
        width: project.width,
        height: project.height,
        fps: project.fps,
        debug: false,
        outDir: path.join(base, shot.id, 'frames'),
        times: null,
        workers: Number(flags.workers) || project.render?.workers || 4,
        label: shot.id,
      });
      const picked = await pickEvenly(result.files, 9);
      const sheet = path.join(base, shot.id, 'contact-sheet.jpg');
      await makeSheet(
        picked.map((p) => p.item),
        picked.map((p) => frameLabel(shot, result.times[p.index], project.fps)),
        sheet,
        3,
      );
      const framesHash = await hashFiles(result.files);
      const manifest = {
        shot: shot.id,
        title: shot.title,
        frames: result.files.length,
        fps: project.fps,
        width: project.width,
        height: project.height,
        framesHash,
        sourceHash: hash,
        gpu,
        contactSheet: rel(sheet),
        framesDir: rel(path.join(base, shot.id, 'frames')),
      };
      await writeFile(path.join(base, shot.id, 'review.json'), JSON.stringify(manifest, null, 2));
      finalShots.push(manifest);
    }
  } finally {
    await pool.close();
    await new Promise((resolve) => server.server.close(resolve));
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    title: project.title,
    slug: project.slug,
    fps: project.fps,
    width: project.width,
    height: project.height,
    duration: project.totalDuration,
    frames: project.totalFrames,
    sourceHash: hash,
    gpu,
    shots: finalShots,
    encoded: false,
  };
  await writeFile(path.join(base, 'final-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n${paint(C.green, 'final frames rendered')} - no video has been encoded yet.`);
  for (const shot of project.shots) {
    console.log(`  node render.mjs final-verdict --shot ${shot.id} --pass --notes "what you saw" --sheet build/final/${shot.id}/contact-sheet.jpg`);
  }
  console.log('\nInspect every final sheet before recording these verdicts.');
}

async function commandFinalVerdict(flags) {
  const shotId = flags.shot;
  if (!shotId) throw new Error('final-verdict needs --shot <id>.');
  const pass = Boolean(flags.pass);
  const fail = Boolean(flags.fail);
  if (pass === fail) throw new Error('Use exactly one of --pass or --fail.');
  const notes = String(flags.notes || '').trim();
  if (!notes) throw new Error('Write --notes describing what you actually inspected.');
  if (!flags.sheet) throw new Error('Pass the final --sheet you inspected.');
  const project = await loadProject();
  const shot = project.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error(`Unknown shot "${shotId}".`);
  const hash = await sourceHash(project);
  await verifyApproval(project, hash);
  const dir = path.join(BUILD, 'final', shot.id);
  const manifestFile = path.join(dir, 'review.json');
  if (!existsSync(manifestFile)) throw new Error(`No final frames for ${shot.id}. Run: node render.mjs final`);
  const manifest = await readJson(manifestFile);
  const expectedSheet = path.join(dir, 'contact-sheet.jpg');
  if (path.resolve(abs(flags.sheet)) !== path.resolve(expectedSheet)) {
    throw new Error(`--sheet must be the final render you inspected: ${rel(expectedSheet)}`);
  }
  if (!existsSync(expectedSheet)) throw new Error(`Final sheet not found: ${flags.sheet}`);
  if (manifest.sourceHash !== hash) throw new Error('The project changed after the final frames were rendered. Re-run final.');
  const frameFiles = (await readdir(path.join(dir, 'frames'))).filter((f) => f.endsWith('.png')).sort();
  const framesHash = await hashFiles(frameFiles.map((f) => path.join(dir, 'frames', f)));
  if (framesHash !== manifest.framesHash) throw new Error('Final frames changed on disk. Re-run final.');

  await ensureDir(REVIEWS);
  const record = {
    shot: shot.id,
    stage: 'final',
    verdict: pass ? 'pass' : 'fail',
    notes,
    sheet: rel(expectedSheet),
    framesHash,
    sourceHash: hash,
    gpu: manifest.gpu ?? null,
    reviewedAt: new Date().toISOString(),
  };
  await writeFile(path.join(REVIEWS, `final-${shot.id}.json`), JSON.stringify(record, null, 2));
  if (!pass) {
    console.log(paint(C.red, `recorded final FAIL for ${shot.id}.`));
    process.exitCode = 2;
    return;
  }
  const remaining = project.shots.filter((s) => {
    const file = path.join(REVIEWS, `final-${s.id}.json`);
    if (!existsSync(file)) return true;
    try {
      const r = JSON.parse(readFileSync(file, 'utf8'));
      return r.verdict !== 'pass' || r.sourceHash !== hash;
    } catch {
      return true;
    }
  });
  console.log(paint(C.green, `recorded final PASS for ${shot.id}.`));
  if (remaining.length) console.log(`\nFinal review still needed: ${remaining.map((s) => s.id).join(', ')}`);
  else {
    console.log('\nAll final shots passed. Encoding is now allowed:');
    console.log('  node render.mjs final --encode');
  }
}

async function verifyFinalReviews(project, hash) {
  const missing = [];
  for (const shot of project.shots) {
    const finalManifestFile = path.join(BUILD, 'final', shot.id, 'review.json');
    if (!existsSync(finalManifestFile)) {
      missing.push(`${shot.id}: run node render.mjs final`);
      continue;
    }
    const finalManifest = await readJson(finalManifestFile);
    if (finalManifest.sourceHash !== hash) {
      missing.push(`${shot.id}: final frames are stale; run node render.mjs final`);
      continue;
    }
    const reviewFile = path.join(REVIEWS, `final-${shot.id}.json`);
    if (!existsSync(reviewFile)) {
      missing.push(`${shot.id}: no final verdict`);
      continue;
    }
    const review = await readJson(reviewFile);
    if (review.verdict !== 'pass') missing.push(`${shot.id}: final verdict is ${review.verdict}`);
    else if (review.sourceHash !== hash) missing.push(`${shot.id}: final review is stale`);
    else if (review.framesHash !== finalManifest.framesHash) missing.push(`${shot.id}: final review does not match the rendered frames`);
    else if (review.gpu && finalManifest.gpu && Boolean(review.gpu.hardware) !== Boolean(finalManifest.gpu.hardware)) {
      missing.push(`${shot.id}: final review was made on a different renderer (GPU/software)`);
    }
  }
  if (missing.length) throw new Error(`Final reviews are not ready:\n  ${missing.join('\n  ')}`);
}

async function commandEncode(flags) {
  printHeader('painted-animation / encode');
  const project = await loadProject();
  const hash = await sourceHash(project);
  await verifyApproval(project, hash);
  await verifyDraftReviews(project, hash);
  await verifyFinalReviews(project, hash);
  const base = path.join(BUILD, 'final');
  const render = project.render || {};
  const crf = Number(flags.crf) || Number(render.crf) || 17;
  const preset = String(flags.preset || render.preset || 'medium');
  const shotFiles = [];

  for (const shot of project.shots) {
    const framesDir = path.join(base, shot.id, 'frames');
    const out = path.join(base, `${shot.id}.mp4`);
    const command = [
      '-y',
      '-framerate',
      String(project.fps),
      '-i',
      path.join(framesDir, '%05d.png'),
      '-c:v',
      'libx264',
      '-preset',
      preset,
      '-crf',
      String(crf),
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      out,
    ];
    console.log(`  encode ${shot.id}  (${shot.frames} frames)`);
    await runProcess(FFMPEG, command, { label: `encode-${shot.id}` });
    shotFiles.push({ shot: shot.id, file: out, frames: shot.frames, command: [FFMPEG, ...command] });
  }

  const concatFile = path.join(base, 'concat.txt');
  const concatText = shotFiles.map((s) => `file '${s.file.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`).join('\n') + '\n';
  await writeFile(concatFile, concatText);
  const silent = path.join(base, 'silent.mp4');
  await runProcess(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', '-movflags', '+faststart', silent], {
    label: 'concat',
  });

  await ensureDir(OUTPUT);
  const finalFile = path.join(OUTPUT, `${project.slug || 'painted-animation'}.mp4`);
  let audioUsed = null;
  if (project.audio?.file && existsSync(abs(project.audio.file))) {
    audioUsed = abs(project.audio.file);
    const filters = [];
    const delayMs = Math.max(0, Math.round(Number(project.audio.startAt || 0) * 1000));
    if (delayMs > 0) filters.push(`adelay=${delayMs}:all=1`);
    const gain = Number(project.audio.gainDb || 0);
    if (gain) filters.push(`volume=${gain}dB`);
    const args = ['-y', '-i', silent, '-i', audioUsed, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy'];
    if (filters.length) args.push('-af', filters.join(','));
    args.push('-c:a', 'aac', '-b:a', String(render.audioBitrate || '192k'), '-shortest', '-movflags', '+faststart', finalFile);
    await runProcess(FFMPEG, args, { label: 'mux-audio' });
  } else {
    await copyFile(silent, finalFile);
  }

  if (project.lyrics?.enabled && project.lyrics.file && existsSync(abs(project.lyrics.file))) {
    const parsed = parseLrc(await readFile(abs(project.lyrics.file), 'utf8'), { offsetMs: project.lyrics.offsetMs ?? 0 });
    await writeFile(
      path.join(OUTPUT, `${project.slug || 'painted-animation'}.srt`),
      toSrt(parsed, {
        offsetSec: Number(project.audio?.startAt || 0),
        endTime: project.totalDuration,
      }),
    );
  }

  const duration = await ffmpegDuration(finalFile);
  const info = await stat(finalFile);
  const finalRun = await readJson(path.join(base, 'final-manifest.json'));
  const manifest = {
    generatedAt: new Date().toISOString(),
    title: project.title,
    slug: project.slug,
    file: rel(finalFile),
    duration,
    bytes: info.size,
    sha256: sha256(await readFile(finalFile)),
    fps: project.fps,
    width: project.width,
    height: project.height,
    frames: project.totalFrames,
    sourceHash: hash,
    gpu: finalRun.gpu ?? null,
    audio: audioUsed ? rel(audioUsed) : null,
    shots: shotFiles.map((s) => ({ shot: s.shot, frames: s.frames })),
    command: {
      ffmpeg: FFMPEG,
      encode: shotFiles.map((s) => s.command),
    },
  };
  await writeFile(path.join(OUTPUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(
    path.join(base, 'final-manifest.json'),
    JSON.stringify({ ...finalRun, encoded: true, output: rel(finalFile) }, null, 2),
  );
  console.log(`\n${paint(C.green, 'final encoded')}`);
  console.log(`  ${rel(finalFile)}  ${(info.size / 1024 / 1024).toFixed(1)} MB  ${duration?.toFixed(2) ?? '?'}s`);
  console.log(`  ${rel(path.join(OUTPUT, 'manifest.json'))}`);
}

const PURE_TIME_RULES = [
  [/\bMath\.random\s*\(/, 'Math.random() is not allowed; use api.rand()'],
  [/\bframeCount\b/, 'frameCount is not allowed; use api.t'],
  [/\bmillis\s*\(/, 'millis() is not allowed; use api.t'],
  [/\bDate\.now\s*\(/, 'Date.now() is not allowed'],
  [/\bperformance\.now\s*\(/, 'performance.now() is not allowed'],
  [/\b(setTimeout|setInterval|requestAnimationFrame)\s*\(/, 'timers are not allowed inside scenes'],
];

async function scanPureTime() {
  const files = await walk(path.join(ROOT, 'scenes'));
  const problems = [];
  for (const file of files.filter((f) => f.endsWith('.js'))) {
    const source = (await readFile(file, 'utf8'))
      .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, '');
    const lines = source.split('\n');
    for (const [rule, message] of PURE_TIME_RULES) {
      for (let i = 0; i < lines.length; i += 1) {
        if (rule.test(lines[i])) problems.push(`${rel(file)}:${i + 1}  ${message}`);
      }
    }
  }
  return problems;
}

async function commandCheck(flags) {
  printHeader('painted-animation / check');
  const project = await loadProject();
  const { errors } = await validateProject(project);
  if (errors.length) throw new Error(errors.join('\n'));
  const problems = await scanPureTime();
  if (problems.length) {
    console.log(paint(C.red, 'pure-time scan failed'));
    for (const problem of problems) console.log(`  ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log(paint(C.green, 'pure-time scan passed') + '  (no Math.random, frameCount, millis or timers in scenes)');

  const shot = project.shots.find((s) => s.id === flags.shot) || project.shots[0];
  const t1 = Math.min(1, shot.duration / 3);
  const t2 = Math.min(2, shot.duration * 0.6);
  const base = path.join(BUILD, 'check', shot.id);
  const server = await startServer();
  const gpuMode = resolveGpuMode(flags, project);
  const pool = await openPool(server, 1, gpuMode);
  try {
    const result = await renderFrameSet({
      pool,
      baseUrl: server.url,
      project,
      shot,
      width: 480,
      height: 270,
      fps: project.fps,
      debug: false,
      outDir: base,
      times: [t1, t2, t1, t2],
      workers: 1,
      label: 'check',
    });
    const hashes = [];
    for (const file of result.files) hashes.push(sha256(await readFile(file)));
    if (hashes[0] !== hashes[2] || hashes[1] !== hashes[3]) {
      throw new Error(
        `Determinism check failed for ${shot.id}: the same timestamp rendered differently on a second pass. ` +
          'Look for mutable module state or hidden frame-dependent animation.',
      );
    }
    console.log(paint(C.green, 'determinism check passed') + `  (${shot.id}, t=${t1.toFixed(2)}s and t=${t2.toFixed(2)}s)`);
    console.log(`  ${hashes[0].slice(0, 16)}...`);
  } finally {
    await pool.close();
    await new Promise((resolve) => server.server.close(resolve));
  }
}

async function commandClean() {
  await rm(BUILD, { recursive: true, force: true });
  console.log('Removed build/. Reviews, approval and output were kept.');
}

async function commandHelp() {
  console.log(`painted-animation renderer

  node render.mjs doctor
  node render.mjs check
  node render.mjs storyboard
  node render.mjs review --shot <id>
  node render.mjs verdict --shot <id> --pass --notes "..." --sheet <review-sheet>
  node render.mjs approve --mode local --quote "user's exact choice"
  node render.mjs final
  node render.mjs final-verdict --shot <id> --pass --notes "..." --sheet <final-sheet>
  node render.mjs final --encode
  node render.mjs clean

Options:
  --gpu auto|on|off   WebGL renderer (default auto: hardware, fallback software)
  --workers <n>       Parallel Chrome processes, 1-6

Full rendering is local-only and requires approval.json written by
"approve" after the user explicitly chooses a local render.`);
}

async function main() {
  const command = process.argv[2] || 'help';
  const flags = parseFlags(process.argv.slice(3));
  if (command === 'doctor') return commandDoctor(flags);
  if (command === 'check') return commandCheck(flags);
  if (command === 'storyboard') return commandStoryboard(flags);
  if (command === 'review') return commandReview(flags);
  if (command === 'verdict') return commandVerdict(flags);
  if (command === 'approve') return commandApprove(flags);
  if (command === 'final') return commandFinal(flags);
  if (command === 'final-verdict') return commandFinalVerdict(flags);
  if (command === 'clean') return commandClean(flags);
  if (command === 'help' || command === '--help' || command === '-h') return commandHelp();
  throw new Error(`Unknown command "${command}". Run node render.mjs help.`);
}

main().catch((error) => {
  console.error(`\n${paint(C.red, 'error')} ${error.message}`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exitCode = 1;
});

