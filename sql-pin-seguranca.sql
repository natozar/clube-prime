-- ============================================================
-- MIGRAÇÃO: PIN de Segurança — Clube Prime
-- Execute no Supabase Dashboard > SQL Editor
-- Adiciona coluna pin_hash na tabela clientes
-- ============================================================

-- Adicionar coluna pin_hash (armazena hash do PIN, não o PIN em si)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pin_hash TEXT DEFAULT NULL;

-- Índice para performance (opcional, útil se quiser buscar por pin)
-- CREATE INDEX IF NOT EXISTS idx_clientes_pin ON clientes(pin_hash) WHERE pin_hash IS NOT NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN clientes.pin_hash IS 'Hash do PIN de 4 dígitos do cliente. NULL = sem PIN cadastrado.';

-- Flag de reset de PIN (admin pode solicitar que cliente crie novo PIN)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pin_reset_pedido BOOLEAN DEFAULT false;

COMMENT ON COLUMN clientes.pin_reset_pedido IS 'Flag que indica se o admin solicitou reset do PIN. true = cliente precisa criar novo PIN.';
