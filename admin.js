// ── SUPORTE: CAPTURA GLOBAL DE ERROS ────────────────────
// Buffer circular em memória (até 30 erros). Usado pela aba Suporte
// para anexar stack traces ao prompt enviado à IA.
window.__clubeErros = window.__clubeErros || [];
(function() {
  var MAX = 30;
  function push(entry) {
    try {
      window.__clubeErros.push(entry);
      if (window.__clubeErros.length > MAX) window.__clubeErros.shift();
    } catch (e) {}
  }
  window.addEventListener('error', function(ev) {
    push({
      t: new Date().toISOString(),
      tipo: 'error',
      msg: (ev && ev.message) || 'erro sem mensagem',
      fonte: (ev && ev.filename) || '',
      linha: (ev && ev.lineno) || 0,
      coluna: (ev && ev.colno) || 0,
      stack: (ev && ev.error && ev.error.stack) ? String(ev.error.stack).slice(0, 1200) : ''
    });
  });
  window.addEventListener('unhandledrejection', function(ev) {
    var reason = ev && ev.reason;
    push({
      t: new Date().toISOString(),
      tipo: 'promise',
      msg: reason && reason.message ? reason.message : String(reason),
      stack: reason && reason.stack ? String(reason.stack).slice(0, 1200) : ''
    });
  });
})();

// ── EVENT DELEGATION ────────────────────────────────────
// Replaces inline event handlers for CSP compliance
(function() {
  document.addEventListener('click', function(e) {
    // data-action: call named function
    var el = e.target.closest('[data-action]');
    if (el) {
      var action = el.dataset.action;
      var arg = el.dataset.arg;
      var id = el.dataset.id;
      var dir = el.dataset.dir;
      var val = el.dataset.val;
      var slug = el.dataset.slug;
      var nome = el.dataset.nome;
      if (action === 'toggleSelf') { el.classList.toggle('on'); return; }
      if (typeof window[action] === 'function') {
        if (slug !== undefined && val !== undefined) {
          window[action](slug, val === 'true');
        } else if (slug !== undefined) {
          window[action](slug);
        } else if (id !== undefined && dir !== undefined) {
          window[action](parseInt(id), parseInt(dir));
        } else if (id !== undefined && val !== undefined) {
          window[action](parseInt(id), val === 'true' || val === 'false' ? val === 'true' : val);
        } else if (id !== undefined && nome !== undefined) {
          window[action](parseInt(id), nome);
        } else if (id !== undefined) {
          window[action](parseInt(id), el);
        } else if (arg !== undefined) {
          window[action](arg);
        } else {
          window[action]();
        }
      }
      return;
    }
    // data-tab: admin tab navigation
    el = e.target.closest('[data-tab]');
    if (el) {
      A(el.dataset.tab, el);
      return;
    }
    // data-modal-open / data-modal-close
    el = e.target.closest('[data-modal-open]');
    if (el) {
      var m = document.getElementById(el.dataset.modalOpen);
      if (m) m.classList.add('open');
      return;
    }
    el = e.target.closest('[data-modal-close]');
    if (el) {
      var m = document.getElementById(el.dataset.modalClose);
      if (m) m.classList.remove('open');
      return;
    }
  });

  // Input delegation
  document.addEventListener('input', function(e) {
    if (e.target.dataset.oninput && typeof window[e.target.dataset.oninput] === 'function') {
      window[e.target.dataset.oninput]();
    }
  });

  // Keydown delegation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.dataset.enterAction) {
      if (typeof window[e.target.dataset.enterAction] === 'function') {
        window[e.target.dataset.enterAction]();
      }
    }
  });

  // Change delegation
  document.addEventListener('change', function(e) {
    if (e.target.dataset.onchange && typeof window[e.target.dataset.onchange] === 'function') {
      window[e.target.dataset.onchange]();
    }
  });
})();


// ── SUPABASE ──────────────────────────────────────────────
const SUPA_URL = 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
// Headers autenticados (EXIGE token do admin — reads e writes rodam como role authenticated,
// evitando vazamento via anon Bearer e permitindo RLS deny-all para anon)
function authHeaders() {
  if (!authToken) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  return { apikey: SUPA_KEY, Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };
}

// ── SUPABASE AUTH ─────────────────────────────────────────
const supabaseClient = supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    persistSession: true,           // Manter sessão entre recarregamentos (padrão)
    autoRefreshToken: true,          // Renovar JWT automaticamente antes de expirar
    detectSessionInUrl: true,        // Detectar tokens de OAuth na URL
    storageKey: 'clube-admin-auth',  // Chave única para evitar conflito com cliente
    storage: window.localStorage     // Persistir no localStorage
  }
});
let authToken = null; // JWT token do admin autenticado

// ── SESSÃO ADMIN — MONITORAMENTO GLOBAL ─────────────────
// Registrar listener de auth state GLOBALMENTE (não só no login)
// Isso garante que o refresh token funcione mesmo após recarregar a página
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    authToken = session.access_token;
    // Renovação automática funcionando
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token admin renovado automaticamente');
    }
  } else {
    // Sessão perdida (expirou ou logout)
    if (authToken) {
      authToken = null;
      fazerLogout();
    }
  }
});

// Sanitização contra XSS (fallback seguro caso DOMPurify falhe no carregamento)
function escapeHTML(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
function sanitize(html) { return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : escapeHTML(String(html)); }
function safeInnerHTML(el, html) { el.innerHTML = sanitize(html); }

// ── ONESIGNAL ─────────────────────────────────────────────
const ONESIGNAL_APP_ID = '204a1304-2cc4-44b8-af83-f35ceaabd504';
// REST API Key agora fica APENAS na Edge Function (server-side) por segurança
const ONESIGNAL_PUSH_URL = `${SUPA_URL}/functions/v1/onesignal-push`;

window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
  });
  // Registrar este dispositivo como admin para receber notificações de novos clientes
  try {
    await OneSignal.User.addTag('role', 'admin');
    // Pedir permissão de notificação se ainda não concedida
    const permission = await OneSignal.Notifications.permission;
    if (!permission) {
      await OneSignal.Notifications.requestPermission();
    }
  } catch(e) { console.warn('OneSignal admin tag:', e); }
});

// Envia push notification para um cliente específico via Edge Function (server-side)
// Para funcionar: no index.html, ao cadastrar/logar, chamar:
//   OneSignal.login(cliente.id)   ← vincula o dispositivo ao ID do cliente
async function notificarCliente(clienteId, pontos, novoSaldo) {
  try {
    await fetch(ONESIGNAL_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        type: 'cliente',
        clienteId: String(clienteId),
        pontos,
        novoSaldo
      })
    });
  } catch(e) { console.warn('OneSignal notificação falhou:', e); }
}

// Envia push para TODOS os assinantes via Edge Function (server-side)
async function enviarCampanha(titulo, mensagem, url) {
  try {
    const r = await fetch(ONESIGNAL_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        type: 'campanha',
        titulo,
        mensagem,
        url: url || 'https://carnesrodrigues.com.br/',
      })
    });
    if (!r.ok) throw new Error('Erro HTTP ' + r.status);
    const d = await r.json();
    if (d.error) throw new Error(typeof d.error === 'string' ? d.error : (d.error.message || 'Erro desconhecido'));
    return true;
  } catch(e) { console.error('enviarCampanha:', e); alert('Erro ao enviar campanha: ' + e.message); return false; }
}

