// ── BOOT-PURGE ─────────────────────────────────────────────
// Runs BEFORE any other app script. Blocks app state until stale data is wiped.
// Trigger: incidente de privacidade (usuarios PWA viam perfil de outro cliente).
// Bump APP_VERSION para forcar nova purga global em toda a base instalada.
(function () {
  'use strict';
  var APP_VERSION = 'v13-2026-05-04';
  var VERSION_KEY = 'clube_app_version';
  var RELOAD_FLAG = '__clube_reloaded_' + APP_VERSION;
  // Chaves que NUNCA devem ser apagadas mesmo em wipe total:
  // - clube_device_id: UUID do dispositivo usado em device-binding auth.
  //   Apagar forca o cliente a ir para 'compareca a loja' no proximo login.
  // - clube-admin-auth: storageKey do Supabase Auth no admin.html. Apagar
  //   desloga o admin, e o celular logado e o unico ponto de recuperacao
  //   de acesso em caso de senha esquecida (via botao 'Enviar link de
  //   acesso' que dispara signInWithOtp).
  var DEVICE_ID_KEY = 'clube_device_id';
  var ADMIN_AUTH_KEY = 'clube-admin-auth';

  // iOS Safari Modo Privado tem quota=0 -> localStorage.setItem throws.
  // Sem este guard, VERSION_KEY nunca persiste e boot-purge entra em loop
  // de reload infinito a cada abertura do app.
  function storageWorks() {
    try {
      var k = '__bp_test__';
      localStorage.setItem(k, '1');
      var ok = localStorage.getItem(k) === '1';
      localStorage.removeItem(k);
      return ok;
    } catch (e) { return false; }
  }
  if (!storageWorks()) return;

  try {
    // Ja esta na versao atual -> nao faz nada
    if (localStorage.getItem(VERSION_KEY) === APP_VERSION) return;

    // 0) Preserva device_id ANTES do wipe (regressao do v10: wipe total
    //    quebrava device-binding de TODOS os clientes existentes).
    var preservedDeviceId = null;
    var preservedAdminAuth = null;
    try { preservedDeviceId = localStorage.getItem(DEVICE_ID_KEY); } catch (e) {}
    try { preservedAdminAuth = localStorage.getItem(ADMIN_AUTH_KEY); } catch (e) {}

    // 1) Wipe total de estado do cliente (localStorage + sessionStorage)
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}

    // 1b) Restaura chaves preservadas APOS o wipe.
    try {
      if (preservedDeviceId) localStorage.setItem(DEVICE_ID_KEY, preservedDeviceId);
    } catch (e) {}
    try {
      if (preservedAdminAuth) localStorage.setItem(ADMIN_AUTH_KEY, preservedAdminAuth);
    } catch (e) {}

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
