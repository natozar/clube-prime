# Clube Prime — Empório Família Rodrigues
PWA de fidelidade premium para o Empório de Carnes Família Rodrigues.

## Estrutura
```
clube-prime/
├── index.html      # App principal (todas as telas)
├── manifest.json   # Configuração PWA
├── sw.js           # Service Worker (cache offline)
├── netlify.toml    # Configuração de deploy
├── icon-*.png      # Ícones (72 a 512px)
└── .gitignore
```

## Deploy no Netlify
1. Faça push para o GitHub
2. No Netlify: **Add new site → Import from Git**
3. Selecione o repositório
4. Build command: *(vazio)*
5. Publish directory: `.`
6. **Deploy site**

## Desenvolvimento local
Abra `index.html` diretamente no navegador, ou use um servidor local:
```bash
npx serve .
```
