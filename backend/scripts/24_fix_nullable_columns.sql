-- Corrige colunas criadas pelo Hibernate com valores NULL (impede NOT NULL / DEFAULT).
-- Executar uma vez se aparecerem erros DDL em notify_days_before ou failed_password_attempts.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reminders' AND column_name = 'notify_days_before'
  ) THEN
    UPDATE reminders SET notify_days_before = 5 WHERE notify_days_before IS NULL;
    ALTER TABLE reminders ALTER COLUMN notify_days_before SET DEFAULT 5;
    ALTER TABLE reminders ALTER COLUMN notify_days_before SET NOT NULL;
  ELSE
    ALTER TABLE reminders ADD COLUMN notify_days_before INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'failed_password_attempts'
  ) THEN
    UPDATE users SET failed_password_attempts = 0 WHERE failed_password_attempts IS NULL;
    ALTER TABLE users ALTER COLUMN failed_password_attempts SET DEFAULT 0;
    ALTER TABLE users ALTER COLUMN failed_password_attempts SET NOT NULL;
  ELSE
    ALTER TABLE users ADD COLUMN failed_password_attempts INT NOT NULL DEFAULT 0;
  END IF;
END $$;
