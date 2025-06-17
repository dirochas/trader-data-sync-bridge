
-- Promover o usuário atual para admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@traderlab.com';

-- Se não existir usuário com esse email, vamos promover o primeiro usuário ativo
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM public.profiles 
  WHERE is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1
);
