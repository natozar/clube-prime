/**
 * Busca fotos contextuais no Unsplash via napi (sem key) para cada artigo.
 * Retorna o primeiro resultado com slug descritivo para validação humana.
 *
 * Uso: node seo/scripts/fetch-photos.js
 */

// NOTA: queries devem descrever O QUE está no artigo, não o tema abstrato.
// "cattle pasture grass fed" retorna cortes crus na feira; "cows grazing green field"
// retorna gado em pastagem (contexto do artigo). Teste as queries rodando este script.
const ARTIGOS = [
  { slug: 'racas/angus',                           query: 'black angus cow grazing field' },
  { slug: 'racas/hereford',                        query: 'hereford cattle red white face' },
  { slug: 'racas/nelore',                          query: 'nelore zebu cattle white brazil' },
  { slug: 'churrasco/quantidade-carne-por-pessoa', query: 'brazilian barbecue grill many cuts picanha sausage' },
  { slug: 'churrasco/receita-costela-fogo-de-chao', query: 'beef ribs open fire churrasco fogo chao' },
  { slug: 'churrasco/picanha-perfeita',            query: 'picanha grilled brazilian steak' },
  { slug: 'churrasco/fraldinha-na-brasa',          query: 'flank steak grilled coal' },
  { slug: 'churrasco/tradicao-churrasco-familia',  query: 'family outdoor barbecue gathering people' },
  { slug: 'guia/carne-de-pasto-vs-confinamento',   query: 'cows grazing green pasture field' },
  { slug: 'mercado/panorama-semanal',              query: 'cattle feedlot brazil agriculture industry' },
  { slug: 'regioes/alta-mogiana',                  query: 'cattle ranch sao paulo brazilian countryside' },
  { slug: 'regioes/triangulo-mineiro',             query: 'nelore cattle brazil farm minas gerais' },
  { slug: 'regioes/pantanal',                      query: 'pantanal cattle wetlands brazil nature' },
  { slug: 'cotacao-arroba-boi-gordo-hoje',         query: 'nelore cattle sunset pasture brazil' },
];

import { spawnSync } from 'child_process';

async function buscar(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
  // Usar curl em vez de fetch — napi bloqueia node fetch mesmo com headers de browser
  const res = spawnSync('curl', ['-s', '-w', '\n%{http_code}', url], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (res.status !== 0) return { error: `curl error: ${res.stderr}` };
  const output = res.stdout;
  const lastNewline = output.lastIndexOf('\n');
  const httpCode = output.slice(lastNewline + 1).trim();
  const body = output.slice(0, lastNewline);
  if (httpCode !== '200') return { error: `HTTP ${httpCode}` };
  let data;
  try { data = JSON.parse(body); } catch (e) { return { error: `parse: ${e.message}` }; }
  if (!data.results || data.results.length === 0) return { error: 'no results' };
  return data.results.map(p => ({
    id: p.id,
    slug: p.slug,
    urls: p.urls,
    alt_description: p.alt_description,
    description: p.description,
    width: p.width,
    height: p.height,
  }));
}

console.log('Buscando fotos contextuais para cada artigo...\n');
for (const art of ARTIGOS) {
  console.log(`━━━ ${art.slug}`);
  console.log(`    query: "${art.query}"`);
  const results = await buscar(art.query);
  if (results.error) {
    console.log(`    ✗ ${results.error}\n`);
    continue;
  }
  results.forEach((r, i) => {
    const label = r.alt_description || r.slug.replace(/-[a-zA-Z0-9]{8,}$/, '').replace(/-/g, ' ');
    console.log(`    ${i + 1}. ${label}`);
    console.log(`       id: ${r.id}`);
    console.log(`       url: ${r.urls.raw.split('?')[0]}?w=1200&h=630&fit=crop`);
  });
  console.log('');
  // Anti-rate-limit delay
  await new Promise(r => setTimeout(r, 500));
}
