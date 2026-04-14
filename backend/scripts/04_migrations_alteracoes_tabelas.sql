/*
 * Chef Control - Migrações: alterações de tabelas existentes
 * Junta em um único script todas as alterações (ADD COLUMN, índices) que antes estavam em vários ficheiros.
 * Pode ser executado várias vezes (usa IF NOT EXISTS) — ideal para bases já existentes.
 *
 * Ordem de execução: após 01_schema.sql, 03_add_is_admin..., create_orders_table.sql
 */

-- ========== USERS ==========
-- Bloquear utilizador (impede login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN users.blocked IS 'Se true, o utilizador não pode fazer login.';

-- ========== USER_LICENSES ==========
-- Validade da licença (30 dias por mês pago)
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_user_licenses_valid_until ON user_licenses(valid_until);
COMMENT ON COLUMN user_licenses.valid_until IS 'Data até à qual a licença é válida. Após esta data o utilizador precisa renovar.';

-- Token opaco para o link de ativação
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS activation_token VARCHAR(64) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_user_licenses_activation_token ON user_licenses(activation_token);
COMMENT ON COLUMN user_licenses.activation_token IS 'Token opaco para o link de ativação (segurança: o código da licença não vai na URL).';
UPDATE user_licenses SET activation_token = encode(gen_random_bytes(16), 'hex')
WHERE status = 'paid' AND (activation_token IS NULL OR activation_token = '');

-- Licenças rejeitadas (podem ser aprovadas depois)
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN user_licenses.rejected_at IS 'Quando o admin rejeitou; NULL = não rejeitado. Rejeitados podem ser aprovados depois com ID de pagamento.';

-- ========== ORDERS ==========
-- Colunas de entrega, estado, endereços, despesas variáveis
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_delivery BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(20) NOT NULL DEFAULT 'ordered';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_address VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS variable_expenses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no INTEGER;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_is_cancelled ON orders(is_cancelled);
CREATE INDEX IF NOT EXISTS idx_orders_variable_expenses ON orders USING GIN (variable_expenses);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(user_id, order_no);

-- Preencher order_no para encomendas existentes (por user_id, ordenado por created_at)
WITH numbered AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM orders
  WHERE order_no IS NULL
)
UPDATE orders o SET order_no = n.rn
FROM numbered n WHERE o.id = n.id;
