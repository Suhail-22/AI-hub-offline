const CACHE_NAME = 'ai-hub-v8';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.iconscout.com/icon/free/png-192/ai-3600893-3007881.png',
  'https://cdn.iconscout.com/icon/free/png-512/ai-3600893-3007881.png',
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
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
    .then(() => self.clients.claim())
  );
});

// دعم تخزين النماذج الكبيرة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MODEL') {
    caches.open(CACHE_NAME).then(cache => {
      cache.put(event.data.url, new Response(event.data.data));
    });
  }
});
