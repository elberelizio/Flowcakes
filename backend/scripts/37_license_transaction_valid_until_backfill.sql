-- Estimativa: cada pagamento = duration_months × 30 dias a partir da data do pagamento
UPDATE license_transactions
SET valid_until_after = created_at + (COALESCE(duration_months, 1) * interval '30 days')
WHERE valid_until_after IS NULL;
