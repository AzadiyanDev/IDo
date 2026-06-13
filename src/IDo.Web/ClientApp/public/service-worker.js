const CACHE_NAME = 'ido-pwa-v20260613-startup-recovery';
const CORE_ASSETS = [
  '/index.html',
  '/manifest.webmanifest',
  '/icons/ido-icon-192.png',
  '/icons/ido-icon-512.png'
];
const NETWORK_TIMEOUT_MS = 4500;
const CACHEABLE_ASSET = /\.(?:css|js|mjs|json|webmanifest|png|jpe?g|webp|gif|svg|ico|ttf|otf|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE_ASSETS.map(async (asset) => {
      const response = await fetch(asset, { cache: 'reload' });
      if (response.ok) await cache.put(asset, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys())
      .filter((key) => key !== CACHE_NAME)
      .map((key) => caches.delete(key)));

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (shouldBypass(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html', { cache: 'no-store' }, event));
    return;
  }

  if (!isCacheableAsset(request, url)) return;

  if (request.destination === 'script' || request.destination === 'style' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirst(request, request, {}, event));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, event));
});

function shouldBypass(url) {
  return url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/hubs/')
    || url.pathname === '/service-worker.js'
    || url.pathname === '/version.json';
}

function isCacheableAsset(request, url) {
  return ['font', 'image', 'manifest', 'script', 'style'].includes(request.destination)
    || CACHEABLE_ASSET.test(url.pathname);
}

async function networkFirst(request, fallbackKey, fetchOptions = {}, event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const preload = event?.preloadResponse ? await event.preloadResponse : null;
    const response = preload || await fetchWithTimeout(request, fetchOptions);
    if (response.ok) await cache.put(fallbackKey, response.clone());
    return response;
  } catch {
    const cached = await cache.match(fallbackKey);
    if (cached) return cached;
    return Response.error();
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }

  return await refresh || Response.error();
}

function fetchWithTimeout(request, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  return fetch(request, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}
