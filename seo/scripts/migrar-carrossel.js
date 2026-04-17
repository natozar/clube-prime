/**
 * Aplica o carrossel de cotações a todos os artigos HTML já publicados.
 * Copia a estrutura (CSS + HTML + JS) do seo/templates/artigo.html e injeta
 * nos arquivos existentes, removendo o painel-mercado-container antigo.
 *
 * Uso: node seo/scripts/migrar-carrossel.js
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');

const SCAN_DIRS = [
  'churrasco', 'cotacao-arroba-boi-gordo-hoje', 'guia',
  'mercado', 'racas', 'regioes',
];

async function collectHtmls() {
  const files = [];
  for (const d of SCAN_DIRS) {
    const full = join(SITE_ROOT, d);
    try { await stat(full); } catch { continue; }
    const entries = await readdir(full);
    for (const name of entries) {
      const p = join(full, name);
      let st; try { st = await stat(p); } catch { continue; }
      if (st.isDirectory()) {
        const sub = await readdir(p);
        for (const s of sub) {
          if (s === 'index.html') {
            const sp = join(p, s);
            try { const sst = await stat(sp); if (sst.isFile()) files.push(sp); } catch {}
          }
        }
      } else if (st.isFile() && name === 'index.html') {
        files.push(p);
      }
    }
  }
  return files;
}

// ─── Blocos a injetar ───
const TICKER_CSS = `        /* ── COTAÇÕES TICKER (carrossel de indicadores — sticky logo abaixo do header) ── */
        .cotacoes-ticker {
            background: linear-gradient(180deg, #0E0E0E 0%, #1A1A1A 100%);
            border-bottom: 1px solid var(--dark-border);
            overflow: hidden;
            position: sticky;
            top: 60px; /* altura do .site-header */
            z-index: 99; /* abaixo do site-header (z-index 100) */
            height: 44px;
            display: flex;
            align-items: center;
        }
        .cotacoes-ticker::before,
        .cotacoes-ticker::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 48px;
            z-index: 2;
            pointer-events: none;
        }
        .cotacoes-ticker::before { left: 0; background: linear-gradient(90deg, #0E0E0E 0%, transparent 100%); }
        .cotacoes-ticker::after { right: 0; background: linear-gradient(270deg, #1A1A1A 0%, transparent 100%); }
        .cotacoes-ticker-track {
            display: flex;
            align-items: center;
            gap: 36px;
            animation: cotacoes-scroll 50s linear infinite;
            white-space: nowrap;
            padding-left: 24px;
            will-change: transform;
        }
        .cotacoes-ticker:hover .cotacoes-ticker-track { animation-play-state: paused; }
        @keyframes cotacoes-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        .cotacoes-ticker-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            font-weight: 500;
            color: var(--text);
        }
        .cotacoes-ticker-item .tk-icon { font-size: 1rem; line-height: 1; }
        .cotacoes-ticker-item .tk-label { color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
        .cotacoes-ticker-item .tk-val { color: var(--gold); font-weight: 700; font-variant-numeric: tabular-nums; }
        .cotacoes-ticker-item .tk-var { font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums; }
        .cotacoes-ticker-item .tk-var.up { color: var(--green); }
        .cotacoes-ticker-item .tk-var.down { color: var(--red); }
        .cotacoes-ticker-item .tk-var.neutral { color: var(--text-muted); }
        .cotacoes-ticker-link {
            color: var(--gold);
            text-decoration: none;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 4px 10px;
            border: 1px solid var(--gold);
            border-radius: 6px;
            transition: background 0.2s;
        }
        .cotacoes-ticker-link:hover { background: var(--gold-glow); }
        .cotacoes-ticker-loading {
            color: var(--text-muted);
            font-size: 0.78rem;
            padding-left: 24px;
        }
        @media (prefers-reduced-motion: reduce) {
            .cotacoes-ticker-track { animation: none; }
        }

`;

const TICKER_HTML = `
    <!-- Carrossel de cotações (atualizado do Supabase em tempo real) -->
    <div class="cotacoes-ticker" id="cotacoes-ticker" aria-label="Cotações de mercado atualizadas">
        <div class="cotacoes-ticker-track" id="cotacoes-ticker-track">
            <span class="cotacoes-ticker-loading">Carregando cotações…</span>
        </div>
    </div>
    <script>
    (function(){
      var SUPA='https://mrourzdxrahpysscckxm.supabase.co/rest/v1';
      var K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb3VyemR4cmFocHlzc2Nja3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODMzMTUsImV4cCI6MjA4ODU1OTMxNX0.A4ueyDJgOu4cbxcHxsMTDBNHkxAOUlWFoYuv88LdnU4';
      var H={'apikey':K,'Authorization':'Bearer '+K};
      var inds=[
        {key:'boi',icon:'🐂',label:'Boi',pre:'R$',suf:'/@',dec:2},
        {key:'dolar',icon:'💵',label:'Dólar',pre:'R$',suf:'',dec:4},
        {key:'milho',icon:'🌽',label:'Milho',pre:'R$',suf:'/sc',dec:2},
        {key:'soja',icon:'🫘',label:'Soja',pre:'R$',suf:'/sc',dec:2},
        {key:'petroleo',icon:'🛢️',label:'Petróleo',pre:'US$',suf:'/bbl',dec:2},
        {key:'ouro',icon:'🥇',label:'Ouro',pre:'R$',suf:'/g',dec:2}
      ];
      var data={}, done=0, total=inds.length;

      function fmtN(v,d){return parseFloat(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}
      function arrow(v){return v>0?'▲':v<0?'▼':'●'}
      function itemHtml(i){
        var v=data[i.key];
        var vc=v.var>0?'up':v.var<0?'down':'neutral';
        var vs=v.var?(v.var>0?'+':'')+v.var.toFixed(2)+'%':'—';
        return '<span class="cotacoes-ticker-item"><span class="tk-icon">'+i.icon+'</span><span class="tk-label">'+i.label+'</span><span class="tk-val">'+i.pre+fmtN(v.val,i.dec)+i.suf+'</span><span class="tk-var '+vc+'">'+arrow(v.var)+' '+vs+'</span></span>';
      }
      function render(){
        var track=document.getElementById('cotacoes-ticker-track');
        if(!track) return;
        var present=inds.filter(function(i){return data[i.key]});
        if(present.length===0){track.parentElement.style.display='none';return;}
        var items=present.map(itemHtml).join('');
        var link='<a href="/mercado" class="cotacoes-ticker-link">Ver painel completo →</a>';
        track.innerHTML=items+link+items+link;
      }

      fetch(SUPA+'/cotacao_arroba?order=data.desc&limit=1',{headers:H}).then(function(r){return r.json()}).then(function(rows){
        if(rows&&rows[0])data.boi={val:parseFloat(rows[0].preco_rs),var:rows[0].variacao_pct?parseFloat(rows[0].variacao_pct):null};
      }).catch(function(){}).finally(function(){done++;if(done>=total)render();});
      ['dolar','petroleo','ouro','milho','soja'].forEach(function(ind){
        fetch(SUPA+'/mercado_indicadores?indicador=eq.'+ind+'&order=data.desc&limit=1',{headers:H}).then(function(r){return r.json()}).then(function(rows){
          if(rows&&rows[0])data[ind]={val:parseFloat(rows[0].valor),var:rows[0].variacao_pct?parseFloat(rows[0].variacao_pct):null};
        }).catch(function(){}).finally(function(){done++;if(done>=total)render();});
      });
    })();
    </script>
`;

// Regex para capturar o bloco antigo de painel-mercado-container + script até o </script>
// O bloco começa com <!-- Painel de Mercado ... --> (ou direto com <div id="painel-mercado-container">)
// e inclui o próximo <script>...</script>.
const PAINEL_OLD_REGEX = /(?:\s*<!--\s*Painel de Mercado[^\n]*-->)?\s*<div id="painel-mercado-container"><\/div>\s*<script>[\s\S]*?<\/script>/;

async function migrar(file) {
  let html = await readFile(file, 'utf8');
  let mudou = false;

  // 1. Injetar CSS se ainda não existir
  if (!html.includes('.cotacoes-ticker {')) {
    // Inserir antes de `/* ── BREADCRUMB ── */` ou, se não existir, antes de `/* ── ARTICLE ── */`
    const anchor = html.indexOf('/* ── BREADCRUMB ── */');
    if (anchor > 0) {
      html = html.slice(0, anchor) + TICKER_CSS + html.slice(anchor);
      mudou = true;
    } else {
      console.warn(`  ⚠ ${file}: sem âncora de CSS`);
    }
  }

  // 2. Injetar HTML do ticker após </header> — se ainda não existir
  if (!html.includes('id="cotacoes-ticker"')) {
    const headerClose = '</header>';
    const idx = html.indexOf(headerClose);
    if (idx > 0) {
      const insertAt = idx + headerClose.length;
      html = html.slice(0, insertAt) + TICKER_HTML + html.slice(insertAt);
      mudou = true;
    } else {
      console.warn(`  ⚠ ${file}: sem </header>`);
    }
  }

  // 3. Remover painel-mercado-container antigo
  if (PAINEL_OLD_REGEX.test(html)) {
    html = html.replace(PAINEL_OLD_REGEX, '');
    mudou = true;
  }

  if (mudou) {
    await writeFile(file, html, 'utf8');
    return true;
  }
  return false;
}

const files = await collectHtmls();
console.log(`Encontrados ${files.length} HTMLs\n`);
let migrados = 0;
for (const f of files) {
  const ok = await migrar(f);
  console.log(`  ${ok ? '↻' : '○'} ${f.replace(SITE_ROOT, '')}`);
  if (ok) migrados++;
}
console.log(`\n✓ ${migrados} arquivo(s) migrado(s).`);
