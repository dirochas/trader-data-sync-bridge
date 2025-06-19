
-- RLS Security Fix: Enable Row Level Security for vps_servers table
-- Commit: VPS-RLS-001 - Enable RLS with hybrid access control
-- Date: 2025-01-19
-- Description: Users see VPS where they have accounts, Admin/Manager see all

-- Enable RLS on vps_servers table
ALTER TABLE public.vps_servers ENABLE ROW LEVEL SECURITY;

-- Create policy: Users see VPS where they have accounts, Admin/Manager see everything
CREATE POLICY "vps_hybrid_access_control"
  ON public.vps_servers
  FOR SELECT
  TO authenticated
  USING (
    -- Admin/Manager can see all VPS servers
    public.is_admin_or_manager() 
    OR 
    -- Regular users can see VPS servers where they have accounts
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.vps_unique_id = vps_servers.vps_unique_id 
      AND accounts.user_email = (
        SELECT email FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Policy for INSERT (only admin/manager can create VPS servers)
CREATE POLICY "vps_admin_insert"
  ON public.vps_servers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager());

-- Policy for UPDATE (only admin/manager can update VPS servers)
CREATE POLICY "vps_admin_update"
  ON public.vps_servers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager());

-- Policy for DELETE (only admin/manager can delete VPS servers)
CREATE POLICY "vps_admin_delete"
  ON public.vps_servers
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());
