// Service Worker لمنظومة زاوية الشيخ عبد السلام النفاتي
// يخلي التطبيق يفتح بسرعة (يخزن الواجهة فقط، البيانات تبقى تُجلب من JSONBin دائماً)

const CACHE_NAME = 'zawia-quran-v2';
const FILES_TO_CACHE = [
  './Quran-zawia.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// عند التثبيت: نخزن نسخة من ملفات الواجهة الأساسية
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// عند التفعيل: نحذف أي نسخ قديمة من الكاش
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// عند كل طلب:
// - طلبات JSONBin (api.jsonbin.io) لا تُعترض أبداً - لا event.respondWith على الإطلاق
// - باقي الملفات: نحاول الشبكة أولاً (لجلب أحدث نسخة)، ولو فشلت نستخدم الكاش
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // فحص صريح وقاطع: أي طلب لـ JSONBin يُترك تماماً بدون أي تدخل من Service Worker
  if (url.indexOf('jsonbin.io') !== -1) {
    return; // لا نستدعي event.respondWith أبداً لهذه الطلبات
  }

  // فحص إضافي: نتجاهل أي طلب ليس GET (مثل POST/PUT المستخدمة في الحفظ) كحماية إضافية
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // نحدّث الكاش بأحدث نسخة من الملف لو نجح الطلب
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // فشل الاتصال - نستخدم النسخة المخزنة لو موجودة
        return caches.match(event.request);
      })
  );
});
