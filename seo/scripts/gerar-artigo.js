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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';

const CATEGORIA_LABELS = {
  cotacao: 'Cotação da Arroba',
  raca: 'Raças',
  cruzamento: 'Cruzamentos',
  corte: 'Cortes',
  regiao: 'Regiões Produtoras',
  guia: 'Guia da Carne',
  churrasco: 'Churrasco',
  familia: 'Família',
  local: 'Em Ribeirão Preto'
};

const CATEGORIA_URLS = {
  cotacao: 'cotacao-arroba-boi-gordo-hoje',
  raca: 'racas/angus',
  cruzamento: 'cruzamentos/angus-x-nelore',
  corte: 'cortes/picanha',
  regiao: 'regioes/alta-mogiana',
  guia: 'guia/marmoreio-o-que-e',
  churrasco: 'churrasco/receita-costela-fogo-de-chao',
  familia: 'churrasco/receita-costela-fogo-de-chao',
  local: 'acougue-ribeirao-preto'
};

// Imagens temáticas por categoria para related cards (fallback quando slug não tem foto própria)
const CATEGORIA_THUMBS = {
  cotacao: 'https://carnesrodrigues.com.br/seo/assets/images/cotacao-arroba-boi-gordo-hoje-hero.jpg',
  raca: 'https://carnesrodrigues.com.br/seo/assets/images/racas-angus-hero.jpg',
  cruzamento: 'https://carnesrodrigues.com.br/seo/assets/images/racas-angus-hero.jpg',
  corte: 'https://carnesrodrigues.com.br/seo/assets/images/churrasco-receita-costela-fogo-de-chao-hero.jpg',
  regiao: 'https://carnesrodrigues.com.br/seo/assets/images/regioes-alta-mogiana-hero.jpg',
  guia: 'https://carnesrodrigues.com.br/seo/assets/images/cotacao-arroba-boi-gordo-hoje-hero.jpg',
  churrasco: 'https://carnesrodrigues.com.br/seo/assets/images/churrasco-receita-costela-fogo-de-chao-hero.jpg',
  familia: 'https://carnesrodrigues.com.br/seo/assets/images/churrasco-tradicao-churrasco-familia-hero.jpg',
  local: 'https://carnesrodrigues.com.br/seo/assets/images/churrasco-picanha-perfeita-hero.jpg'
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

  // Gerar Related HTML — usar imagem do artigo relacionado, ou thumb da categoria, ou default
  const relatedHtml = (dados.relacionados || []).map(r => {
    const thumbUrl = r.imageUrl || CATEGORIA_THUMBS[r.categoria] || 'https://carnesrodrigues.com.br/og-default.png';
    return `
                <a href="/${r.slug}" class="related-card">
                    <img src="${thumbUrl}" alt="${r.titulo}" width="400" height="225" loading="lazy">
                    <div class="related-card-body">
                        <h4>${r.titulo}</h4>
                        <span>${CATEGORIA_LABELS[r.categoria] || ''}</span>
                    </div>
                </a>`;
  }).join('');

  // Inserir mini-banners entre seções do conteúdo
  const conteudoComBanners = injetarMiniBanners(dados.conteudo, dados.categoria);

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
    // IMPORTANTE: sem UNSPLASH_ACCESS_KEY, dados.imageUrl é null e TODOS os
    // artigos gerados caem no og-default.png (logo do Clube Prime). Para ter
    // fotos temáticas diferentes por artigo, configurar UNSPLASH_ACCESS_KEY
    // nos secrets do GitHub Actions — aí buscarFoto() faz search por keyword.
    '{{IMAGE_URL}}': dados.imageUrl || 'https://carnesrodrigues.com.br/og-default.png',
    '{{HERO_IMAGE_SRC}}': dados.imageLocal || dados.imageUrl || 'https://carnesrodrigues.com.br/og-default.png',
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
    '{{CONTEUDO}}': conteudoComBanners,
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
  // slug "racas/angus" → /racas/angus/index.html (GitHub Pages clean URLs)
  const outputPath = join(SITE_ROOT, dados.slug, 'index.html');
  const outputDir = dirname(outputPath);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, template, 'utf8');

  console.log(`✓ Artigo gerado: ${outputPath}`);

  return outputPath;
}

