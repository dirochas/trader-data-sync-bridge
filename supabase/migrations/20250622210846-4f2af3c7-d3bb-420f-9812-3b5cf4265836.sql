
-- Verificar se o RLS está ativo na tabela
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'hedge_simulations';

-- Verificar as políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'hedge_simulations';

-- Verificar os dados atuais da tabela
SELECT id, simulation_name, user_id, created_at 
FROM public.hedge_simulations;

-- Verificar se os user_ids correspondem aos usuários corretos
SELECT hs.id, hs.simulation_name, hs.user_id, p.email, p.role
FROM public.hedge_simulations hs
LEFT JOIN public.profiles p ON hs.user_id = p.id;
