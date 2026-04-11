// OneSignal SDK — DEVE ser a primeira linha do service worker
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'clube-prime-v9';
const ASSETS = ['/manifest.json', '/icon-72.png', '/icon-96.png', '/icon-128.png', '/icon-144.png', '/icon-152.png', '/icon-192.png', '/icon-384.png', '/icon-512.png', '/app.css', '/app.js', '/admin.css', '/admin.js', '/secure-storage.js'];

self.addEventListener('install', e => {
  console.log('[SW] Instalando', CACHE_NAME);
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
  // Ignorar requisições externas (Supabase, OneSignal, APIs, CDNs)
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = new URL(e.request.url);

  // HTML pages (app + SEO): network-first (sempre busca versão atualizada)
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

  // SEO images: cache-first com network fallback
  if (url.pathname.startsWith('/seo/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Static assets: cache-first (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Push notifications e notificationclick são gerenciados inteiramente
// pelo OneSignal SDK (importado na linha 1). Handlers customizados
// conflitavam com o SDK e foram removidos.
// Ícone, botões e URL são configurados no payload da REST API (publicar.js).
