// ── EVENT DELEGATION ────────────────────────────────────
// Replaces inline event handlers for CSP compliance
(function() {
  // Click delegation
  document.addEventListener('click', function(e) {
    // data-action: call named function
    var el = e.target.closest('[data-action]');
    if (el) {
      var action = el.dataset.action;
      var arg = el.dataset.arg;
      var id = el.dataset.id;
      var delta = el.dataset.delta;
      // Simple no-arg actions
      if (typeof window[action] === 'function') {
        if (id !== undefined && delta !== undefined) {
          window[action](parseInt(id), parseInt(delta));
        } else if (id !== undefined) {
          window[action](parseInt(id), el);
        } else if (arg !== undefined) {
          window[action](arg, el);
        } else {
          window[action](el);
        }
      }
      return;
    }
    // data-nav: screen navigation
    el = e.target.closest('[data-nav]');
    if (el) {
      S(el.dataset.nav, el);
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

  // Input delegation for PIN fields
  document.addEventListener('input', function(e) {
    var el = e.target;
    // PIN auto-next
    if (el.dataset.pinNext) {
      el.value = el.value.replace(/\D/g, '');
      if (el.value.length === 1) {
        var next = document.getElementById(el.dataset.pinNext);
        if (next) next.focus();
      }
    }
    // data-oninput
    if (el.dataset.oninput && typeof window[el.dataset.oninput] === 'function') {
      window[el.dataset.oninput]();
    }
  });

  // Keydown delegation for PIN backspace
  document.addEventListener('keydown', function(e) {
    var el = e.target;
    if (e.key === 'Backspace' && el.dataset.pinPrev && el.value === '') {
      var prev = document.getElementById(el.dataset.pinPrev);
      if (prev) { prev.focus(); prev.select(); }
    }
    // data-enter-action
    if (e.key === 'Enter' && el.dataset.enterAction) {
      if (typeof window[el.dataset.enterAction] === 'function') {
        window[el.dataset.enterAction]();
      }
    }
  });

  // Focus delegation for PIN auto-select
  document.addEventListener('focus', function(e) {
    if (e.target.classList.contains('pin-input')) {
      e.target.select();
    }
  }, true);

  // Change delegation
  document.addEventListener('change', function(e) {
    if (e.target.dataset.onchange && typeof window[e.target.dataset.onchange] === 'function') {
      window[e.target.dataset.onchange]();
    }
  });
})();

// ── ONESIGNAL INIT ──────────────────────────────────────
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "204a1304-2cc4-44b8-af83-f35ceaabd504",
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "/sw.js",
      notifyButton: { enable: false },
      promptOptions: { autoPrompt: false },
    });
  });

// ── API CACHE ────────────────────────────────────────────
// In-memory cache for API responses to reduce network requests
var ApiCache = (function() {
  var cache = new Map();
  return {
    get: function(key) {
      var entry = cache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiry) { cache.delete(key); return null; }
      return entry.data;
    },
    set: function(key, data, ttlMs) {
      cache.set(key, { data: data, expiry: Date.now() + (ttlMs || 300000) });
    },
    clear: function() { cache.clear(); }
  };
})();

// Debounce helper for search inputs
function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// ── MAIN APP ────────────────────────────────────────────
const params=new URLSearchParams(window.location.search);
const ref=params.get('ref');
if(ref){document.getElementById('ref-banner').style.display='block';document.getElementById('ref-name').textContent='um amigo';}

// Gerar código único do cartão
function gerarCodigo(nome) {
  const iniciais = nome.trim().split(' ').filter(Boolean).map(p=>p[0].toUpperCase()).slice(0,2).join('');
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return iniciais + '-' + num;
}

// Detectar indicação pela URL
const refCodigo = new URLSearchParams(window.location.search).get('ref');

// Preencher tela com dados do cliente
let qrUrl = ''; // URL do QR para reutilizar no expandido

