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

  const result = {
    url: `/seo/assets/images/${fileName}`,
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

async function buscarNoUnsplash(query) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '5');
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

  // Preferir foto com alt_description (melhor SEO)
  return data.results.find(r => r.alt_description) || data.results[0];
}

export { buscarFoto, FALLBACK_KEYWORDS };

// Executar se chamado via CLI
if (process.argv[2]) {
  const keyword =