
-- Renomear tabelas para ficar compatível com SQL Server
ALTER TABLE public.trading_accounts RENAME TO accounts;
ALTER TABLE public.margin_info RENAME TO margin;
ALTER TABLE public.open_positions RENAME TO positions;
ALTER TABLE public.trade_history RENAME TO history;
ALTER TABLE public.pending_commands RENAME TO commands;

-- Renomear colunas na tabela accounts para compatibilidade
ALTER TABLE public.accounts RENAME COLUMN account_number TO account;
ALTER TABLE public.accounts RENAME COLUMN vps_name TO vps;

-- Renomear colunas na tabela margin para compatibilidade
ALTER TABLE public.margin RENAME COLUMN used_margin TO used;
ALTER TABLE public.margin RENAME COLUMN free_margin TO free;
ALTER TABLE public.margin RENAME COLUMN margin_level TO level;

-- Renomear colunas na tabela positions para compatibilidade
ALTER TABLE public.positions RENAME COLUMN open_price TO price;
ALTER TABLE public.positions RENAME COLUMN current_price TO current;
ALTER TABLE public.positions RENAME COLUMN open_time TO time;

-- Renomear colunas na tabela history para compatibilidade
ALTER TABLE public.history RENAME COLUMN open_price TO price;
ALTER TABLE public.history RENAME COLUMN close_price TO close;
ALTER TABLE public.history RENAME COLUMN open_time TO time;
-- REMOVIDO: close_time já existe com esse nome

-- Renomear colunas na tabela commands para compatibilidade
ALTER TABLE public.commands RENAME COLUMN command_type TO type;
ALTER TABLE public.commands RENAME COLUMN command_data TO data;
ALTER TABLE public.commands RENAME COLUMN error_message TO error;
ALTER TABLE public.commands RENAME COLUMN executed_at TO executed;

-- Atualizar foreign keys para usar os novos nomes de tabela
ALTER TABLE public.margin DROP CONSTRAINT IF EXISTS margin_info_account_id_fkey;
ALTER TABLE public.margin ADD CONSTRAINT margin_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS open_positions_account_id_fkey;
ALTER TABLE public.positions ADD CONSTRAINT positions_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.history DROP CONSTRAINT IF EXISTS trade_history_account_id_fkey;
ALTER TABLE public.history ADD CONSTRAINT history_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE public.commands DROP CONSTRAINT IF EXISTS pending_commands_account_id_fkey;
ALTER TABLE public.commands ADD CONSTRAINT commands_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES public.accounts(id);
