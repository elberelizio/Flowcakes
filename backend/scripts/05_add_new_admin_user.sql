-- Chef Control - Adicionar novo utilizador administrador
-- Executar na base chefcontrol2025
-- Este script permite criar um novo utilizador com as mesmas permissões de administrador
-- (is_admin = true, não precisa de licença)

-- ============================================
-- INSTRUÇÕES:
-- 1. Substitua 'NOVO_TELEFONE' pelo número de telefone do novo admin
-- 2. Substitua 'NOVA_SENHA' pela senha desejada
-- 3. Substitua 'Nome do Novo Admin' pelo nome completo
-- 4. Execute este script no PostgreSQL
-- ============================================

-- Exemplo prático (descomente e ajuste os valores):
/*
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    '871234567',                    -- Número de telefone do novo admin
    'minhasenha123',                -- Senha do novo admin
    'João Silva',                   -- Nome completo
    true,                           -- is_admin = true (mesmas permissões do primeiro)
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871234567');
*/

-- ============================================
-- SCRIPT GENÉRICO (substitua os valores):
-- ============================================

-- Opção 1: Criar novo admin diretamente (se ainda não existe)
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    'NOVO_TELEFONE',           -- ALTERE: número de telefone (ex: '871234567')
    'NOVA_SENHA',              -- ALTERE: senha (ex: 'minhasenha123')
    'Nome do Novo Admin',      -- ALTERE: nome completo (ex: 'João Silva')
    true,                      -- is_admin = true (mesmas permissões do primeiro admin)
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = 'NOVO_TELEFONE');

-- Opção 2: Se o utilizador já existe, apenas atualizar para admin
UPDATE users
SET is_admin = true,
    updated_at = NOW()
WHERE phone = 'NOVO_TELEFONE'  -- ALTERE: número de telefone
  AND is_admin = false;

-- Verificar se foi criado/atualizado corretamente
SELECT id, phone, full_name, is_admin, created_at 
FROM users 
WHERE phone = 'NOVO_TELEFONE';  -- ALTERE: número de telefone
