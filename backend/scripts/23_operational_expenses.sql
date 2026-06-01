-- Despesas operacionais da plataforma (tesouraria admin)
CREATE TABLE IF NOT EXISTS operational_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'geral',
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operational_expenses_date ON operational_expenses(expense_date DESC);

-- Configurações da plataforma (alertas, manutenção)
CREATE TABLE IF NOT EXISTS platform_admin_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO platform_admin_settings (setting_key, setting_value) VALUES
    ('feedback_alert_threshold', '5'),
    ('maintenance_interval_days', '90'),
    ('last_maintenance_at', '')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE operational_expenses IS 'Despesas operacionais da Chef Control (hosting, marketing, suporte, etc.).';
COMMENT ON TABLE platform_admin_settings IS 'Parâmetros de alertas e manutenção do painel admin.';
