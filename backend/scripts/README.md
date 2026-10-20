# Database scripts

## Quick start

### 1. Create the database (once, as superuser)

```bash
psql -U postgres -c "CREATE DATABASE chefcontrol2025;"
```

Or follow `00_create_database.sql`.

### 2. Run all schema migrations (script mother)

```bash
psql -U postgres -d chefcontrol2025 -f backend/scripts/script-mother.sql
```

### 3. Optional seeds (manual)

Templates and demo users — **not** part of the script mother:

```bash
psql -U postgres -d chefcontrol2025 -f backend/scripts/run-optional-seeds.sql
```

Edit `12_add_new_admin_user.sql`, `CRIAR_USUARIO_NORMAL.sql`, and `CRIAR_MULTIPLOS_USUARIOS_NORMAIS.sql` before running.

---

## Files

| File | Purpose |
|------|---------|
| `script-mother.sql` | **Script mother** — runs migrations `01`–`33` in order (`\ir`) |
| `run-optional-seeds.sql` | Optional data scripts (excluded from script mother) |
| `00_create_database.sql` | Instructions to create DB (not included in script mother) |
| `01` … `33_*.sql` | Individual migrations (idempotent where possible) |

## Migration order (included in script mother)

1. `01_schema.sql` — users, licenses  
2. `02_add_is_admin_and_admin_user.sql` — admin flag + default admin  
3. `03_create_orders_table.sql` — orders  
4. `04` … `33` — incremental features (notifications, treasury, activity, feedback, etc.)

Skipped in script mother (run manually if needed):

- `00_create_database.sql`
- `12_add_new_admin_user.sql` (template)
- `CRIAR_USUARIO_NORMAL.sql`
- `CRIAR_MULTIPLOS_USUARIOS_NORMAIS.sql`

After script mother, also run (in order):

- `34_mpesa_payment_rejection.sql`
- `35_mpesa_payment_operator_ref.sql`
- `36_license_transaction_receipt.sql`
- `37_license_transaction_valid_until_backfill.sql`
- `38_password_reset_otps.sql`
- `39_contact_messages.sql`

Or use `migrate_supabase.py schema` (applies mother + 34–39 automatically).

---

## Migração para novo projecto Supabase

1. Criar projecto no Supabase (nova conta). Anotar **project ref**, senha e região do pooler.
2. Copiar `backend/supabase.new.env.example` → `backend/supabase.new.env` e preencher credenciais.
3. Ver dados actuais: `python backend/scripts/migrate_supabase.py counts --env backend/supabase.local.env`
4. Esquema na base nova: `python backend/scripts/migrate_supabase.py schema --target backend/supabase.new.env`
5. Copiar dados: `python backend/scripts/migrate_supabase.py data --source backend/supabase.local.env --target backend/supabase.new.env`
6. Verificar: `python backend/scripts/migrate_supabase.py verify --source backend/supabase.local.env --target backend/supabase.new.env`
7. Variáveis Railway: `python backend/scripts/migrate_supabase.py railway-env --env backend/supabase.new.env`
8. Actualizar Railway com as novas variáveis; testar `https://flowcakes.vercel.app/api/public/health`.
9. Renomear `supabase.new.env` → `supabase.local.env` (ou actualizar o existente).

**Nota:** Supabase usa a base `postgres` (não é preciso `CREATE DATABASE`). O `script-mother.sql` usa `\ir` — o script Python usa `psql` ou Docker (`postgres:16-alpine`) automaticamente.
