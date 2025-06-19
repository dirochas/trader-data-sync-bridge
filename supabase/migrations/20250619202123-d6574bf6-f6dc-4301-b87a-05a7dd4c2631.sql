
-- Adicionar coluna nickname na tabela profiles
ALTER TABLE public.profiles ADD COLUMN nickname TEXT;

-- Criar função para popular nickname automaticamente em novos usuários
CREATE OR REPLACE FUNCTION public.set_default_nickname()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se nickname não foi fornecido, usar first_name
  IF NEW.nickname IS NULL OR NEW.nickname = '' THEN
    NEW.nickname = COALESCE(NEW.first_name, '');
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para novos usuários
CREATE TRIGGER set_nickname_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_nickname();

-- Popular nickname para usuários existentes com o first_name atual
UPDATE public.profiles 
SET nickname = COALESCE(first_name, '') 
WHERE nickname IS NULL;
