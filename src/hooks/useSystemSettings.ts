
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: boolean;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

// Hook para buscar uma configuração específica
export const useSystemSetting = (settingKey: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['system-setting', settingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .maybeSingle();
      
      if (error) throw error;
      return data as SystemSetting | null;
    },
    enabled: !!profile,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 60000, // Garbage collection após 1 minuto
  });
};

// Hook para atualizar configurações (apenas admin)
export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ settingKey, value }: { settingKey: string; value: boolean }) => {
      // Verificação de segurança no frontend
      if (profile?.role !== 'admin') {
        throw new Error('Apenas administradores podem alterar configurações do sistema');
      }
      
      const updateData: any = { 
        setting_key: settingKey, 
        setting_value: value 
      };

      // Se está ativando, definir timestamp; se desativando, limpar timestamp
      if (value) {
        updateData.activated_at = new Date().toISOString();
      } else {
        updateData.activated_at = null;
      }
      
      const { data, error } = await supabase
        .from('system_settings')
        .upsert(
          updateData,
          { 
            onConflict: 'setting_key' 
          }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data as SystemSetting;
    },
    onSuccess: (data) => {
      // Invalida cache da configuração específica
      queryClient.invalidateQueries({ 
        queryKey: ['system-setting', data.setting_key] 
      });
      
      console.log('✅ Configuração atualizada:', data.setting_key, '=', data.setting_value);
      if (data.activated_at) {
        console.log('🕒 Timestamp de ativação:', data.activated_at);
      }
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar configuração:', error);
    },
  });
};

// Hook específico para a configuração "show_trader_data"
export const useShowTraderDataSetting = () => {
  const settingQuery = useSystemSetting('show_trader_data');
  const updateMutation = useUpdateSystemSetting();
  
  const isEnabled = settingQuery.data?.setting_value ?? false;
  
  const toggle = (value: boolean) => {
    updateMutation.mutate({ 
      settingKey: 'show_trader_data', 
      value 
    });
  };
  
  return {
    isEnabled,
    toggle,
    isLoading: settingQuery.isLoading || updateMutation.isPending,
    error: settingQuery.error || updateMutation.error,
    activatedAt: settingQuery.data?.activated_at,
  };
};
