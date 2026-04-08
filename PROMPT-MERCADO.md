# PROMPT PARA CLAUDE CODE — Painel de Mercado Multi-Indicadores

## Contexto

O projeto `clube-prime` (GitHub Pages em carnesrodrigues.com.br) já possui:
- Scraper de cotação da arroba do boi gordo via CEPEA/Esalq (`seo/scripts/cotacao-scraper.js`)
- Sistema de artigos SEO diários (`seo/scripts/conteudo-diario.js`)
- Template HTML dark/gold premium (`seo/templates/artigo.html`)
- Supabase como backend (tabela `cotacao_arroba`)
- Workflow GitHub Actions (`seo-diario.yml`) rodando seg-dom
- Secrets configurados: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `UNSPLASH_ACCESS_KEY`

## Objetivo

Expandir o sistema de cotações para incluir **indicadores financeiros que impactam diretamente o setor de carnes e o bolso do cliente**. Os clientes do Clube Prime são donos de açougues, pecuaristas e consumidores premium — eles querem um painel completo, não só arroba.

## Indicadores a adicionar

1. **Dólar Comercial (PTAX)** — Fonte: BCB (api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/30?formato=json)
2. **Petróleo Brent** — impacta frete e custos logísticos. Fonte: API pública (usar exchangerate ou similar que não exija key)
3. **Ouro (g)** — referência de valor. Fonte: BCB ou API pública
4. **Milho (saca 60kg)** — custo de ração/confinamento. Fonte: CEPEA (cepea.esalq.usp.br/br/indicador/milho.aspx)
5. **Soja (saca 60kg)** — custo de ração. Fonte: CEPEA (cepea.esalq.usp.br/br/indicador/soja.aspx)

## Tarefas técnicas

### 1. SQL — Nova tabela no Supabase

Criar arquivo `sql-mercado-indicadores.sql` na raiz do projeto:
- Tabela `mercado_indicadores` com colunas: `id` (serial), `data` (date), `indicador` (text — enum: 'dolar', 'petroleo', 'ouro', 'milho', 'soja'), `valor` (numeric), `variacao_pct` (numeric, nullable), `fonte` (text), `created_at` (timestamptz default now())
- Unique constraint em `(data, indicador)` para upsert
- RLS: leitura pública (anon), escrita via service_role
- Índice em `(indicador, data DESC)` para queries rápidas

### 2. Scraper multi-indicadores

Criar `seo/scripts/mercado-scraper.js`:
- Função separada para cada indicador (scrapeDoalar, scrapePetroleo, scrapeOuro, scrapeMilho, scrapeSoja)
- Dólar e Ouro via API JSON do BCB (sem necessidade de cheerio)
- Milho e Soja via scraping do CEPEA (mesmo padrão do cotacao-scraper.js)
- Petróleo: buscar de API pública gratuita sem key (sugestão: usar a mesma lógica do BCB ou scraping de commodities)
- Salvar tudo na tabela `mercado_indicadores` via Supabase REST API (upsert)
- Função `getResumoMercado()` que retorna o último valor de cada indicador
- Export das funções para uso no conteudo-diario.js
- Robusto: se um indicador falhar, logar warning e continuar com os outros (continue-on-error por indicador)

### 3. Atualizar o workflow

No `seo-diario.yml`, adicionar um step ANTES do "Gerar e publicar artigo":
```yaml
- name: Scraping indicadores de mercado
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
  run: node seo/scripts/mercado-scraper.js
  continue-on-error: true
```

### 4. Widget "Painel de Mercado" no template

Adicionar ao `seo/templates/artigo.html` um bloco reutilizável `{{PAINEL_MERCADO}}` — um componente visual dark/gold que mostra:
- 6 cards em grid (2x3 mobile, 3x2 desktop): Boi Gordo, Dólar, Petróleo, Ouro, Milho, Soja
- Cada card: ícone/emoji, nome, valor formatado (R$ ou US$), variação % (verde/vermelho)
- Estilo coerente com o design existente (var --gold, --dark-card, etc.)
- Os dados serão injetados pelo conteudo-diario.js no momento da geração

### 5. Atualizar conteudo-diario.js

- Importar `getResumoMercado` do mercado-scraper.js
- No artigo de **segunda, quarta e sexta** (dias de cotação), incluir o painel de mercado completo no topo do artigo
- Nos demais dias, incluir um mini-resumo (1 linha: "Mercado hoje: Boi R$xxx | Dólar R$x,xx | Milho R$xx")
- Criar novo tipo de conteúdo para **quinta-feira**: "Panorama do Mercado" — artigo semanal analisando a correlação entre os indicadores (dólar forte → exportação → arroba sobe, etc.)

### 6. Novo conteúdo JSON

Criar `seo/conteudos/panorama-mercado.json`:
- Slug: `mercado/panorama-semanal`
- Template de artigo explicando como dólar, petróleo e milho impactam o preço da carne
- FAQ com perguntas tipo "Por que o dólar alto aumenta o preço da carne?" e "Como o preço do milho afeta o boi gordo?"
- Schema.org para FAQ

### 7. Página estática de mercado

Criar `mercado/index.html` — página hub com:
- Painel de mercado completo (6 indicadores)
- Gráficos (Chart.js) dos últimos 30 dias de cada indicador
- Links para artigos relacionados
- SEO otimizado: title "Cotações do Mercado Agro Hoje | Clube Prime"

## Regras importantes

- **NÃO usar APIs pagas** — só fontes gratuitas (BCB, CEPEA, APIs públicas)
- **NÃO quebrar o que já funciona** — o scraper de arroba e o fluxo existente devem continuar funcionando
- Manter o padrão ESM (import/export) já usado no projeto
- Cheerio já está no package.json — usar para scraping HTML
- Adicionar ao package.json qualquer dependência nova necessária
- Formatar valores em pt-BR (R$ com vírgula, porcentagem com sinal +/-)
- Cada scraper individual deve ter tratamento de erro isolado (um falhar não trava os outros)
- Testar localmente antes de commitar: `node seo/scripts/mercado-scraper.js`

## Ordem de execução sugerida

1. Criar o SQL e rodar no Supabase (ou deixar pronto para rodar)
2. Criar mercado-scraper.js e testar
3. Atualizar seo-diario.yml
4. Criar o widget de painel no template
5. Atualizar conteudo-diario.js para integrar os dados
6. Criar panorama-mercado.json
7. Criar mercado/index.html
8. Commit e push
