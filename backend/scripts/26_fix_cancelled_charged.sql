-- Corrige encomendas canceladas com devolução onde value_charged ficou o preço original
-- (gerava dívida fantasma: ex. cobrado 1500, pago 0 após devolver 450 de adiantamento).

UPDATE orders o
SET closure_note = CASE
        WHEN o.closure_note IS NULL OR o.closure_note NOT ILIKE '%Valor acordado antes do cancelamento:%'
        THEN trim(both FROM coalesce(o.closure_note || ' ', '')
            || 'Valor acordado antes do cancelamento: '
            || trim(to_char(o.value_charged, 'FM999999990.00'))
            || ' MZN.')
        ELSE o.closure_note
    END,
    value_charged = coalesce(o.value_paid, 0),
    payment_status = 'pago'
WHERE o.is_cancelled = true
  AND coalesce(o.refund_amount, 0) > 0
  AND o.value_charged > coalesce(o.value_paid, 0);
