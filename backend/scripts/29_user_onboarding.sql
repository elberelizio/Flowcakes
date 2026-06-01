-- Marca conclusão do onboarding (popup de boas-vindas no primeiro login)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.onboarding_completed_at IS 'Quando o utilizador concluiu o popup de boas-vindas; NULL = ainda não viu';
