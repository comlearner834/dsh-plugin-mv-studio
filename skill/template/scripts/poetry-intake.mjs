#!/usr/bin/env node
/**
 * Build a one-shot-per-line poetry plan.
 *
 * The helper splits the poem, fixes one shot per line, adds a recitation
 * direction and a style-aware painting brief, and gives the agent a clear
 * schema to fill. It never calls an image or video model.
 *
 * Usage:
 *   node scripts/poetry-intake.mjs --project "D:/work/poem-mv" \
 *     --title "静夜思" --author "李白" --poem-file "poem.txt" --style ink
 *     --style custom --style-name "敦煌壁画" --style-brief "土红、石青、金线，壁画颗粒"
 *
 *   node scripts/poetry-intake.mjs --project ... --out poetry-plan.json --check
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);
const projectRoot = path.resolve(opt('project', process.cwd()));
const planPath = path.resolve(projectRoot, opt('out', 'poetry-plan.json'));
const styleId = String(opt('style', 'ink'));
const customStyleName = String(opt('style-name', '')).trim();
const customStyleBrief = String(opt('style-brief', '')).trim();
const splitMode = String(opt('split', 'line'));
const checkOnly = has('check');

const STYLES = {
  ink: {
    name: '国风水墨',
    prompt: '国风水墨，宣纸质地，墨分五色，大面积留白，边缘自然晕开，低饱和，安静诗意，不要现代字体与水印。',
  },
  bluegreen: {
    name: '青绿山水',
    prompt: '青绿山水，石青石绿与赭石，山峦层叠，云雾留白，细笔勾勒，矿物色清雅，不要高饱和霓虹。',
  },
  gongbi: {
    name: '淡彩工笔',
    prompt: '淡彩工笔，细线勾勒，花木与器物有工笔质感，颜色薄而柔，背景宣纸留白，安静克制。',
  },
  moon: {
    name: '月下冷调',
    prompt: '月色冷调，靛青与银白，薄雾，水面反光，极简留白，孤独而温柔，避免纯黑与纯白。',
  },
  autumn: {
    name: '秋山暖赭',
    prompt: '秋山暖赭，赭石、藤黄、淡墨，枯枝与远山，暖光从纸面透出，色调柔和，保留呼吸感。',
  },
};

const style = STYLES[styleId] || (customStyleBrief
  ? {
    name: customStyleName || '自定义风格',
    prompt: customStyleBrief,
  }
  : null);
if (!style) {
  console.error(
    `Unknown style "${styleId}". Use ${Object.keys(STYLES).join(', ')}, ` +
    'or pass --style custom --style-name "..." --style-brief "...".',
  );
  process.exit(1);
}

async function loadPlan() {
  if (!existsSync(planPath)) throw new Error(`Plan not found: ${planPath}`);
  return JSON.parse(await readFile(planPath, 'utf8'));
}

function validatePlan(plan) {
  const errors = [];
  if (!Array.isArray(plan.lines) || !plan.lines.length) errors.push('plan.lines is empty');
  for (const [i, line] of (plan.lines ?? []).entries()) {
    const at = `lines[${i}]`;
    if (!String(line.text ?? '').trim()) errors.push(`${at}.text is empty`);
    if (!String(line.recitation?.direction ?? '').trim()) errors.push(`${at}.recitation.direction is empty`);
    for (const key of ['imagery', 'action', 'camera', 'light', 'paintingPrompt']) {
      if (!String(line[key] ?? '').trim()) errors.push(`${at}.${key} is empty`);
    }
  }
  return errors;
}

if (checkOnly) {
  try {
    const plan = await loadPlan();
    const errors = validatePlan(plan);
    if (errors.length) {
      console.error(`Poetry plan needs work (${errors.length}):`);
      for (const error of errors) console.error(`  - ${error}`);
      process.exit(1);
    }
    console.log(`Poetry plan OK: ${plan.title || 'untitled'} / ${plan.lines.length} shots.`);
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

const title = String(opt('title', '')).trim();
const author = String(opt('author', '')).trim();
if (!title) {
  console.error('Missing --title (poem title).');
  process.exit(1);
}
const poemFile = opt('poem-file', null);
const poemInline = opt('poem', '');
const source = poemFile
  ? await readFile(path.resolve(poemFile), 'utf8')
  : String(poemInline || '');
if (!source.trim()) {
  console.error('Provide --poem-file <path> or --poem "第一句…"');
  process.exit(1);
}

function splitPoem(text, mode) {
  const clean = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  const paragraphs = clean.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (mode === 'line') return paragraphs;
  const marker = mode === 'comma' ? /([，。！？；])/ : /([。！？；])/;
  return paragraphs.flatMap((line) => {
    const parts = line.split(marker);
    const out = [];
    for (let i = 0; i < parts.length; i += 2) {
      const body = `${parts[i] ?? ''}${parts[i + 1] ?? ''}`.trim();
      if (body) out.push(body);
    }
    return out;
  });
}

const lines = splitPoem(source, splitMode)
  .map((line) => line.replace(/^\s*(?:\d+[.、]|[-·])\s*/, '').trim())
  .filter((line) => line.replace(/[，。！？；、\s]/g, '').length > 0);
