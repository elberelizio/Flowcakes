-- Colunas para fluxo de pagamento: reporte pelo utilizador e histórico com valores
ALTER TABLE user_licenses ADD COLUMN IF NOT EXISTS payment_reported_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE license_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);
ALTER TABLE license_transactions ADD COLUMN IF NOT EXISTS duration_months INTEGER;
