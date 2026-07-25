// ── JACKPOT PRIME · job de manutenção + pushes auditados ──
// Roda a cada 15 min (08h-21h BRT) via GitHub Actions. Idempotente:
// UNIQUE(ciclo_id, tipo) no jackpot_push_log garante que nenhum push ENTREGUE
// duplica, mesmo com cron frequente — falha é retentada (ver RETRY_MIN).
// Regra anti-spam: no máximo 1 push de ciclo por cliente por execução (o tier
// mais avançado aplicável).
'use strict';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ONESIGNAL_APP_ID = '204a1304-2cc4-44b8-af83-f35ceaabd504';
const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_KEY || '';
const SITE = 'https://carnesrodrigues.com.br';

if (!SUPABASE_URL || !SERVICE_KEY) { console.error('faltam secrets SUPABASE'); process.exit(1); }
const SB = {
  apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function sb(path, opts) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, Object.assign({ headers: SB }, opts || {}));
  const txt = await r.text();
  let json = null; try { json = JSON.parse(txt); } catch (e) {}
  return { status: r.status, json, txt };
}

const dias = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

// escadas (tier mais alto aplicável vence; 1 por execução)
const TIERS_CICLO = [
  { tipo: 'd29', min: 29, titulo: '🚨 ÚLTIMO DIA do seu prêmio!', msg: 'Seu resgate premiado expira HOJE. Toque e garanta seu corte — todo mundo ganha! 🥩' },
  { tipo: 'd27', min: 27, titulo: '⏳ Faltam 3 dias!', msg: 'Seu Jackpot Prime está quase expirando. Não deixe seus pontos pela metade!' },
  { tipo: 'd23', min: 23, titulo: '⏰ Uma semana pro seu prêmio sumir', msg: 'Seus 5.000 pontos viram um corte premium — mas só até o prazo. Corre! 🥩' },
  { tipo: 'd7', min: 7, titulo: '🥩 Seu prêmio te espera', msg: 'Você ainda não resgatou seu Jackpot Prime. Puxe a alavanca — todo mundo ganha!' },
  { tipo: 'd0', min: 0, titulo: '🎉 Você desbloqueou o JACKPOT PRIME!', msg: 'Seus 5.000 pontos valem um corte premium. Toque e descubra qual é o seu! 🥩' },
];
const TIERS_CUPOM = [
  { tipo: 'ret_d14', min: 14, titulo: '🚨 Último dia do cupom!', msg: 'Seu prêmio está separado no Empório — o cupom vence hoje!' },
  { tipo: 'ret_d10', min: 10, titulo: '🥩 Seu prêmio sente sua falta', msg: 'O cupom do seu corte premium vence em poucos dias. Passa aqui!' },
  { tipo: 'ret_d3', min: 3, titulo: '😋 Seu prêmio te espera no balcão', msg: 'Apresente o QR do app e leve seu corte premium pra casa!' },
];

