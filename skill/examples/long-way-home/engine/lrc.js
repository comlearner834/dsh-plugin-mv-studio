/**
 * LRC parsing and lookup.
 *
 * Supports plain LRC, multiple timestamps per line, the [offset:] tag,
 * and enhanced LRC word tags (<mm:ss.xx>). Times are seconds in song time.
 * This module is shared by Node (render.mjs) and the browser (engine.js).
 */

const TIME_TAG = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const META_TAG = /^\[([a-zA-Z][\w-]*):(.*)\]$/;
const WORD_TAG = /<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>/g;

const toSeconds = (minutes, seconds, fraction = '0') => {
  const f = Number(`0.${fraction.padEnd(3, '0').slice(0, 3)}`);
  return Number(minutes) * 60 + Number(seconds) + f;
};

export function parseLrc(text, options = {}) {
  const explicitOffset = Number(options.offsetMs ?? 0);
  const meta = {};
  const lines = [];
  let fileOffset = 0;

  for (const rawLine of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const metaMatch = trimmed.match(META_TAG);
    if (metaMatch && !/^\d+$/.test(metaMatch[1])) {
      const key = metaMatch[1].toLowerCase();
      meta[key] = metaMatch[2].trim();
      if (key === 'offset') {
        const parsed = Number(metaMatch[2].trim());
        if (Number.isFinite(parsed)) fileOffset = parsed;
      }
      continue;
    }

    const stamps = [];
    TIME_TAG.lastIndex = 0;
    let match;
    let contentStart = 0;
    while ((match = TIME_TAG.exec(trimmed))) {
      if (match.index !== contentStart) break;
      stamps.push(toSeconds(match[1], match[2], match[3]));
      contentStart = TIME_TAG.lastIndex;
    }
    if (!stamps.length) continue;

    const content = trimmed.slice(contentStart).trim();
    const words = [];
    let cursor = 0;
    let current = null;
    WORD_TAG.lastIndex = 0;
    let wordMatch;
    while ((wordMatch = WORD_TAG.exec(content))) {
      const before = content.slice(cursor, wordMatch.index);
      if (current) current.text += before;
      else if (before) words.push({ time: null, text: before });
      current = {
        time: toSeconds(wordMatch[1], wordMatch[2], wordMatch[3]),
        text: '',
      };
      words.push(current);
      cursor = WORD_TAG.lastIndex;
    }
    const tail = content.slice(cursor);
    if (current) current.text += tail;
    else if (tail) words.push({ time: null, text: tail });

    const plain = content.replace(WORD_TAG, '').trim();
    for (const time of stamps) {
      lines.push({
        time: 0,
        text: plain,
        words: words.map((word) => ({ ...word })),
        rawTime: time,
      });
    }
  }

  const shift = (explicitOffset + fileOffset) / 1000;
  for (const line of lines) {
    line.time = Math.max(0, line.rawTime + shift);
    delete line.rawTime;
    line.words = line.words.map((w) => ({
      ...w,
      time: w.time === null ? null : Math.max(0, w.time + shift),
    }));
  }
  lines.sort((a, b) => a.time - b.time || a.text.localeCompare(b.text));

  return { meta, lines, offsetMs: explicitOffset + fileOffset };
}

export function lyricAt(parsed, timeSec, options = {}) {
  const lines = parsed?.lines ?? [];
  const maxHold = Number(options.maxHold ?? 7);
  if (!lines.length) return null;
  const t = Number(timeSec);
  if (!Number.isFinite(t)) return null;

  let index = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].time <= t + 1e-6) index = i;
    else break;
  }
  if (index < 0) return null;

  const line = lines[index];
  const next = lines[index + 1] ?? null;
  const naturalEnd = next ? next.time : Number(options.endTime) || line.time + Math.max(2.4, maxHold);
  const end = Math.min(naturalEnd, line.time + maxHold);
  if (t >= end) return null;

  const span = Math.max(0.2, end - line.time);
  const progress = Math.min(1, Math.max(0, (t - line.time) / span));
  const fadeIn = Math.min(1, Math.max(0, (t - line.time) / 0.28));
  const fadeOut = Math.min(1, Math.max(0, (end - t) / 0.34));
  const alpha = Math.min(fadeIn, fadeOut);

  let wordIndex = -1;
  let wordProgress = progress;
  if (line.words.length) {
    for (let i = 0; i < line.words.length; i += 1) {
      if (line.words[i].time !== null && line.words[i].time <= t + 1e-6) wordIndex = i;
    }
    if (wordIndex >= 0) {
      const current = line.words[wordIndex];
      const nextWord = line.words[wordIndex + 1];
      const wordEnd = nextWord?.time ?? end;
      wordProgress = Math.min(
        1,
        Math.max(0, (t - (current.time ?? line.time)) / Math.max(0.08, wordEnd - (current.time ?? line.time))),
      );
    }
  }

  return {
    index,
    count: lines.length,
    line,
    next,
    start: line.time,
    end,
    progress,
    alpha,
    wordIndex,
    wordProgress,
    text: line.text,
    before: lines.slice(0, index).map((l) => l.text),
  };
}

export function toSrt(parsed, options = {}) {
  const lines = parsed?.lines ?? [];
  const offset = Number(options.offsetSec ?? 0);
  const endTime = Number(options.endTime ?? Infinity);
  const stamp = (sec) => {
    const ms = Math.max(0, Math.round(sec * 1000));
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
  };
  return lines
    .map((line, i) => {
      const next = lines[i + 1];
      const start = Math.max(0, line.time + offset);
      const naturalEnd = next ? next.time + offset : line.time + offset + 5;
      const end = Math.max(start + 0.35, Math.min(naturalEnd, endTime));
      return `${i + 1}\n${stamp(start)} --> ${stamp(end)}\n${line.text}\n`;
    })
    .join('\n');
}
