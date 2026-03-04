# Guia Completo de Setup da Base de Dados - Chef Control

Este guia contém todas as instruções necessárias para configurar a base de dados do sistema Chef Control do zero.

## 📋 Pré-requisitos

- PostgreSQL 14 ou 15 instalado e em execução
- Acesso ao PostgreSQL como superuser (postgres)
- Terminal/Command Prompt ou PowerShell

## 🗄️ Ordem de Execução dos Scripts

### Passo 1: Criar a Base de Dados

```bash
psql -U postgres -c "CREATE DATABASE chefcontrol2025;"
```

Ou manualmente no psql:
```sql
CREATE DATABASE chefcontrol2025;
```

### Passo 2: Executar Scripts na Ordem Correta

**IMPORTANTE:** Execute os scripts na ordem abaixo para evitar erros de dependências.

#### 2.1. Schema Base (Obrigatório)

```bash
psql -U postgres -d chefcontrol2025 -f scripts/01_schema.sql
```

Este script cria:
- Tabela `users` (utilizadores/login)
- Tabela `user_licenses` (licenças de pagamento)
- Tabela `orders_doces` (pedidos de doces)
- Tabela `orders_salgados` (pedidos de salgados)
- Tabela `ingredientes` (ingredientes)

#### 2.2. Adicionar Campo is_admin e Criar Admin (Obrigatório)

```bash
psql -U postgres -d chefcontrol2025 -f scripts/03_add_is_admin_and_admin_user.sql
```

Este script:
- Adiciona a coluna `is_admin` na tabela `users`
- Cria o utilizador administrador com telefone `871964887`
- **Obrigatório** para que o login com admin não peça licença

#### 2.3. Adicionar Tabela Unificada de Pedidos (Obrigatório)

```bash
psql -U postgres -d chefcontrol2025 -f scripts/create_orders_table.sql
```

Este script cria:
- Tabela `orders` (unifica doces e salgados)
- Tabela `order_ingredient_ids` (relação de ingredientes)

#### 2.4. Adicionar Data de Entrega e Transporte (Obrigatório)

```bash
psql -U postgres -d chefcontrol2025 -f scripts/04_add_delivery_date_and_transport.sql
```

Este script adiciona:
- Campo `delivery_date` (data de entrega)
- Campo `has_delivery` (se tem transporte)
- Campo `delivery_cost` (custo de transporte)
- Campo `order_status` (estado do pedido)
- Campo `is_cancelled` (se foi cancelado)

#### 2.5. Adicionar Despesas Variáveis (Obrigatório)

```bash
psql -U postgres -d chefcontrol2025 -f scripts/05_add_variable_expenses.sql
```

Este script adiciona:
- Campo `variable_expenses` (JSONB) para despesas variáveis

#### 2.6. Scripts Opcionais (Conforme Necessidade)

**Licenças e Transações:**
```bash
psql -U postgres -d chefcontrol2025 -f scripts/02_licenses.sql
psql -U postgres -d chefcontrol2025 -f scripts/04_license_transactions.sql
psql -U postgres -d chefcontrol2025 -f scripts/05_license_validity.sql
psql -U postgres -d chefcontrol2025 -f scripts/06_activation_token.sql
```

**Criar Utilizadores:**
```bash
# Criar utilizador Elber
psql -U postgres -d chefcontrol2025 -f scripts/CRIAR_USUARIO_ELBER.sql

# Criar utilizador normal
psql -U postgres -d chefcontrol2025 -f scripts/CRIAR_USUARIO_NORMAL.sql

# Criar múltiplos utilizadores
psql -U postgres -d chefcontrol2025 -f scripts/CRIAR_MULTIPLOS_USUARIOS_NORMAIS.sql
```

**Dados de Teste:**
```bash
psql -U postgres -d chefcontrol2025 -f scripts/06_inserir_dados_teste_maria.sql
```

## 🚀 Setup Automático (Alternativa)

Se preferir usar o JPA/Hibernate para criar as tabelas automaticamente:

1. Configure o `application.yml` com as credenciais corretas
2. O Hibernate criará/atualizará as tabelas automaticamente com `spring.jpa.hibernate.ddl-auto: update`
3. **Ainda assim, execute o script 03_add_is_admin_and_admin_user.sql** para criar o admin

## ✅ Verificação

Após executar os scripts, verifique se as tabelas foram criadas:

```sql
\c chefcontrol2025
\dt
```

Deve ver as seguintes tabelas:
- users
- user_licenses
- orders
- orders_doces (se usar schema antigo)
- orders_salgados (se usar schema antigo)
- order_ingredient_ids
- ingredientes

## 📝 Notas Importantes

1. **Admin:** O utilizador com telefone `871964887` deve ter `is_admin = true` para acessar o painel administrativo sem licença.

2. **Licenças:** Todos os utilizadores normais precisam pagar 500 MZN via e-Mola (número 871964887) para ativar a conta.

3. **Ordem dos Scripts:** Respeite a ordem de execução para evitar erros de dependências.

4. **Backup:** Sempre faça backup da base de dados antes de executar scripts de alteração em produção.

## 🔧 Troubleshooting

**Erro: "relation already exists"**
- As tabelas já existem. Use `DROP TABLE` se necessário ou ignore o erro se usar `IF NOT EXISTS`.

**Erro: "column already exists"**
- A coluna já foi adicionada. Os scripts usam `IF NOT EXISTS` para evitar este erro.

**Erro: "permission denied"**
- Certifique-se de estar conectado como superuser (postgres) ou com permissões adequadas.

## 📚 Scripts Disponíveis

Todos os scripts estão na pasta `backend/scripts/`:

- `00_create_database.sql` - Instruções para criar a base
- `01_schema.sql` - Schema completo (tabelas base)
- `01_users.sql` - Tabela de utilizadores (alternativa)
- `02_licenses.sql` - Tabela de licenças (alternativa)
- `03_add_is_admin_and_admin_user.sql` - **OBRIGATÓRIO** - Admin
- `04_add_delivery_date_and_transport.sql` - **OBRIGATÓRIO** - Entrega
- `04_license_transactions.sql` - Transações de licença
- `05_add_variable_expenses.sql` - **OBRIGATÓRIO** - Despesas variáveis
- `05_license_validity.sql` - Validade de licenças
- `05_add_new_admin_user.sql` - Adicionar novo admin
- `06_activation_token.sql` - Token de ativação
- `create_orders_table.sql` - **OBRIGATÓRIO** - Tabela unificada
- Scripts de criação de utilizadores (opcionais)
- Scripts de dados de teste (opcionais)

---

**Última atualização:** 2025-02-11
**Versão do sistema:** Chef Control v1.0