// Listar todos os clientes
async function listarClientes() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/clientes?select=*&order=id.desc&limit=50`, { headers: authHeaders() });
    if (!r.ok) { console.error('listarClientes: status', r.status); return; }
    const lista = await r.json();
    const el = document.getElementById('clientes-lista');
    const rankEl = document.getElementById('ranking-lista');
    const alertEl = document.getElementById('alertas-lista');
    if(el) {
      el.innerHTML = !lista.length ? '<p style="opacity:.5;padding:8px">Nenhum cliente cadastrado</p>' // SANITIZED: static or sanitize() on all dynamic data
        : lista.map(c=>{
          const temDevice = c.device_id ? '<span style="font-size:8px;background:#27ae60;color:#fff;padding:1px 5px;border-radius:4px">📱 Vinculado</span>' : '<span style="font-size:8px;background:#555;color:#aaa;padding:1px 5px;border-radius:4px">Sem dispositivo</span>';
          const btnLiberar = c.device_id ? `<button class="btn bo" style="font-size:8px;padding:2px 6px;border-radius:4px" data-action="liberarDispositivoClientePorId" data-id="${c.id}" data-nome="${sanitize(c.nome)}">📱 Liberar</button>` : '';
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #333">
          <div><div style="font-weight:600">${sanitize(c.nome)}</div><div style="opacity:.6;font-size:12px">${sanitize(c.codigo)} · ${sanitize(c.telefone)}</div></div>
          <div style="display:flex;align-items:center;gap:6px">${temDevice}${btnLiberar}</div></div>`;
        }).join('');
    }
    if(rankEl) {
      rankEl.innerHTML = lista.slice(0,10).map((c,i)=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333">
        <span style="opacity:.5;margin-right:8px">${i+1}º</span><span>${sanitize(c.nome)}</span><span style="opacity:.6;font-size:12px">${sanitize(c.codigo)}</span></div>`).join('') // SANITIZED
        || '<p style="opacity:.5;padding:8px">Sem dados</p>';
    }
    if(alertEl) {
      const hoje = new Date();
      const venc = []; // TODO: implementar verificação de vencimento baseada em última transação
      alertEl.innerHTML = venc.length ? venc.map(c=>`<div style="padding:8px 0;border-bottom:1px solid #333">
        <span style="color:#f90">⚠️</span> ${sanitize(c.nome)} — pontos próximos do vencimento</div>`).join('') // SANITIZED
        : '<p style="opacity:.5;padding:8px">Nenhum alerta no momento</p>';
    }
    return lista;
  } catch(e) { console.error('listarClientes',e); return []; }
}

// Carregar estatísticas do dashboard (KPIs)
async function carregarEstatisticas() {
  try {
    // 1. Total de membros (select=* para compatibilidade com qualquer schema)
    const rClientes = await fetch(`${SUPA_URL}/rest/v1/clientes?select=*`, { headers: authHeaders() });
    const clientes = rClientes.ok ? await rClientes.json() : [];
    const totalMembros = Array.isArray(clientes) ? clientes.length : 0;

    // 2. Membros do mês atual
    const agora = new Date();
    const mesAtual = agora.getFullYear() + '-' + String(agora.getMonth()+1).padStart(2,'0');
    const novosMes = Array.isArray(clientes) ? clientes.filter(c => c.created_at && c.created_at.startsWith(mesAtual)).length : 0;

    // 3. Total de compras (transações do tipo compra)
    const rTrans = await fetch(`${SUPA_URL}/rest/v1/transacoes?select=valor_reais,tipo,created_at&tipo=eq.compra`, { headers: authHeaders() });
    const trans = rTrans.ok ? await rTrans.json() : [];
    const totalCompras = Array.isArray(trans) ? trans.reduce((s,t) => s + (t.valor_reais || 0), 0) : 0;
    const comprasMes = Array.isArray(trans) ? trans.filter(t => t.created_at && t.created_at.startsWith(mesAtual)).reduce((s,t) => s + (t.valor_reais || 0), 0) : 0;

    // 4. Indicações (clientes que indicaram alguém)
    const indicacoes = Array.isArray(clientes) ? clientes.filter(c => c.indicado_por).length : 0;

    // 5. Pontos em circulação
    const rPontos = await fetch(`${SUPA_URL}/rest/v1/pontos?select=saldo`, { headers: authHeaders() });
    const pontos = rPontos.ok ? await rPontos.json() : [];
    const totalPontos = Array.isArray(pontos) ? pontos.reduce((s,p) => s + (p.saldo || 0), 0) : 0;

    // Atualizar KPIs do Painel
    const el = (id) => document.getElementById(id);
    if(el('kpi-membros')) el('kpi-membros').textContent = totalMembros;
    if(el('kpi-membros-sub')) el('kpi-membros-sub').textContent = novosMes > 0 ? `+${novosMes} este mês` : 'total';
    if(el('kpi-compras')) el('kpi-compras').textContent = 'R$' + totalCompras.toLocaleString('pt-BR', {minimumFractionDigits:0});
    if(el('kpi-compras-sub')) el('kpi-compras-sub').textContent = comprasMes > 0 ? `R$${comprasMes.toLocaleString('pt-BR')} este mês` : 'total acumulado';
    if(el('kpi-indicacoes')) el('kpi-indicacoes').textContent = indicacoes;
    if(el('kpi-indicacoes-sub')) el('kpi-indicacoes-sub').textContent = 'membros indicados';
    if(el('kpi-via-indicacao')) el('kpi-via-indicacao').textContent = indicacoes > 0 ? Math.round(indicacoes/totalMembros*100) + '%' : '0';
    if(el('kpi-via-indicacao-sub')) el('kpi-via-indicacao-sub').textContent = 'do total';

    // Atualizar KPIs do Admin
    if(el('kpi-admin-membros')) el('kpi-admin-membros').textContent = totalMembros;
    if(el('kpi-pts-circulacao')) el('kpi-pts-circulacao').textContent = totalPontos.toLocaleString('pt-BR');

  } catch(e) { console.error('carregarEstatisticas:', e); }
}

// Buscar cliente pelo código do cartão (ex: CR-00847)
async function buscarClientePorCodigo(codigo) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/clientes?codigo=eq.${codigo}&select=*`, { headers: authHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    return d[0] || null;
  } catch(e) { return null; }
}

// Registrar compra e pontuar cliente
async function registrarCompra(clienteId, valorReais) {
  try {
    const regras = getRegras();
    const pts = Math.floor(valorReais * regras.ptsPorReal);
    // 1. Inserir transação
    const rt = await fetch(`${SUPA_URL}/rest/v1/transacoes`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ cliente_id: clienteId, tipo: 'compra', valor_reais: valorReais, pontos: pts })
    });
    if (!rt.ok) { const err = await rt.json(); throw new Error(err.message || 'Erro ao inserir transação'); }
    // 2. Buscar saldo atual
    const r = await fetch(`${SUPA_URL}/rest/v1/pontos?cliente_id=eq.${clienteId}`, { headers: authHeaders() });
    if (!r.ok) throw new Error('Erro ao buscar pontos');
    const pontos = await r.json();
    if (!pontos[0]) throw new Error('Registro de pontos não encontrado para este cliente');
    const atual = pontos[0];
    // 3. Atualizar saldo
    const novoSaldo = atual.saldo + pts;
    const rp = await fetch(`${SUPA_URL}/rest/v1/pontos?cliente_id=eq.${clienteId}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ saldo: novoSaldo, total_ganho: atual.total_ganho + pts })
    });
    if (!rp.ok) { const err = await rp.json(); throw new Error(err.message || 'Erro ao atualizar pontos'); }
    // 4. Notificar cliente via OneSignal
    notificarCliente(clienteId, pts, novoSaldo);
    return { pts, novoSaldo };
  } catch(e) {
    console.error('registrarCompra:', e);
    alert('Erro ao registrar compra: ' + e.message);
    return null;
  }
}

// Listar resgates recentes
async function listarResgatesPendentes() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/resgate?select=*,clientes(nome,codigo),recompensas(nome)&order=created_at.desc&limit=20`, { headers: authHeaders() });
    if (!r.ok) { console.error('listarResgates: status', r.status); return []; }
    const lista = await r.json();
    const el = document.getElementById('resgates-lista');
    if (!el) return lista;
    if (!Array.isArray(lista) || !lista.length) {
      el.innerHTML = '<p style="opacity:.5;padding:8px">Nenhum resgate ainda</p>'; // SANITIZED: static
      return lista;
    }
    const statusMap = {
      aprovado: { cor: '#27ae60', txt: 'Ativo' },
      utilizado: { cor: 'var(--gray)', txt: 'Utilizado' },
      recusado: { cor: '#c0392b', txt: 'Recusado' },
      pendente: { cor: '#f39c12', txt: 'Pendente' },
      expirado: { cor: '#666', txt: 'Expirado' }
    };
    el.innerHTML = lista.map(rg => { // SANITIZED
      const st = statusMap[rg.status] || { cor: '#888', txt: sanitize(rg.status) };
      const dt = new Date(rg.created_at).toLocaleDateString('pt-BR');
      const nome = rg.recompensas?.nome || rg.recompensa || '—';
      const cupom = rg.codigo_cupom || '—';
      return `
      <div style="padding:8px 0;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600">${sanitize(rg.clientes?.nome || '—')}</div>
          <div style="font-size:11px;color:var(--gray)">${sanitize(nome)} · ${rg.pontos_usados} pts · ${dt}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Fira Code',monospace;font-size:12px;letter-spacing:1px;color:var(--gold)">${sanitize(cupom)}</div>
          <div style="font-size:10px;color:${st.cor};font-weight:600">${st.txt}</div>
        </div>
      </div>`;
    }).join('');
    return lista;
  } catch(e) { console.error('listarResgatesPendentes', e); return []; }
}

