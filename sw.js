const CACHE_NAME = 'order-query-v1';
// 需要缓存的资源（包括 CDN 库，首次加载后缓存）
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  // Tesseract 会动态加载语言包，由于 URL 是动态的，我们通过运行时缓存策略处理
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 缓存命中，直接返回
      if (response) return response;
      // 否则请求网络，并动态缓存（适合 Tesseract 语言包等）
      return fetch(event.request).then(networkResponse => {
        // 只缓存成功的 GET 请求
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    }).catch(() => {
      // 离线且缓存未命中，可返回离线提示页（可选）
      return new Response('离线且资源未缓存', { status: 503 });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});