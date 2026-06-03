-- Referência opcional indicada pelo cliente; ID da transação da operadora confirmado pelo admin.
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS user_transfer_reference VARCHAR(120);
ALTER TABLE mpesa_payments ADD COLUMN IF NOT EXISTS operator_transaction_ref VARCHAR(32);
