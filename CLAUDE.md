# Clube Prime — contexto para o Claude

PWA de fidelidade do Empório Família Rodrigues (Ribeirão Preto). Produção em `https://carnesrodrigues.com.br` (GitHub Pages). Backend: Supabase (PostgREST + RLS + Auth). Push: OneSignal.

## Stack

- Frontend: HTML/CSS/JS vanilla, sem build. Service Worker + boot-purge pra forçar updates.
- Auth cliente: **device-binding** (`clientes.device_id`). NÃO é OTP/PIN. Primeiro dispositivo fica vinculado; trocar exige admin rodar `liberar_dispositivo_cliente(id)`.
- Auth admin: Supabase Auth magic link. Único admin: `natofamiliarodrigues@gmail.com` (owner, cliente id=6, código `RR-6116`, telefone `16999916690`).
- Bibliotecas: supabase-js v2, dompurify, html5-qrcode, OneSignal v16. Sem framework.

## Arquivos principais

| Arquivo | Papel |
|---|---|
| `index.html` + `app.js` + `app.css` | PWA do cliente |
| `admin.html` + `admin.js` + `admin.css` | PWA do admin (caixa, painel, cardápio, blog, admin, suporte) |
| `boot-purge.js` | Executa ANTES de qualquer script; wipe condicional por `APP_VERSION` |
| `sw.js` | Service worker; `CACHE_NAME` precisa mover junto com `APP_VERSION` |
| `secure-storage.js` | AES-GCM em localStorage (prefixo `cs_`). **Bug conhecido:** chave AES deriva só do fingerprint, não inclui user → dois clientes no mesmo device com keys iguais (ver Pendências) |
| `seo/` | Blog SEO pré-renderizado, gerador em `seo/scripts/` |
| `sql-*.sql` | SQL histórico. `sql-device-binding.sql` e `sql-fix-rls-profile-leak.sql` são os mais importantes |

## Supabase

- URL: `https://mrourzdxrahpysscckxm.supabase.co`
- Anon key: pública (embutida em `admin.js` L85 e `app.js`)
- Site URL em Auth → URL Configuration: `https://carnesrodrigues.com.br` (estava `http://localhost:3000` até 2026-04-20 — se voltar a apontar pra localhost, magic link quebra)
- Redirect URLs: `carnesrodrigues.com.br`, `/admin.html`, `/**`

## Modelo de segurança (incidente 2026-04-20 fechado)

Antes do incidente: 5 tabelas sensíveis SEM RLS + anon com SELECT/UPDATE. Qualquer um lia/escrevia perfil alheio.

Estado atual:

- **RLS deny-all anon** em `clientes`, `pontos`, `transacoes`, `resgate`, `pedidos`. Cada uma tem exatamente 2 policies: `*_anon_deny` (USING false, roles={anon}) e `*_auth_all` (USING true, roles={authenticated}).
- **Todo acesso a dados sensíveis passa por RPCs `SECURITY DEFINER`** que validam `device_id` contra `clientes.device_id`:
  - `obter_cliente_seguro`, `obter_saldo_seguro`, `obter_transacoes_seguras`, `obter_resgates_seguros`, `obter_rede_segura`, `atualizar_cliente_seguro` (whitelist de campos), `registrar_pedido_seguro`, `autorizar_dispositivo`, `cadastrar_cliente_com_pontos`, `executar_resgate_cliente` (v2, 5 args)
- `liberar_dispositivo_cliente(id)` exige `auth.uid() IS NOT NULL` + EXECUTE revogado de anon (só admin autenticado).
- Admin (`admin.js`) usa `authHeaders()` (role `authenticated`) em TODOS os fetches. **Nunca use `SH` para tabelas sensíveis** — `SH` é anon Bearer e é barrado por RLS.
- RPCs que retornam cliente usam `jsonb_build_object` com whitelist de 18 campos (exclui `pin_hash`, `chave_dispositivo`, `pin_reset_pedido`). Coluna `pin_hash` é legado — PIN auth foi abandonada em favor de device-binding.

Validação empírica em 2026-04-20: fetch anon em `/rest/v1/{clientes,pontos,transacoes,resgate,pedidos}` retornou `[]` nas 5. RPC contra-prova `obter_cliente_seguro('0000000000','device-fake')` retornou `{"ok":false,"acao":"nao_cadastrado"}`.

## Protocolo de deploy com cache (IMPORTANTE)

GitHub Pages + Service Worker cache-first pra assets estáticos. Para garantir que mudança em JS chegue a todos os usuários:

1. Bump `APP_VERSION` em `boot-purge.js` (formato `vNN-YYYY-MM-DD`)
2. Bump `CACHE_NAME` em `sw.js` para o mesmo número (`clube-prime-vNN`)
3. Commit + push; GitHub Pages publica em 1-3 min
4. Usuários abertos recebem `FORCE_PURGE` do SW ao ativar; novos carregamentos disparam `boot-purge` → `localStorage.clear()` → `location.reload()`
5. **`boot-purge` preserva `clube_device_id`**. Se wipar essa chave, todos os clientes existentes batem em "comparecer à loja" porque `getDeviceId()` gera UUID novo e `obter_cliente_seguro` rejeita por mismatch. Regressão já ocorrida em v10, fix em v11 (commit `d00c96f`).

