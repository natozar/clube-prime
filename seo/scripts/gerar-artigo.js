/**
 * CLUBE PRIME SEO — Gerador de Artigos
 *
 * Recebe dados do artigo (JSON) e gera o HTML final a partir do template.
 *
 * Uso: node gerar-artigo.js artigo.json
 * Ou importar: import { gerarArtigo } from './gerar-artigo.js'
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAnalyticsSnippet } from './analytics-snippet.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '..', 'templates', 'artigo.html');
const SITE_ROOT = join(__dirname, '..', '..');

const SUPABASE_URL = 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';

const CATEGORIA_LABELS = {
  cotacao: 'Cotação da Arroba',
  raca: 'Raças',
  cruzamento: 'Cruzamentos',
  corte: 'Cortes',
  regiao: 'Regiões Produtoras',
  guia: 'Guia da Carne',
  churrasco: 'Churrasco',
  familia: 'Família'
};

const CATEGORIA_URLS = {
  cotacao: 'cotacao-arroba-boi-gordo-hoje',
  raca: 'racas/angus',
  cruzamento: 'cruzamentos/angus-x-nelore',
  corte: 'cortes/picanha',
  regiao: 'regioes/alta-mogiana',
  guia: 'guia/marmoreio-o-que-e',
  churrasco: 'churrasco/receita-costela-fogo-de-chao',
  familia: 'churrasco/receita-costela-fogo-de-chao'
};

/**
 * Gera um artigo HTML completo
 * @param {Object} dados - Dados do artigo
 * @param {string} dados.slug - URL slug (ex: "racas/angus")
 * @param {string} dados.titulo - Título H1
 * @param {string} dados.tituloCurto - Título para breadcrumb
 * @param {string} dados.categoria - Categoria (cotacao, raca, etc)
 * @param {string} dados.metaDescription - Meta description (max 155 chars)
 * @param {string} dados.ogDescription - OG description (curta, chamativa)
 * @param {string} dados.conteudo - Conteúdo HTML (H2s, parágrafos, etc)
 * @param {string} dados.blocoClube - Texto contextual do bloco Clube Prime
 * @param {Array} dados.faq - Array de {pergunta, resposta}
 * @param {string} dados.imageAlt - Alt text da imagem
 * @param {string} dados.imageCredit - Crédito da foto
 * @param {Array} dados.relacionados - Array de {slug, titulo, imagem}
 * @param {string} dados.schemaExtra - Schema.org adicional (Recipe, Dataset, etc)
 * @param {number} dados.tempoLeitura - Tempo de leitura em minutos
 */
async function gerarArtigo(dados) {
  let template = await readFile(TEMPLATE_PATH, 'utf8');

  const dataPublicacao = new Date().toISOString();
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const ano = new Date().getFullYear();

  // Gerar FAQ HTML
  const faqHtml = (dados.faq || []).map(f => `
            <div class="faq-item">
                <p class="faq-q">${f.pergunta}</p>
                <p class="faq-a">${f.resposta}</p>
            </div>`).join('');

  // Gerar FAQ Schema
  const faqSchema = (dados.faq || []).map(f =>
    `{"@type": "Question", "name": "${escapeJson(f.pergunta)}", "acceptedAnswer": {"@type": "Answer", "text": "${escapeJson(f.resposta)}"}}`
  ).join(',\n            ');

  // Gerar Related HTML
  const relatedHtml = (dados.relacionados || []).map(r => `
                <a href="/${r.slug}" class="related-card">
                    <img src="/seo/assets/images/${r.slug.replace(/\//g, '-')}-hero.jpg" alt="${r.titulo}" width="400" height="225" loading="lazy">
                    <div class="related-card-body">
                        <h4>${r.titulo}</h4>
                        <span>${CATEGORIA_LABELS[r.categoria] || ''}</span>
                    </div>
                </a>`).join('');

  // Share text para WhatsApp
  const shareText = encodeURIComponent(`${dados.titulo} — Leia no Clube Prime: https://carnesrodrigues.com.br/${dados.slug}`);

  // Analytics
  const analyticsSnippet = getAnalyticsSnippet(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Substituições
  const replacements = {
    '{{TITULO}}': dados.titulo,
    '{{TITULO_CURTO}}': dados.tituloCurto || dados.titulo,
    '{{SLUG}}': dados.slug,
    '{{IMAGE_SLUG}}': dados.slug.replace(/\//g, '-'),
    '{{META_DESCRIPTION}}': dados.metaDescription,
    '{{OG_DESCRIPTION}}': dados.ogDescription || dados.metaDescription,
    '{{CATEGORIA}}': dados.categoria,
    '{{TAG_LABEL}}': CATEGORIA_LABELS[dados.categoria] || dados.categoria,
    '{{BREADCRUMB_CATEGORIA}}': CATEGORIA_LABELS[dados.categoria] || dados.categoria,
    '{{BREADCRUMB_URL}}': CATEGORIA_URLS[dados.categoria] || dados.slug,
    '{{DATA_PUBLICACAO}}': dataPublicacao,
    '{{DATA_FORMATADA}}': dataFormatada,
    '{{ANO}}': ano.toString(),
    '{{TEMPO_LEITURA}}': (dados.tempoLeitura || 7).toString(),
    '{{IMAGE_ALT}}': dados.imageAlt || dados.titulo,
    '{{IMAGE_CREDIT}}': dados.imageCredit || '',
    '{{CONTEUDO}}': dados.conteudo,
    '{{BLOCO_CLUBE}}': dados.blocoClube,
    '{{FAQ_HTML}}': faqHtml,
    '{{FAQ_SCHEMA}}': faqSchema,
    '{{SCHEMA_EXTRA}}': dados.schemaExtra || '',
    '{{RELATED_HTML}}': relatedHtml,
    '{{SHARE_TEXT_ENCODED}}': shareText,
    '{{ANALYTICS_SNIPPET}}': analyticsSnippet,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replaceAll(key, value);
  }

  // Determinar caminho de saída
  // slug "racas/angus" → /racas/angus.html  (GitHub Pages)
  // slug "cotacao-arroba-boi-gordo-hoje" → /cotacao-arroba-boi-gordo-hoje.html
  const outputPath = join(SITE_ROOT, `${dados.slug}.html`);
  const outputDir = dirname(outputPath);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, template, 'utf8');

  console.log(`✓ Artigo gerado: ${outputPath}`);

  return outputPath;
}

function escapeJson(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export { gerarArtigo };

// CLI mode
if (process.argv[2]) {
  const jsonPath = process.argv[2];
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  await gerarArtigo(data);
}
