/**
 * CLUBE PRIME SEO — Geração imediata das páginas comerciais locais
 *
 * Gera os index.html de todas as páginas de LOCAL_COMERCIAL de uma vez, para
 * que entrem no ar já (sem esperar a rotação semanal de segunda/sexta).
 *
 * As fotos usam assets temáticos já existentes no repo. Quando a rotação
 * semanal republicar a página, buscarFoto() troca por uma foto fresca do
 * Unsplash (agora com gate de relevância).
 *
 * Uso: node seo/scripts/gerar-locais.js
 */

import { gerarArtigo } from './gerar-artigo.js';
import { LOCAL_COMERCIAL } from './artigos-locais.js';

// Foto temática (já no repo) por slug — alt descritivo para acessibilidade/SEO
const FOTOS = {
  'acougue-ribeirao-preto':         { file: 'racas-angus-hero.jpg',                         alt: 'Carne bovina premium Angus — Empório Família Rodrigues, Ribeirão Preto' },
  'comprar-picanha-ribeirao-preto': { file: 'churrasco-picanha-perfeita-hero.jpg',          alt: 'Picanha premium na grelha — Empório Família Rodrigues, Ribeirão Preto' },
  'carne-para-churrasco-ribeirao-preto': { file: 'churrasco-tradicao-churrasco-familia-hero.jpg', alt: 'Churrasco em família com cortes premium — Ribeirão Preto' },
  'delivery-carne-ribeirao-preto':  { file: 'churrasco-fraldinha-na-brasa-hero.jpg',        alt: 'Cortes frescos para churrasco — delivery em Ribeirão Preto' },
};

for (const artigo of LOCAL_COMERCIAL) {
  const foto = FOTOS[artigo.slug];
  if (foto) {
    artigo.imageLocal = `/seo/assets/images/${foto.file}`;
    artigo.imageUrl = `https://carnesrodrigues.com.br/seo/assets/images/${foto.file}`;
    artigo.imageAlt = foto.alt;
    artigo.imageCredit = '';
  }
  artigo.painelMercado = ''; // páginas locais não mostram painel agro
  const out = await gerarArtigo(artigo);
  console.log(`✓ ${artigo.slug} → ${out}`);
}

console.log(`\n✓ ${LOCAL_COMERCIAL.length} páginas locais geradas.`);
