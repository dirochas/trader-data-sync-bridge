import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTradingAccounts, getConnectionStatus } from '@/hooks/useTradingData';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ConnectionStatus from '@/components/ConnectionStatus';
import EditAccountModal from '@/components/EditAccountModal';

const AccountMonitor = () => {
  const { data: accounts = [], isLoading } = useTradingAccounts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estado para controlar o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Buscar todas as posições abertas para calcular totais
  const { data: allOpenPositions = [] } = useQuery({
    queryKey: ['all-open-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_positions')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Buscar histórico de trades do dia atual para calcular Day
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
    refetchInterval: 10000,
  });

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

  const handleAccountUpdated = () => {
    // Atualizar os dados das contas após edição
    queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
  };

  // Função para contar trades abertas por conta
  const getOpenTradesCount = (accountId: string) => {
    return allOpenPositions.filter(pos => pos.account_id === accountId).length;
  };

  // Função para calcular Open PnL por conta (usando o profit da conta)
  const getOpenPnL = (account: any) => {
    return Number(account.profit || 0);
  };

  // Função para calcular Day (saldo fechado no dia) por conta
  const getDayProfit = (accountId: string) => {
    return todayTrades
      .filter(trade => trade.account_id === accountId)
      .reduce((sum, trade) => sum + Number(trade.profit || 0), 0);
  };

  // Calcular estatísticas com base nos dados reais e status de conexão
  const totalAccounts = accounts.length;
  const totalTrades = allOpenPositions.length;
  const totalEarnings = accounts.reduce((sum, account) => sum + Number(account.profit || 0), 0);
  const totalClients = accounts.length;

  // Calcular contas por status
  const accountsByStatus = accounts.reduce((acc, account) => {
    const status = getConnectionStatus(account.updated_at);
    acc[status.status] = (acc[status.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const connectedAccounts = (accountsByStatus['Live'] || 0) + (accountsByStatus['Slow Connection'] || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Account Monitor</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
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
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>VPS</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Equity</TableHead>
                    <TableHead className="text-right">Open Trades</TableHead>
                    <TableHead className="text-right">Open PnL</TableHead>
                    <TableHead className="text-right">Day</TableHead>
                    <TableHead>BROKER</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => {
                    const openTradesCount = getOpenTradesCount(account.id);
                    const openPnL = getOpenPnL(account);
                    const dayProfit = getDayProfit(account.id);
                    
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <ConnectionStatus lastUpdate={account.updated_at} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {account.name || `Account ${account.account_number}`}
                        </TableCell>
                        <TableCell className="font-mono">{account.account_number}</TableCell>
                        <TableCell>{account.vps_name || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">
                          US$ {Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          US$ {Number(account.equity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {openTradesCount}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${openPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          US$ {openPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${dayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          US$ {dayProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{account.broker || account.server}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
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
                    );
                  })}
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

      {/* Modal de Edição */}
      <EditAccountModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        account={selectedAccount}
        onAccountUpdated={handleAccountUpdated}
      />
    </div>
  );
};

export default AccountMonitor;
