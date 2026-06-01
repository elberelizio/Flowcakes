-- Chef Control — optional data / manual setup (NOT run by script-mother.sql)
--
-- Run only when you need sample users or a new admin from the template:
--   psql -U postgres -d chefcontrol2025 -f scripts/run-optional-seeds.sql
--
-- Edit each file before running (phones, passwords, placeholders).

\set ON_ERROR_STOP on

\echo '========================================'
\echo ' Optional seeds (manual review required)'
\echo '========================================'

\echo '>> 12_add_new_admin_user.sql (template — edit before use)'
\ir 12_add_new_admin_user.sql

\echo '>> CRIAR_USUARIO_NORMAL.sql'
\ir CRIAR_USUARIO_NORMAL.sql

\echo '>> CRIAR_MULTIPLOS_USUARIOS_NORMAIS.sql'
\ir CRIAR_MULTIPLOS_USUARIOS_NORMAIS.sql

\echo '========================================'
\echo ' Optional seeds finished.'
\echo '========================================'