function gerarQRCode(codigo) {
  const box = document.getElementById('qr-box');
  if (!box) return;
  box.innerHTML = ''; // SANITIZED: static
  qrUrl = window.location.origin + window.location.pathname + '?scan=' + codigo;
  new QRCode(box, {
    text: qrUrl,
    width: 94,
    height: 94,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

function abrirQRExpandido() {
  if (!qrUrl) return;
  const overlay = document.getElementById('qr-overlay');
  const box = document.getElementById('qr-overlay-box');
  const nome = document.getElementById('qr-overlay-nome');
  const codigo = document.getElementById('qr-overlay-codigo');
  box.innerHTML = ''; // SANITIZED: static
  new QRCode(box, {
    text: qrUrl,
    width: 280,
    height: 280,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  nome.textContent = clienteNome || '';
  codigo.textContent = clienteCodigo ? '#' + clienteCodigo : '';
  overlay.classList.add('active');
}

function fecharQRExpandido() {
  document.getElementById('qr-overlay').classList.remove('active');
}

async function preencherTela(cliente, saldo) {
  clienteId = cliente.id;
  clienteCodigo = cliente.codigo;
  clienteNome = cliente.nome.split(' ')[0];
  // Salvar dados localmente + sessão segura
  SecureStorage.set('clube_cliente_dados', JSON.stringify(cliente));
  SecureStorage.set('clube_cliente_saldo', String(saldo));
  SecureStorage.set('clube_cliente_tel', cliente.telefone);
  // Criar/renovar sessão segura se não existir
  if (!validarSessaoCliente()) {
    salvarSessaoCliente(cliente);
  } else {
    renovarSessaoSeNecessario();
  }

  // OneSignal — vincula este dispositivo ao ID do cliente para receber notificações
  if (window.OneSignalDeferred) {
    OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.login(String(cliente.id));
        console.log('[Push] OneSignal login:', cliente.id);
      } catch(e) {
        console.warn('[Push] OneSignal login falhou, retry em 5s:', e);
        setTimeout(() => {
          OneSignalDeferred.push(async (os) => {
            try { await os.login(String(cliente.id)); console.log('[Push] OneSignal login retry OK'); }
            catch(e2) { console.error('[Push] OneSignal login retry falhou:', e2); }
          });
        }, 5000);
      }
    });
  }
  // Mostrar banner customizado de notificações (se ainda não aceitou)
  mostrarBannerNotif();

  document.getElementById('display-nome').textContent = cliente.nome;
  const nomes = cliente.nome.split(' ');
  const sobrenomeInicial = nomes.length > 1 ? ' ' + nomes[nomes.length - 1][0] + '.' : '';
  document.getElementById('card-nome').textContent = nomes[0] + sobrenomeInicial;
  const pts = saldo || 0;
  document.querySelectorAll('.pts-val, #saldo-pts').forEach(el => el.textContent = pts.toLocaleString('pt-BR'));
  // Código do cartão
  const codigoEl = document.getElementById('card-codigo');
  if (codigoEl) codigoEl.textContent = '#' + cliente.codigo;
  const pontosCodigoEl = document.getElementById('pontos-codigo');
  if (pontosCodigoEl) pontosCodigoEl.textContent = '#' + cliente.codigo;
  // Barra de progresso (usa regras dinâmicas)
  const regrasUI = getRegrasCliente();
  const META = regrasUI.metaPontos;
  const pct = Math.min(100, (pts / META) * 100);
  const faltam = Math.max(0, META - pts);
  document.querySelectorAll('.prog-fill').forEach(el => el.style.width = pct + '%');
  document.querySelectorAll('.prog-label').forEach(el => el.textContent = pts + ' / ' + META.toLocaleString('pt-BR') + ' pts');
  const progRestEl = document.querySelector('.prog-header span:last-child');
  if (progRestEl) progRestEl.textContent = faltam.toLocaleString('pt-BR') + ' pts restantes';
  // Modal excluir conta
  const delPtsEl = document.getElementById('del-pontos');
  if (delPtsEl) delPtsEl.textContent = pts.toLocaleString('pt-BR') + ' pontos';
  // Carregar dados em paralelo (regras, stats, extrato, rede)
  atualizarLinkConvite();
  verificar5k(pts);
  gerarQRCode(cliente.codigo);
  atualizarStatusResgate(pts);
  preencherPerfil(cliente);
  await Promise.all([
    carregarRegrasDoServidor(),
    carregarStats(cliente.id, pts),
    carregarExtrato(cliente.id),
    carregarRede(cliente, pts)
  ]);
  document.getElementById('screen-cad').classList.remove('active');
  document.getElementById('screen-cartao').classList.add('active');
  document.getElementById('bnav').style.display = 'flex';

  // Verificar PIN de segurança do cliente
  const temPin = await verificarPinCliente(cliente.id);
  atualizarPinPerfil(temPin);

  // Verificar se PIN já foi confirmado nesta sessão
  const sessaoAtual = validarSessaoCliente();
  const pinJaVerificado = sessaoAtual && sessaoAtual.pinVerificado === true;

  // Se admin pediu reset do PIN, forçar criação de novo PIN (sempre)
  if (pinResetPedido && !temPin) {
    setTimeout(() => abrirCriarPinObrigatorio(), 1000);
  }
  // Se PIN já verificado nesta sessão → entrar direto
  else if (pinJaVerificado) {
    // Nada a fazer — acesso liberado
  }
  // Se tem PIN mas ainda não verificou nesta sessão → pedir
  else if (temPin) {
    setTimeout(() => pedirPinLogin(), 500);
  }
  // Se não tem PIN → forçar criação (obrigatório)
  else if (!temPin) {
    setTimeout(() => abrirCriarPinObrigatorio(), 1000);
  }
}

async function goApp() {
  const chk = document.getElementById('chk-termos');
  const nome = document.getElementById('inp-nome').value.trim();
  const paisEl = document.getElementById('inp-pais');
  const pais = paisEl ? paisEl.value.replace('-CA','').replace('+','') : '55';
  const telRaw = document.getElementById('inp-tel').value.trim().replace(/\D/g,'');
  const tel = pais + telRaw;
  const nasc = lerDataSelects('inp-nasc');

  if (!tel) {
    alert('Preencha o WhatsApp para continuar!');
    return;
  }

  const btn = document.querySelector('.cad-btn');
  btn.textContent = 'Aguarde...';
  btn.disabled = true;

  try {
    // 1. Verificar se já é cadastrado pelo telefone
    let cliente = await buscarCliente(tel);

    if (cliente) {
      // Já cadastrado — basta o telefone para entrar (nome não é obrigatório)
      const r = await fetch(`${SUPA_URL}/rest/v1/pontos?cliente_id=eq.${cliente.id}`, { headers: SH });
      const pts = r.ok ? await r.json() : [];
      await preencherTela(cliente, pts[0]?.saldo || 0);
      SecureStorage.set('clube_cliente_id', cliente.id);
      SecureStorage.set('clube_cliente_tel', tel);
      // Criar sessão segura
      salvarSessaoCliente(cliente);
      // Sugerir criação de PIN se não tem e não foi lembrado recentemente
      if (!clientePinHash && devesugerirPin()) sugerirCriacaoPin();
    } else {
      // Novo cadastro — nome é obrigatório
      if (!nome) {
        alert('Para o primeiro cadastro, preencha seu nome completo!');
        btn.textContent = 'Entrar no Clube Prime →';
        btn.disabled = false;
        return;
      }
      // Aceitar termos é obrigatório para novos cadastros
      if (chk && !chk.checked) {
        alert('Por favor, aceite os Termos de Uso e Política de Privacidade para continuar.');
        btn.textContent = 'Entrar no Clube Prime →';
        btn.disabled = false;
        return;
      }
      cliente = await cadastrarCliente({ nome, telefone: tel, nascimento: nasc || null });

      if (cliente) {
        preencherTela(cliente, 0);
        SecureStorage.set('clube_cliente_id', cliente.id);
        SecureStorage.set('clube_cliente_tel', tel);
        // Notificar admin sobre novo cadastro (fire-and-forget)
        notificarAdminNovoCliente(nome, tel);
        // Criar sessão segura
        salvarSessaoCliente(cliente);
      }
    }
  } catch(e) {
    console.error('goApp error:', e);
    alert('Erro: ' + (e.message || 'Verifique sua conexão e tente novamente.'));
  } finally {
    btn.textContent = 'Entrar no Clube Prime →';
    btn.disabled = false;
  }
}

// Auto-login seguro — verifica token de sessão antes de restaurar
window.addEventListener('load', async () => {
  const sessao = validarSessaoCliente();
  const tel = await SecureStorage.get('clube_cliente_tel');
  const clienteLocal = await SecureStorage.get('clube_cliente_dados');

  // Só faz auto-login se a sessão for válida (não expirada)
  if (sessao && (tel || clienteLocal)) {
    // Mostrar tela do cliente imediatamente com dados locais (evita piscar cadastro)
    if (clienteLocal) {
      try {
        const dadosLocal = JSON.parse(clienteLocal);
        const saldoLocal = parseInt(await SecureStorage.get('clube_cliente_saldo') || '0');
        preencherTela(dadosLocal, saldoLocal);
      } catch(e) {}
    }
    // Atualizar em background com dados do banco
    const telSessao = sessao.telefone || tel;
    if (telSessao) {
      try {
        const cliente = await buscarCliente(telSessao);
        if (cliente) {
          const r = await fetch(`${SUPA_URL}/rest/v1/pontos?cliente_id=eq.${cliente.id}`, { headers: SH });
          const pts = r.ok ? await r.json() : [];
          const saldo = pts[0]?.saldo || 0;
          // Salvar dados atualizados localmente
          SecureStorage.set('clube_cliente_dados', JSON.stringify(cliente));
          SecureStorage.set('clube_cliente_saldo', String(saldo));
          preencherTela(cliente, saldo);
        } else if (clienteLocal) {
          // Banco não respondeu mas temos dados locais — manter logado
          console.log('Usando dados locais — banco indisponível');
        }
      } catch(e) {
        // Erro de rede — usar dados locais, nunca deslogar
        console.log('Offline — usando dados locais');
      }
    }
    // Renovar sessão se perto de expirar
    renovarSessaoSeNecessario();
  } else if (!sessao && (tel || clienteLocal)) {
    // Sessão expirada — limpar dados antigos, mostrar tela de login
    limparSessaoCliente();
    console.log('Sessão expirada — necessário novo login');
    // Destacar que basta informar o telefone para entrar novamente
    const hintEl = document.querySelector('.cad-hint');
    if (hintEl) {
      hintEl.innerHTML = '<strong style="color:#C9A84C">Bem-vindo de volta!</strong> Informe apenas seu WhatsApp para acessar seu cartão.'; // SANITIZED: static
    }
    // Focar no campo de telefone
    const telInput = document.getElementById('inp-tel');
    if (telInput) setTimeout(() => telInput.focus(), 500);
  }
});
async function acessarCartao() {
  const paisEl = document.getElementById('inp-pais');
  const pais = paisEl ? paisEl.value.replace('-CA','').replace('+','') : '55';
  const telRaw = document.getElementById('inp-tel').value.trim().replace(/\D/g,'');
  const tel = pais + telRaw;
  if (!telRaw) { alert('Digite seu WhatsApp para acessar seu cartão!'); return; }
  try {
    const cliente = await buscarCliente(tel);
    if (cliente) {
      const r = await fetch(`${SUPA_URL}/rest/v1/pontos?cliente_id=eq.${cliente.id}`, { headers: SH });
      const pts = r.ok ? await r.json() : [];
      await preencherTela(cliente, pts[0]?.saldo || 0);
      SecureStorage.set('clube_cliente_id', cliente.id);
      SecureStorage.set('clube_cliente_tel', tel);
      // Criar sessão segura para manter logado
      salvarSessaoCliente(cliente);
      // Sugerir criação de PIN se não tem
      if (!clientePinHash && devesugerirPin()) sugerirCriacaoPin();
    } else {
      alert('Número não encontrado. Faça seu cadastro!');
    }
  } catch(e) {
    console.error('acessarCartao error:', e);
    alert('Erro ao buscar. Verifique sua conexão.');
  }
}

function S(n,btn){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.bn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+n).classList.add('active');
  btn.classList.add('active');
  if(n==='cardapio') carregarCardapioCliente();
  if(n==='blog') carregarBlogUsuario();
}

let blogUsuarioCarregado = false;
async function carregarBlogUsuario() {
  if (blogUsuarioCarregado) return;
  try {
    // Cotação mais recente
    const cotRes = await fetch(`${SUPA_URL}/rest/v1/cotacao_arroba?order=data.desc&limit=1`, { headers: SH });
    if (cotRes.ok) {
      const [cot] = await cotRes.json();
      if (cot) {
        document.getElementById('blog-cotacao-valor').textContent = 'R$ ' + parseFloat(cot.preco_rs).toFixed(2) + '/@';
        if (cot.variacao_pct) {
          const v = parseFloat(cot.variacao_pct);
          const el = document.getElementById('blog-cotacao-var');
          el.style.color = v >= 0 ? '#4CAF50' : '#EF5350';
          el.textContent = (v > 0 ? '+' : '') + v.toFixed(2) + '% no dia';
        }
      }
    }
    // Artigos
    const artRes = await fetch(`${SUPA_URL}/rest/v1/seo_artigos?ativo=eq.true&order=publicado_em.desc&limit=30`, { headers: SH });
    if (artRes.ok) {
      const artigos = await artRes.json();
      const catIcons = {cotacao:'📈',raca:'🐂',cruzamento:'🧬',corte:'🥩',regiao:'🗺️',guia:'📖',churrasco:'🔥',familia:'👨‍👩‍👧‍👦'};
      const el = document.getElementById('blog-artigos-lista');
      if (artigos.length) {
        el.innerHTML = artigos.map(a =>
          '<a href="/' + encodeURI(a.slug) + '" style="display:flex;gap:12px;align-items:center;text-decoration:none;padding:10px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.1);border-radius:10px">' +
            '<div style="font-size:24px;flex-shrink:0">' + (catIcons[a.categoria]||'📄') + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHTML(a.titulo) + '</div>' +
              '<div style="font-size:10px;color:var(--gray);margin-top:2px">' + escapeHTML(a.conteudo_resumo || '') + '</div>' +
            '</div>' +
            '<div style="color:var(--gold);font-size:16px;flex-shrink:0">›</div>' +
          '</a>'
        ).join(''); // SANITIZED
      } else {
        el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--gray);font-size:11px">Nenhum artigo publicado ainda.</div>'; // SANITIZED: static
      }
    }
    blogUsuarioCarregado = true;
  } catch(e) { console.warn('Blog load error:', e); }
}
// ID e código do cliente (em produção vem do banco)
let clienteId = null;
let clienteCodigo = 'CR847';
let clienteNome = 'Carlos';

