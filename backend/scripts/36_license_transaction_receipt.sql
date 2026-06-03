-- Recibo por pagamento: número único e validade da licença após confirmação
ALTER TABLE license_transactions
  ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(32),
  ADD COLUMN IF NOT EXISTS valid_until_after TIMESTAMPTZ;

UPDATE license_transactions
SET receipt_number = 'RC-' || to_char(created_at AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' ||
  upper(substring(replace(id::text, '-', '') from 1 for 8))
WHERE receipt_number IS NULL OR receipt_number = '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_license_transactions_receipt_number
  ON license_transactions (receipt_number)
  WHERE receipt_number IS NOT NULL;
