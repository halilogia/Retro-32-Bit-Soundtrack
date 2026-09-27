const CACHE = 'retro32-v2.0.0';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/main.css',
  './js/main.js',
  './js/core/composer.js',
  './js/core/engine.js',
  './js/core/effects.js',
  './js/core/genres.js',
  './js/core/instruments.js',
  './js/core/mixer-state.js',
  './js/core/theory.js',
  './js/io/download.js',
  './js/io/midi.js',
  './js/io/presets.js',
  './js/io/recorder.js',
  './js/ui/controls.js',
  './js/ui/mixer-ui.js',
  './js/ui/presets-ui.js',
  './js/ui/visualizer.js',
  './js/worklets/crush-processor.js',
  './js/worklets/noise-processor.js',
  './js/worklets/registry.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    cache.put(request, response.clone());
  }
  return response;
}

async function navigationHandler(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(request)) || (await cache.match('./index.html'));
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
