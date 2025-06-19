
-- Add foreign key constraint between accounts and vps_servers
ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_vps_unique_id_fkey 
FOREIGN KEY (vps_unique_id) 
REFERENCES public.vps_servers(vps_unique_id)
ON DELETE SET NULL
ON UPDATE CASCADE;
