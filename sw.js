const CACHE_NAME = 'pixelpress-cache-v2';

// Install Event - Forces the new service worker to take over immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  console.log('[Service Worker] Installed & Ready');
});

// Activate Event - Cleans up any old caches so users always get your latest code
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event - "Network First, Falling back to Cache" Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If network works, serve fresh content and update cache silently
        return caches.open(CACHE_NAME).then(cache => {
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // If user is offline, fall back to the secure local cache
        return caches.match(event.request);
      })
  );
});
