-- Lembretes por utilizador (nome, morada, data entrega, descrição). Dados na base de dados, não em localStorage.
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    delivery_date DATE NOT NULL,
    description VARCHAR(1000),
    notify_days_before INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_delivery_date ON reminders(user_id, delivery_date);
COMMENT ON TABLE reminders IS 'Lembretes leves (calendário). Por utilizador.';
