-- =====================================================
-- MIGRAÇÃO: PIN vinculado ao dispositivo + logout forçado
-- Data: 2026-04-07
-- Descrição: Adiciona coluna chave_dispositivo na tabela clientes
--            e invalida todos os PINs antigos (hash v1 → v2)
-- =====================================================

-- 1. Adicionar coluna chave_dispositivo
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS chave_dispositivo TEXT;

-- 2. Invalidar TODOS os PINs antigos (forçar recadastro com vinculação ao dispositivo)
-- Os hashes antigos (prefixo 'ph_') são incompatíveis com o novo formato ('ph2_')
-- Todos os clientes terão que criar novo PIN vinculado ao seu celular
UPDATE clientes SET pin_hash = NULL, chave_dispositivo = NULL WHERE pin_hash IS NOT NULL;

-- 3. Criar índice para buscas por chave_dispositivo
CREATE INDEX IF NOT EXISTS idx_clientes_chave_dispositivo ON clientes(chave_dispositivo);

-- 4. Comentário na coluna para documentação
COMMENT ON COLUMN clientes.chave_dispositivo IS 'Chave única do dispositivo do cliente — vincula o PIN ao celular específico';
