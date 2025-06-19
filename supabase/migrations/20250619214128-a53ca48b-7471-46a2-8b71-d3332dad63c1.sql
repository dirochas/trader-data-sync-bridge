
-- Fix Function Search Path Mutable warnings
-- Commit: FUNC-SEC-001 - Set stable search_path for security functions
-- Description: Add explicit search_path to all security functions to prevent SQL injection

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Fix has_role function  
CREATE OR REPLACE FUNCTION public.has_role(_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = _role AND is_active = true
  );
$$;

-- Fix is_admin_or_manager function
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager') 
    AND is_active = true
  );
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix set_default_nickname function
CREATE OR REPLACE FUNCTION public.set_default_nickname()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Se nickname não foi fornecido, usar first_name
  IF NEW.nickname IS NULL OR NEW.nickname = '' THEN
    NEW.nickname = COALESCE(NEW.first_name, '');
  END IF;
  RETURN NEW;
END;
$$;
