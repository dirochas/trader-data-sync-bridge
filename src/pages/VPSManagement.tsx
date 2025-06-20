import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTradingAccounts } from '@/hooks/useTradingData';
import { AppLayout } from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditVPSModal from '@/components/EditVPSModal';
import { 
  Server, 
  Monitor,
  Wifi,
  WifiOff,
  Users,
  Activity
} from 'lucide-react';

const VPSManagement = () => {
  const { data: accounts = [] } = useTradingAccounts();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { toast } = useToast();
  
  const [editVPSModalOpen, setEditVPSModalOpen] = useState(false);
  const [selectedVPS, setSelectedVPS] = useState<any>(null);
  
  // Agrupar contas por VPS único (usando vps_unique_id)
  const vpsGroups = accounts.reduce((acc, account) => {
    const vpsUniqueId = account.vps_unique_id || 'Unknown VPS';
    const vpsDisplayName = account.vps || 'Unknown VPS';
    
    if (!acc[vpsUniqueId]) {
      acc[vpsUniqueId] = {
        vpsUniqueId,
        vpsDisplayName,
        accounts: [],
        totalAccounts: 0,
        connectedAccounts: 0,
        totalBalance: 0,
        totalEquity: 0,
        lastUpdate: new Date(0)
      };
    }
    
    acc[vpsUniqueId].accounts.push(account);
    acc[vpsUniqueId].totalAccounts++;
    acc[vpsUniqueId].totalBalance += Number(account.balance) || 0;
    acc[vpsUniqueId].totalEquity += Number(account.equity) || 0;
    
    const accountUpdate = new Date(account.updated_at);
    if (accountUpdate > acc[vpsUniqueId].lastUpdate) {
      acc[vpsUniqueId].lastUpdate = accountUpdate;
    }
    
    // Conta como conectada se foi atualizada nos últimos 2 minutos
    const now = new Date();
    const diffInMinutes = (now.getTime() - accountUpdate.getTime()) / (1000 * 60);
    if (diffInMinutes <= 2) {
      acc[vpsUniqueId].connectedAccounts++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const vpsData = Object.values(vpsGroups);
  
  const getVPSStatus = (vps: any) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - vps.lastUpdate.getTime()) / (1000 * 60);
    
    if (diffInMinutes <= 2) {
      return { status: 'Online', color: 'text-emerald-500', icon: Wifi };
    } else if (diffInMinutes <= 10) {
      return { status: 'Delayed', color: 'text-amber-500', icon: Wifi };
    } else {
      return { status: 'Offline', color: 'text-rose-400', icon: WifiOff };
    }
  };

  const handleViewVPS = (vpsUniqueId: string) => {
    navigate('/accounts', { state: { vpsFilter: vpsUniqueId } });
  };

  const handleEditVPS = async (vps: any) => {
    if (!permissions.canEditVPSDisplayName) {
      console.log('⚠️ Usuário sem permissão para editar nomes de VPS');
      return;
    }
    
    // Buscar dados completos do VPS do banco de dados
    try {
      const { data: vpsData, error } = await supabase
        .from('vps_servers')
        .select('*')
        .eq('vps_unique_id', vps.vpsUniqueId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados do VPS:', error);
      }

      setSelectedVPS({
        vpsUniqueId: vps.vpsUniqueId,
        displayName: vps.vpsDisplayName,
        host: vpsData?.host || '',
        port: vpsData?.port || '3389',
        username: vpsData?.username || '',
        password: vpsData?.password || ''
      });
      setEditVPSModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar dados do VPS:', error);
      // Fallback para dados básicos
      setSelectedVPS({
        vpsUniqueId: vps.vpsUniqueId,
        displayName: vps.vpsDisplayName,
        host: '',
        port: '3389',
        username: '',
        password: ''
      });
      setEditVPSModalOpen(true);
    }
  };

  const handleConnectVPS = async (vps: any) => {
    // Buscar dados de conexão do banco
    try {
      const { data: vpsData, error } = await supabase
        .from('vps_servers')
        .select('host, port, username, password')
        .eq('vps_unique_id', vps.vpsUniqueId)
        .single();

      if (error || !vpsData?.host) {
        toast({
          title: "Configuração necessária",
          description: "Configure primeiro os dados de conexão RDP deste VPS.",
          variant: "destructive",
        });
        handleEditVPS(vps);
        return;
      }

      // Gerar arquivo RDP corrigido - SEM senha salva no arquivo
      const rdpContent = [
        'screen mode id:i:2',
        'use multimon:i:0',
        'desktopwidth:i:1920',
        'desktopheight:i:1080',
        'session bpp:i:32',
        'compression:i:1',
        'keyboardhook:i:2',
        'audiocapturemode:i:0',
        'videoplaybackmode:i:1',
        'connection type:i:7',
        'displayconnectionbar:i:1',
        'autoreconnection enabled:i:1',
        'authentication level:i:2',
        'prompt for credentials:i:0',
        `full address:s:${vpsData.host}:${vpsData.port || '3389'}`,
        `username:s:${vpsData.username || ''}`,
        // Removido: linha da senha - deixa o Windows pedir
      ].join('\r\n');

      const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vps.vpsDisplayName}.rdp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Conectando ao VPS",
        description: "Arquivo RDP baixado. O Windows pedirá a senha na conexão.",
      });
    } catch (error) {
      console.error('Erro ao conectar VPS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a conexão RDP.",
        variant: "destructive",
      });
    }
  };

  const totalVPS = vpsData.length;
  const onlineVPS = vpsData.filter(vps => getVPSStatus(vps).status === 'Online').length;
  const totalAccountsAcrossVPS = vpsData.reduce((sum, vps) => sum + vps.totalAccounts, 0);
  const totalEquityAcrossVPS = vpsData.reduce((sum, vps) => sum + vps.totalEquity, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
            VPS Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerenciamento de servidores VPS e infraestrutura de trading
            {permissions.isInvestor && <span className="ml-2 text-purple-400">(Modo Somente Leitura)</span>}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="tech-card tech-card-hover card-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total VPS</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <Server className="h-5 w-5 text-sky-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">{totalVPS}</div>
              <p className="text-xs text-emerald-500">
                {onlineVPS} online
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Online VPS</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <Wifi className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-emerald-500">{onlineVPS}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalVPS > 0 ? ((onlineVPS / totalVPS) * 100).toFixed(0) : 0}% uptime
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-purple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Accounts</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">{totalAccountsAcrossVPS}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Distribuídas nos VPS
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-yellow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Equity</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">
                US$ {totalEquityAcrossVPS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Equity total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* VPS Table */}
        <Card className="tech-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">VPS Servers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">VPS Name</TableHead>
                    <TableHead className="font-medium">Unique ID</TableHead>
                    <TableHead className="text-right font-medium">Accounts</TableHead>
                    <TableHead className="text-right font-medium">Connected</TableHead>
                    <TableHead className="text-right font-medium">Total Balance</TableHead>
                    <TableHead className="text-right font-medium">Total Equity</TableHead>
                    <TableHead className="font-medium">Last Update</TableHead>
                    <TableHead className="font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vpsData.map((vps) => {
                    const status = getVPSStatus(vps);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={vps.vpsUniqueId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{vps.vpsDisplayName}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {vps.vpsUniqueId.length > 20 ? 
                            `${vps.vpsUniqueId.substring(0, 20)}...` : 
                            vps.vpsUniqueId
                          }
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {vps.totalAccounts}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={vps.connectedAccounts > 0 ? 'text-emerald-500 font-medium' : 'text-rose-400 font-medium'}>
                            {vps.connectedAccounts}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          US$ {vps.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          US$ {vps.totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {vps.lastUpdate.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                              onClick={() => handleConnectVPS(vps)}
                              title="Conectar via RDP"
                            >
                              <Monitor className="h-4 w-4 mr-1" />
                              RDP
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300"
                              onClick={() => handleViewVPS(vps.vpsUniqueId)}
                            >
                              <Monitor className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {permissions.canEditVPSDisplayName && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                onClick={() => handleEditVPS(vps)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {vpsData.length === 0 && (
              <div className="text-center py-12">
                <Server className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum VPS detectado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Conecte seus EAs para começar a detectar VPS automaticamente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para editar VPS */}
      {permissions.canEditVPSDisplayName && (
        <EditVPSModal
          isOpen={editVPSModalOpen}
          onClose={() => setEditVPSModalOpen(false)}
          vps={selectedVPS}
          onVPSUpdated={() => {
            // Invalidar queries para atualizar dados
            // (será implementado no componente modal)
          }}
        />
      )}
    </AppLayout>
  );
};

export default VPSManagement;
