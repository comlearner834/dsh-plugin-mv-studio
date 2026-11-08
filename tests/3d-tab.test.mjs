/**
 * Static render test for the optional 3D video room.
 *
 * It loads client.js with a tiny React shim, captures the registered Studio
 * component, walks its element tree, opens the 3D tab, and asserts that the
 * form submits the structured generate_video prompt.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'client.js');
const text = readFileSync(file, 'utf8');

function extract(name) {
  const match = text.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n    \\});`));
  if (!match) throw new Error(`missing locale ${name}`);
  return vm.runInNewContext(`(${match[1]})`);
}
const ZH = extract('ZH');

const stateQueue = [];
const React = {
  createElement(type, props, ...children) { return { type, props: props || {}, children }; },
  useState(initial) { return [stateQueue.length ? stateQueue.shift() : initial, () => {}]; },
  useEffect() {},
  useReducer(_reducer, initial) { return [initial, () => {}]; },
  useRef() { return { current: null }; },
};

let factoryResult = null;
globalThis.window = {
  __ModuleLoader__: {
    load(spec) {
      factoryResult = spec.factory((name) => {
        if (name === 'react') return React;
        throw new Error(`unexpected require: ${name}`);
      });
    },
  },
};

await import(`${pathToFileURL(file).href}?test=${Date.now()}`);
if (!factoryResult) throw new Error('client factory was not loaded');

let Studio = null;
const starts = [];
const ctx = {
  locale: {
    register() { return () => {}; },
    bind() { return (key) => ZH[key] ?? key; },
    subscribe() { return () => {}; },
  },
  effect(fn) { return fn(); },
  slots: {
    inject(_name, fn) { return fn(); },
    register(definition, component) {
      if (definition.name === 'main') Studio = component;
      return () => {};
    },
  },
  get() { return undefined; },
  uiWorkspace: {
    startSession(_id, options) { starts.push(options.prompt); return true; },
  },
};
factoryResult.apply(ctx);
if (typeof Studio !== 'function') throw new Error('MV Studio component not registered');

const nodes = [];
(function walk(node) {
  if (!node || typeof node !== 'object') return;
  nodes.push(node);
  for (const child of node.children || []) walk(child);
  if (node.props && node.props.children) walk(node.props.children);
})(Studio());

const tab = nodes.find((node) => node.type === 'button' && node.props?.id === 'pa-tab-3d');
const panel = nodes.find((node) => node.type === 'div' && node.props?.id === 'pa-panel-3d');
const formNode = nodes.find((node) => typeof node.type === 'function' && node.type.name === 'ThreeDForm');
if (!tab) throw new Error('3D tab is missing');
if (!panel) throw new Error('3D panel is missing');
if (!formNode) throw new Error('ThreeDForm is missing');
if (!nodes.some((node) => Array.isArray(node.children) && node.children.includes('3D视频区'))) {
  throw new Error('3D tab label is missing');
}

stateQueue.push(
  '雨夜城市，列车驶过，镜头俯冲到车窗',
  '5', 'standard', '1280x720', '24', 'city', 'dive',
  'D:\\music\\ambient.mp3', '', false,
);
const form = formNode.type(formNode.props);
const formNodes = [];
(function walkForm(node) {
  if (!node || typeof node !== 'object') return;
  formNodes.push(node);
  for (const child of node.children || []) walkForm(child);
})(form);
const submit = formNodes.find((node) => node.type === 'button' && node.props?.className === 'pa-primary');
if (!submit) throw new Error('3D submit button is missing');
submit.props.onClick();
if (!starts.length) throw new Error('startSession was not called');
const prompt = starts[0];
for (const needle of [
  'generate_video',
  '雨夜城市',
  'duration_seconds=5',
  'width=1280',
  'height=720',
  'fps=24',
  'quality=standard',
  'scene=city',
  'camera=dive',
  'audio_path=D:\\music\\ambient.mp3',
]) {
  if (!prompt.includes(needle)) throw new Error(`prompt missing ${needle}`);
}
console.log('OK 3D tab, panel, form and structured prompt');
console.log(prompt.split('\n').slice(0, 4).join('\n'));
