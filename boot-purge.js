// ── BOOT-PURGE ─────────────────────────────────────────────
// Runs BEFORE any other app script. Blocks app state until stale data is wiped.
// Trigger: incidente de privacidade (usuarios PWA viam perfil de outro cliente).
// Bump APP_VERSION para forcar nova purga global em toda a base instalada.
(function () {
  'use strict';
  var APP_VERSION = 'v10-2026-04-20';
  var VERSION_KEY = 'clube_app_version';
  var RELOAD_FLAG = '__clube_reloaded_' + APP_VERSION;

  try {
    // Ja esta na versao atual -> nao faz nada
    if (localStorage.getItem(VERSION_KEY) === APP_VERSION) return;

    // 1) Wipe total de estado do cliente (localStorage + sessionStorage)
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}

    // 2) Marca versao DEPOIS da limpeza (evita loop)
    try { localStorage.setItem(VERSION_KEY, APP_VERSION); } catch (e) {}

    // 3) Purga Cache Storage do SW (async, nao bloqueia)
    if (typeof caches !== 'undefined' && caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) { caches.delete(k); });
      }).catch(function () {});
    }

    // 4) Desregistra SWs para garantir refetch do novo sw.js
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) {
          try { r.unregister(); } catch (e) {}
        });
      }).catch(function () {});
    }

    // 5) Limpa IndexedDB se existir algum db da app
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      try {
        indexedDB.databases().then(function (dbs) {
          dbs.forEach(function (db) {
            if (db && db.name) { try { indexedDB.deleteDatabase(db.name); } catch (e) {} }
          });
        }).catch(function () {});
      } catch (e) {}
    }

    // 6) Guard: reload 1x para reinicializar sem artefatos cacheados
    try {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1');
        location.reload();
      }
    } catch (e) {
      try { location.reload(); } catch (e2) {}
    }
  } catch (err) {
    // Em caso de erro inesperado, ainda tenta um reload unico
    try {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1');
        location.reload();
      }
    } catch (e) {}
  }
})();
