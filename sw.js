const CACHE_NAME = 'pixelpress-v7'; // Updated version for PDF tools integration

const ASSETS = [
  '/',
  '/index.html',
  '/photo-editor.html',
  '/compress.html',
  '/resize.html',
  '/convert.html',
  '/watermark.html',
  '/pdf-to-jpg.html',
  '/jpg-to-pdf.html',
  '/css/style.css',
  '/js/common.js',
  '/js/compress.js',
  '/js/resize.js',
  '/js/convert.js',
  '/js/watermark.js',
  '/js/pdf-to-jpg.js',
  '/js/jpg-to-pdf.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("Cache listing safe update"));
    })
  );
});

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