// Buscar cupom para validação
async function buscarCupom() {
  const input = document.getElementById('busca-cupom');
  const el = document.getElementById('cupom-resultado');
  const codigo = input.value.trim().toUpperCase();
  if (!codigo) { el.innerHTML = ''; return; } // SANITIZED: static empty
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/resgate?codigo_cupom=eq.${codigo}&select=*,clientes(nome,codigo,telefone),recompensas(nome)`, { headers: authHeaders() });
    if (!r.ok) { el.innerHTML = '<div style="padding:12px;background:rgba(192,57,43,.1);border-radius:8px;color:#e74c3c;font-size:13px">Erro ao buscar cupom</div>'; return; } // SANITIZED: static
    const lista = await r.json();
    if (!Array.isArray(lista) || !lista.length) {
      el.innerHTML = '<div style="padding:12px;background:rgba(192,57,43,.1);border-radius:8px;color:#e74c3c;font-size:13px">Cupom não encontrado</div>'; // SANITIZED: static
      return;
    }
    const rg = lista[0];
    const nome = rg.recompensas?.nome || rg.recompensa || '—';
    const validade = rg.validade ? new Date(rg.validade).toLocaleDateString('pt-BR') : '—';
    const expirado = rg.validade && new Date(rg.validade) < new Date();
    if (rg.status === 'utilizado') {
      el.innerHTML = `<div style="padding:12px;background:rgba(100,100,100,.1);border-radius:8px;font-size:13px;color:var(--gray)">
        Este cupom já foi utilizado em ${rg.aprovado_em ? new Date(rg.aprovado_em).toLocaleDateString('pt-BR') : '—'}
      </div>`; // SANITIZED: date via toLocaleDateString
    } else if (expirado) {
      el.innerHTML = `<div style="padding:12px;background:rgba(192,57,43,.1);border-radius:8px;font-size:13px;color:#e74c3c">
        Cupom expirado em ${validade}
      </div>`; // SANITIZED: date via toLocaleDateString
    } else {
      el.innerHTML = // SANITIZED
      `<div style="padding:14px;background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.3);border-radius:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <div style="font-weight:700;font-size:15px;color:var(--gold-light)">${sanitize(nome)}</div>
            <div style="font-size:12px;color:var(--gray);margin-top:2px">${rg.pontos_usados.toLocaleString('pt-BR')} pts</div>
          </div>
          <div style="font-family:'Fira Code',monospace;font-size:18px;font-weight:700;color:#27ae60;letter-spacing:2px">${sanitize(codigo)}</div>
        </div>
        <div style="font-size:12px;color:var(--gray);margin-bottom:10px">
          Cliente: <strong>${sanitize(rg.clientes?.nome || '—')}</strong> · Válido até ${validade}
        </div>
        <button data-action="marcarCupomUtilizado" data-id="${rg.id}" style="width:100%;background:#27ae60;color:#fff;border:none;padding:10px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px">
          ✓ MARCAR COMO UTILIZADO
        </button>
      </div>`;
    }
  } catch(e) {
    el.innerHTML = '<div style="padding:12px;color:#e74c3c">Erro ao buscar cupom</div>'; // SANITIZED: static
  }
}

// Marcar cupom como utilizado
async function marcarCupomUtilizado(id) {
  if (!confirm('Confirma que o cliente retirou o produto/prêmio?')) return;
  try {
    const rr = await fetch(`${SUPA_URL}/rest/v1/resgate?id=eq.${id}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ status: 'utilizado', aprovado_em: new Date().toISOString() })
    });
    if (!rr.ok) throw new Error('Erro ao atualizar');
    document.getElementById('cupom-resultado').innerHTML = '<div style="padding:12px;background:rgba(39,174,96,.1);border-radius:8px;color:#27ae60;font-size:13px;font-weight:600">Cupom validado com sucesso!</div>'; // SANITIZED: static
    document.getElementById('busca-cupom').value = '';
    await listarResgatesPendentes();
  } catch(e) { alert('Erro: ' + e.message); }
}

// Cadastrar novo cliente pelo admin
async function cadastrarClienteAdmin(dados) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/clientes`, {
      method: 'POST', headers: { ...authHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(dados)
    });
    const d = await r.json();
    if (!r.ok) { console.error('cadastrarClienteAdmin erro:', d); throw new Error(d.message || d.details || 'Erro no cadastro'); }
    const cliente = Array.isArray(d) ? d[0] : d;
    if (!cliente || !cliente.id) throw new Error('Resposta inesperada do servidor');
    const rp = await fetch(`${SUPA_URL}/rest/v1/pontos`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ cliente_id: cliente.id, saldo: 0, total_ganho: 0, total_usado: 0 })
    });
    if (!rp.ok) {
      console.error('Erro ao criar pontos do cliente admin:', rp.status);
      alert('Cliente criado, mas houve erro ao inicializar pontos. Verifique manualmente.');
    }
    return cliente;
  } catch(e) { console.error('cadastrarClienteAdmin:', e); alert('Erro ao cadastrar: ' + e.message); return null; }
}
async function carregarDadosAdmin() {
  // Tenta carregar regras do Supabase primeiro, senão usa localStorage
  await carregarRegrasSupabase();
  carregarRegras();
  await listarClientes();
  await listarResgatesPendentes();
  await listarRecompensas();
  await listarAniversariantes();
  await carregarEstatisticas();
}
// ── AUTH ──────────────────────────────────────────────
async function fazerLogin() {
  const email = document.getElementById('inp-email').value.trim();
  const senha = document.getElementById('inp-senha').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('btn-login');
  
  if (!email || !senha) { errEl.textContent = 'Preencha email e senha'; setTimeout(()=>errEl.textContent='',3000); return; }
  
  btn.textContent = 'ENTRANDO...'; btn.disabled = true;
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    
    if (error) {
      errEl.textContent = 'Email ou senha incorretos';
      setTimeout(()=>errEl.textContent='',3000);
      btn.textContent = 'ENTRAR'; btn.disabled = false;
      return;
    }
    
    authToken = data.session.access_token;
    
    // Verificar se é admin
    const { data: adminCheck } = await supabaseClient.from('admin_profiles').select('id').eq('id', data.user.id).single();
    
    if (!adminCheck) {
      errEl.textContent = 'Acesso negado. Usuário não é administrador.';
      await supabaseClient.auth.signOut();
      authToken = null;
      setTimeout(()=>errEl.textContent='',4000);
      btn.textContent = 'ENTRAR'; btn.disabled = false;
      return;
    }
    
    // Login OK
    document.getElementById('pin-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'block';
    carregarDadosAdmin();
    // onAuthStateChange já registrado globalmente — refresh automático ativo
    
  } catch(e) {
    errEl.textContent = 'Erro de conexão. Tente novamente.';
    setTimeout(()=>errEl.textContent='',3000);
    btn.textContent = 'ENTRAR'; btn.disabled = false;
  }
}

async function fazerLogout() {
  await supabaseClient.auth.signOut();
  authToken = null;
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('pin-screen').style.display = 'flex';
  document.getElementById('inp-email').value = '';
  document.getElementById('inp-senha').value = '';
}

// Verificar sessão existente ao carregar (mantém admin logado entre recarregamentos)
async function verificarSessaoExistente() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.warn('Erro ao verificar sessão admin:', error.message);
      return;
    }
    if (session) {
      // Sessão encontrada — verificar se token ainda é válido
      // Se o token expirou, o Supabase faz refresh automático via refreshToken
      authToken = session.access_token;

      // Verificar se ainda é admin no banco
      const { data: adminCheck, error: adminErr } = await supabaseClient
        .from('admin_profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (adminCheck) {
        document.getElementById('pin-screen').style.display = 'none';
        document.getElementById('admin-app').style.display = 'block';
        carregarDadosAdmin();
        console.log('Sessão admin restaurada com sucesso');
        return;
      } else {
        // Usuário não é mais admin — deslogar
        console.warn('Usuário não é mais admin — fazendo logout');
        await supabaseClient.auth.signOut();
        authToken = null;
      }
    }
  } catch(e) {
    console.warn('Erro ao restaurar sessão admin:', e);
  }
}
verificarSessaoExistente();

// OPERADOR
let valor='';
function kp(k){
  if(k==='⌫'){valor=valor.slice(0,-1);}
  else if(k==='OK'){
    if(valor && clienteAtual) {
      const v = parseFloat(valor);
      if (isNaN(v) || v <= 0) { alert('Valor inválido'); valor=''; document.getElementById('valor-display').textContent='___'; return; }
      const valorRegistrado = valor;
      registrarCompra(clienteAtual.id, v).then(resultado => {
        if(resultado) {
          document.getElementById('cli-pontos').textContent = resultado.novoSaldo + ' pontos';
          alert('✓ R$' + valorRegistrado + ' registrado!\n+' + resultado.pts + ' pontos adicionados!\nSaldo: ' + resultado.novoSaldo + ' pts');
        } else {
          alert('Erro ao registrar. Tente novamente.');
        }
      }).catch(() => { alert('Erro de conexão ao registrar compra.'); });
      valor='';
      document.getElementById('valor-display').textContent='___';
      document.getElementById('pts-preview').textContent='';
    }
  }
  else if(valor.length<6){valor+=k;}
  document.getElementById('valor-display').textContent=valor||'___';
  const regrasPreview = getRegras();
  const ptsPreview = valor ? Math.floor(parseFloat(valor) * regrasPreview.ptsPorReal) : 0;
  document.getElementById('pts-preview').textContent=valor?'Esta compra gera +'+ptsPreview+' pontos':'';
}
// Disparar campanha push pela UI admin
async function dispararCampanha() {
  const titulo = document.getElementById('push-titulo').value.trim();
  const msg = document.getElementById('push-msg').value.trim();
  const url = document.getElementById('push-url').value.trim();
  const status = document.getElementById('push-status');
  if (!titulo || !msg) { alert('Preencha o título e a mensagem!'); return; }
  status.textContent = 'Enviando...';
  status.style.color = 'var(--gold)';
  const ok = await enviarCampanha(titulo, msg, url || undefined);
  if (ok) {
    status.textContent = '✓ Campanha enviada com sucesso!';
    status.style.color = 'var(--green)';
    document.getElementById('push-titulo').value = '';
    document.getElementById('push-msg').value = '';
    document.getElementById('push-url').value = '';
  } else {
    status.textContent = '✗ Falha ao enviar. Verifique o console.';
    status.style.color = 'var(--red)';
  }
}

// Variável global para cliente atual
let clienteAtual = null;

// Extrair código do cliente de um texto (pode ser URL com ?scan=CODIGO ou código direto)
function extrairCodigo(texto) {
  if (!texto) return null;
  // Se for URL com parâmetro ?scan=
  try {
    const url = new URL(texto);
    const scan = url.searchParams.get('scan');
    if (scan) return scan.trim().toUpperCase();
  } catch(e) {}
  // Se for URL com ?scan= sem protocolo válido, tentar regex
  const match = texto.match(/[?&]scan=([^&\s]+)/i);
  if (match) return match[1].trim().toUpperCase();
  // Senão, é o código direto
  return texto.trim().toUpperCase();
}

// Função para carregar cliente pelo código (chamada após scan ou busca manual)
async function carregarCliente(textoScan) {
  const codigo = extrairCodigo(textoScan);
  if (!codigo) { alert('Código inválido!'); return; }
  const cliente = await buscarClientePorCodigo(codigo);
  if (!cliente) { alert('Cliente não encontrado!'); return; }
  clienteAtual = cliente;
  // Buscar saldo de pontos
  const rp = await fetch(`${SUPA_URL}/rest/v1/pontos?cliente_id=eq.${cliente.id}`, { headers: authHeaders() });
  const pts = rp.ok ? await rp.json() : [];
  const saldo = pts[0]?.saldo || 0;
  clienteAtual.saldo = saldo;
  // Preencher painel
  const iniciais = cliente.nome.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('cli-av-iniciais').textContent = iniciais;
  document.getElementById('cli-nome').textContent = cliente.nome;
  document.getElementById('cli-meta').textContent = `#${cliente.codigo} · ${saldo} pts acumulados`;
  document.getElementById('cli-pontos').textContent = saldo + ' pontos';
  document.getElementById('client-found').style.display='flex';
  document.getElementById('scan-area').style.display='none';

  // Mostrar status do dispositivo vinculado
  const deviceBadge = document.getElementById('cli-device-badge');
  if (deviceBadge) {
    if (cliente.device_id) {
      deviceBadge.textContent = '📱 Vinculado';
      deviceBadge.style.background = '#27ae60';
      deviceBadge.style.color = '#fff';
    } else {
      deviceBadge.textContent = 'Sem dispositivo';
      deviceBadge.style.background = '#555';
      deviceBadge.style.color = '#aaa';
    }
    deviceBadge.style.display = '';
  }
}

