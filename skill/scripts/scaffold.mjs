#!/usr/bin/env node
/**
 * Copy the painted-animation template into a new project.
 *
 * Usage:
 *   node scripts/scaffold.mjs "D:/work/my-mv" --title "纸月亮" --slug "paper-moon"
 */
import { cp, readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const template = path.join(skillRoot, 'template');
const args = process.argv.slice(2);
const targetArg = args.find((a) => !a.startsWith('--'));
if (!targetArg) {
  console.error('Usage: node scripts/scaffold.mjs <target-dir> --title "..." --slug "... " [--width 1280] [--height 720] [--fps 24]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const target = path.resolve(targetArg);
const title = opt('title', '未命名');
const slug = opt('slug', path.basename(target).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'painted-animation');
const width = Number(opt('width', 1280));
const height = Number(opt('height', 720));
const fps = Number(opt('fps', 24));

if (target === template || target === skillRoot || skillRoot.startsWith(target + path.sep)) {
  console.error('Refusing to scaffold into the skill directory or its parent.');
  process.exit(1);
}
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16 || width % 2 || height % 2) {
  console.error('width/height must be even integers.');
  process.exit(1);
}
if (!Number.isInteger(fps) || fps < 1 || fps > 60) {
  console.error('fps must be an integer from 1 to 60.');
  process.exit(1);
}

if (existsSync(target)) {
  const entries = await readdir(target);
  if (entries.length) {
    console.error(`Target exists and is not empty: ${target}`);
    console.error('Choose a new directory, or empty it yourself. This script never deletes a project.');
    process.exit(1);
  }
}
await mkdir(target, { recursive: true });

const skip = new Set(['node_modules', 'build', 'output', 'reviews', '.git', 'approval.json']);
await cp(template, target, {
  recursive: true,
  filter: (src) => {
    const name = path.basename(src);
    if (skip.has(name)) return false;
    if (name.startsWith('probe-') || name.endsWith('.log')) return false;
    return true;
  },
});

const projectFile = path.join(target, 'project.json');
const project = JSON.parse(await readFile(projectFile, 'utf8'));
project.title = title;
project.slug = slug;
project.width = width;
project.height = height;
project.fps = fps;
await writeFile(projectFile, JSON.stringify(project, null, 2) + '\n');

console.log(`\nCreated ${project.title} at ${target}`);
console.log('\nNext commands (PowerShell):');
console.log(`  cd "${target}"`);
console.log('  npm install');
console.log('  node render.mjs doctor');
console.log('  node render.mjs check');
console.log('  node render.mjs storyboard');
console.log('\nThen replace the demo scenes, audio and LRC. The demo is a complete working project, not a placeholder.');