// Mini-banners de pub contextual inseridos entre seções H2
const MINI_BANNERS = [
  // Empório — produto/serviço
  {
    html: `<a href="/" class="mini-banner mini-banner--gold" data-track="cta_emporio">
      <div class="mini-banner-icon">🥩</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Cortes premium no Empório Família Rodrigues</div>
        <div class="mini-banner-desc">Angus, Hereford e cruzamentos selecionados. Ribeirão Preto/SP.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['raca', 'cruzamento', 'corte', 'guia', 'local']
  },
  // Clube Prime — fidelidade
  {
    html: `<a href="/" class="mini-banner mini-banner--gold" data-track="cta_clube_inline">
      <div class="mini-banner-icon">🏆</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Clube Prime — Acumule pontos a cada compra</div>
        <div class="mini-banner-desc">Desconto exclusivo, acesso antecipado a cortes especiais e programa de indicação.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['raca', 'cruzamento', 'corte', 'guia', 'regiao', 'churrasco', 'familia', 'local']
  },
  // Cotação — informação
  {
    html: `<a href="/cotacao-arroba-boi-gordo-hoje" class="mini-banner mini-banner--cotacao" data-track="cta_cotacao_inline">
      <div class="mini-banner-icon">📈</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Cotação da arroba do boi gordo — atualizada hoje</div>
        <div class="mini-banner-desc">Gráfico de 30 dias, análise de mercado e tendência. Veja agora.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['raca', 'cruzamento', 'regiao', 'guia']
  },
  // Churrasco — receitas
  {
    html: `<a href="/churrasco/receita-costela-fogo-de-chao" class="mini-banner" data-track="cta_churrasco_inline">
      <div class="mini-banner-icon">🔥</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Costela no Fogo de Chão — Receita completa</div>
        <div class="mini-banner-desc">Tempo, temperatura e os segredos para carne que desfia no garfo.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['raca', 'corte', 'guia', 'cotacao', 'regiao']
  },
  // Calculadora
  {
    html: `<a href="/churrasco/quantidade-carne-por-pessoa" class="mini-banner" data-track="cta_calculadora_inline">
      <div class="mini-banner-icon">🧮</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Calculadora: quanta carne comprar para o churrasco?</div>
        <div class="mini-banner-desc">350g ou 500g por pessoa? Depende. Veja a conta certa.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['churrasco', 'corte', 'familia']
  },
  // Página comercial local (pilar) — reforça link interno para a página que converte
  {
    html: `<a href="/acougue-ribeirao-preto" class="mini-banner mini-banner--gold" data-track="cta_local_inline">
      <div class="mini-banner-icon">📍</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Onde comprar carne premium em Ribeirão Preto</div>
        <div class="mini-banner-desc">Cortes Angus da Alta Mogiana, com procedência. Peça pelo WhatsApp.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['raca', 'cruzamento', 'corte', 'guia', 'regiao', 'cotacao', 'churrasco']
  },
  // Afiliados
  {
    html: `<a href="/" class="mini-banner mini-banner--gold" data-track="cta_afiliado_inline">
      <div class="mini-banner-icon">🤝</div>
      <div class="mini-banner-text">
        <div class="mini-banner-title">Indique amigos e ganhe recompensas</div>
        <div class="mini-banner-desc">Programa de afiliados do Clube Prime — cada indicação conta pontos para você.</div>
      </div>
      <div class="mini-banner-arrow">›</div>
    </a>`,
    categorias: ['churrasco', 'familia']
  },
];

