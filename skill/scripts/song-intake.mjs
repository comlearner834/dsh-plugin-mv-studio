#!/usr/bin/env node
/**
 * Resolve a song reference (title + artist) to a local audio/LRC pair.
 *
 * It never downloads audio or lyrics. It looks in local music folders and
 * the project's own audio/lyrics folders. If nothing authorized is found and
 * fallback is allowed, it writes an original instrumental score and marks the
 * project as an original interpretation, not the commercial recording.
 *
 * Usage:
 *   node scripts/song-intake.mjs --project "D:/work/my-mv" \
 *     --title "晴天" --artist "周杰伦" --mode auto
 *
 * Options:
 *   --project <dir>     project root (default: cwd)
 *   --title <text>      song title (required)
 *   --artist <text>     artist / author
 *   --music-dir <dir>   extra local library (repeatable)
 *   --audio <file>      explicit authorized audio file
 *   --lrc <file>        explicit LRC file
 *   --mode auto|local|original   default auto (fallback to original)
 *   --duration <sec>    original score length, default 30
 *   --force             replace an existing generated asset
 *   --json              machine-readable result
 */
import { existsSync } from 'node:fs';
import {
  readFile, writeFile, mkdir, readdir, copyFile, open,
} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.opus']);
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);
const collect = (name) => {
  const out = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === `--${name}` && args[i + 1] && !args[i + 1].startsWith('--')) out.push(path.resolve(args[i + 1]));
  }
  return out;
};

const projectRoot = path.resolve(opt('project', process.cwd()));
const projectFile = path.join(projectRoot, 'project.json');
const title = String(opt('title', '')).trim();
const artist = String(opt('artist', '')).trim();
const mode = String(opt('mode', 'auto'));
const duration = Math.max(5, Number(opt('duration', 30)));
const force = has('force');
const asJson = has('json');

if (!title) {
  console.error('Missing --title. Only a song title and artist are needed, but the title is required.');
  process.exit(1);
}
if (!['auto', 'local', 'original'].includes(mode)) {
  console.error('--mode must be auto, local, or original.');
  process.exit(1);
}
if (!existsSync(projectFile)) {
  console.error(`No project.json at ${projectRoot}. Scaffold the project first.`);
  process.exit(1);
}

const project = JSON.parse(await readFile(projectFile, 'utf8'));
const norm = (s) => String(s)
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[\s._\-—–·•()[\]{}《》「」『』]+/g, '');
const nTitle = norm(title);
const nArtist = norm(artist);
const slugBase = String(`${artist || 'unknown'}-${title}`)
  .toLowerCase()
  .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
  .replace(/^-|-$/g, '') || 'song';
const slug = slugBase.slice(0, 64);

/**
 * Read TITLE/ARTIST from a FLAC Vorbis comment block without a dependency.
 * FLAC files are commonly named "01.flac" while the real names live in tags.
 */
async function readFlacTags(file) {
  const handle = await open(file, 'r');
  try {
    const header = Buffer.alloc(4);
    if ((await handle.read(header, 0, 4, 0)).bytesRead < 4 || header.toString('latin1') !== 'fLaC') return {};
    let offset = 4;
    for (let block = 0; block < 64; block += 1) {
      const blockHeader = Buffer.alloc(4);
      const read = await handle.read(blockHeader, 0, 4, offset);
      if (read.bytesRead < 4) break;
      const last = (blockHeader[0] & 0x80) !== 0;
      const type = blockHeader[0] & 0x7f;
      const length = blockHeader.readUIntBE(1, 3);
      offset += 4;
      if (type === 4) {
        const data = Buffer.alloc(Math.min(length, 2 * 1024 * 1024));
        await handle.read(data, 0, data.length, offset);
        let cursor = 0;
        if (data.length < 8) return {};
        const vendorLength = data.readUInt32LE(cursor);
        cursor += 4 + vendorLength;
        if (cursor + 4 > data.length) return {};
        const count = data.readUInt32LE(cursor);
        cursor += 4;
        const tags = {};
        for (let i = 0; i < count && cursor + 4 <= data.length; i += 1) {
          const size = data.readUInt32LE(cursor);
          cursor += 4;
          if (cursor + size > data.length) break;
          const entry = data.subarray(cursor, cursor + size).toString('utf8');
          cursor += size;
          const eq = entry.indexOf('=');
          if (eq > 0) tags[entry.slice(0, eq).toUpperCase()] = entry.slice(eq + 1);
        }
        return tags;
      }
      offset += length;
      if (last) break;
    }
    return {};
  } finally {
    await handle.close();
  }
}

