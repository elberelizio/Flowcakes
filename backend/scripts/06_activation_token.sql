-- Token opaco para o link de ativação: na URL vai só este token, nunca o código da licença.
ALTER TABLE user_licenses
ADD COLUMN IF NOT EXISTS activation_token VARCHAR(64) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_user_licenses_activation_token ON user_licenses(activation_token);
COMMENT ON COLUMN user_licenses.activation_token IS 'Token opaco para o link de ativação (segurança: o código da licença não vai na URL).';

-- Preencher activation_token para licenças já pagas que ainda não têm (ex.: migração)
UPDATE user_licenses
SET activation_token = encode(gen_random_bytes(16), 'hex')
WHERE status = 'paid' AND (activation_token IS NULL OR activation_token = '');
