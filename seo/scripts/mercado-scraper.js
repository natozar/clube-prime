/**
 * CLUBE PRIME SEO — Scraper Multi-Indicadores de Mercado
 *
 * Fontes reais e gratuitas:
 * - Dólar PTAX: BCB série 1 (api.bcb.gov.br)
 * - Ouro: AwesomeAPI XAU-BRL convertido para g
 * - Petróleo WTI: Yahoo Finance (CL=F)
 * - Milho e Soja: CEPEA/Esalq (scraping HTML)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ────────────────────────────────────────────────
// DÓLAR — BCB Série 1 (PTAX Venda)
// ────────────────────────────────────────────────
async function scrapeDolar() {
  console.log('  Dólar PTAX (BCB série 1)...');
  const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/20?formato=json', {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`BCB Dólar: HTTP ${res.status}`);
  const dados = await res.json();

  return dados.map((d, i, arr) => {
    const [dia, mes, ano] = d.data.split('/');
    const valor = parseFloat(d.valor);
    const anterior = i > 0 ? parseFloat(arr[i - 1].valor) : null;
    const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
    return { data: `${ano}-${mes}-${dia}`, indicador: 'dolar', valor, variacao_pct: variacao, fonte: 'BCB/PTAX' };
  });
}

// ────────────────────────────────────────────────
// OURO — AwesomeAPI XAU-BRL (onça troy → grama)
// ────────────────────────────────────────────────
async function scrapeOuro() {
  console.log('  Ouro (AwesomeAPI XAU-BRL → R$/g)...');
  const res = await fetch('https://economia.awesomeapi.com.br/json/daily/XAU-BRL/30');
  if (!res.ok) throw new Error(`AwesomeAPI Ouro: HTTP ${res.status}`);
  const dados = await res.json();

  // AwesomeAPI retorna do mais recente ao mais antigo
  const sorted = dados.slice().reverse();
  return sorted.map((d, i, arr) => {
    const data = new Date(d.timestamp * 1000).toISOString().split('T')[0];
    const valor = parseFloat((parseFloat(d.bid) / 31.1035).toFixed(2)); // onça → grama
    const anterior = i > 0 ? parseFloat((parseFloat(arr[i - 1].bid) / 31.1035).toFixed(2)) : null;
    const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
    return { data, indicador: 'ouro', valor, variacao_pct: variacao, fonte: 'AwesomeAPI/XAU' };
  });
}

// ────────────────────────────────────────────────
// PETRÓLEO WTI — Yahoo Finance (CL=F)
// ────────────────────────────────────────────────
async function scrapePetroleo() {
  console.log('  Petróleo WTI (Yahoo Finance CL=F)...');
  const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?range=1mo&interval=1d', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  if (!res.ok) throw new Error(`Yahoo Petróleo: HTTP ${res.status}`);
  const json = await res.json();

  const result = json.chart?.result?.[0];
  if (!result) throw new Error('Yahoo: sem dados');

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  return timestamps.map((t, i, arr) => {
    const data = new Date(t * 1000).toISOString().split('T')[0];
    const valor = closes[i] ? parseFloat(closes[i].toFixed(2)) : null;
    if (!valor) return null;
    const anterior = i > 0 && closes[i - 1] ? parseFloat(closes[i - 1].toFixed(2)) : null;
    const variacao = anterior ? parseFloat(((valor - anterior) / anterior * 100).toFixed(2)) : null;
    return { data, indicador: 'petroleo', valor, variacao_pct: variacao, fonte: 'Yahoo/WTI' };
  }).filter(Boolean);
}

// ────────────────────────────────────────────────
// MILHO e SOJA — Yahoo Finance (CBOT futures → R$/saca 60kg)
// CEPEA está atrás de Cloudflare, então usamos futuros CBOT
// convertidos para R$/saca usando o dólar do dia
// ────────────────────────────────────────────────
const MILHO_BUSHEL_KG = 25.4;   // 1 bushel milho = 25.4 kg
const SOJA_BUSHEL_KG = 27.216;  // 1 bushel soja = 27.216 kg
const SACA_KG = 60;

async function getDolarHoje() {
  const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json', {
    headers: { 'Accept': 'application/json' }
  });
  const [d] = await r.json();
  return parseFloat(d.valor);
}

async function scrapeYahooCommodity(symbol, indicador, bushelKg) {
  console.log(`  ${indicador} (Yahoo Finance ${symbol} → R$/sc)...`);
  const usd = await getDolarHoje();
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  if (!r.ok) throw new Error(`Yahoo ${indicador}: HTTP ${r.status}`);
  const j = await r.json();
  const res = j.chart?.result?.[0];
  if (!res) throw new Error(`Yahoo ${indicador}: sem dados`);

  const ts = res.timestamp || [];
  const cl = res.indicators?.quote?.[0]?.close || [];

  return ts.map((t, i) => {
    if (!cl[i]) return null;
    const data = new Date(t * 1000).toISOString().split('T')[0];
    const usdPerBushel = cl[i] / 100; // cents → dollars
    const brlPerSaca = parseFloat((usdPerBushel / bushelKg * SACA_KG * usd).toFixed(2));
    const anterior = i > 0 && cl[i - 1] ? cl[i - 1] : null;
    const variacao = anterior ? parseFloat(((cl[i] - anterior) / anterior * 100).toFixed(2)) : null;
    return { data, indicador, valor: brlPerSaca, variacao_pct: variacao, fonte: 'Yahoo/CBOT' };
  }).filter(Boolean);
}

async function scrapeMilho() { return scrapeYahooCommodity('ZC=F', 'milho', MILHO_BUSHEL_KG); }
async function scrapeSoja() { return scrapeYahooCommodity('ZS=F', 'soja', SOJA_BUSHEL_KG); }

// ────────────────────────────────────────────────
// Salvar no Supabase (upsert)
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// Resumo (último valor de cada indicador)
// ────────────────────────────────────────────────
async function getResumoMercado() {
  const key = SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
  const H = { 'apikey': key, 'Authorization': `Bearer ${key}` };
  const resumo = {};

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cotacao_arroba?order=data.desc&limit=1`, { headers: H });
    if (r.ok) { const [boi] = await r.json(); if (boi) resumo.boi = { valor: parseFloat(boi.preco_rs), variacao_pct: boi.variacao_pct ? parseFloat(boi.variacao_pct) : null }; }
  } catch (e) {}

  for (const ind of ['dolar', 'petroleo', 'ouro', 'milho', 'soja']) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/mercado_indicadores?indicador=eq.${ind}&order=data.desc&limit=1`, { headers: H });
      if (r.ok) { const [row] = await r.json(); if (row) resumo[ind] = { valor: parseFloat(row.valor), variacao_pct: row.variacao_pct ? parseFloat(row.variacao_pct) : null }; }
    } catch (e) {}
  }

  return resumo;
}

async function getHistoricoIndicador(indicador, dias = 30) {
  const key = SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
  const r = await fetch(`${SUPABASE_URL}/rest/v1/mercado_indicadores?indicador=eq.${indicador}&order=data.desc&limit=${dias}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (!r.ok) return [];
  return r.json();
}

// ────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────
async function main() {
  console.log('=== CLUBE PRIME — Scraping Indicadores de Mercado ===\n');

  const scrapers = [
    { name: 'Dólar', fn: scrapeDolar },
    { name: 'Ouro', fn: scrapeOuro },
    { name: 'Petróleo WTI', fn: scrapePetroleo },
    { name: 'Milho', fn: scrapeMilho },
    { name: 'Soja', fn: scrapeSoja },
  ];

  let totalSalvos = 0;

  for (const { name, fn } of scrapers) {
    try {
      const dados = await fn();
      console.log(`  ${name}: ${dados.length} registros`);
      if (dados.length > 0 && SUPABASE_SERVICE_KEY) {
        await salvarIndicadores(dados);
        totalSalvos += dados.length;
        const ultimo = dados[dados.length - 1];
        console.log(`  → Último: ${ultimo.data} = ${ultimo.valor}`);
      }
    } catch (e) {
      console.warn(`  ⚠ ${name} FALHOU: ${e.message}`);
    }
  }

  console.log(`\n✓ Total: ${totalSalvos} registros salvos`);

  if (SUPABASE_SERVICE_KEY) {
    const resumo = await getResumoMercado();
    console.log('\nResumo atual:');
    for (const [k, v] of Object.entries(resumo)) {
      const vs = v.variacao_pct ? ` (${v.variacao_pct > 0 ? '+' : ''}${v.variacao_pct}%)` : '';
      console.log(`  ${k}: ${v.valor}${vs}`);
    }
  }
}

export { scrapeDolar, scrapeOuro, scrapePetroleo, scrapeMilho, scrapeSoja, salvarIndicadores, getResumoMercado, getHistoricoIndicador };

// Executar só se chamado diretamente
const isMain = !process.argv[1] || process.argv[1].includes('mercado-scraper');
if (isMain) main();
