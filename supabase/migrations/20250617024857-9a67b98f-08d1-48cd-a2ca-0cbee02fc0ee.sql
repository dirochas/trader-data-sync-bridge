
-- Promover o usuário com email diegodocha11@gmail.com para admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'diegodocha11@gmail.com';

-- Se por algum motivo não encontrar esse email específico, promover o primeiro usuário ativo
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM public.profiles 
  WHERE is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1
) AND NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'diegodocha11@gmail.com' AND role = 'admin'
);
