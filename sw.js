// OneSignal SDK — DEVE ser a primeira linha do service worker
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'clube-prime-v7';
const ASSETS = ['/manifest.json', '/icon-72.png', '/icon-96.png', '/icon-128.png', '/icon-144.png', '/icon-152.png', '/icon-192.png', '/icon-384.png', '/icon-512.png'];

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

// Push notifications — suporte completo para artigos SEO
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const options = {
    body: data.body || data.mensagem || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-96.png',
    image: data.image || undefined,
    tag: data.tag || 'clube-prime',
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Ler artigo' },
      { action: 'share', title: 'Compartilhar' }
    ],
    vibrate: [200, 100, 200]
  };

  e.waitUntil(
    self.registration.showNotification(data.title || data.titulo || 'Clube Prime', options)
  );
});

// Clique na notificação — abrir URL do artigo
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';

  if (e.action === 'share') {
    // Abrir WhatsApp share
    const shareUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent('Veja no Clube Prime: ' + url);
    e.waitUntil(clients.openWindow(shareUrl));
    return;
  }

  // Abrir ou focar na aba com o artigo
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
