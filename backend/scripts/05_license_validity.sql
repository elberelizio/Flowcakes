-- Adiciona validade à licença: 30 dias por mês pago; renovação soma tempo restante + nova duração.
ALTER TABLE user_licenses
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_licenses_valid_until ON user_licenses(valid_until);
COMMENT ON COLUMN user_licenses.valid_until IS 'Data até à qual a licença é válida. Após esta data o utilizador precisa renovar.';
