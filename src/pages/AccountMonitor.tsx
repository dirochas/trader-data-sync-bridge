import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTradingAccounts, getConnectionStatus } from '@/hooks/useTradingData';
import { useSorting } from '@/hooks/useSorting';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ConnectionStatus from '@/components/ConnectionStatus';
import EditAccountModal from '@/components/EditAccountModal';
import CloseAllPositionsModal from '@/components/CloseAllPositionsModal';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity
} from 'lucide-react';

const AccountMonitor = () => {
  const { data: accounts = [], isLoading } = useTradingAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [closeAllModalOpen, setCloseAllModalOpen] = useState(false);
  const [selectedAccountForClose, setSelectedAccountForClose] = useState<any>(null);

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
        status: connectionStatus.status,
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

  // Configuração de ordenação com cache inteligente ativado
  const { sortedData: sortedAccounts, requestSort, getSortIcon } = useSorting(
    enrichedAccounts,
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
    acc[status.status] = (acc[status.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const connectedAccounts = (accountsByStatus['Live'] || 0) + (accountsByStatus['Slow Connection'] || 0);

  const createSortableHeader = (label: string, sortKey: string, className: string = "") => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      requestSort(sortKey);
    };

    return (
      <TableHead 
        className={`cursor-pointer select-none text-caption ${className}`}
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
    <>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h1 className="text-display text-2xl md:text-3xl text-white">
            Account Monitor
          </h1>
          <p className="text-caption text-muted-foreground/80">
            Sistema otimizado - Dados críticos: 1s | Contas: 1.5s | Histórico: 5s
          </p>
        </div>

        {/* Summary Cards - Following Dashboard Pattern */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="tech-card tech-card-hover border-sky-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Accounts</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <Users className="h-7 w-7 text-sky-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{totalAccounts}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    {connectedAccounts} conectadas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Open Trades</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Activity className="h-7 w-7 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{totalTrades}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Posições ativas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-emerald-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Earnings</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <DollarSign className="h-7 w-7 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-lg md:text-2xl metric-positive">
                  US$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Lucro total
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-amber-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Clients</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <TrendingUp className="h-7 w-7 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{totalClients}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Contas gerenciadas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status Summary - Compact Version */}
        <Card className="tech-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-heading text-lg text-white">Connection Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="text-display text-xl metric-positive">{accountsByStatus['Live'] || 0}</div>
                <div className="status-indicator status-live mx-auto text-xs">
                  🟢 Live
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-display text-xl metric-neutral">{accountsByStatus['Slow Connection'] || 0}</div>
                <div className="status-indicator status-slow mx-auto text-xs">
                  🟡 Slow
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-display text-xl metric-negative">{accountsByStatus['Delayed'] || 0}</div>
                <div className="status-indicator status-delayed mx-auto text-xs">
                  🟠 Delayed
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-display text-xl metric-negative">{accountsByStatus['Disconnected'] || 0}</div>
                <div className="status-indicator status-disconnected mx-auto text-xs">
                  🔴 Disconnected
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card className="tech-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading text-lg md:text-xl text-white">Trading Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
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
                      <TableHead className="min-w-[220px] text-caption">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAccounts.map((account) => (
                      <TableRow key={account.id} className="table-row-hover border-border/30">
                        <TableCell className="py-4">
                          <ConnectionStatus lastUpdate={account.updated_at} />
                        </TableCell>
                        <TableCell className="text-body font-medium">
                          {account.name}
                        </TableCell>
                        <TableCell className="text-body font-mono">{account.account}</TableCell>
                        <TableCell className="text-body">{account.vps}</TableCell>
                        <TableCell className="text-right text-body font-mono metric-neutral">
                          US$ {Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-body font-mono metric-neutral">
                          US$ {Number(account.equity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-body font-bold">
                          {account.openTrades}
                        </TableCell>
                        <TableCell className={`text-right text-body font-mono ${account.openPnL >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                          US$ {account.openPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right text-body font-mono ${account.dayProfit >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                          US$ {account.dayProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-body font-medium">{account.server || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="action-button action-button-danger text-xs h-8"
                              onClick={() => handleCloseAllPositions(account)}
                              disabled={account.openTrades === 0}
                            >
                              CLOSE ALL
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="action-button action-button-warning text-xs h-8"
                              onClick={() => handleEditAccount(account)}
                            >
                              EDIT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="action-button action-button-primary text-xs h-8"
                              onClick={() => handleViewAccount(account.account)}
                            >
                              VIEW
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {accounts.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground/70">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-body">Nenhuma conta conectada</p>
                <p className="text-caption text-muted-foreground/60 mt-2">Configure seus EAs para começar a monitorar contas</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12 text-muted-foreground/70">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-body">Carregando contas...</p>
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
    </>
  );
};

export default AccountMonitor;