Versão atual (2026-04-20): `v12-2026-04-20` / `clube-prime-v12` (commit `fc983f6`).

## Convenções de código

- Event delegation em `admin.js`: botões usam `data-action="nomeFn"` (chamada `window[fn]()`), navegação de aba usa `data-tab="op|painel|...|suporte"`. CSP é strict — nunca adicione `onclick=`.
- Toda renderização de dados do banco em HTML passa por `sanitize()` (DOMPurify). Prefira `textContent` + DOM API sobre `innerHTML`.
- Ao ler chaves `clube_cliente_*` / `clube_ultimo_pedido` / `clube_favoritos`: sempre `await SecureStorage.get(key)`, nunca `localStorage.getItem` direto (o `migrateAll` move pra `cs_*` e apaga a versão plain).
- Nenhuma nova tabela/RPC sensível sem device-binding check (padrão das 14 RPCs existentes) ou role check (`auth.uid() IS NOT NULL`).
- Admin tem aba **🐛 Suporte** (commit `5a2958c`) com captura global de `window.onerror` + `unhandledrejection` em buffer circular. Gera prompt markdown estruturado e copia pro clipboard. Use quando reportar bug.

## Pendências de segurança abertas

### 1. PASSO 4 — dropar `executar_resgate_cliente` 4-args legada (URGENTE)

Hoje existe versão 4-args (sem `device_id`, INSEGURA) e 5-args (com, SEGURA) coexistindo. Frontend v12 (deploy `fc983f6`) já chama a 5-args. Quando o dono confirmar que resgate funciona no celular dele pós-v12, rodar:

```sql
DROP FUNCTION IF EXISTS public.executar_resgate_cliente(bigint, bigint, text, timestamptz);

SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE proname = 'executar_resgate_cliente' AND pronamespace='public'::regnamespace;
-- esperado: 1 linha só, args com p_device_id text
```

**Risco residual enquanto não droppar:** atacante que descobrir `cliente_id` + recompensa_id pode gerar cupom indevido chamando a 4-args diretamente. Não vaza perfil. Fechar assim que possível.

### 2. SecureStorage com chave derivada só de fingerprint (FIX 5 pendente)

`secure-storage.js:16-25`: `deriveKey` usa apenas `userAgent + language + screen + timezone`. Dois clientes no mesmo aparelho (A usa, admin libera device, B assume) geram a MESMA chave AES → B pode decriptar `cs_clube_cliente_*` deixado pelo A.

Mitigação pendente: incluir telefone do cliente na derivação da chave. Quebra `cs_*` existente (força re-fetch no próximo login) e exige bump `APP_VERSION` → `v13`.

### 3. Clientes wipados pelo v10 bug

Antes do fix `d00c96f` o v10 apagava `clube_device_id`. Quando esses clientes voltarem pelo app, veem "comparecer à loja". Unblock ad-hoc:

```sql
SELECT liberar_dispositivo_cliente(id) FROM clientes WHERE telefone IN ('551699...','551699...');
```

## Referência OneSignal

- App ID: `204a1304-2cc4-44b8-af83-f35ceaabd504`
- Push broadcast: dashboard OneSignal (Messages → New Push → audience `Total Subscriptions`) é mais confiável que REST. Audiência é pequena — opt-in via banner customizado (`notifyButton.enable:false` em `app.js:~102`).
- Launch URL para forçar update: `https://carnesrodrigues.com.br/?v=<versao>` (query param bypassa cache HTTP intermediário).

## Dicas para sessão nova

- Antes de propor mudança em RPC, `pg_get_functiondef(oid)` pra ter o source literal. Já teve mojibake (`prÃ³prio` em policy) passar em DROP por nome literal — use `LIKE` + `EXECUTE format('DROP POLICY %I...')` quando desconfiar.
- `RAISE NOTICE` não aparece no SQL Editor do Supabase. Use `SELECT` pra confirmar estado.
- Monaco do Supabase tem autocomplete agressivo que troca `cmd` por `comment_directive`. Use alias (`pol.cmd AS policy_cmd`) ou cole em vez de digitar.
- **Nunca `UPDATE auth.users SET encrypted_password`**. Extensão do Supabase no navegador bloqueia corretamente; é anti-pattern de account takeover. Para reset de admin, usar o dashboard (Authentication → Users → Send magic link / Send password recovery).
- Commits históricos importantes: `113948b` `f5c7454` `4cc0dce` `80e289a` `d00c96f` `fc983f6` `5a2958c`. `git log --oneline -20` dá o fio da meada.
