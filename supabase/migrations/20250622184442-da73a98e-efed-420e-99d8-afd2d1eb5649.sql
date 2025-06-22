
-- Adicionar coluna uploader_role na tabela expert_advisors
ALTER TABLE public.expert_advisors 
ADD COLUMN uploader_role user_role;

-- Atualizar registros existentes com o role correto baseado no uploaded_by
UPDATE public.expert_advisors 
SET uploader_role = profiles.role 
FROM public.profiles 
WHERE expert_advisors.uploaded_by = profiles.id;

-- Tornar a coluna NOT NULL depois de popular os dados existentes
ALTER TABLE public.expert_advisors 
ALTER COLUMN uploader_role SET NOT NULL;
