
-- Criar tabela dedicada para VPS
CREATE TABLE public.vps_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vps_unique_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_vps_servers_updated_at
  BEFORE UPDATE ON public.vps_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrar dados existentes da tabela accounts para vps_servers
INSERT INTO public.vps_servers (vps_unique_id, display_name)
SELECT DISTINCT vps_unique_id, vps
FROM public.accounts
WHERE vps_unique_id IS NOT NULL
ON CONFLICT (vps_unique_id) DO NOTHING;

-- Remover coluna vps da tabela accounts (já que agora será uma view)
ALTER TABLE public.accounts DROP COLUMN vps;

-- Criar índices para performance
CREATE INDEX idx_vps_servers_unique_id ON public.vps_servers(vps_unique_id);
CREATE INDEX idx_accounts_vps_unique_id_lookup ON public.accounts(vps_unique_id);
