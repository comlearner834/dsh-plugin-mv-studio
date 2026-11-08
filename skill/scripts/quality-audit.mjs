#!/usr/bin/env node
/**
 * Static quality audit for a painted-animation project.
 *
 * It cannot judge taste. It catches the production shortcuts that made a
 * 27-shot film look like five flat drawings:
 *   - flat p5 fills instead of p5.brush washes
 *   - too many shots for the number of distinct scene/variant pairs
 *   - overlong shots
 *   - unsafe lyric size/position
 *
 * Usage:
 *   node scripts/quality-audit.mjs
 *   node scripts/quality-audit.mjs --project ../night-train --strict
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const root = resolve(opt('project', process.cwd()));
const strict = args.includes('--strict');
const project = JSON.parse(await readFile(join(root, 'project.json'), 'utf8'));
const sceneDir = join(root, 'scenes');
const warnings = [];
const notes = [];

const files = existsSync(sceneDir)
  ? (await readdir(sceneDir)).filter((name) => name.endsWith('.js'))
  : [];
let flat = 0;
let brush = 0;
for (const file of files) {
  const source = await readFile(join(sceneDir, file), 'utf8');
  const flatCount = (source.match(/\bp\.(fill|rect|ellipse|circle|triangle|beginShape)\s*\(/g) || []).length;
  const brushCount = (source.match(/\b(fillPoly|washPoly|hatchPoly|brush\.(fill|wash|hatch))\s*\(/g) || []).length;
  flat += flatCount;
  brush += brushCount;
  if (flatCount > 12 && flatCount > brushCount * 3) {
    warnings.push(`${file}: ${flatCount} flat fills vs ${brushCount} brush fills`);
  }
}
const shots = project.shots || [];
const pairs = new Set(shots.map((shot) => `${shot.scene}|${shot.variant || ''}`));
const families = new Set(shots.map((shot) => shot.scene));
if (shots.length > 12 && shots.length > pairs.size * 2) {
  warnings.push(`${shots.length} shots use only ${pairs.size} scene/variant pairs`);
}
if (shots.length > 15 && shots.length > families.size * 3) {
  warnings.push(`${shots.length} shots use only ${families.size} scene families`);
}
const long = shots.filter((shot) => Number(shot.duration) > 9);
if (long.length > 3) {
  warnings.push(`${long.length} shots are longer than 9s (${long.map((shot) => shot.id).slice(0, 4).join(', ')}…)`);
}
if (project.lyrics?.enabled) {
  if (Number(project.lyrics.size || 40) < 34) warnings.push('lyric size is below 34px');
  if (Number(project.lyrics.bottom ?? 0.84) > 0.9) warnings.push('lyric baseline is too low (bottom > 0.9)');
}
if (Number(project.fps) > 30) warnings.push(`fps ${project.fps}; 24 is usually enough for this style`);
if (Number(project.render?.workers || 4) > 4) warnings.push(`workers ${project.render.workers}; 4 or fewer avoids CPU thrash`);

console.log(`project   ${project.title} (${project.slug})`);
console.log(`shots     ${shots.length} / ${pairs.size} scene-variant pairs`);
console.log(`paint     ${flat} flat fills vs ${brush} brush fills (whole scenes/)`);
for (const file of files) {
  const source = await readFile(join(sceneDir, file), 'utf8');
  const f = (source.match(/\bp\.(fill|rect|ellipse|circle|triangle|beginShape)\s*\(/g) || []).length;
  const b = (source.match(/\b(fillPoly|washPoly|hatchPoly|brush\.(fill|wash|hatch))\s*\(/g) || []).length;
  if (f || b) console.log(`  ${file.padEnd(14)} flat ${String(f).padStart(3)}  brush ${String(b).padStart(3)}`);
}
if (!warnings.length) {
  console.log('\nPASS  no structural shortcut found');
  process.exit(0);
}
console.log('\nWARN');
for (const warning of warnings) console.log(`  - ${warning}`);
console.log('\nThese are shortcuts, not proof of bad art. A 6-second pilot still needs a 100% look.');
if (strict) process.exit(1);
