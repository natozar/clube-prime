// ── JACKPOT PRIME · Caça-Carne ───────────────────────────
// Página isolada do PWA. Toda decisão de prêmio é SERVER-SIDE
// (jackpot_jogar resolve antes da animação — a máquina só encena).
'use strict';

const SUPA_URL = 'https://mrourzdxrahpysscckxm.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
const SH = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };
const LOGO_SRC = 'icon-384.png';

// ── sessão + device (mesmas fontes do app.js; plain por design) ──
function lerSessao() {
  try {
    const raw = localStorage.getItem('clube_sessao');
    if (!raw) return null;
    const s = JSON.parse(raw);
    return (s && s.clienteId && s.telefone) ? s : null;
  } catch (e) { return null; }
}
function lerCookie(nome) {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  } catch (e) { return null; }
}
function getDeviceId() {
  let id = null;
  try { id = localStorage.getItem('clube_device_id'); } catch (e) {}
  if (!id) id = lerCookie('clube_device_id');
  return id;
}
const sessao = lerSessao();
const deviceId = getDeviceId();
if (!sessao || !deviceId) { location.replace('/'); }

async function rpc(nome, body) {
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/rpc/' + nome, {
      method: 'POST', headers: SH, body: JSON.stringify(body)
    });
    if (!r.ok) return { ok: false, erro: 'http_' + r.status };
    return await r.json();
  } catch (e) { return { ok: false, erro: 'conexao' }; }
}
const rpcCliente = (nome, extra) => rpc(nome, Object.assign({
  p_cliente_id: sessao ? sessao.clienteId : 0, p_device_id: deviceId || ''
}, extra || {}));

// ── telas ──
const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
};
document.querySelectorAll('[data-volta]').forEach(b =>
  b.addEventListener('click', () => { location.href = '/'; }));

