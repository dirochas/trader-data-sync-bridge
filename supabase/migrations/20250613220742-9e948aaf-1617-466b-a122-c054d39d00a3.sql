
-- Ajustar as colunas de preço nas tabelas para suportar valores maiores
-- Bitcoin pode ter preços como 105.000+ então precisamos de mais dígitos

-- Tabela open_positions
ALTER TABLE public.open_positions 
ALTER COLUMN open_price TYPE NUMERIC(12,5);

ALTER TABLE public.open_positions 
ALTER COLUMN current_price TYPE NUMERIC(12,5);

-- Tabela trade_history  
ALTER TABLE public.trade_history 
ALTER COLUMN open_price TYPE NUMERIC(12,5);

ALTER TABLE public.trade_history 
ALTER COLUMN close_price TYPE NUMERIC(12,5);
