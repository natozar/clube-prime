const CACHE_NAME = 'clube-prime-v4';
const ASSETS = ['/manifest.json', '/icon-192.png', '/icon-384.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Ignorar requisições externas (Supabase, OneSignal, APIs, etc)
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);

  // HTML pages: network-first (sempre busca versão atualizada)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets: cache-first (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Push notifications (OneSignal vai sobrescrever isso automaticamente)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Clube Prime', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-96.png'
    })
  );
});
