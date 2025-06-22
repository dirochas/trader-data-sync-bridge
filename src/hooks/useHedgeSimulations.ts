
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HedgeSimulation {
  id: string;
  user_id: string;
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

// Hook para listar todas as simulações (filtrando pelo usuário autenticado)
export const useHedgeSimulations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['hedge-simulations', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user authenticated, returning empty array');
        return [];
      }

      console.log('Fetching simulations for user:', user.id);
      
      const { data, error } = await supabase
        .from('hedge_simulations')
        .select('*')
        .eq('user_id', user.id) // Filtragem explicita adicional
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching simulations:', error);
        throw error;
      }
      
      console.log('Fetched simulations:', data?.length || 0, 'items');
      return data as HedgeSimulation[];
    },
    enabled: !!user?.id, // Só executa se o usuário estiver autenticado
    refetchInterval: 30000,
  });
};

// Hook para buscar uma simulação específica
export const useHedgeSimulation = (id?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['hedge-simulation', id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      
      console.log('Fetching simulation:', id, 'for user:', user.id);
      
      const { data, error } = await supabase
        .from('hedge_simulations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Filtragem explicita adicional
        .single();
      
      if (error) {
        console.error('Error fetching simulation:', error);
        throw error;
      }
      
      return data as HedgeSimulation;
    },
    enabled: !!(id && user?.id),
  });
};

// Hook para criar nova simulação
export const useCreateHedgeSimulation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (simulation: Omit<HedgeSimulation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating simulation for user:', user.id);
      
      // Explicitamente definir o user_id para garantir que seja associado ao usuário correto
      const simulationWithUser = {
        ...simulation,
        user_id: user.id
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
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations', user?.id] });
    },
  });
};

// Hook para atualizar simulação
export const useUpdateHedgeSimulation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, user_id, ...updates }: Partial<HedgeSimulation> & { id: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Updating simulation:', id, 'for user:', user.id);
      
      // Remove user_id do updates para não tentar alterá-lo e adiciona verificação explicita
      const { data, error } = await supabase
        .from('hedge_simulations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Verifica se pertence ao usuário
        .select()
        .single();
      
      if (error) {
        console.error('Error updating simulation:', error);
        throw error;
      }
      
      return data as HedgeSimulation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hedge-simulation', data.id, user?.id] });
    },
  });
};

// Hook para deletar simulação
export const useDeleteHedgeSimulation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Deleting simulation:', id, 'for user:', user.id);
      
      const { error } = await supabase
        .from('hedge_simulations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Verifica se pertence ao usuário
      
      if (error) {
        console.error('Error deleting simulation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations', user?.id] });
    },
  });
};
