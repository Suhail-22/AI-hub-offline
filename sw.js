const CACHE_NAME = 'ai-hub-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.iconscout.com/icon/free/png-256/ai-3600893-3007881.png'
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('فشل تخزين الملفات:', err);
      })
  );
});

// استجابة للطلبات
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // إذا وُجدت نسخة مخبأة، أُرجعها
        if (cachedResponse) {
          return cachedResponse;
        }

        // إذا لم تُوجد، أُعيد الطلب (مع تخزين النتيجة للمستقبل)
        return fetch(event.request)
          .then((response) => {
            // تأكد أن الاستجابة صالحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // افتح الذاكرة المؤقتة واحفظ الاستجابة الجديدة
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // في حالة عدم الاتصال، أُرجع صفحة index.html كحل بديل
            return caches.match('/');
          });
      })
  );
});

// تفعيل Service Worker الجديد
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
