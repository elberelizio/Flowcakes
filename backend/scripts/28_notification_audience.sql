-- Separa avisos aos utilizadores (manutenção) de alertas internos ao admin (pagamentos, etc.)

ALTER TABLE system_notifications
    ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'users';

COMMENT ON COLUMN system_notifications.audience IS 'users = aviso aos clientes; admins = alerta interno (pagamentos simulados, operações)';

-- Alertas automáticos do sistema (sem created_by) são só para administradores
UPDATE system_notifications
SET audience = 'admins'
WHERE created_by IS NULL;
