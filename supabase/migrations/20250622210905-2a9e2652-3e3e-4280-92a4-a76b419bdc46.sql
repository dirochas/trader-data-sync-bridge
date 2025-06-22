
-- Verificar se o RLS está realmente ativo
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename = 'hedge_simulations';

-- Listar todas as políticas da tabela com mais detalhes
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'hedge_simulations'
ORDER BY policyname;

-- Verificar dados específicos das simulações
SELECT 
    id,
    simulation_name,
    user_id,
    created_at,
    implementation_status
FROM public.hedge_simulations
ORDER BY created_at DESC;

-- Verificar correspondência com usuários
SELECT 
    hs.id,
    hs.simulation_name,
    hs.user_id,
    p.email,
    p.role,
    p.first_name,
    p.last_name
FROM public.hedge_simulations hs
LEFT JOIN public.profiles p ON hs.user_id = p.id
ORDER BY hs.created_at DESC;

-- Verificar se existe algum usuário com o ID que está nas simulações
SELECT 
    id,
    email,
    created_at as user_created_at
FROM auth.users
WHERE id IN (SELECT DISTINCT user_id FROM public.hedge_simulations);