// ── LIBERAR DISPOSITIVO ──────────────────────────────────

// Liberar dispositivo do cliente selecionado (aba Caixa)
async function liberarDispositivoCliente() {
  if (!clienteAtual) { alert('Nenhum cliente selecionado'); return; }
  await liberarDispositivoClientePorId(clienteAtual.id, clienteAtual.nome);
  clienteAtual.device_id = null;
  const deviceBadge = document.getElementById('cli-device-badge');
  if (deviceBadge) {
    deviceBadge.textContent = 'Sem dispositivo';
    deviceBadge.style.background = '#555';
    deviceBadge.style.color = '#aaa';
  }
}

// Liberar dispositivo de qualquer cliente por ID (usado na listagem e no caixa)
async function liberarDispositivoClientePorId(cId, nomeCliente) {
  if (!confirm(`Liberar novo dispositivo para ${nomeCliente}?\n\nO cliente poderá vincular o próximo celular no próximo acesso ao app.`)) return;

  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/liberar_dispositivo_cliente`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_cliente_id: cId })
    });
    const d = await r.json().catch(() => null);

    if (!r.ok || !d || d.ok === false) {
      alert(d?.erro || 'Erro ao liberar dispositivo. Tente novamente.');
      return;
    }

    alert(`Dispositivo de ${nomeCliente} liberado!\n\nO cliente poderá vincular o novo celular ao acessar o app.`);

    listarClientes();

  } catch(e) {
    console.error('liberarDispositivoCliente:', e);
    alert('Erro ao liberar dispositivo.');
  }
}

// ── SCANNER QR CODE ──────────────────────────────────────
let html5QrCode = null;
let scannerAtivo = false;

function digitarCodigo() {
  const codigo = prompt('Digite o código do cliente (ex: TT-0001):');
  if (codigo) carregarCliente(codigo.trim().toUpperCase());
}

async function iniciarScanner() {
  if (scannerAtivo) { pararScanner(); return; }
  const btnScan = document.getElementById('btn-scan');
  const reader = document.getElementById('qr-reader');
  const placeholder = document.getElementById('scan-placeholder');
  const status = document.getElementById('scan-status');

  try {
    reader.style.display = 'block';
    placeholder.style.display = 'none';
    btnScan.textContent = '⏹ Parar';
    status.style.display = 'block';
    status.textContent = 'Abrindo câmera...';

    html5QrCode = new Html5Qrcode('qr-reader');

    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        // QR lido com sucesso
        status.textContent = '✓ Código lido: ' + decodedText;
        pararScanner();
        await carregarCliente(decodedText.trim().toUpperCase());
      },
      () => {} // erro silencioso a cada frame sem QR
    );
    scannerAtivo = true;
    status.textContent = 'Aponte para o QR Code do cartão';
  } catch (err) {
    console.error('Scanner erro:', err);
    status.textContent = 'Erro ao abrir câmera. Use digitar código.';
    status.style.color = 'var(--red)';
    setTimeout(() => { status.style.color = 'var(--gold)'; }, 3000);
    pararScanner();
  }
}

function pararScanner() {
  const btnScan = document.getElementById('btn-scan');
  const reader = document.getElementById('qr-reader');
  const placeholder = document.getElementById('scan-placeholder');
  const status = document.getElementById('scan-status');

  if (html5QrCode && scannerAtivo) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
    }).catch(() => {});
  }
  scannerAtivo = false;
  reader.style.display = 'none';
  placeholder.style.display = 'block';
  btnScan.textContent = '📷 Escanear QR';
  status.style.display = 'none';
}

// NAV
function A(n,btn){
  document.querySelectorAll('#admin-app .screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.an').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+n).classList.add('active');
  btn.classList.add('active');
  if(n==='painel') { listarClientes(); listarResgatesPendentes(); listarAniversariantes(); carregarEstatisticas(); }
  if(n==='cardapio') { carregarCardapioAdmin(); }
  if(n==='blog') { carregarBlogAdmin(); }
  if(n==='suporte') { renderizarSuporte(); }
}
async function listarAniversariantes() {
  try {
    const hoje = new Date();
    const mes = String(hoje.getMonth()+1).padStart(2,'0');
    const r = await fetch(`${SUPA_URL}/rest/v1/clientes?select=nome,nacimento&nacimento=ilike.*-${mes}-*&order=nacimento`, { headers: authHeaders() });
    if (!r.ok) return;
    const lista = await r.json();
    const el = document.getElementById('aniversariantes-lista');
    if(!el) return;
    if(!lista.length){ el.innerHTML='<p style="opacity:.5;padding:8px">Nenhum aniversariante este mês</p>'; return; } // SANITIZED: static
    el.innerHTML = lista.map(c=>{ // SANITIZED
      const dia = c.nacimento?.split('-')[2] || '??';
      return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333">
        <span>${sanitize(c.nome)}</span><span style="opacity:.6">dia ${sanitize(dia)}</span></div>`;
    }).join('');
  } catch(e){ console.error('listarAniversariantes',e); }
}
document.querySelectorAll('.mo').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
document.querySelectorAll('.tog').forEach(t=>t.addEventListener('click',()=>t.classList.toggle('on')));
// ViaCEP admin
async function admCep(){
  const cep=document.getElementById('adm-cep').value.replace(/\D/g,'');
  if(cep.length!==8)return alert('CEP inválido');
  try{
    const r=await fetch('https://viacep.com.br/ws/'+cep+'/json/');
    if(!r.ok)return alert('Erro ao buscar CEP');
    const d=await r.json();
    if(d.erro)return alert('CEP não encontrado');
    document.getElementById('adm-rua').value=d.logradouro||'';
    document.getElementById('adm-bairro').value=d.bairro||'';
    document.getElementById('adm-cidade').value=d.localidade||'';
    document.getElementById('adm-uf').value=d.uf||'';
  }catch(e){alert('Erro ao buscar CEP');}
}
// Enviar convite personalizado pelo WhatsApp
function enviarConvite(codigo, nome) {
  const base = 'https://carnesrodrigues.com.br/';
  const link = base + '?ref=' + codigo;
  const msg = encodeURIComponent(
    'Olá ' + nome + '! 👋\n\nVocê está convidado para o *Clube Prime* do Empório Família Rodrigues! 🥩\n\n' +
    'Cadastre-se pelo seu link exclusivo e comece a acumular pontos em cada compra:\n' +
    link + '\n\nAté logo! 😊'
  );
  window.open('https://wa.me/?text=' + msg, '_blank');
}

