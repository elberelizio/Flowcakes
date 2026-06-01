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
