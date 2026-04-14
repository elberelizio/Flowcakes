-- Definições da loja/site público por utilizador (Meu site)
CREATE TABLE IF NOT EXISTS user_store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(200) NOT NULL DEFAULT 'Minha Loja',
    store_tagline VARCHAR(300),
    store_description TEXT,
    store_phone VARCHAR(50),
    store_whatsapp VARCHAR(50),
    store_instagram VARCHAR(100),
    store_slug VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_store_settings_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_store_settings_user_id ON user_store_settings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_store_settings_slug ON user_store_settings(store_slug) WHERE store_slug IS NOT NULL;

COMMENT ON TABLE user_store_settings IS 'Personalização do site público (Meu site) por utilizador.';
