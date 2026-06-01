-- Sessões de acesso com fim de sessão e registo de páginas/operações

ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN access_logs.ended_at IS 'Momento de logout; NULL = sessão ainda aberta ou terminada sem logout explícito.';

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_log_id UUID NOT NULL REFERENCES access_logs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL,
    page_path VARCHAR(500),
    operation VARCHAR(200),
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_access_log ON user_activity_logs(access_log_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_open_session ON access_logs(user_id, created_at DESC) WHERE ended_at IS NULL;

COMMENT ON TABLE user_activity_logs IS 'Páginas visitadas e operações durante cada sessão (login).';
