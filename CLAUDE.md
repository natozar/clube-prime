# Clube Prime — contexto para o Claude

PWA de fidelidade do Empório Família Rodrigues (Ribeirão Preto). Produção em `https://carnesrodrigues.com.br` (GitHub Pages). Backend: Supabase (PostgREST + RLS + Auth). Push: OneSignal.

## Stack

- Frontend: HTML/CSS/JS vanilla, sem build. Service Worker + boot-purge pra forçar updates.
- Auth cliente: **device-binding** (`clientes.device_id`). NÃO é OTP/PIN. Primeiro dispositivo fica vinculado; trocar tem dois caminhos: **self-service por data de nascimento** (modal no app → RPC `revincular_dispositivo`, commit `397d109`, anti-força-bruta 5 erros/15min) ou admin rodar `liberar_dispositivo_cliente(id)`. O `clube_device_id` persiste em 3 backends com auto-cura — localStorage → cookie 400d → IndexedDB (commit `ae7120b`, `app.js:~1360`); só cunha id novo se os três estiverem vazios.
- Auth admin: Supabase Auth **email + senha** (`signInWithPassword`, `admin.js:504`). Único admin: `natofamiliarodrigues@gmail.com` (owner, cliente id=6, código `RR-6116`, telefone `16999916690`). Magic link existe só como recuperação de acesso — ver seção "Acesso em outro dispositivo".
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
| `sql-*.sql` | SQL histórico. `sql-device-binding.sql`, `sql-fix-rls-profile-leak.sql` e `sql-revincular-dispositivo.sql` são os mais importantes |

## Supabase

- URL: `https://mrourzdxrahpysscckxm.supabase.co`
- Anon key: pública (`SUPA_KEY`, `admin.js:119` e `app.js`)
- Site URL em Auth → URL Configuration: `https://carnesrodrigues.com.br` (estava `http://localhost:3000` até 2026-04-20 — se voltar a apontar pra localhost, magic link quebra)
- Redirect URLs: `carnesrodrigues.com.br`, `/admin.html`, `/**`

## Modelo de segurança (incidente 2026-04-20 fechado)

Antes do incidente: 5 tabelas sensíveis SEM RLS + anon com SELECT/UPDATE. Qualquer um lia/escrevia perfil alheio.

Estado atual:

- **RLS deny-all anon** em `clientes`, `pontos`, `transacoes`, `resgate`, `pedidos`. Cada uma tem exatamente 2 policies: `*_anon_deny` (USING false, roles={anon}) e `*_auth_all` (USING true, roles={authenticated}).
- **Todo acesso a dados sensíveis passa por RPCs `SECURITY DEFINER`** que validam `device_id` contra `clientes.device_id`:
  - `obter_cliente_seguro`, `obter_saldo_seguro`, `obter_transacoes_seguras`, `obter_resgates_seguros`, `obter_rede_segura`, `atualizar_cliente_seguro` (whitelist de campos), `registrar_pedido_seguro`, `autorizar_dispositivo`, `cadastrar_cliente_com_pontos`, `executar_resgate_cliente` (v2, 5 args), `revincular_dispositivo` (valida data de nascimento em vez de device — é o caminho de re-vínculo self-service)
- `liberar_dispositivo_cliente(id)` exige `auth.uid() IS NOT NULL` + EXECUTE revogado de anon (só admin autenticado).
- Admin (`admin.js`) usa `authHeaders()` (role `authenticated`) em TODOS os fetches. **Nunca use `SH` para tabelas sensíveis** — `SH` é anon Bearer e é barrado por RLS.
- RPCs que retornam cliente usam `jsonb_build_object` com whitelist de 18 campos (exclui `pin_hash`, `chave_dispositivo`, `pin_reset_pedido`). Coluna `pin_hash` é legado — PIN auth foi abandonada em favor de device-binding.

Validação empírica em 2026-04-20: fetch anon em `/rest/v1/{clientes,pontos,transacoes,resgate,pedidos}` retornou `[]` nas 5. RPC contra-prova `obter_cliente_seguro('0000000000','device-fake')` retornou `{"ok":false,"acao":"nao_cadastrado"}`. Re-validado na auditoria de 2026-06-12: as 5 tabelas seguem `[]` pra anon; `executar_resgate_cliente` 5-args nega device fake; `revincular_dispositivo` ativa em produção.

## Protocolo de deploy com cache (IMPORTANTE)

GitHub Pages + Service Worker cache-first pra assets estáticos. Dois tipos de bump, escolha pelo impacto desejado:

**Bump só `CACHE_NAME` (`sw.js`)** — força refetch de JS/CSS **sem** apagar `localStorage`. Use para mudanças aditivas (features novas, correções JS) que não exigem wipe de estado. Clientes abertos recebem `FORCE_PURGE` (handler em `app.js` apenas — admin ignora), novos carregamentos pegam o bundle novo do network.

**Bump `APP_VERSION` (`boot-purge.js`) + `CACHE_NAME` juntos** — wipe global de `localStorage`/`sessionStorage` + reload. Use quando uma mudança de lógica invalida estado local (ex: nova derivação de chave em `secure-storage.js`).

