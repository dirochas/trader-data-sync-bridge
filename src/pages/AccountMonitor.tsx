
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTradingAccount } from '@/hooks/useTradingData';
import { useNavigate } from 'react-router-dom';

const AccountMonitor = () => {
  const { data: accounts = [], isLoading } = useTradingAccount();
  const navigate = useNavigate();

  // Simulando múltiplas contas - posteriormente isso virá do banco
  const mockAccounts = [
    {
      id: '1',
      name: 'Apollo',
      account_number: '66615658',
      server: 'ICMarketsSC-Demo06',
      balance: 15532.53,
      equity: 18466.94,
      status: 'Live',
      vps: 'VPS1',
      open_trades: 28,
      profit: 2934.41,
      broker: 'IC-Markets'
    }
  ];

  const handleViewAccount = (accountId: string) => {
    navigate(`/account/${accountId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live':
        return 'text-green-600';
      case 'Disconnected':
        return 'text-red-600';
      case 'Slow connection':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Live':
        return '🟢';
      case 'Disconnected':
        return '🔴';
      case 'Slow connection':
        return '🟡';
      default:
        return '⚪';
    }
  };

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
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-red-500">-3.65% Since last week</p>
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
                  <p className="text-2xl font-bold">28</p>
                  <p className="text-xs text-green-500">5.25% Since last week</p>
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
                  <p className="text-2xl font-bold">US$ 2,934.41</p>
                  <p className="text-xs text-green-500">6.65% Since last week</p>
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
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-red-500">-2.25% Since last week</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  {mockAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getStatusDot(account.status)}</span>
                          <span className={`text-sm font-medium ${getStatusColor(account.status)}`}>
                            {account.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.vps}</TableCell>
                      <TableCell className="text-right font-mono">
                        US$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        US$ {account.equity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{account.open_trades}</TableCell>
                      <TableCell className={`text-right font-bold ${account.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        US$ {account.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        US$ {account.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{account.broker}</TableCell>
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
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleViewAccount(account.id)}
                          >
                            VIEW
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {mockAccounts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Nenhuma conta conectada</p>
                  <p className="text-sm text-gray-400 mt-1">Configure seus EAs para começar a monitorar contas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountMonitor;
