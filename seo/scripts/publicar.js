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

  const body = {
    slug: dados.slug,
    titulo: dados.titulo,
    categoria: dados.categoria,
    meta_description: dados.metaDescription,
    og_image_url: dados.imageUrl || '',
    conteudo_resumo: dados.ogDescription,
    atualizado_em: new Date().toISOString(),
  };

  // Tentar upsert — se slug já existe, atualizar
  const response = await fetch(`${SUPABASE_URL}/rest/v1/seo_artigos?slug=eq.${encodeURIComponent(dados.slug)}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  });

  if (response.status === 404 || (response.ok && response.status === 200)) {
    // Pode não ter encontrado — tentar insert
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/seo_artigos`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify(body)
    });
    // Ignora erro de duplicata silenciosamente
  }
  console.log('✓ Artigo registrado no Supabase');
}

// --- Disparar push notification via OneSignal REST API ---

const ONESIGNAL_APP_ID = '204a1304-2cc4-44b8-af83-f35ceaabd504';
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

async function enviarPush(dados) {
  if (!ONESIGNAL_REST_KEY) {
    console.warn('ONESIGNAL_REST_KEY não definida — pulando push.');
    return;
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { pt: dados.pushTitulo || dados.titulo.substring(0, 60), en: dados.pushTitulo || dados.titulo.substring(0, 60) },
      contents: { pt: dados.pushBody || dados.ogDescription.substring(0, 100), en: dados.pushBody || dados.ogDescription.substring(0, 100) },
      url: `https://carnesrodrigues.com.br/${dados.slug}`,
      chrome_web_icon: 'https://carnesrodrigues.com.br/icon-192.png',
      chrome_web_image: dados.imageUrl || '',
    })
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`Erro ao enviar push: ${response.status} — ${body}`);
  } else {
    try {
      const result = JSON.parse(body);
      console.log(`✓ Push enviada — id: ${result.id || '?'}, recipients: ${result.recipients || 0}, errors: ${JSON.stringify(result.errors || [])}`);
    } catch (e) {
      console.log(`✓ Push enviada — resposta: ${body.slice(0, 200)}`);
    }
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