// Parabenizar aniversariante pelo WhatsApp
function parabens(nome) {
  const msg = encodeURIComponent(
    '🎂 Feliz Aniversário, ' + nome + '!\n\n' +
    'O Empório Família Rodrigues deseja um dia incrível! 🥩🎉\n\n' +
    'Como presente, você ganhou *pontos em dobro* na sua próxima compra este mês!\n\n' +
    'Equipe Clube Prime'
  );
  window.open('https://wa.me/?text=' + msg, '_blank');
}

// ── REGRAS DE PONTUAÇÃO ──────────────────────────────────
const REGRAS_DEFAULT = {
  ptsPorReal: 1,
  bonusIndicacao: 2,
  metaPontos: 5000,
  valorCupom: 100,
  compraMinima: 200,
  validadeCupom: 30,
  perdePontos: true
};

function carregarRegras() {
  const saved = localStorage.getItem('clube-prime-regras');
  const regras = saved ? JSON.parse(saved) : REGRAS_DEFAULT;
  document.getElementById('regra-pts-por-real').value = regras.ptsPorReal;
  document.getElementById('regra-bonus-indicacao').value = regras.bonusIndicacao;
  document.getElementById('regra-meta-pontos').value = regras.metaPontos;
  document.getElementById('regra-valor-cupom').value = regras.valorCupom;
  document.getElementById('regra-compra-minima').value = regras.compraMinima;
  document.getElementById('regra-validade-cupom').value = regras.validadeCupom;
  const tog = document.getElementById('tog-perde-pontos');
  if (regras.perdePontos) tog.classList.add('on'); else tog.classList.remove('on');
  atualizarLabelPerde();
  return regras;
}

function getRegras() {
  const saved = localStorage.getItem('clube-prime-regras');
  return saved ? JSON.parse(saved) : REGRAS_DEFAULT;
}

function salvarRegras() {
  const regras = {
    ptsPorReal: parseInt(document.getElementById('regra-pts-por-real').value) || 1,
    bonusIndicacao: parseInt(document.getElementById('regra-bonus-indicacao').value) || 2,
    metaPontos: parseInt(document.getElementById('regra-meta-pontos').value) || 5000,
    valorCupom: parseInt(document.getElementById('regra-valor-cupom').value) || 100,
    compraMinima: parseInt(document.getElementById('regra-compra-minima').value) || 200,
    validadeCupom: parseInt(document.getElementById('regra-validade-cupom').value) || 30,
    perdePontos: document.getElementById('tog-perde-pontos').classList.contains('on')
  };
  localStorage.setItem('clube-prime-regras', JSON.stringify(regras));
  // Também salvar no Supabase para sincronizar com o app do cliente
  salvarRegrasSupabase(regras);
  const status = document.getElementById('regras-status');
  status.textContent = '✓ Regras salvas com sucesso!';
  status.style.color = 'var(--green)';
  setTimeout(() => status.textContent = '', 3000);
}

async function salvarRegrasSupabase(regras) {
  try {
    // Usar upsert via Prefer: resolution=merge-duplicates para evitar race condition
    const r = await fetch(`${SUPA_URL}/rest/v1/configuracoes`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ chave: 'regras_pontuacao', valor: JSON.stringify(regras) })
    });
    if (!r.ok) console.warn('Erro ao salvar regras no Supabase:', r.status);
  } catch(e) {
    console.warn('Regras salvas localmente. Supabase sync falhou (tabela configuracoes pode não existir):', e.message);
  }
}

async function carregarRegrasSupabase() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/configuracoes?chave=eq.regras_pontuacao&select=valor`, { headers: authHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.length > 0 && d[0].valor) {
      const regras = JSON.parse(d[0].valor);
      localStorage.setItem('clube-prime-regras', JSON.stringify(regras));
      return regras;
    }
  } catch(e) { console.warn('Supabase regras fetch falhou:', e.message); }
  return null;
}

function atualizarLabelPerde() {
  const on = document.getElementById('tog-perde-pontos').classList.contains('on');
  document.getElementById('label-perde-pontos').textContent = on
    ? 'Sim — cliente perde os pontos usados'
    : 'Não — pontos são devolvidos ao saldo';
}

// Atualizar label quando toggle muda
document.getElementById('tog-perde-pontos')?.addEventListener('click', () => setTimeout(atualizarLabelPerde, 50));

// ── CARDÁPIO ADMIN ─────────────────────────────────────────
let categoriasCache = [];
let produtosCache = [];

async function carregarCardapioAdmin() {
  try {
    const [rCat, rProd] = await Promise.all([
      fetch(`${SUPA_URL}/rest/v1/cardapio_categorias?select=*&order=ordem`, { headers: authHeaders() }),
      fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?select=*&order=ordem,nome`, { headers: authHeaders() })
    ]);
    categoriasCache = rCat.ok ? await rCat.json() : [];
    produtosCache = rProd.ok ? await rProd.json() : [];
    if (!Array.isArray(categoriasCache)) categoriasCache = [];
    if (!Array.isArray(produtosCache)) produtosCache = [];
    renderizarCategorias();
    renderizarProdutos();
    atualizarSelectsCat();
  } catch(e) { console.error('carregarCardapioAdmin:', e); }
}

