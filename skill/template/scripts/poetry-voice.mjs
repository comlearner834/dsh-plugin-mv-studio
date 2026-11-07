#!/usr/bin/env node
/**
 * Generate a local recitation track for a poetry plan on Windows.
 *
 * It uses the installed System.Speech voice (Huihui on this machine), speaks
 * one line at a time with a short pause, measures the actual WAVs, concatenates
 * them, and writes the timing back into poetry-plan.json. No network, no TTS
 * service, no model.
 *
 * Usage:
 *   node scripts/poetry-voice.mjs --project "D:/work/poem-mv" --plan poetry-plan.json
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const projectRoot = path.resolve(opt('project', process.cwd()));
const planPath = path.resolve(projectRoot, opt('plan', 'poetry-plan.json'));
const gapSec = Math.max(0, Number(opt('gap', 0.45)));
const voice = String(opt('voice', '')).trim();

if (process.platform !== 'win32') {
  console.error('poetry-voice.mjs currently needs Windows System.Speech. Record the poem or use another local TTS.');
  process.exit(2);
}
if (!existsSync(planPath)) {
  console.error(`Plan not found: ${planPath}`);
  process.exit(1);
}
const script = [
  path.join(projectRoot, 'scripts', 'poetry-voice.ps1'),
  path.join(SCRIPT_ROOT, 'scripts', 'poetry-voice.ps1'),
  path.join(SCRIPT_ROOT, 'template', 'scripts', 'poetry-voice.ps1'),
].find((candidate) => existsSync(candidate));
if (!script) {
  console.error('poetry-voice.ps1 not found. Keep the scripts/ folder in the project.');
  process.exit(1);
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const lines = plan.lines ?? [];
if (!lines.length) {
  console.error('poetry-plan.json has no lines.');
  process.exit(1);
}

const wavDir = path.join(projectRoot, 'audio', 'poetry');
await rm(wavDir, { recursive: true, force: true });
await mkdir(wavDir, { recursive: true });
const linesFile = path.join(wavDir, 'lines.txt');
await writeFile(
  linesFile,
  lines.map((line) => line.recitation?.text || line.text).join('\n'),
  'utf8',
);
const psArgs = [
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', script,
  '-LinesFile', linesFile,
  '-OutDir', wavDir,
];
if (voice) psArgs.push('-Voice', voice);
execFileSync('powershell.exe', psArgs, { stdio: 'inherit', windowsHide: true });

function parseWav(buffer) {
  if (buffer.toString('latin1', 0, 4) !== 'RIFF' || buffer.toString('latin1', 8, 12) !== 'WAVE') {
    throw new Error('Not a RIFF/WAVE file.');
  }
  let offset = 12;
  let fmt = null;
  let pcm = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('latin1', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      fmt = {
        format: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        bits: buffer.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      pcm = buffer.subarray(body, body + size);
    }
    offset = body + size + (size % 2);
  }
  if (!fmt || !pcm) throw new Error('WAV is missing fmt/data.');
  if (fmt.format !== 1 || fmt.bits !== 16) {
    throw new Error('Only 16-bit PCM WAV is supported by this helper.');
  }
  return { ...fmt, pcm };
}

const files = (await readdir(wavDir)).filter((file) => /^line-\d+\.wav$/i.test(file)).sort();
if (files.length !== lines.length) {
  throw new Error(`Expected ${lines.length} recitation WAVs, found ${files.length}.`);
}
const wavs = [];
for (let i = 0; i < files.length; i += 1) {
  const file = path.join(wavDir, files[i]);
  const wav = parseWav(await readFile(file));
  if (wav.channels !== wavs[0]?.channels || wav.sampleRate !== wavs[0]?.sampleRate) {
    if (wavs.length) throw new Error('Voice WAVs have inconsistent sample rates/channels.');
  }
  wavs.push({ ...wav, file, duration: wav.pcm.length / (wav.sampleRate * wav.channels * 2) });
}
const format = wavs[0];
const silence = Buffer.alloc(Math.round(gapSec * format.sampleRate) * format.channels * 2);
const pcmParts = [];
let total = 0;
for (let i = 0; i < wavs.length; i += 1) {
  const wav = wavs[i];
  const gap = i < wavs.length - 1 ? gapSec : 0;
  const duration = wav.duration + gap;
  lines[i].recitation = {
    ...(lines[i].recitation ?? {}),
    text: lines[i].recitation?.text || lines[i].text,
    wav: path.relative(projectRoot, wav.file).replaceAll('\\', '/'),
    speechSec: Math.round(wav.duration * 100) / 100,
    durationSec: Math.round(duration * 100) / 100,
  };
  lines[i].durationSec = lines[i].recitation.durationSec;
  pcmParts.push(wav.pcm);
  if (gap > 0) pcmParts.push(silence);
  total += duration;
}
const pcm = Buffer.concat(pcmParts);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(format.channels, 22);
header.writeUInt32LE(format.sampleRate, 24);
header.writeUInt32LE(format.sampleRate * format.channels * 2, 28);
header.writeUInt16LE(format.channels * 2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);
const outFile = path.join(projectRoot, 'audio', 'poetry-recitation.wav');
await writeFile(outFile, Buffer.concat([header, pcm]));

plan.lines = lines;
plan.voice = {
  engine: 'windows-system-speech',
  voice: voice || 'auto-zh',
  wav: path.relative(projectRoot, outFile).replaceAll('\\', '/'),
  totalDurationSec: Math.round(total * 100) / 100,
  generatedAt: new Date().toISOString(),
};
plan.totalDurationSec = Math.round(total * 100) / 100;
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);

const projectFile = path.join(projectRoot, 'project.json');
if (existsSync(projectFile)) {
  const project = JSON.parse(await readFile(projectFile, 'utf8'));
  project.audio = { ...(project.audio || {}), file: plan.voice.wav, startAt: 0, gainDb: -1.0 };
  project.lyrics = { ...(project.lyrics || {}), enabled: false };
  project.poetry = {
    ...(project.poetry || {}),
    title: plan.title,
    author: plan.author,
    style: plan.style,
    styleName: plan.styleName,
    plan: path.relative(projectRoot, planPath).replaceAll('\\', '/'),
    lineCount: lines.length,
    totalDurationSec: plan.totalDurationSec,
    voice: plan.voice,
    lineDurations: lines.map((line) => ({
      index: line.index,
      text: line.text,
      durationSec: line.durationSec,
    })),
  };
  await writeFile(projectFile, `${JSON.stringify(project, null, 2)}\n`);
}

console.log(`recitation: ${path.relative(projectRoot, outFile)}`);
console.log(`lines:      ${lines.length}`);
console.log(`duration:   ${plan.totalDurationSec}s`);
for (const line of lines) console.log(`  ${String(line.index).padStart(2, '0')}  ${line.durationSec}s  ${line.text}`);
console.log('\nNow build project.shots with these durations (one line = one shot).');
