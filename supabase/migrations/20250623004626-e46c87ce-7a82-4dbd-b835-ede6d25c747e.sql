
-- Habilitar Row Level Security na tabela accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuários podem ver suas próprias contas + Admin/Manager veem todas
CREATE POLICY "Users can view accounts based on role" 
ON public.accounts 
FOR SELECT 
USING (
  CASE 
    WHEN get_current_user_role() IN ('admin', 'manager') THEN true
    WHEN get_current_user_role() IN ('client_trader', 'client_investor') THEN user_email = auth.email()
    ELSE false
  END
);

-- Política para INSERT: Apenas Admin/Manager podem criar contas
CREATE POLICY "Admin and Manager can insert accounts" 
ON public.accounts 
FOR INSERT 
WITH CHECK (get_current_user_role() IN ('admin', 'manager'));

-- Política para UPDATE: Admin/Manager podem editar todas, Traders podem editar suas próprias
CREATE POLICY "Users can update accounts based on role" 
ON public.accounts 
FOR UPDATE 
USING (
  CASE 
    WHEN get_current_user_role() IN ('admin', 'manager') THEN true
    WHEN get_current_user_role() = 'client_trader' THEN user_email = auth.email()
    ELSE false
  END
);

-- Política para DELETE: Apenas Admin/Manager podem deletar contas
CREATE POLICY "Admin and Manager can delete accounts" 
ON public.accounts 
FOR DELETE 
USING (get_current_user_role() IN ('admin', 'manager'));

-- Criar foreign key para account_groups se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'accounts_group_id_fkey'
  ) THEN
    ALTER TABLE public.accounts 
    ADD CONSTRAINT accounts_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES public.account_groups(id) ON DELETE SET NULL;
  END IF;
END $$;
