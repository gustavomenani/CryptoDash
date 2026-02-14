/* CryptoDash Service Worker */
const CACHE_NAME = 'cryptodash-cache';
const ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isGetRequest = e.request.method === 'GET';

  // Only handle same-origin requests — let cross-origin (CORS proxies) pass through
  if (url.origin !== self.location.origin) return;

  const safeCachePut = async (request, response) => {
    if (!isGetRequest || !response || response.bodyUsed) return;
    try {
      const responseToCache = response.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseToCache);
    } catch {
      // Ignore cache write errors to avoid breaking responses
    }
  };

  // Network-first for API calls (including proxy and external)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('coingecko.com') || url.hostname.includes('alternative.me')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          void safeCachePut(e.request, res);
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Stale-while-revalidate for static assets
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(networkResponse => {
          void safeCachePut(e.request, networkResponse);
          return networkResponse;
        });
        return cached || fetchPromise;
      })
    );
  }
});
