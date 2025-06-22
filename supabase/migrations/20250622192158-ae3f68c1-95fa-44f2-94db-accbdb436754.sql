
-- Fix the infinite recursion in profiles UPDATE policy
-- The issue is that we're checking admin/manager role during UPDATE which causes recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "profile_update_policy" ON public.profiles;

-- Create a simple, safe UPDATE policy that allows:
-- 1. Users to update their own profile (without role restrictions)
-- 2. A separate policy for admin/manager updates using a more specific approach

-- Policy 1: Users can update their own basic info
CREATE POLICY "users_can_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 2: Create a simple admin override policy using direct role check
-- This avoids the function call that was causing recursion
CREATE POLICY "admin_manager_can_update_any_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Direct check without function call to avoid recursion
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'manager') 
      AND is_active = true
      AND id = auth.uid()
    )
  )
  WITH CHECK (
    -- Allow the update if user is admin/manager or updating their own profile
    auth.uid() = id 
    OR 
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'manager') 
      AND is_active = true
      AND id = auth.uid()
    )
  );
