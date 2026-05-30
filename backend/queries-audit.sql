-- 1. Resumo geral de todos os drops com valores calculados vs armazenados
SELECT 
    d.id AS drop_id,
    d.title,
    d.type,
    d.drop_date,
    d.total_value AS total_stored,
    COUNT(di.id) AS item_count,
    STRING_AGG(
        di.item_name || ': ' || di.quantity || ' x ' || di.unit_value || ' = ' || di.total_value, 
        ' | '
        ORDER BY di.id
    ) AS items_breakdown,
    d.notes,
    d.created_at
FROM drops d
LEFT JOIN drop_items di ON d.id = di.drop_id
GROUP BY d.id, d.title, d.type, d.drop_date, d.total_value, d.notes, d.created_at
ORDER BY d.created_at DESC;

-- 2. Todos os drop_items com valores individuais (para verificar cálculos)
SELECT 
    di.id AS item_id,
    di.drop_id,
    d.title AS drop_title,
    di.item_name,
    di.quantity,
    di.unit_value,
    di.total_value AS total_stored,
    (di.quantity * di.unit_value) AS total_calculated,
    CASE 
        WHEN di.total_value != (di.quantity * di.unit_value) THEN 'INCONSISTENTE'
        ELSE 'OK'
    END AS check_status
FROM drop_items di
JOIN drops d ON di.drop_id = d.id
ORDER BY d.created_at DESC, di.id;

-- 3. Audit logs relacionados a drops (criação, edição, deleção)
SELECT 
    al.id AS audit_id,
    al.action,
    al.entity,
    al.entity_id AS drop_id,
    u.name AS user_name,
    u.email,
    al.changes,
    al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.entity = 'Drop'
ORDER BY al.created_at DESC;

-- 4. Audit logs específicos de alterações em valores (se houver)
SELECT 
    al.id AS audit_id,
    al.action,
    al.entity,
    al.entity_id,
    u.name AS user_name,
    al.changes,
    al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.changes::text LIKE '%totalValue%' 
   OR al.changes::text LIKE '%unitValue%'
   OR al.changes::text LIKE '%total_value%'
   OR al.changes::text LIKE '%unit_value%'
ORDER BY al.created_at DESC;

-- 5. Participantes dos drops com split value (para verificar divisões)
SELECT 
    d.id AS drop_id,
    d.title,
    d.total_value,
    COUNT(dp.id) AS participant_count,
    d.total_value / NULLIF(COUNT(dp.id), 0) AS split_calculated,
    STRING_AGG(u.name || ' (' || dp.payment_status || ')', ', ') AS participants
FROM drops d
LEFT JOIN drop_participants dp ON d.id = dp.drop_id
LEFT JOIN users u ON dp.user_id = u.id
GROUP BY d.id, d.title, d.total_value
ORDER BY d.created_at DESC;

-- 6. Drops com valores suspeitos (muito altos, negativos, ou zero)
SELECT 
    id,
    title,
    type,
    total_value,
    drop_date,
    notes,
    created_at,
    CASE 
        WHEN total_value < 0 THEN 'VALOR_NEGATIVO'
        WHEN total_value = 0 THEN 'VALOR_ZERO'
        WHEN total_value > 10000000000 THEN 'VALOR_MUITO_ALTO'
        ELSE 'NORMAL'
    END AS value_status
FROM drops
ORDER BY total_value DESC;
