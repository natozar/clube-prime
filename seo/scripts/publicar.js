/**
 * CLUBE PRIME SEO — Publicador Diário
 *
 * Orquestra: scraping cotação → foto → geração do artigo → registro no Supabase → push notification
 *
 * Uso: node publicar.js
 * Ou via GitHub Actions (veja .github/workflows/seo-diario.yml)
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gerarArtigo } from './gerar-artigo.js';
import { buscarFoto } from './unsplash.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// --- Calendário editorial ---

const DIA_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function getDiaSemana() {
  return DIA_SEMANA[new Date().getDay()];
}

function getDataFormatada() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// --- Registrar artigo no Supabase ---

async function registrarArtigo(dados) {
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('SUPABASE_SERVICE_KEY não definida — pulando registro no banco.');
    return;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/seo_artigos`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      slug: dados.slug,
      titulo: dados.titulo,
      categoria: dados.categoria,
      meta_description: dados.metaDescription,
      og_image_url: `/seo/assets/images/${dados.slug.replace(/\//g, '-')}-hero.jpg`,
      conteudo_resumo: dados.ogDescription,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao registrar artigo: ${response.status} — ${error}`);
  } else {
    console.log('✓ Artigo registrado no Supabase');
  }
}

// --- Disparar push notification ---

async function enviarPush(dados) {
  if (!SUPABASE_SERVICE_KEY) {
    console.warn('SUPABASE_SERVICE_KEY não definida — pulando push.');
    return;
  }

  // Usa a Edge Function existente do OneSignal
  const response = await fetch(`${SUPABASE_URL}/functions/v1/onesignal-push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tipo: 'campanha',
      titulo: dados.pushTitulo || dados.titulo.substring(0, 60),
      mensagem: dados.pushBody || dados.ogDescription.substring(0, 100),
      url: `https://carnesrodrigues.com.br/${dados.slug}`,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao enviar push: ${response.status} — ${error}`);
  } else {
    console.log('✓ Push notification enviada');
  }
}

// --- Atualizar sitemap.xml ---

async function atualizarSitemap(slug) {
  const sitemapPath = join(SITE_ROOT, 'sitemap.xml');
  let sitemap = await readFile(sitemapPath, 'utf8');

  const novaUrl = `
  <url>
    <loc>https://carnesrodrigues.com.br/${slug}</loc>
    <lastmod>${getDataFormatada()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

  // Verificar se já existe
  if (sitemap.includes(`/${slug}</loc>`)) {
    // Atualizar lastmod
    const regex = new RegExp(`(<url>\\s*<loc>https://carnesrodrigues\\.com\\.br/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
    sitemap = sitemap.replace(regex, `$1${getDataFormatada()}$2`);
  } else {
    // Adicionar antes do </urlset>
    sitemap = sitemap.replace('</urlset>', `${novaUrl}\n</urlset>`);
  }

  await writeFile(sitemapPath, sitemap, 'utf8');
  console.log('✓ Sitemap atualizado');
}

// --- Fluxo principal ---

async function publicar(dadosArtigo) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`CLUBE PRIME SEO — Publicação Diária`);
  console.log(`Data: ${getDataFormatada()} | Dia: ${getDiaSemana()}`);
  console.log(`${'='.repeat(60)}\n`);

  const dados = dadosArtigo;

  // 1. Buscar foto (se UNSPLASH_ACCESS_KEY disponível)
  if (process.env.UNSPLASH_ACCESS_KEY) {
    console.log('1/5 Buscando foto...');
    const foto = await buscarFoto(dados.fotoKeyword, dados.slug.replace(/\//g, '-'), dados.categoria);
    if (foto) {
      dados.imageAlt = foto.alt;
      dados.imageCredit = foto.credit;
    }
  } else {
    console.log('1/5 Foto: UNSPLASH_ACCESS_KEY não definida — usando placeholder.');
  }

  // 2. Gerar HTML
  console.log('2/5 Gerando artigo HTML...');
  const outputPath = await gerarArtigo(dados);

  // 3. Registrar no Supabase
  console.log('3/5 Registrando no Supabase...');
  await registrarArtigo(dados);

  // 4. Atualizar sitemap
  console.log('4/5 Atualizando sitemap...');
  await atualizarSitemap(dados.slug);

  // 5. Push notification
  console.log('5/5 Enviando push notification...');
  await enviarPush(dados);

  console.log(`\n✓ Publicação concluída: https://carnesrodrigues.com.br/${dados.slug}\n`);

  return outputPath;
}

export { publicar, getDiaSemana, getDataFormatada, registrarArtigo, enviarPush, atualizarSitemap };

// CLI: recebe JSON com dados do artigo
if (process.argv[2]) {
  const jsonPath = process.argv[2];
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  await publicar(data);
}
