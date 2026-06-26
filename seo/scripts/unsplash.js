/**
 * CLUBE PRIME SEO — Busca de fotos no Unsplash
 *
 * Uso: node unsplash.js "keyword" "slug-do-artigo"
 * Ambiente: UNSPLASH_ACCESS_KEY deve estar definida
 */

import { writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '..', 'assets', 'images');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
// NOTA: não fazer process.exit(1) aqui — o publicar.js importa este módulo
// e só chama buscarFoto() se UNSPLASH_ACCESS_KEY existir. Fazer exit no
// import quebrava o pipeline inteiro quando a key não estava no ambiente.

// Keywords de fallback por categoria
const FALLBACK_KEYWORDS = {
  cotacao: ['cattle farm brazil', 'beef cattle pasture', 'livestock market'],
  raca: ['beef cattle breed', 'cattle ranch', 'premium beef cattle'],
  cruzamento: ['cattle crossbreed', 'beef cattle herd', 'cattle ranch brazil'],
  corte: ['beef steak raw', 'premium beef cut', 'raw meat butcher'],
  regiao: ['brazil farm landscape', 'cattle ranch aerial', 'pasture sunset'],
  guia: ['beef quality', 'meat marbling', 'butcher shop'],
  churrasco: ['brazilian barbecue', 'family bbq grill', 'picanha grill'],
  familia: ['family gathering outdoor', 'sunday barbecue family', 'outdoor dining friends']
};

/**
 * Busca uma foto no Unsplash
 * @param {string} keyword - Termo de busca
 * @param {string} slug - Slug do artigo (usado no nome do arquivo)
 * @param {string} categoria - Categoria para fallback
 * @returns {{ url: string, localPath: string, alt: string, credit: string }}
 */
async function buscarFoto(keyword, slug, categoria = 'cotacao') {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('[Unsplash] UNSPLASH_ACCESS_KEY não definida — retornando null (usará placeholder)');
    return null;
  }
  console.log(`Buscando foto no Unsplash: "${keyword}"...`);

  // Tentar busca principal
  let foto = await buscarNoUnsplash(keyword);

  // Fallback: tentar keywords alternativas da categoria
  if (!foto && FALLBACK_KEYWORDS[categoria]) {
    for (const fallbackKw of FALLBACK_KEYWORDS[categoria]) {
      console.log(`  Tentando fallback: "${fallbackKw}"...`);
      foto = await buscarNoUnsplash(fallbackKw);
      if (foto) break;
    }
  }

  if (!foto) {
    console.error('Nenhuma foto encontrada. Verifique as keywords.');
    return null;
  }

  // Baixar imagem em 1200x630 (ideal para OG)
  const imageUrl = `${foto.urls.raw}&w=1200&h=630&fit=crop&q=80&fm=jpg`;
  const fileName = `${slug}-hero.jpg`;
  const localPath = join(IMAGES_DIR, fileName);

  console.log(`Baixando imagem de ${foto.user.name}...`);

  await mkdir(IMAGES_DIR, { recursive: true });

  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error(`Erro ao baixar imagem: ${imgResponse.status}`);

  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  await writeFile(localPath, buffer);

  // Disparar download tracking (obrigatório pela API do Unsplash)
  await fetch(`${foto.links.download_location}&client_id=${UNSPLASH_ACCESS_KEY}`).catch(() => {});

  // URL absoluta para OG tags e compartilhamento (Unsplash CDN, sempre disponível)
  const ogImageUrl = `${foto.urls.raw}&w=1200&h=630&fit=crop&q=80`;
  // URL local para o hero image no HTML (servida pelo GitHub Pages)
  const localUrl = `/seo/assets/images/${fileName}`;
  // URL absoluta local (fallback se Unsplash CDN falhar)
  const absoluteLocalUrl = `https://carnesrodrigues.com.br/seo/assets/images/${fileName}`;

  const result = {
    url: localUrl,
    ogUrl: ogImageUrl,
    absoluteUrl: absoluteLocalUrl,
    localPath,
    alt: `${foto.alt_description || foto.description || keyword} — Clube Prime, Empório Família Rodrigues`,
    credit: `Foto: ${foto.user.name} / Unsplash`,
    width: 1200,
    height: 630,
    unsplashUrl: foto.links.html
  };

  console.log(`✓ Foto salva: ${fileName}`);
  console.log(`  Alt: ${result.alt}`);
  console.log(`  Crédito: ${result.credit}`);

  return result;
}

