// ===== Service Worker محسن =====
const CACHE_NAME = 'ai-hub-v2.0';
const APP_VERSION = '2.0.0';

// الملفات الأساسية للتخزين المؤقت
const CORE_CACHE_FILES = [
  '/AI-hub-offline/',
  '/AI-hub-offline/index.html',
  '/AI-hub-offline/manifest.json'
];

// الملفات الاختيارية (ستتم إضافتها عند الطلب)
const OPTIONAL_CACHE_FILES = [
  '/AI-hub-offline/icons/icon-72x72.png',
  '/AI-hub-offline/icons/icon-96x96.png',
  '/AI-hub-offline/icons/icon-128x128.png',
  '/AI-hub-offline/icons/icon-144x144.png',
  '/AI-hub-offline/icons/icon-152x152.png',
  '/AI-hub-offline/icons/icon-192x192.png',
  '/AI-hub-offline/icons/icon-384x384.png',
  '/AI-hub-offline/icons/icon-512x512.png'
];

// ===== التثبيت =====
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker جاري التثبيت...');
  
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الأساسية
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CORE_CACHE_FILES)),
      
      // تخطيط التخزين للصور
      caches.open(`${CACHE_NAME}-images`)
        .then(cache => {
          return Promise.allSettled(
            OPTIONAL_CACHE_FILES.map(url => cache.add(url).catch(() => {
              console.warn(`⚠️ تعذر تخزين: ${url}`);
            }))
          );
        })
    ])
  );
});

// ===== التنشيط =====
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker مفعل');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // حذف الذاكرة المؤقتة القديمة
          if (cacheName !== CACHE_NAME && !cacheName.includes(`${CACHE_NAME}-`)) {
            console.log(`🗑️ حذف ذاكرة قديمة: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // أخذ السيطرة على جميع الصفحات
      return self.clients.claim();
    })
  );
});

// ===== إدارة الطلبات =====
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // تخطي طلبات POST وطلبات غير HTTP/HTTPS
  if (event.request.method !== 'GET') {
    return;
  }
  
  // تخطي طلبات المتصفح الداخلية
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // إذا كان الملف مخزن مؤقتًا، استخدمه
        if (cachedResponse) {
          console.log(`✅ مستخدم من الذاكرة المؤقتة: ${url.pathname}`);
          return cachedResponse;
        }
        
        // إذا لم يكن مخزنًا، اجلبه من الشبكة
        return fetch(event.request)
          .then(networkResponse => {
            // لا نخزن طلبات OPAQUE (طلبات CORS)
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // تخزين الصور فقط (لحجم أصغر)
            if (event.request.destination === 'image') {
              const responseToCache = networkResponse.clone();
              caches.open(`${CACHE_NAME}-images`)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // إذا فشل الاتصال، أظهر صفحة بديلة للصفحات الرئيسية
            if (event.request.mode === 'navigate') {
              return caches.match('/AI-hub-offline/index.html');
            }
            
            // للصور، أظهر أيقونة بديلة
            if (event.request.destination === 'image') {
              return new Response(
                '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#1a73e8"/><text x="50" y="50" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            return new Response('عذرًا، التطبيق غير متصل بالإنترنت', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
});

// ===== رسالة من التطبيق الرئيسي =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then(cacheNames => {
      event.ports[0].postMessage({
        cacheNames,
        version: APP_VERSION
      });
    });
  }
});

// ===== تحديث في الخلفية =====
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

// دالة تحديث الذاكرة المؤقتة
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const updatedFiles = await cache.addAll(CORE_CACHE_FILES);
    console.log('🔄 تم تحديث الذاكرة المؤقتة');
    return updatedFiles;
  } catch (error) {
    console.error('❌ فشل تحديث الذاكرة المؤقتة:', error);
  }
}
