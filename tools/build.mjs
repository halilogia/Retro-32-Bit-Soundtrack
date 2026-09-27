import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'dist');
const OUT_FILE = join(OUT_DIR, 'retro-synth-standalone.html');
const ENTRY = 'js/main.js';
const WORKLET_DIR = 'js/worklets';
const WORKLET_FILES = ['./noise-processor.js', './crush-processor.js'];

const modules = new Map();

function toId(absolutePath) {
  return relative(ROOT, absolutePath).split(sep).join('/');
}

function resolveSpecifier(specifier, fromId) {
  if (!specifier.startsWith('.')) {
    throw new Error(`Harici bağımlılık desteklenmiyor: ${specifier} (${fromId})`);
  }
  return toId(resolve(ROOT, dirname(fromId), specifier));
}

function transform(code, id) {
  const exports = new Set();
  const dependencies = new Set();

  let body = code.replace(
    /^import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm,
    (match, names, specifier) => {
      const target = resolveSpecifier(specifier, id);
      dependencies.add(target);
      return `const {${names.replace(/\s+/g, ' ').trim()}} = __req('${target}');`;
    }
  );

  body = body.replace(
    /^import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm,
    (match, name, specifier) => {
      const target = resolveSpecifier(specifier, id);
      dependencies.add(target);
      return `const ${name} = __req('${target}');`;
    }
  );

  body = body.replace(/^import\s+['"]([^'"]+)['"];?[ \t]*$/gm, (match, specifier) => {
    const target = resolveSpecifier(specifier, id);
    dependencies.add(target);
    return `__req('${target}');`;
  });

  body = body.replace(
    /^export\s+(const|let|var|function|class|async\s+function)\s+([A-Za-z_$][\w$]*)/gm,
    (match, keyword, name) => {
      exports.add(name);
      return `${keyword} ${name}`;
    }
  );

  body = body.replace(/^export\s*\{([^}]*)\}\s*;?[ \t]*$/gm, (match, list) => {
    for (const entry of list.split(',')) {
      const parts = entry.split(/\s+as\s+/);
      const name = (parts[1] || parts[0]).trim();
      if (name) exports.add(name);
    }
    return '';
  });

  body = body.replace(/import\.meta\.url/g, 'location.href');

  const leftover = body.match(/^\s*(import|export)\s/gm);
  if (leftover) {
    throw new Error(`${id} içinde dönüştürülemeyen modül ifadesi: ${leftover[0].trim()}`);
  }

  const footer = [...exports].map((name) => `__exports.${name} = ${name};`).join('\n');
  return { body, dependencies, footer };
}

function load(id) {
  if (modules.has(id)) return;
  const absolute = join(ROOT, id);
  const source = readFileSync(absolute, 'utf8');
  const { body, dependencies, footer } = transform(source, id);
  for (const dependency of dependencies) load(dependency);
  modules.set(id, `__def('${id}', function (__exports, __req) {\n${body}\n${footer}\n});`);
}

function workletPreamble() {
  const entries = WORKLET_FILES.map((file) => {
    const source = readFileSync(join(ROOT, WORKLET_DIR, file.replace('./', '')), 'utf8');
    return `  ${JSON.stringify(file)}: ${JSON.stringify(source)}`;
  });
  return `globalThis.__RETRO_STANDALONE__ = true;\nglobalThis.__RETRO_WORKLETS__ = {\n${entries.join(',\n')}\n};`;
}

function buildBundle() {
  load(ENTRY);
  const definitions = [...modules.values()].join('\n\n');
  return `(function () {\n'use strict';\n${workletPreamble()}\n\nconst __factories = Object.create(null);\nconst __cache = Object.create(null);\n\nfunction __def(id, factory) {\n  __factories[id] = factory;\n}\n\nfunction __req(id) {\n  if (id in __cache) return __cache[id];\n  const factory = __factories[id];\n  if (!factory) throw new Error('Modul bulunamadi: ' + id);\n  const exports = {};\n  __cache[id] = exports;\n  factory(exports, __req);\n  return exports;\n}\n\n${definitions}\n\n__req('${ENTRY}');\n})();\n`;
}

function inlineStyles(html) {
  return html.replace(
    /<link rel="stylesheet" href="\.\/css\/main\.css">\n?/,
    (match) => `<style>\n${readFileSync(join(ROOT, 'css', 'main.css'), 'utf8')}\n</style>\n`
  );
}

function inlineScript(html, bundle) {
  return html.replace(
    /<script type="module" src="\.\/js\/main\.js"><\/script>/,
    `<script>\n${bundle}</script>`
  );
}

function inlineIcon(html) {
  const svg = readFileSync(join(ROOT, 'assets', 'icon.svg'), 'utf8');
  const href = `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
  return html
    .replace(/<link rel="manifest"[^>]*>\n?/, '')
    .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '')
    .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${href}">`);
}

const source = readFileSync(join(ROOT, 'index.html'), 'utf8');
const bundle = buildBundle();
let html = inlineStyles(source);
html = inlineScript(html, bundle);
html = inlineIcon(html);

if (html.includes('type="module"') || html.includes('href="./css/') || html.includes('src="./js/')) {
  throw new Error('Paketleme tamamlanamadı: harici stil veya modul etiketi kaldı.');
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html, 'utf8');

console.log(`dist/retro-synth-standalone.html (${modules.size} modul, ${(html.length / 1024).toFixed(1)} KB)`);