// ── Relevância: garantir que a foto é DO TEMA (carne/gado/churrasco) ──
// Sem isto, "livestock market cattle auction" trazia "crowd of people" e
// "premium beef steak" caía em fallback que devolvia "blue truck on a field".
const POS_TOKENS = [
  'cattle','cow','cows','calf','bull','ox','herd','livestock','beef','veal',
  'steak','meat','butcher','butchery','sirloin','tenderloin','ribeye','brisket',
  'rib','ribs','roast','picanha','wagyu','angus','hereford','nelore','zebu',
  'bbq','barbecue','barbeque','grill','grilled','grilling','churrasco','charcoal',
  'farm','farmland','ranch','pasture','grazing','grassland','cattle ranch',
  'fire','smoke','skewer','meatcut','meat market'
];
const NEG_TOKENS = [
  'crowd','audience','concert','protest','office','laptop','computer','keyboard',
  'smartphone','phone','screen','car','truck','vehicle','road','highway','traffic',
  'building','skyscraper','cityscape','airport','train','stadium','stock market',
  'graph','chart','coins','banknote','currency','wedding','fashion','makeup'
];

// Semente diária: roda a escolha entre as fotos relevantes pra não repetir a
// mesma imagem semana após semana (problema dos artigos de mercado/resumo).
function getDaySeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function pontuarRelevancia(foto, query) {
  const partes = [
    foto.alt_description || '',
    foto.description || '',
    ...((foto.tags || []).map(t => (t && t.title) || ''))
  ];
  const hay = ' ' + partes.join(' ').toLowerCase() + ' ';
  // Tokens vindos da própria query (ex.: "angus", "ribs") contam como positivos
  const queryTokens = query.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3);
  const positivos = new Set([...POS_TOKENS, ...queryTokens]);
  let score = 0;
  for (const t of positivos) if (hay.includes(t)) score += 1;
  for (const t of NEG_TOKENS) if (hay.includes(t)) score -= 2;
  return score;
}

async function buscarNoUnsplash(query) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '12');
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('content_filter', 'high');

  const response = await fetch(url, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      console.error('Rate limit do Unsplash atingido. Tente novamente em 1 hora.');
      return null;
    }
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) return null;

  // Pontuar por relevância e exigir tema mínimo (>= 1). Foto fora do tema é
  // rejeitada — buscarFoto tenta o próximo fallback, ou cai em placeholder.
  const candidatos = data.results
    .map(r => ({ foto: r, score: pontuarRelevancia(r, query) }))
    .filter(c => c.score >= 1)
    .sort((a, b) => b.score - a.score);

  if (candidatos.length === 0) {
    console.warn(`  ⚠ Nenhuma foto relevante p/ "${query}" (todas fora do tema) — descartando.`);
    return null;
  }

  // Rotação: entre as mais relevantes (até as 6 melhores), escolher por semente
  // diária pra variar a imagem entre execuções sem perder relevância.
  const tier = candidatos.slice(0, 6);
  const escolhido = tier[getDaySeed() % tier.length];
  console.log(`  ✓ Foto relevante (score ${escolhido.score}) entre ${candidatos.length} candidatas`);
  return escolhido.foto;
}

export { buscarFoto, FALLBACK_KEYWORDS };

// Executar se chamado via CLI
if (process.argv[2]) {
  const keyword = process.argv[2];
  const slug = process.argv[3] || 'artigo';
  const categoria = process.argv[4] || 'cotacao';

  buscarFoto(keyword, slug, categoria).then(result => {
    if (result) {
      console.log('\nResultado:', JSON.stringify(result, null, 2));
    }
  });
}
