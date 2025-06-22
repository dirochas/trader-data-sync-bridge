
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSetting } from '@/hooks/useSystemSettings';

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

// Hook otimizado para buscar TODAS as contas de trading (com filtro por usuário e JOIN com VPS)
// Por padrão, mostra apenas contas ativas
export const useTradingAccounts = (includeArchived = false, includeDeleted = false) => {
  const { profile } = useAuth();
  const { data: showTraderDataSetting } = useSystemSetting('show_trader_data');
  
  return useQuery({
    queryKey: ['accounts', profile?.email, includeArchived, includeDeleted, showTraderDataSetting?.setting_value],
    queryFn: async () => {
      let query = supabase
        .from('accounts')
        .select(`
          *,
          vps_servers(display_name)
        `);
      
      // Filtrar por status (por padrão apenas ativas)
      const statusFilter = [];
      statusFilter.push('active');
      if (includeArchived) statusFilter.push('archived');
      if (includeDeleted) statusFilter.push('deleted');
      
      query = query.in('status', statusFilter);
      
      // Lógica de filtro baseada no papel do usuário e configuração do sistema
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        // Clientes sempre veem apenas suas próprias contas
        if (profile.email) {
          query = query.eq('user_email', profile.email);
          console.log('🔍 Filtrando contas para usuário cliente:', profile.email);
        } else {
          console.log('⚠️ Cliente sem email - não mostrará contas');
          return [];
        }
      } else if (profile?.role === 'admin') {
        // Admin sempre vê todas as contas
        console.log('👑 Admin - mostrando todas as contas');
      } else if (profile?.role === 'manager') {
        // Manager vê baseado na configuração do sistema
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        
        if (!showTraderData) {
          // Se configuração desabilitada, filtrar para mostrar apenas contas não-trader
          query = query.not('user_email', 'like', '%@trader%'); // ou outro critério para identificar traders
          console.log('👔 Manager - modo restrito (sem dados Cliente Trader)');
        } else {
          console.log('👔 Manager - modo debug ativo (visualizando dados Cliente Trader)');
        }
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear os dados para incluir vps como propriedade direta
      return (data || []).map(account => ({
        ...account,
        vps: account.vps_servers?.display_name || account.vps_unique_id || 'N/A'
      }));
    },
    enabled: !!profile, // Só executa quando tem perfil carregado
    refetchInterval: 1500, // Otimizado para 1.5 segundos (dados críticos)
    staleTime: 500, // Considera dados "frescos" por 500ms
    gcTime: 30000, // Cache por 30 segundos
  });
};

// Hook para buscar UMA conta específica (com verificação de permissão e JOIN com VPS)
export const useTradingAccount = (accountNumber?: string) => {
  const { profile } = useAuth();
  const { data: showTraderDataSetting } = useSystemSetting('show_trader_data');
  
  return useQuery({
    queryKey: ['account', accountNumber, profile?.email, showTraderDataSetting?.setting_value],
    queryFn: async () => {
      if (!accountNumber) return null;
      
      let query = supabase
        .from('accounts')
        .select(`
          *,
          vps_servers(display_name)
        `)
        .eq('account', accountNumber);
      
      // Lógica de filtro baseada no papel do usuário e configuração do sistema
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        // Clientes sempre veem apenas suas próprias contas
        if (profile.email) {
          query = query.eq('user_email', profile.email);
        } else {
          return null; // Cliente sem email não vê nada
        }
      } else if (profile?.role === 'manager') {
        // Manager vê baseado na configuração do sistema
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        
        if (!showTraderData) {
          // Se configuração desabilitada, filtrar para mostrar apenas contas não-trader
          query = query.not('user_email', 'like', '%@trader%');
        }
      }
      // Admin sempre vê todas as contas (sem filtro adicional)
      
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // Mapear os dados para incluir vps como propriedade direta
      if (data) {
        return {
          ...data,
          vps: data.vps_servers?.display_name || data.vps_unique_id || 'N/A'
        };
      }
      
      return data;
    },
    enabled: !!accountNumber && !!profile,
    refetchInterval: 1500, // Mesmo intervalo para consistência
    staleTime: 500,
    gcTime: 30000,
  });
};

// Hook para buscar informações de margem por conta (com verificação de permissão)
export const useMarginInfo = (accountNumber?: string) => {
  const { profile } = useAuth();
  const { data: showTraderDataSetting } = useSystemSetting('show_trader_data');
  
  return useQuery({
    queryKey: ['margin-info', accountNumber, profile?.email, showTraderDataSetting?.setting_value],
    queryFn: async () => {
      if (!accountNumber) return null;
      
      // Primeiro verifica se o usuário tem acesso à conta
      let accountQuery = supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber);
      
      // Aplicar mesma lógica de filtro
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        if (profile.email) {
          accountQuery = accountQuery.eq('user_email', profile.email);
        } else {
          return null;
        }
      } else if (profile?.role === 'manager') {
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        if (!showTraderData) {
          accountQuery = accountQuery.not('user_email', 'like', '%@trader%');
        }
      }
      
      const { data: accountData, error: accountError } = await accountQuery.single();
      
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
    enabled: !!accountNumber && !!profile,
    refetchInterval: 3000, // Dados menos críticos - 3 segundos
    staleTime: 1000,
    gcTime: 60000,
  });
};

// Hook para buscar posições abertas por conta (com verificação de permissão)
export const useOpenPositions = (accountNumber?: string) => {
  const { profile } = useAuth();
  const { data: showTraderDataSetting } = useSystemSetting('show_trader_data');
  
  return useQuery({
    queryKey: ['positions', accountNumber, profile?.email, showTraderDataSetting?.setting_value],
    queryFn: async () => {
      if (!accountNumber) return [];
      
      // Primeiro verifica se o usuário tem acesso à conta
      let accountQuery = supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber);
      
      // Aplicar mesma lógica de filtro
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        if (profile.email) {
          accountQuery = accountQuery.eq('user_email', profile.email);
        } else {
          return [];
        }
      } else if (profile?.role === 'manager') {
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        if (!showTraderData) {
          accountQuery = accountQuery.not('user_email', 'like', '%@trader%');
        }
      }
      
      const { data: accountData, error: accountError } = await accountQuery.single();
      
      if (accountError || !accountData) return [];
      
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

// Hook para buscar histórico de trades por conta (com verificação de permissão)
export const useTradeHistory = (accountNumber?: string) => {
  const { profile } = useAuth();
  const { data: showTraderDataSetting } = useSystemSetting('show_trader_data');
  
  return useQuery({
    queryKey: ['history', accountNumber, profile?.email, showTraderDataSetting?.setting_value],
    queryFn: async () => {
      if (!accountNumber) return [];
      
      // Primeiro verifica se o usuário tem acesso à conta
      let accountQuery = supabase
        .from('accounts')
        .select('id')
        .eq('account', accountNumber);
      
      // Aplicar mesma lógica de filtro
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        if (profile.email) {
          accountQuery = accountQuery.eq('user_email', profile.email);
        } else {
          return [];
        }
      } else if (profile?.role === 'manager') {
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        if (!showTraderData) {
          accountQuery = accountQuery.not('user_email', 'like', '%@trader%');
        }
      }
      
      const { data: accountData, error: accountError } = await accountQuery.single();
      
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
