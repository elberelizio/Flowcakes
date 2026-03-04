-- Consulta de dados de lucros

-- Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%order%' OR table_name LIKE '%profit%' OR table_name LIKE '%lucro%')
ORDER BY table_name;

-- Consultar lucros da tabela orders (se existir)
SELECT 
    id,
    client_name,
    category,
    subcategory,
    product_name,
    value_charged,
    value_paid,
    cost_total,
    profit,
    payment_status,
    delivered,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 50;

-- Resumo de lucros por categoria
SELECT 
    category,
    COUNT(*) as total_pedidos,
    SUM(profit) as lucro_total,
    AVG(profit) as lucro_medio,
    SUM(value_charged) as receita_total,
    SUM(value_paid) as recebido_total
FROM orders
GROUP BY category
ORDER BY lucro_total DESC;

-- Lucros por mês
SELECT 
    TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS mes,
    COUNT(*) as total_pedidos,
    SUM(profit) as lucro_total,
    SUM(value_charged) as receita_total,
    SUM(value_paid) as recebido_total
FROM orders
GROUP BY date_trunc('month', created_at)
ORDER BY mes DESC
LIMIT 12;

-- Top 10 pedidos com maior lucro
SELECT 
    id,
    client_name,
    category,
    product_name,
    profit,
    value_charged,
    created_at
FROM orders
ORDER BY profit DESC
LIMIT 10;
