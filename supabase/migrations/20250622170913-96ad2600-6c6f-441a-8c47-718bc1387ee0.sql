
-- Adicionar coluna para armazenar quando a configuração foi ativada
ALTER TABLE public.system_settings 
ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE NULL;

-- Atualizar a configuração existente para ter o timestamp se estiver ativa
UPDATE public.system_settings 
SET activated_at = CASE 
  WHEN setting_value = true THEN now() 
  ELSE NULL 
END
WHERE setting_key = 'show_trader_data';