// ── SESSÃO SEGURA DO CLIENTE ─────────────────────────────
// Gera token de sessão único (hash simples baseado em dados + timestamp)
function gerarTokenSessao(clienteId, telefone) {
  const raw = clienteId + '|' + telefone + '|' + Date.now() + '|' + Math.random().toString(36).slice(2);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// Salvar sessão segura no localStorage
function salvarSessaoCliente(cliente) {
  const token = gerarTokenSessao(cliente.id, cliente.telefone);
  const sessao = {
    token,
    clienteId: cliente.id,
    telefone: cliente.telefone,
    criadoEm: Date.now(),
    expiraEm: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias
    ultimoAcesso: Date.now()
  };
  SecureStorage.set('clube_sessao', JSON.stringify(sessao));
  return sessao;
}

// Validar sessão existente
function validarSessaoCliente() {
  try {
    const raw = localStorage.getItem('clube_sessao'); // TODO: migrate to async SecureStorage.get after init
    if (!raw) return null;
    const sessao = JSON.parse(raw);
    // Verificar expiração
    if (!sessao.expiraEm || Date.now() > sessao.expiraEm) {
      limparSessaoCliente();
      return null;
    }
    // Verificar integridade (token + clienteId devem existir)
    if (!sessao.token || !sessao.clienteId || !sessao.telefone) {
      limparSessaoCliente();
      return null;
    }
    // Atualizar último acesso
    sessao.ultimoAcesso = Date.now();
    SecureStorage.set('clube_sessao', JSON.stringify(sessao));
    return sessao;
  } catch(e) {
    limparSessaoCliente();
    return null;
  }
}

// Limpar sessão (logout)
function limparSessaoCliente() {
  SecureStorage.remove('clube_sessao');
  SecureStorage.remove('clube_cliente_id');
  SecureStorage.remove('clube_cliente_tel');
  SecureStorage.remove('clube_cliente_dados');
  SecureStorage.remove('clube_cliente_saldo');
}

// Marcar PIN como verificado na sessão atual (não pede de novo)
function marcarPinVerificado() {
  try {
    const raw = localStorage.getItem('clube_sessao'); // TODO: migrate to async SecureStorage.get after init
    if (!raw) return;
    const sessao = JSON.parse(raw);
    sessao.pinVerificado = true;
    SecureStorage.set('clube_sessao', JSON.stringify(sessao));
  } catch(e) {}
}

// Renovar sessão (estende por mais 30 dias se estiver perto de expirar)
function renovarSessaoSeNecessario() {
  try {
    const raw = localStorage.getItem('clube_sessao'); // TODO: migrate to async SecureStorage.get after init
    if (!raw) return;
    const sessao = JSON.parse(raw);
    const diasRestantes = (sessao.expiraEm - Date.now()) / (24 * 60 * 60 * 1000);
    // Renovar se faltam menos de 7 dias
    if (diasRestantes < 7) {
      sessao.expiraEm = Date.now() + (30 * 24 * 60 * 60 * 1000);
      sessao.ultimoAcesso = Date.now();
      SecureStorage.set('clube_sessao', JSON.stringify(sessao));
    }
  } catch(e) {}
}

function getLinkConvite() {
  return window.location.origin + window.location.pathname.replace('index.html','') + '?ref=' + clienteCodigo;
}

function compartilhar(){
  const url = getLinkConvite();
  if(navigator.share) navigator.share({title:'Clube Prime',text:'Entre no Clube Prime do Empório Família Rodrigues pelo meu link!',url});
  else navigator.clipboard.writeText(url).then(()=>alert('Link copiado!'));
}

function copiarLink(){
  const url = getLinkConvite();
  navigator.clipboard.writeText(url).then(()=>{
    const btn = event.target;
    btn.textContent = '✓ Copiado!';
    setTimeout(()=>btn.textContent='📋 Copiar link', 2000);
  });
}

function compartilharWhats(){
  const url = getLinkConvite();
  const msg = encodeURIComponent('Oi! Entrei no Clube Prime do Empório Família Rodrigues e você também pode! Use meu link para se cadastrar e ganhar pontos: ' + url);
  window.open('https://wa.me/?text=' + msg, '_blank');
}

function compartilharCupom(){
  const regras = getRegrasCliente();
  const msg = `Meu cupom do Clube Prime: *PRIME100* — R$${regras.valorCupom} de desconto em compras acima de R$${regras.compraMinima} no Empório Família Rodrigues! 🥩 Válido por ${regras.validadeCupom} dias.`;
  if(navigator.share) navigator.share({title:'Cupom Clube Prime', text:msg});
  else navigator.clipboard.writeText(msg).then(()=>alert('Cupom copiado!'));
}

// Verificar se atingiu 5.000 pontos e mostrar alerta
function verificar5k(saldo) {
  const regras = getRegrasCliente();
  const ja_viu = localStorage.getItem('5k-alerta-' + clienteCodigo);
  if(saldo >= regras.metaPontos && !ja_viu) {
    // Atualizar modal com regras dinâmicas
    const titleEl = document.getElementById('modal-5k-title');
    const textEl = document.getElementById('modal-5k-text');
    const codeEl = document.getElementById('cupom-code');
    const descEl = document.getElementById('cupom-valor-desc');
    if (titleEl) titleEl.textContent = `Você chegou aos ${regras.metaPontos.toLocaleString('pt-BR')} pontos!`;
    if (textEl) textEl.innerHTML = `Parabéns! Você acumulou <strong style="color:var(--gold)">${escapeHTML(String(regras.metaPontos.toLocaleString('pt-BR')))} pontos Prime</strong>.<br>Troque por um cupom de desconto!<br><br><span style="font-size:10px;color:var(--gray)">⏰ Válido por ${escapeHTML(String(regras.validadeCupom))} dias · Compras acima de R$${escapeHTML(String(regras.compraMinima))}</span>`; // SANITIZED
    if (codeEl) codeEl.textContent = 'PRIME' + regras.valorCupom;
    if (descEl) descEl.textContent = `R$ ${regras.valorCupom} de desconto · compras acima de R$${regras.compraMinima}`;
    setTimeout(()=>{
      document.getElementById('mo-5k').classList.add('open');
      localStorage.setItem('5k-alerta-' + clienteCodigo, '1');
    }, 1500);
  }
}

// Atualizar link de convite na tela
function atualizarLinkConvite() {
  const el = document.getElementById('share-url-text');
  if(el) el.textContent = getLinkConvite();
}
document.querySelectorAll('.mo').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
// ── SERVICE WORKER ────────────────────────────────────────
if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // GitHub Pages usa subpasta /
    const swPath = location.pathname.includes('/clube-prime') ? '/clube-prime/sw.js' : '/sw.js';
    navigator.serviceWorker.register(swPath).then(reg => {
      // Forçar verificação de update a cada carregamento
      reg.update().catch(() => {});
    }).catch(()=>{});
  });
}

// ── PWA INSTALL POPUP ─────────────────────────────────────
let deferredPrompt = null;
const pwaBanner = document.getElementById('pwa-banner');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

if (!isStandalone && !localStorage.getItem('pwa-installed')) {
  if (isIOS) {
    // iOS: mostrar instruções de "Adicionar à Tela Inicial"
    const last = localStorage.getItem('pwa-dismissed');
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (!last || Date.now() - parseInt(last) > threeDays) {
      setTimeout(() => { if (pwaBanner) pwaBanner.classList.add('show'); }, 3000);
      const installBtn = document.getElementById('install-btn');
      if (installBtn) {
        installBtn.textContent = 'Ver como';
        installBtn.addEventListener('click', () => {
          if (pwaBanner) pwaBanner.classList.remove('show');
          const iosModal = document.getElementById('ios-modal');
          if (iosModal) iosModal.classList.add('open');
        });
      }
    }
  } else {
    // Android/Desktop: beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const last = localStorage.getItem('pwa-dismissed');
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (!last || Date.now() - parseInt(last) > threeDays) {
        setTimeout(() => { if (pwaBanner) pwaBanner.classList.add('show'); }, 2500);
      }
    });

    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          if (pwaBanner) pwaBanner.classList.remove('show');
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          deferredPrompt = null;
          if (outcome === 'accepted') localStorage.setItem('pwa-installed', '1');
        }
      });
    }
  }
}

const dismissBtn = document.getElementById('dismiss-btn');
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    if (pwaBanner) pwaBanner.classList.remove('show');
    localStorage.setItem('pwa-dismissed', String(Date.now()));
  });
}

// Esconder banner se já instalado
window.addEventListener('appinstalled', () => {
  if (pwaBanner) pwaBanner.classList.remove('show');
  localStorage.setItem('pwa-installed', '1');
});

// ── NOTIFICAÇÕES — Prompt Customizado ─────────────────────
function mostrarBannerNotif() {
  if (!('Notification' in window) || !window.OneSignalDeferred) return;

  OneSignalDeferred.push(async (OneSignal) => {
    try {
      // 1. Verificar subscription real no OneSignal
      var permission = OneSignal.Notifications.permission;
      var pushSub = OneSignal.User.PushSubscription;

      // Caso 1: Tem permissão E subscription ativa → tudo OK
      if (permission && pushSub && pushSub.id && pushSub.optedIn) {
        console.log('[Push] Subscription ativa:', pushSub.id);
        return;
      }

      // Caso 2: Tem permissão do browser mas OneSignal não registrou → forçar opt-in
      if (Notification.permission === 'granted') {
        console.warn('[Push] Permissão granted mas sem subscription — forçando opt-in');
        await OneSignal.User.PushSubscription.optIn();
        return;
      }

      // Caso 3: Permissão negada → não insistir
      if (Notification.permission === 'denied') return;

      // Caso 4: Permissão default → mostrar banner customizado
      var dispensou = localStorage.getItem('notif-dismissed');
      var seteDias = 7 * 24 * 60 * 60 * 1000;
      if (dispensou && Date.now() - parseInt(dispensou) < seteDias) return;

      setTimeout(function() {
        var pwa = document.getElementById('pwa-banner');
        if (pwa && pwa.classList.contains('show')) {
          var obs = new MutationObserver(function() {
            if (!pwa.classList.contains('show')) { obs.disconnect(); mostrarNotifBanner(); }
          });
          obs.observe(pwa, { attributes: true, attributeFilter: ['class'] });
        } else {
          mostrarNotifBanner();
        }
      }, 3500);
    } catch(e) {
      console.error('[Push] Erro ao verificar subscription:', e);
    }
  });
}

