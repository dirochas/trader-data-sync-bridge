
-- Verificar o estado atual do RLS na tabela hedge_simulations
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'hedge_simulations';

-- Verificar todas as políticas RLS existentes para hedge_simulations
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'hedge_simulations'
ORDER BY policyname;

-- Testar se auth.uid() está funcionando corretamente
SELECT 
    'Current user ID: ' || COALESCE(auth.uid()::text, 'NULL') as debug_info;

-- Verificar dados atuais e associações de usuário
SELECT 
    hs.id,
    hs.simulation_name,
    hs.user_id,
    hs.created_at,
    p.email as user_email,
    p.role as user_role,
    CASE 
        WHEN hs.user_id = auth.uid() THEN 'SHOULD BE VISIBLE' 
        ELSE 'SHOULD BE HIDDEN' 
    END as visibility_check
FROM public.hedge_simulations hs
LEFT JOIN public.profiles p ON hs.user_id = p.id
ORDER BY hs.created_at DESC;

-- Verificar se as políticas estão sendo aplicadas
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.hedge_simulations 
WHERE auth.uid() = user_id;
