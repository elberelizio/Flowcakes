-- Chef Control — script mother (PostgreSQL)
--
-- Prerequisites:
--   1. Database exists (see 00_create_database.sql)
--   2. Run connected to that database, e.g.:
--        psql -U postgres -d chefcontrol2025 -f scripts/script-mother.sql
--
-- Uses \ir so paths are relative to this file's directory.
-- Stops on first error.

\set ON_ERROR_STOP on
\timing on

\echo '========================================'
\echo ' Chef Control — script mother'
\echo '========================================'

\echo '>> 01_schema.sql'
\ir 01_schema.sql

\echo '>> 02_add_is_admin_and_admin_user.sql'
\ir 02_add_is_admin_and_admin_user.sql

\echo '>> 03_create_orders_table.sql'
\ir 03_create_orders_table.sql

\echo '>> 04_migrations_alteracoes_tabelas.sql'
\ir 04_migrations_alteracoes_tabelas.sql

\echo '>> 05_license_transactions.sql'
\ir 05_license_transactions.sql

\echo '>> 06_reminders.sql'
\ir 06_reminders.sql

\echo '>> 07_withdrawals.sql'
\ir 07_withdrawals.sql

\echo '>> 08_access_logs.sql'
\ir 08_access_logs.sql

\echo '>> 09_system_notifications.sql'
\ir 09_system_notifications.sql

\echo '>> 10_user_feedback.sql'
\ir 10_user_feedback.sql

\echo '>> 11_phone_change_requests.sql'
\ir 11_phone_change_requests.sql

\echo '>> 13_user_store_settings.sql'
\ir 13_user_store_settings.sql

\echo '>> 14_store_settings_more_fields.sql'
\ir 14_store_settings_more_fields.sql

\echo '>> 15_license_payment_columns.sql'
\ir 15_license_payment_columns.sql

\echo '>> 16_mpesa_payments_table.sql'
\ir 16_mpesa_payments_table.sql

\echo '>> 17_drop_legacy_orders_tables.sql'
\ir 17_drop_legacy_orders_tables.sql

\echo '>> 18_mpesa_simulation_channel.sql'
\ir 18_mpesa_simulation_channel.sql

\echo '>> 19_trial_license_status.sql'
\ir 19_trial_license_status.sql

\echo '>> 20_reminders_notify_days_before.sql'
\ir 20_reminders_notify_days_before.sql

\echo '>> 21_landing_suggestions.sql'
\ir 21_landing_suggestions.sql

\echo '>> 22_security_access.sql'
\ir 22_security_access.sql

\echo '>> 23_operational_expenses.sql'
\ir 23_operational_expenses.sql

\echo '>> 24_fix_nullable_columns.sql'
\ir 24_fix_nullable_columns.sql

\echo '>> 25_order_closure.sql'
\ir 25_order_closure.sql

\echo '>> 26_fix_cancelled_charged.sql'
\ir 26_fix_cancelled_charged.sql

\echo '>> 27_system_notifications_maintenance.sql'
\ir 27_system_notifications_maintenance.sql

\echo '>> 28_notification_audience.sql'
\ir 28_notification_audience.sql

\echo '>> 29_user_onboarding.sql'
\ir 29_user_onboarding.sql

\echo '>> 30_treasury_cash_reserve.sql'
\ir 30_treasury_cash_reserve.sql

\echo '>> 31_treasury_platform.sql'
\ir 31_treasury_platform.sql

\echo '>> 32_user_activity.sql'
\ir 32_user_activity.sql

\echo '>> 33_user_feedback_would_recommend.sql'
\ir 33_user_feedback_would_recommend.sql

\echo '========================================'
\echo ' Script mother finished successfully.'
\echo '========================================'
