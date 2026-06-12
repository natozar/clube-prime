// ── SECURE STORAGE ──────────────────────────────────────
// Encrypts sensitive data in localStorage using Web Crypto API (AES-GCM)
// Falls back to plain localStorage if Web Crypto is unavailable
// TODO: RLS policies in Supabase are the primary security layer;
//       this adds defense-in-depth for client-side stored data.

var SecureStorage = (function() {
  'use strict';

  var SALT = 'clube-prime-2024-salt';
  var KEY_CACHE = null;
  var KEY_CACHE_SCOPE = null;
  var CRYPTO_AVAILABLE = !!(window.crypto && window.crypto.subtle);
  var PREFIX = 'cs_'; // prefix for encrypted entries

  // Derive a stable AES-GCM key from a device fingerprint + salt
  function getFingerprint() {
    var parts = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset()
    ];
    return parts.join('|');
  }

  // FIX 5: a chave inclui o telefone da sessão ativa, não só o fingerprint do
  // aparelho. Sem isso, dois clientes no mesmo device (A usa, admin libera, B
  // assume) derivavam a MESMA chave e B decriptava o cs_* deixado pelo A.
  // O telefone vem de clube_sessao, que é plain por design (criptografá-lo
  // criava dependência circular e logouts por mudança de user-agent/tela).
  // Sem sessão o scope é '' — um cs_* gravado em scope errado falha o decrypt
  // e o get() abaixo remove a entrada e devolve null (app re-busca do server).
  function getUserScope() {
    try {
      var raw = localStorage.getItem('clube_sessao');
      if (!raw) return '';
      var tel = JSON.parse(raw).telefone;
      return tel ? String(tel) : '';
    } catch (e) { return ''; }
  }

  async function deriveKey() {
    var scope = getUserScope();
    if (KEY_CACHE && KEY_CACHE_SCOPE === scope) return KEY_CACHE;
    var encoder = new TextEncoder();
    var material = await crypto.subtle.importKey(
      'raw', encoder.encode(getFingerprint() + '|' + scope + '|' + SALT),
      { name: 'PBKDF2' }, false, ['deriveKey']
    );
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: encoder.encode(SALT), iterations: 100000, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
    KEY_CACHE = key;
    KEY_CACHE_SCOPE = scope;
    return key;
  }

  function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    for (var i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function encrypt(plaintext) {
    var key = await deriveKey();
    var encoder = new TextEncoder();
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key, encoder.encode(plaintext)
    );
    return JSON.stringify({
      iv: arrayBufferToBase64(iv.buffer),
      data: arrayBufferToBase64(encrypted)
    });
  }

  async function decrypt(ciphertext) {
    var key = await deriveKey();
    var parsed = JSON.parse(ciphertext);
    var iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
    var data = base64ToArrayBuffer(parsed.data);
    var decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key, data
    );
    return new TextDecoder().decode(decrypted);
  }

  // Public API
  return {
    set: async function(key, value) {
      if (!CRYPTO_AVAILABLE) {
        localStorage.setItem(key, value);
        return;
      }
      try {
        var encrypted = await encrypt(value);
        localStorage.setItem(PREFIX + key, encrypted);
        // Remove plain-text version if exists (migration)
        if (localStorage.getItem(key) !== null && key !== PREFIX + key) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Fallback to plain storage on any crypto error
        localStorage.setItem(key, value);
      }
    },

    get: async function(key) {
      if (!CRYPTO_AVAILABLE) {
        return localStorage.getItem(key);
      }
      // Try encrypted first
      var encrypted = localStorage.getItem(PREFIX + key);
      if (encrypted) {
        try {
          return await decrypt(encrypted);
        } catch (e) {
          // Decryption failed — key may have changed (different device)
          localStorage.removeItem(PREFIX + key);
          return null;
        }
      }
      // Fallback: check for plain-text (pre-migration data)
      var plain = localStorage.getItem(key);
      if (plain !== null) {
        // Auto-migrate to encrypted
        await this.set(key, plain);
        return plain;
      }
      return null;
    },

    remove: function(key) {
      localStorage.removeItem(key);
      localStorage.removeItem(PREFIX + key);
    },

    // Synchronous get for non-sensitive data or when async is impractical
    getSync: function(key) {
      // Try plain first (faster), then check encrypted marker
      var plain = localStorage.getItem(key);
      if (plain !== null) return plain;
      // If encrypted exists, return null (caller should use async get)
      var encrypted = localStorage.getItem(PREFIX + key);
      return encrypted ? null : null;
    },

    // Migrate all known sensitive keys from plain to encrypted
    migrateAll: async function() {
      if (!CRYPTO_AVAILABLE) return;
      // clube_sessao fica em plain localStorage — criptografia por fingerprint
      // causava logouts quando o user-agent/tela mudava.
      var sensitiveKeys = [
        'clube_cliente_dados',
        'clube_cliente_saldo',
        'clube_cliente_tel',
        'clube_cliente_id',
        'clube_favoritos',
        'clube_ultimo_pedido'
      ];
      for (var i = 0; i < sensitiveKeys.length; i++) {
        var key = sensitiveKeys[i];
        var plain = localStorage.getItem(key);
        if (plain !== null && !localStorage.getItem(PREFIX + key)) {
          try {
            await this.set(key, plain);
          } catch (e) {
            // Keep plain if migration fails
          }
        }
      }
    }
  };
})();

// Auto-migrate on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { SecureStorage.migrateAll(); });
} else {
  SecureStorage.migrateAll();
}
