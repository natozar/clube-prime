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

  // ── PRÉ-CHECK: descobrir o formato de auth correto (Key ou Basic) ──
  // OneSignal v11+ usa "Key xxx", o formato antigo usa "Basic xxx"
  console.log('[Push] Detectando formato de autenticação...');
  let authHeader = null;
  for (const scheme of ['Key', 'Basic']) {
    const r = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, {
      headers: { 'Authorization': `${scheme} ${ONESIGNAL_REST_KEY}` }
    });
    if (r.ok) {
      authHeader = `${scheme} ${ONESIGNAL_REST_KEY}`;
      const info = await r.json();
      const messageable = info.messageable_players || 0;
      console.log(`[Push] ✓ Auth "${scheme}" OK | App: ${info.name} | Messageable: ${messageable}`);
      if (messageable === 0) {
        console.warn('⚠ ZERO subscribers — push não será entregue a ninguém.');
        console.warn('  Acesse carnesrodrigues.com.br em um browser e aceite notificações.');
      }
      break;
    } else {
      console.warn(`[Push] ✗ Auth "${scheme}" falhou: HTTP ${r.status}`);
    }
  }
  if (!authHeader) {
    console.error('✗ REST API Key INVÁLIDA em ambos formatos (Key e Basic)');
    console.error('  → Verifique ONESIGNAL_REST_KEY no GitHub Actions secrets');
    console.error('  → Use a "REST API Key" do dashboard OneSignal, NÃO a "User Auth Key"');
    return { sent: false, reason: 'invalid_key' };
  }

  const articleUrl = `https://carnesrodrigues.com.br/${dados.slug}`;
  const basePayload = {
    app_id: ONESIGNAL_APP_ID,
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
  if (dados.imageUrl) {
    basePayload.chrome_web_image = dados.imageUrl;
    basePayload.big_picture = dados.imageUrl;
  }

  // ── SHOTGUN: tentar múltiplas combinações de URL + targeting ──
  // Se qualquer uma funcionar com recipients > 0, retornar sucesso.
  const endpoints = [
    'https://api.onesignal.com/notifications',      // API v11+ (atual)
    'https://onesignal.com/api/v1/notifications',   // API v1 (legacy, ainda ativa)
  ];

  const targetingStrategies = [
    { included_segments: ['Total Subscriptions'] },
    { included_segments: ['Subscribed Users'] },
    { included_segments: ['All'] },
    { included_segments: ['Active Subscriptions'] },
    // Fallback com filters: todos que tiveram sessão (sem depender de segment name)
    { filters: [{ field: 'last_session', relation: '>', hours_ago: '1000000' }] },
  ];

  const attempts = [];
  let bestResult = null;

  for (const url of endpoints) {
    for (const targeting of targetingStrategies) {
      const payload = { ...basePayload, ...targeting };
      const label = `${url.replace('https://', '')} + ${Object.keys(targeting)[0]}=${JSON.stringify(Object.values(targeting)[0])}`;
      console.log(`[Push] Tentando: ${label}`);

      let resp, body;
      try {
        resp = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        body = await resp.text();
      } catch (e) {
        console.warn(`  ✗ Network error: ${e.message}`);
        attempts.push({ label, error: e.message });
        continue;
      }

      console.log(`  HTTP ${resp.status} — ${body.slice(0, 300)}`);
      attempts.push({ label, status: resp.status, body: body.slice(0, 500) });

      if (!resp.ok) continue;

      let result;
      try { result = JSON.parse(body); } catch { continue; }

      const recipients = result.recipients || 0;
      if (recipients > 0) {
        console.log(`\n✓ PUSH ENVIADA — endpoint: ${url}`);
        console.log(`  id: ${result.id}, recipients: ${recipients}`);
        if (result.errors) console.warn(`  errors: ${JSON.stringify(result.errors)}`);
        return { sent: true, recipients, id: result.id, endpoint: url, targeting };
      }

      // Salvar como "best result" se foi aceito mas 0 recipients
      if (!bestResult && result.id) {
        bestResult = { label, id: result.id, body };
      }
    }
  }

  // Nenhuma combinação deu recipients > 0
  console.error('\n✗ PUSH FALHOU — nenhuma combinação funcionou');
  console.error(`  Tentativas (${attempts.length}):`);
  attempts.forEach(a => console.error(`    ${a.label}: ${a.status || 'ERR'} ${(a.body || a.error || '').slice(0, 150)}`));

  if (bestResult) {
    console.warn(`\n⚠ API aceitou mas 0 recipients em todas: ${bestResult.label} (id=${bestResult.id})`);
    console.warn('  Isso significa: a KEY está correta, mas NÃO HÁ SUBSCRIBERS.');
    console.warn('  Ação: aceite notificações em https://carnesrodrigues.com.br em um browser.');
    return { sent: false, reason: 'zero_recipients', attempts };
  }

  return { sent: false, reason: 'all_failed', attempts };
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