-- Chef Control - Reclamacoes e contacto da pagina publica
-- Guarda mensagens do formulario /contacto (destino interno por e-mail na aplicacao)

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(30),
    message VARCHAR(4000) NOT NULL,
    page_url VARCHAR(500),
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
    ON contact_messages(created_at DESC);

COMMENT ON TABLE contact_messages IS
    'Reclamacoes e pedidos de apoio enviados no formulario publico de contacto.';