function renderizarCategorias() {
  const el = document.getElementById('cat-lista');
  if (!categoriasCache.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhuma categoria cadastrada</div>'; return; } // SANITIZED: static
  el.innerHTML = categoriasCache.map((c, i) => { // SANITIZED
    const qtd = produtosCache.filter(p => p.categoria_id === c.id).length;
    return `<div class="toggle-row" style="gap:10px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:${c.ativo?'var(--white)':'var(--gray)'}">${sanitize(c.nome)} <span style="font-size:10px;opacity:.5">(${qtd})</span></div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        ${i > 0 ? `<button class="btn bo bsm" data-action="moverCategoria" data-id="${c.id}" data-dir="-1" style="padding:4px 7px;font-size:10px">↑</button>` : ''}
        ${i < categoriasCache.length-1 ? `<button class="btn bo bsm" data-action="moverCategoria" data-id="${c.id}" data-dir="1" style="padding:4px 7px;font-size:10px">↓</button>` : ''}
        <div class="tog ${c.ativo?'on':''}" data-action="toggleCategoria" data-id="${c.id}" data-val="${c.ativo?'false':'true'}"><div class="tog-d"></div></div>
        <button class="btn bo bsm" data-action="editarCategoria" data-id="${c.id}" style="padding:4px 10px;font-size:10px">✏️</button>
      </div>
    </div>`;
  }).join('');
}

function renderizarProdutos() {
  const el = document.getElementById('prod-lista');
  const filtCat = document.getElementById('filtro-cat-prod')?.value || '';
  const busca = (document.getElementById('busca-prod')?.value || '').toLowerCase();
  let lista = [...produtosCache].sort((a,b) => (a.ordem||0) - (b.ordem||0) || a.nome.localeCompare(b.nome, 'pt-BR'));
  if (filtCat) lista = lista.filter(p => String(p.categoria_id) === filtCat);
  if (busca) lista = lista.filter(p => p.nome.toLowerCase().includes(busca));
  if (!lista.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhum produto encontrado</div>'; return; } // SANITIZED: static
  el.innerHTML = lista.map((p, i) => { // SANITIZED
    const cat = categoriasCache.find(c => c.id === p.categoria_id);
    const badge = p.destaque === 'promocao' ? '<span style="background:var(--red);color:#fff;border-radius:6px;padding:1px 6px;font-size:8px;margin-left:6px">PROMO</span>'
      : p.destaque === 'novidade' ? '<span style="background:var(--blue);color:#fff;border-radius:6px;padding:1px 6px;font-size:8px;margin-left:6px">NOVO</span>' : '';
    return `<div class="toggle-row" style="gap:10px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:${p.ativo?'var(--white)':'var(--gray)'}">${sanitize(p.nome)}${badge}</div>
        <div style="font-size:10px;color:var(--gray)">${sanitize(p.apresentacao||'')} · ${sanitize(cat?cat.nome:'—')}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        <button class="btn bo bsm" data-action="moverProduto" data-id="${p.id}" data-dir="-1" style="padding:4px 7px;font-size:10px">↑</button>
        <button class="btn bo bsm" data-action="moverProduto" data-id="${p.id}" data-dir="1" style="padding:4px 7px;font-size:10px">↓</button>
        <div class="tog ${p.ativo?'on':''}" data-action="toggleProduto" data-id="${p.id}" data-val="${p.ativo?'false':'true'}"><div class="tog-d"></div></div>
        <button class="btn bo bsm" data-action="editarProduto" data-id="${p.id}" style="padding:4px 10px;font-size:10px">✏️</button>
      </div>
    </div>`;
  }).join('');
}

function atualizarSelectsCat() {
  const ativas = categoriasCache.filter(c => c.ativo);
  ['filtro-cat-prod', 'prod-categoria'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const val = sel.value;
    const opts = id === 'filtro-cat-prod' ? '<option value="">Todas as categorias</option>' : '<option value="">Selecione...</option>';
    sel.innerHTML = opts + ativas.map(c => `<option value="${c.id}">${sanitize(c.nome)}</option>`).join(''); // SANITIZED
    sel.value = val;
  });
}

// ── RECOMPENSAS (CRUD) ───────────────────────────────────
let recompensasCache = [];

async function listarRecompensas() {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/recompensas?select=*&order=pontos_necessarios.asc`, { headers: authHeaders() });
    if (!r.ok) { console.error('listarRecompensas: status', r.status); return; }
    const lista = await r.json();
    recompensasCache = Array.isArray(lista) ? lista : [];
    const el = document.getElementById('recompensas-lista');
    if (!el) return;
    if (!recompensasCache.length) {
      el.innerHTML = '<p style="opacity:.5;padding:8px">Nenhuma recompensa cadastrada</p>'; // SANITIZED: static
      return;
    }
    el.innerHTML = recompensasCache.map(rc => // SANITIZED
    `<div style="padding:10px 0;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600;color:${rc.ativo ? 'var(--gold-light)' : 'var(--gray)'}">${rc.ativo ? '' : '⏸ '}${sanitize(rc.nome)}</div>
          <div style="font-size:11px;color:var(--gray);margin-top:2px">${sanitize(rc.descricao || '—')}</div>
        </div>
        <div style="text-align:right;min-width:120px">
          <div style="font-size:16px;font-weight:700;color:var(--gold)">${rc.pontos_necessarios.toLocaleString('pt-BR')} pts</div>
          <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:4px">
            <button data-action="editarRecompensa" data-id="${rc.id}" style="background:none;border:1px solid var(--gold-dark);color:var(--gold);padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px">Editar</button>
            <button data-action="toggleRecompensa" data-id="${rc.id}" data-val="${rc.ativo}" style="background:none;border:1px solid ${rc.ativo ? '#c0392b' : '#27ae60'};color:${rc.ativo ? '#c0392b' : '#27ae60'};padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px">${rc.ativo ? 'Desativar' : 'Ativar'}</button>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { console.error('listarRecompensas:', e); }
}

function abrirModalRecompensa(id) {
  document.getElementById('recomp-edit-id').value = id || '';
  const rc = id ? recompensasCache.find(r => r.id === id) : null;
  document.getElementById('recomp-nome').value = rc ? rc.nome : '';
  document.getElementById('recomp-desc').value = rc ? (rc.descricao || '') : '';
  document.getElementById('recomp-pontos').value = rc ? rc.pontos_necessarios : '';
  document.getElementById('mo-recomp-title').textContent = id ? 'Editar Recompensa' : 'Nova Recompensa';
  document.getElementById('mo-recomp').classList.add('open');
}

function editarRecompensa(id) { abrirModalRecompensa(id); }

async function salvarRecompensa() {
  const id = document.getElementById('recomp-edit-id').value;
  const nome = document.getElementById('recomp-nome').value.trim();
  const desc = document.getElementById('recomp-desc').value.trim();
  const pontos = parseInt(document.getElementById('recomp-pontos').value);
  if (!nome || !pontos || pontos <= 0) { alert('Preencha nome e pontos.'); return; }
  const body = { nome, descricao: desc || null, pontos_necessarios: pontos };
  try {
    if (id) {
      await fetch(`${SUPA_URL}/rest/v1/recompensas?id=eq.${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
    } else {
      await fetch(`${SUPA_URL}/rest/v1/recompensas`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    }
    document.getElementById('mo-recomp').classList.remove('open');
    await listarRecompensas();
  } catch(e) { alert('Erro ao salvar: ' + e.message); }
}

async function toggleRecompensa(id, atual) {
  if (!confirm(atual ? 'Desativar esta recompensa?' : 'Reativar esta recompensa?')) return;
  try {
    await fetch(`${SUPA_URL}/rest/v1/recompensas?id=eq.${id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ativo: !atual })
    });
    await listarRecompensas();
  } catch(e) { alert('Erro: ' + e.message); }
}

function abrirModalCat(id) {
  document.getElementById('cat-edit-id').value = id || '';
  document.getElementById('cat-nome').value = id ? (categoriasCache.find(c=>c.id===id)?.nome||'') : '';
  document.getElementById('mo-cat-title').textContent = id ? 'Editar Categoria' : 'Nova Categoria';
  document.getElementById('mo-cat').classList.add('open');
}

function editarCategoria(id) { abrirModalCat(id); }

async function salvarCategoria() {
  const id = document.getElementById('cat-edit-id').value;
  const nome = document.getElementById('cat-nome').value.trim();
  if (!nome) { alert('Digite o nome da categoria'); return; }
  try {
    if (id) {
      await fetch(`${SUPA_URL}/rest/v1/cardapio_categorias?id=eq.${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ nome }) });
    } else {
      const maxOrdem = categoriasCache.reduce((m,c) => Math.max(m, c.ordem||0), 0);
      await fetch(`${SUPA_URL}/rest/v1/cardapio_categorias`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ nome, ordem: maxOrdem+1 }) });
    }
    document.getElementById('mo-cat').classList.remove('open');
    await carregarCardapioAdmin();
  } catch(e) { alert('Erro ao salvar: ' + e.message); }
}

async function toggleCategoria(id, ativo) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/cardapio_categorias?id=eq.${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ativo }) });
    await carregarCardapioAdmin();
  } catch(e) { console.error('toggleCategoria:', e); }
}

async function moverCategoria(id, dir) {
  const idx = categoriasCache.findIndex(c => c.id === id);
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= categoriasCache.length) return;
  const a = categoriasCache[idx], b = categoriasCache[targetIdx];
  try {
    await Promise.all([
      fetch(`${SUPA_URL}/rest/v1/cardapio_categorias?id=eq.${a.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ordem: b.ordem }) }),
      fetch(`${SUPA_URL}/rest/v1/cardapio_categorias?id=eq.${b.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ordem: a.ordem }) })
    ]);
    await carregarCardapioAdmin();
  } catch(e) { console.error('moverCategoria:', e); }
}

function abrirModalProd(id) {
  const prod = id ? produtosCache.find(p=>p.id===id) : null;
  document.getElementById('prod-edit-id').value = id || '';
  document.getElementById('prod-nome').value = prod?.nome || '';
  document.getElementById('prod-apresentacao').value = prod?.apresentacao || '';
  document.getElementById('prod-destaque').value = prod?.destaque || '';
  document.getElementById('mo-prod-title').textContent = id ? 'Editar Produto' : 'Novo Produto';
  atualizarSelectsCat();
  setTimeout(() => { document.getElementById('prod-categoria').value = prod?.categoria_id || ''; }, 50);
  document.getElementById('mo-prod').classList.add('open');
}

function editarProduto(id) { abrirModalProd(id); }

async function salvarProduto() {
  const id = document.getElementById('prod-edit-id').value;
  const nome = document.getElementById('prod-nome').value.trim();
  const apresentacao = document.getElementById('prod-apresentacao').value.trim();
  const categoria_id = document.getElementById('prod-categoria').value;
  const destaque = document.getElementById('prod-destaque').value || null;
  if (!nome || !categoria_id) { alert('Preencha nome e categoria'); return; }
  try {
    if (id) {
      await fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?id=eq.${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ nome, apresentacao, categoria_id, destaque, updated_at: new Date().toISOString() }) });
    } else {
      const maxOrdem = produtosCache.filter(p=>String(p.categoria_id)===String(categoria_id)).reduce((m,p) => Math.max(m,p.ordem||0), 0);
      await fetch(`${SUPA_URL}/rest/v1/cardapio_produtos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ nome, apresentacao, categoria_id, destaque, ordem: maxOrdem+1 }) });
    }
    document.getElementById('mo-prod').classList.remove('open');
    await carregarCardapioAdmin();
  } catch(e) { alert('Erro ao salvar: ' + e.message); }
}

async function toggleProduto(id, ativo) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?id=eq.${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ativo }) });
    await carregarCardapioAdmin();
  } catch(e) { console.error('toggleProduto:', e); }
}

async function moverProduto(id, dir) {
  const catId = produtosCache.find(p => p.id === id)?.categoria_id;
  const mesaCat = produtosCache.filter(p => p.categoria_id === catId).sort((a,b) => (a.ordem||0) - (b.ordem||0) || a.nome.localeCompare(b.nome));
  const idx = mesaCat.findIndex(p => p.id === id);
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= mesaCat.length) return;
  const a = mesaCat[idx], b = mesaCat[targetIdx];
  try {
    await Promise.all([
      fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?id=eq.${a.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ordem: b.ordem }) }),
      fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?id=eq.${b.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ordem: a.ordem }) })
    ]);
    await carregarCardapioAdmin();
  } catch(e) { console.error('moverProduto:', e); }
}