async function scoreAudio(file) {
  const ext = path.extname(file).toLowerCase();
  const base = norm(path.basename(file, ext));
  let tags = {};
  if (ext === '.flac') {
    try {
      tags = await readFlacTags(file);
    } catch {
      tags = {};
    }
  }
  const tagTitle = norm(tags.TITLE || '');
  const tagArtist = norm(tags.ARTIST || '');
  const haystack = `${base}${tagTitle}${tagArtist}`;
  if (!haystack.includes(nTitle)) return -1;
  let score = base.includes(nTitle) || tagTitle.includes(nTitle) ? 6 : 4;
  if (nArtist && (base.includes(nArtist) || tagArtist.includes(nArtist))) score += 4;
  if (tagTitle === nTitle) score += 1;
  if (nArtist && tagArtist === nArtist) score += 1;
  if (base.startsWith(nTitle)) score += 1;
  if (ext === '.mp3') score += 1;
  if (ext === '.flac') score += 0.5;
  if (ext === '.wav') score += 0.5;
  return score;
}

async function walk(dir, depth, out) {
  if (depth < 0 || out.length > 8000) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, depth - 1, out);
    else if (entry.isFile() && AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
}

function findLrc(audioFile) {
  const dir = path.dirname(audioFile);
  const stem = path.basename(audioFile, path.extname(audioFile));
  const candidates = [
    path.join(dir, `${stem}.lrc`),
    path.join(dir, `${stem}.LRC`),
    path.join(dir, 'lyrics', `${stem}.lrc`),
    path.join(dir, '..', 'lyrics', `${stem}.lrc`),
  ];
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function seedFor(text) {
  return parseInt(crypto.createHash('sha1').update(text).digest('hex').slice(0, 8), 16) >>> 0;
}

function rel(file) {
  return path.relative(projectRoot, file).replaceAll('\\', '/');
}

async function copyInto(source, folder, preferredName) {
  const targetDir = path.join(projectRoot, folder);
  await mkdir(targetDir, { recursive: true });
  const ext = path.extname(source).toLowerCase();
  const target = path.join(targetDir, preferredName);
  if (path.resolve(source) !== path.resolve(target) || force) {
    if (existsSync(target) && !force) {
      // Reuse an identical existing asset instead of duplicating it.
      const a = await readFile(source);
      const b = await readFile(target);
      if (!a.equals(b)) {
        throw new Error(`Target exists: ${rel(target)}. Pass --force to replace it.`);
      }
    } else {
      await copyFile(source, target);
    }
  }
  return target;
}

async function finish(result) {
  project.song = {
    title,
    artist: artist || null,
    mode: result.mode,
    source: result.source,
    note: result.note,
    duration: result.mode === 'original' ? result.duration : null,
    resolvedAt: new Date().toISOString(),
  };
  await writeFile(projectFile, `${JSON.stringify(project, null, 2)}\n`);
  if (asJson) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`\n${result.mode === 'local' ? 'local audio' : 'original interpretation'}: ${title}${artist ? ` - ${artist}` : ''}`);
    console.log(`  audio: ${result.audio}`);
    console.log(`  lrc:   ${result.lrc || '(none)'}`);
    console.log(`  note:  ${result.note}`);
    if (result.mode === 'original') {
      console.log('\nThis is a new instrumental score, not the commercial recording. Write original lyrics if desired, then set shot durations to the score length.');
    }
    console.log('\nNext: npm install (if needed), then node render.mjs check / storyboard.');
  }
}

const explicitAudio = opt('audio', null) ? path.resolve(opt('audio')) : null;
const explicitLrc = opt('lrc', null) ? path.resolve(opt('lrc')) : null;

if (explicitAudio) {
  if (!existsSync(explicitAudio)) throw new Error(`Audio not found: ${explicitAudio}`);
  const copiedAudio = await copyInto(explicitAudio, 'audio', `song-${slug}${path.extname(explicitAudio).toLowerCase()}`);
  let copiedLrc = null;
  if (explicitLrc) {
    if (!existsSync(explicitLrc)) throw new Error(`LRC not found: ${explicitLrc}`);
    copiedLrc = await copyInto(explicitLrc, 'lyrics', `song-${slug}.lrc`);
  }
  project.audio = { ...(project.audio || {}), file: rel(copiedAudio), startAt: 0, gainDb: -1.5 };
  project.lyrics = { ...(project.lyrics || {}), enabled: Boolean(copiedLrc), file: copiedLrc ? rel(copiedLrc) : null };
  await finish({
    mode: 'local',
    source: 'explicit',
    audio: rel(copiedAudio),
    lrc: copiedLrc ? rel(copiedLrc) : null,
    duration,
    note: 'User-supplied/authorized audio. The visual timeline should be cut to its duration.',
  });
  process.exit(0);
}

