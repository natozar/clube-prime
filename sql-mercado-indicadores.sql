-- Tabela de indicadores de mercado
CREATE TABLE IF NOT EXISTS mercado_indicadores (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    indicador TEXT NOT NULL CHECK (indicador IN ('dolar', 'petroleo', 'ouro', 'milho', 'soja')),
    valor NUMERIC(12,4) NOT NULL,
    variacao_pct NUMERIC(6,2),
    fonte TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (data, indicador)
);

CREATE INDEX IF NOT EXISTS idx_mercado_ind_data ON mercado_indicadores(indicador, data DESC);

ALTER TABLE mercado_indicadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mercado_select_public" ON mercado_indicadores FOR SELECT USING (true);
CREATE POLICY "mercado_insert_service" ON mercado_indicadores FOR INSERT WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR current_setting('role') = 'postgres'
);
CREATE POLICY "mercado_select_authenticated" ON mercado_indicadores FOR SELECT TO authenticated USING (true);
