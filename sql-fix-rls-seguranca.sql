-- =====================================================
-- MIGRAÇÃO: Correção de RLS — restringir leitura pública
-- Data: 2026-04-07
-- Descrição: Remove políticas SELECT públicas das tabelas sensíveis
--            Clientes, pontos, transacoes e resgate não devem ser
--            legíveis por qualquer pessoa com a anon key.
-- =====================================================

-- 1. CLIENTES — apenas admin pode listar todos
DROP POLICY IF EXISTS "Clientes visíveis publicamente" ON clientes;
DROP POLICY IF EXISTS "clientes_select_public" ON clientes;
DROP POLICY IF EXISTS "Leitura pública de clientes" ON clientes;

CREATE POLICY "clientes_select_restrito" ON clientes
  FOR SELECT USING (
    -- Admin vê todos
    is_admin()
    -- Ou cliente vê apenas seus próprios dados (via RPC ou filtro por ID)
    OR id::text = current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );

-- 2. PONTOS — apenas admin ou dono
DROP POLICY IF EXISTS "Pontos visíveis publicamente" ON pontos;
DROP POLICY IF EXISTS "pontos_select_public" ON pontos;
DROP POLICY IF EXISTS "Leitura pública de pontos" ON pontos;

CREATE POLICY "pontos_select_restrito" ON pontos
  FOR SELECT USING (
    is_admin()
    OR cliente_id::text = current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );

-- 3. TRANSACOES — apenas admin ou dono
DROP POLICY IF EXISTS "Transações visíveis publicamente" ON transacoes;
DROP POLICY IF EXISTS "transacoes_select_public" ON transacoes;
DROP POLICY IF EXISTS "Leitura pública de transacoes" ON transacoes;

CREATE POLICY "transacoes_select_restrito" ON transacoes
  FOR SELECT USING (
    is_admin()
    OR cliente_id::text = current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );

-- 4. RESGATE — apenas admin ou dono
DROP POLICY IF EXISTS "Resgates visíveis publicamente" ON resgate;
DROP POLICY IF EXISTS "resgate_select_public" ON resgate;
DROP POLICY IF EXISTS "Leitura pública de resgate" ON resgate;

CREATE POLICY "resgate_select_restrito" ON resgate
  FOR SELECT USING (
    is_admin()
    OR cliente_id::text = current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );

-- 5. PEDIDOS — apenas admin ou dono (corrigir filtro que estava como true)
DROP POLICY IF EXISTS "Cliente vê próprios pedidos ou admin vê todos" ON pedidos;

CREATE POLICY "pedidos_select_restrito" ON pedidos
  FOR SELECT USING (
    is_admin()
    OR cliente_id::text = current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );

-- 6. Garantir que recompensas tem RLS (leitura pública OK — é catálogo)
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "recompensas_select_public" ON recompensas
  FOR SELECT USING (true);

-- NOTA: Estas policies usam current_setting('request.jwt.claims')
-- que funciona com Supabase Auth. Para o fluxo atual (anon key sem auth),
-- apenas admin autenticado via Supabase Auth conseguirá listar dados.
-- O app do cliente acessa seus próprios dados via filtro ?id=eq.{id}
-- que passa pelo RLS pois a query retorna apenas o registro do dono.
--
-- IMPORTANTE: O app usa anon key + filtros no client-side.
-- Para RLS funcionar plenamente, o app precisa migrar para
-- Supabase Auth para clientes também (futuro).
-- Por ora, manter SELECT com filtro no client-side é a proteção principal.
