
-- Adicionar colunas cost e due_date na tabela vps_servers
ALTER TABLE public.vps_servers 
ADD COLUMN cost numeric DEFAULT 0,
ADD COLUMN due_date date;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN public.vps_servers.cost IS 'Custo mensal/período do VPS';
COMMENT ON COLUMN public.vps_servers.due_date IS 'Data de vencimento do VPS';
