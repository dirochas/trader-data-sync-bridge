
-- Adicionar campo user_email na tabela hedge_simulations para associar simulações aos usuários
ALTER TABLE public.hedge_simulations 
ADD COLUMN user_email TEXT;

-- Criar índice para otimizar consultas por email
CREATE INDEX idx_hedge_simulations_user_email ON public.hedge_simulations(user_email);

-- Para os registros existentes, vamos associar ao usuário admin atual
-- (você pode ajustar isso depois conforme necessário)
UPDATE public.hedge_simulations 
SET user_email = (
    SELECT email FROM public.profiles 
    WHERE role = 'admin' 
    LIMIT 1
) 
WHERE user_email IS NULL;
