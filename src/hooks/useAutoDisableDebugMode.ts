
import { useEffect, useRef } from 'react';
import { useSystemSetting, useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AUTO_DISABLE_MINUTES = 10;

export const useAutoDisableDebugMode = () => {
  const { profile } = useAuth();
  const { data: setting } = useSystemSetting('show_trader_data');
  const { mutate: updateSetting } = useUpdateSystemSetting();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Só executa para admins
    if (profile?.role !== 'admin') return;
    
    // Limpa timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Se a configuração está ativa e tem timestamp de ativação
    if (setting?.setting_value && setting?.activated_at) {
      const activatedAt = new Date(setting.activated_at);
      const now = new Date();
      const elapsedMs = now.getTime() - activatedAt.getTime();
      const remainingMs = (AUTO_DISABLE_MINUTES * 60 * 1000) - elapsedMs;

      console.log(`🕒 Debug mode ativo há ${Math.floor(elapsedMs / 1000)}s, restam ${Math.floor(remainingMs / 1000)}s`);

      if (remainingMs <= 0) {
        // Já passou do tempo, desativar imediatamente
        console.log('⏰ Tempo limite excedido, desativando debug mode automaticamente');
        updateSetting({ 
          settingKey: 'show_trader_data', 
          value: false 
        });

        toast({
          title: "Modo Debug Desativado",
          description: "O modo debug foi automaticamente desativado após 10 minutos.",
          variant: "default",
        });
      } else {
        // Configura timeout para desativar quando chegar no tempo limite
        timeoutRef.current = setTimeout(() => {
          console.log('⏰ Desativando debug mode automaticamente após 10 minutos');
          updateSetting({ 
            settingKey: 'show_trader_data', 
            value: false 
          });

          toast({
            title: "Modo Debug Desativado",
            description: "O modo debug foi automaticamente desativado após 10 minutos.",
            variant: "default",
          });
        }, remainingMs);

        console.log(`⏰ Timeout configurado para ${Math.floor(remainingMs / 1000)}s`);
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [setting?.setting_value, setting?.activated_at, profile?.role, updateSetting, toast]);

  // Retorna informações úteis sobre o estado
  const getTimeRemaining = () => {
    if (!setting?.setting_value || !setting?.activated_at) return null;
    
    const activatedAt = new Date(setting.activated_at);
    const now = new Date();
    const elapsedMs = now.getTime() - activatedAt.getTime();
    const remainingMs = (AUTO_DISABLE_MINUTES * 60 * 1000) - elapsedMs;
    
    return Math.max(0, Math.floor(remainingMs / 1000));
  };

  return {
    timeRemainingSeconds: getTimeRemaining(),
    autoDisableMinutes: AUTO_DISABLE_MINUTES,
  };
};
