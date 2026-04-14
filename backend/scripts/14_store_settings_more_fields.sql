-- Mais campos para a loja (endereço, email, horário, tagline do rodapé)
ALTER TABLE user_store_settings ADD COLUMN IF NOT EXISTS store_address VARCHAR(500);
ALTER TABLE user_store_settings ADD COLUMN IF NOT EXISTS store_email VARCHAR(255);
ALTER TABLE user_store_settings ADD COLUMN IF NOT EXISTS store_hours VARCHAR(300);
ALTER TABLE user_store_settings ADD COLUMN IF NOT EXISTS store_footer_tagline VARCHAR(400);
