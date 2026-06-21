// Service Worker لمنظومة زاوية الشيخ عبد السلام النفاتي
// يخلي التطبيق يفتح بسرعة (يخزن الواجهة فقط، البيانات تبقى تُجلب من JSONBin دائماً)

const CACHE_NAME = 'zawia-quran-v1';
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
// - طلبات JSONBin (api.jsonbin.io) تذهب دائماً للشبكة مباشرة (بيانات حية، لا تُخزَّن)
// - باقي الملفات: نحاول الشبكة أولاً (لجلب أحدث نسخة)، ولو فشلت نستخدم الكاش
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  if (url.indexOf('api.jsonbin.io') !== -1) {
    // بيانات حية - لا تخزين أبداً
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
