-- Adicionar campo variable_expenses (despesas variáveis) na tabela orders
-- Executar após criar a tabela orders

-- Adicionar coluna variable_expenses como JSONB
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS variable_expenses JSONB DEFAULT '[]'::jsonb;

-- Criar índice GIN para melhor performance em consultas JSONB
CREATE INDEX IF NOT EXISTS idx_orders_variable_expenses ON orders USING GIN (variable_expenses);

-- Comentário
COMMENT ON COLUMN orders.variable_expenses IS 'Despesas variáveis da encomenda (ex: delivery, spray, etc.) em formato JSON: [{"name": "Delivery", "amount": 50.00}]';
