/**
 * Sync de artigos do disco → tabela seo_artigos no Supabase.
 *
 * Scaneia todos os index.html dos diretórios de artigos, extrai
 * metadados (title, description, og:image) e faz upsert na tabela.
 * Útil quando o registrarArtigo do publicar.js falhou (ex: SUPABASE_SERVICE_KEY
 * ausente em runs anteriores) e o banco ficou dessincronizado do disco.
 *
 * Uso: SUPABASE_SERVICE_KEY=xxx node seo/scripts/sync-blog.js
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida.');
  console.error('   Uso: SUPABASE_SERVICE_KEY=xxx node seo/scripts/sync-blog.js');
  process.exit(1);
}

// Diretórios a escanear (e categoria associada)
const DIRS = [
  { path: 'churrasco',                     categoria: 'churrasco', isHub: false },
  { path: 'cotacao-arroba-boi-gordo-hoje', categoria: 'cotacao',   isHub: true  },
  { path: 'guia',                          categoria: 'guia',      isHub: false },
  { path: 'mercado',                       categoria: 'mercado',   isHub: false },
  { path: 'racas',                         categoria: 'raca',      isHub: false },
  { path: 'regioes',                       categoria: 'regiao',    isHub: false },
];

function extractMeta(html) {
  const titulo = (html.match(/<title>([^<]*?)(?:\s*\|.*)?<\/title>/) || [])[1] || '';
  const meta_description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const og_image_url = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '';
  const og_description = (html.match(/<meta property="og:description" content="([^"]*)"/) || [])[1] || meta_description;
  return { titulo: titulo.trim(), meta_description, og_image_url, conteudo_resumo: og_description };
}

async function findArticles() {
  const articles = [];
  for (const { path, categoria, isHub } of DIRS) {
    const fullPath = join(SITE_ROOT, path);
    try { await stat(fullPath); } catch { continue; }

    // Caso 1: index.html direto (artigo único, ex: cotacao-arroba-boi-gordo-hoje)
    if (isHub) {
      try {
        const html = await readFile(join(fullPath, 'index.html'), 'utf8');
        articles.push({ slug: path, categoria, ...extractMeta(html) });
      } catch {}
      continue;
    }

    // Caso 2: subdiretórios com index.html (ex: churrasco/quantidade-carne-por-pessoa)
    let entries;
    try { entries = await readdir(fullPath, { withFileTypes: true }); } catch { continue; }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = `${path}/${entry.name}`;
      const indexPath = join(fullPath, entry.name, 'index.html');
      try {
        const html = await readFile(indexPath, 'utf8');
        articles.push({ slug, categoria, ...extractMeta(html) });
      } catch {}
    }
  }
  return articles;
}

async function syncToSupabase(articles) {
  const now = new Date().toISOString();
  const rows = articles.map(a => ({
    slug: a.slug,
    titulo: a.titulo,
    categoria: a.categoria,
    meta_description: a.meta_description,
    og_image_url: a.og_image_url,
    conteudo_resumo: a.conteudo_resumo,
    publicado_em: now,
    atualizado_em: now,
    ativo: true,
  }));

  console.log(`📦 Sincronizando ${rows.length} artigos com o Supabase...\n`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/seo_artigos`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`❌ Erro HTTP ${res.status}:`);
    console.error(body);
    process.exit(1);
  }

  const inserted = JSON.parse(body);
  console.log(`✓ ${inserted.length} artigos sincronizados com sucesso:\n`);
  inserted.forEach(r => console.log(`  • ${r.slug} — ${r.titulo}`));
}

const articles = await findArticles();
console.log(`Encontrados ${articles.length} artigos no disco:\n`);
articles.forEach(a => console.log(`  • ${a.slug}`));
console.log('');
await syncToSupabase(articles);
