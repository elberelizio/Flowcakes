-- Chef Control - Tabela de logs de acesso (login)
-- Regista cada login para estatísticas de utilização

CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_phone VARCHAR(50),
    user_full_name VARCHAR(200),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

COMMENT ON TABLE access_logs IS 'Registo de acessos (login) para estatísticas e auditoria.';
