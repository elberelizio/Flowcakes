-- Rejeição de transferência manual (admin): motivo visível ao utilizador.
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS admin_rejection_reason VARCHAR(500);
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
