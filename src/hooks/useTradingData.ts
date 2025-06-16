
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

// Função para calcular o status da conexão baseado na última atualização
export const getConnectionStatus = (lastUpdate: string) => {
  const now = new Date();
  const lastUpdateTime = new Date(lastUpdate);
  const diffInSeconds = (now.getTime() - lastUpdateTime.getTime()) / 1000;

  if (diffInSeconds <= 10) {
    return { status: 'Live', color: 'text-green-600', icon: '🟢' };
  } else if (diffInSeconds <= 30) {
    return { status: 'Slow Connection', color: 'text-yellow-600', icon: '🟡' };
  } else if (diffInSeconds <= 120) { // 2 minutos
    return { status: 'Delayed', color: 'text-orange-600', icon: '🟠' };
  } else {
    return { status: 'Disconnected', color: 'text-red-600', icon: '🔴' };
  }
};

// Hook otimizado para buscar TODAS as contas de trading
export const useTradingAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 1500, // Otimizado para 1.5 segundos (dados críticos)
    staleTime: 500, // Considera dados "frescos" por 500ms
    gcTime: 30000, // Cache por 30 segundos
  });
};

// Hook para buscar UMA conta específica
export const useTradingAccount = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['account', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return null;
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('account', accountNumber)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!accountNumber,
    refetchInterval: 1500, // Mesmo intervalo para consistência
    staleTime: 500,
    gcTime: 30000,
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
        .from('accounts')
        .select('id')
        .eq('account', accountNumber)
        .single();
      
      if (accountError || !accountData) return null;
      
      const { data, error } = await supabase
        .from('margin')
        .select('*')
        .eq('account_id', accountData.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!accountNumber,
    refetchInterval: 3000, // Dados menos críticos - 3 segundos
    staleTime: 1000,
    gcTime: 60000,
  });
};

// Hook para buscar posições abertas por conta - DADOS CRÍTICOS
export const useOpenPositions = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['positions', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return [];
      
      // Primeiro busca o ID da conta
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber)
        .single();
      
      if (accountError || !accountData) return [];
      
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('account_id', accountData.id)
        .order('time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountNumber,
    refetchInterval: 1000, // MAIS CRÍTICO - 1 segundo para posições
    staleTime: 300, // Dados muito frescos
    gcTime: 30000,
  });
};

// Hook para buscar histórico de trades por conta
export const useTradeHistory = (accountNumber?: string) => {
  return useQuery({
    queryKey: ['history', accountNumber],
    queryFn: async () => {
      if (!accountNumber) return [];
      
      // Primeiro busca o ID da conta
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber)
        .single();
      
      if (accountError || !accountData) return [];
      
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('account_id', accountData.id)
        .order('close_time', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountNumber,
    refetchInterval: 8000, // Dados históricos - menos críticos, 8 segundos
    staleTime: 2000,
    gcTime: 120000, // Cache por 2 minutos
  });
};

// Hook para configurar atualizações em tempo real SEM refresh da página
export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('trading-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'accounts' },
        () => {
          // Invalidação mais inteligente - só invalida se dados são "antigos"
          queryClient.invalidateQueries({ 
            queryKey: ['accounts'],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['account'],
            refetchType: 'all'
          });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'margin' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['margin-info'] });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'positions' },
        () => {
          // Posições são críticas - invalidação imediata
          queryClient.invalidateQueries({ 
            queryKey: ['positions'],
            refetchType: 'all'
          });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'history' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
