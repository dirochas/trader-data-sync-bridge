
-- Criar tabela para armazenar comandos pendentes
CREATE TABLE public.pending_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.trading_accounts(id) NOT NULL,
  command_type TEXT NOT NULL, -- 'CLOSE_ALL', 'CLOSE_POSITION', etc.
  command_data JSONB DEFAULT '{}', -- dados adicionais do comando
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'EXECUTED', 'FAILED'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE NULL,
  error_message TEXT NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_pending_commands_account_status ON public.pending_commands(account_id, status);
CREATE INDEX idx_pending_commands_created_at ON public.pending_commands(created_at);

-- RLS (Row Level Security) - por enquanto permitir acesso público já que não temos auth
ALTER TABLE public.pending_commands ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total (adaptar quando implementar auth)
CREATE POLICY "Allow all access to pending_commands" 
  ON public.pending_commands 
  FOR ALL 
  USING (true);
