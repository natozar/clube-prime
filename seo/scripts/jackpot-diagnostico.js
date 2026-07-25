// ── JACKPOT · diagnóstico operacional (read-only por padrão) ──
// Roda só por workflow_dispatch. O repo é PÚBLICO, então o log é público:
// NUNCA imprima nome, telefone, device_id ou código de cupom. Só ids e flags.
// Com FIX=1 + ALVO=<cliente_id>, cria o ciclo faltante do cliente informado.
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const FIX = process.env.FIX === '1';
const ALVO = parseInt(process.env.ALVO || '0', 10);
const PILOTO_ADD = parseInt(process.env.PILOTO_ADD || '0', 10);

if (!SUPABASE_URL || !SERVICE_KEY) { console.error('faltam secrets SUPABASE'); process.exit(1); }

const SB = {
  apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function sb(path, opts) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, Object.assign({ headers: SB }, opts || {}));
  const txt = await r.text();
  let json = null; try { json = JSON.parse(txt); } catch (e) {}
  return { status: r.status, json, txt: txt.slice(0, 400) };
}

// remove qualquer campo que possa identificar cliente ou valer resgate
const SENSIVEL = /cupom|codigo|token|qr|telefone|nome|email|device|nascimento|cpf/i;
const limpar = row => {
  const o = {};
  for (const k of Object.keys(row || {})) if (!SENSIVEL.test(k)) o[k] = row[k];
  return o;
};

(async () => {
  // 1) config do programa
  const cfgR = await sb('jackpot_config?select=*');
  const cfg = cfgR.json && cfgR.json[0];
  if (!cfg) { console.log('CONFIG: AUSENTE', cfgR.status, cfgR.txt); return; }
  console.log('CONFIG:', JSON.stringify(limpar(cfg)));
  const threshold = cfg.threshold || 5000;

  // 2) colunas reais de jackpot_ciclos (via OpenAPI) — preciso pra montar o INSERT
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: SB });
    const spec = await r.json();
    const d = spec && spec.definitions && spec.definitions.jackpot_ciclos;
    if (d) {
      const cols = Object.entries(d.properties || {})
        .map(([k, v]) => `${k}:${v.format || v.type}${/required/.test(JSON.stringify(v.description||'')) ? '*' : ''}`);
      console.log('COLUNAS jackpot_ciclos:', cols.join(' | '));
      console.log('REQUIRED:', JSON.stringify(d.required || []));
    } else console.log('COLUNAS: definition ausente no OpenAPI');
  } catch (e) { console.log('COLUNAS: erro', String(e).slice(0, 120)); }

  // 3) quem está no/acima do gatilho
  const acimaR = await sb(`pontos?select=cliente_id,saldo&saldo=gte.${threshold}&order=saldo.desc`);
  const acima = acimaR.json || [];
  console.log(`ACIMA_DE_${threshold}: ${acima.length} cliente(s) ->`, JSON.stringify(acima));

  // 4) ciclos existentes (todos os status)
  const ciclosR = await sb('jackpot_ciclos?select=*&order=id.desc&limit=20');
  const ciclos = ciclosR.json || [];
  console.log(`CICLOS (total<=20): ${ciclos.length} ->`, JSON.stringify(ciclos.map(limpar)));

  // 5) catálogo — sem prêmio ativo o dono nem consegue liberar
  const catR = await sb('jackpot_catalogo?select=id,faixa,ativo');
  console.log('CATALOGO:', JSON.stringify(catR.json || []));

  // 6) eventos recentes — o trigger é blindado com EXCEPTION; se ele tentou e falhou,
  //    a pista aparece aqui (ou a ausência total prova que nem rodou)
  const evR = await sb('jackpot_eventos?select=id,ciclo_id,evento,criado_em&order=id.desc&limit=10');
  console.log('EVENTOS:', JSON.stringify(evR.json || []));

  // 7) push log — confirma se algum aviso já saiu algum dia
  // inclui `erro`: push que volta 200 COM errors (ex.: invalid_aliases = ninguem
  // inscrito naquele external_id) nao e entrega, e so o campo erro revela isso.
  const plR = await sb('jackpot_push_log?select=id,ciclo_id,tipo,http_status,erro,criado_em&order=id.desc&limit=10');
  console.log('PUSH_LOG:', JSON.stringify(plR.json || []));

  // ── veredito ──
  const comCicloVivo = new Set(ciclos
    .filter(c => !['entregue', 'expirado_metade', 'expirado_sem_aviso'].includes(c.status))
    .map(c => c.cliente_id));
  const orfaos = acima.filter(p => !comCicloVivo.has(p.cliente_id));
  console.log('VEREDITO: orfaos (>= gatilho, sem ciclo vivo) =', JSON.stringify(orfaos.map(o => o.cliente_id)));

  if (!FIX) { console.log('modo read-only. Para corrigir: FIX=1 e ALVO=<cliente_id>.'); return; }

  // libera o cliente no piloto ANTES de criar o ciclo — sem isso a RPC do app
  // continua tratando ele como fora do programa.
  if (PILOTO_ADD) {
    const atual = Array.isArray(cfg.piloto_clientes) ? cfg.piloto_clientes : [];
    if (atual.includes(PILOTO_ADD)) {
      console.log(`PILOTO: ${PILOTO_ADD} já estava na lista.`);
    } else {
      const nova = atual.concat([PILOTO_ADD]);
      const up = await sb('jackpot_config?id=eq.1', {
        method: 'PATCH',
        headers: Object.assign({ Prefer: 'return=representation' }, SB),
        body: JSON.stringify({ piloto_clientes: nova, atualizado_em: new Date().toISOString() })
      });
      console.log('PILOTO atualizado:', up.status, JSON.stringify((up.json || []).map(limpar)));
    }
  }

  if (!ALVO) { console.log('FIX pedido mas ALVO vazio — nada feito.'); return; }
  const alvo = orfaos.find(o => o.cliente_id === ALVO);
  if (!alvo) { console.log(`ALVO ${ALVO} não está órfão — nada feito (evita ciclo duplicado).`); return; }

  // cria o ciclo que o trigger deveria ter criado. Sem liberado_em de propósito:
  // quem define o prêmio e libera é o dono, no admin.
  const dias = cfg.prazo_ciclo_dias || 30;
  const expira = new Date(Date.now() + dias * 86400000).toISOString();
  const ins = await sb('jackpot_ciclos', {
    method: 'POST',
    headers: Object.assign({ Prefer: 'return=representation' }, SB),
    body: JSON.stringify({
      cliente_id: ALVO, status: 'disponivel',
      desbloqueado_em: new Date().toISOString(), expira_em: expira
    })
  });
  console.log('INSERT ciclo:', ins.status, JSON.stringify((ins.json || []).map(limpar)) || ins.txt);
})();
