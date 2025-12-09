// Service Worker مبسط
const CACHE_NAME = 'ai-hub-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        '/AI-hub-offline/',
        '/AI-hub-offline/index.html',
        '/AI-hub-offline/manifest.json',
        '/AI-hub-offline/css/style.css',
        '/AI-hub-offline/js/app.js'
      ]))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});