function injetarMiniBanners(conteudo, categoria) {
  // Encontrar posições dos H2 no conteúdo
  const h2Positions = [];
  let match;
  const h2Regex = /<h2>/gi;
  while ((match = h2Regex.exec(conteudo)) !== null) {
    h2Positions.push(match.index);
  }

  if (h2Positions.length < 3) return conteudo; // Artigo curto, não inserir

  // Selecionar banners relevantes para esta categoria
  const relevantes = MINI_BANNERS.filter(b => b.categorias.includes(categoria));
  if (relevantes.length === 0) return conteudo;

  // Inserir banner após o 2o H2 e após o 4o H2 (se existir)
  const insertPositions = [];
  if (h2Positions.length >= 3) insertPositions.push(h2Positions[2]); // antes do 3o H2
  if (h2Positions.length >= 5) insertPositions.push(h2Positions[4]); // antes do 5o H2

  // Montar conteúdo com banners inseridos (de trás pra frente para não deslocar índices)
  let resultado = conteudo;
  for (let i = insertPositions.length - 1; i >= 0; i--) {
    const pos = insertPositions[i];
    const banner = relevantes[i % relevantes.length];
    resultado = resultado.slice(0, pos) + '\n' + banner.html + '\n\n' + resultado.slice(pos);
  }

  return resultado;
}

function escapeJson(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Gera o HTML do painel de mercado a partir do resumo de indicadores
 * @param {Object} resumo - { boi: {valor, variacao_pct}, dolar: {...}, ... }
 * @param {boolean} completo - true = painel 6 cards, false = mini linha
 */
function gerarPainelMercado(resumo, completo = true) {
  if (!resumo || Object.keys(resumo).length === 0) return '';

  const indicadores = [
    { key: 'boi', icon: '🐂', label: 'Boi Gordo', prefix: 'R$', suffix: '/@', decimals: 2 },
    { key: 'dolar', icon: '💵', label: 'Dólar', prefix: 'R$', suffix: '', decimals: 4 },
    { key: 'petroleo', icon: '🛢️', label: 'Petróleo', prefix: 'US$', suffix: '/bbl', decimals: 2 },
    { key: 'ouro', icon: '🥇', label: 'Ouro', prefix: 'R$', suffix: '/g', decimals: 2 },
    { key: 'milho', icon: '🌽', label: 'Milho', prefix: 'R$', suffix: '/sc', decimals: 2 },
    { key: 'soja', icon: '🫘', label: 'Soja', prefix: 'R$', suffix: '/sc', decimals: 2 },
  ];

  if (!completo) {
    // Mini resumo em uma linha
    const items = indicadores.filter(i => resumo[i.key]).map(i => {
      const v = resumo[i.key];
      return `${i.label} ${i.prefix}${v.valor.toFixed(i.decimals)}`;
    });
    if (items.length === 0) return '';
    return `<div class="mini-banner mini-banner--cotacao" style="justify-content:center;text-align:center;flex-direction:column;gap:6px">
      <div class="mini-banner-title" style="font-size:0.78rem">Mercado hoje</div>
      <div class="mini-banner-desc" style="font-size:0.82rem;color:#D0D0D0">${items.join('  ·  ')}</div>
    </div>`;
  }

  // Painel completo
  const cards = indicadores.filter(i => resumo[i.key]).map(i => {
    const v = resumo[i.key];
    const varClass = v.variacao_pct > 0 ? 'up' : v.variacao_pct < 0 ? 'down' : 'neutral';
    const varStr = v.variacao_pct ? `${v.variacao_pct > 0 ? '+' : ''}${v.variacao_pct.toFixed(2)}%` : '—';
    const valorFmt = v.valor.toLocaleString('pt-BR', { minimumFractionDigits: i.decimals, maximumFractionDigits: i.decimals });
    return `<div class="painel-card">
        <div class="painel-card-icon">${i.icon}</div>
        <div class="painel-card-label">${i.label}</div>
        <div class="painel-card-valor">${i.prefix}${valorFmt}${i.suffix ? '<small style="font-size:0.7rem;color:var(--text-muted)">' + i.suffix + '</small>' : ''}</div>
        <div class="painel-card-var ${varClass}">${varStr}</div>
      </div>`;
  }).join('\n      ');

  return `<div class="painel-mercado">
    <div class="painel-mercado-title">📊 Painel de Mercado <small>atualizado diariamente</small></div>
    <div class="painel-grid">
      ${cards}
    </div>
    <a href="/mercado" class="painel-link">Ver todos os indicadores e gráficos →</a>
  </div>`;
}

export { gerarArtigo, gerarPainelMercado };

// CLI mode
if (process.argv[2]) {
  const jsonPath = process.argv[2];
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));
  await gerarArtigo(data);
}
