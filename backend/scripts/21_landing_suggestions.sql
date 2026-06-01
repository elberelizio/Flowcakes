-- Chef Control - Sugestoes da landing page publica
-- Guarda nome, mensagem, identificador do dispositivo e metadados de origem

CREATE TABLE IF NOT EXISTS landing_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name VARCHAR(120) NOT NULL,
    message VARCHAR(350) NOT NULL,
    device_id VARCHAR(120) NOT NULL,
    page_url VARCHAR(500),
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_suggestions_created_at
    ON landing_suggestions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_landing_suggestions_device_id
    ON landing_suggestions(device_id);

COMMENT ON TABLE landing_suggestions IS
    'Sugestoes enviadas na landing page (com nome e identificador do dispositivo).';
