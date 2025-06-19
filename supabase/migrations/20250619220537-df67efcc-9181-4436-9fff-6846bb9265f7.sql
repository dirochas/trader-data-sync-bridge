
-- Performance Optimization: Fix RLS policies and duplicate indexes (FIXED)
-- Commit: PERF-OPT-002 - Optimize RLS policies and remove duplicate indexes (corrected)
-- Description: Fix auth function calls in RLS policies and remove duplicate indexes

-- 1. Drop duplicate index on accounts table
DROP INDEX IF EXISTS idx_accounts_vps_unique_id;

-- 2. Drop existing RLS policies for profiles table to recreate optimized ones
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own basic info" ON public.profiles;

-- 3. Create optimized RLS policies for profiles (consolidate multiple policies)
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_manager() 
    OR id = (SELECT auth.uid())
  );

CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_manager()
    OR (
      id = (SELECT auth.uid()) 
      AND role = (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    )
  );

-- 4. Drop and recreate VPS policies with optimized auth function calls
DROP POLICY IF EXISTS "vps_hybrid_access_control" ON public.vps_servers;
DROP POLICY IF EXISTS "vps_update_access" ON public.vps_servers;
DROP POLICY IF EXISTS "vps_select_optimized" ON public.vps_servers;
DROP POLICY IF EXISTS "vps_update_optimized" ON public.vps_servers;
DROP POLICY IF EXISTS "vps_admin_insert" ON public.vps_servers;
DROP POLICY IF EXISTS "vps_admin_delete" ON public.vps_servers;

-- 5. Create optimized VPS policies using SELECT for auth functions
CREATE POLICY "vps_select_optimized"
  ON public.vps_servers
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_manager() 
    OR 
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.vps_unique_id = vps_servers.vps_unique_id 
      AND accounts.user_email = (
        SELECT email FROM public.profiles WHERE id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "vps_update_optimized"
  ON public.vps_servers
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_manager() 
    OR 
    (
      (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'client_trader'
      AND EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE accounts.vps_unique_id = vps_servers.vps_unique_id 
        AND accounts.user_email = (
          SELECT email FROM public.profiles WHERE id = (SELECT auth.uid())
        )
      )
    )
  );

-- 6. Recreate policies for other operations
CREATE POLICY "vps_admin_insert"
  ON public.vps_servers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager());

CREATE POLICY "vps_admin_delete"
  ON public.vps_servers
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- 7. Add missing index for foreign key (margin.account_id)
CREATE INDEX IF NOT EXISTS idx_margin_account_id ON public.margin(account_id);
