-- EN: Normalize trial rows that were stored as status=paid with TRIAL reference.
-- PT: Normalizar linhas de teste gravadas como paid com referência TRIAL.
-- Run once against your DB (e.g. psql -f 19_trial_license_status.sql).

UPDATE user_licenses
SET status = 'trial'
WHERE UPPER(TRIM(COALESCE(payment_reference, ''))) = 'TRIAL'
  AND status = 'paid';
