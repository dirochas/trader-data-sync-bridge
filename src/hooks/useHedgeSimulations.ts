
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

export interface HedgeSimulation {
  id: string;
  user_id: string;
  user_email?: string;
  simulation_name?: string;
  
  // Input Parameters
  account_size: number;
  test_cost: number;
  target_pct_f1: number;
  target_pct_f2: number;
  max_dd_pct: number;
  profit_division_pct: number;
  
  extra_hedge_amount_f1?: number;
  extra_hedge_amount_f2?: number;
  extra_hedge_amount_funded?: number;
  
  safety_multiplier_f1?: number;
  safety_multiplier_f2?: number;
  safety_multiplier_funded?: number;
  
  funded_target_amount?: number;
  test_refund?: boolean;
  
  // Calculated Results - Phase 1
  recovery_amount_f1?: number;
  ratio_f1?: number;
  phase_cost_f1?: number;
  min_real_deposit_f1?: number;
  final_balance_real_account_f1_fail?: number;
  remaining_balance_f1?: number;
  
  // Calculated Results - Phase 2
  recovery_amount_f2?: number;
  ratio_f2?: number;
  phase_cost_f2?: number;
  min_real_deposit_f2?: number;
  additional_deposit_f2?: number;
  final_balance_real_account_f2_fail?: number;
  remaining_balance_f2?: number;
  
  // Calculated Results - Funded Phase
  recovery_amount_funded?: number;
  ratio_funded?: number;
  phase_cost_funded?: number;
  min_real_deposit_funded?: number;
  trader_profit_share?: number;
  test_refund_amount?: number;
  
  // Totals
  total_test_cost?: number;
  total_used?: number;
  total_withdraw?: number;
  total_profit?: number;
  roi_percentage?: number;
  propfirm_breakeven?: number;
  
  // Profit Projections
  profit_projection_f1?: number;
  profit_projection_f2?: number;
  profit_projection_funded?: number;
  
  // Operational
  notes?: string;
  implementation_status?: string;
  created_at: string;
  updated_at?: string;
  calculated_at?: string;
}

// Hook para listar todas as simulações seguindo o padrão de accounts/settings
export const useHedgeSimulations = () => {
  const { user, profile } = useAuth();
  const { isAdmin } = usePermissions();
  
  return useQuery({
    queryKey: ['hedge-simulations', user?.email, isAdmin],
    queryFn: async () => {
      if (!user?.email || !profile) {
        console.log('No user authenticated, returning empty array');
        return [];
      }

      console.log('Fetching simulations for user:', user.email, 'isAdmin:', isAdmin);
      
      let query = supabase.from('hedge_simulations').select('*');
      
      // Aplicar filtro baseado no role, igual como funciona em accounts
      if (!isAdmin) {
        // Usuários não-admin só veem suas próprias simulações
        query = query.eq('user_email', user.email);
        console.log('Applying email filter for non-admin user:', user.email);
      } else {
        console.log('Admin user - showing all simulations');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching simulations:', error);
        throw error;
      }
      
      console.log('Fetched simulations:', data?.length || 0, 'items');
      return data as HedgeSimulation[];
    },
    enabled: !!(user?.email && profile),
    refetchInterval: 30000,
  });
};

// Hook para buscar uma simulação específica
export const useHedgeSimulation = (id?: string) => {
  const { user, profile } = useAuth();
  const { isAdmin } = usePermissions();
  
  return useQuery({
    queryKey: ['hedge-simulation', id, user?.email, isAdmin],
    queryFn: async () => {
      if (!id || !user?.email || !profile) return null;
      
      console.log('Fetching simulation:', id, 'for user:', user.email, 'isAdmin:', isAdmin);
      
      let query = supabase.from('hedge_simulations').select('*').eq('id', id);
      
      // Aplicar filtro de segurança igual como funciona em accounts
      if (!isAdmin) {
        query = query.eq('user_email', user.email);
        console.log('Applying email filter for simulation access');
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error('Error fetching simulation:', error);
        throw error;
      }
      
      return data as HedgeSimulation;
    },
    enabled: !!(id && user?.email && profile),
  });
};

// Hook para criar nova simulação
export const useCreateHedgeSimulation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  return useMutation({
    mutationFn: async (simulation: Omit<HedgeSimulation, 'id' | 'user_id' | 'user_email' | 'created_at' | 'updated_at'>) => {
      if (!user?.id || !user?.email) {
        throw new Error('User not authenticated');
      }

      console.log('Creating simulation for user:', user.email);
      
      // Sempre associar ao email do usuário atual
      const simulationWithUser = {
        ...simulation,
        user_id: user.id,
        user_email: user.email
      };
      
      const { data, error } = await supabase
        .from('hedge_simulations')
        .insert([simulationWithUser])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating simulation:', error);
        throw error;
      }
      
      console.log('Created simulation:', data.id);
      return data as HedgeSimulation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations', user?.email, isAdmin] });
    },
  });
};

// Hook para atualizar simulação
export const useUpdateHedgeSimulation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  return useMutation({
    mutationFn: async ({ id, user_id, user_email, ...updates }: Partial<HedgeSimulation> & { id: string }) => {
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      console.log('Updating simulation:', id, 'for user:', user.email, 'isAdmin:', isAdmin);
      
      let query = supabase.from('hedge_simulations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      // Aplicar verificação de permissão igual como funciona em accounts
      if (!isAdmin) {
        query = query.eq('user_email', user.email);
        console.log('Applying email filter for simulation update');
      }
      
      const { data, error } = await query.select().single();
      
      if (error) {
        console.error('Error updating simulation:', error);
        throw error;
      }
      
      return data as HedgeSimulation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations', user?.email, isAdmin] });
      queryClient.invalidateQueries({ queryKey: ['hedge-simulation', data.id, user?.email, isAdmin] });
    },
  });
};

// Hook para deletar simulação
export const useDeleteHedgeSimulation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      console.log('Deleting simulation:', id, 'for user:', user.email, 'isAdmin:', isAdmin);
      
      let query = supabase.from('hedge_simulations').delete().eq('id', id);
      
      // Aplicar verificação de permissão igual como funciona em accounts
      if (!isAdmin) {
        query = query.eq('user_email', user.email);
        console.log('Applying email filter for simulation deletion');
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error deleting simulation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations', user?.email, isAdmin] });
    },
  });
};
