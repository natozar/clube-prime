/**
 * Baixa todas as imagens externas (Unsplash) referenciadas nos artigos SEO
 * e reescreve cada referência para um caminho local em /seo/assets/images/.
 *
 * Resolve o risco de CDN externo fora do ar, rate-limit ou link quebrado.
 *
 * Uso: node seo/scripts/baixar-fotos-externas.js
 */

import { readFile, writeFile, mkdir, readdir, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');
const IMAGES_DIR = join(__dirname, '..', 'assets', 'images');

// Diretórios a varrer
const SCAN_DIRS = [
  'churrasco', 'cotacao-arroba-boi-gordo-hoje', 'guia',
  'mercado', 'racas', 'regioes',
];
const SCAN_FILES_GLOBS = [
  'seo/conteudos',          // JSON de artigos
  'seo/templates/artigo.html',
];

// Regex: captura URLs Unsplash (images.unsplash.com e plus.unsplash.com/premium_photo)
const UNSPLASH_REGEX = /https:\/\/(?:images|plus)\.unsplash\.com\/[^\s"'<>)]+/g;

function extractPhotoId(url) {
  // photo-1681767254572-ff6b6ebac7c8  |  premium_photo-1667860234741-0e500d0e5ba5
  const m = url.match(/(premium_photo|photo)-([\d]+-[a-f0-9]+)/);
  return m ? `${m[1]}-${m[2]}` : null;
}

async function collectIndexHtmls() {
  // NOTA: Dirent.isFile()/isDirectory() em Windows ocasionalmente retorna
  // false para entradas válidas quando lidas com {withFileTypes:true}.
  // Usar stat() diretamente — mais lento, mas confiável.
  const files = [];
  for (const d of SCAN_DIRS) {
    const full = join(SITE_ROOT, d);
    try { await stat(full); } catch { continue; }
    const entries = await readdir(full);
    for (const name of entries) {
      const p = join(full, name);
      let st;
      try { st = await stat(p); } catch { continue; }
      if (st.isDirectory()) {
        try {
          const sub = await readdir(p);
          for (const s of sub) {
            if (s === 'index.html') {
              const sp = join(p, s);
              try { const sst = await stat(sp); if (sst.isFile()) files.push(sp); } catch {}
            }
          }
        } catch {}
      } else if (st.isFile() && name === 'index.html') {
        files.push(p);
      }
    }
  }
  return files;
}

async function collectJsons() {
  const full = join(SITE_ROOT, 'seo', 'conteudos');
  try { await stat(full); } catch { return []; }
  const entries = await readdir(full);
  return entries.filter(n => n.endsWith('.json')).map(n => join(full, n));
}

async function collectFiles() {
  const htmls = await collectIndexHtmls();
  const jsons = await collectJsons();
  const template = join(SITE_ROOT, 'seo', 'templates', 'artigo.html');
  try { await access(template); htmls.push(template); } catch {}
  return [...htmls, ...jsons];
}

async function baixarImagem(url, destino) {
  try { await access(destino); return { skipped: true }; } catch {}
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Clube Prime SEO Bot' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destino, buf);
  return { bytes: buf.length };
}

async function main() {
  await mkdir(IMAGES_DIR, { recursive: true });
  const files = await collectFiles();
  console.log(`Escaneando ${files.length} arquivos...`);

  // Coletar URLs únicas e mapear photoId → URL raw (sem params de dimensão)
  const urls = new Map(); // photoId → { fullUrl, localPath, localWebPath }
  for (const f of files) {
    const content = await readFile(f, 'utf8');
    const matches = content.match(UNSPLASH_REGEX) || [];
    for (const url of matches) {
      const id = extractPhotoId(url);
      if (!id) continue;
      if (!urls.has(id)) {
        // Sempre baixar versão de hero (1200x630) — é a maior; thumbs ficam como subpath visual.
        // Simplificação: baixamos UMA versão por photoId (1200x630 q=80) e servimos a mesma pra hero e thumb.
        // Browser redimensiona via width/height do <img>; sem ganho real em baixar thumbnail separado.
        const base = url.split('?')[0];
        const canonical = `${base}?w=1200&h=630&fit=crop&q=80`;
        const fileName = `${id}.jpg`;
        urls.set(id, {
          fullUrl: canonical,
          localPath: join(IMAGES_DIR, fileName),
          localWebPath: `/seo/assets/images/${fileName}`,
        });
      }
    }
  }

  console.log(`Fotos únicas encontradas: ${urls.size}\n`);

  // Baixar todas
  for (const [id, info] of urls) {
    try {
      const r = await baixarImagem(info.fullUrl, info.localPath);
      if (r.skipped) console.log(`  ○ já existe: ${id}.jpg`);
      else console.log(`  ✓ ${(r.bytes / 1024).toFixed(0)} KB — ${id}.jpg`);
    } catch (e) {
      console.error(`  ✗ falha ${id}: ${e.message}`);
    }
  }

  // Reescrever referências em todos os arquivos
  console.log('\nReescrevendo referências...\n');
  let totalReescritos = 0;
  for (const f of files) {
    let content = await readFile(f, 'utf8');
    let mudou = false;
    content = content.replace(UNSPLASH_REGEX, (url) => {
      const id = extractPhotoId(url);
      if (!id || !urls.has(id)) return url;
      mudou = true;
      return urls.get(id).localWebPath;
    });
    if (mudou) {
      await writeFile(f, content, 'utf8');
      totalReescritos++;
      console.log(`  ↻ ${f.replace(SITE_ROOT, '')}`);
    }
  }

  console.log(`\n✓ ${totalReescritos} arquivo(s) atualizado(s); ${urls.size} foto(s) local(is).`);
}

await main();
