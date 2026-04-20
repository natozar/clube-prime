-- ============================================================
-- HOTFIX: Vazamento de perfil entre clientes (2026-04-20)
-- ============================================================
-- CAUSA RAIZ: anon key publica + PostgREST sem RLS nas tabelas
--   clientes / pontos / transacoes / resgate permite que qualquer
--   cliente leia/modifique dados de qualquer outro (GET/PATCH com
--   cliente_id ou telefone arbitrarios).
--
-- SOLUCAO: todas as leituras/escritas passam por RPCs SECURITY
--   DEFINER que validam (telefone/cliente_id, device_id). Somente
--   o dispositivo atrelado ao cliente via autorizar_dispositivo
--   consegue operar sobre os dados.
--
-- DEPLOY EM 2 FASES:
--   FASE A (este arquivo, seção A): cria RPCs — NAO quebra o app atual.
--   FASE B (seção B, comentada): ativa RLS deny-all nas tabelas
--     sensíveis. SO aplique depois que o frontend estiver usando
--     100% as RPCs em producao.
-- ============================================================

-- =============================================================
-- FASE A — RPCs seguras (aplicar AGORA, apos backup)
-- =============================================================

-- Helper: valida se o device_id corresponde ao cliente
CREATE OR REPLACE FUNCTION public.fn_validar_device(
  p_cliente_id BIGINT,
  p_device_id  TEXT
) RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clientes
    WHERE id = p_cliente_id
      AND device_id IS NOT NULL
      AND device_id = p_device_id
  );
$$;

-- 1) Buscar cliente + saldo por telefone (substitui GET /clientes?telefone=eq.)
--    Autoriza se device bate OU cliente ainda nao tem device vinculado
--    (o fluxo de login usa autorizar_dispositivo antes).
CREATE OR REPLACE FUNCTION public.obter_cliente_seguro(
  p_telefone  TEXT,
  p_device_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente clientes%ROWTYPE;
  v_saldo   INT;
BEGIN
  IF p_telefone IS NULL OR p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'parametros invalidos');
  END IF;

  SELECT * INTO v_cliente FROM clientes WHERE telefone = p_telefone LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'acao', 'nao_cadastrado');
  END IF;

  -- Device tem que ser o vinculado. Se esta NULL, o cliente ainda nao
  -- passou por autorizar_dispositivo — negue e instrua fluxo correto.
  IF v_cliente.device_id IS NULL OR v_cliente.device_id <> p_device_id THEN
    RETURN jsonb_build_object('ok', false, 'acao', 'bloqueado',
      'erro', 'Dispositivo nao autorizado para este cliente.');
  END IF;

  SELECT COALESCE(saldo, 0) INTO v_saldo FROM pontos WHERE cliente_id = v_cliente.id LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'cliente', to_jsonb(v_cliente),
    'saldo', COALESCE(v_saldo, 0)
  );
END;
$$;

-- 2) Saldo do cliente
CREATE OR REPLACE FUNCTION public.obter_saldo_seguro(
  p_cliente_id BIGINT,
  p_device_id  TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_saldo INT;
BEGIN
  IF NOT fn_validar_device(p_cliente_id, p_device_id) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'unauthorized');
  END IF;
  SELECT COALESCE(saldo, 0) INTO v_saldo FROM pontos WHERE cliente_id = p_cliente_id LIMIT 1;
  RETURN jsonb_build_object('ok', true, 'saldo', COALESCE(v_saldo, 0));
END;
$$;

-- 3) Extrato de transacoes
CREATE OR REPLACE FUNCTION public.obter_transacoes_seguras(
  p_cliente_id BIGINT,
  p_device_id  TEXT,
  p_limit      INT DEFAULT 20
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_rows JSONB;
BEGIN
  IF NOT fn_validar_device(p_cliente_id, p_device_id) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'unauthorized');
  END IF;
  SELECT COALESCE(jsonb_agg(t ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT * FROM transacoes
    WHERE cliente_id = p_cliente_id
    ORDER BY created_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 200)
  ) t;
  RETURN jsonb_build_object('ok', true, 'transacoes', v_rows);
END;
$$;

