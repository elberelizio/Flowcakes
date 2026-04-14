-- Retiradas de caixa (valor tirado do negócio pelo utilizador)
-- Executar após 01_schema e tabela users existir

CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    withdrawal_date DATE NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON withdrawals(withdrawal_date);
COMMENT ON TABLE withdrawals IS 'Retiradas de caixa: valor tirado do negócio (ex.: para uso pessoal, compras).';