if (!lines.length) {
  console.error('No poem lines found.');
  process.exit(1);
}

function direction(index, count) {
  if (index === 0) return '轻声起句，像怕惊动纸上的月色；逗号处短停，句尾不要急着收。';
  if (index === count - 1) return '气息放低，速度再慢一点；尾字放轻，留半拍再停。';
  return '声音压低，句尾略沉；到关键词时轻轻抬起，再落回安静。';
}

const planLines = lines.map((text, index) => {
  const plain = text.replace(/[，。！？；、]/g, '');
  const durationSec = Math.round((Math.max(3.2, plain.length * 0.46 + 1.0)) * 10) / 10;
  return {
    index: index + 1,
    text,
    recitation: {
      text,
      direction: direction(index, lines.length),
      wav: null,
      durationSec,
    },
    imagery: '',
    action: '',
    camera: '缓慢轻推或横移；镜头只做一件事，留出呼吸。',
    light: '柔光、低对比，亮部不过曝，暗部保留纸的纹理。',
    paintingPrompt: `${style.prompt} 主题：${title}${author ? `（${author}）` : ''}。诗句：「${text}」。` +
      (styleId === 'custom' ? '画面只表达这句诗，不要文字水印。' : '画面只表达这句诗，留白大于实体，不要文字水印。'),
    durationSec,
  };
});
const total = Math.round(planLines.reduce((sum, line) => sum + line.durationSec, 0) * 10) / 10;

const plan = {
  version: 1,
  mode: 'poetry',
  title,
  author: author || null,
  style: styleId,
  styleName: style.name,
  source,
  split: splitMode,
  totalDurationSec: total,
  createdAt: new Date().toISOString(),
  lines: planLines,
};

await mkdir(path.dirname(planPath), { recursive: true });
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);

const projectFile = path.join(projectRoot, 'project.json');
if (existsSync(projectFile)) {
  const project = JSON.parse(await readFile(projectFile, 'utf8'));
  project.poetry = {
    title,
    author: author || null,
    style: styleId,
    styleName: style.name,
    plan: path.relative(projectRoot, planPath).replaceAll('\\', '/'),
    lineCount: planLines.length,
    totalDurationSec: total,
    createdAt: plan.createdAt,
  };
  await writeFile(projectFile, `${JSON.stringify(project, null, 2)}\n`);
}

const briefPath = path.join(path.dirname(planPath), 'poetry-brief.md');
const rows = planLines.map((line) => `| ${line.index} | ${line.text} | ${line.recitation.direction} |  |  |  |  |  |`);
const brief = `# ${title}${author ? ` · ${author}` : ''}\n\n`
  + `风格：${style.name}（${styleId}）\n\n`
  + `一句一个镜头，共 ${planLines.length} 个镜头。\n\n`
  + `| # | 诗句 | 朗诵表演提示 | 画面意境 | 动态动作 | 镜头运镜 | 光影氛围 | 绘画提示词 |\n`
  + `|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n`
  + `把空列补成可执行的画面指令，写入 \`${path.basename(planPath)}\`，再运行：\n\n`
  + `node scripts/poetry-intake.mjs --project "${projectRoot}" --out "${path.basename(planPath)}" --check\n\n`
  + `然后按这个 plan 建 project.shots；镜头时长先用 durationSec，生成朗诵后按实际音频更新。\n`;
await writeFile(briefPath, brief);

console.log(`poetry plan: ${planPath}`);
console.log(`brief:       ${briefPath}`);
console.log(`style:       ${style.name}`);
console.log(`${planLines.length} lines / ${total}s (estimated)`);
for (const line of planLines) console.log(`  ${String(line.index).padStart(2, '0')}  ${line.text}`);
console.log('\nFill imagery/action/camera/light, then run --check.');
