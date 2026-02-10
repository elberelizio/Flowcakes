-- Chef Control - Script de criação das tabelas (PostgreSQL)
-- Executar na base de dados chefcontrol2025 (CREATE DATABASE chefcontrol2025;)
-- 1) Utilizadores (login)
-- 2) Pedidos divididos em: doces e salgados (com metadata: data criação, origem, MAC, browser/dispositivo)

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

-- ========== Pedidos DOCES ==========
-- Campos do formulário doces: cliente, subcategoria (Bolos, Biscoitos, Outros doces), produto, tamanho, valores, etc.
-- Metadata: data de criação, origem do registo, MAC address, tipo de browser/dispositivo
CREATE TABLE IF NOT EXISTS orders_doces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_name VARCHAR(200) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    size VARCHAR(50),
    value_charged DECIMAL(12, 2) NOT NULL DEFAULT 0,
    value_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    observations VARCHAR(1000),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Metadata do registo
    source VARCHAR(50),
    mac_address VARCHAR(100),
    browser_or_device VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_orders_doces_user_id ON orders_doces(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_doces_created_at ON orders_doces(created_at DESC);
COMMENT ON TABLE orders_doces IS 'Registo de pedidos de doces (Bolos, Biscoitos, etc.)';
COMMENT ON COLUMN orders_doces.source IS 'Origem do registo: web, app, etc.';
COMMENT ON COLUMN orders_doces.mac_address IS 'Endereço MAC do aparelho (quando disponível)';
COMMENT ON COLUMN orders_doces.browser_or_device IS 'Tipo de browser ou dispositivo (user agent / descrição)';

-- ========== Pedidos SALGADOS ==========
-- Campos do formulário salgados: cliente, subcategoria (Chamussas, Recois, etc.), produto, kg, unidades/kg, valores
CREATE TABLE IF NOT EXISTS orders_salgados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_name VARCHAR(200) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL,
    units_per_kg INTEGER,
    value_charged DECIMAL(12, 2) NOT NULL DEFAULT 0,
    value_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    observations VARCHAR(1000),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Metadata do registo
    source VARCHAR(50),
    mac_address VARCHAR(100),
    browser_or_device VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_orders_salgados_user_id ON orders_salgados(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_salgados_created_at ON orders_salgados(created_at DESC);
COMMENT ON TABLE orders_salgados IS 'Registo de pedidos de salgados (Chamussas, Recois, etc.)';
COMMENT ON COLUMN orders_salgados.source IS 'Origem do registo: web, app, etc.';
COMMENT ON COLUMN orders_salgados.mac_address IS 'Endereço MAC do aparelho (quando disponível)';
COMMENT ON COLUMN orders_salgados.browser_or_device IS 'Tipo de browser ou dispositivo (user agent / descrição)';

-- ========== Ingredientes por pedido (doces) ==========
CREATE TABLE IF NOT EXISTS order_doces_ingredient_ids (
    order_id UUID NOT NULL REFERENCES orders_doces(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (order_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_order_doces_ing_order ON order_doces_ingredient_ids(order_id);

-- ========== Ingredientes por pedido (salgados) ==========
CREATE TABLE IF NOT EXISTS order_salgados_ingredient_ids (
    order_id UUID NOT NULL REFERENCES orders_salgados(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (order_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_order_salgados_ing_order ON order_salgados_ingredient_ids(order_id);
