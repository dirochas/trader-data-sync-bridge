
-- Criar tabela para configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (apenas admin pode modificar)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy para leitura (apenas usuários autenticados)
CREATE POLICY "Users can read system settings" 
  ON public.system_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy para escrita (apenas admin)
CREATE POLICY "Only admins can modify system settings" 
  ON public.system_settings 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Inserir a configuração inicial (desativado por padrão)
INSERT INTO public.system_settings (setting_key, setting_value) 
VALUES ('show_trader_data', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
