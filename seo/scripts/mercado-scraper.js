/**
 * CLUBE PRIME SEO — Scraper Multi-Indicadores de Mercado
 *
 * Indicadores: Dólar (BCB), Ouro (BCB), Petróleo (BCB), Milho (CEPEA), Soja (CEPEA)
 * Todas as fontes são APIs públicas gratuitas.
 */

const cheerio = await import('cheerio');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// --- APIs do Banco Central do Brasil (séries temporais) ---
// Série 1: Dólar comercial (venda)
// Série 4: Ouro BM&F (grama)
// Série 21619: Petróleo Brent (US$/barril) — via SGS/BCB

const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

async function fetchBCB(serie, ultimos = 30) {
  const url = `${BCB_BASE}.${serie}/dados/ultimos/${ultimos}?formato=json`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`BCB série ${serie}: HTTP ${res.status}`);
  return res.json();
}

function parseBCBDate(dateStr) {
  // BCB retorna DD/MM/YYYY
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m}-${d}`;
}

// --- Dólar Comercial (PTAX) ---
async function scrapeDolar() {
  console.log('  Buscando Dólar PTAX (BCB série 1)...');
  const dados = await fetchBCB(1, 30);
  return dados.map((d, i, arr) => {
    const valor = parseFloat(d.valor);
    const anterior = i > 0 ? parseFloat(arr[i - 1].valor) : null;
    const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
    return {
      data: parseBCBDate(d.data),
      indicador: 'dolar',
      valor,
      variacao_pct: variacao,
      fonte: 'BCB/PTAX'
    };
  });
}

// --- Ouro BM&F (grama em R$) ---
async function scrapeOuro() {
  console.log('  Buscando Ouro BM&F (BCB série 4)...');
  const dados = await fetchBCB(4, 30);
  return dados.map((d, i, arr) => {
    const valor = parseFloat(d.valor);
    const anterior = i > 0 ? parseFloat(arr[i - 1].valor) : null;
    const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
    return {
      data: parseBCBDate(d.data),
      indicador: 'ouro',
      valor,
      variacao_pct: variacao,
      fonte: 'BCB/BM&F'
    };
  });
}

// --- Petróleo Brent (US$/barril) via BCB série 21619 ---
async function scrapePetroleo() {
  console.log('  Buscando Petróleo Brent (BCB série 21619)...');
  try {
    const dados = await fetchBCB(21619, 30);
    return dados.map((d, i, arr) => {
      const valor = parseFloat(d.valor);
      const anterior = i > 0 ? parseFloat(arr[i - 1].valor) : null;
      const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
      return {
        data: parseBCBDate(d.data),
        indicador: 'petroleo',
        valor,
        variacao_pct: variacao,
        fonte: 'BCB/EIA'
      };
    });
  } catch (e) {
    // Fallback: tentar série 20812 (Brent FOB)
    console.warn('  Série 21619 falhou, tentando 20812...');
    const dados = await fetchBCB(20812, 30);
    return dados.map((d, i, arr) => {
      const valor = parseFloat(d.valor);
      const anterior = i > 0 ? parseFloat(arr[i - 1].valor) : null;
      const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
      return {
        data: parseBCBDate(d.data),
        indicador: 'petroleo',
        valor,
        variacao_pct: variacao,
        fonte: 'BCB/Brent'
      };
    });
  }
}

// --- CEPEA Scraper genérico ---
async function scrapeCEPEA(url, indicador) {
  console.log(`  Buscando ${indicador} (CEPEA)...`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    }
  });
  if (!response.ok) throw new Error(`CEPEA ${indicador}: HTTP ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);
  const rows = [];

  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 3) {
      const dataText = $(cells[0]).text().trim();
      const precoText = $(cells[1]).text().trim();
      const variacaoText = $(cells[2]).text().trim();

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataText) && /\d+,\d{2}$/.test(precoText)) {
        const [dia, mes, ano] = dataText.split('/');
        const valor = parseFloat(precoText.replace(/\./g, '').replace(',', '.'));
        let variacao = null;
        if (variacaoText) {
          const parsed = parseFloat(variacaoText.replace(/[%\s]/g, '').replace(',', '.'));
          if (!isNaN(parsed)) variacao = parsed;
        }
        if (!isNaN(valor)) {
          rows.push({
            data: `${ano}-${mes}-${dia}`,
            indicador,
            valor,
            variacao_pct: variacao,
            fonte: 'CEPEA/Esalq'
          });
        }
      }
    }
  });

  return rows;
}

