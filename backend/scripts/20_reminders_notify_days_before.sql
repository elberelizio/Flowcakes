-- Dias antes da data do lembrete em que começam avisos (popup, dashboard). Omissão: 5.
ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS notify_days_before INTEGER NOT NULL DEFAULT 5;
COMMENT ON COLUMN reminders.notify_days_before IS 'Começar a notificar quando faltarem N dias ou menos até à data do lembrete (0 = só no dia).';
