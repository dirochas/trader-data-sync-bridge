
-- Adicionar campos necessários para melhor organização das contas
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS vps_name TEXT,
ADD COLUMN IF NOT EXISTS broker TEXT;

-- Atualizar contas existentes com valores padrão usando uma abordagem mais simples
UPDATE public.trading_accounts 
SET 
  name = COALESCE(name, 'Account ' || account_number),
  vps_name = COALESCE(vps_name, 'VPS-' || SUBSTRING(id::text, 1, 8)),
  broker = COALESCE(broker, 'MT4-Server');
