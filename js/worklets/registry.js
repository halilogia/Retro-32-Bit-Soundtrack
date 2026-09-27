const REGISTRY = Object.freeze({
  './noise-processor.js': 'retro-noise',
  './crush-processor.js': 'retro-crush'
});

const INLINE = (typeof globalThis !== 'undefined' && globalThis.__RETRO_WORKLETS__) || {};

export const PROCESSOR_FILES = Object.keys(REGISTRY);

async function readSource(file) {
  if (typeof INLINE[file] === 'string') return INLINE[file];
  const response = await fetch(new URL(file, import.meta.url), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${file} yüklenemedi (HTTP ${response.status})`);
  return response.text();
}

export async function loadProcessors(context) {
  const loaded = new Set();
  if (!context || !context.audioWorklet) return loaded;
  for (const file of PROCESSOR_FILES) {
    try {
      const source = await readSource(file);
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      try {
        await context.audioWorklet.addModule(url);
        loaded.add(REGISTRY[file]);
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.warn('AudioWorklet atlandı:', file, error && error.message ? error.message : error);
    }
  }
  return loaded;
}
