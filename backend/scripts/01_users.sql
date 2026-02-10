-- Chef Control - Tabela de LOGIN (utilizadores)
-- Executar na base chefcontrol2025. Ordem: 00_create_database -> 01_users -> 02_licenses -> ...
-- Permite registo e login para acesso ao sistema.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    document_type VARCHAR(10),
    document_number VARCHAR(50),
    province VARCHAR(100),
    email VARCHAR(255),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

COMMENT ON TABLE users IS 'Utilizadores (login). Conta só fica finalizada após pagamento da licença.';