const projectAudioDir = path.join(projectRoot, 'audio');
const envDirs = [process.env.DSH_MUSIC_DIR, process.env.MUSIC_DIR]
  .filter(Boolean)
  .flatMap((value) => value.split(path.delimiter));
const libraryDirs = [...collect('music-dir'), ...envDirs, path.join(os.homedir(), 'Music'), projectAudioDir];
const seen = new Set();
const candidates = [];
for (const dir of libraryDirs) {
  if (!existsSync(dir) || seen.has(dir)) continue;
  seen.add(dir);
  const files = [];
  await walk(dir, 3, files);
  for (const file of files) candidates.push(file);
}
const ranked = (await Promise.all(candidates.map(async (file) => ({
  file,
  score: await scoreAudio(file),
  lrc: findLrc(file),
}))))
  .filter((item) => item.score >= 0)
  .sort((a, b) => (b.score + (b.lrc ? 5 : 0)) - (a.score + (a.lrc ? 5 : 0)));

if (ranked.length && mode !== 'original') {
  const chosen = ranked[0];
  const audio = await copyInto(chosen.file, 'audio', `song-${slug}${path.extname(chosen.file).toLowerCase()}`);
  let lrc = null;
  if (explicitLrc) lrc = await copyInto(explicitLrc, 'lyrics', `song-${slug}.lrc`);
  else if (chosen.lrc) lrc = await copyInto(chosen.lrc, 'lyrics', `song-${slug}.lrc`);
  project.audio = { ...(project.audio || {}), file: rel(audio), startAt: 0, gainDb: -1.5 };
  project.lyrics = { ...(project.lyrics || {}), enabled: Boolean(lrc), file: lrc ? rel(lrc) : null };
  await finish({
    mode: 'local',
    source: 'library',
    audio: rel(audio),
    lrc: lrc ? rel(lrc) : null,
    duration,
    note: 'Matched authorized local audio. The visual timeline should be cut to its duration.',
  });
  process.exit(0);
}

if (mode === 'local') {
  if (asJson) console.log(JSON.stringify({ status: 'needs-audio', title, artist, candidates: ranked.slice(0, 5).map((r) => r.file) }, null, 2));
  else {
    console.log(`No local audio found for "${title}"${artist ? ` - ${artist}` : ''}.`);
    console.log('Attach an authorized audio file and LRC, or run with --mode auto to make an original interpretation.');
  }
  process.exit(2);
}

const audioDir = path.join(projectRoot, 'audio');
await mkdir(audioDir, { recursive: true });
const original = path.join(audioDir, `original-${slug}.wav`);
const audioTool = [
  path.join(projectRoot, 'tools', 'make-audio.mjs'),
  path.join(SCRIPT_ROOT, 'template', 'tools', 'make-audio.mjs'),
  path.join(SCRIPT_ROOT, 'tools', 'make-audio.mjs'),
].find((candidate) => existsSync(candidate));
if (!audioTool) {
  throw new Error('make-audio.mjs not found. Keep tools/make-audio.mjs in the project or run from the skill.');
}
if (!existsSync(original) || force) {
  execFileSync(process.execPath, [
    audioTool,
    '--out', original,
    '--duration', String(duration),
    '--seed', String(seedFor(`${title}\0${artist}`)),
  ], { stdio: 'ignore' });
}
let lrc = null;
if (explicitLrc) {
  if (!existsSync(explicitLrc)) throw new Error(`LRC not found: ${explicitLrc}`);
  lrc = await copyInto(explicitLrc, 'lyrics', `song-${slug}.lrc`);
}
project.audio = { ...(project.audio || {}), file: rel(original), startAt: 0, gainDb: -1.5 };
project.lyrics = { ...(project.lyrics || {}), enabled: Boolean(lrc), file: lrc ? rel(lrc) : null };
await finish({
  mode: 'original',
  source: 'generated',
  audio: rel(original),
  lrc: lrc ? rel(lrc) : null,
  duration,
  note: 'Original instrumental interpretation generated locally. This is not the commercial recording; use original lyrics and credit it as an interpretation.',
});
