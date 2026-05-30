-- ============================================================
-- Reclaim self-service por data de nascimento — Clube Prime
-- Execute no Supabase Dashboard > SQL Editor (uma vez).
-- ============================================================
--
-- CONTEXTO (2026-05-30):
-- O device_id (clientes.device_id) vivia só em localStorage e o iOS Safari/PWA
-- o descarta (eviction ITP, "limpar dados", troca Safari<->PWA). Perdido o id,
-- o cliente caía em "compareça à loja" (autorizar_dispositivo => 'bloqueado').
-- O fix de durabilidade (3 backends no app.js) estanca casos futuros; esta RPC
-- recupera quem JÁ perdeu o vínculo SEM ida à loja: o cliente confirma a data
-- de nascimento do cadastro e o aparelho atual é re-vinculado na hora.
--
-- DECISÃO DO DONO: auto-revínculo com verificação de NASCIMENTO (não livre),
-- para não reabrir a exposição de CPF/endereço/pontos a quem só conhece o número.
-- NÃO altera autorizar_dispositivo (que tem whitelist de 18 campos) — é aditiva.
-- ============================================================

-- ------------------------------------------------------------
-- Tabela de tentativas (anti-força-bruta da data de nascimento)
-- Só a RPC SECURITY DEFINER acessa; anon/auth são barrados por RLS.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revinculo_tentativas (
  telefone       text PRIMARY KEY,
  tentativas     int NOT NULL DEFAULT 0,
  bloqueado_ate  timestamptz,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.revinculo_tentativas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS revinculo_tentativas_deny ON public.revinculo_tentativas;
CREATE POLICY revinculo_tentativas_deny ON public.revinculo_tentativas
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ------------------------------------------------------------
-- RPC: revincular_dispositivo
--   ok=true  -> nascimento confere; device_id re-vinculado a este aparelho
--   ok=false -> não confere / bloqueado por tentativas / sem nascimento no cadastro
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revincular_dispositivo(
  p_telefone text,
  p_device_id text,
  p_nascimento date
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
  v_cliente   clientes%ROWTYPE;
  v_tent      public.revinculo_tentativas%ROWTYPE;
  c_max_tent  CONSTANT int := 5;                 -- tentativas antes de bloquear
  c_janela    CONSTANT interval := interval '15 minutes';
BEGIN
  IF p_telefone IS NULL OR length(p_telefone) < 8
     OR p_device_id IS NULL OR length(p_device_id) < 8
     OR p_nascimento IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Dados insuficientes.');
  END IF;

  -- Rate limit: se está em janela de bloqueio, recusa sem checar nada.
  SELECT * INTO v_tent FROM public.revinculo_tentativas WHERE telefone = p_telefone;
  IF FOUND AND v_tent.bloqueado_ate IS NOT NULL AND v_tent.bloqueado_ate > now() THEN
    RETURN jsonb_build_object('ok', false, 'erro',
      'Muitas tentativas. Tente novamente em alguns minutos ou procure a loja.');
  END IF;

  SELECT * INTO v_cliente FROM clientes WHERE telefone = p_telefone LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Cadastro não encontrado.');
  END IF;

  -- Sem data de nascimento no cadastro: não há como verificar -> loja.
  IF v_cliente.nascimento IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro',
      'Seu cadastro não tem data de nascimento. Procure a loja para liberar.');
  END IF;

  -- Data não confere: conta a tentativa e, no limite, bloqueia a janela.
  IF v_cliente.nascimento::date <> p_nascimento THEN
    INSERT INTO public.revinculo_tentativas (telefone, tentativas, atualizado_em)
      VALUES (p_telefone, 1, now())
    ON CONFLICT (telefone) DO UPDATE
      SET tentativas = public.revinculo_tentativas.tentativas + 1,
          atualizado_em = now(),
          bloqueado_ate = CASE
            WHEN public.revinculo_tentativas.tentativas + 1 >= c_max_tent
            THEN now() + c_janela ELSE public.revinculo_tentativas.bloqueado_ate END;
    RETURN jsonb_build_object('ok', false, 'erro',
      'Data de nascimento não confere com o cadastro.');
  END IF;

  -- Confere: re-vincula este aparelho e zera o contador de tentativas.
  UPDATE clientes
  SET device_id = p_device_id, device_vinculado_em = now()
  WHERE id = v_cliente.id;

  DELETE FROM public.revinculo_tentativas WHERE telefone = p_telefone;

  RETURN jsonb_build_object('ok', true, 'cliente_id', v_cliente.id);
END;
$function$;

-- Pré-auth: precisa ser chamável por anon (cliente ainda não autenticado).
REVOKE ALL ON FUNCTION public.revincular_dispositivo(text, text, date) FROM public;
GRANT EXECUTE ON FUNCTION public.revincular_dispositivo(text, text, date) TO anon, authenticated;

-- ============================================================
-- Verificação pós-deploy (esperado: 1 linha)
-- ============================================================
-- SELECT proname, pg_get_function_identity_arguments(oid) AS args
-- FROM pg_proc
-- WHERE proname = 'revincular_dispositivo' AND pronamespace = 'public'::regnamespace;
--
-- Teste negativo (data errada -> ok:false):
-- SELECT public.revincular_dispositivo('5516999999999','device-teste-xyz','1900-01-01');
