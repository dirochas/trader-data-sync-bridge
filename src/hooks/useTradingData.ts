
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

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
    return { status: 'Disconnected', color: 'text-rose-300', icon: '🔴' };
  }
};

// Hook otimizado para buscar TODAS as contas de trading com filtragem por email
export const useTradingAccounts = () => {
  const { profile } = useAuth();
  
  // Create stable query key to avoid type inference issues
  const queryKey = ['accounts', profile?.email || 'no-email', profile?.role || 'no-role'] as const;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!profile) return [];
      
      console.log('Fetching accounts for user:', profile.email, 'with role:', profile.role);
      
      let query = supabase
        .from('accounts')
        .select('*')
        .order('updated_at', { ascending: false });
      
      // Se o usuário não é admin nem manager, filtrar apenas suas contas
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        console.log('Filtering accounts by email:', profile.email);
        query = query.eq('user_email', profile.email);
      } else {
        console.log('User has admin/manager role - showing all accounts');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
      
      console.log('Fetched accounts:', data?.length || 0);
      return data || [];
    },
    enabled: !!profile,
    refetchInterval: 1500, // Otimizado para 1.5 segundos (dados críticos)
    staleTime: 500, // Considera dados "frescos" por 500ms
    gcTime: 30000, // Cache por 30 segundos
  });
};

// Hook para buscar UMA conta específica com filtragem por email
export const useTradingAccount = (accountNumber?: string) => {
  const { profile } = useAuth();
  
  // Create stable query key to avoid type inference issues
  const queryKey = ['account', accountNumber || 'no-account', profile?.email || 'no-email', profile?.role || 'no-role'] as const;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!accountNumber || !profile) return null;
      
      console.log('Fetching single account:', accountNumber, 'for user:', profile.email);
      
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('account', accountNumber)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      // Se o usuário não é admin nem manager, filtrar apenas suas contas
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        console.log('Adding email filter for account query');
        query = query.eq('user_email', profile.email);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error fetching account:', error);
        throw error;
      }
      
      console.log('Fetched account:', data ? 'found' : 'not found');
      return data;
    },
    enabled: !!accountNumber && !!profile,
    refetchInterval: 1500, // Mesmo intervalo para consistência
    staleTime: 500,
    gcTime: 30000,
  });
};

// Hook para buscar informações de margem por conta com filtragem por email
export const useMarginInfo = (accountNumber?: string) => {
  const { profile } = useAuth();
  
  // Create stable query key to avoid type inference issues
  const queryKey = ['margin-info', accountNumber || 'no-account', profile?.email || 'no-email', profile?.role || 'no-role'] as const;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!accountNumber || !profile) return null;
      
      console.log('Fetching margin info for account:', accountNumber);
      
      // Primeiro busca o ID da conta com filtragem por email se necessário
      let accountQuery = supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber);
      
      // Se o usuário não é admin nem manager, filtrar apenas suas contas
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        accountQuery = accountQuery.eq('user_email', profile.email);
      }
      
      const { data: accountData, error: accountError } = await accountQuery.single();
      
      if (accountError || !accountData) {
        console.log('Account not found or no permission');
        return null;
      }
      
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
    enabled: !!accountNumber && !!profile,
    refetchInterval: 3000, // Dados menos críticos - 3 segundos
    staleTime: 1000,
    gcTime: 60000,
  });
};

// Hook para buscar posições abertas por conta - DADOS CRÍTICOS com filtragem por email
export const useOpenPositions = (accountNumber?: string) => {
  const { profile } = useAuth();
  
  // Create stable query key to avoid type inference issues
  const queryKey = ['positions', accountNumber || 'no-account', profile?.email || 'no-email', profile?.role || 'no-role'] as const;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!accountNumber || !profile) return [];
      
      console.log('Fetching positions for account:', accountNumber);
      
      // Primeiro busca o ID da conta com filtragem por email se necessário
      let accountQuery = supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber);
      
      // Se o usuário não é admin nem manager, filtrar apenas suas contas
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        accountQuery = accountQuery.eq('user_email', profile.email);
      }
      
      const { data: accountData, error: accountError } = await accountQuery.single();
      
      if (accountError || !accountData) {
        console.log('Account not found or no permission');
        return [];
      }
      
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('account_id', accountData.id)
        .order('time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountNumber && !!profile,
    refetchInterval: 1000, // MAIS CRÍTICO - 1 segundo para posições
    staleTime: 300, // Dados muito frescos
    gcTime: 30000,
  });
};

// Hook para buscar histórico de trades por conta com filtragem por email
export const useTradeHistory = (accountNumber?: string) => {
  const { profile } = useAuth();
  
  // Create stable query key to avoid type inference issues
  const queryKey = ['history', accountNumber || 'no-account', profile?.email || 'no-email', profile?.role || 'no-role'] as const;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!accountNumber || !profile) return [];
      
      console.log('Fetching trade history for account:', accountNumber);
      
      // Primeiro busca o ID da conta com filtragem por email se necessário
      let accountQuery = supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber);
      
      // Se o usuário não é admin nem manager, filtrar apenas suas contas
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        accountQuery = accountQuery.eq('user_email', profile.email);
      }
      
      const { data: accountData, error: accountError } = await accountQuery.single();
      
      if (accountError || !accountData) {
        console.log('Account not found or no permission');
        return [];
      }
      
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('account_id', accountData.id)
        .order('close_time', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountNumber && !!profile,
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