Chaves preservadas pelo `boot-purge` no wipe global:
- `clube_device_id` — device-binding do cliente. Apagar manda TODOS pra "comparecer à loja" (regressão v10, fix `d00c96f`).
- `clube-admin-auth` — storageKey do Supabase Auth no admin. Apagar desloga o celular do dono, que é o **ponto único de recuperação de acesso** via botão "📨 Enviar link de acesso" (commit `d157349`).

Commit + push publica no GitHub Pages em 1-3 min.

Versão atual (2026-06-12): `APP_VERSION = v13-2026-05-04` / `CACHE_NAME = clube-prime-v21`. O v13 foi motivado por loop de reload no iPhone (FORCE_PURGE apagava `clube_app_version`, induzindo re-purga eterna); fix: handler em `app.js:801` preserva a mesma whitelist do boot-purge + guard de 60s. v17–v20: device_id durável e reclaim por nascimento (`ae7120b`, `397d109`). v21 (`bee353f`): adicionou `https://viacep.com.br` ao `connect-src` das CSPs — a busca de CEP estava sendo bloqueada pelo navegador e travava cadastro/pedidos.

## Convenções de código

- Event delegation em `app.js` e `admin.js`: botões usam `data-action="nomeFn"` (chamada `window[fn]()`), navegação de aba usa `data-tab="op|painel|...|suporte"`. CSP é strict — nunca adicione `onclick=`. Fetch a domínio novo exige incluí-lo no `connect-src` das **duas** metas CSP (`index.html:4` e `admin.html:4`) — o hardening `41942f8` esqueceu o ViaCEP e quebrou a busca de CEP até o fix `bee353f`.
- Toda renderização de dados do banco em HTML passa por `sanitize()` (DOMPurify). Prefira `textContent` + DOM API sobre `innerHTML`.
- Ao ler chaves `clube_cliente_*` / `clube_ultimo_pedido` / `clube_favoritos`: sempre `await SecureStorage.get(key)`, nunca `localStorage.getItem` direto (o `migrateAll` move pra `cs_*` e apaga a versão plain).
- Nenhuma nova tabela/RPC sensível sem device-binding check (padrão das RPCs `*_seguro` existentes), validação server-side equivalente (`revincular_dispositivo` usa nascimento + rate-limit) ou role check (`auth.uid() IS NOT NULL`).
- Admin tem aba **🐛 Suporte** (commit `5a2958c`) com captura global de `window.onerror` + `unhandledrejection` em buffer circular. Gera prompt markdown estruturado e copia pro clipboard. Use quando reportar bug.

## Acesso em outro dispositivo (recuperação sem reset de senha)

Na aba **⚙️ Admin** tem card **"🔗 Acesso em Outro Dispositivo"** (commit `0143693`). Admin logado clica **📨 Enviar link de acesso** → `enviarMagicLinkAcesso()` chama `supabase.auth.signInWithOtp({email, options:{emailRedirectTo: '/admin.html', shouldCreateUser:false}})`. Email com link único chega em `natofamiliarodrigues@gmail.com`; abrir no outro aparelho (notebook, tablet) cai logado em `/admin.html` com **sessão independente**. O aparelho que enviou o link **não é deslogado** — sessões do Supabase Auth não compartilham localStorage entre dispositivos.

**Restrição durável:** o celular do dono, logado no admin, NUNCA pode ser deslogado. É o único ponto de recuperação se a senha for perdida. Por isso `clube-admin-auth` está na whitelist do `boot-purge` (ver Protocolo de deploy). Evite também: `supabaseClient.auth.signOut()` programático, troca de JWT secret no dashboard, e mudanças que invalidem sessões do Auth em massa.

## Pendências de segurança abertas

### 1. PASSO 4 — dropar `executar_resgate_cliente` 4-args legada (URGENTE)

Hoje existe versão 4-args (sem `device_id`, INSEGURA) e 5-args (com, SEGURA) coexistindo. Frontend v12 (deploy `fc983f6`) já chama a 5-args. **Auditoria 2026-06-12: sondagem anon confirmou que a 4-args AINDA EXISTE no banco** (respondeu "Recompensa não encontrada" em vez de function-not-found). `admin.js` não chama `executar_resgate_cliente` nenhuma — dropar não quebra nada no frontend. Quando o dono confirmar que resgate funciona no celular dele pós-v12, rodar:

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

Mitigação pendente: incluir telefone do cliente na derivação da chave. Quebra `cs_*` existente (força re-fetch no próximo login) e exige bump `APP_VERSION` → `v14-<data>` + `CACHE_NAME` juntos.

### 3. Clientes wipados pelo v10 bug (MITIGADA)

Antes do fix `d00c96f` o v10 apagava `clube_device_id`. Desde `397d109` esses clientes se recuperam sozinhos pelo reclaim por data de nascimento. Só precisa de unblock manual quem não tem `nascimento` preenchido no cadastro:

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
- **Nunca `UPDATE auth.users SET encrypted_password`**. Extensão do Supabase no navegador bloqueia corretamente; é anti-pattern de account takeover. Para recuperar acesso do admin: prefira o botão "📨 Enviar link de acesso" do celular logado (não requer reset). Só use dashboard (Authentication → Users → Send magic link / Send password recovery) se perder o celular também.
- Commits históricos importantes: `113948b` `f5c7454` `4cc0dce` `80e289a` `d00c96f` `fc983f6` `5a2958c` `0143693` `d157349` `ae7120b` `397d109` `bee353f`. `git log --oneline -20` dá o fio da meada.
