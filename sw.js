const CACHE_NAME = 'ai-hub-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.iconscout.com/icon/free/png-192/ai-3600893-3007881.png',
  'https://cdn.iconscout.com/icon/free/png-256/ai-3600893-3007881.png',
  'https://cdn.iconscout.com/icon/free/png-512/ai-3600893-3007881.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files for offline use');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache files:', err);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// استجابة للطلبات
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // لا تخزن طلبات Google Fonts بشكل متكرر
  if (event.request.url.includes('fonts.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // تخزين النسخة الجديدة في الذاكرة المؤقتة
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('Cached new file:', event.request.url);
              });
            
            return response;
          })
          .catch(() => {
            // في حالة عدم الاتصال، أُرجع الصفحة الرئيسية
            return caches.match('/');
          });
      })
  );
});

// رسائل من الصفحة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