// ── áudio (master roteável p/ vídeo) ──
let AC = null, master = null, recDest = null;
function audio() {
  if (!AC) { try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 1; master.connect(AC.destination);
  } catch (e) {} }
  return AC;
}
function env(type, freq, t0, dur, peak) {
  const ctx = audio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + .015);
  g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + .05);
}
const tickSound = p => { const c = audio(); if (c) env('square', p || 1700, c.currentTime, .045, .05); };
const thunk = () => { const c = audio(); if (c) { env('sine', 95, c.currentTime, .18, .5); env('square', 240, c.currentTime, .06, .12); } };
const thump = () => { const c = audio(); if (c) env('sine', 64, c.currentTime, .22, .5); };
function riser(dur) {
  const c = audio(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(160, c.currentTime);
  o.frequency.linearRampToValueAtTime(640, c.currentTime + dur);
  g.gain.setValueAtTime(.0001, c.currentTime);
  g.gain.linearRampToValueAtTime(.06, c.currentTime + dur * .85);
  g.gain.linearRampToValueAtTime(.0001, c.currentTime + dur);
  o.connect(g).connect(master); o.start(); o.stop(c.currentTime + dur + .05);
}
function fanfare() {
  const c = audio(); if (!c) return;
  [[440,0],[554,.13],[659,.26],[880,.42],[1108,.56]].forEach(([f,d]) =>
    env('triangle', f, c.currentTime + d, .65, .14));
  for (let i = 0; i < 10; i++) env('sine', 1300 + Math.random()*900, c.currentTime + .5 + i*.05, .12, .04);
}
const coinDrop = () => { const c = audio(); if (c) for (let i = 0; i < 10; i++) env('square', 2300 - i*150, c.currentTime + i*.06, .09, .05); };
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

// ── moeda 3D (logo real) ──
const logoImg = new Image(); logoImg.src = LOGO_SRC;
['logoFlat','slotLogo','winLogo'].forEach(id => {
  const el = document.getElementById(id); if (el) el.src = LOGO_SRC;
});
let coinRenderer = null, coinScene = null, coinCam = null, coinGroup = null, coinFast = 0;
function initCoin() {
  if (typeof THREE === 'undefined') {
    document.getElementById('logoFlat').style.display = 'block';
    document.getElementById('coin3d').style.display = 'none';
    return;
  }
  const S = 440;
  coinScene = new THREE.Scene();
  coinCam = new THREE.PerspectiveCamera(34, 1, .1, 100); coinCam.position.set(0, 0, 6.4);
  coinRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  coinRenderer.setSize(S, S); coinRenderer.setPixelRatio(1);
  document.getElementById('coin3d').appendChild(coinRenderer.domElement);
  coinScene.add(new THREE.AmbientLight(0xfff6e0, .55));
  const key = new THREE.DirectionalLight(0xffeecc, 1.05); key.position.set(2.5, 3, 4); coinScene.add(key);
  const rim = new THREE.DirectionalLight(0xd4af37, 1.1); rim.position.set(-3, -2, -4); coinScene.add(rim);
  const pt = new THREE.PointLight(0xffe9a8, .9, 30); pt.position.set(0, 2.5, 3.5); coinScene.add(pt);
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xc9a232, shininess: 95, specular: 0xfff3c0 });
  const tex = new THREE.TextureLoader().load(LOGO_SRC);
  tex.center = new THREE.Vector2(.5, .5); tex.rotation = Math.PI/2;
  const texB = new THREE.TextureLoader().load(LOGO_SRC);
  texB.center = new THREE.Vector2(.5, .5); texB.rotation = Math.PI/2;
  texB.wrapS = THREE.RepeatWrapping; texB.repeat.x = -1;
  const geo = new THREE.CylinderGeometry(1.55, 1.55, .22, 72);
  geo.rotateX(Math.PI/2);
  const coin = new THREE.Mesh(geo, [goldMat,
    new THREE.MeshBasicMaterial({ map: tex }), new THREE.MeshBasicMaterial({ map: texB })]);
  coinGroup = new THREE.Group(); coinGroup.add(coin);
  [.115, -.115].forEach(z => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .075, 24, 80), goldMat);
    ring.position.z = z; coinGroup.add(ring);
  });
  for (let i = 0; i < 28; i++) {
    const a = i/28 * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(.1, .26, .26),
      new THREE.MeshPhongMaterial({ color: 0xbd9433, shininess: 70 }));
    tooth.position.set(Math.cos(a)*1.56, Math.sin(a)*1.56, 0);
    tooth.rotation.z = a; coinGroup.add(tooth);
  }
  coinGroup.rotation.x = .14;
  coinScene.add(coinGroup);
}
function coinLoop(t) {
  if (coinRenderer) {
    coinGroup.rotation.y = t*.0011 + coinFast;
    if (coinFast > 0) coinFast *= .96;
    coinGroup.rotation.x = .14 + Math.sin(t*.0016)*.06;
    coinGroup.position.y = Math.sin(t*.0013)*.08;
    coinRenderer.render(coinScene, coinCam);
  }
  requestAnimationFrame(coinLoop);
}

// ── partículas + confete ──
const fx = document.getElementById('fx'), fctx = fx.getContext('2d');
let dust = [], confetti = [];
function sizeFx() { fx.width = innerWidth*devicePixelRatio; fx.height = innerHeight*devicePixelRatio;
  fctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
addEventListener('resize', sizeFx); sizeFx();
for (let i = 0; i < 50; i++) dust.push({ x: Math.random()*innerWidth, y: Math.random()*innerHeight,
  r: Math.random()*1.6 + .4, s: Math.random()*.25 + .06, o: Math.random()*.5 + .15, p: Math.random()*6.28 });
function burst(cx, cy, n) {
  const cols = ['#d4af37','#f9e29c','#c0392b','#f5ecd7','#8a6d1d'];
  for (let i = 0; i < n; i++) {
    const a = Math.random()*6.28, v = Math.random()*9 + 4;
    confetti.push({ x: cx, y: cy, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 7,
      w: Math.random()*9 + 4, h: Math.random()*5 + 3, rot: Math.random()*6.28, vr: (Math.random()-.5)*.4,
      col: cols[i % cols.length], life: 1, emoji: (i % 23 === 0) ? '🥩' : null });
  }
}
function burstConfetti() {
  burst(innerWidth/2, innerHeight*.38, 150);
  burst(innerWidth*.08, innerHeight*.7, 50);
  burst(innerWidth*.92, innerHeight*.7, 50);
}
function fxLoop() {
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const d of dust) {
    d.y -= d.s; d.p += .01;
    if (d.y < -4) { d.y = innerHeight + 4; d.x = Math.random()*innerWidth; }
    fctx.globalAlpha = d.o * (0.6 + 0.4*Math.sin(d.p));
    fctx.fillStyle = '#d4af37';
    fctx.beginPath(); fctx.arc(d.x + Math.sin(d.p)*8, d.y, d.r, 0, 6.28); fctx.fill();
  }
  confetti = confetti.filter(c => c.life > 0);
  for (const c of confetti) {
    c.vy += .22; c.x += c.vx; c.y += c.vy; c.vx *= .985; c.rot += c.vr; c.life -= .006;
    fctx.globalAlpha = Math.max(c.life, 0);
    if (c.emoji) { fctx.font = '20px serif'; fctx.fillText(c.emoji, c.x, c.y); }
    else { fctx.save(); fctx.translate(c.x, c.y); fctx.rotate(c.rot);
      fctx.fillStyle = c.col; fctx.fillRect(-c.w/2, -c.h/2, c.w, c.h); fctx.restore(); }
  }
  fctx.globalAlpha = 1;
  requestAnimationFrame(fxLoop);
}
requestAnimationFrame(fxLoop);

