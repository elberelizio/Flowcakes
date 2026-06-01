-- Tesouraria da plataforma: investimentos, alocações e sugestões
CREATE TABLE IF NOT EXISTS treasury_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    invested_at DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasury_investments_date ON treasury_investments(invested_at DESC);

CREATE TABLE IF NOT EXISTS treasury_allocation_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    proposed_allocations JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_treasury_suggestions_status ON treasury_allocation_suggestions(status, created_at DESC);

-- Configuração da conta e percentagens (soma recomendada = 100)
INSERT INTO platform_admin_settings (setting_key, setting_value) VALUES
    ('treasury_account_balance', '50000'),
    ('treasury_alloc_maintenance_pct', '40'),
    ('treasury_alloc_fixed_pct', '15'),
    ('treasury_alloc_reserve_pct', '15'),
    ('treasury_alloc_payroll_pct', '20'),
    ('treasury_alloc_tools_pct', '10'),
    ('treasury_payroll_headcount', '2')
ON CONFLICT (setting_key) DO NOTHING;

-- Investimento inicial de referência (5 000 MZN)
INSERT INTO treasury_investments (amount, invested_at, notes)
SELECT 5000, CURRENT_DATE, 'Investimento inicial da plataforma'
WHERE NOT EXISTS (SELECT 1 FROM treasury_investments LIMIT 1);

COMMENT ON TABLE treasury_investments IS 'Capital injectado na plataforma (tesouraria).';
COMMENT ON TABLE treasury_allocation_suggestions IS 'Sugestões automáticas de ajuste de percentagens.';
