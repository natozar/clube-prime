-- ============================================================
-- PIN de Segurança — Clube Prime
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- Schema base
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pin_hash TEXT DEFAULT NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pin_reset_pedido BOOLEAN DEFAULT false;

COMMENT ON COLUMN clientes.pin_hash IS 'Hash do PIN com salt único por cliente (formato ph_xxx_<id>). NULL = sem PIN.';
COMMENT ON COLUMN clientes.pin_reset_pedido IS 'Flag que indica se o cliente precisa criar novo PIN.';

-- ============================================================
-- CORREÇÃO DE SEGURANÇA (2026-04-20)
-- Bug corrigido: PINs com mesmo valor geravam hash idêntico, permitindo
-- que dois clientes com PIN igual compartilhassem autenticação.
-- Solução: salt único por cliente no hash + UNIQUE index em pin_hash.
-- ============================================================

-- Trava dupla: nenhum hash pode se repetir entre clientes
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_pin_hash_unique
ON clientes(pin_hash)
WHERE pin_hash IS NOT NULL;

-- Reset obrigatório de PINs antigos (formato sem salt per-cliente)
UPDATE clientes
SET pin_hash = NULL, pin_reset_pedido = true
WHERE pin_hash IS NOT NULL AND pin_hash NOT LIKE 'ph\_%\_%' ESCAPE '\';

-- RPC que salva o PIN validando formato + pertencimento ao cliente
CREATE OR REPLACE FUNCTION public.salvar_pin_cliente(p_cliente_id bigint, p_pin_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_existe BOOLEAN;
  v_sufixo TEXT;
BEGIN
  IF p_pin_hash IS NULL OR NOT p_pin_hash LIKE 'ph\_%\_%' ESCAPE '\' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Formato de PIN inválido. Atualize o app.');
  END IF;

  v_sufixo := split_part(p_pin_hash, '_', array_length(string_to_array(p_pin_hash, '_'), 1));
  IF v_sufixo <> p_cliente_id::text THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Hash de PIN não corresponde ao cliente.');
  END IF;

  SELECT EXISTS(SELECT 1 FROM clientes WHERE id = p_cliente_id) INTO v_existe;
  IF NOT v_existe THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Cliente não encontrado.');
  END IF;

  UPDATE clientes
  SET pin_hash = p_pin_hash, pin_reset_pedido = false
  WHERE id = p_cliente_id;

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Este PIN já está em uso. Escolha outro.');
END;
$function$;
