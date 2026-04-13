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

  // Upsert via POST com resolution=merge-duplicates (slug é unique)
  body.publicado_em = body.publicado_em || new Date().toISOString();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/seo_artigos`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal,resolution=merge-duplicates'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    console.error('Erro ao registrar artigo no Supabase:', response.status, await response.text().catch(() => ''));
  } else {
    console.log('✓ Artigo registrado no Supabase');
  }
}

// --- Disparar push notification via OneSignal REST API ---

const ONESIGNAL_APP_ID = '204a1304-2cc4-44b8-af83-f35ceaabd504';
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

async function enviarPush(dados) {
  if (!ONESIGNAL_REST_KEY) {
    console.warn('⚠ ONESIGNAL_REST_KEY não definida — pulando push.');
    return { sent: false, reason: 'no_key' };
  }

  // PRÉ-CHECK: validar a key consultando /apps/{id}
  console.log('[Push] Validando REST API Key...');
  const checkRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, {
    headers: { 'Authorization': `Key ${ONESIGNAL_REST_KEY}` }
  });
  if (!checkRes.ok) {
    const errTxt = await checkRes.text();
    console.error(`✗ REST API Key INVÁLIDA ou sem permissão (HTTP ${checkRes.status})`);
    console.error(`  Resposta: ${errTxt}`);
    console.error(`  → Verifique o valor de ONESIGNAL_REST_KEY no GitHub Actions secrets`);
    console.error(`  → Use a "REST API Key" do dashboard OneSignal, NÃO a "User Auth Key"`);
    return { sent: false, reason: 'invalid_key', status: checkRes.status };
  }
  const appInfo = await checkRes.json();
  const messageable = appInfo.messageable_players || 0;
  console.log(`[Push] App: ${appInfo.name} | Messageable players: ${messageable}`);
  if (messageable === 0) {
    console.warn('⚠ ZERO subscribers no OneSignal — push não será entregue a ninguém.');
    console.warn('  Ação: acesse carnesrodrigues.com.br em um browser e aceite notificações.');
    // Continua assim mesmo para logar resposta da API
  }

  const articleUrl = `https://carnesrodrigues.com.br/${dados.slug}`;
  // NOTA: target_channel é incompatível com included_segments.
  // target_channel só deve ser usado com include_aliases/external_user_ids/subscription_ids.
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ['Total Subscriptions'],
    headings: { pt: dados.pushTitulo || dados.titulo.substring(0, 60), en: dados.pushTitulo || dados.titulo.substring(0, 60) },
    contents: { pt: dados.pushBody || dados.ogDescription.substring(0, 100), en: dados.pushBody || dados.ogDescription.substring(0, 100) },
    url: articleUrl,
    web_url: articleUrl,
    chrome_web_icon: 'https://carnesrodrigues.com.br/icon-192.png',
    web_buttons: [
      { id: 'open', text: 'Ler artigo', url: articleUrl },
      { id: 'share', text: 'Compartilhar', url: `https://api.whatsapp.com/send?text=${encodeURIComponent('Veja no Clube Prime: ' + articleUrl)}` }
    ]
  };

  // Só incluir imagem se existir (string vazia causa erro na API)
  if (dados.imageUrl) {
    payload.chrome_web_image = dados.imageUrl;
    payload.big_picture = dados.imageUrl;
  }

  console.log('Push payload:', JSON.stringify(payload, null, 2));

  let response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  let body = await response.text();
  console.log(`[Push] API resposta inicial: HTTP ${response.status}`);
  console.log(`[Push] Body: ${body}`);

  // Se "Total Subscriptions" não existe ou falha por segmento, tentar "All" e "Subscribed Users"
  if (!response.ok || (response.ok && body.includes('"recipients":0'))) {
    for (const seg of ['All', 'Subscribed Users', 'Active Subscriptions']) {
      console.warn(`⚠ Tentando segmento "${seg}"...`);
      payload.included_segments = [seg];
      response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: { 'Authorization': `Key ${ONESIGNAL_REST_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      body = await response.text();
      console.log(`[Push] "${seg}" resposta: HTTP ${response.status} — ${body}`);
      if (response.ok && !body.includes('"recipients":0')) break;
    }
  }

  if (!response.ok) {
    console.error(`✗ Push FALHOU: HTTP ${response.status}`);
    console.error(`  Resposta: ${body}`);
    return { sent: false, reason: body };
  }

  try {
    const result = JSON.parse(body);
    const recipients = result.recipients || 0;

    if (recipients === 0) {
      console.warn('⚠ Push enviada mas 0 RECIPIENTS!');
      console.warn('  Verifique: subscribers no OneSignal dashboard, SW registrado, domínio correto');
    } else {
      console.log(`✓ Push enviada — id: ${result.id}, recipients: ${recipients}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.warn(`  Erros: ${JSON.stringify(result.errors)}`);
    }

    return { sent: true, recipients, id: result.id, errors: result.errors };
  } catch (e) {
    console.log(`✓ Push enviada — resposta raw: ${body.slice(0, 200)}`);
    return { sent: true, body };
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
    console.log('1/6 Buscando foto...');
    const foto = await buscarFoto(dados.fotoKeyword, dados.slug.replace(/\//g, '-'), dados.categoria);
    if (foto) {
      dados.imageAlt = foto.alt;
      dados.imageCredit = foto.credit;
    }
  } else {
    console.log('1/6 Foto: UNSPLASH_ACCESS_KEY não definida — usando placeholder.');
  }

  // 2. Gerar HTML
  console.log('2/6 Gerando artigo HTML...');
  const outputPath = await gerarArtigo(dados);

  // 3. Registrar no Supabase
  console.log('3/6 Registrando no Supabase...');
  await registrarArtigo(dados);

  // 4. Atualizar sitemap
  console.log('4/6 Atualizando sitemap...');
  await atualizarSitemap(dados.slug);

  // 5. Push notification
  console.log('5/6 Enviando push notification...');
  const pushResult = await enviarPush(dados);

  // 6. Marcar push como enviada no Supabase
  if (pushResult.sent && SUPABASE_SERVICE_KEY) {
    console.log('6/6 Atualizando push_enviado no Supabase...');
    try {
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/seo_artigos?slug=eq.${encodeURIComponent(dados.slug)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ push_enviado: true })
      });
      if (patchRes.ok) {
        console.log('✓ push_enviado = true no Supabase');
      } else {
        console.warn(`⚠ Falha ao atualizar push_enviado: ${patchRes.status}`);
      }
    } catch (e) {
      console.warn(`⚠ Erro ao atualizar push_enviado: ${e.message}`);
    }
  } else {
    console.log('6/6 Push não enviada — pulando atualização de push_enviado.');
  }

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