-- 4) Historico de resgates (inclui nome da recompensa)
CREATE OR REPLACE FUNCTION public.obter_resgates_seguros(
  p_cliente_id BIGINT,
  p_device_id  TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_rows JSONB;
BEGIN
  IF NOT fn_validar_device(p_cliente_id, p_device_id) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'unauthorized');
  END IF;
  -- Retorna TODOS os campos de resgate + objeto aninhado recompensas.nome
  SELECT COALESCE(jsonb_agg(row ORDER BY (row->>'created_at') DESC), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT to_jsonb(r) || jsonb_build_object(
      'recompensas', jsonb_build_object('nome', rc.nome)
    ) AS row
    FROM resgate r
    LEFT JOIN recompensas rc ON rc.id = r.recompensa_id
    WHERE r.cliente_id = p_cliente_id
  ) sub;
  RETURN jsonb_build_object('ok', true, 'resgates', v_rows);
END;
$$;

-- 5) Rede (compras + indicados)
CREATE OR REPLACE FUNCTION public.obter_rede_segura(
  p_cliente_id BIGINT,
  p_device_id  TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_compras JSONB;
  v_indicados JSONB;
BEGIN
  IF NOT fn_validar_device(p_cliente_id, p_device_id) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'unauthorized');
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'valor_reais', valor_reais)), '[]'::jsonb)
    INTO v_compras
    FROM transacoes WHERE cliente_id = p_cliente_id AND tipo = 'compra';
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id)), '[]'::jsonb)
    INTO v_indicados
    FROM clientes WHERE indicado_por = p_cliente_id;
  RETURN jsonb_build_object('ok', true, 'compras', v_compras, 'indicados', v_indicados);
END;
$$;

-- 6) Atualizar dados do cliente (substitui PATCH direto)
--    Permite apenas um whitelist de campos — nunca device_id, saldo,
--    indicado_por, etc. (evita escalonamento de privilegio).
CREATE OR REPLACE FUNCTION public.atualizar_cliente_seguro(
  p_cliente_id BIGINT,
  p_device_id  TEXT,
  p_dados      JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nome       TEXT;
  v_nasc       DATE;
  v_email      TEXT;
  v_cpf        TEXT;
  v_cep        TEXT;
  v_rua        TEXT;
  v_numero     TEXT;
  v_bairro     TEXT;
  v_cidade     TEXT;
  v_uf         TEXT;
BEGIN
  IF NOT fn_validar_device(p_cliente_id, p_device_id) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'unauthorized');
  END IF;

  -- Extrai APENAS campos permitidos; ignora o resto silenciosamente
  v_nome   := NULLIF(p_dados->>'nome', '');
  v_nasc   := CASE WHEN NULLIF(p_dados->>'nascimento', '') IS NOT NULL
                   THEN (p_dados->>'nascimento')::date ELSE NULL END;
  v_email  := NULLIF(p_dados->>'email', '');
  v_cpf    := NULLIF(p_dados->>'cpf', '');
  v_cep    := NULLIF(p_dados->>'cep', '');
  v_rua    := NULLIF(p_dados->>'rua', '');
  v_numero := NULLIF(p_dados->>'numero', '');
  v_bairro := NULLIF(p_dados->>'bairro', '');
  v_cidade := NULLIF(p_dados->>'cidade', '');
  v_uf     := NULLIF(upper(p_dados->>'uf'), '');

  UPDATE clientes
     SET nome       = COALESCE(v_nome, nome),
         nascimento = COALESCE(v_nasc, nascimento),
         email      = COALESCE(v_email, email),
         cpf        = COALESCE(v_cpf, cpf),
         cep        = COALESCE(v_cep, cep),
         rua        = COALESCE(v_rua, rua),
         numero     = COALESCE(v_numero, numero),
         bairro     = COALESCE(v_bairro, bairro),
         cidade     = COALESCE(v_cidade, cidade),
         uf         = COALESCE(v_uf, uf)
   WHERE id = p_cliente_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 7) Registrar pedido (evita spam de pedidos em nome de terceiro)
