const CACHE_NAME = 'pixelpress-v6'; // Updated version for 5+ tools integration

const ASSETS = [
  '/',
  '/index.html',
  '/photo-editor.html',
  '/compress.html',
  '/resize.html',
  '/crop.html',
  '/convert.html',
  '/watermark.html',
  '/css/style.css',
  '/js/common.js',
  '/js/compress.js',
  '/js/resize.js',
  '/js/crop.js',
  '/js/convert.js',
  '/js/watermark.js',
  '/manifest.json'
];

// Install Event - Caching Assets
self.addEventListener('install', e => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("Cache addAll info: single asset update skip"));
    })
  );
});

// Activate Event - Clean up old caches (Long-term Solution)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});

// Fetch Event - Network First falling back to Cache (Ensures updates are live)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200 && e.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request).then(r => r)) 
  );
});
