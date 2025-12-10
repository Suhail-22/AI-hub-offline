// public/sw.js

const CACHE_NAME = 'ai-hub-offline-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// مرحلة التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('تم تخزين الملفات في الذاكرة المؤقتة');
        return cache.addAll(urlsToCache);
      })
  );
});

// مرحلة الجلب: خدمة الملفات من الذاكرة المؤقتة أولاً
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات غير HTTP (مثل chrome-extension)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // تجاهل طلبات خارج نطاق التطبيق
  if (!event.request.url.includes('/AI-hub-offline/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إرجاع النسخة المخزّنة، أو جلب من الشبكة
        return response || fetch(event.request);
      })
  );
});

// مرحلة التفعيل: إزالة الذاكرة المؤقتة القديمة
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('حذف الذاكرة المؤقتة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});