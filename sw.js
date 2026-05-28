const CACHE_NAME = 'pixelpress-prod-v1';

// Sirf static assets ko cache karenge, HTML/Routes ko nahi taaki 404 kabhi na aaye
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // PRODUCTION STRATEGY: Agar user kisi link/page par click kar raha hai (Navigation)
  // toh use cache se nahi, hamesha live server (Vercel) se load karo taaki clean URLs aur routing break na ho.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Agar internet bilkul band hai (Offline), tabhi cache se homepage do
        return caches.match('/');
      })
    );
    return;
  }

  // Baki saare assets (CSS, JS, Images) ke liye standard Network-First strategy
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});


