# FIX URGENTE — Texto dos botões invisível nos artigos SEO

## Bug

Os dois CTAs no final de cada artigo estão com **texto invisível**:
1. Botão "Compartilhar no WhatsApp" (`.btn-whatsapp`) — texto gold em fundo verde
2. Botão "Quero entrar no Clube Prime" (`.btn-primary`) — texto gold em fundo gold gradient

## Causa raiz (já diagnosticada — NÃO precisa investigar)

No `<style>` de cada artigo (e no template `seo/templates/artigo.html`), a regra:

```css
.article a {
    color: var(--gold);
    /* especificidade 0,1,1 (classe + elemento) */
}
```

sobrescreve:

```css
.btn-whatsapp {
    color: #fff;
    /* especificidade 0,1,0 (classe apenas) — PERDE */
}

.btn-primary {
    color: var(--dark);
    /* especificidade 0,1,0 (classe apenas) — PERDE */
}
```

## Fix exato

No arquivo `seo/templates/artigo.html`, alterar APENAS estas 2 regras CSS (não mudar nada de HTML):

### 1. `.btn-whatsapp` — trocar por `.article .btn-whatsapp`

De:
```css
.btn-whatsapp {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--whatsapp);
    color: #fff;
    text-decoration: none;
    padding: 16px 40px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.02em;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(37, 211, 102, 0.3);
}
```

Para:
```css
.article .btn-whatsapp {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--whatsapp);
    color: #fff;
    text-decoration: none;
    padding: 16px 40px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.02em;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(37, 211, 102, 0.3);
}
```

### 2. `.btn-primary` — trocar por `.article .btn-primary`

De:
```css
.btn-primary {
    display: inline-block;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
    color: var(--dark);
    text-decoration: none;
    padding: 16px 44px;
    border-radius: 50px;
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.03em;
    transition: all 0.2s;
    box-shadow: 0 4px 24px rgba(197, 165, 90, 0.35);
}
```

Para:
```css
.article .btn-primary {
    display: inline-block;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
    color: var(--dark);
    text-decoration: none;
    padding: 16px 44px;
    border-radius: 50px;
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.03em;
    transition: all 0.2s;
    box-shadow: 0 4px 24px rgba(197, 165, 90, 0.35);
}
```

### 3. Fazer o mesmo para os estados `:hover`

De:
```css
.btn-whatsapp:hover { ... color: #fff; ... }
.btn-primary:hover { ... color: var(--dark); ... }
```

Para:
```css
.article .btn-whatsapp:hover { ... color: #fff; ... }
.article .btn-primary:hover { ... color: var(--dark); ... }
```

## Onde aplicar

1. **Template**: `seo/templates/artigo.html` — 4 seletores a alterar (os 2 base + 2 hover)
2. **Páginas já geradas** — aplicar o mesmo fix em TODOS os HTML já publicados:
   - `cotacao-arroba-boi-gordo-hoje/index.html`
   - `racas/angus/index.html`
   - `racas/hereford/index.html`
   - `regioes/alta-mogiana/index.html`
   - `churrasco/quantidade-carne-por-pessoa/index.html`
   - `churrasco/receita-costela-fogo-de-chao/index.html`
   - `guia/carne-de-pasto-vs-confinamento/index.html`
   - E qualquer outro HTML que tenha esses botões

## Verificação

Após o fix, abrir qualquer artigo no navegador e confirmar:
- Botão WhatsApp: texto BRANCO (#fff) em fundo verde
- Botão Clube Prime: texto PRETO (#0A0A0A) em fundo dourado gradient

## IMPORTANTE

- NÃO alterar o HTML, apenas o CSS
- NÃO alterar a regra `.article a` (ela está correta para links normais)
- NÃO usar `!important` — resolver por especificidade
- O fix é adicionar `.article` antes dos 4 seletores dos botões
- Commit e push após aplicar em todos os arquivos
