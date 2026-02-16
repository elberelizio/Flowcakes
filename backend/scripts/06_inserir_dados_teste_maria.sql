-- Script para inserir dados de teste de encomendas concluídas da Maria
-- Para visualizar o gráfico de Lucro vs Despesa com dados históricos
-- Executa inserções de encomendas nos últimos 30 dias

-- Primeiro, vamos garantir que a Maria existe e obter seu ID
DO $$
DECLARE
    maria_user_id UUID;
    order_date DATE;
    i INTEGER;
    value_charged NUMERIC;
    value_paid NUMERIC;
    cost_total NUMERIC;
    profit NUMERIC;
    delivery_cost NUMERIC;
    has_delivery BOOLEAN;
    var_expenses_json JSONB;
BEGIN
    -- Buscar ou criar usuário Maria
    SELECT id INTO maria_user_id
    FROM users
    WHERE phone = '871234567'
    LIMIT 1;

    -- Se não existir, criar
    IF maria_user_id IS NULL THEN
        INSERT INTO users (id, phone, password_hash, full_name, is_admin, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            '871234567',
            'maria123', -- Senha simples para teste
            'Maria Silva',
            false,
            NOW(),
            NOW()
        )
        RETURNING id INTO maria_user_id;
        
        RAISE NOTICE 'Usuário Maria criado com ID: %', maria_user_id;
    ELSE
        RAISE NOTICE 'Usuário Maria encontrado com ID: %', maria_user_id;
    END IF;

    -- Limpar encomendas antigas de teste da Maria (opcional - comentar se quiser manter dados anteriores)
    -- DELETE FROM orders WHERE user_id = maria_user_id AND client_name LIKE 'Cliente Teste%';

    -- Inserir 60 encomendas distribuídas nos últimos 30 dias
    -- Vamos criar dados variados para tornar o gráfico interessante
    FOR i IN 1..60 LOOP
        -- Data aleatória nos últimos 30 dias
        order_date := CURRENT_DATE - (RANDOM() * 30)::INTEGER;
        
        -- Valores variados para tornar o gráfico interessante
        -- Valor cobrado entre 500 e 3000 MZN
        value_charged := 500 + (RANDOM() * 2500)::NUMERIC;
        
        -- Delivery aleatório (30% das encomendas têm delivery)
        has_delivery := (RANDOM() < 0.3);
        delivery_cost := CASE WHEN has_delivery THEN 50 + (RANDOM() * 100)::NUMERIC ELSE 0 END;
        
        -- Custo total (ingredientes + energia + delivery)
        -- Custo base entre 200 e 1500 MZN
        cost_total := 200 + (RANDOM() * 1300)::NUMERIC + delivery_cost;
        
        -- Garantir que o valor cobrado seja maior que o custo total
        IF value_charged <= cost_total THEN
            value_charged := cost_total + 100 + (RANDOM() * 500)::NUMERIC;
        END IF;
        
        -- Valor pago (todas as encomendas estão pagas pois são concluídas)
        value_paid := value_charged;
        
        -- Lucro = valor cobrado - custo total
        profit := value_charged - cost_total;
        
        -- Despesas variáveis (algumas encomendas têm despesas adicionais)
        -- 20% das encomendas têm despesas variáveis além do delivery
        IF RANDOM() < 0.2 THEN
            var_expenses_json := jsonb_build_array(
                jsonb_build_object('name', 'Delivery', 'amount', delivery_cost),
                jsonb_build_object('name', CASE 
                    WHEN RANDOM() < 0.5 THEN 'Spray'
                    WHEN RANDOM() < 0.7 THEN 'Embalagem especial'
                    ELSE 'Material extra'
                END, 'amount', 20 + (RANDOM() * 80)::NUMERIC)
            );
            -- Atualizar cost_total para incluir despesas variáveis
            cost_total := cost_total + (var_expenses_json->1->>'amount')::NUMERIC;
            profit := value_charged - cost_total;
        ELSIF has_delivery THEN
            var_expenses_json := jsonb_build_array(
                jsonb_build_object('name', 'Delivery', 'amount', delivery_cost)
            );
        ELSE
            var_expenses_json := '[]'::jsonb;
        END IF;
        
        -- Inserir encomenda
        INSERT INTO orders (
            id,
            created_at,
            client_name,
            category,
            subcategory,
            product_name,
            size,
            quantity_kg,
            units_per_kg,
            value_charged,
            value_paid,
            cost_total,
            profit,
            payment_status,
            delivered,
            observations,
            delivery_date,
            has_delivery,
            delivery_cost,
            order_status,
            is_cancelled,
            variable_expenses,
            user_id
        ) VALUES (
            gen_random_uuid(),
            order_date::TIMESTAMP + (RANDOM() * INTERVAL '1 day'),
            'Cliente Teste ' || LPAD(i::TEXT, 3, '0'),
            CASE WHEN RANDOM() < 0.6 THEN 'doces' ELSE 'salgados' END,
            CASE 
                WHEN RANDOM() < 0.3 THEN 'bolos'
                WHEN RANDOM() < 0.5 THEN 'tortas'
                WHEN RANDOM() < 0.7 THEN 'cupcakes'
                WHEN RANDOM() < 0.85 THEN 'coxinhas'
                ELSE 'rissóis'
            END,
            CASE 
                WHEN RANDOM() < 0.3 THEN 'Bolo de Chocolate'
                WHEN RANDOM() < 0.5 THEN 'Bolo de Aniversário'
                WHEN RANDOM() < 0.7 THEN 'Torta de Frango'
                ELSE 'Coxinha de Frango'
            END,
            CASE WHEN RANDOM() < 0.5 THEN 'Grande' ELSE 'Médio' END,
            CASE WHEN RANDOM() < 0.5 THEN NULL ELSE 2 + (RANDOM() * 5)::NUMERIC END,
            CASE WHEN RANDOM() < 0.5 THEN NULL ELSE 10 + (RANDOM() * 20)::INTEGER END,
            value_charged,
            value_paid,
            cost_total,
            profit,
            'pago',
            true, -- Todas entregues
            'Encomenda de teste gerada automaticamente',
            order_date + (1 + (RANDOM() * 2)::INTEGER), -- Entrega 1-3 dias após criação
            has_delivery,
            delivery_cost,
            'completed', -- Todas concluídas
            false,
            var_expenses_json,
            maria_user_id
        );
        
        -- Log a cada 10 encomendas
        IF i % 10 = 0 THEN
            RAISE NOTICE 'Inseridas % encomendas...', i;
        END IF;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE '  DADOS DE TESTE INSERIDOS COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de encomendas inseridas: 60';
    RAISE NOTICE 'Período: últimos 30 dias';
    RAISE NOTICE 'Status: Todas concluídas e pagas';
    RAISE NOTICE 'Usuário: Maria Silva (ID: %)', maria_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Agora pode visualizar o gráfico de Lucro vs Despesa!';
END $$;

-- Verificar estatísticas
SELECT 
    COUNT(*) as total_encomendas,
    SUM(value_charged) as total_arrecadado,
    SUM(cost_total) as total_despesas,
    SUM(profit) as total_lucro,
    MIN(created_at::DATE) as primeira_data,
    MAX(created_at::DATE) as ultima_data
FROM orders
WHERE user_id = (SELECT id FROM users WHERE phone = '871234567' LIMIT 1)
AND client_name LIKE 'Cliente Teste%';
