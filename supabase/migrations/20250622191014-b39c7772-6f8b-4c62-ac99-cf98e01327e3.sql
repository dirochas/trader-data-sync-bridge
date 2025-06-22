
-- Remove all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can update all profiles" ON public.profiles;

-- Create completely safe, non-recursive policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Separate policy for self-updates (no role check)
CREATE POLICY "Users can update own basic profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Separate policy for admin/manager updates using security definer function
CREATE POLICY "Admins and managers can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

-- Policy for admins/managers to view all profiles
CREATE POLICY "Admins and managers can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager());
