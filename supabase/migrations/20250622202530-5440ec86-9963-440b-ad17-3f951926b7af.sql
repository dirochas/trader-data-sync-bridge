
-- Primeiro, vamos ver todas as políticas existentes na tabela profiles
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Remover TODAS as políticas da tabela profiles para evitar conflitos
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "admin_manager_can_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profile_insert_policy" ON public.profiles;

-- Agora criar as políticas corretas (com nomes únicos)
CREATE POLICY "profiles_can_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR 
    public.is_admin_or_manager()
  );

CREATE POLICY "profiles_can_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_can_update"
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

CREATE POLICY "profiles_can_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());