// ── estado do servidor ──
let st = null; // resposta de jackpot_status_seguro
let premio = null;
function fmtData(iso) {
  try { const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '—'; }
}
function fmtRestante(iso) {
  let s = Math.max(0, (new Date(iso) - Date.now()) / 1000 | 0);
  const d = s/86400 | 0; s -= d*86400; const h = s/3600 | 0; s -= h*3600; const m = s/60 | 0;
  return d + 'd ' + h + 'h ' + m + 'm';
}
let cdTimer = null;
function ligaCountdown(elId, iso) {
  if (cdTimer) clearInterval(cdTimer);
  const f = () => { const el = document.getElementById(elId); if (el) el.textContent = fmtRestante(iso); };
  f(); cdTimer = setInterval(f, 30000);
}

async function boot() {
  st = await rpcCliente('jackpot_status_seguro');
  if (!st || st.ok === false || st.ativo === false) { rotaVazio(); return; }
  if (!st.ciclo) { rotaVazio(); return; }
  rotear(st.ciclo);
}
function rotaVazio() {
  document.getElementById('vazioMeta').textContent =
    ((st && st.threshold) || 5000).toLocaleString('pt-BR') + ' pontos';
  document.getElementById('vazioSaldo').textContent =
    '⭐ ' + (((st && st.saldo) || 0).toLocaleString('pt-BR')) + ' pontos';
  show('vazio');
}
function rotear(c) {
  if (c.status === 'disponivel' || (c.status === 'ciente' && !c.premio_titulo)) {
    document.getElementById('cienciaData').textContent = fmtData(c.expira_em);
    ligaCountdown('cdIntro', c.expira_em);
    show('intro');
    if (c.status === 'ciente') { /* já ciente: pular modal ao entrar */ }
  } else if (c.status === 'jogado') {
    premio = { titulo: c.premio_titulo, tipo: c.premio_tipo };
    mostrarVitoria(false);
  } else if (c.status === 'cupom_emitido' || c.status === 'pendente_balcao') {
    mostrarCupom(c);
  } else { rotaVazio(); }
}

// intro → ciência → escolha
document.getElementById('btnEntrar').addEventListener('click', () => {
  audio();
  if (st.ciclo.ciencia) { show('choice'); return; }
  document.getElementById('cienciaModal').classList.add('on');
});
document.getElementById('btnCiencia').addEventListener('click', async () => {
  const b = document.getElementById('btnCiencia');
  b.disabled = true;
  const r = await rpcCliente('jackpot_registrar_ciencia');
  b.disabled = false;
  if (r && r.ok) {
    document.getElementById('cienciaModal').classList.remove('on');
    st.ciclo.ciencia = true; st.ciclo.status = 'ciente';
    show('choice');
  } else { alert('Erro de conexão — tente de novo.'); }
});
document.getElementById('cardJogar').addEventListener('click', () => { audio(); show('game'); });
document.getElementById('card5pct').addEventListener('click', async () => {
  if (!confirm('Trocar seus 5.000 pontos por 5% de desconto?\n(o Caça-Carne premia com um corte premium…)')) return;
  const r = await rpcCliente('jackpot_opcao_5pct');
  if (r && r.ok) {
    st.ciclo.status = 'cupom_emitido'; st.ciclo.cupom_codigo = r.cupom;
    st.ciclo.cupom_validade = r.validade; st.ciclo.premio_titulo = '5% de desconto na próxima compra';
    mostrarCupom(st.ciclo);
  } else { alert('Não foi possível agora — tente de novo.'); }
});

// ── rolos ──
const DECOR = [
  ['PICANHA','Nelore'],['ANCHO','Raças'],['CHORIZO','Raças Prime'],['TOMAHAWK','Black Angus'],
  ['DENVER','Steak'],['T-BONE','Especial'],['MAMINHA','Angus'],['COSTELA','Premium'],
  ['FRALDINHA','Raças Prime'],['PICANHA','Angus'],['LINGUIÇA','Artesanal'],['KIT','Churrasco']
];
const ICONES = ['🥩','🏆','🥩','🍖','🥩','🍖','🥩','🍖','🥩','⭐','🔥','🎁'];
const CELL = 96, NSYM = 12, LOOP = CELL*NSYM, REPEATS = 12;
let TARGET_IDX = 1; // posição do prêmio real no strip (substitui o decorativo)
const reels = [0,1,2].map(i => ({
  el: document.getElementById('r' + i),
  strip: document.querySelector('#r' + i + ' .strip'),
  p: i*CELL*2.3, lastCell: -1
}));
function nomePremioCurto(t) {
  const palavras = String(t || '').split(' ');
  return [palavras[0].toUpperCase(), palavras.slice(1).join(' ')];
}
function buildStrips(premioTitulo) {
  const syms = DECOR.map((d, i) => ({ nm: d[0], sb: d[1], ic: ICONES[i], jack: false }));
  if (premioTitulo) {
    const [nm, sb] = nomePremioCurto(premioTitulo);
    syms[TARGET_IDX] = { nm: nm, sb: sb || 'seu prêmio', ic: '🏆', jack: true };
  } else { syms[TARGET_IDX].jack = true; syms[TARGET_IDX].ic = '🏆'; }
  for (const r of reels) {
    let html = '';
    for (let k = 0; k < REPEATS; k++)
      for (let s = 0; s < NSYM; s++) {
        const o = syms[s];
        html += '<div class="cell' + (o.jack ? ' jack' : '') + '"><span class="ic">' + o.ic +
          '</span><span class="nm">' + o.nm + '</span><span class="sb">' + o.sb + '</span></div>';
      }
    r.strip.innerHTML = html;
    render(r);
  }
}
function render(r) {
  const off = ((r.p % LOOP) + LOOP) % LOOP;
  r.strip.style.transform = 'translateY(' + (-(off + LOOP*4)) + 'px)';
}

// ── alavanca sensível à força ──
const knob = document.getElementById('leverKnob'), rod = document.getElementById('leverRod');
const KNOB0 = 48, ROD0 = 42, MAXPULL = 168;
let pulling = false, startPtY = 0, pullPx = 0, lastNotch = -1, falhas = 0, playing = false;
function setLever(px) {
  knob.style.top = (KNOB0 + px) + 'px';
  rod.style.height = (ROD0 + px) + 'px';
  document.getElementById('forceGlow').style.opacity = (px/MAXPULL)*.9;
  document.getElementById('cab').style.transform = 'translateY(' + (px*.05) + 'px)';
}
knob.addEventListener('pointerdown', e => {
  if (playing) return;
  audio(); pulling = true; startPtY = e.clientY; lastNotch = -1;
  knob.classList.remove('snap'); rod.classList.remove('snap');
  document.getElementById('cab').classList.remove('snapback');
  try { knob.setPointerCapture(e.pointerId); } catch (err) {}
});
knob.addEventListener('pointermove', e => {
  if (!pulling) return;
  pullPx = Math.max(0, Math.min(MAXPULL, e.clientY - startPtY));
  setLever(pullPx);
  const notch = Math.floor(pullPx / 21);
  if (notch !== lastNotch) { lastNotch = notch; tickSound(380 + notch*45); buzz(8); }
});
function soltarAlavanca() {
  if (!pulling) return;
  pulling = false;
  knob.classList.add('snap'); rod.classList.add('snap');
  document.getElementById('cab').classList.add('snapback');
  setLever(0);
  document.getElementById('forceGlow').style.opacity = 0;
  const force = pullPx / MAXPULL;
  pullPx = 0;
  if (force < .18) {
    tickSound(260); falhas++;
    document.getElementById('status').textContent = 'puxe com mais força! 💪';
    if (falhas >= 2) document.getElementById('btnSemAlavanca').style.display = 'block';
    return;
  }
  thunk(); buzz([15, 30, 25]);
  iniciarJogada(force);
}
knob.addEventListener('pointerup', soltarAlavanca);
knob.addEventListener('pointercancel', soltarAlavanca);
document.getElementById('btnSemAlavanca').addEventListener('click', () => {
  if (!playing) { audio(); thunk(); iniciarJogada(.75); }
});

