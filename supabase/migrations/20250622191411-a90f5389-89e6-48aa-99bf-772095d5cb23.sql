
-- Remover TODAS as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can update any profile" ON public.profiles;

-- Criar políticas completamente novas e não-recursivas
CREATE POLICY "profile_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR 
    public.is_admin_or_manager()
  );

CREATE POLICY "profile_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() 
    OR 
    public.is_admin_or_manager()
  )
  WITH CHECK (
    id = auth.uid() 
    OR 
    public.is_admin_or_manager()
  );

CREATE POLICY "profile_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );
