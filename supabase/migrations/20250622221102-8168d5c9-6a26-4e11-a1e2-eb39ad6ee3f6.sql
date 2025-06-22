
-- Criar tabela para grupos de contas
CREATE TABLE public.account_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- Cor padrão azul
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Adicionar coluna group_id na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN group_id UUID REFERENCES public.account_groups(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX idx_accounts_group_id ON public.accounts(group_id);
CREATE INDEX idx_account_groups_created_by ON public.account_groups(created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_account_groups_updated_at
  BEFORE UPDATE ON public.account_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS na tabela account_groups
ALTER TABLE public.account_groups ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para account_groups
-- Admin e Manager podem ver todos os grupos
CREATE POLICY "Admin and Manager can view all groups" 
  ON public.account_groups 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager') 
      AND is_active = true
    )
  );

-- Admin e Manager podem criar grupos
CREATE POLICY "Admin and Manager can create groups" 
  ON public.account_groups 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager') 
      AND is_active = true
    )
  );

-- Admin e Manager podem atualizar grupos
CREATE POLICY "Admin and Manager can update groups" 
  ON public.account_groups 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager') 
      AND is_active = true
    )
  );

-- Admin e Manager podem deletar grupos
CREATE POLICY "Admin and Manager can delete groups" 
  ON public.account_groups 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager') 
      AND is_active = true
    )
  );

-- Comentários para documentação
COMMENT ON TABLE public.account_groups IS 'Grupos para organizar contas de trading em pares/conjuntos hedge';
COMMENT ON COLUMN public.account_groups.name IS 'Nome do grupo (ex: Pedro Hedge A-B)';
COMMENT ON COLUMN public.account_groups.color IS 'Cor hexadecimal para identificação visual';
COMMENT ON COLUMN public.accounts.group_id IS 'ID do grupo ao qual a conta pertence (nullable)';
