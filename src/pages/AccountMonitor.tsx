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
  
  // Estado para controlar o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Estado para controlar o modal de fechar todas as posições
  const [closeAllModalOpen, setCloseAllModalOpen] = useState(false);
  const [selectedAccountForClose, setSelectedAccountForClose] = useState<any>(null);

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
    refetchInterval: 2000,
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
    refetchInterval: 5000,
  });

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

  // Função para extrair nome do broker do server ou usar o campo broker
  const getBrokerName = (account: any) => {
    // Se já temos o broker definido, usar ele
    if (account.broker && account.broker !== 'N/A' && account.broker.trim() !== '') {
      return account.broker;
    }
    
    // Caso contrário, tentar extrair do server name
    if (account.server) {
      // Remover prefixos comuns como "MT4-", "MT5-", etc.
      let brokerName = account.server.replace(/^(MT[45]-?)/i, '');
      
      // Extrair nome do broker de patterns comuns
      const patterns = [
        /^([A-Za-z]+)(-|\.|_)/,  // Nome antes de separador
        /^([A-Za-z\s]+)\d/,      // Nome antes de números
        /^([A-Za-z]+)/           // Apenas letras iniciais
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

  // Enriquecer os dados das contas com propriedades calculadas
  const enrichedAccounts = useMemo(() => {
    const result = accounts.map(account => {
      const connectionStatus = getConnectionStatus(account.updated_at);
      const openTradeCount = getOpenTradesCount(account.id);
      const openPnLValue = getOpenPnL(account);
      
      const enriched = {
        ...account,
        status: connectionStatus.status,
        name: account.name || `Account ${account.account_number}`,
        vps: account.vps_name || 'N/A',
        openTrades: openTradeCount,
        openPnL: openPnLValue,
        dayProfit: getDayProfit(account.id),
        connectionStatus: connectionStatus,
      };
      
      console.log('Enriched account:', {
        id: account.id,
        account_number: account.account_number,
        status: enriched.status,
        vps: enriched.vps,
        openTrades: enriched.openTrades,
        openPnL: enriched.openPnL,
        name: enriched.name,
        balance: enriched.balance
      });
      
      return enriched;
    });
    
    console.log('All enriched accounts:', result.length);
    return result;
  }, [accounts, allOpenPositions, todayTrades]);

  console.log('Enriched accounts sample:', enrichedAccounts[0]);

  // Hook de ordenação
  const { sortedData: sortedAccounts, requestSort, getSortIcon } = useSorting(enrichedAccounts);

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
    // Atualizar os dados das contas após edição
    queryClient.invalidateQueries({ queryKey: ['trading-accounts'] });
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

  // Componente para cabeçalho ordenável com logs máximos
  const SortableHeader = ({ children, sortKey, className = "" }: { children: React.ReactNode, sortKey: string, className?: string }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-gray-50 select-none ${className}`}
      onClick={() => {
        console.log(`🚀 CLICK DETECTED ON COLUMN: ${sortKey}`);
        console.log('🔍 Data verification before sort:', {
          sortKey,
          enrichedAccountsLength: enrichedAccounts.length,
          sampleData: enrichedAccounts.slice(0, 2).map(acc => ({
            account: acc.account_number,
            [sortKey]: acc[sortKey as keyof typeof acc],
            type: typeof acc[sortKey as keyof typeof acc]
          }))
        });
        
        try {
          console.log('🎯 Calling requestSort...');
          requestSort(sortKey);
          console.log('✅ requestSort completed');
        } catch (error) {
          console.error('❌ Error in requestSort:', error);
        }
      }}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="text-xs opacity-60">{getSortIcon(sortKey)}</span>
      </div>
    </TableHead>
  );

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
                    <SortableHeader sortKey="status">Status</SortableHeader>
                    <SortableHeader sortKey="name">Name</SortableHeader>
                    <SortableHeader sortKey="account_number">Account Number</SortableHeader>
                    <SortableHeader sortKey="vps">VPS</SortableHeader>
                    <SortableHeader sortKey="balance" className="text-right">Balance</SortableHeader>
                    <SortableHeader sortKey="equity" className="text-right">Equity</SortableHeader>
                    <SortableHeader sortKey="openTrades" className="text-right">Open Trades</SortableHeader>
                    <SortableHeader sortKey="openPnL" className="text-right">Open PnL</SortableHeader>
                    <SortableHeader sortKey="dayProfit" className="text-right">Day</SortableHeader>
                    <SortableHeader sortKey="server">SERVIDOR</SortableHeader>
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

      {/* Modal de Edição */}
      <EditAccountModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        account={selectedAccount}
        onAccountUpdated={handleAccountUpdated}
      />

      {/* Modal de Fechar Todas as Posições */}
      <CloseAllPositionsModal
        isOpen={closeAllModalOpen}
        onClose={() => setCloseAllModalOpen(false)}
        accountNumber={selectedAccountForClose?.account_number || ''}
        accountName={selectedAccountForClose?.name || ''}
        openTradesCount={selectedAccountForClose ? selectedAccountForClose.openTrades : 0}
      />
    </div>
  );
};

export default AccountMonitor;
