
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

// Hook para buscar TODAS as contas de trading
export const useTradingAccounts = () => {
  return useQuery({
    queryKey: ['trading-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
};

// Hook para buscar UMA conta específica
export const useTradingAccount = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['trading-account', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return null;
      
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('account_number', accountNumber)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!accountNumber,
    refetchInterval: 5000,
  });
};

// Hook para buscar informações de margem por conta
export const useMarginInfo = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['margin-info', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return null;
      
      // Primeiro busca o ID da conta
      const { data: accountData, error: accountError } = await supabase
        .from('trading_accounts')
        .select('id')
        .eq('account_number', accountNumber)
        .single();
      
      if (accountError || !accountData) return null;
      
      const { data, error } = await supabase
        .from('margin_info')
        .select('*')
        .eq('account_id', accountData.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!accountNumber,
    refetchInterval: 5000,
  });
};

// Hook para buscar posições abertas por conta
export const useOpenPositions = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['open-positions', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return [];
      
      // Primeiro busca o ID da conta
      const { data: accountData, error: accountError } = await supabase
        .from('trading_accounts')
        .select('id')
        .eq('account_number', accountNumber)
        .single();
      
      if (accountError || !accountData) return [];
      
      const { data, error } = await supabase
        .from('open_positions')
        .select('*')
        .eq('account_id', accountData.id)
        .order('open_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountNumber,
    refetchInterval: 5000,
  });
};

// Hook para buscar histórico de trades por conta
export const useTradeHistory = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['trade-history', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return [];
      
      // Primeiro busca o ID da conta
      const { data: accountData, error: accountError } = await supabase
        .from('trading_accounts')
        .select('id')
        .eq('account_number', accountNumber)
        .single();
      
      if (accountError || !accountData) return [];
      
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('account_id', accountData.id)
        .order('close_time', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountNumber,
    refetchInterval: 10000,
  });
};

// Hook para configurar atualizações em tempo real SEM refresh da página
export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('trading-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trading_accounts' },
        () => {
          // Atualiza a lista de contas E contas individuais
          queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
          queryClient.invalidateQueries({ queryKey: ['trading-account'] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'margin_info' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['margin-info'] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'open_positions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['open-positions'] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'trade_history' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trade-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
