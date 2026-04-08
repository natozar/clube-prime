/**
 * CLUBE PRIME SEO — Scraper de Cotação da Arroba do Boi Gordo
 * Fonte: CEPEA/Esalq (Indicador do Boi Gordo)
 *
 * Uso: node cotacao-scraper.js
 * Ambiente: SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidas
 */

const cheerio = await import('cheerio');

const CEPEA_URL = 'https://cepea.esalq.usp.br/br/indicador/boi-gordo.aspx';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.warn('AVISO: SUPABASE_SERVICE_KEY não definida — scraping de cotação pulado.');
}

// --- Scraping do CEPEA ---

async function scrapeCepea() {
  console.log('Buscando cotação do CEPEA/Esalq...');

  const response = await fetch(CEPEA_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`CEPEA retornou status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // A tabela do CEPEA tem os dados na última linha com classe "last"
  // Estrutura: Data | R$/@ à vista | Var. dia | Var. mês | R$/kg | US$/@
  const rows = [];

  // Procurar na tabela de indicadores
  $('table#imagenet-indicador1 tbody tr, table.responsive tbody tr, .table-content table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 3) {
      const dataText = $(cells[0]).text().trim();
      const precoText = $(cells[1]).text().trim();
      const variacaoText = $(cells[2]).text().trim();

      if (dataText && precoText) {
        rows.push({
          dataText,
          precoText,
          variacaoText
        });
      }
    }
  });

  // Se não encontrou na tabela principal, tentar seletores alternativos
  if (rows.length === 0) {
    $('.indicador-content table tbody tr, #tabs1 table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const dataText = $(cells[0]).text().trim();
        const precoText = $(cells[1]).text().trim();
        const variacaoText = $(cells[2]).text().trim();

        if (dataText && precoText) {
          rows.push({ dataText, precoText, variacaoText });
        }
      }
    });
  }

  if (rows.length === 0) {
    // Último fallback: qualquer tabela com dados numéricos no formato do CEPEA
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const dataText = $(cells[0]).text().trim();
        const precoText = $(cells[1]).text().trim();
        const variacaoText = $(cells[2]).text().trim();

        // Validar que parece cotação: data no formato DD/MM/YYYY e preço com vírgula
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataText) && /\d+,\d{2}$/.test(precoText)) {
          rows.push({ dataText, precoText, variacaoText });
        }
      }
    });
  }

  if (rows.length === 0) {
    throw new Error('Nenhum dado de cotação encontrado no CEPEA. O layout do site pode ter mudado.');
  }

  console.log(`Encontradas ${rows.length} linhas de cotação.`);

  // Converter para formato estruturado
  const cotacoes = rows.map(row => {
    // Data: DD/MM/YYYY → YYYY-MM-DD
    const [dia, mes, ano] = row.dataText.split('/');
    const data = `${ano}-${mes}-${dia}`;

    // Preço: "325,50" → 325.50
    const preco = parseFloat(row.precoText.replace(/\./g, '').replace(',', '.'));

    // Variação: "0,50%" ou "-0,30%" → 0.50 ou -0.30
    let variacao = null;
    if (row.variacaoText) {
      const varMatch = row.variacaoText.replace(/[%\s]/g, '').replace(',', '.');
      const parsed = parseFloat(varMatch);
      if (!isNaN(parsed)) variacao = parsed;
    }

    return { data, preco_rs: preco, variacao_pct: variacao };
  }).filter(c => !isNaN(c.preco_rs) && c.data.length === 10);

  return cotacoes;
}

// --- Salvar no Supabase ---

async function salvarCotacoes(cotacoes) {
  console.log(`Salvando ${cotacoes.length} cotações no Supabase...`);

  // Upsert (insert ou atualiza se data já existe)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/cotacao_arroba`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(cotacoes.map(c => ({
      data: c.data,
      preco_rs: c.preco_rs,
      variacao_pct: c.variacao_pct,
      fonte: 'CEPEA/Esalq'
    })))
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao salvar no Supabase: ${response.status} — ${error}`);
  }

  console.log('Cotações salvas com sucesso!');
}

// --- Buscar cotação mais recente (para exibir) ---

async function getCotacaoHoje() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/cotacao_arroba?order=data.desc&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  if (!response.ok) throw new Error('Erro ao buscar cotação');
  const [cotacao] = await response.json();
  return cotacao;
}

// --- Buscar histórico (para gráfico) ---

async function getHistorico(dias = 30) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/cotacao_arroba?order=data.desc&limit=${dias}`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  if (!response.ok) throw new Error('Erro ao buscar histórico');
  return response.json();
}

// --- Execução principal ---

async function main() {
  try {
    const cotacoes = await scrapeCepea();

    if (cotacoes.length > 0) {
      console.log('\nCotações encontradas:');
      cotacoes.forEach(c => {
        const varStr = c.variacao_pct !== null ? ` (${c.variacao_pct > 0 ? '+' : ''}${c.variacao_pct}%)` : '';
        console.log(`  ${c.data}: R$ ${c.preco_rs.toFixed(2)}/@ ${varStr}`);
      });

      await salvarCotacoes(cotacoes);

      // Mostrar a mais recente
      const hoje = await getCotacaoHoje();
      if (hoje) {
        console.log(`\n✓ Cotação mais recente: ${hoje.data} — R$ ${hoje.preco_rs}/@`);
      }
    } else {
      console.log('Nenhuma cotação nova para salvar.');
    }
  } catch (error) {
    console.error('ERRO:', error.message);
    if (isMain) process.exit(1);
  }
}

// Exportar funções para uso em outros scripts
export { scrapeCepea, salvarCotacoes, getCotacaoHoje, getHistorico };

// Executar só se chamado diretamente (não quando importado)
const isMain = !process.argv[1] || process.argv[1].includes('cotacao-scraper');
if (isMain) main();
