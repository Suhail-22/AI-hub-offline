// ===== Service Worker بسيط =====
const CACHE_NAME = 'ai-hub-v2';
const urlsToCache = [
  '/AI-hub-offline/',
  '/AI-hub-offline/index.html',
  '/AI-hub-offline/css/style.css',
  '/AI-hub-offline/js/app.js',
  '/AI-hub-offline/js/config.js',
  '/AI-hub-offline/js/storage.js',
  '/AI-hub-offline/js/models.js',
  '/AI-hub-offline/js/ui.js',
  '/AI-hub-offline/js/chat.js',
  '/AI-hub-offline/js/pwa.js',
  '/AI-hub-offline/manifest.json'
];

// التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// التنشيط
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
    })
  );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});