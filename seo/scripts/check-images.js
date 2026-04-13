/**
 * Health check: valida que todas as URLs de imagem nos artigos SEO
 * (og:image, <img src>, background-image em inline styles) retornam HTTP 200.
 *
 * Falha com exit 1 se alguma URL estiver quebrada. Usado pelo workflow
 * antes de cada run diário para prevenir publicação com imagens mortas.
 *
 * Uso: node seo/scripts/check-images.js
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');

// Diretórios que contêm artigos SEO (e a raiz do template)
const SCAN_DIRS = [
  'churrasco',
  'cotacao-arroba-boi-gordo-hoje',
  'guia',
  'mercado',
  'racas',
  'regioes',
];
const SCAN_FILES = [
  'seo/templates/artigo.html',
  'seo/scripts/gerar-artigo.js',
  'sql-sync-blog.sql',
];

// Concurrência de verificação
const CONCURRENCY = 8;
// Timeout por URL
const TIMEOUT_MS = 10000;

// Regex: pega URLs http(s) que contém extensão de imagem OU são do unsplash
const IMG_URL_REGEX = /https:\/\/[^\s"'<>)]+?(?:\.(?:png|jpg|jpeg|webp|gif|svg)(?:\?[^\s"'<>)]*)?|unsplash\.com\/[^\s"'<>)]+)/g;

async function collectFiles(dir) {
  const full = join(SITE_ROOT, dir);
  try { await stat(full); } catch { return []; }
  const files = [];
  const entries = await readdir(full, { withFileTypes: true });
  for (const e of entries) {
    const p = join(full, e.name);
    if (e.isDirectory()) {
      const sub = await readdir(p, { withFileTypes: true });
      for (const s of sub) {
        if (s.isFile() && s.name === 'index.html') files.push(join(p, s.name));
      }
    } else if (e.isFile() && e.name === 'index.html') {
      files.push(p);
    }
  }
  return files;
}

async function collectAllFiles() {
  const files = [];
  for (const d of SCAN_DIRS) files.push(...(await collectFiles(d)));
  for (const f of SCAN_FILES) {
    try {
      const p = join(SITE_ROOT, f);
      await stat(p);
      files.push(p);
    } catch {}
  }
  return files;
}

async function extractUrls(files) {
  const urls = new Set();
  for (const f of files) {
    try {
      const content = await readFile(f, 'utf8');
      const matches = content.match(IMG_URL_REGEX) || [];
      for (const url of matches) {
        // Ignorar URLs relativas do próprio domínio (já são locais)
        if (url.startsWith('https://carnesrodrigues.com.br/')) continue;
        urls.add(url);
      }
    } catch {}
  }
  return [...urls];
}

async function checkUrl(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // HEAD primeiro (mais rápido); se falhar, GET como fallback
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok && res.status !== 405) {
      // Algumas CDNs rejeitam HEAD mas aceitam GET
      res = await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'follow' });
    }
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return { url, status: 0, ok: false, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAll(urls) {
  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
    for (const r of batchResults) {
      const icon = r.ok ? '✓' : '✗';
      const statusText = r.error ? `ERR: ${r.error}` : `HTTP ${r.status}`;
      console.log(`  ${icon} ${statusText}  ${r.url}`);
    }
  }
  return results;
}

const files = await collectAllFiles();
console.log(`Escaneando ${files.length} arquivos...`);

const urls = await extractUrls(files);
console.log(`Encontradas ${urls.length} URLs de imagem únicas:\n`);

const results = await checkAll(urls);

const broken = results.filter(r => !r.ok);
console.log('');
if (broken.length > 0) {
  console.error(`❌ FAIL — ${broken.length} URL(s) quebrada(s):`);
  broken.forEach(r => console.error(`  ${r.url} (${r.error || 'HTTP ' + r.status})`));
  process.exit(1);
} else {
  console.log(`✓ OK — todas as ${urls.length} imagens retornam HTTP 200`);
}
