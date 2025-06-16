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
        .from('open_positions')
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
        .from('trade_history')
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
        name: account.name || `Account ${account.account_number}`,
        vps: account.vps_name || 'N/A',
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
      account_number: account.account_number,
      vps_name: account.vps_name,
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
        className={`cursor-pointer hover:bg-gray-50 select-none ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="text-xs opacity-60">{getSortIcon(sortKey)}</span>
        </div>
      </TableHead>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Sistema otimizado info */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Account Monitor</h1>
        <p className="text-sm text-muted-foreground">
          Sistema otimizado - Dados críticos: 1s | Contas: 1.5s | Histórico: 8s
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accounts</p>
                <p className="text-2xl font-bold">{totalAccounts}</p>
                <p className="text-xs text-green-500">{connectedAccounts} conectadas</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trades</p>
                <p className="text-2xl font-bold">{totalTrades}</p>
                <p className="text-xs text-green-500">Posições abertas</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">⏰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold">US$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-green-500">Lucro total</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-blue-500">Contas ativas</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{accountsByStatus['Live'] || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <span>🟢</span> Live
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{accountsByStatus['Slow Connection'] || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <span>🟡</span> Slow Connection
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{accountsByStatus['Delayed'] || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <span>🟠</span> Delayed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{accountsByStatus['Disconnected'] || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <span>🔴</span> Disconnected
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {createSortableHeader("Status", "status")}
                  {createSortableHeader("Name", "name")}
                  {createSortableHeader("Account Number", "account_number")}
                  {createSortableHeader("VPS", "vps")}
                  {createSortableHeader("Balance", "balance", "text-right")}
                  {createSortableHeader("Equity", "equity", "text-right")}
                  {createSortableHeader("Open Trades", "openTrades", "text-right")}
                  {createSortableHeader("Open PnL", "openPnL", "text-right")}
                  {createSortableHeader("Day", "dayProfit", "text-right")}
                  {createSortableHeader("SERVIDOR", "server")}
                  <TableHead>ACTIONS</TableHead>
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
                    <TableCell className="font-mono">{account.account_number}</TableCell>
                    <TableCell>{account.vps}</TableCell>
                    <TableCell className="text-right font-mono">
                      US$ {Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      US$ {Number(account.equity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {account.openTrades}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${account.openPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      US$ {account.openPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${account.dayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      US$ {account.dayProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium">{account.server || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleCloseAllPositions(account)}
                          disabled={account.openTrades === 0}
                        >
                          CLOSE ALL
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700"
                          onClick={() => handleEditAccount(account)}
                        >
                          EDIT
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleViewAccount(account.account_number)}
                        >
                          VIEW
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {accounts.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Nenhuma conta conectada</p>
                <p className="text-sm text-gray-400 mt-1">Configure seus EAs para começar a monitorar contas</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">⏳</div>
                <p>Carregando contas...</p>
              </div>
            )}
          </div>
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
      accountNumber={selectedAccountForClose?.account_number || ''}
      accountName={selectedAccountForClose?.name || ''}
      openTradesCount={selectedAccountForClose ? selectedAccountForClose.openTrades : 0}
    />
  );
};

export default AccountMonitor;
