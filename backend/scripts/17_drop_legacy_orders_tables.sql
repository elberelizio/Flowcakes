-- =============================================================================
-- Chef Control — Remover tabelas LEGADAS do modelo antigo (doces / salgados
-- separados). O backend actual usa apenas: orders + order_ingredient_ids.
--
-- ANTES DE EXECUTAR:
-- 1) Faça backup completo da base (pg_dump).
-- 2) Confirme que os dados importantes já foram migrados para `orders` (se
--    ainda existirem linhas só nestas tabelas, NÃO execute este script).
-- 3) Verifique contagens:
--    SELECT COUNT(*) FROM orders_doces;
--    SELECT COUNT(*) FROM orders_salgados;
-- =============================================================================

-- Filhas primeiro (FK para orders_doces / orders_salgados)
DROP TABLE IF EXISTS order_doces_ingredient_ids CASCADE;
DROP TABLE IF EXISTS order_salgados_ingredient_ids CASCADE;

-- Tabelas de encomendas antigas
DROP TABLE IF EXISTS orders_doces CASCADE;
DROP TABLE IF EXISTS orders_salgados CASCADE;

-- =============================================================================
-- Tabelas da sua lista que deve MANTER (em uso pelo JPA / scripts actuais):
--   access_logs, license_transactions, mpesa_payments, order_ingredient_ids,
--   orders, phone_change_requests, reminders, system_notifications,
--   user_feedback, user_licenses, user_store_settings, users, withdrawals
-- =============================================================================
