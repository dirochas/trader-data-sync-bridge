
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HedgeSimulation {
  id: string;
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

// Hook para listar todas as simulações
export const useHedgeSimulations = () => {
  return useQuery({
    queryKey: ['hedge-simulations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hedge_simulations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as HedgeSimulation[];
    },
    refetchInterval: 30000,
  });
};

// Hook para buscar uma simulação específica
export const useHedgeSimulation = (id?: string) => {
  return useQuery({
    queryKey: ['hedge-simulation', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('hedge_simulations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as HedgeSimulation;
    },
    enabled: !!id,
  });
};

// Hook para criar nova simulação
export const useCreateHedgeSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (simulation: Omit<HedgeSimulation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hedge_simulations')
        .insert([simulation])
        .select()
        .single();
      
      if (error) throw error;
      return data as HedgeSimulation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations'] });
    },
  });
};

// Hook para atualizar simulação
export const useUpdateHedgeSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HedgeSimulation> & { id: string }) => {
      const { data, error } = await supabase
        .from('hedge_simulations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as HedgeSimulation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations'] });
      queryClient.invalidateQueries({ queryKey: ['hedge-simulation', data.id] });
    },
  });
};

// Hook para deletar simulação
export const useDeleteHedgeSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hedge_simulations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hedge-simulations'] });
    },
  });
};
