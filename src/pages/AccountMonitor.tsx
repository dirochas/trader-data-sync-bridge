import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTradingAccounts, getConnectionStatus } from '@/hooks/useTradingData';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import ConnectionStatus from '@/components/ConnectionStatus';
import EditAccountModal from '@/components/EditAccountModal';
import CloseAllPositionsModal from '@/components/CloseAllPositionsModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Filter,
  Archive,
  UserCheck
} from 'lucide-react';

const AccountMonitor = () => {
  const { data: accounts = [], isLoading } = useTradingAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const { profile } = useAuth();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [closeAllModalOpen, setCloseAllModalOpen] = useState(false);
  const [selectedAccountForClose, setSelectedAccountForClose] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Query para buscar lista de clientes únicos usando nickname (apenas para admin/manager)
  const { data: clientsList = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      if (!permissions.isAdminOrManager) return [];
      
      // Buscar emails únicos das contas e depois buscar os perfis correspondentes
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('user_email')
        .not('user_email', 'is', null)
        .neq('user_email', '');
      
      if (accountsError) throw accountsError;
      
      // Extrair emails únicos com validação mais robusta
      const validEmails = accountsData?.map(acc => acc.user_email).filter(email => email && email.trim() !== '') || [];
      const uniqueEmails = [...new Set(validEmails)];
      
      if (uniqueEmails.length === 0) return [];
      
      // Buscar perfis correspondentes aos emails usando nickname
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('nickname, email')
        .in('email', uniqueEmails)
        .not('nickname', 'is', null)
        .neq('nickname', '');
      
      if (profilesError) throw profilesError;
      
      return profilesData || [];
    },
    enabled: permissions.isAdminOrManager,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000,
    gcTime: 60000,
  });

  // Query otimizada para posições abertas COM FILTRO POR USUÁRIO
  const { data: allOpenPositions = [] } = useQuery({
    queryKey: ['all-open-positions', profile?.email],
    queryFn: async () => {
      let query = supabase.from('positions').select(`
        *,
        accounts!inner(account, user_email)
      `);
      
      // APLICAR FILTRO POR USUÁRIO se for cliente
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        if (profile.email) {
          query = query.eq('accounts.user_email', profile.email);
          console.log('🔍 Filtrando posições para usuário:', profile.email);
        } else {
          console.log('⚠️ Cliente sem email - não mostrará posições');
          return [];
        }
      } else {
        console.log('👑 Admin/Manager - mostrando todas as posições');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar posições:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!profile,
    refetchInterval: 1000,
    staleTime: 300,
    gcTime: 30000,
  });

  // Query otimizada para trades do dia COM FILTRO POR USUÁRIO
  const { data: todayTrades = [] } = useQuery({
    queryKey: ['todays-trades', profile?.email],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      let query = supabase.from('history').select(`
        *,
        accounts!inner(account, user_email)
      `).gte('close_time', startOfDay.toISOString());
      
      // APLICAR FILTRO POR USUÁRIO se for cliente
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        if (profile.email) {
          query = query.eq('accounts.user_email', profile.email);
        } else {
          return [];
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
    refetchInterval: 5000,
    staleTime: 2000,
    gcTime: 60000,
  });

  // Query para enriquecer contas com dados dos perfis de usuário (usando nickname)
  const { data: enrichedAccountsData = [] } = useQuery({
    queryKey: ['enriched-accounts', profile?.email],
    queryFn: async () => {
      if (!accounts.length) return [];
      
      let query = supabase
        .from('accounts')
        .select(`
          *,
          vps_servers(display_name)
        `);
      
      // Aplicar filtros baseados no papel do usuário
      query = query.in('status', ['active']);
      
      if (profile?.role && ['client_trader', 'client_investor'].includes(profile.role)) {
        if (profile.email) {
          query = query.eq('user_email', profile.email);
        } else {
          return [];
        }
      }
      
      const { data: accountsWithVps, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar perfis separadamente para evitar problemas de relacionamento
      if (!accountsWithVps?.length) return [];
      
      const userEmails = [...new Set(accountsWithVps.map(acc => acc.user_email).filter(Boolean))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('nickname, last_name, email')
        .in('email', userEmails);
      
      if (profilesError) throw profilesError;
      
      // Combinar dados das contas com perfis
      const enrichedData = accountsWithVps.map(account => ({
        ...account,
        profiles: profilesData?.find(profile => profile.email === account.user_email) || null
      }));
      
      return enrichedData;
    },
    enabled: !!profile && accounts.length > 0,
    refetchInterval: 1500,
    staleTime: 500,
    gcTime: 30000,
  });

  // Função para obter nickname do cliente baseado no email
  const getClientNickname = (userEmail: string) => {
    if (!enrichedAccountsData.length) return 'N/A';
    
    const account = enrichedAccountsData.find(acc => acc.user_email === userEmail);
    return account?.profiles?.nickname || 'N/A';
  };

  const getOpenTradesCount = (accountId: string) => {
    return allOpenPositions.filter(pos => pos.account_id === accountId).length;
  };

  const getOpenPnL = (account: any) => {
    return Number(account.profit || 0);
  };

  const getDayProfit = (accountId: string) => {
    return todayTrades
      .filter(trade => trade.account_id === accountId)
      .reduce((sum, trade) => sum + Number(trade.profit || 0), 0);
  };

  const getBrokerName = (account: any) => {
    if (account.broker && account.broker !== 'N/A' && account.broker.trim() !== '') {
      return account.broker;
    }
    
    if (account.server) {
      let brokerName = account.server.replace(/^(MT[45]-?)/i, '');
      
      const patterns = [
        /^([A-Za-z]+)(-|\.|_)/,
        /^([A-Za-z\s]+)\d/,
        /^([A-Za-z]+)/
      ];
      
      for (const pattern of patterns) {
        const match = brokerName.match(pattern);
        if (match && match[1].length > 2) {
          return match[1].trim();
        }
      }
      
      return brokerName.split(/[-._\d]/)[0] || account.server;
    }
    
    return 'N/A';
  };

  // Dados enriquecidos com validação mais robusta (usando nickname)
  const enrichedAccounts = useMemo(() => {
    return accounts.map(account => {
      const connectionStatus = getConnectionStatus(account.updated_at);
      const openTradeCount = getOpenTradesCount(account.id);
      const openPnLValue = getOpenPnL(account);
      const dayProfitValue = getDayProfit(account.id);
      const clientNickname = getClientNickname(account.user_email);
      
      // Validação extra para dados numéricos
      const safeBalance = account.balance && !isNaN(Number(account.balance)) ? Number(account.balance) : 0;
      const safeEquity = account.equity && !isNaN(Number(account.equity)) ? Number(account.equity) : 0;
      
      return {
        ...account,
        status: connectionStatus.status === 'Disconnected' ? 'Offline' : connectionStatus.status,
        name: account.name || `Account ${account.account}`,
        vps: account.vps || 'N/A',
        openTrades: Math.max(0, openTradeCount),
        openPnL: isFinite(openPnLValue) ? openPnLValue : 0,
        dayProfit: isFinite(dayProfitValue) ? dayProfitValue : 0,
        balance: safeBalance,
        equity: safeEquity,
        connectionStatus: connectionStatus,
        clientNickname: clientNickname,
      };
    });
  }, [accounts, allOpenPositions, todayTrades, enrichedAccountsData]);

  // Filtrar contas por status e cliente (usando nickname)
  const filteredAccounts = useMemo(() => {
    let filtered = enrichedAccounts;
    
    // Filtro por status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'connected') {
        filtered = filtered.filter(account => 
          account.status === 'Live' || account.status === 'Slow Connection'
        );
      } else {
        filtered = filtered.filter(account => 
          account.status.toLowerCase() === selectedStatus.toLowerCase()
        );
      }
    }
    
    // Filtro por cliente (apenas para admin/manager) - usando nickname
    if (selectedClient !== 'all' && permissions.isAdminOrManager) {
      filtered = filtered.filter(account => 
        account.clientNickname === selectedClient
      );
    }
    
    return filtered;
  }, [enrichedAccounts, selectedStatus, selectedClient, permissions.isAdminOrManager]);

  // Configuração de paginação
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination(filteredAccounts, itemsPerPage);

  // Configuração de ordenação com cache inteligente ativado
  const { sortedData: sortedAccounts, requestSort, getSortIcon } = useSorting(
    paginatedData,
    { key: 'openTrades', direction: 'desc' }, // Ordenação padrão por trades abertas
    {
      // Funções de ordenação customizadas para maior controle
      openTrades: (a: any, b: any) => {
        const aCount = a.openTrades || 0;
        const bCount = b.openTrades || 0;
        return aCount - bCount;
      },
      balance: (a: any, b: any) => {
        const aBalance = Number(a.balance) || 0;
        const bBalance = Number(b.balance) || 0;
        return aBalance - bBalance;
      },
      equity: (a: any, b: any) => {
        const aEquity = Number(a.equity) || 0;
        const bEquity = Number(b.equity) || 0;
        return aEquity - bEquity;
      }
    }
  );

  const handleViewAccount = (accountNumber: string) => {
    navigate(`/account/${accountNumber}`);
  };

  const handleEditAccount = (account: any) => {
    // Verificar permissão antes de abrir modal
    if (!permissions.canEditAccounts) {
      console.log('⚠️ Usuário sem permissão para editar contas');
      return;
    }
    
    setSelectedAccount({
      id: account.id,
      name: account.name,
      account: account.account,
      vps: account.vps,
      vps_unique_id: account.vps_unique_id,
      broker: account.broker,
      server: account.server,
    });
    setEditModalOpen(true);
  };

  const handleCloseAllPositions = (account: any) => {
    // Verificar permissão antes de abrir modal
    if (!permissions.canCloseAllPositions) {
      console.log('⚠️ Usuário sem permissão para fechar posições');
      return;
    }
    
    setSelectedAccountForClose(account);
    setCloseAllModalOpen(true);
  };

  const handleAccountUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
  };

  const totalAccounts = accounts.length;
  const totalTrades = allOpenPositions.length;
  const totalEarnings = accounts.reduce((sum, account) => sum + Number(account.profit || 0), 0);
  const totalClients = accounts.length;

  const accountsByStatus = accounts.reduce((acc, account) => {
    const status = getConnectionStatus(account.updated_at);
    const statusKey = status.status === 'Disconnected' ? 'Offline' : status.status;
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const connectedAccounts = (accountsByStatus['Live'] || 0) + (accountsByStatus['Slow Connection'] || 0);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredAccounts.length);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => goToPage(i)}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => goToPage(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => goToPage(i)}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              isActive={currentPage === totalPages}
              onClick={() => goToPage(totalPages)}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const createSortableHeader = (label: string, sortKey: string, className: string = "") => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      requestSort(sortKey);
    };

    return (
      <TableHead 
        className={`cursor-pointer select-none font-medium ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          {label}
          <span className="text-xs opacity-60">{getSortIcon(sortKey)}</span>
        </div>
      </TableHead>
    );
  };

  const handleInactiveAccounts = () => {
    navigate('/inactive-accounts');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
                Account Monitor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sistema otimizado - Dados críticos: 1s | Contas: 1.5s | Histórico: 5s
                {permissions.isInvestor && <span className="ml-2 text-purple-400">(Modo Somente Leitura)</span>}
              </p>
            </div>
            
            {/* Botão para Contas Inativas */}
            <Button
              onClick={handleInactiveAccounts}
              variant="outline"
              className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
            >
              <Archive className="h-4 w-4" />
              Contas Inativas
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="tech-card tech-card-hover card-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Accounts</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <Users className="h-5 w-5 text-sky-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">{totalAccounts}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {connectedAccounts} conectadas
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Trades</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-emerald-500">{totalTrades}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Posições ativas
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Earnings</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-emerald-500">
                US$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lucro total
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Clients</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <TrendingUp className="h-5 w-5 text-sky-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">{totalClients}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contas gerenciadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card className="tech-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Trading Accounts</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="slow connection">Slow Connection</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por Cliente usando nickname - apenas para Admin/Manager */}
                {permissions.isAdminOrManager && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clientsList.map((client) => (
                          <SelectItem key={client.email} value={client.nickname}>
                            {client.nickname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Results per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {createSortableHeader("Status", "status")}
                  {createSortableHeader("Account Name", "name")}
                  {createSortableHeader("Number", "account")}
                  {permissions.isAdminOrManager && createSortableHeader("Client", "clientNickname")}
                  {createSortableHeader("VPS", "vps")}
                  {createSortableHeader("Balance", "balance", "text-right")}
                  {createSortableHeader("Equity", "equity", "text-right")}
                  {createSortableHeader("Trades", "openTrades", "text-right")}
                  {createSortableHeader("Open P&L", "openPnL", "text-right")}
                  {createSortableHeader("Day P&L", "dayProfit", "text-right")}
                  {createSortableHeader("Server", "server")}
                  <TableHead className="font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <ConnectionStatus lastUpdate={account.updated_at} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {account.name}
                    </TableCell>
                    <TableCell className="font-mono">{account.account}</TableCell>
                    {permissions.isAdminOrManager && (
                      <TableCell className="font-medium">
                        {account.clientNickname}
                      </TableCell>
                    )}
                    <TableCell>{account.vps}</TableCell>
                    <TableCell className="text-right font-mono">
                      US$ {Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      US$ {Number(account.equity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {account.openTrades}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${account.openPnL >= 0 ? 'text-emerald-600' : 'metric-negative'}`}>
                      US$ {account.openPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${account.dayProfit >= 0 ? 'text-emerald-600' : 'metric-negative'}`}>
                      US$ {account.dayProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">{account.server || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* BOTÃO CLOSE ALL - Apenas para quem tem permissão */}
                        {permissions.canCloseAllPositions && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="action-button-danger"
                            onClick={() => handleCloseAllPositions(account)}
                            disabled={account.openTrades === 0}
                          >
                            Close All
                          </Button>
                        )}
                        
                        {/* BOTÃO EDIT - Apenas para quem tem permissão */}
                        {permissions.canEditAccounts && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                            onClick={() => handleEditAccount(account)}
                          >
                            Edit
                          </Button>
                        )}
                        
                        {/* BOTÃO DETAILS - Todos podem ver */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300"
                          onClick={() => handleViewAccount(account.account)}
                        >
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredAccounts.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/20">
                <div className="text-sm text-gray-500">
                  Showing {startIndex} to {endIndex} of {filteredAccounts.length} results
                </div>
                
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={previousPage}
                          className={hasPreviousPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={nextPage}
                          className={hasNextPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}

            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {selectedStatus === 'all' && selectedClient === 'all' 
                    ? 'Nenhuma conta encontrada' 
                    : `Nenhuma conta encontrada para os filtros selecionados`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure seus EAs para começar a monitorar contas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAIS - Apenas renderizar se o usuário tem permissões */}
      {permissions.canEditAccounts && (
        <EditAccountModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          account={selectedAccount}
          onAccountUpdated={handleAccountUpdated}
        />
      )}

      {permissions.canCloseAllPositions && (
        <CloseAllPositionsModal
          isOpen={closeAllModalOpen}
          onClose={() => setCloseAllModalOpen(false)}
          accountNumber={selectedAccountForClose?.account || ''}
          accountName={selectedAccountForClose?.name || ''}
          openTradesCount={selectedAccountForClose ? selectedAccountForClose.openTrades : 0}
        />
      )}
    </AppLayout>
  );
};

export default AccountMonitor;
