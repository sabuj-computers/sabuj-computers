const cacheName = 'sabuj-comp-v3';
const assets = [
  '/home.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for HTML so updates are picked up; cache-first for static assets
  const req = e.request;
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).catch(() => caches.match(req).then(r => r || caches.match('/home.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