function mostrarNotifBanner() {
  document.getElementById('notif-banner').classList.add('show');
}

document.getElementById('notif-accept-btn').addEventListener('click', async () => {
  document.getElementById('notif-banner').classList.remove('show');
  localStorage.setItem('notif-accepted', '1');
  // Pede permissão real via OneSignal + opt-in explícito
  if (window.OneSignalDeferred) {
    OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        // Garantir opt-in explícito após permissão
        if (Notification.permission === 'granted') {
          await OneSignal.User.PushSubscription.optIn();
          console.log('[Push] Subscription ativada com sucesso');
        }
      } catch(e) { console.warn('[Push] Permission/optIn error:', e); }
    });
  }
});

document.getElementById('notif-deny-btn').addEventListener('click', () => {
  document.getElementById('notif-banner').classList.remove('show');
  localStorage.setItem('notif-dismissed', String(Date.now()));
});

// ── SUPABASE ──────────────────────────────────────────────
const SUPA_URL = 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
const SH = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };
const ONESIGNAL_PUSH_URL = `${SUPA_URL}/functions/v1/onesignal-push`;

// Notificar admin sobre novo cliente (fire-and-forget, não bloqueia o cadastro)
function notificarAdminNovoCliente(nome, telefone) {
  fetch(ONESIGNAL_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    body: JSON.stringify({ type: 'novo_cliente', nomeCliente: nome, telefoneCliente: telefone })
  }).catch(() => {}); // silencioso — não deve afetar a experiência do cliente
}

// Sanitização contra XSS (fallback seguro caso DOMPurify falhe no carregamento)
function escapeHTML(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function sanitize(str) { return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(str) : escapeHTML(String(str)); }

// ── REGRAS DE PONTUAÇÃO (sincronizadas com admin) ──────
const REGRAS_DEFAULT = {
  ptsPorReal: 1,
  bonusIndicacao: 2,
  metaPontos: 5000,
  valorCupom: 100,
  compraMinima: 200,
  validadeCupom: 30,
  perdePontos: true
};

function getRegrasCliente() {
  const saved = localStorage.getItem('clube-prime-regras');
  return saved ? JSON.parse(saved) : REGRAS_DEFAULT;
}

async function carregarRegrasDoServidor() {
  try {
    var cached = ApiCache.get('regras');
    if (cached) {
      localStorage.setItem('clube-prime-regras', JSON.stringify(cached));
      return cached;
    }
    const r = await fetch(`${SUPA_URL}/rest/v1/configuracoes?chave=eq.regras_pontuacao&select=valor`, { headers: SH });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.length > 0 && d[0].valor) {
      const regras = JSON.parse(d[0].valor);
      ApiCache.set('regras', regras, 300000);
      localStorage.setItem('clube-prime-regras', JSON.stringify(regras));
      return regras;
    }
  } catch(e) { console.warn('Regras do servidor não disponíveis, usando padrão'); }
  return null;
}

// Buscar cliente pelo telefone
async function buscarCliente(telefone) {
  try {
    const telNorm = telefone.replace(/\D/g,'');
    const r = await fetch(`${SUPA_URL}/rest/v1/clientes?telefone=eq.${telNorm}&select=*`, { headers: SH });
    if (!r.ok) {
      const d = await r.json();
      console.error('Erro ao buscar cliente:', d);
      throw new Error(d.message || 'Erro ao consultar banco');
    }
    const d = await r.json();
    return d[0] || null;
  } catch(e) {
    console.error('buscarCliente exception:', e);
    throw e;
  }
}

// Cadastrar novo cliente via RPC server-side (cria cliente + pontos atomicamente)
async function cadastrarCliente(dados) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/cadastrar_cliente_com_pontos`, {
      method: 'POST', headers: SH,
      body: JSON.stringify({
        p_nome: dados.nome,
        p_telefone: dados.telefone,
        p_nascimento: dados.nascimento || null,
        p_indicado_por: null // indicação pode ser adicionada futuramente
      })
    });
    if (!r.ok) {
      const errData = await r.json().catch(() => null);
      console.error('Erro RPC cadastrar_cliente_com_pontos:', errData);
      throw new Error(errData?.message || errData?.erro || 'Erro no cadastro. Verifique sua conexão.');
    }
    const d = await r.json();
    if (!d || !d.ok) {
      throw new Error(d?.erro || 'Erro no cadastro');
    }
    return d.cliente;
  } catch(e) {
    console.error('cadastrarCliente exception:', e);
    throw e;
  }
}

// Atualizar perfil do cliente
async function atualizarCliente(id, dados) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/clientes?id=eq.${id}`, {
      method: 'PATCH', headers: SH, body: JSON.stringify(dados)
    });
    return true;
  } catch(e) { return false; }
}

// Buscar transações do cliente
// Carregar extrato na tela de pontos
async function carregarExtrato(clienteId) {
  const lista = document.getElementById('extrato-lista');
  if (!lista) return;
  const trans = await buscarTransacoes(clienteId);
  if (!trans || trans.length === 0) {
    lista.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhuma transação ainda</div>'; // SANITIZED: static
    return;
  }
  lista.innerHTML = trans.map(t => {
    const isCompra = t.tipo === 'compra';
    const icon = isCompra ? '🥩' : '🎁';
    const pts = isCompra ? '+' + t.pontos : '−' + t.pontos;
    const cls = isCompra ? 'pi' : 'po';
    const data = new Date(t.created_at).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
    const desc = isCompra ? 'Compra · R$' + t.valor_reais.toFixed(0) : 'Resgate';
    return `<div class="tl-item"><div class="tl-icon">${icon}</div><div class="tl-info"><div class="tl-title">${escapeHTML(desc)}</div><div class="tl-meta">${escapeHTML(data)}</div></div><div class="tl-pts ${cls}">${escapeHTML(pts)}</div></div>`; // SANITIZED
  }).join('');
}

// ── VITRINE DE RECOMPENSAS ────────────────────────────────
let recompensasCliente = [];
let saldoAtualCliente = 0;

async function carregarVitrine(saldo) {
  saldoAtualCliente = saldo || 0;
  const el = document.getElementById('vitrine-recompensas');
  if (!el) return;
  try {
    var cached = ApiCache.get('recompensas');
    if (cached) {
      recompensasCliente = cached;
    } else {
      const r = await fetch(`${SUPA_URL}/rest/v1/recompensas?ativo=eq.true&order=pontos_necessarios.asc`, { headers: SH });
      if (!r.ok) { el.innerHTML = '<p style="color:var(--red);font-size:12px">Erro ao carregar recompensas</p>'; return; } // SANITIZED: static
      recompensasCliente = await r.json();
      ApiCache.set('recompensas', recompensasCliente, 300000);
    }
    if (!Array.isArray(recompensasCliente) || !recompensasCliente.length) {
      el.innerHTML = '<p style="color:var(--gray);font-size:12px">Nenhuma recompensa disponível no momento</p>'; // SANITIZED: static
      return;
    }
    el.innerHTML = recompensasCliente.map(rc => {
      const disponivel = saldo >= rc.pontos_necessarios;
      const faltam = rc.pontos_necessarios - saldo;
      return `
      <div style="padding:12px 0;border-bottom:1px solid rgba(201,168,76,.12);display:flex;align-items:center;gap:12px">
        <div style="font-size:28px;min-width:40px;text-align:center">🎁</div>
        <div style="flex:1">
          <div style="font-weight:600;color:var(--gold-light);font-size:14px">${sanitize(rc.nome)}</div>
          <div style="font-size:11px;color:var(--gray);margin-top:2px">${sanitize(rc.descricao || '')}</div>
        </div>
        <div style="text-align:right;min-width:90px">
          <div style="font-size:14px;font-weight:700;color:var(--gold)">${rc.pontos_necessarios.toLocaleString('pt-BR')} pts</div>
          ${disponivel
            ? `<button data-action="iniciarResgate" data-id="${rc.id}" style="margin-top:4px;background:var(--gold);color:#000;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.5px">RESGATAR</button>`
            : `<div style="font-size:10px;color:var(--red);margin-top:4px">faltam ${faltam.toLocaleString('pt-BR')} pts</div>`
          }
        </div>
      </div>`;
    }).join(''); // SANITIZED
  } catch(e) {
    console.error('carregarVitrine:', e);
    el.innerHTML = '<p style="color:var(--red);font-size:12px">Erro ao carregar recompensas</p>'; // SANITIZED: static
  }
}