async function push(clienteId, titulo, msg, cicloId, tipo) {
  let status = 0, osid = null, erro = null;
  if (!ONESIGNAL_KEY) { erro = 'sem ONESIGNAL_REST_KEY'; status = 0; }
  else {
    try {
      const r = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${ONESIGNAL_KEY}` },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_aliases: { external_id: [String(clienteId)] },
          target_channel: 'push',
          headings: { en: titulo, pt: titulo },
          contents: { en: msg, pt: msg },
          url: SITE + '/?jackpot=1'
        })
      });
      status = r.status;
      const j = await r.json().catch(() => null);
      osid = j && j.id || null;
      if (j && j.errors) erro = JSON.stringify(j.errors).slice(0, 180);
    } catch (e) { erro = String(e).slice(0, 180); status = 0; }
  }
  // log SEMPRE (auditoria). merge-duplicates (e não ignore): numa retentativa a
  // linha existente é ATUALIZADA com o resultado da nova tentativa, senão o
  // registro ficaria congelado no primeiro fracasso.
  await sb('jackpot_push_log?on_conflict=ciclo_id,tipo', {
    method: 'POST',
    headers: Object.assign({ Prefer: 'resolution=merge-duplicates' }, SB),
    body: JSON.stringify({
      ciclo_id: cicloId, cliente_id: clienteId, tipo,
      agendado_para: new Date().toISOString().slice(0, 10),
      onesignal_id: osid, http_status: status, erro
    })
  });
  // 200 com errors (ex.: invalid_aliases = ninguém inscrito naquele id) NÃO é entrega
  return status >= 200 && status < 300 && !erro;
}

(async () => {
  // 1) manutenção (expiração justa + renovação de cupons)
  const m = await sb('rpc/jackpot_manutencao', { method: 'POST', body: '{}' });
  console.log('manutencao:', m.status, JSON.stringify(m.json));

  const cfgR = await sb('jackpot_config?select=*&id=eq.1');
  const cfg = cfgR.json && cfgR.json[0];
  if (!cfg || !cfg.ativo) { console.log('programa desligado — só manutenção.'); return; }

  // Uma linha no push_log NÃO significa entrega: o OneSignal responde 200 com
  // `errors` quando ninguém está inscrito naquele external_id (invalid_aliases).
  // Tratar toda linha como "enviado" fazia um push falho nunca mais ser tentado —
  // foi assim que dois avisos ao dono se perderam em silêncio (13/06 e 25/07/2026).
  // Agora só entrega de fato bloqueia; falha é reenviada, com no mínimo RETRY_MIN
  // entre tentativas pra não martelar o OneSignal a cada tick do cron.
  const RETRY_MIN = 60;
  const logsR = await sb('jackpot_push_log?select=ciclo_id,tipo,erro,http_status,enviado_em');
  const entregues = new Set(), ultimaTentativa = new Map();
  for (const l of (logsR.json || [])) {
    const k = l.ciclo_id + ':' + l.tipo;
    if (l.http_status >= 200 && l.http_status < 300 && !l.erro) entregues.add(k);
    else if (l.enviado_em) ultimaTentativa.set(k, new Date(l.enviado_em).getTime());
  }
  const podeEnviar = k => {
    if (entregues.has(k)) return false;
    const t = ultimaTentativa.get(k);
    return !t || (Date.now() - t) / 60000 >= RETRY_MIN;
  };
  let ok = 0, fail = 0;

  // 2) ciclos vivos: PENDENTE (não liberado) avisa só o DONO; LIBERADO escala pro cliente
  const vivosR = await sb('jackpot_ciclos?select=*&status=in.(disponivel,ciente)');
  for (const c of (vivosR.json || [])) {
    if (!c.liberado_em) {
      // cliente bateu o gatilho → avisa O DONO pra definir o prêmio. Cliente NÃO é notificado ainda.
      if (podeEnviar(c.id + ':adm')) {
        const nomeR = await sb(`clientes?select=nome&id=eq.${c.cliente_id}`);
        const nome = (nomeR.json && nomeR.json[0] && nomeR.json[0].nome) || ('cliente #' + c.cliente_id);
        (await push(cfg.admin_cliente_id,
          '🎰 ' + nome + ' bateu ' + cfg.threshold + ' pontos!',
          'Defina o prêmio no admin pra LIBERAR o resgate pra ele.',
          c.id, 'adm')) ? ok++ : fail++;
      }
    } else {
      // já liberado pelo dono → escada do cliente, relativa à data de LIBERAÇÃO
      const idade = dias(c.liberado_em);
      const tier = TIERS_CICLO.find(t => idade >= t.min && podeEnviar(c.id + ':' + t.tipo));
      if (tier) (await push(c.cliente_id, tier.titulo, tier.msg, c.id, tier.tipo)) ? ok++ : fail++;
    }
  }

  // 3) escada de retirada (cupom emitido)
  const cuponsR = await sb('jackpot_ciclos?select=*&status=eq.cupom_emitido');
  for (const c of (cuponsR.json || [])) {
    const base = c.compartilhado_em || c.cupom_validade;
    const idade = c.compartilhado_em ? dias(c.compartilhado_em)
      : Math.max(0, (cfg.validade_cupom_dias || 15) - Math.ceil((new Date(c.cupom_validade) - Date.now()) / 86400000));
    const tier = TIERS_CUPOM.find(t => idade >= t.min && podeEnviar(c.id + ':' + t.tipo));
    if (tier) (await push(c.cliente_id, tier.titulo, tier.msg, c.id, tier.tipo)) ? ok++ : fail++;
  }

  // 4) pós-eventos do dia (entregue / expirado_metade) — agradecer / avisar
  const hoje = new Date(Date.now() - 86400000).toISOString();
  const entR = await sb(`jackpot_ciclos?select=*&status=eq.entregue&cupom_usado_em=gte.${hoje}`);
  for (const c of (entR.json || [])) {
    if (podeEnviar(c.id + ':pos')) {
      (await push(c.cliente_id, '🥩 Bom apetite!',
        'Prêmio entregue! Obrigado por fazer parte do Clube Prime — continue acumulando.',
        c.id, 'pos')) ? ok++ : fail++;
    }
  }
  const expR = await sb(`jackpot_ciclos?select=*&status=eq.expirado_metade&criado_em=gte.${hoje}`);
  for (const c of (expR.json || [])) {
    if (podeEnviar(c.id + ':exp')) {
      (await push(c.cliente_id, '😔 Seu prêmio expirou — mas calma',
        'Preservamos metade dos seus pontos. Continue comprando que o Jackpot volta rapidinho!',
        c.id, 'exp')) ? ok++ : fail++;
    }
  }

  console.log(`pushes ok=${ok} fail=${fail}`);
  if (fail > 0 && ok === 0) process.exit(1); // falha total → Action fica vermelha
})();