// giro livre enquanto a RPC resolve o prêmio (esconde a latência da rede)
let freeSpin = false;
function freeSpinLoop() {
  if (freeSpin) {
    for (const r of reels) { r.p += 34; r.el.classList.add('blur'); render(r); }
    requestAnimationFrame(freeSpinLoop);
  }
}
async function iniciarJogada(force) {
  if (playing) return;
  playing = true;
  document.getElementById('vinheta').classList.add('on');
  document.getElementById('payline').classList.remove('hit');
  document.getElementById('status').textContent =
    force > .85 ? 'PUXADA FORTE! 💪 segura o coração…' : force > .45 ? 'lá vai…' : 'puxada fraquinha… 😅';
  freeSpin = true; requestAnimationFrame(freeSpinLoop);
  const r = await rpcCliente('jackpot_jogar');
  if (!r || !r.ok || !r.premio) {
    freeSpin = false; playing = false;
    reels.forEach(x => x.el.classList.remove('blur'));
    document.getElementById('vinheta').classList.remove('on');
    document.getElementById('status').textContent =
      (r && r.erro === 'expirado') ? 'esse resgate expirou 😞' : 'sem conexão — puxe de novo 🍀';
    return;
  }
  premio = r.premio;
  buildStrips(premio.titulo); // injeta o prêmio real no símbolo-alvo
  freeSpin = false;
  pull(TARGET_IDX, force, () => {
    fanfare(); buzz([60, 40, 120]);
    document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 520);
    const f = document.getElementById('flash');
    f.classList.add('go'); setTimeout(() => f.classList.remove('go'), 80);
    setTimeout(() => { mostrarVitoria(true); playing = false; }, 900);
  });
}