async function carregarMeusCupons() {
  const el = document.getElementById('meus-cupons');
  if (!el || !clienteId) return;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/resgate?cliente_id=eq.${clienteId}&order=created_at.desc&select=*,recompensas(nome)`, { headers: SH });
    if (!r.ok) { el.innerHTML = '<p style="color:var(--red);font-size:12px">Erro ao carregar cupons</p>'; return; } // SANITIZED: static
    const lista = await r.json();
    if (!Array.isArray(lista) || !lista.length) {
      el.innerHTML = '<p style="color:var(--gray);font-size:12px">Nenhum cupom ainda</p>'; // SANITIZED: static
      return;
    }
    el.innerHTML = lista.map(rg => {
      const dt = new Date(rg.created_at).toLocaleDateString('pt-BR');
      const nome = rg.recompensas?.nome || rg.recompensa || '—';
      const statusMap = {
        pendente: {cor:'#f39c12',txt:'Pendente',icon:'⏳'},
        aprovado: {cor:'#27ae60',txt:'Aprovado',icon:'✅'},
        utilizado: {cor:'var(--gray)',txt:'Utilizado',icon:'☑️'},
        recusado: {cor:'#c0392b',txt:'Recusado',icon:'❌'},
        expirado: {cor:'var(--gray)',txt:'Expirado',icon:'⏰'}
      };
      const st = statusMap[rg.status] || {cor:'var(--gray)',txt:escapeHTML(rg.status),icon:'❓'};
      const cupom = escapeHTML(rg.codigo_cupom || '—');
      const validade = rg.validade ? new Date(rg.validade).toLocaleDateString('pt-BR') : '';
      return `
      <div style="padding:10px 0;border-bottom:1px solid rgba(201,168,76,.1)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;color:var(--gold-light);font-size:13px">${st.icon} ${sanitize(nome)}</div>
            <div style="font-size:11px;color:var(--gray);margin-top:2px">${rg.pontos_usados.toLocaleString('pt-BR')} pts · ${dt}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Fira Code',monospace;font-size:14px;font-weight:700;color:${st.cor};letter-spacing:2px">${cupom}</div>
            <div style="font-size:10px;color:${st.cor}">${st.txt}${validade ? ' · até ' + validade : ''}</div>
          </div>
        </div>
      </div>`;
    }).join(''); // SANITIZED
  } catch(e) {
    console.error('carregarMeusCupons:', e);
  }
}

function gerarCodigoCupom() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CP-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function iniciarResgate(recompensaId) {
  const rc = recompensasCliente.find(r => r.id === recompensaId);
  if (!rc) return;
  if (saldoAtualCliente < rc.pontos_necessarios) { alert('Pontos insuficientes.'); return; }
  if (!confirm(`Resgatar "${rc.nome}" por ${rc.pontos_necessarios.toLocaleString('pt-BR')} pontos?\n\nUm cupom será gerado para você apresentar na loja.`)) return;
  pedirPinParaResgate(() => executarResgate(rc));
}

async function executarResgate(rc) {
  if (!clienteId) return;
  const codigo = gerarCodigoCupom();
  const regras = getRegrasCliente();
  const validade = new Date();
  validade.setDate(validade.getDate() + (regras.validadeCupom || 30));
  try {
    // Resgate atômico via RPC server-side (valida saldo + desconta + cria resgate)
    const rr = await fetch(`${SUPA_URL}/rest/v1/rpc/executar_resgate_cliente`, {
      method: 'POST', headers: SH,
      body: JSON.stringify({
        p_cliente_id: clienteId,
        p_recompensa_id: rc.id,
        p_codigo_cupom: codigo,
        p_validade: validade.toISOString()
      })
    });
    if (!rr.ok) { alert('Erro de conexão ao processar resgate.'); return; }
    const resultado = await rr.json();

    if (!resultado || !resultado.ok) {
      alert(resultado?.erro || 'Erro ao processar resgate. Tente novamente.');
      return;
    }

    // Atualizar saldo local
    saldoAtualCliente = resultado.novo_saldo;
    document.querySelectorAll('.pts-val, #saldo-pts').forEach(el => el.textContent = resultado.novo_saldo.toLocaleString('pt-BR'));

    // Mostrar cupom
    alert(`Resgate confirmado!\n\nSeu cupom: ${resultado.codigo_cupom}\n\nApresente este código na loja para retirar:\n"${resultado.recompensa}"\n\nVálido até ${validade.toLocaleDateString('pt-BR')}`);

    // Atualizar vitrine e cupons
    await carregarVitrine(saldoAtualCliente);
    await carregarMeusCupons();
  } catch(e) {
    console.error('executarResgate:', e);
    alert('Erro ao processar resgate. Tente novamente.');
  }
}

// Compat: manter função para código legado
function atualizarStatusResgate(pts) {
  saldoAtualCliente = pts;
  carregarVitrine(pts);
  carregarMeusCupons();
}

// Carregar estatísticas reais do banco
async function carregarStats(clienteId, saldo) {
  try {
    // Buscar total de compras
    const rt = await fetch(`${SUPA_URL}/rest/v1/transacoes?cliente_id=eq.${clienteId}&tipo=eq.compra&select=id,valor_reais`, { headers: SH });
    const trans = rt.ok ? await rt.json() : [];
    const totalCompras = Array.isArray(trans) ? trans.length : 0;
    const totalGasto = Array.isArray(trans) ? trans.reduce((s, t) => s + (t.valor_reais || 0), 0) : 0;

    // Buscar indicados
    const ri = await fetch(`${SUPA_URL}/rest/v1/clientes?indicado_por=eq.${clienteId}&select=id`, { headers: SH });
    const indicados = ri.ok ? await ri.json() : [];
    const totalIndicados = Array.isArray(indicados) ? indicados.length : 0;

    // Atualizar stat-cards na tela do cartão
    const elCompras = document.getElementById('stat-compras');
    if (elCompras) elCompras.textContent = totalCompras;
    const elIndicados = document.getElementById('stat-indicados');
    if (elIndicados) elIndicados.textContent = totalIndicados;
    const elBonus = document.getElementById('stat-bonus');
    if (elBonus) elBonus.textContent = '0'; // TODO: calcular bônus de indicação

    // Atualizar tela de pontos
    const elShGastos = document.getElementById('sh-gastos');
    if (elShGastos) elShGastos.textContent = 'R$' + Math.floor(totalGasto).toLocaleString('pt-BR');
    const elShBonus = document.getElementById('sh-bonus');
    if (elShBonus) elShBonus.textContent = '0';
    const elShIndicados = document.getElementById('sh-indicados');
    if (elShIndicados) elShIndicados.textContent = totalIndicados;
  } catch(e) {
    console.error('carregarStats:', e);
  }
}

// Carregar aba Indicar com dados reais
async function carregarRede(cliente, saldo) {
  // Preencher card do próprio usuário
  const iniciais = cliente.nome.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  const elInic = document.getElementById('net-me-iniciais');
  const elNome = document.getElementById('net-me-nome');
  const elSub  = document.getElementById('net-me-sub');
  if (elInic) elInic.textContent = iniciais;
  if (elNome) elNome.textContent = cliente.nome + ' (você)';
  if (elSub) elSub.textContent = '0 indicados · 2% permanente';

  const listaEl = document.getElementById('rede-indicados');
  if (listaEl) listaEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhum indicado ainda</div>'; // SANITIZED: static
  const bonusEl = document.getElementById('bonus-lista');
  if (bonusEl) bonusEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhum bônus ainda</div>'; // SANITIZED: static
}

async function buscarTransacoes(clienteId) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/transacoes?cliente_id=eq.${clienteId}&order=created_at.desc&limit=20`, { headers: SH });
    if (!r.ok) { console.error('buscarTransacoes erro:', r.status); return []; }
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch(e) { return []; }
}

// (Funções de resgate movidas para seção VITRINE DE RECOMPENSAS acima)
// ── PIN DE SEGURANÇA ─────────────────────────────────────
let clientePinHash = null; // hash do PIN carregado do banco
let pinResgateCallback = null; // callback após verificação do PIN no resgate

// Navegação automática entre inputs do PIN
function pinAutoNext(current, nextId) {
  current.value = current.value.replace(/\D/g, '');
  if (current.value.length === 1) {
    const next = document.getElementById(nextId);
    if (next) next.focus();
  }
}
function pinBackspace(event, current, prevId) {
  if (event.key === 'Backspace' && current.value === '') {
    const prev = document.getElementById(prevId);
    if (prev) { prev.focus(); prev.select(); }
  }
}

// Ler os 4 campos de PIN e retornar string
function lerPin(prefix) {
  return [1,2,3,4].map(i => {
    const el = document.getElementById(prefix + i);
    return el ? el.value : '';
  }).join('');
}

// Limpar campos de PIN
function limparPin(prefix) {
  [1,2,3,4].forEach(i => {
    const el = document.getElementById(prefix + i);
    if (el) el.value = '';
  });
}

// Hash simples do PIN (para não salvar em texto puro)
function hashPin(pin) {
  let hash = 0;
  const salt = 'clube-prime-2024';
  const str = salt + pin + salt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'ph_' + Math.abs(hash).toString(36);
}

// Verificar se cliente tem PIN cadastrado (busca do banco)
let pinResetPedido = false; // flag de reset solicitado pelo admin