// --- Milho (saca 60kg) ---
async function scrapeMilho() {
  return scrapeCEPEA('https://cepea.esalq.usp.br/br/indicador/milho.aspx', 'milho');
}

// --- Soja (saca 60kg) ---
async function scrapeSoja() {
  return scrapeCEPEA('https://cepea.esalq.usp.br/br/indicador/soja.aspx', 'soja');
}

// --- Salvar no Supabase ---
async function salvarIndicadores(dados) {
  if (!SUPABASE_SERVICE_KEY || dados.length === 0) return;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/mercado_indicadores`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(dados)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase: ${res.status} — ${err}`);
  }
}

// --- Buscar resumo (último valor de cada indicador) ---
async function getResumoMercado() {
  const key = SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
  const indicadores = ['dolar', 'petroleo', 'ouro', 'milho', 'soja'];
  const resumo = {};

  // Buscar boi gordo também
  try {
    const boiRes = await fetch(`${SUPABASE_URL}/rest/v1/cotacao_arroba?order=data.desc&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    if (boiRes.ok) {
      const [boi] = await boiRes.json();
      if (boi) resumo.boi = { valor: parseFloat(boi.preco_rs), variacao_pct: boi.variacao_pct ? parseFloat(boi.variacao_pct) : null, data: boi.data, fonte: boi.fonte };
    }
  } catch (e) { console.warn('Resumo boi falhou:', e.message); }

  for (const ind of indicadores) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/mercado_indicadores?indicador=eq.${ind}&order=data.desc&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      });
      if (res.ok) {
        const [row] = await res.json();
        if (row) resumo[ind] = { valor: parseFloat(row.valor), variacao_pct: row.variacao_pct ? parseFloat(row.variacao_pct) : null, data: row.data, fonte: row.fonte };
      }
    } catch (e) { console.warn(`Resumo ${ind} falhou:`, e.message); }
  }

  return resumo;
}

// --- Buscar histórico de um indicador ---
async function getHistoricoIndicador(indicador, dias = 30) {
  const key = SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/mercado_indicadores?indicador=eq.${indicador}&order=data.desc&limit=${dias}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (!res.ok) return [];
  return res.json();
}

// --- Execução principal ---
async function main() {
  console.log('=== CLUBE PRIME — Scraping Indicadores de Mercado ===\n');

  const scrapers = [
    { name: 'Dólar', fn: scrapeDolar },
    { name: 'Ouro', fn: scrapeOuro },
    { name: 'Petróleo', fn: scrapePetroleo },
    { name: 'Milho', fn: scrapeMilho },
    { name: 'Soja', fn: scrapeSoja },
  ];

  let totalSalvos = 0;

  for (const { name, fn } of scrapers) {
    try {
      const dados = await fn();
      console.log(`  ${name}: ${dados.length} registros`);
      if (dados.length > 0) {
        await salvarIndicadores(dados);
        totalSalvos += dados.length;
        const ultimo = dados[dados.length - 1];
        console.log(`  → Último: ${ultimo.data} = ${ultimo.valor}`);
      }
    } catch (e) {
      console.warn(`  ⚠ ${name} FALHOU: ${e.message}`);
    }
  }

  console.log(`\n✓ Total salvo: ${totalSalvos} registros`);

  // Mostrar resumo
  const resumo = await getResumoMercado();
  console.log('\nResumo do mercado:');
  for (const [k, v] of Object.entries(resumo)) {
    const varStr = v.variacao_pct ? ` (${v.variacao_pct > 0 ? '+' : ''}${v.variacao_pct}%)` : '';
    console.log(`  ${k}: ${v.valor}${varStr}`);
  }
}

export { scrapeDolar, scrapeOuro, scrapePetroleo, scrapeMilho, scrapeSoja, salvarIndicadores, getResumoMercado, getHistoricoIndicador };

main();
