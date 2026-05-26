const CACHE_NAME = 'pixelpress-v1';
const urlsToCache = ['/', '/css/style.css', '/js/app.js', '/js/auth.js', ...];

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
));
self.addEventListener('fetch', event => event.respondWith(
  caches.match(event.request).then(resp => resp || fetch(event.request))
));