async function verificarPinCliente(cId) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/clientes?id=eq.${cId}&select=pin_hash,pin_reset_pedido`, { headers: SH });
    if (!r.ok) return false;
    const d = await r.json();
    if (d[0]) {
      // Verificar se admin pediu reset
      pinResetPedido = d[0].pin_reset_pedido === true;
      if (d[0].pin_hash) {
        clientePinHash = d[0].pin_hash;
        return true;
      }
    }
    clientePinHash = null;
    return false;
  } catch(e) {
    return false;
  }
}

// Salvar PIN no banco via RPC server-side (com validação)
async function salvarPinNoBanco(cId, pinHash) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/salvar_pin_cliente`, {
      method: 'POST', headers: SH,
      body: JSON.stringify({ p_cliente_id: cId, p_pin_hash: pinHash })
    });
    if (!r.ok) return false;
    const d = await r.json();
    if (d && d.ok) { pinResetPedido = false; return true; }
    return false;
  } catch(e) { return false; }
}

// Abrir modal de criar PIN
function abrirCriarPin() {
  limparPin('pin-d');
  const erroEl = document.getElementById('pin-criar-erro');
  if (erroEl) erroEl.textContent = '';
  const moEl = document.getElementById('mo-pin-criar');
  if (moEl) moEl.classList.add('open');
  const pinD1 = document.getElementById('pin-d1');
  if (pinD1) setTimeout(() => pinD1.focus(), 300);
}

// Sugerir criação de PIN após login por telefone
function sugerirCriacaoPin() {
  // Só mostra se o cliente não tem PIN ainda
  if (!clientePinHash) {
    setTimeout(() => abrirCriarPin(), 1500);
  }
}

// Pedir PIN no login (para quem já tem PIN)
let pinLoginTentativas = 0;
function pedirPinLogin() {
  pinLoginTentativas = 0;
  limparPin('lpin-d');
  const pinErro = document.getElementById('pin-login-erro');
  if (pinErro) pinErro.textContent = '';
  const moPin = document.getElementById('mo-pin-login');
  if (moPin) moPin.classList.add('open');
  const lpinD1 = document.getElementById('lpin-d1');
  if (lpinD1) setTimeout(() => lpinD1.focus(), 300);
}

function confirmarPinLogin() {
  const pin = lerPin('lpin-d');
  if (pin.length !== 4) {
    document.getElementById('pin-login-erro').textContent = 'Digite os 4 dígitos do PIN.';
    return;
  }
  const tentativa = hashPin(pin);
  if (tentativa === clientePinHash) {
    // PIN correto — marcar na sessão para não pedir de novo
    document.getElementById('mo-pin-login').classList.remove('open');
    pinLoginTentativas = 0;
    marcarPinVerificado();
  } else {
    // PIN incorreto
    pinLoginTentativas++;
    limparPin('lpin-d');
    document.getElementById('lpin-d1').focus();
    if (pinLoginTentativas >= 5) {
      document.getElementById('pin-login-erro').textContent = 'Muitas tentativas erradas. Entre em contato com o Empório.';
      // Bloquear — voltar para tela de cadastro
      setTimeout(() => {
        document.getElementById('mo-pin-login').classList.remove('open');
        document.getElementById('screen-cartao').classList.remove('active');
        document.getElementById('screen-cad').classList.add('active');
        document.getElementById('bnav').style.display = 'none';
        alert('PIN bloqueado por excesso de tentativas. Entre em contato com o Empório Família Rodrigues.');
      }, 2000);
    } else {
      document.getElementById('pin-login-erro').textContent = 'PIN incorreto. Tentativa ' + pinLoginTentativas + ' de 5.';
    }
  }
}

// Abrir criação de PIN obrigatória (após reset pelo admin)
function abrirCriarPinObrigatorio() {
  limparPin('pin-d');
  document.getElementById('pin-criar-erro').textContent = '';
  const titleEl = document.querySelector('#mo-pin-criar .md-title');
  const descEl = document.querySelector('#mo-pin-criar .md-text');
  if (pinResetPedido) {
    if (titleEl) titleEl.textContent = 'Crie um novo PIN';
    if (descEl) descEl.textContent = 'Seu PIN foi resetado pelo administrador. Por segurança, crie um novo PIN de 4 dígitos para proteger seus pontos.';
  } else {
    if (titleEl) titleEl.textContent = 'Crie seu PIN de segurança';
    if (descEl) descEl.textContent = 'Para proteger sua conta e seus pontos, crie um PIN de 4 dígitos. Ele será pedido toda vez que você acessar o app.';
  }
  // Esconder botão "depois" — criação é obrigatória
  const btnDepois = document.querySelector('#mo-pin-criar .btn.bo');
  if (btnDepois) btnDepois.style.display = 'none';
  const moEl = document.getElementById('mo-pin-criar');
  if (moEl) moEl.classList.add('open');
  const pinD1 = document.getElementById('pin-d1');
  if (pinD1) setTimeout(() => pinD1.focus(), 300);
}

// Pular criação de PIN (lembrar por 7 dias)
function pularCriacaoPin() {
  localStorage.setItem('clube_pin_lembrar', Date.now().toString());
  document.getElementById('mo-pin-criar').classList.remove('open');
}

// Verificar se deve sugerir PIN (não insistir toda hora)
function devesugerirPin() {
  const ultimo = localStorage.getItem('clube_pin_lembrar');
  if (!ultimo) return true;
  const dias = (Date.now() - parseInt(ultimo)) / (24 * 60 * 60 * 1000);
  return dias >= 7; // Sugerir novamente após 7 dias
}

// Salvar PIN de segurança (ao criar)
async function salvarPinSeguranca() {
  const pin = lerPin('pin-d');
  const erroEl = document.getElementById('pin-criar-erro');

  if (pin.length !== 4) {
    erroEl.textContent = 'Digite os 4 dígitos do PIN';
    return;
  }
  if (/^(.)\1{3}$/.test(pin)) {
    erroEl.textContent = 'PIN muito fraco. Evite números repetidos.';
    return;
  }
  if (pin === '1234' || pin === '4321' || pin === '0000') {
    erroEl.textContent = 'PIN muito comum. Escolha outro.';
    return;
  }

  const btn = document.getElementById('btn-salvar-pin');
  btn.textContent = 'Salvando...'; btn.disabled = true;

  const pinHash = hashPin(pin);
  const ok = await salvarPinNoBanco(clienteId, pinHash);

  if (ok) {
    clientePinHash = pinHash;
    document.getElementById('mo-pin-criar').classList.remove('open');
    atualizarPinPerfil(true);
    marcarPinVerificado(); // PIN acabou de ser criado — sessão verificada
    // Restaurar modal ao estado padrão (caso tenha sido aberto como obrigatório)
    const titleEl = document.querySelector('#mo-pin-criar .md-title');
    if (titleEl) titleEl.textContent = 'Crie seu PIN de segurança';
    const descEl = document.querySelector('#mo-pin-criar .md-text');
    if (descEl) descEl.textContent = 'Crie um PIN de 4 dígitos para proteger seus pontos. Ele será pedido nos resgates e operações sensíveis.';
    const btnDepois = document.querySelector('#mo-pin-criar .btn.bo');
    if (btnDepois) btnDepois.style.display = '';
    alert('PIN criado com sucesso!');
  } else {
    erroEl.textContent = 'Erro ao salvar. Tente novamente.';
  }
  btn.textContent = 'Salvar PIN'; btn.disabled = false;
}

// Fechar modal de PIN
function fecharModalPin(id) {
  document.getElementById(id).classList.remove('open');
  pinResgateCallback = null;
}

// Abrir modal de alterar PIN
function abrirAlterarPin() {
  limparPin('apin-a');
  limparPin('apin-n');
  document.getElementById('pin-alterar-erro').textContent = '';
  // Se não tem PIN, esconde campo "PIN Atual"
  if (!clientePinHash) {
    document.getElementById('pin-alt-label-atual').style.display = 'none';
    ['apin-a1','apin-a2','apin-a3','apin-a4'].forEach(id => document.getElementById(id).parentElement.style.display = 'none');
    document.getElementById('pin-alterar-desc').textContent = 'Crie seu novo PIN de 4 dígitos.';
  } else {
    document.getElementById('pin-alt-label-atual').style.display = '';
    ['apin-a1','apin-a2','apin-a3','apin-a4'].forEach(id => document.getElementById(id).parentElement.style.display = '');
    document.getElementById('pin-alterar-desc').textContent = 'Digite o PIN atual e o novo PIN.';
  }
  document.getElementById('mo-pin-alterar').classList.add('open');
  setTimeout(() => {
    const first = clientePinHash ? 'apin-a1' : 'apin-n1';
    document.getElementById(first).focus();
  }, 300);
}

// Alterar PIN (verifica PIN atual via server-side)
async function alterarPinSeguranca() {
  const erroEl = document.getElementById('pin-alterar-erro');
  const pinAtual = lerPin('apin-a');
  const pinNovo = lerPin('apin-n');

  // Verificar PIN atual via server-side (se existir)
  if (clientePinHash) {
    if (pinAtual.length !== 4) {
      erroEl.textContent = 'Digite os 4 dígitos do PIN atual';
      return;
    }
    erroEl.textContent = 'Verificando PIN atual...';
    try {
      const rv = await fetch(`${SUPA_URL}/rest/v1/rpc/verificar_pin_cliente`, {
        method: 'POST', headers: SH,
        body: JSON.stringify({ p_cliente_id: clienteId, p_pin_hash: hashPin(pinAtual) })
      });
      const dv = await rv.json();
      if (!dv || !dv.ok) {
        erroEl.textContent = dv?.bloqueado ? (dv.erro || 'Muitas tentativas. Aguarde 15 minutos.') : 'PIN atual incorreto';
        return;
      }
    } catch(e) {
      erroEl.textContent = 'Erro de conexão. Tente novamente.';
      return;
    }
  }

  if (pinNovo.length !== 4) {
    erroEl.textContent = 'Digite os 4 dígitos do novo PIN';
    return;
  }
  if (/^(.)\1{3}$/.test(pinNovo)) {
    erroEl.textContent = 'PIN muito fraco. Evite números repetidos.';
    return;
  }

  erroEl.textContent = 'Salvando...';
  const novoHash = hashPin(pinNovo);
  const ok = await salvarPinNoBanco(clienteId, novoHash);

  if (ok) {
    clientePinHash = novoHash;
    document.getElementById('mo-pin-alterar').classList.remove('open');
    atualizarPinPerfil(true);
    alert('PIN alterado com sucesso!');
  } else {
    erroEl.textContent = 'Erro ao salvar. Tente novamente.';
  }
}

