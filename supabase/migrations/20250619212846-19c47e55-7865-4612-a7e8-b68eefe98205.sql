
-- Fix VPS UPDATE policy: Allow client_trader to update their own VPS
-- Commit: VPS-RLS-002 - Enable trader self-management
-- Description: Client traders can update VPS where they have accounts

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "vps_admin_update" ON public.vps_servers;

-- Create new UPDATE policy allowing traders to edit their VPS
CREATE POLICY "vps_update_access"
  ON public.vps_servers
  FOR UPDATE
  TO authenticated
  USING (
    -- Admin/Manager can update all VPS
    public.is_admin_or_manager() 
    OR 
    -- Client traders can update VPS where they have accounts
    (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client_trader'
      AND EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE accounts.vps_unique_id = vps_servers.vps_unique_id 
        AND accounts.user_email = (
          SELECT email FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );
