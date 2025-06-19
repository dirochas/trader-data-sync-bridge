
-- Adicionar campo para nome único do VPS (preservar identificação interna)
ALTER TABLE public.accounts 
ADD COLUMN vps_unique_id TEXT;

-- Migrar dados existentes - extrair o ID único do campo vps atual
UPDATE public.accounts 
SET vps_unique_id = vps 
WHERE vps IS NOT NULL AND vps != 'N/A';

-- Atualizar campo vps com versão encurtada para exibição
UPDATE public.accounts 
SET vps = CASE 
  WHEN vps IS NOT NULL AND vps LIKE 'VPS_%' THEN 
    'VPS_' || RIGHT(vps, 4)
  ELSE vps 
END
WHERE vps IS NOT NULL AND vps != 'N/A';

-- Criar índice para otimizar consultas por VPS único
CREATE INDEX idx_accounts_vps_unique_id ON public.accounts(vps_unique_id);
