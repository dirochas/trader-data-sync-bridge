
-- Add RDP connection fields to vps_servers table
ALTER TABLE public.vps_servers 
ADD COLUMN host TEXT,
ADD COLUMN port TEXT DEFAULT '3389',
ADD COLUMN username TEXT,
ADD COLUMN password TEXT;
