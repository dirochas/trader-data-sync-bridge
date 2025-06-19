
-- Criar enum para os status das contas
CREATE TYPE account_status AS ENUM ('active', 'archived', 'deleted');

-- Adicionar coluna status na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN status account_status NOT NULL DEFAULT 'active';

-- Criar índice para melhorar performance nas consultas por status
CREATE INDEX idx_accounts_status ON public.accounts(status);

-- Adicionar coluna deleted_at para controlar o período de retenção das contas deletadas
ALTER TABLE public.accounts 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Comentários para documentar os campos
COMMENT ON COLUMN public.accounts.status IS 'Status da conta: active (ativa), archived (arquivada), deleted (na lixeira)';
COMMENT ON COLUMN public.accounts.deleted_at IS 'Data quando a conta foi movida para lixeira. Contas são permanentemente deletadas após 30 dias.';