// Ordenar todos os produtos A→Z no banco (atualiza campo ordem)
async function ordenarProdutosAZ() {
  if (!confirm('Ordenar todos os produtos alfabeticamente dentro de cada categoria?')) return;
  try {
    const cats = [...new Set(produtosCache.map(p => p.categoria_id))];
    const updates = [];
    cats.forEach(catId => {
      const prods = produtosCache.filter(p => p.categoria_id === catId)
        .sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      prods.forEach((p, i) => {
        if (p.ordem !== i + 1) {
          updates.push(
            fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?id=eq.${p.id}`, {
              method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ ordem: i + 1 })
            })
          );
        }
      });
    });
    if (updates.length) {
      await Promise.all(updates);
      await carregarCardapioAdmin();
      alert('Produtos ordenados A→Z com sucesso!');
    } else {
      alert('Produtos já estão em ordem alfabética.');
    }
  } catch(e) { console.error('ordenarProdutosAZ:', e); alert('Erro ao ordenar: ' + e.message); }
}

// CEP mask admin
const admCepInput=document.getElementById('adm-cep');
if(admCepInput)admCepInput.addEventListener('input',function(){
  let v=this.value.replace(/\D/g,'').slice(0,8);
  if(v.length>5)v=v.slice(0,5)+'-'+v.slice(5);
  this.value=v;
});

// ── BLOG SEO ─────────────────────────────────────────────
let blogCache = [];

async function carregarBlogAdmin() {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/seo_artigos?order=publicado_em.desc`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Erro ' + res.status);
    blogCache = await res.json();
    renderizarBlog();
    carregarStatsBlog();
  } catch(e) {
    document.getElementById('blog-lista').innerHTML = '<div style="text-align:center;padding:20px;color:var(--red);font-size:12px">Erro ao carregar artigos: ' + sanitize(e.message) + '</div>'; // SANITIZED
  }
}

function renderizarBlog() {
  const el = document.getElementById('blog-lista');
  const filtCat = document.getElementById('filtro-cat-blog')?.value || '';
  const busca = (document.getElementById('busca-blog')?.value || '').toLowerCase();
  let lista = [...blogCache];
  if (filtCat) lista = lista.filter(a => a.categoria === filtCat);
  if (busca) lista = lista.filter(a => a.titulo.toLowerCase().includes(busca) || a.slug.toLowerCase().includes(busca));
  if (!lista.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhum artigo encontrado</div>'; return; } // SANITIZED: static

  const catLabels = {cotacao:'Cotação',raca:'Raça',cruzamento:'Cruzamento',corte:'Corte',regiao:'Região',guia:'Guia',churrasco:'Churrasco',familia:'Família'};

  el.innerHTML = lista.map(a => { // SANITIZED
    const catLabel = catLabels[a.categoria] || a.categoria;
    const statusBadge = a.ativo
      ? '<span style="background:rgba(76,175,80,.15);color:#4CAF50;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">ATIVO</span>'
      : '<span style="background:rgba(224,82,82,.15);color:#EF5350;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600">INATIVO</span>';
    const data = a.publicado_em ? new Date(a.publicado_em).toLocaleDateString('pt-BR') : '';
    return '<div class="toggle-row" style="gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:12px;font-weight:600;color:#fff;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sanitize(a.titulo) + '</div>' +
        '<div style="font-size:10px;color:var(--gray);display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<span style="background:rgba(201,168,76,.12);color:var(--gold);padding:1px 6px;border-radius:3px;font-size:9px">' + sanitize(catLabel) + '</span>' +
          statusBadge +
          '<span>/' + sanitize(a.slug) + '</span>' +
          '<span>' + data + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:4px;flex-shrink:0;align-items:center">' +
        '<a href="/' + sanitize(a.slug) + '" target="_blank" class="btn bo bsm" style="text-decoration:none;font-size:10px" title="Ver no site">👁️</a>' +
        '<button class="btn bo bsm" data-action="editarBlog" data-slug="' + sanitize(a.slug) + '" style="font-size:10px" title="Editar">✏️</button>' +
        '<div class="tog ' + (a.ativo ? 'on' : '') + '" data-action="toggleBlog" data-slug="' + sanitize(a.slug) + '" data-val="' + (a.ativo ? 'false' : 'true') + '"><div class="tog-d"></div></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function abrirModalBlog(slug) {
  const art = slug ? blogCache.find(a => a.slug === slug) : null;
  document.getElementById('blog-edit-id').value = art?.id || '';
  document.getElementById('blog-slug').value = art?.slug || '';
  document.getElementById('blog-titulo').value = art?.titulo || '';
  document.getElementById('blog-categoria').value = art?.categoria || 'raca';
  document.getElementById('blog-meta').value = art?.meta_description || '';
  document.getElementById('blog-resumo').value = art?.conteudo_resumo || '';
  document.getElementById('blog-ativo').value = art?.ativo !== false ? 'true' : 'false';
  document.getElementById('mo-blog-title').textContent = art ? 'Editar Artigo' : 'Novo Artigo';
  document.getElementById('blog-slug').readOnly = !!art;
  const previewLink = document.getElementById('blog-preview-link');
  if (art) {
    previewLink.href = '/' + art.slug;
    previewLink.style.display = '';
  } else {
    previewLink.style.display = 'none';
  }
  document.getElementById('mo-blog').classList.add('open');
}

function editarBlog(slug) { abrirModalBlog(slug); }

async function salvarBlog() {
  const id = document.getElementById('blog-edit-id').value;
  const slug = document.getElementById('blog-slug').value.trim();
  const titulo = document.getElementById('blog-titulo').value.trim();
  const categoria = document.getElementById('blog-categoria').value;
  const meta = document.getElementById('blog-meta').value.trim();
  const resumo = document.getElementById('blog-resumo').value.trim();
  const ativo = document.getElementById('blog-ativo').value === 'true';

  if (!slug || !titulo) { alert('Slug e título são obrigatórios'); return; }

  try {
    if (id) {
      await fetch(`${SUPA_URL}/rest/v1/seo_artigos?id=eq.${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ titulo, categoria, meta_description: meta, conteudo_resumo: resumo, ativo, atualizado_em: new Date().toISOString() })
      });
    } else {
      await fetch(`${SUPA_URL}/rest/v1/seo_artigos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ slug, titulo, categoria, meta_description: meta, conteudo_resumo: resumo, ativo })
      });
    }
    document.getElementById('mo-blog').classList.remove('open');
    await carregarBlogAdmin();
  } catch(e) { alert('Erro ao salvar: ' + e.message); }
}

async function toggleBlog(slug, novoEstado) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/seo_artigos?slug=eq.${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ ativo: novoEstado, atualizado_em: new Date().toISOString() })
    });
    await carregarBlogAdmin();
  } catch(e) { alert('Erro: ' + e.message); }
}

async function carregarStatsBlog() {
  try {
    document.getElementById('stat-total-artigos').textContent = blogCache.filter(a => a.ativo).length;

    const views = await fetch(`${SUPA_URL}/rest/v1/seo_analytics?evento=eq.page_view&select=id`, { headers: authHeaders() });
    if (views.ok) {
      const data = await views.json();
      document.getElementById('stat-total-views').textContent = data.length;
    }

    const shares = await fetch(`${SUPA_URL}/rest/v1/seo_analytics?evento=eq.share_whatsapp&select=id`, { headers: authHeaders() });
    if (shares.ok) {
      const data = await shares.json();
      document.getElementById('stat-total-shares').textContent = data.length;
    }

    const cta = await fetch(`${SUPA_URL}/rest/v1/seo_analytics?evento=eq.cta_clube&select=id`, { headers: authHeaders() });
    if (cta.ok) {
      const data = await cta.json();
      document.getElementById('stat-total-cta').textContent = data.length;
    }
  } catch(e) { console.warn('Stats blog erro:', e); }
}

// ── ABA SUPORTE: Reportar erros + Gerar prompt IA ───────
// Coleta contexto técnico e devolve um prompt estruturado pronto
// para colar em ChatGPT/Claude com o repositório do projeto aberto.
const SUP_WHATSAPP = '5516999916690'; // destino padrão do botão WhatsApp

function _supInfoDispositivo() {
  var ua = navigator.userAgent || '';
  var plataforma = navigator.platform || '';
  var tela = (window.screen ? (window.screen.width + 'x' + window.screen.height) : '?');
  var viewport = (window.innerWidth + 'x' + window.innerHeight);
  var online = navigator.onLine ? 'sim' : 'nao';
  var idioma = navigator.language || '';
  var swAtivo = ('serviceWorker' in navigator) && navigator.serviceWorker.controller ? 'sim' : 'nao';
  var appVersion = '';
  try { appVersion = localStorage.getItem('clube_app_version') || '?'; } catch(e) { appVersion = '?'; }
  var deviceId = '';
  try { deviceId = (localStorage.getItem('clube_device_id') || '').slice(0,8) + '...'; } catch(e) { deviceId = '?'; }
  return { ua, plataforma, tela, viewport, online, idioma, swAtivo, appVersion, deviceId };
}

function _supAbaAtiva() {
  var ativa = document.querySelector('#admin-app .screen.active');
  return ativa ? ativa.id.replace('screen-','') : '?';
}

function renderizarSuporte() {
  try {
    var info = _supInfoDispositivo();
    var el = document.getElementById('sup-device');
    if (el) {
      el.innerHTML = ''; // seguro: só inserimos texto via textContent abaixo
      var linhas = [
        'App version: ' + info.appVersion,
        'Device ID: ' + info.deviceId,
        'Plataforma: ' + info.plataforma,
        'Tela: ' + info.tela + ' (viewport ' + info.viewport + ')',
        'Idioma: ' + info.idioma + ' · Online: ' + info.online + ' · SW: ' + info.swAtivo,
        'User-Agent: ' + info.ua
      ];
      linhas.forEach(function(l){ var d = document.createElement('div'); d.textContent = l; el.appendChild(d); });
    }
    var logs = document.getElementById('sup-logs');
    if (logs) {
      var arr = (window.__clubeErros || []);
      if (!arr.length) {
        logs.innerHTML = '<div style="text-align:center;padding:16px;color:var(--gray)">Nenhum erro capturado</div>';
      } else {
        logs.innerHTML = '';
        arr.slice().reverse().forEach(function(er) {
          var box = document.createElement('div');
          box.style.cssText = 'border-left:3px solid #e74c3c;background:rgba(192,57,43,.08);padding:8px 10px;margin-bottom:6px;border-radius:4px';
          var hora = document.createElement('div');
          hora.style.cssText = 'color:var(--gold-dark);font-size:10px;margin-bottom:4px';
          hora.textContent = (er.t || '') + ' · ' + (er.tipo || '');
          var msg = document.createElement('div');
          msg.style.cssText = 'color:#e74c3c;font-weight:600;margin-bottom:2px';
          msg.textContent = er.msg || '';
          var meta = document.createElement('div');
          meta.style.cssText = 'color:var(--gray);font-size:10px';
          meta.textContent = (er.fonte ? er.fonte : '') + (er.linha ? (':' + er.linha + ':' + er.coluna) : '');
          var stack = document.createElement('pre');
          stack.style.cssText = 'color:var(--gray);font-size:10px;margin:4px 0 0;white-space:pre-wrap;word-break:break-word';
          stack.textContent = er.stack || '';
          box.appendChild(hora); box.appendChild(msg);
          if (meta.textContent) box.appendChild(meta);
          if (stack.textContent) box.appendChild(stack);
          logs.appendChild(box);
        });
      }
    }
  } catch (e) { console.warn('renderizarSuporte', e); }
}

function _supMontarPrompt() {
  var titulo   = (document.getElementById('sup-titulo')?.value || '').trim();
  var passos   = (document.getElementById('sup-passos')?.value || '').trim();
  var esperado = (document.getElementById('sup-esperado')?.value || '').trim();
  var ocorrido = (document.getElementById('sup-ocorrido')?.value || '').trim();
  var info = _supInfoDispositivo();
  var aba = _supAbaAtiva();
  var erros = (window.__clubeErros || []).slice(-10);

  var txt = '';
  txt += '# Bug report — Clube Prime (admin PWA)\n\n';
  txt += '## Contexto do projeto\n';
  txt += '- App: Clube Prime (PWA de fidelidade do Empório Família Rodrigues)\n';
  txt += '- Repo: github.com/natozar/clube-prime  ·  Produção: https://carnesrodrigues.com.br\n';
  txt += '- Stack: HTML/CSS/JS vanilla + Supabase (PostgREST + RLS) + OneSignal + GitHub Pages\n';
  txt += '- Auth: device-binding (clientes.device_id) para clientes; Supabase Auth magic link para admin\n';
  txt += '- Segurança: 5 tabelas sensíveis (clientes, pontos, transacoes, resgate, pedidos) com RLS deny-all anon; reads via 14 RPCs SECURITY DEFINER\n\n';
  txt += '## Descrição do problema\n';
  txt += '**Título:** ' + (titulo || '(não informado)') + '\n\n';
  txt += '**Passos que reproduziram o erro:**\n' + (passos || '(não informado)') + '\n\n';
  txt += '**Comportamento esperado:**\n' + (esperado || '(não informado)') + '\n\n';
  txt += '**Comportamento observado:**\n' + (ocorrido || '(não informado)') + '\n\n';
  txt += '## Estado no momento do report\n';
  txt += '- Aba ativa: ' + aba + '\n';
  txt += '- URL: ' + location.href + '\n';
  txt += '- Timestamp: ' + new Date().toISOString() + '\n';
  txt += '- App version (boot-purge): ' + info.appVersion + '\n';
  txt += '- Device ID (prefix): ' + info.deviceId + '\n';
  txt += '- Plataforma: ' + info.plataforma + '\n';
  txt += '- Tela: ' + info.tela + ' (viewport ' + info.viewport + ')\n';
  txt += '- Online: ' + info.online + ' · SW ativo: ' + info.swAtivo + '\n';
  txt += '- User-Agent: ' + info.ua + '\n\n';
  txt += '## Erros JS capturados (últimos ' + erros.length + ')\n';
  if (!erros.length) {
    txt += '_Nenhum erro registrado no buffer window.__clubeErros._\n\n';
  } else {
    txt += '```\n';
    erros.forEach(function(er, i) {
      txt += '[' + (i+1) + '] ' + er.t + ' (' + er.tipo + ')\n';
      txt += '    msg: ' + (er.msg || '') + '\n';
      if (er.fonte) txt += '    em: ' + er.fonte + ':' + er.linha + ':' + er.coluna + '\n';
      if (er.stack) txt += '    stack:\n' + er.stack.split('\n').map(function(l){return '      '+l;}).join('\n') + '\n';
    });
    txt += '```\n\n';
  }
  txt += '## O que preciso\n';
  txt += '1. Identifique a causa raiz olhando os arquivos relevantes (provavelmente `admin.js`, `admin.html`, `app.js`, `sql-*.sql` dependendo do domínio do bug).\n';
  txt += '2. Proponha a menor correção possível — nada de refatoração ampla.\n';
  txt += '3. Se o bug envolver Supabase/RLS, lembre que as 5 tabelas sensíveis estão com RLS deny-all anon + auth-all authenticated; use sempre `authHeaders()` (não `SH`).\n';
  txt += '4. Se envolver cache/PWA, considere se precisa bumpar `APP_VERSION` em `boot-purge.js` e `CACHE_NAME` em `sw.js`.\n';
  txt += '5. Devolva diff patch ou as linhas exatas a alterar.\n';
  return txt;
}

async function _supCopiarTexto(txt) {
  try {
    await navigator.clipboard.writeText(txt);
    return true;
  } catch (e) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e2) { return false; }
  }
}

