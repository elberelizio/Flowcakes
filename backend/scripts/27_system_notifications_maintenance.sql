-- Manutenção programada e registo de leitura por utilizador

ALTER TABLE system_notifications
    ADD COLUMN IF NOT EXISTS category VARCHAR(30) NOT NULL DEFAULT 'announcement',
    ADD COLUMN IF NOT EXISTS maintenance_start_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS maintenance_end_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN system_notifications.category IS 'announcement | maintenance';
COMMENT ON COLUMN system_notifications.maintenance_start_at IS 'Início da janela de manutenção (opcional)';
COMMENT ON COLUMN system_notifications.maintenance_end_at IS 'Fim da janela; após esta data deixa de ser exibida';

CREATE TABLE IF NOT EXISTS user_notification_dismissals (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID NOT NULL REFERENCES system_notifications(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_dismissals_user
    ON user_notification_dismissals(user_id);