// Atualizar seção de PIN no perfil
function atualizarPinPerfil(temPin) {
  const statusEl = document.getElementById('pin-perfil-status');
  const btnAlterar = document.getElementById('btn-pin-perfil');
  const btnCriar = document.getElementById('btn-pin-criar-perfil');
  if (temPin) {
    statusEl.textContent = 'PIN ativo — seu PIN protege seus resgates de pontos.';
    statusEl.style.color = '#27ae60';
    btnAlterar.style.display = '';
    btnCriar.style.display = 'none';
  } else {
    statusEl.textContent = 'Nenhum PIN cadastrado. Crie um para proteger seus pontos.';
    statusEl.style.color = 'var(--gray)';
    btnAlterar.style.display = 'none';
    btnCriar.style.display = '';
  }
}

// Verificar PIN antes do resgate
function pedirPinParaResgate(callback) {
  if (!clientePinHash) {
    // Sem PIN — prosseguir direto
    callback();
    return;
  }
  // Com PIN — abrir modal de verificação
  pinResgateCallback = callback;
  limparPin('vpin-d');
  const verErro = document.getElementById('pin-verificar-erro');
  if (verErro) verErro.textContent = '';
  const moVer = document.getElementById('mo-pin-verificar');
  if (moVer) moVer.classList.add('open');
  const vpinD1 = document.getElementById('vpin-d1');
  if (vpinD1) setTimeout(() => vpinD1.focus(), 300);
}

