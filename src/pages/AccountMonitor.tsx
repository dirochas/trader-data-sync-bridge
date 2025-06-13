
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTradingAccounts } from '@/hooks/useTradingData';
import { useNavigate } from 'react-router-dom';

const AccountMonitor = () => {
  const { data: accounts = [], isLoading } = useTradingAccounts();
  const navigate = useNavigate();

  const handleViewAccount = (accountNumber: string) => {
    navigate(`/account/${accountNumber}`);
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

  // Calcular estatísticas com base nos dados reais
  const totalAccounts = accounts.length;
  const totalTrades = 0; // Removido a referência ao open_trades inexistente
  const totalEarnings = accounts.reduce((sum, account) => sum + Number(account.profit || 0), 0);
  const totalClients = accounts.length; // Assumindo 1 cliente por conta

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
                  <p className="text-xs text-green-500">Contas conectadas</p>
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
                    <TableHead>Server</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Equity</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>🟢</span>
                          <span className="text-sm font-medium text-green-600">
                            Live
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.account_number} {/* Temporário até termos campo name */}
                      </TableCell>
                      <TableCell className="font-mono">{account.account_number}</TableCell>
                      <TableCell>{account.server}</TableCell>
                      <TableCell className="text-right font-mono">
                        US$ {Number(account.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        US$ {Number(account.equity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${Number(account.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        US$ {Number(account.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
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
    </div>
  );
};

export default AccountMonitor;
