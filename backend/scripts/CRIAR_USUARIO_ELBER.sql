-- Criar utilizador administrador: Elber
-- Telefone: 844179584
-- Senha: elber123

INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    '844179584',
    'elber123',
    'Elber',
    true,
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '844179584');

-- Verificar se foi criado
SELECT id, phone, full_name, is_admin, created_at 
FROM users 
WHERE phone = '844179584';