// Confirmar PIN no resgate (verificação server-side com rate limiting)
async function confirmarPinResgate() {
  const pin = lerPin('vpin-d');
  const erroEl = document.getElementById('pin-verificar-erro');

  if (pin.length !== 4) {
    erroEl.textContent = 'Digite os 4 dígitos do PIN';
    return;
  }

  erroEl.textContent = 'Verificando...';

  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/verificar_pin_cliente`, {
      method: 'POST', headers: SH,
      body: JSON.stringify({ p_cliente_id: clienteId, p_pin_hash: hashPin(pin) })
    });
    if (!r.ok) throw new Error('Erro ao verificar PIN');
    const d = await r.json();

    if (d && d.ok) {
      // PIN correto — fechar modal e executar callback
      erroEl.textContent = '';
      document.getElementById('mo-pin-verificar').classList.remove('open');
      if (pinResgateCallback) {
        pinResgateCallback();
        pinResgateCallback = null;
      }
    } else if (d && d.bloqueado) {
      erroEl.textContent = d.erro || 'Muitas tentativas. Aguarde 15 minutos.';
      limparPin('vpin-d');
    } else {
      const restantes = d && d.tentativas_restantes !== undefined ? ` (${d.tentativas_restantes} restantes)` : '';
      erroEl.textContent = (d?.erro || 'PIN incorreto.') + restantes;
      limparPin('vpin-d');
      const vpinRetry = document.getElementById('vpin-d1');
      if (vpinRetry) setTimeout(() => vpinRetry.focus(), 100);
    }
  } catch(e) {
    erroEl.textContent = 'Erro de conexão. Tente novamente.';
    limparPin('vpin-d');
  }
}

// Preencher campos do perfil com dados do cliente
function preencherPerfil(cliente) {
  const el = (id) => document.getElementById(id);
  if (el('perfil-nome')) el('perfil-nome').value = cliente.nome || '';
  if (el('perfil-tel')) {
    const t = cliente.telefone || '';
    const num = t.replace(/^55/,'');
    el('perfil-tel').value = num ? '(' + num.substring(0,2) + ') ' + num.substring(2) : '';
  }
  if (cliente.nascimento) setarDataSelects('perfil-nasc', cliente.nascimento);
  if (el('perfil-email')) el('perfil-email').value = cliente.email || '';
  if (el('inp-cpf') && cliente.cpf) el('inp-cpf').value = cliente.cpf;
  if (el('inp-cep') && cliente.cep) el('inp-cep').value = cliente.cep;
  if (el('inp-rua') && cliente.rua) el('inp-rua').value = cliente.rua;
  if (el('inp-num') && cliente.numero) el('inp-num').value = cliente.numero;
  if (el('inp-bairro') && cliente.bairro) el('inp-bairro').value = cliente.bairro;
  if (el('inp-cidade') && cliente.cidade) el('inp-cidade').value = cliente.cidade;
  if (el('inp-uf') && cliente.uf) el('inp-uf').value = cliente.uf;
}

// Salvar dados básicos do perfil
async function salvarPerfil() {
  if (!clienteId) return alert('Erro: cliente não identificado');
  const nome = document.getElementById('perfil-nome').value.trim();
  const nasc = lerDataSelects('perfil-nasc');
  if (!nome) return alert('Nome não pode ficar vazio');
  const ok = await atualizarCliente(clienteId, { nome, nascimento: nasc || null });
  if (ok) alert('Dados salvos com sucesso!');
  else alert('Erro ao salvar. Tente novamente.');
}

// Salvar dados complementares
async function salvarComplemento() {
  if (!clienteId) return alert('Erro: cliente não identificado');
  const email = document.getElementById('perfil-email').value.trim();
  const cpf = document.getElementById('inp-cpf').value.replace(/\D/g,'');
  const dados = {};
  if (email) dados.email = email;
  if (cpf) dados.cpf = cpf;
  const ok = await atualizarCliente(clienteId, dados);
  if (ok) alert('Dados salvos com sucesso!');
  else alert('Erro ao salvar. Tente novamente.');
}

// Salvar endereço
async function salvarEndereco() {
  if (!clienteId) return alert('Erro: cliente não identificado');
  const dados = {
    cep: document.getElementById('inp-cep').value.replace(/\D/g,''),
    rua: document.getElementById('inp-rua').value.trim(),
    numero: document.getElementById('inp-num').value.trim(),
    bairro: document.getElementById('inp-bairro').value.trim(),
    cidade: document.getElementById('inp-cidade').value.trim(),
    uf: document.getElementById('inp-uf').value.trim().toUpperCase()
  };
  const ok = await atualizarCliente(clienteId, dados);
  if (ok) alert('Endereço salvo com sucesso!');
  else alert('Erro ao salvar. Tente novamente.');
}

// ── DATA NASCIMENTO SELECTS ───────────────────────────────
function popularSelectsData(prefixo) {
  const diaEl = document.getElementById(prefixo + '-dia');
  const mesEl = document.getElementById(prefixo + '-mes');
  const anoEl = document.getElementById(prefixo + '-ano');
  if (!diaEl || !mesEl || !anoEl) return;
  // Dias 1-31
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = String(d).padStart(2, '0');
    diaEl.appendChild(opt);
  }
  // Meses
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  meses.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = String(i + 1).padStart(2, '0');
    opt.textContent = m;
    mesEl.appendChild(opt);
  });
  // Anos (decrescente, de ano atual até 1920)
  const anoAtual = new Date().getFullYear();
  for (let a = anoAtual; a >= 1920; a--) {
    const opt = document.createElement('option');
    opt.value = String(a);
    opt.textContent = String(a);
    anoEl.appendChild(opt);
  }
}
function lerDataSelects(prefixo) {
  const dia = document.getElementById(prefixo + '-dia')?.value;
  const mes = document.getElementById(prefixo + '-mes')?.value;
  const ano = document.getElementById(prefixo + '-ano')?.value;
  if (!dia || !mes || !ano) return '';
  return ano + '-' + mes + '-' + dia;
}
function setarDataSelects(prefixo, dataStr) {
  if (!dataStr) return;
  const partes = dataStr.split('-');
  if (partes.length !== 3) return;
  const anoEl = document.getElementById(prefixo + '-ano');
  const mesEl = document.getElementById(prefixo + '-mes');
  const diaEl = document.getElementById(prefixo + '-dia');
  if (anoEl) anoEl.value = partes[0];
  if (mesEl) mesEl.value = partes[1];
  if (diaEl) diaEl.value = partes[2];
}
popularSelectsData('inp-nasc');
popularSelectsData('perfil-nasc');

// CPF mask
const cpfInput=document.getElementById('inp-cpf');
if(cpfInput)cpfInput.addEventListener('input',function(){
  let v=this.value.replace(/\D/g,'');
  if(v.length>11)v=v.slice(0,11);
  v=v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  this.value=v;
});
// ── CARDÁPIO CLIENTE ──────────────────────────────────────
let cardapioCategorias = [];
let cardapioProdutos = [];
let pedidoAtual = {}; // { produtoId: { qty, obs } }
let filtroTagAtual = 'todos';
let tipoEntregaAtual = 'entrega';
let favoritosCliente = JSON.parse(localStorage.getItem('clube_favoritos') || '[]'); // TODO: migrate to async SecureStorage.get after init

async function carregarCardapioCliente() {
  try {
    var cachedCat = ApiCache.get('cardapio_categorias');
    var cachedProd = ApiCache.get('cardapio_produtos');
    if (cachedCat && cachedProd) {
      cardapioCategorias = cachedCat;
      cardapioProdutos = cachedProd;
    } else {
      const [rCat, rProd] = await Promise.all([
        fetch(`${SUPA_URL}/rest/v1/cardapio_categorias?select=*&ativo=eq.true&order=ordem`, { headers: SH }),
        fetch(`${SUPA_URL}/rest/v1/cardapio_produtos?select=*&ativo=eq.true&order=ordem,nome`, { headers: SH })
      ]);
      cardapioCategorias = rCat.ok ? await rCat.json() : [];
      cardapioProdutos = rProd.ok ? await rProd.json() : [];
      if (!Array.isArray(cardapioCategorias)) cardapioCategorias = [];
      if (!Array.isArray(cardapioProdutos)) cardapioProdutos = [];
      ApiCache.set('cardapio_categorias', cardapioCategorias, 300000);
      ApiCache.set('cardapio_produtos', cardapioProdutos, 300000);
    }
    renderizarCardapioCliente();
  } catch(e) { console.error('carregarCardapioCliente:', e); }
}

function renderizarCardapioCliente() {
  const el = document.getElementById('cardapio-lista');
  const busca = (document.getElementById('cardapio-busca')?.value || '').toLowerCase();
  let prods = cardapioProdutos;
  if (busca) prods = prods.filter(p => p.nome.toLowerCase().includes(busca));
  if (filtroTagAtual === 'promocao') prods = prods.filter(p => p.destaque === 'promocao');
  else if (filtroTagAtual === 'novidade') prods = prods.filter(p => p.destaque === 'novidade');
  else if (filtroTagAtual === 'favoritos') prods = prods.filter(p => favoritosCliente.includes(p.id));

  if (!prods.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray);font-size:12px">Nenhum produto encontrado</div>'; // SANITIZED: static
    return;
  }

  let html = '';
  cardapioCategorias.forEach(cat => {
    const catProds = prods.filter(p => p.categoria_id === cat.id).sort((a,b) => (a.ordem||0) - (b.ordem||0) || a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!catProds.length) return;
    html += `<div class="cardapio-cat">
      <div class="cardapio-cat-header">${sanitize(cat.nome)} <span style="font-size:10px;opacity:.5">${catProds.length}</span></div>`;
    catProds.forEach(p => {
      const qty = pedidoAtual[p.id]?.qty || 0;
      const obs = pedidoAtual[p.id]?.obs || '';
      const isFav = favoritosCliente.includes(p.id);
      const badge = p.destaque === 'promocao' ? '<span class="cardapio-item-badge badge-promo">PROMO</span>'
        : p.destaque === 'novidade' ? '<span class="cardapio-item-badge badge-novo">NOVO</span>' : '';
      html += `<div class="cardapio-item">
        <button class="fav-btn ${isFav?'active':''}" data-action="toggleFavorito" data-id="${p.id}">${isFav?'❤️':'🤍'}</button>
        <div class="cardapio-item-info">
          <div class="cardapio-item-nome">${sanitize(p.nome)}${badge}</div>
          <div class="cardapio-item-apres">${sanitize(p.apresentacao||'')}</div>
          ${qty > 0 ? `<input class="fi" style="margin-top:6px;padding:6px 10px;font-size:11px" placeholder="Obs: sem tempero, corte fino..." value="${escapeHTML(obs)}" onchange="setObsItem(${p.id},this.value)">` : ''}
        </div>
        <div class="cardapio-qty">
          <button data-action="alterarQtd" data-id="${p.id}" data-delta="-1">−</button>
          <span>${qty}</span>
          <button data-action="alterarQtd" data-id="${p.id}" data-delta="1">+</button>
        </div>
      </div>`;
    });
    html += '</div>';
  });
  el.innerHTML = html; // SANITIZED
  atualizarCarrinhoBar();
}

function alterarQtd(prodId, delta) {
  if (!pedidoAtual[prodId]) pedidoAtual[prodId] = { qty: 0, obs: '' };
  pedidoAtual[prodId].qty = Math.max(0, pedidoAtual[prodId].qty + delta);
  if (pedidoAtual[prodId].qty === 0) delete pedidoAtual[prodId];
  renderizarCardapioCliente();
}

function setObsItem(prodId, obs) {
  if (pedidoAtual[prodId]) pedidoAtual[prodId].obs = obs;
}

function toggleFavorito(prodId, btn) {
  const idx = favoritosCliente.indexOf(prodId);
  if (idx >= 0) { favoritosCliente.splice(idx, 1); btn.classList.remove('active'); btn.textContent = '🤍'; }
  else { favoritosCliente.push(prodId); btn.classList.add('active'); btn.textContent = '❤️'; }
  SecureStorage.set('clube_favoritos', JSON.stringify(favoritosCliente));
}

function setFiltroTag(tag, btn) {
  filtroTagAtual = tag;
  document.querySelectorAll('.filtro-tag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderizarCardapioCliente();
}

function _filtrarCardapioClienteImpl() { renderizarCardapioCliente(); }
var filtrarCardapioCliente = debounce(_filtrarCardapioClienteImpl, 200);

function atualizarCarrinhoBar() {
  const total = Object.values(pedidoAtual).reduce((s, v) => s + v.qty, 0);
  const bar = document.getElementById('carrinho-bar');
  const badge = document.getElementById('carrinho-qtd');
  if (total > 0) { bar.style.display = 'block'; badge.textContent = total; }
  else { bar.style.display = 'none'; }
}

function setTipoEntrega(tipo, btn) {
  tipoEntregaAtual = tipo;
  document.querySelectorAll('.tipo-entrega').forEach(b => { b.classList.remove('active'); b.classList.remove('bg'); b.classList.add('bo'); });
  btn.classList.add('active'); btn.classList.add('bg'); btn.classList.remove('bo');
}

function abrirPedido() {
  if (!clienteId) { alert('Faça login para enviar pedidos!'); return; }
  // Verificar perfil completo
  const dados = JSON.parse(localStorage.getItem('clube_cliente_dados') || '{}'); // TODO: migrate to async SecureStorage.get after init
  if (!dados.rua || !dados.numero || !dados.bairro || !dados.cidade) {
    alert('Complete seu endereço no Perfil antes de fazer pedidos!');
    return;
  }
  // Verificar se há último pedido
  const ultimo = localStorage.getItem('clube_ultimo_pedido'); // TODO: migrate to async SecureStorage.get after init
  document.getElementById('ultimo-pedido-box').style.display = ultimo ? 'block' : 'none';
  // Renderizar itens
  renderizarItensPedido();
  // Data mínima = amanhã
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  document.getElementById('pedido-data').min = amanha.toISOString().split('T')[0];
  document.getElementById('pedido-data').value = amanha.toISOString().split('T')[0];
  document.getElementById('mo-pedido').classList.add('open');
}

function renderizarItensPedido() {
  const el = document.getElementById('pedido-itens-lista');
  const ids = Object.keys(pedidoAtual).filter(id => pedidoAtual[id].qty > 0);
  if (!ids.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray);font-size:12px">Nenhum item selecionado</div>'; return; } // SANITIZED: static
  el.innerHTML = ids.map(id => {
    const p = cardapioProdutos.find(pr => pr.id === Number(id));
    const item = pedidoAtual[id];
    if (!p) return '';
    return `<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);gap:10px">
      <div class="cardapio-qty" style="flex-shrink:0">
        <button data-action="alterarQtdPedido" data-id="${id}" data-delta="-1">−</button>
        <span>${item.qty}</span>
        <button data-action="alterarQtdPedido" data-id="${id}" data-delta="1">+</button>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--white)">${sanitize(p.nome)}</div>
        <div style="font-size:10px;color:var(--gray)">${sanitize(p.apresentacao||'')}</div>
        ${item.obs ? `<div style="font-size:10px;color:var(--gold);margin-top:2px">↳ ${sanitize(item.obs)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function alterarQtdPedido(prodId, delta) {
  if (pedidoAtual[prodId]) {
    pedidoAtual[prodId].qty = Math.max(0, pedidoAtual[prodId].qty + delta);
    if (pedidoAtual[prodId].qty === 0) delete pedidoAtual[prodId];
  }
  renderizarItensPedido();
  atualizarCarrinhoBar();
}

function repetirUltimoPedido() {
  const ultimo = JSON.parse(localStorage.getItem('clube_ultimo_pedido') || '{}'); // TODO: migrate to async SecureStorage.get after init
  if (ultimo.itens) {
    pedidoAtual = {};
    ultimo.itens.forEach(item => {
      pedidoAtual[item.produto_id] = { qty: item.qty, obs: item.obs || '' };
    });
    renderizarItensPedido();
    renderizarCardapioCliente();
  }
}

async function enviarPedidoWhatsApp() {
  const ids = Object.keys(pedidoAtual).filter(id => pedidoAtual[id].qty > 0);
  if (!ids.length) { alert('Adicione itens ao pedido!'); return; }
  const data = document.getElementById('pedido-data').value;
  const horario = document.getElementById('pedido-horario').value;
  if (!data) { alert('Selecione a data de entrega!'); return; }
  if (!horario) { alert('Selecione o horário!'); return; }

  const dados = JSON.parse(await SecureStorage.get('clube_cliente_dados') || '{}');
  const saldo =