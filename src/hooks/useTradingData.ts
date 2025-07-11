
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

// Hook otimizado para buscar TODAS as contas de trading (com filtro por usuário e JOIN com VPS e Groups)
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
          vps_servers(display_name),
          account_groups(id, name, color)
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
      } else if (profile?.role === 'admin' || profile?.role === 'manager') {
        // Admin e Manager veem baseado na configuração do sistema
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        
        if (!showTraderData) {
          // Se configuração desabilitada, filtrar para mostrar apenas contas não-trader
          query = query.not('user_email', 'like', '%@trader%'); // ou outro critério para identificar traders
          console.log(`${profile.role === 'admin' ? '👑' : '👔'} ${profile.role} - modo restrito (sem dados Cliente Trader)`);
        } else {
          console.log(`${profile.role === 'admin' ? '👑' : '👔'} ${profile.role} - modo debug ativo (visualizando dados Cliente Trader)`);
        }
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear os dados para incluir vps e group como propriedades diretas
      return (data || []).map(account => ({
        ...account,
        vps: account.vps_servers?.display_name || account.vps_unique_id || 'N/A',
        group: account.account_groups
      }));
    },
    enabled: !!profile, // Só executa quando tem perfil carregado
    refetchInterval: 5000, // 🔧 OTIMIZADO: 5s para contas (menos crítico que posições)
    staleTime: 2000, // 🔧 OTIMIZADO: 2s stale time
    gcTime: 60000, // 🔧 OTIMIZADO: Cache por 1 minuto
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
          vps_servers(display_name),
          account_groups(id, name, color)
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
      } else if (profile?.role === 'admin' || profile?.role === 'manager') {
        // Admin e Manager veem baseado na configuração do sistema
        const showTraderData = showTraderDataSetting?.setting_value ?? false;
        
        if (!showTraderData) {
          // Se configuração desabilitada, filtrar para mostrar apenas contas não-trader
          query = query.not('user_email', 'like', '%@trader%');
        }
      }
      
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // Mapear os dados para incluir vps e group como propriedades diretas
      if (data) {
        return {
          ...data,
          vps: data.vps_servers?.display_name || data.vps_unique_id || 'N/A',
          group: data.account_groups
        };
      }
      
      return data;
    },
    enabled: !!accountNumber && !!profile,
    refetchInterval: 5000, // 🔧 OTIMIZADO: 5s para conta individual
    staleTime: 2000, // 🔧 OTIMIZADO: 2s stale time
    gcTime: 60000, // 🔧 OTIMIZADO: Cache por 1 minuto
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
      } else if (profile?.role === 'admin' || profile?.role === 'manager') {
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
    refetchInterval: 10000, // 🔧 OTIMIZADO: 10s para margem (menos crítico)
    staleTime: 3000, // 🔧 OTIMIZADO: 3s stale time
    gcTime: 120000, // 🔧 OTIMIZADO: Cache por 2 minutos
  });
};

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
      } else if (profile?.role === 'admin' || profile?.role === 'manager') {
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
    refetchInterval: 3000, // 🔧 OTIMIZADO: 3s para posições (mais crítico mas otimizado)
    staleTime: 1000, // 🔧 OTIMIZADO: 1s stale time
    gcTime: 30000, // Mantém cache curto para dados críticos
  });
};

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
      } else if (profile?.role === 'admin' || profile?.role === 'manager') {
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
    refetchInterval: 30000, // 🔧 OTIMIZADO: 30s para histórico (menos crítico)
    staleTime: 10000, // 🔧 OTIMIZADO: 10s stale time
    gcTime: 300000, // 🔧 OTIMIZADO: Cache por 5 minutos
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
          // 🔧 OTIMIZADO: Invalidação mais inteligente - apenas se dados são antigos
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
          // 🔧 OTIMIZADO: Invalidação com debounce para margem
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['margin-info'] });
          }, 2000); // 2s debounce
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'positions' },
        () => {
          // 🔧 CRÍTICO: Posições mantêm invalidação imediata mas otimizada
          queryClient.invalidateQueries({ 
            queryKey: ['positions'],
            refetchType: 'all'
          });
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'history' },
        () => {
          // 🔧 OTIMIZADO: Histórico com debounce maior
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
          }, 5000); // 5s debounce
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'account_groups' },
        () => {
          // 🔧 OTIMIZADO: Groups com debounce
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['account-groups'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }, 3000); // 3s debounce
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 🔧 NOVO: Hook para detectar inatividade da aba/usuário
  useEffect(() => {
    let isTabVisible = true;
    let inactivityTimer: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      
      if (isTabVisible) {
        // Aba voltou a ficar ativa - invalidar dados críticos
        queryClient.invalidateQueries({ queryKey: ['positions'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        console.log('🔄 Aba ativa - atualizando dados críticos');
      }
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Após 5 minutos de inatividade, aumentar intervalos
        if (isTabVisible) {
          console.log('😴 Usuário inativo - reduzindo frequência de queries');
          // A query vai automaticamente usar intervalos maiores devido ao staleTime
        }
      }, 5 * 60 * 1000); // 5 minutos
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      clearTimeout(inactivityTimer);
    };
  }, [queryClient]);
};
