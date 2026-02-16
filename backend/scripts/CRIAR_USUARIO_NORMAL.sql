-- Script para criar um utilizador normal (não administrador)
-- Este utilizador pode fazer login e usar o sistema como empreendedor

-- Utilizador de teste: Maria Silva
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '871234567',
    'maria123',
    'Maria Silva',
    false,  -- Utilizador NORMAL (não administrador)
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871234567');

-- Verificar se foi criado
SELECT 
    id, 
    phone, 
    full_name, 
    is_admin, 
    created_at
FROM users
WHERE phone = '871234567';

-- Mostrar mensagem de sucesso
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE phone = '871234567') THEN
        RAISE NOTICE 'Utilizador criado com sucesso!';
        RAISE NOTICE 'Telefone: 871234567';
        RAISE NOTICE 'Senha: maria123';
        RAISE NOTICE 'Tipo: Utilizador Normal (is_admin = false)';
    ELSE
        RAISE NOTICE 'Erro ao criar utilizador';
    END IF;
END $$;
