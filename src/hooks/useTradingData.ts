
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useTradingAccount = () => {
  return useQuery({
    queryKey: ['trading-account'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
};

export const useMarginInfo = () => {
  return useQuery({
    queryKey: ['margin-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('margin_info')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
};

export const useOpenPositions = () => {
  return useQuery({
    queryKey: ['open-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_positions')
        .select('*')
        .order('open_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });
};

export const useTradeHistory = () => {
  return useQuery({
    queryKey: ['trade-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .order('close_time', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
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
          // Atualiza apenas os dados necessários sem refresh
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