async function gerarPromptSuporte() {
  var status = document.getElementById('sup-status');
  var out = document.getElementById('sup-prompt-out');
  var titulo = (document.getElementById('sup-titulo')?.value || '').trim();
  if (!titulo) {
    if (status) { status.textContent = '⚠️ Preencha ao menos o título do erro.'; status.style.color = '#e74c3c'; }
    return;
  }
  var prompt = _supMontarPrompt();
  if (out) out.value = prompt;
  var ok = await _supCopiarTexto(prompt);
  if (status) {
    status.textContent = ok ? '✅ Prompt copiado para o clipboard. Cole no ChatGPT ou Claude.' : '⚠️ Não consegui copiar automaticamente — copie manualmente da caixa abaixo.';
    status.style.color = ok ? 'var(--green)' : '#e74c3c';
  }
}

async function copiarPromptSuporte() {
  var out = document.getElementById('sup-prompt-out');
  var txt = out ? out.value : '';
  if (!txt) { gerarPromptSuporte(); return; }
  var ok = await _supCopiarTexto(txt);
  var status = document.getElementById('sup-status');
  if (status) {
    status.textContent = ok ? '✅ Copiado de novo.' : '⚠️ Falhou. Selecione o texto e copie manualmente.';
    status.style.color = ok ? 'var(--green)' : '#e74c3c';
  }
}

function enviarSuporteWhatsapp() {
  var titulo = (document.getElementById('sup-titulo')?.value || '').trim();
  if (!titulo) {
    var status = document.getElementById('sup-status');
    if (status) { status.textContent = '⚠️ Preencha ao menos o título do erro.'; status.style.color = '#e74c3c'; }
    return;
  }
  var prompt = _supMontarPrompt();
  var out = document.getElementById('sup-prompt-out');
  if (out) out.value = prompt;
  // WhatsApp trunca ~4000 chars no wa.me; mandamos resumo + aviso
  var resumo = prompt.length > 3500 ? prompt.slice(0, 3400) + '\n\n[...truncado — prompt completo copiado no clipboard]' : prompt;
  _supCopiarTexto(prompt);
  var url = 'https://wa.me/' + SUP_WHATSAPP + '?text=' + encodeURIComponent(resumo);
  window.open(url, '_blank', 'noopener');
}

function limparLogsSuporte() {
  window.__clubeErros = [];
  renderizarSuporte();
  var status = document.getElementById('sup-status');
  if (status) { status.textContent = '🗑️ Buffer de erros limpo.'; status.style.color = 'var(--gray)'; }
}
