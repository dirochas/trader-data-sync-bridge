
-- Primeiro, vamos adicionar a coluna com um valor padrão permitindo NULL temporariamente
ALTER TABLE public.hedge_simulations 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Para os registros existentes, vamos usar um UUID padrão ou o primeiro usuário da tabela profiles
-- Vamos pegar o primeiro usuário admin disponível para associar as simulações existentes
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Pega o primeiro usuário admin disponível
    SELECT id INTO default_user_id 
    FROM public.profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Se não houver admin, pega qualquer usuário
    IF default_user_id IS NULL THEN
        SELECT id INTO default_user_id 
        FROM public.profiles 
        LIMIT 1;
    END IF;
    
    -- Atualiza os registros existentes
    UPDATE public.hedge_simulations 
    SET user_id = default_user_id 
    WHERE user_id IS NULL;
END $$;

-- Agora torna a coluna NOT NULL
ALTER TABLE public.hedge_simulations 
ALTER COLUMN user_id SET NOT NULL;

-- Define valor padrão para novos registros
ALTER TABLE public.hedge_simulations 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Habilitar Row Level Security
ALTER TABLE public.hedge_simulations ENABLE ROW LEVEL SECURITY;

-- Política para visualizar apenas suas próprias simulações
CREATE POLICY "Users can view their own simulations" 
  ON public.hedge_simulations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para criar apenas suas próprias simulações
CREATE POLICY "Users can create their own simulations" 
  ON public.hedge_simulations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar apenas suas próprias simulações
CREATE POLICY "Users can update their own simulations" 
  ON public.hedge_simulations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para deletar apenas suas próprias simulações
CREATE POLICY "Users can delete their own simulations" 
  ON public.hedge_simulations 
  FOR DELETE 
  USING (auth.uid() = user_id);
