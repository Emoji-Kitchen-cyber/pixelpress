const CACHE_NAME = 'pixelpress-cache-v4'; // Incremented to v4 to destroy previous loops completely

// Assets to cache including clean URLs
const ASSETS_TO_CACHE = [
  '/',
  '/index',
  '/index.html',
  '/about',
  '/about.html',
  '/contact',
  '/contact.html',
  '/faq',
  '/faq.html',
  '/privacy-policy',
  '/privacy-policy.html',
  '/terms',
  '/terms.html',
  '/disclaimer',
  '/disclaimer.html',
  '/compress',
  '/compress.html',
  '/photo-editor',
  '/photo-editor.html',
  '/resize',
  '/resize.html',
  '/convert',
  '/convert.html',
  '/watermark',
  '/watermark.html',
  '/blur-face',
  '/blur-face.html',
  '/remove-bg',
  '/remove-bg.html',
  '/jpg-to-pdf',
  '/jpg-to-pdf.html',
  '/pdf-to-jpg',
  '/pdf-to-jpg.html',
  '/meme-generator',
  '/meme-generator.html',
  '/blog/',
  '/blog/index.html',
  '/manifest.json'
];

// Install Event - Cache initial core files and force activation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching core assets');
      // Using setting that doesn't fail if one file is missing temporarily
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.log('Failed to cache:', url, err)))
      );
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First Strategy with strict falling back
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Ignore browser extensions or external ad requests to prevent crashes
  if (!event.request.url.startsWith(self.location.origin)) return;

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
        // If network fails (Offline mode), try to find exact match or extension fallback
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // Try adding .html fallback logically in cache
          const urlObj = new URL(event.request.url);
          if (!urlObj.pathname.endsWith('/') && !urlObj.pathname.includes('.')) {
            return caches.match(urlObj.pathname + '.html');
          }
        });
      })
  );
});

