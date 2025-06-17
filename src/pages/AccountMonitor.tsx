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
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Filter
} from 'lucide-react';

const AccountMonitor = () => {
  const { data: accounts = [], isLoading } = useTradingAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [closeAllModalOpen, setCloseAllModalOpen] = useState(false);
  const [selectedAccountForClose, setSelectedAccountForClose] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Query otimizada para posições abertas com cache inteligente
  const { data: allOpenPositions = [] } = useQuery({
    queryKey: ['all-open-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 1000, // Dados críticos - 1 segundo
    staleTime: 300,
    gcTime: 30000,
  });

  // Query otimizada para trades do dia
  const { data: todayTrades = [] } = useQuery({
    queryKey: ['todays-trades'],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .gte('close_time', startOfDay.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Dados históricos - 5 segundos
    staleTime: 2000,
    gcTime: 60000,
  });

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

  // Dados enriquecidos com validação mais robusta
  const enrichedAccounts = useMemo(() => {
    return accounts.map(account => {
      const connectionStatus = getConnectionStatus(account.updated_at);
      const openTradeCount = getOpenTradesCount(account.id);
      const openPnLValue = getOpenPnL(account);
      const dayProfitValue = getDayProfit(account.id);
      
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
      };
    });
  }, [accounts, allOpenPositions, todayTrades]);

  // Filtrar contas por status
  const filteredAccounts = selectedStatus === 'all' 
    ? enrichedAccounts 
    : enrichedAccounts.filter(account => {
        if (selectedStatus === 'connected') {
          return account.status === 'Live' || account.status === 'Slow Connection';
        }
        return account.status.toLowerCase() === selectedStatus.toLowerCase();
      });

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
    setSelectedAccount({
      id: account.id,
      name: account.name,
      account_number: account.account,
      vps_name: account.vps,
      broker: account.broker,
      server: account.server,
    });
    setEditModalOpen(true);
  };

  const handleCloseAllPositions = (account: any) => {
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

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
            Account Monitor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sistema otimizado - Dados críticos: 1s | Contas: 1.5s | Histórico: 5s
          </p>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {createSortableHeader("Status", "status")}
                    {createSortableHeader("Account Name", "name")}
                    {createSortableHeader("Number", "account")}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="action-button-danger"
                            onClick={() => handleCloseAllPositions(account)}
                            disabled={account.openTrades === 0}
                          >
                            Close All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                            onClick={() => handleEditAccount(account)}
                          >
                            Edit
                          </Button>
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
            </div>

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
                  {selectedStatus === 'all' ? 'Nenhuma conta encontrada' : `Nenhuma conta ${selectedStatus} encontrada`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure seus EAs para começar a monitorar contas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditAccountModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        account={selectedAccount}
        onAccountUpdated={handleAccountUpdated}
      />

      <CloseAllPositionsModal
        isOpen={closeAllModalOpen}
        onClose={() => setCloseAllModalOpen(false)}
        accountNumber={selectedAccountForClose?.account || ''}
        accountName={selectedAccountForClose?.name || ''}
        openTradesCount={selectedAccountForClose ? selectedAccountForClose.openTrades : 0}
      />
    </AppLayout>
  );
};

export default AccountMonitor;
