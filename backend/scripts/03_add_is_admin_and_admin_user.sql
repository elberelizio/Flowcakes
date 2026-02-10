-- Migração: adicionar coluna is_admin e definir o administrador.
-- OBRIGATÓRIO: sem isto o login com a conta admin leva para "Finalizar conta".
-- O admin tem passe livre (não precisa de licença). Executar na base chefcontrol2025.

-- 1) Adicionar coluna is_admin se não existir (PostgreSQL 9.5+)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) Atualizar o utilizador com telefone 871964887 para admin e definir a senha
UPDATE users
SET is_admin = true,
    password_hash = '#2025filhodamae$',
    updated_at = NOW()
WHERE phone = '871964887';

-- Se o admin ainda não existir na tabela, criar o registo (opcional):
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT gen_random_uuid(), '871964887', '#2025filhodamae$', 'Administrador', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871964887');
