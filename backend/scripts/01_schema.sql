-- Chef Control - Schema base (PostgreSQL)
-- Executar na base de dados chefcontrol2025 (CREATE DATABASE chefcontrol2025;)
-- Cria: users, user_licenses. A tabela orders é criada por create_orders_table.sql

-- ========== Utilizadores ==========
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
COMMENT ON TABLE users IS 'Utilizadores (login). is_admin para perfil administrador.';

-- ========== Licenças (pagamento 500 MZN - e-Mola 871964887) ==========
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
COMMENT ON TABLE user_licenses IS 'Licença por utilizador. Pagamento e-Mola 871964887.';
