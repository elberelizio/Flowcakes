-- Canal escolhido na simulação de pagamento de licença (mpesa | emola). Opcional; só preenchido em modo simulação.
-- Executar uma vez; se a coluna já existir, ignorar o erro ou usar ddl-auto no JPA.
ALTER TABLE mpesa_payments ADD COLUMN simulation_channel VARCHAR(20);
