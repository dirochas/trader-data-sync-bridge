
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Save, Eye, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/AppLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useShowTraderDataSetting } from '@/hooks/useSystemSettings';
import { useAutoDisableDebugMode } from '@/hooks/useAutoDisableDebugMode';

const Settings = () => {
  const { isAdmin } = usePermissions();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Hook para gerenciar a configuração do sistema
  const { isEnabled: showTraderData, toggle: toggleTraderData, isLoading } = useShowTraderDataSetting();
  
  // Hook para auto-desativação
  const { timeRemainingSeconds, autoDisableMinutes } = useAutoDisableDebugMode();

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      // Ativando - mostrar modal de confirmação
      setShowConfirmDialog(true);
    } else {
      // Desativando - direto
      toggleTraderData(false);
    }
  };

  const handleConfirmActivation = () => {
    toggleTraderData(true);
    setShowConfirmDialog(false);
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configurações do sistema e parâmetros operacionais
            </p>
          </div>
          <Button disabled>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Alert quando modo debug ativo */}
        {isAdmin && showTraderData && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Modo Debug Ativo:</strong> Visualizando dados de Cliente Trader para suporte técnico
                  {timeRemainingSeconds !== null && (
                    <span className="block text-sm mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Desativação automática em: <strong>{formatTimeRemaining(timeRemainingSeconds)}</strong>
                    </span>
                  )}
                </span>
                <Badge variant="outline" className="ml-2 border-orange-300 text-orange-700">
                  <Eye className="w-3 h-3 mr-1" />
                  Visualização Ampliada
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Card de Configurações do Sistema - Apenas para Admin */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Mostrar Dados Cliente Trader */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Mostrar dados Cliente Trader</h3>
                    {showTraderData && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                        {timeRemainingSeconds !== null && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeRemaining(timeRemainingSeconds)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Permite visualizar contas e VPS de usuários Cliente Trader para suporte técnico.
                    <br />
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Por padrão desabilitado para manter isolamento de dados. Auto-desativa em {autoDisableMinutes} minutos.
                    </span>
                  </p>
                </div>
                <Switch
                  checked={showTraderData}
                  onCheckedChange={handleToggleChange}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Original - Placeholder para outras configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">System Settings</h3>
              <p className="text-muted-foreground mb-6">
                Painel de configurações do sistema será implementado aqui.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Configurações de tempo de resposta</p>
                <p>• Parâmetros de conexão</p>
                <p>• Configurações de notificações</p>
                <p>• Backup e manutenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Confirmação */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Ativar Visualização de Dados Cliente Trader?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Você está prestes a <strong>ativar o modo debug</strong> que permite visualizar 
                  contas e VPS de usuários Cliente Trader.
                </p>
                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>⚠️ Atenção:</strong> Este modo é destinado apenas para suporte técnico 
                    e será <strong>automaticamente desativado em {autoDisableMinutes} minutos</strong>.
                  </p>
                </div>
                <p className="text-sm">
                  Deseja continuar?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmActivation}>
                Sim, Ativar Modo Debug
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Settings;
