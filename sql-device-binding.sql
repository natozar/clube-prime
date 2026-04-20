-- ============================================================
-- Device Binding — Clube Prime
-- Substitui o sistema de PIN por vínculo 1:1 entre cliente e dispositivo.
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================
--
-- CONTEXTO (2026-04-20):
-- O sistema de PIN foi removido após incidente onde dois clientes com o
-- mesmo PIN compartilhavam autenticação. A solução anterior (salt por
-- cliente + UNIQUE index) resolvia o bug técnico, mas a arquitetura
-- continuava frágil. Optamos por um modelo mais simples e seguro:
-- cada cliente fica atrelado ao device_id do primeiro celular que usar
-- o app. Caso troque de celular, procura a loja para liberação manual.
-- ============================================================

-- Schema: device binding
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS device_vinculado_em TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN clientes.device_id IS 'UUID do dispositivo atrelado ao cliente. NULL = sem dispositivo vinculado.';
COMMENT ON COLUMN clientes.device_vinculado_em IS 'Momento em que o dispositivo foi vinculado.';

-- Um dispositivo só pode estar atrelado a um único cliente
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_device_id_unique
ON clientes(device_id)
WHERE device_id IS NOT NULL;

-- ============================================================
-- Cleanup: remover PIN (sistema descontinuado)
-- ============================================================
DROP FUNCTION IF EXISTS public.salvar_pin_cliente(bigint, text);
DROP INDEX IF EXISTS idx_clientes_pin_hash_unique;
DROP TABLE IF EXISTS pin_tentativas;
ALTER TABLE clientes DROP COLUMN IF EXISTS pin_hash;
ALTER TABLE clientes DROP COLUMN IF EXISTS pin_reset_pedido;

-- ============================================================
-- RPC: autorizar_dispositivo
-- Resolve o fluxo de acesso:
--   - vinculado       : primeiro acesso → vincular device_id ao cliente
--   - entrar          : device_id já pertence ao cliente
--   - bloqueado       : telefone pertence a outro dispositivo
--   - nao_cadastrado  : telefone não existe → frontend abre cadastro
-- ============================================================
CREATE OR REPLACE FUNCTION public.autorizar_dispositivo(p_telefone text, p_device_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_cliente clientes%ROWTYPE;
BEGIN
  IF p_telefone IS NULL OR length(p_telefone) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'acao', 'erro', 'erro', 'Telefone inválido.');
  END IF;
  IF p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'acao', 'erro', 'erro', 'Dispositivo inválido.');
  END IF;

  SELECT * INTO v_cliente FROM clientes WHERE telefone = p_telefone LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'acao', 'nao_cadastrado');
  END IF;

  -- Primeiro acesso deste cliente: vincular device atual
  IF v_cliente.device_id IS NULL THEN
    UPDATE clientes
    SET device_id = p_device_id, device_vinculado_em = now()
    WHERE id = v_cliente.id;
    RETURN jsonb_build_object('ok', true, 'acao', 'vinculado', 'cliente_id', v_cliente.id);
  END IF;

  -- Device atual é o vinculado: liberar acesso
  IF v_cliente.device_id = p_device_id THEN
    RETURN jsonb_build_object('ok', true, 'acao', 'entrar', 'cliente_id', v_cliente.id);
  END IF;

  -- Device diferente: bloqueado (cliente precisa ir à loja liberar)
  RETURN jsonb_build_object('ok', false, 'acao', 'bloqueado',
    'erro', 'Este telefone já está vinculado a outro dispositivo. Procure a loja para liberar seu novo celular.');
END;
$function$;

-- ============================================================
-- RPC: liberar_dispositivo_cliente
-- Admin libera o vínculo para o cliente poder usar novo celular.
-- ============================================================
CREATE OR REPLACE FUNCTION public.liberar_dispositivo_cliente(p_cliente_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_existe BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM clientes WHERE id = p_cliente_id) INTO v_existe;
  IF NOT v_existe THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Cliente não encontrado.');
  END IF;

  UPDATE clientes
  SET device_id = NULL, device_vinculado_em = NULL
  WHERE id = p_cliente_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- ============================================================
-- Atualizar cadastrar_cliente_com_pontos para aceitar device_id
-- ============================================================
-- Esta função já foi atualizada via migration device_binding_remove_pin.
-- Verifique com: SELECT proargnames FROM pg_proc WHERE proname = 'cadastrar_cliente_com_pontos';
