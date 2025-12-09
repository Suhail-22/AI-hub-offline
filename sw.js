// Service Worker للعمل بدون إنترنت
const CACHE_NAME = 'ai-hub-v3';
const DYNAMIC_CACHE = 'ai-hub-dynamic-v1';

// الملفات التي سيتم تخزينها في الكاش
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './models/model-loader.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;700&display=swap'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] التثبيت');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] تخزين الملفات الأساسية');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] تم التثبيت بنجاح');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] التفعيل');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] تم التفعيل بنجاح');
      return self.clients.claim();
    })
  );
});

// استقبال الطلبات
self.addEventListener('fetch', event => {
  // استثناء طلبات chrome-extension و analytics
  if (event.request.url.indexOf('chrome-extension') !== -1 || 
      event.request.url.indexOf('analytics') !== -1) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[Service Worker] تم العثور في الكاش:', event.request.url);
          return response;
        }

        console.log('[Service Worker] جاري جلب من الشبكة:', event.request.url);
        
        return fetch(event.request)
          .then(networkResponse => {
            // نسخ الاستجابة للتخزين
            const responseToCache = networkResponse.clone();
            
            // فتح الكاش الديناميكي وتخزين الاستجابة
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                // تخزين فقط إذا كانت الاستجابة ناجحة
                if (networkResponse.status === 200) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] فشل الجلب:', error);
            
            // إذا كان الطلب لصفحة HTML، عرض صفحة عدم الاتصال
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // للصور، عرض صورة بديلة
            if (event.request.url.match(/\.(jpg|png|gif|svg)$/)) {
              return fetch('https://via.placeholder.com/400x300/1a73e8/ffffff?text=No+Image');
            }
            
            // للـ API، عرض رسالة خطأ
            return new Response(JSON.stringify({
              error: 'لا يوجد اتصال بالإنترنت',
              offline: true
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
  );
});

// استقبال الرسائل
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// المزامنة في الخلفية (عند الاتصال بالإنترنت)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    console.log('[Service Worker] مزامنة البيانات...');
    event.waitUntil(syncMessages());
  }
});

// تحديث التطبيق
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-check') {
    console.log('[Service Worker] التحقق من التحديثات...');
    event.waitUntil(checkForUpdates());
  }
});

// دالة مزامنة الرسائل
async function syncMessages() {
  try {
    const db = await openDatabase();
    const messages = await db.getAll('pendingMessages');
    
    for (const message of messages) {
      // محاولة إرسال الرسالة
      const response = await fetch('https://api.yourserver.com/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        // حذف الرسالة بعد الإرسال الناجح
        await db.delete('pendingMessages', message.id);
      }
    }
  } catch (error) {
    console.error('[Service Worker] خطأ في المزامنة:', error);
  }
}

// دالة التحقق من التحديثات
async function checkForUpdates() {
  try {
    const response = await fetch('./version.json');
    const data = await response.json();
    
    const cache = await caches.open(CACHE_NAME);
    const cachedVersion = await cache.match('./version.json');
    
    if (cachedVersion) {
      const cachedData = await cachedVersion.json();
      
      if (data.version !== cachedData.version) {
        // إرسال إشعار بالتحديث
        self.registration.showNotification('تحديث جديد متاح', {
          body: `الإصدار ${data.version} متاح الآن`,
          icon: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4e2.png',
          tag: 'update-available'
        });
      }
    }
  } catch (error) {
    console.error('[Service Worker] خطأ في التحقق من التحديثات:', error);
  }
}

// دالة لفتح قاعدة البيانات
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AIHubDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // إنشاء جداول جديدة
      if (!db.objectStoreNames.contains('pendingMessages')) {
        const store = db.createObjectStore('pendingMessages', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('settings')) {
        const store = db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}