// rolos 1-2 param no prêmio; o 3º faz a FALSA PARADA um símbolo antes e cede
function pull(targetIdx, force, done) {
  const t0 = performance.now();
  const offTarget = ((targetIdx - 1 + NSYM) % NSYM) * CELL;
  const offBefore = (offTarget - CELL + LOOP) % LOOP;
  const speed = .55 + force*1.05;
  const plans = reels.map((r, i) => {
    const off0 = ((r.p % LOOP) + LOOP) % LOOP;
    const base = LOOP * (2 + Math.round((1 + i) * (.6 + force*1.5)));
    const tgt = (i === 2) ? offBefore : offTarget;
    const dist = base + ((tgt - off0 - base) % LOOP + LOOP) % LOOP;
    return { r, start: r.p, dist, T: (1700 + i*950 + (i === 2 ? 600 : 0)) * speed, stopped: false };
  });
  const ease = k => k < .62 ? k*1.18 : .7316 + (1 - Math.pow(1 - (k - .62)/.38, 3))*.2684;
  const T3 = plans[2].T, HOLD = 780, NUDGE = 480;
  let riser1 = false, heartNext = .5, holdThumps = 0, nudgeTick = false;
  function tickCell(r, k) {
    const cell = Math.floor(r.p / CELL);
    if (cell !== r.lastCell) { r.lastCell = cell; if (k > .6) { tickSound(900 + 700*(1 - k)); buzz(6); } }
  }
  function stopFx(r) {
    thunk(); buzz(30);
    r.el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(7px)' }, { transform: 'translateY(0)' }],
      { duration: 200, easing: 'ease-out' });
  }
  function frame(now) {
    const t = now - t0;
    for (let i = 0; i < 2; i++) {
      const pl = plans[i], k = Math.min(1, t/pl.T);
      pl.r.p = pl.start + pl.dist*Math.min(1, ease(k));
      pl.r.el.classList.toggle('blur', k < .8 && k > .02);
      tickCell(pl.r, k); render(pl.r);
      if (k >= 1 && !pl.stopped) { pl.stopped = true; stopFx(pl.r); }
    }
    const pl = plans[2];
    if (t < T3) {
      const k = t/T3;
      pl.r.p = pl.start + pl.dist*ease(k);
      pl.r.el.classList.toggle('blur', k < .8 && k > .02);
      tickCell(pl.r, k); render(pl.r);
      if (k > .55 && k > heartNext) { thump(); buzz(12); heartNext += Math.max(.04, .12*(1 - k)); }
      if (k > .55 && !riser1) { riser1 = true; riser((T3*.45)/1000); }
    } else if (t < T3 + HOLD) {
      if (!pl.stopped) { pl.stopped = true; stopFx(pl.r);
        reels[0].el.classList.add('dim'); reels[1].el.classList.add('dim'); }
      if ((t - T3)/HOLD > holdThumps/3) { holdThumps++; thump(); buzz(22); }
    } else if (t < T3 + HOLD + NUDGE) {
      if (!nudgeTick) { nudgeTick = true; tickSound(700); buzz(15); }
      const nk = (t - T3 - HOLD)/NUDGE, ne = 1 - Math.pow(1 - nk, 3);
      pl.r.p = pl.start + pl.dist + CELL*ne; render(pl.r);
    } else {
      pl.r.p = pl.start + pl.dist + CELL; render(pl.r);
      reels[0].el.classList.remove('dim'); reels[1].el.classList.remove('dim');
      thunk(); buzz(40);
      document.getElementById('vinheta').classList.remove('on');
      document.getElementById('payline').classList.add('hit');
      done(); return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ── vitória + vídeo + share obrigatório ──
function mostrarVitoria(comFesta) {
  document.getElementById('prizeName').textContent = (premio.titulo || '').toUpperCase();
  document.getElementById('rays').classList.add('on');
  show('win');
  if (comFesta) { burstConfetti(); setTimeout(burstConfetti, 700); }
  videoFile = null; videoReady = null;
  document.getElementById('shareBtn').textContent = SHARE_LABEL;
  setTimeout(preRenderVideo, 900);
}

const VW = 720, VH = 1280, VDUR = 6.4;
let vidConf = [];
function seedVidConf() {
  vidConf = [];
  const cols = ['#d4af37','#f9e29c','#c0392b','#f5ecd7'];
  for (let b = 0; b < 3; b++)
    for (let i = 0; i < 70; i++) {
      const a = Math.random()*6.28, v = Math.random()*7 + 3;
      vidConf.push({ t0: 2.0 + b*1.1, x: VW/2, y: VH*.42, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 6,
        w: Math.random()*10 + 5, h: Math.random()*6 + 3, rot: Math.random()*6.28, vr: (Math.random()-.5)*.4,
        col: cols[i % cols.length] });
    }
}
function drawVideoFrame(c, t) {
  let bg = c.createLinearGradient(0, 0, 0, VH);
  bg.addColorStop(0, '#15151a'); bg.addColorStop(.55, '#0a0a0c'); bg.addColorStop(1, '#1c0e10');
  c.fillStyle = bg; c.fillRect(0, 0, VW, VH);
  c.save(); c.translate(VW/2, VH*.40); c.rotate(t*.25);
  for (let i = 0; i < 12; i++) {
    c.rotate(Math.PI/6);
    let rg = c.createLinearGradient(0, 0, 0, -VH);
    rg.addColorStop(0, 'rgba(212,175,55,.12)'); rg.addColorStop(1, 'rgba(212,175,55,0)');
    c.fillStyle = rg;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-46, -VH); c.lineTo(46, -VH); c.closePath(); c.fill();
  }
  c.restore();
  let glow = c.createRadialGradient(VW/2, VH*.40, 40, VW/2, VH*.40, 500);
  glow.addColorStop(0, 'rgba(212,175,55,.30)'); glow.addColorStop(1, 'rgba(212,175,55,0)');
  c.fillStyle = glow; c.fillRect(0, 0, VW, VH);
  const coinIn = Math.min(1, t/1.1), ce = 1 - Math.pow(1 - coinIn, 3), cs = 330*ce;
  if (coinRenderer && cs > 4) c.drawImage(coinRenderer.domElement, VW/2 - cs/2, VH*.40 - cs/2, cs, cs);
  else if (logoImg.complete && logoImg.naturalWidth && cs > 4) {
    c.save(); c.beginPath(); c.arc(VW/2, VH*.40, cs/2, 0, 6.28); c.clip();
    c.drawImage(logoImg, VW/2 - cs/2, VH*.40 - cs/2, cs, cs); c.restore();
  }
  c.textAlign = 'center';
  if (t > 1.3) {
    const k = Math.min(1, (t - 1.3)/.5), pop = 1 + .35*(1 - k);
    c.save(); c.translate(VW/2, VH*.62); c.scale(pop, pop); c.globalAlpha = k;
    c.fillStyle = '#9a948a'; c.font = '600 30px Inter,sans-serif';
    c.fillText('E U   G A N H E I', 0, 0); c.restore(); c.globalAlpha = 1;
  }
  if (t > 1.9) {
    const k = Math.min(1, (t - 1.9)/.55), e = 1 - Math.pow(1 - k, 3), pop = .6 + .4*e;
    c.save(); c.translate(VW/2, VH*.70); c.scale(pop, pop); c.globalAlpha = e;
    let gt = c.createLinearGradient(0, -60, 0, 30);
    gt.addColorStop(0, '#f9e29c'); gt.addColorStop(.5, '#d4af37'); gt.addColorStop(1, '#8a6d1d');
    c.fillStyle = gt;
    const [nm, sb] = nomePremioCurto(premio.titulo);
    c.font = '900 80px Cinzel,serif'; c.fillText(nm, 0, 0);
    if (sb) { c.font = '700 40px Cinzel,serif'; c.fillText(sb.toUpperCase(), 0, 60); }
    c.restore(); c.globalAlpha = 1;
  }
  if (t > 2.0) {
    for (const p of vidConf) {
      const lt = t - p.t0; if (lt < 0 || lt > 3.2) continue;
      const x = p.x + p.vx*lt*60, y = p.y + p.vy*lt*60 + 110*lt*lt;
      c.save(); c.translate(x, y); c.rotate(p.rot + lt*p.vr*60);
      c.globalAlpha = Math.max(0, 1 - lt/3.2);
      c.fillStyle = p.col; c.fillRect(-p.w/2, -p.h/2, p.w, p.h); c.restore();
    }
    c.globalAlpha = 1;
  }
  if (t > 4.4) {
    const k = Math.min(1, (t - 4.4)/.5);
    c.globalAlpha = k;
    c.fillStyle = '#f5ecd7'; c.font = '600 30px Inter,sans-serif';
    c.fillText('Empório Família Rodrigues · desde 1974', VW/2, VH*.84);
    c.fillStyle = '#d4af37'; c.font = '800 36px Inter,sans-serif';
    c.fillText('carnesrodrigues.com.br', VW/2, VH*.88);
    c.fillStyle = '#6e695f'; c.font = '400 24px Inter,sans-serif';
    c.fillText('✦ Clube Prime — todo mundo ganha ✦', VW/2, VH*.925);
    c.globalAlpha = 1;
  }
  c.strokeStyle = 'rgba(212,175,55,.85)'; c.lineWidth = 8; c.strokeRect(18, 18, VW - 36, VH - 36);
}
async function recordVideo(bg) {
  const cv = document.createElement('canvas');
  cv.width = VW; cv.height = VH;
  const c = cv.getContext('2d');
  const prev = document.getElementById('recPreview');
  prev.width = VW; prev.height = VH;
  const pc = prev.getContext('2d');
  if (!bg) document.getElementById('recOverlay').classList.add('on');
  seedVidConf();
  const stream = cv.captureStream(30);
  const ctx = audio();
  if (ctx && ctx.createMediaStreamDestination) {
    recDest = ctx.createMediaStreamDestination();
    master.connect(recDest);
    recDest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
  }
  const mime = ['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm']
    .find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
  if (!mime) { document.getElementById('recOverlay').classList.remove('on'); return null; }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise(res => { rec.onstop = res; });
  rec.start(200);
  coinFast = 14;
  fanfare(); setTimeout(fanfare, 2600);
  const t0 = performance.now();
  await new Promise(res => {
    function fr(now) {
      const t = (now - t0)/1000;
      drawVideoFrame(c, t);
      pc.drawImage(cv, 0, 0);
      document.querySelector('#recBar i').style.width = Math.min(100, t/VDUR*100) + '%';
      if (t < VDUR) requestAnimationFrame(fr); else res();
    }
    requestAnimationFrame(fr);
  });
  rec.stop(); await stopped;
  if (recDest) { try { master.disconnect(recDest); } catch (e) {} recDest = null; }
  document.getElementById('recOverlay').classList.remove('on');
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  return new File([new Blob(chunks, { type: mime })], 'jackpot-prime.' + ext, { type: mime });
}

let videoReady = null, videoFile = null;
const SHARE_LABEL = '🎬 Compartilhar meu vídeo e liberar o cupom';
const SHARE_TXT = () => 'Ganhei ' + premio.titulo + ' no Caça-Carne Prime do Empório Família Rodrigues! 🥩 Todo mundo ganha — carnesrodrigues.com.br';
function preRenderVideo() {
  if (videoReady) return videoReady;
  videoReady = recordVideo(true).then(fv => {
    videoFile = fv;
    if (fv) document.getElementById('shareBtn').textContent = '📲 Vídeo pronto — compartilhar e liberar o cupom';
    return fv;
  }).catch(() => null);
  return videoReady;
}
async function liberarCupomViaShare() {
  const r = await rpcCliente('jackpot_confirmar_share');
  if (r && r.ok) {
    st.ciclo.status = 'cupom_emitido'; st.ciclo.cupom_codigo = r.cupom;
    st.ciclo.cupom_validade = r.validade; st.ciclo.premio_titulo = premio.titulo;
    coinDrop(); burstConfetti();
    mostrarCupom(st.ciclo);
  } else { alert('O compartilhamento foi feito, mas houve erro de conexão. Abra de novo — seu prêmio está guardado.'); }
}
async function doShare() {
  if (videoFile && navigator.canShare && navigator.canShare({ files: [videoFile] })) {
    await navigator.share({ files: [videoFile], title: 'Jackpot Prime', text: SHARE_TXT() });
    await liberarCupomViaShare(); return;
  }
  // fallback sem Web Share de arquivo: texto via WhatsApp conta como share
  window.open('https://wa.me/?text=' + encodeURIComponent(SHARE_TXT()), '_blank');
  if (videoFile) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(videoFile); a.download = videoFile.name; a.click();
  }
  await liberarCupomViaShare();
}
document.getElementById('shareBtn').addEventListener('click', async () => {
  const btn = document.getElementById('shareBtn');
  if (videoFile) { try { await doShare(); } catch (e) { /* cancelou — cupom não libera */ } return; }
  btn.disabled = true;
  document.getElementById('recOverlay').classList.add('on');
  await preRenderVideo();
  document.getElementById('recOverlay').classList.remove('on');
  btn.disabled = false;
  if (videoFile) { btn.textContent = '📲 Vídeo pronto — toque para enviar'; buzz(30); }
  else { try { await doShare(); } catch (e) {} } // sem MediaRecorder: share de texto
});

