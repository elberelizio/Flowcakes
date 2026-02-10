-- Transacções e-Mola associadas a licenças (uma licença pode ter vários IDs de transacção).
-- Ex.: ID da transação: CI260204.1854.P66042

CREATE TABLE IF NOT EXISTS license_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_license_id UUID NOT NULL REFERENCES user_licenses(id) ON DELETE CASCADE,
    e_mola_transaction_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_e_mola_transaction UNIQUE (e_mola_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_license_transactions_user_license_id ON license_transactions(user_license_id);
CREATE INDEX IF NOT EXISTS idx_license_transactions_e_mola_id ON license_transactions(e_mola_transaction_id);

COMMENT ON TABLE license_transactions IS 'IDs de transacção e-Mola por licença (ex.: CI260204.1854.P66042).';
COMMENT ON COLUMN license_transactions.e_mola_transaction_id IS 'ID da transacção recebido por SMS e-Mola.';
