
-- Adicionar campo user_email na tabela accounts para associar contas aos usuários
ALTER TABLE public.accounts 
ADD COLUMN user_email TEXT;

-- Criar índice para otimizar consultas por email
CREATE INDEX idx_accounts_user_email ON public.accounts(user_email);
