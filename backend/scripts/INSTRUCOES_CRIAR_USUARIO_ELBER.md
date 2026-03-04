# Instruções: Criar Utilizador Elber (Admin)

## Credenciais
- **Telefone:** 844179584
- **Senha:** elber123
- **Nome:** Elber
- **Permissões:** Administrador (is_admin = true)

## Como Executar

### Opção 1: Via pgAdmin ou DBeaver (Mais Fácil)

1. Abra o **pgAdmin** ou **DBeaver**
2. Conecte-se à base de dados `chefcontrol2025`
3. Abra uma nova query/consulta SQL
4. Cole e execute este código:

```sql
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
```

5. Execute o script (F5 ou botão "Execute")
6. Deve aparecer uma linha com `is_admin = true`

---

### Opção 2: Via Linha de Comando (se psql estiver instalado)

Se o PostgreSQL estiver instalado e o `psql` estiver no PATH:

```bash
psql -U postgres -d chefcontrol2025 -f CRIAR_USUARIO_ELBER.sql
```

Ou se precisar da senha:

```bash
set PGPASSWORD=admin
psql -U postgres -d chefcontrol2025 -f CRIAR_USUARIO_ELBER.sql
```

---

### Opção 3: Via PowerShell (se encontrar o psql)

Primeiro, encontre onde está o PostgreSQL instalado (geralmente em `C:\Program Files\PostgreSQL\XX\bin\`):

```powershell
# Exemplo: se PostgreSQL 15 estiver em C:\Program Files\PostgreSQL\15\bin\
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
$env:PGPASSWORD = "admin"
Get-Content "CRIAR_USUARIO_ELBER.sql" | psql -U postgres -d chefcontrol2025
```

---

## Verificar se Funcionou

Execute esta query:

```sql
SELECT phone, full_name, is_admin, created_at 
FROM users 
WHERE phone = '844179584';
```

**Resultado esperado:**
```
phone     | full_name | is_admin | created_at
----------|-----------|----------|-------------------
844179584 | Elber     | true     | 2025-01-XX XX:XX:XX
```

---

## Testar o Login

1. Acesse o frontend do sistema
2. Faça login com:
   - **Telefone:** 844179584
   - **Senha:** elber123
3. Deve conseguir acessar o dashboard sem precisar de licença (porque é admin)

---

## Nota Importante

Se o utilizador já existir (foi criado via registo normal), você pode apenas atualizar para admin:

```sql
UPDATE users
SET is_admin = true,
    updated_at = NOW()
WHERE phone = '844179584';
```
