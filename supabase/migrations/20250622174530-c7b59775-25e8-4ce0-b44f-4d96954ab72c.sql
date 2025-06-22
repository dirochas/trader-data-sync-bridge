
-- Criar tabela para gerenciar Expert Advisors
CREATE TABLE public.expert_advisors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  ex4_file_path TEXT, -- Caminho do arquivo .ex4 no storage
  ex5_file_path TEXT, -- Caminho do arquivo .ex5 no storage
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.expert_advisors ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso:
-- Todos os usuários autenticados podem visualizar os EAs
CREATE POLICY "Authenticated users can view EAs" 
  ON public.expert_advisors 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Admins e Managers podem inserir EAs
CREATE POLICY "Admins and managers can insert EAs" 
  ON public.expert_advisors 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND is_active = true
    )
  );

-- Admins e Managers podem atualizar EAs
CREATE POLICY "Admins and managers can update EAs" 
  ON public.expert_advisors 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND is_active = true
    )
  );

-- Admins e Managers podem deletar EAs
CREATE POLICY "Admins and managers can delete EAs" 
  ON public.expert_advisors 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND is_active = true
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_expert_advisors_updated_at
  BEFORE UPDATE ON public.expert_advisors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para os arquivos dos EAs
INSERT INTO storage.buckets (id, name, public)
VALUES ('expert-advisors', 'expert-advisors', true);

-- Políticas de storage para o bucket expert-advisors
-- Todos podem visualizar/baixar arquivos
CREATE POLICY "Public Access for EA files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expert-advisors');

-- Apenas admins/managers podem fazer upload
CREATE POLICY "Admins and managers can upload EA files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'expert-advisors' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND is_active = true
    )
  );

-- Apenas admins/managers podem deletar arquivos
CREATE POLICY "Admins and managers can delete EA files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'expert-advisors' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
      AND is_active = true
    )
  );
