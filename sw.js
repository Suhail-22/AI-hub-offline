[file name]: sw.js
[file content begin]
// Service Worker متقدم للتطبيق
const CACHE_NAME = 'ai-hub-v2.0.0';
const OFFLINE_CACHE = 'ai-hub-offline-v1';

// الملفات الأساسية التي يجب تخزينها
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app-simple.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// الملفات الخارجية
const EXTERNAL_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: التثبيت');
  
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الأساسية
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(APP_SHELL)),
      
      // تخزين الموارد الخارجية
      caches.open(OFFLINE_CACHE)
        .then(cache => cache.addAll(EXTERNAL_RESOURCES))
    ])
    .then(() => {
      console.log('✅ جميع الملفات مخزنة في الكاش');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('❌ خطأ في التثبيت:', error);
    })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: التفعيل');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // حذف الكاش القديم
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log(`🗑️ حذف الكاش القديم: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker مفعل وجاهز');
      return self.clients.claim();
    })
  );
});

// معالجة الطلبات
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات POST وطلبات غير HTTP/HTTPS
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 1. أولاً: عرض من الكاش
        if (cachedResponse) {
          console.log(`📦 طلب من الكاش: ${event.request.url}`);
          return cachedResponse;
        }

        // 2. ثانياً: جلب من الشبكة
        return fetch(event.request)
          .then((networkResponse) => {
            // إذا كان الطلب ناجحاً، خزنه في الكاش
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log(`💾 تم تخزين في الكاش: ${event.request.url}`);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('🌐 خطأ في الاتصال، البحث عن بديل:', error);
            
            // 3. ثالثاً: عرض صفحة عدم الاتصال
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // 4. رابعاً: عرض أيقونة افتراضية للصور
            if (event.request.destination === 'image') {
              return caches.match('./icons/icon-192x192.png');
            }
            
            // 5. أخيراً: عرض رسالة خطأ
            return new Response(
              '<h1>عذراً، أنت غير متصل بالإنترنت</h1><p>يحتاج التطبيق إلى اتصال إنترنت للعمل</p>',
              {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              }
            );
          });
      })
  );
});

// استقبال رسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
  if (event.data === 'clearCache') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
      console.log('🧹 تم مسح جميع الكاش');
      event.ports[0].postMessage('cacheCleared');
    });
  }
});

// تحديث التطبيق تلقائياً
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  console.log('🔄 تحديث الكاش...');
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);
  console.log('✅ تم تحديث الكاش');
}
[file content end]