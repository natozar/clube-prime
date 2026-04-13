-- =============================================
-- CLUBE PRIME SEO — Tabela de Cotação da Arroba
-- Executar no Supabase SQL Editor
-- =============================================

-- 1. Tabela principal de cotação
CREATE TABLE IF NOT EXISTS cotacao_arroba (
    id SERIAL PRIMARY KEY,
    data DATE UNIQUE NOT NULL,
    preco_rs DECIMAL(10,2) NOT NULL,
    variacao_pct DECIMAL(5,2),
    fonte TEXT DEFAULT 'CEPEA/Esalq',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas por data (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_cotacao_data ON cotacao_arroba(data DESC);

-- 2. Tabela de artigos SEO publicados
CREATE TABLE IF NOT EXISTS seo_artigos (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('cotacao', 'raca', 'cruzamento', 'corte', 'regiao', 'guia', 'churrasco', 'familia')),
    meta_description TEXT,
    og_image_url TEXT,
    conteudo_resumo TEXT,
    publicado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    push_enviado BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_seo_categoria ON seo_artigos(categoria);
CREATE INDEX IF NOT EXISTS idx_seo_publicado ON seo_artigos(publicado_em DESC);

-- 3. Tabela de analytics SEO (beacon)
CREATE TABLE IF NOT EXISTS seo_analytics (
    id BIGSERIAL PRIMARY KEY,
    evento TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    device TEXT,
    scroll_depth INTEGER,
    time_on_page INTEGER,
    affiliate_id TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_analytics_path ON seo_analytics(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_evento ON seo_analytics(evento);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_affiliate ON seo_analytics(affiliate_id) WHERE affiliate_id IS NOT NULL;

-- 4. RLS — Cotação: leitura pública, escrita apenas via service_role
ALTER TABLE cotacao_arroba ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotacao_select_public" ON cotacao_arroba
    FOR SELECT USING (true);

CREATE POLICY "cotacao_insert_service" ON cotacao_arroba
    FOR INSERT WITH CHECK (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR current_setting('role') = 'postgres'
    );

-- 5. RLS — Artigos SEO: leitura pública, escrita via service_role
ALTER TABLE seo_artigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artigos_select_public" ON seo_artigos
    FOR SELECT USING (ativo = true);

CREATE POLICY "artigos_insert_service" ON seo_artigos
    FOR INSERT WITH CHECK (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR current_setting('role') = 'postgres'
    );

CREATE POLICY "artigos_update_service" ON seo_artigos
    FOR UPDATE USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR current_setting('role') = 'postgres'
    );

-- 6. RLS — Analytics: inserção pública (anon), leitura via service_role
ALTER TABLE seo_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_insert_public" ON seo_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_select_service" ON seo_analytics
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR current_setting('role') = 'postgres'
    );

-- 7. Função para limpar analytics antigos (manter 90 dias)
CREATE OR REPLACE FUNCTION limpar_analytics_antigos()
RETURNS void AS $$
BEGIN
    DELETE FROM seo_analytics WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
