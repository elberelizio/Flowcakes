-- Script para criar múltiplos utilizadores normais para teste
-- Útil para testar o sistema com diferentes utilizadores

-- Utilizador 1: Maria Silva
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT gen_random_uuid(), '871234567', 'maria123', 'Maria Silva', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871234567');

-- Utilizador 2: João Santos
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT gen_random_uuid(), '872345678', 'joao123', 'João Santos', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '872345678');

-- Utilizador 3: Ana Costa
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT gen_random_uuid(), '873456789', 'ana123', 'Ana Costa', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '873456789');

-- Utilizador 4: Pedro Alves
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT gen_random_uuid(), '874567890', 'pedro123', 'Pedro Alves', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '874567890');

-- Verificar utilizadores criados
SELECT 
    phone,
    full_name,
    is_admin,
    created_at
FROM users
WHERE phone IN ('871234567', '872345678', '873456789', '874567890')
ORDER BY created_at DESC;

-- Mostrar resumo
SELECT 
    COUNT(*) FILTER (WHERE is_admin = true) as total_admins,
    COUNT(*) FILTER (WHERE is_admin = false) as total_utilizadores_normais,
    COUNT(*) as total_utilizadores
FROM users;
