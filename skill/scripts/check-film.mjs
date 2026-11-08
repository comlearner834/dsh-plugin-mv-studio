#!/usr/bin/env node
/**
 * Post-render check: format, first-frame flash, loop seam, audio, motion curve.
 *
 * Usage:
 *   node scripts/check-film.mjs
 *   node scripts/check-film.mjs --file output/my-film.mp4 --times 1,4.8,10
 *   node scripts/check-film.mjs --loop
 *
 * Writes build/check/sheet.png, stills, audio.png.
 * Needs ffmpeg (FFMPEG_PATH or local ffmpeg-static).
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';

const run = promisify(execFile);
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const root = process.cwd();
const project = JSON.parse(await readFile(join(root, 'project.json'), 'utf8'));
const file = resolve(root, opt('file', join('output', `${project.slug}.mp4`)));
if (!existsSync(file)) {
  console.error(`missing ${file}; run "node render.mjs final --encode" first.`);
  process.exit(2);
}
const outDir = join(root, 'build', 'check');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

let ffmpeg = process.env.FFMPEG_PATH || '';
if (!ffmpeg) {
  try {
    const mod = await import('ffmpeg-static');
    ffmpeg = mod.default || mod;
  } catch {
    ffmpeg = 'ffmpeg';
  }
}

const failures = [];
const notes = [];
const meta = async (input) => {
  try {
    const { stderr } = await run(ffmpeg, ['-hide_banner', '-i', input], { maxBuffer: 8 * 1024 * 1024 });
    return stderr;
  } catch (error) {
    return String(error.stderr || error.message || '');
  }
};
const probe = await meta(file);
const duration = Number((probe.match(/Duration:\s*(\d+):(\d+):([\d.]+)/) || []).slice(1).reduce((acc, v, i) => acc + Number(v) * [3600, 60, 1][i], 0));
const size = probe.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
const fps = Number((probe.match(/([\d.]+)\s*fps/) || [])[1] || 0);
const hasAudio = /Stream #.*Audio:/.test(probe);
const width = size ? Number(size[1]) : 0;
const height = size ? Number(size[2]) : 0;

console.log(`file     ${file}`);
console.log(`format   ${width}x${height} ${fps}fps ${duration.toFixed(2)}s audio=${hasAudio ? 'yes' : 'no'}`);
if (width !== project.width) failures.push(`width ${width}, project ${project.width}`);
if (height !== project.height) failures.push(`height ${height}, project ${project.height}`);
if (Math.abs(fps - project.fps) > 0.05) failures.push(`fps ${fps}, project ${project.fps}`);
const expected = project.totalDuration ?? project.shots.reduce((n, s) => n + s.duration, 0);
if (Math.abs(duration - expected) > 0.12) failures.push(`duration ${duration.toFixed(2)}s, project ${expected}s`);
if (project.audio?.file && !hasAudio) failures.push('project has audio but the MP4 has no audio stream');

const pixel = async (at) => {
  const { stdout } = await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-ss', String(at), '-i', file,
    '-frames:v', '1', '-vf', 'crop=60:60:30:30,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
  ], { encoding: 'buffer', maxBuffer: 1024 });
  return [...stdout];
};
try {
  const first = await pixel(0);
  const one = await pixel(Math.min(1, Math.max(0.1, duration - 0.1)));
  const diff = Math.max(...first.map((v, i) => Math.abs(v - one[i])));
  if (diff > 8) failures.push(`frame 0 background differs from 1 s (max channel diff ${diff})`);
  else notes.push('frame 0 has no colour flash');
} catch (error) {
  notes.push(`first-frame check skipped: ${error.message}`);
}

if (args.includes('--loop') || project.loop) {
  try {
    const first = join(outDir, '.first.png');
    const last = join(outDir, '.last.png');
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-frames:v', '1', '-vf', 'scale=480:270,format=gray', first]);
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-sseof', '-0.1', '-i', file, '-an', '-update', '1', '-vf', 'scale=480:270,format=gray', last]);
    const { stderr } = await run(ffmpeg, ['-hide_banner', '-i', first, '-i', last, '-lavfi', 'ssim', '-f', 'null', '-']);
    const ssim = Number((stderr.match(/All:([\d.]+)/) || [])[1]);
    if (Number.isFinite(ssim) && ssim < 0.97) failures.push(`loop seam SSIM ${ssim.toFixed(3)} < 0.97`);
    else if (Number.isFinite(ssim)) notes.push(`loop seam SSIM ${ssim.toFixed(3)}`);
  } catch (error) {
    notes.push(`loop seam check skipped: ${error.message}`);
  }
}

if (hasAudio) {
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-lavfi', 'showspectrumpic=s=1200x240:legend=0:scale=log', join(outDir, 'audio.png')]);
  notes.push('audio spectrogram: build/check/audio.png');
}

const d = duration || expected;
await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vf', `fps=12/${d},scale=480:-1,tile=4x3`, '-frames:v', '1', join(outDir, 'sheet.png')]);
const times = String(opt('times', ''))
  .split(',')
  .map((v) => Number(v))
  .filter((v) => Number.isFinite(v) && v >= 0 && v < d);
if (!times.length) times.push(0, d / 2, Math.max(0, d - 0.05));
for (const t of times) {
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=960:-1', join(outDir, `f-${t.toFixed(2)}.png`)]);
}

let curve = [];
try {
  const { stdout } = await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-i', file,
    '-vf', 'scale=192:108,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
    '-f', 'null', '-',
  ], { maxBuffer: 32 * 1024 * 1024 });
  const values = (String(stdout).match(/YAVG=([\d.]+)/g) || []).map((v) => Number(v.split('=')[1]));
  const half = Math.max(1, Math.round(project.fps / 2));
  for (let i = 0; i + half <= values.length; i += half) {
    const slice = values.slice(i, i + half);
    curve.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  if (curve.length) {
    const sorted = [...curve].sort((a, b) => a - b);
    const median = sorted[Math.floor((sorted.length - 1) / 2)] || 0.05;
    console.log('motion per 0.5 s');
    curve.forEach((v, i) => {
      const flag = v > Math.max(1, median * 4) ? '  spike' : v < 0.005 ? '  still' : '';
      console.log(`  ${(i * 0.5).toFixed(1)}s  ${v.toFixed(2)}${flag}`);
    });
    if (curve.some((v) => v < 0.005)) notes.push('motion curve has a still segment; confirm it is a planned hold');
    if (curve.some((v) => v > Math.max(1, median * 4))) notes.push('motion curve has an unplanned spike');
  }
} catch (error) {
  notes.push(`motion curve skipped: ${error.message}`);
}

console.log(`sheet    build/check/sheet.png`);
console.log(`stills   build/check/f-*.png`);
for (const note of notes) console.log(`note     ${note}`);
if (failures.length) {
  for (const failure of failures) console.log(`FAIL     ${failure}`);
  process.exitCode = 1;
} else {
  console.log('PASS     format and first-frame checks');
}
