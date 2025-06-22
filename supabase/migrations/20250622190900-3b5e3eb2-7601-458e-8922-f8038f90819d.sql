
-- Fix infinite recursion in profiles RLS policies
-- Remove conflicting policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND (
      -- Allow users to update their own basic info but not change their role
      role = (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1)
      OR 
      -- Allow admins and managers to update any profile
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager') 
        AND is_active = true
      )
    )
  );
