
-- Verificar se já existe a coluna created_by na tabela account_groups
-- Se não existir, vamos adicioná-la
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'account_groups' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.account_groups 
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Atualizar grupos existentes para associar ao primeiro admin encontrado (fallback)
UPDATE public.account_groups 
SET created_by = (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.role IN ('admin', 'manager') 
  AND p.is_active = true 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Remover as políticas RLS existentes mais restritivas
DROP POLICY IF EXISTS "Admin and Manager can view all groups" ON public.account_groups;
DROP POLICY IF EXISTS "Admin and Manager can create groups" ON public.account_groups;
DROP POLICY IF EXISTS "Admin and Manager can update groups" ON public.account_groups;
DROP POLICY IF EXISTS "Admin and Manager can delete groups" ON public.account_groups;

-- Criar novas políticas RLS que incluem Traders
-- Política de SELECT: Admin/Manager veem todos, Traders veem apenas os seus
CREATE POLICY "Users can view groups based on role" 
  ON public.account_groups 
  FOR SELECT 
  USING (
    CASE 
      WHEN get_current_user_role() IN ('admin', 'manager') THEN true
      WHEN get_current_user_role() = 'client_trader' THEN created_by = auth.uid()
      ELSE false
    END
  );

-- Política de INSERT: Admin/Manager e Traders podem criar grupos
CREATE POLICY "Admin Manager and Traders can create groups" 
  ON public.account_groups 
  FOR INSERT 
  WITH CHECK (
    get_current_user_role() IN ('admin', 'manager', 'client_trader')
    AND created_by = auth.uid()
  );

-- Política de UPDATE: Admin/Manager podem atualizar todos, Traders apenas os seus
CREATE POLICY "Users can update groups based on role" 
  ON public.account_groups 
  FOR UPDATE 
  USING (
    CASE 
      WHEN get_current_user_role() IN ('admin', 'manager') THEN true
      WHEN get_current_user_role() = 'client_trader' THEN created_by = auth.uid()
      ELSE false
    END
  );

-- Política de DELETE: Admin/Manager podem deletar todos, Traders apenas os seus
CREATE POLICY "Users can delete groups based on role" 
  ON public.account_groups 
  FOR DELETE 
  USING (
    CASE 
      WHEN get_current_user_role() IN ('admin', 'manager') THEN true
      WHEN get_current_user_role() = 'client_trader' THEN created_by = auth.uid()
      ELSE false
    END
  );
