-- Caixa de manutenção da plataforma (tesouraria admin)
INSERT INTO platform_admin_settings (setting_key, setting_value) VALUES
    ('maintenance_cash_balance', '0'),
    ('maintenance_cash_target', '5000')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON COLUMN platform_admin_settings.setting_value IS 'Valores de configuração; maintenance_cash_* em MZN.';
