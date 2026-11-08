#!/usr/bin/env node
/**
 * short-plan.mjs — build the fixed short-video timeline.
 *
 * Usage:
 *   node scripts/short-plan.mjs --title "纸灯" --topic "一盏纸灯的新品预热" \
 *     --rounds 6 --ratio vertical --theme coral --out short-plan.json
 *
 * Structure: opening 3s + N rounds × 4s (card 1s + style 3s) + ending 3s.
 * It writes <out>.json and <out>.md next to it. It does not render.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const THEMES = {
  coral: { name: '珊瑚暗夜', bg: '#0e0e0d', paper: '#f4efe6', accent: '#d97757', ink: '#f4efe6' },
  claude: { name: '橙光白', bg: '#f4efe6', paper: '#fffaf2', accent: '#d97757', ink: '#1d1a17' },
  aqua: { name: '水蓝莫兰迪', bg: '#eef3f0', paper: '#f7fbf8', accent: '#6f9e9a', ink: '#24302e' },
  amber: { name: '琥珀黑金', bg: '#15120e', paper: '#e8d7b9', accent: '#c99b4e', ink: '#f6ead5' },
  blueprint: { name: '蓝图纸', bg: '#e9eef4', paper: '#f7f9fc', accent: '#2c5d8a', ink: '#1c2b3a' },
  graphite: { name: '石墨信号', bg: '#15171a', paper: '#d9dde1', accent: '#8a939b', ink: '#f2f4f5' },
  celadon: { name: '青瓷白', bg: '#eef1e9', paper: '#f8f7ef', accent: '#7b9b86', ink: '#26332b' },
  crimson: { name: '绯墨剧场', bg: '#160d10', paper: '#f0dfd8', accent: '#b23a48', ink: '#f8e9e4' },
};

const RATIOS = {
  vertical: { label: '9:16', width: 1080, height: 1920 },
  landscape: { label: '16:9', width: 1920, height: 1080 },
  square: { label: '1:1', width: 1080, height: 1080 },
};

const title = opt('title', 'Untitled short');
const topic = opt('topic', 'A beat-synced short');
const rounds = Math.max(1, Math.min(Number(opt('rounds', 6)) || 6, 24));
const ratioId = opt('ratio', 'vertical');
const themeId = opt('theme', 'coral');
const ratio = RATIOS[ratioId] || RATIOS.vertical;
const theme = THEMES[themeId] || THEMES.coral;
const out = resolve(opt('out', 'short-plan.json'));
const fps = 30;
const opening = 3;
const roundSeconds = 4;
const ending = 3;
const duration = opening + rounds * roundSeconds + ending;

const timeline = [{ type: 'opening', start: 0, end: opening, name: 'Opening' }];
for (let i = 0; i < rounds; i += 1) {
  const start = opening + i * roundSeconds;
  timeline.push({
    type: 'round',
    round: i + 1,
    start,
    end: start + roundSeconds,
    card: {
      start,
      end: start + 1,
      label: `STYLE ${String(i + 1).padStart(2, '0')} / ${String(rounds).padStart(2, '0')}`,
    },
    style: {
      start: start + 1,
      end: start + roundSeconds,
      name: `Style ${String(i + 1).padStart(2, '0')}`,
    },
  });
}
timeline.push({ type: 'ending', start: opening + rounds * roundSeconds, end: duration, name: 'Ending' });

const plan = {
  version: 1,
  title,
  topic,
  format: { ...ratio, fps },
  duration,
  structure: { opening, rounds, roundSeconds, card: 1, style: 3, ending },
  theme: { id: THEMES[themeId] ? themeId : 'coral', ...theme },
  timeline,
  rules: [
    'Every frame is a pure function of t.',
    'Each round: 1s big card, then 3s style segment starting on the beat.',
    'No bottom subtitle bar; keep text inside the middle 80%.',
    'Render 5–6 stills per round, then a 1fps contact sheet, before full render.',
    'Full render is local and needs explicit approval.',
  ],
};

const md = `# ${title}

${topic}

## Format

- ${ratio.label} · ${ratio.width}×${ratio.height} · ${fps}fps
- ${duration}s = opening ${opening}s + ${rounds} × 4s + ending ${ending}s
- Theme: ${theme.name} (${plan.theme.id})
- Palette: bg ${theme.bg} · paper ${theme.paper} · accent ${theme.accent} · ink ${theme.ink}

## Rounds

| # | Card | Style segment |
|---|---|---|
${Array.from({ length: rounds }, (_, i) => {
  const start = opening + i * 4;
  return `| ${String(i + 1).padStart(2, '0')} | ${start.toFixed(1)}–${(start + 1).toFixed(1)}s | ${(start + 1).toFixed(1)}–${(start + 4).toFixed(1)}s |`;
}).join('\n')}

## Rules

${plan.rules.map((rule) => `- ${rule}`).join('\n')}
`;

await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify(plan, null, 2)}\n`);
await writeFile(out.replace(/\.json$/i, '.md'), md);
console.log(`short plan: ${out}`);
console.log(`  ${ratio.label} ${ratio.width}x${ratio.height} ${fps}fps / ${duration}s / ${rounds} rounds`);
console.log(`  theme: ${theme.name} (${plan.theme.id})`);
console.log(`  brief: ${out.replace(/\.json$/i, '.md')}`);
