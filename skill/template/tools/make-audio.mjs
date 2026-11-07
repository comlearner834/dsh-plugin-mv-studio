#!/usr/bin/env node
/**
 * Generate an original, deterministic ambient cue for the demo.
 * This is synthesis, not audio generation from a model.
 *
 * Usage:
 *   node tools/make-audio.mjs --out audio/long-way-home.wav --duration 12 --seed 7
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const out = path.resolve(opt('out', 'audio/demo.wav'));
const duration = Math.max(3, Number(opt('duration', 12)));
const seed = Number(opt('seed', 7));
const sampleRate = 44100;
const channels = 2;

function rng(initial) {
  let s = initial >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const random = rng(seed);
const noise = () => random() * 2 - 1;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const chords = [
  { root: 50, notes: [62, 66, 69, 73], name: 'Dmaj7' },
  { root: 47, notes: [59, 62, 66, 69], name: 'Bm7' },
  { root: 43, notes: [55, 59, 62, 66], name: 'Gmaj7' },
  { root: 45, notes: [57, 61, 64, 67], name: 'A7' },
];
const melody = [74, 78, 81, 78, 73, 76, 78, 74, 69, 73, 76, 73];

const total = Math.ceil(duration * sampleRate);
const left = new Float32Array(total);
const right = new Float32Array(total);
const delayL = new Float32Array(total);
const delayR = new Float32Array(total);

const add = (i, v, pan = 0) => {
  if (i < 0 || i >= total) return;
  const l = Math.sqrt((1 - pan) * 0.5);
  const r = Math.sqrt((1 + pan) * 0.5);
  left[i] += v * l;
  right[i] += v * r;
};

const env = (t, attack, decay, sustain, release, gate) => {
  if (t < 0 || t > gate + release) return 0;
  if (t < attack) return t / attack;
  if (t < attack + decay) {
    const k = (t - attack) / decay;
    return 1 - (1 - sustain) * k;
  }
  if (t < gate) return sustain;
  return sustain * Math.max(0, 1 - (t - gate) / release);
};

// Pads: each chord lasts one bar, four bars per cycle.
const bar = duration / Math.ceil(duration / 3);
for (let c = 0; c < Math.ceil(duration / bar); c += 1) {
  const chord = chords[c % chords.length];
  const start = c * bar;
  for (const note of chord.notes) {
    const freq = midi(note);
    for (let j = 0; j < total; j += 1) {
      const t = j / sampleRate - start;
      if (t < 0 || t > bar + 1.6) continue;
      const e = env(t, 1.2, 0.8, 0.72, 1.6, bar);
      if (e <= 0) continue;
      const vib = 1 + 0.0016 * Math.sin(2 * Math.PI * 0.17 * t + note);
      const w =
        Math.sin(2 * Math.PI * freq * vib * t) * 0.52 +
        Math.sin(2 * Math.PI * freq * 2.002 * t) * 0.12 +
        Math.sin(2 * Math.PI * freq * 0.501 * t) * 0.08;
      add(j, w * e * 0.026, (note - 64) / 40);
    }
  }
  // Low root, felt more than heard.
  const rootFreq = midi(chord.root - 12);
  for (let j = 0; j < total; j += 1) {
    const t = j / sampleRate - start;
    if (t < 0 || t > bar + 1.2) continue;
    const e = env(t, 0.9, 1.2, 0.65, 1.2, bar);
    add(j, Math.sin(2 * Math.PI * rootFreq * t) * e * 0.035, 0);
  }
}

// Plucked melody with a soft pick and a long room.
const step = duration / melody.length;
for (let m = 0; m < melody.length; m += 1) {
  const start = m * step + 0.08;
  const freq = midi(melody[m]);
  const pan = -0.35 + 0.7 * ((m * 7) % 11) / 10;
  for (let j = 0; j < total; j += 1) {
    const t = j / sampleRate - start;
    if (t < 0 || t > 3.2) continue;
    const e = Math.exp(-t * 2.1) * (1 - Math.exp(-t * 90));
    const w =
      Math.sin(2 * Math.PI * freq * t) * 0.55 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.18 +
      Math.sin(2 * Math.PI * freq * 3.01 * t) * 0.06;
    add(j, w * e * 0.06, pan);
    // delay taps
    const d1 = j + Math.round(0.31 * sampleRate);
    const d2 = j + Math.round(0.62 * sampleRate);
    if (d1 < total) {
      delayL[d1] += w * e * 0.018 * (1 - pan);
      delayR[d1] += w * e * 0.018 * (1 + pan);
    }
    if (d2 < total) {
      delayL[d2] += w * e * 0.009 * (1 - pan);
      delayR[d2] += w * e * 0.009 * (1 + pan);
    }
  }
}

// Paper hiss and a little crackle.
let lp = 0;
for (let j = 0; j < total; j += 1) {
  const t = j / sampleRate;
  const n = noise();
  lp += (n - lp) * 0.02;
  const bed = lp * 0.012 + n * 0.0025;
  const fade = Math.min(1, t / 1.2) * Math.min(1, Math.max(0, (duration - t) / 1.8));
  add(j, bed * fade, Math.sin(t * 0.11) * 0.25);
  if (random() < 0.00035) {
    const amp = 0.018 * random();
    for (let k = 0; k < 90; k += 1) add(j + k, amp * Math.exp(-k / 24) * noise(), 0.2 * noise());
  }
}

// Mix delay, gentle stereo width, soft clip, normalize.
let peak = 0;
for (let j = 0; j < total; j += 1) {
  left[j] += delayL[j] * 0.9;
  right[j] += delayR[j] * 0.9;
  const side = (left[j] - right[j]) * 0.08;
  left[j] -= side;
  right[j] += side;
  left[j] = Math.tanh(left[j] * 1.4) * 0.9;
  right[j] = Math.tanh(right[j] * 1.4) * 0.9;
  peak = Math.max(peak, Math.abs(left[j]), Math.abs(right[j]));
}
const gain = peak > 0 ? 0.86 / peak : 1;

const bytes = 44 + total * channels * 2;
const buffer = Buffer.alloc(bytes);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(bytes - 8, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channels * 2, 28);
buffer.writeUInt16LE(channels * 2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(total * channels * 2, 40);
let offset = 44;
for (let j = 0; j < total; j += 1) {
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[j] * gain * 32767))), offset);
  offset += 2;
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[j] * gain * 32767))), offset);
  offset += 2;
}

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, buffer);
console.log(JSON.stringify({ ok: true, out, duration, sampleRate, channels, bytes }, null, 2));
