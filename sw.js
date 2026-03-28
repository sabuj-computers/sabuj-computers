const cacheName = 'sabuj-comp-v1';
const assets = [
  '/sabuj-computers/',
  '/sabuj-computers/index.html',
  '/sabuj-computers/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});