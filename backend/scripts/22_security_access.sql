-- Segurança de acesso: tentativas falhadas, motivo de bloqueio e auditoria

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_password_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason VARCHAR(50);
COMMENT ON COLUMN users.failed_password_attempts IS 'Tentativas falhadas de senha (login ou alteração de contacto). Bloqueio automático após 4.';
COMMENT ON COLUMN users.block_reason IS 'PASSWORD_ATTEMPTS | MANUAL | null';

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_phone VARCHAR(50),
    user_full_name VARCHAR(200),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

COMMENT ON TABLE security_events IS 'Auditoria: logins falhados, alteração de contacto, bloqueios automáticos.';