CREATE OR REPLACE FUNCTION public.registrar_pedido_seguro(
  p_cliente_id       BIGINT,
  p_device_id        TEXT,
  p_itens            JSONB,
  p_observacao_geral TEXT,
  p_data_entrega     TEXT,
  p_horario_entrega  TEXT,
  p_tipo_entrega     TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT fn_validar_device(p_cliente_id, p_device_id) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'unauthorized');
  END IF;
  INSERT INTO pedidos (cliente_id, itens, observacao_geral, data_entrega, horario_entrega, tipo_entrega)
  VALUES (p_cliente_id, p_itens, p_observacao_geral, p_data_entrega, p_horario_entrega, p_tipo_entrega)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'pedido_id', v_id);
END;
$$;

-- Permissoes: anon e authenticated podem executar as RPCs
GRANT EXECUTE ON FUNCTION public.fn_validar_device(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_cliente_seguro(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_saldo_seguro(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_transacoes_seguras(BIGINT, TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_resgates_seguros(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obter_rede_segura(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_cliente_seguro(BIGINT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pedido_seguro(BIGINT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- =============================================================
-- FASE B — ativar RLS deny-all (aplicar DEPOIS do novo frontend
--   estar em producao e confirmado funcionando)
-- =============================================================
-- IMPORTANTE: ao rodar esta secao, qualquer chamada direta antiga
-- (/rest/v1/clientes, /pontos, /transacoes, /resgate) usando anon
-- passa a retornar 0 linhas. Deploy do frontend novo deve vir antes.

-- Descomente tudo abaixo APOS validar o frontend:
--
-- ALTER TABLE clientes   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pontos     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resgate    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pedidos    ENABLE ROW LEVEL SECURITY;
--
-- -- Clientes: anon nao ve nada direto; authenticated (admin logado) ve tudo
-- DROP POLICY IF EXISTS "clientes_anon_deny"  ON clientes;
-- DROP POLICY IF EXISTS "clientes_auth_all"   ON clientes;
-- CREATE POLICY "clientes_anon_deny" ON clientes FOR ALL TO anon USING (false) WITH CHECK (false);
-- CREATE POLICY "clientes_auth_all"  ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- DROP POLICY IF EXISTS "pontos_anon_deny"    ON pontos;
-- DROP POLICY IF EXISTS "pontos_auth_all"     ON pontos;
-- CREATE POLICY "pontos_anon_deny"   ON pontos   FOR ALL TO anon USING (false) WITH CHECK (false);
-- CREATE POLICY "pontos_auth_all"    ON pontos   FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- DROP POLICY IF EXISTS "transacoes_anon_deny" ON transacoes;
-- DROP POLICY IF EXISTS "transacoes_auth_all"  ON transacoes;
-- CREATE POLICY "transacoes_anon_deny" ON transacoes FOR ALL TO anon USING (false) WITH CHECK (false);
-- CREATE POLICY "transacoes_auth_all"  ON transacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- DROP POLICY IF EXISTS "resgate_anon_deny"    ON resgate;
-- DROP POLICY IF EXISTS "resgate_auth_all"     ON resgate;
-- CREATE POLICY "resgate_anon_deny"  ON resgate  FOR ALL TO anon USING (false) WITH CHECK (false);
-- CREATE POLICY "resgate_auth_all"   ON resgate  FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- DROP POLICY IF EXISTS "pedidos_anon_deny"    ON pedidos;
-- DROP POLICY IF EXISTS "pedidos_auth_all"     ON pedidos;
-- CREATE POLICY "pedidos_anon_deny"  ON pedidos  FOR ALL TO anon USING (false) WITH CHECK (false);
-- CREATE POLICY "pedidos_auth_all"   ON pedidos  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================
-- DEPOIS da FASE B: testar
-- =============================================================
-- curl "https://<proj>.supabase.co/rest/v1/clientes?select=*" -H "apikey: <anon>"
--   -> deve retornar []  (antes retornava todos os clientes)
-- curl -X POST "https://<proj>.supabase.co/rest/v1/rpc/obter_cliente_seguro" \
--      -H "apikey: <anon>" -H "Content-Type: application/json" \
--      -d '{"p_telefone":"5511...","p_device_id":"<uuid>"}'
--   -> deve retornar o cliente apenas se device bate
