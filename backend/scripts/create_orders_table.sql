-- Criar tabela orders conforme esperado pelo backend
-- Esta tabela unifica doces e salgados usando o campo category

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_name VARCHAR(200) NOT NULL,
    category VARCHAR(20), -- "doces" | "salgados"
    subcategory VARCHAR(100),
    product_name VARCHAR(200),
    size VARCHAR(50),
    quantity_kg DECIMAL(10, 2),
    units_per_kg INTEGER,
    value_charged DECIMAL(12, 2) NOT NULL DEFAULT 0,
    value_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    observations VARCHAR(1000),
    cake_name VARCHAR(200),
    cake_size VARCHAR(50),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Tabela para ingredientes (usada pelo ElementCollection)
CREATE TABLE IF NOT EXISTS order_ingredient_ids (
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (order_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_order_ingredient_order ON order_ingredient_ids(order_id);

COMMENT ON TABLE orders IS 'Pedidos unificados (doces e salgados)';
COMMENT ON COLUMN orders.category IS 'Categoria: "doces" ou "salgados"';
