import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTradingAccounts } from '@/hooks/useTradingData';
import { usePagination } from '@/hooks/usePagination';
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
  DollarSign
} from 'lucide-react';

const VPSManagement = () => {
  const { data: accounts = [] } = useTradingAccounts();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { toast } = useToast();
  
  const [editVPSModalOpen, setEditVPSModalOpen] = useState(false);
  const [selectedVPS, setSelectedVPS] = useState<any>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
        lastUpdate: new Date(0),
        cost: 0,
        due_date: null
      };
    }
    
    acc[vpsUniqueId].accounts.push(account);
    acc[vpsUniqueId].totalAccounts++;
    
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

  // Buscar dados de VPS servers para obter cost e due_date
  const [vpsServersData, setVpsServersData] = useState<Record<string, any>>({});

  React.useEffect(() => {
    const fetchVPSServersData = async () => {
      try {
        const { data: vpsData, error } = await supabase
          .from('vps_servers')
          .select('vps_unique_id, cost, due_date');

        if (error) {
          console.error('Erro ao buscar dados dos VPS servers:', error);
          return;
        }

        const vpsMap = vpsData.reduce((acc, vps) => {
          acc[vps.vps_unique_id] = {
            cost: vps.cost || 0,
            due_date: vps.due_date
          };
          return acc;
        }, {});

        setVpsServersData(vpsMap);
      } catch (error) {
        console.error('Erro ao buscar dados dos VPS servers:', error);
      }
    };

    fetchVPSServersData();
  }, []);

  // Atualizar vpsGroups com dados de cost e due_date
  const vpsData = Object.values(vpsGroups).map(vps => ({
    ...vps,
    cost: vpsServersData[vps.vpsUniqueId]?.cost || 0,
    due_date: vpsServersData[vps.vpsUniqueId]?.due_date || null
  }));
  
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
        password: vpsData?.password || '',
        cost: vpsData?.cost || 0,
        due_date: vpsData?.due_date || ''
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
        password: '',
        cost: 0,
        due_date: ''
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
  const totalCostAcrossVPS = vpsData.reduce((sum, vps) => sum + (vps.cost || 0), 0);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleVPSUpdated = () => {
    // Recarregar dados dos VPS servers após atualização
    const fetchVPSServersData = async () => {
      try {
        const { data: vpsData, error } = await supabase
          .from('vps_servers')
          .select('vps_unique_id, cost, due_date');

        if (error) {
          console.error('Erro ao buscar dados dos VPS servers:', error);
          return;
        }

        const vpsMap = vpsData.reduce((acc, vps) => {
          acc[vps.vps_unique_id] = {
            cost: vps.cost || 0,
            due_date: vps.due_date
          };
          return acc;
        }, {});

        setVpsServersData(vpsMap);
      } catch (error) {
        console.error('Erro ao buscar dados dos VPS servers:', error);
      }
    };

    fetchVPSServersData();
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Number of page buttons to show
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

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
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Cost</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">
                US$ {totalCostAcrossVPS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Custo mensal total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* VPS Table */}
        <Card className="tech-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">VPS Servers</CardTitle>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Mostrar:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500 dark:text-gray-400">por página</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">VPS Name</TableHead>
                    <TableHead className="text-right font-medium">Accounts</TableHead>
                    <TableHead className="text-right font-medium">Connected</TableHead>
                    <TableHead className="text-right font-medium">Cost (US$)</TableHead>
                    <TableHead className="font-medium">Due Date</TableHead>
                    <TableHead className="font-medium">Last Update</TableHead>
                    <TableHead className="font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVpsData.map((vps) => {
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
                        <TableCell className="text-right font-medium">
                          {vps.totalAccounts}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={vps.connectedAccounts > 0 ? 'text-emerald-500 font-medium' : 'text-rose-400 font-medium'}>
                            {vps.connectedAccounts}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {vps.cost ? vps.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(vps.due_date)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/20">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, vpsData.length)} de {vpsData.length} VPS
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={previousPage}
                        className={!hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => goToPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={nextPage}
                        className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
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
          onVPSUpdated={handleVPSUpdated}
        />
      )}
    </AppLayout>
  );
};

export default VPSManagement;
