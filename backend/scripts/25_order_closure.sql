-- Encerramento de encomendas (motivo, devolução, prejuízo, data)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closure_reason VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closure_note VARCHAR(1000);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_stage VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_type VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loss_amount DECIMAL(12, 2);