// ── cupom + QR ──
function mostrarCupom(c) {
  document.getElementById('cupomPremio').textContent = c.premio_titulo || '';
  document.getElementById('cupomCode').textContent = c.cupom_codigo || '—';
  const venc = c.cupom_validade && new Date(c.cupom_validade) < Date.now();
  const aviso = document.getElementById('cupomAviso');
  if (c.status === 'pendente_balcao' || venc) {
    aviso.style.display = 'block';
    aviso.textContent = 'Este cupom passou da validade — passe no balcão que o Empório reativa na hora pra você. 🤝';
    document.getElementById('cupomVal').textContent = '';
  } else {
    aviso.style.display = 'none';
    document.getElementById('cupomVal').textContent =
      'válido até ' + fmtData(c.cupom_validade) + ' · o débito dos 5.000 pontos acontece na retirada';
  }
  const box = document.getElementById('qrBox');
  box.innerHTML = '';
  if (typeof QRCode !== 'undefined' && c.cupom_codigo) {
    new QRCode(box, { text: c.cupom_codigo, width: 164, height: 164,
      colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
  } else { box.textContent = c.cupom_codigo || ''; box.style.color = '#000'; }
  document.getElementById('rays').classList.add('on');
  show('cupom');
}

/* boot */
buildStrips(null);
if (document.readyState === 'complete') { initCoin(); requestAnimationFrame(coinLoop); }
else addEventListener('load', () => { initCoin(); requestAnimationFrame(coinLoop); });
boot();
