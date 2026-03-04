-- Adicionar campos de data de entrega e transporte na tabela orders
-- Executar após criar a tabela orders

-- 1. Adicionar campo delivery_date (data de entrega)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- 2. Adicionar campo has_delivery (se tem transporte/delivery)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS has_delivery BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Adicionar campo delivery_cost (custo de transporte)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- 4. Adicionar campo order_status (estado do pedido)
-- Valores: 'ordered' (pedido feito), 'in_progress' (em processo), 'completed' (finalizado), 'cancelled' (cancelado)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_status VARCHAR(20) NOT NULL DEFAULT 'ordered';

-- 5. Adicionar campo is_cancelled (se foi cancelado - mantém compatibilidade)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT FALSE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_cancelled ON orders(is_cancelled);

-- Comentários
COMMENT ON COLUMN orders.delivery_date IS 'Data prevista para entrega do pedido';
COMMENT ON COLUMN orders.has_delivery IS 'Se o pedido inclui custo de transporte/delivery';
COMMENT ON COLUMN orders.delivery_cost IS 'Custo de transporte/delivery (MZN)';
COMMENT ON COLUMN orders.order_status IS 'Estado do pedido: ordered, in_progress, completed, cancelled';
COMMENT ON COLUMN orders.is_cancelled IS 'Se o pedido foi cancelado';
