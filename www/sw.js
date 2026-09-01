const CACHE = 'shopithread-my-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/ai.js',
  './js/sync.js',
  './js/views/products.js',
  './js/views/studio.js',
  './js/views/queue.js',
  './js/views/accounts.js',
  './js/views/settings.js',
  './vendor/market-config.js',
  './vendor/constants.js',
  './vendor/threads-content-service.js',
  './vendor/spintax.js',
  './vendor/csv-service.js',
  './icons/icon32.png',
  './icons/icon48.png',
  './icons/icon192.png',
  './icons/icon512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
