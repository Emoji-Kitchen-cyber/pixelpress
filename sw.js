const CACHE_NAME = 'pixelpress-cache-v3'; // Incremented to v3 to completely destroy the v1/v2 loop

// Assets to cache for offline availability
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/faq.html',
  '/privacy-policy.html',
  '/terms.html',
  '/disclaimer.html',
  '/blog/index.html',
  '/manifest.json'
];

// Install Event - Cache initial core files and force activation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Deletes the old cache immediately and claims control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache storage:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Forces immediate control without reload
  );
});

// Fetch Event - Network First with automatic cache fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If network is online, clone response into cache
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline or network fails, fall back to cache
        return caches.match(event.request);
      })
  );
});