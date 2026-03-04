-- ============================================
-- EXEMPLO PRÁTICO: Adicionar novo administrador
-- ============================================
-- Este é um exemplo concreto. Ajuste os valores conforme necessário.
-- Execute este script no PostgreSQL conectado à base chefcontrol2025

-- Exemplo: Criar admin com telefone 871234567, senha "admin123", nome "Maria Santos"
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    '871234567',                    -- Número de telefone do novo admin
    'admin123',                     -- Senha do novo admin
    'Maria Santos',                 -- Nome completo
    true,                           -- is_admin = true (mesmas permissões do primeiro)
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871234567');

-- Verificar se foi criado
SELECT id, phone, full_name, is_admin, created_at 
FROM users 
WHERE phone = '871234567';

-- ============================================
-- Para usar com outros dados, substitua:
-- - '871234567' pelo telefone desejado
-- - 'admin123' pela senha desejada
-- - 'Maria Santos' pelo nome desejado
-- ============================================
