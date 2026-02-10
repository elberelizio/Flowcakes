-- Chef Control - Tabela de LICENÇAS
-- Associa o utilizador à licença. Conta finalizada apenas após pagamento (500 MZN).
-- Pagamento: e-Mola 871964887. Sistema reconhece quando o valor é recebido.

CREATE TABLE IF NOT EXISTS user_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    license_token VARCHAR(100) UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_phone VARCHAR(50),
    payment_reference VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_license UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_token ON user_licenses(license_token);
CREATE INDEX IF NOT EXISTS idx_user_licenses_status ON user_licenses(status);

COMMENT ON TABLE user_licenses IS 'Licença por utilizador. status: pending | paid. Pagamento e-Mola 871964887.';
COMMENT ON COLUMN user_licenses.license_token IS 'Token da licença (para teste ou validação).';
COMMENT ON COLUMN user_licenses.payment_phone IS 'Número e-Mola para onde foi enviado o valor (871964887).';
