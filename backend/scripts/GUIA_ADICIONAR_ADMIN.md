# Guia: Como Adicionar Novo Utilizador Administrador

Este guia explica como criar um novo utilizador com as mesmas permissões do primeiro administrador (telefone: 871964887).

## O que significa "mesmas permissões"?

O primeiro administrador tem:
- `is_admin = true` na tabela `users`
- **Não precisa de licença** (pode acessar o sistema sem pagar)
- Pode acessar endpoints de administração (`/api/admin/*`)

## Formas de Adicionar Novo Admin

### **Método 1: Via Script SQL (Recomendado)**

#### Passo 1: Abrir o script de exemplo
Abra o ficheiro `EXEMPLO_ADICIONAR_ADMIN.sql` e ajuste os valores:

```sql
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    '871234567',        -- ALTERE: número de telefone
    'admin123',         -- ALTERE: senha
    'Maria Santos',     -- ALTERE: nome completo
    true,               -- is_admin = true (OBRIGATÓRIO)
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871234567');
```

#### Passo 2: Executar no PostgreSQL

**Opção A - Via linha de comando:**
```bash
psql -U postgres -d chefcontrol2025 -f scripts/EXEMPLO_ADICIONAR_ADMIN.sql
```

**Opção B - Via pgAdmin ou DBeaver:**
1. Conecte-se à base `chefcontrol2025`
2. Abra o ficheiro `EXEMPLO_ADICIONAR_ADMIN.sql`
3. Ajuste os valores (telefone, senha, nome)
4. Execute o script

**Opção C - Via psql interativo:**
```bash
psql -U postgres -d chefcontrol2025
```
Depois cole e execute o SQL ajustado.

---

### **Método 2: Via SQL Direto (Rápido)**

Conecte-se ao PostgreSQL e execute:

```sql
-- Substitua os valores abaixo:
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'SEU_TELEFONE',      -- Ex: '871234567'
    'SUA_SENHA',         -- Ex: 'minhasenha123'
    'SEU_NOME',          -- Ex: 'João Silva'
    true,                -- OBRIGATÓRIO: true para ser admin
    NOW(),
    NOW()
);
```

---

### **Método 3: Atualizar Utilizador Existente para Admin**

Se o utilizador já existe (foi criado via registo normal), apenas atualize:

```sql
UPDATE users
SET is_admin = true,
    updated_at = NOW()
WHERE phone = 'TELEFONE_DO_UTILIZADOR';  -- Ex: '871234567'
```

---

## Verificar se Funcionou

Execute esta query para verificar:

```sql
SELECT id, phone, full_name, is_admin, created_at 
FROM users 
WHERE phone = 'SEU_TELEFONE';  -- Substitua pelo telefone
```

Deve mostrar `is_admin = true`.

---

## Testar o Login

1. Acesse o frontend ou use Postman/Insomnia
2. Faça login com:
   - **Telefone:** o número que você definiu
   - **Senha:** a senha que você definiu
3. O novo admin deve conseguir acessar sem precisar de licença

---

## Notas Importantes

⚠️ **Senha:** No código atual, a senha é armazenada em texto plano (não é hash). Isso pode mudar no futuro.

⚠️ **Telefone único:** Cada telefone só pode ter uma conta. Se tentar criar um admin com telefone que já existe, o script não fará nada (por causa do `WHERE NOT EXISTS`).

⚠️ **Licença:** Administradores (`is_admin = true`) **não precisam** de licença. O sistema trata automaticamente como se tivessem licença paga.

---

## Exemplo Completo

```sql
-- Criar admin: telefone 871999888, senha "admin2025", nome "Carlos Mendes"
INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    '871999888',
    'admin2025',
    'Carlos Mendes',
    true,
    NOW(), 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '871999888');

-- Verificar
SELECT phone, full_name, is_admin FROM users WHERE phone = '871999888';
```

Resultado esperado:
```
phone     | full_name    | is_admin
----------|--------------|----------
871999888 | Carlos Mendes| true
```
