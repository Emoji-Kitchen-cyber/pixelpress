const CACHE_NAME = 'pixelpress-cache-v1';

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
// This ensures users always get the freshest live version from Vercel if internet is on!
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If internet is working, return fresh data and silently update cache
        return caches.open(CACHE_NAME).then(cache => {
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // If user is offline, give them the cached version (Bulletproof offline mode)
        return caches.match(event.request);
      })
  );
});
