
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, TrendingUp, TrendingDown } from 'lucide-react';
import { getConnectionStatus } from '@/hooks/useTradingData';

interface Account {
  id: string;
  account: string;
  name: string | null;
  balance: number;
  equity: number;
  profit: number;
  leverage: number;
  server: string;
  vps: string;
  broker: string | null;
  updated_at: string;
  status?: string;
  group_id?: string | null;
}

interface AccountTableViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
}

export const AccountTableView = ({ accounts, onEditAccount }: AccountTableViewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const percentage = ((value / 100000) * 100);
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px]">Conta</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Equity</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-center">Alavancagem</TableHead>
            <TableHead>Servidor</TableHead>
            <TableHead>VPS</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const connectionStatus = getConnectionStatus(account.updated_at);
            const isProfit = account.profit >= 0;
            
            return (
              <TableRow key={account.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-sm font-medium">
                  {account.account}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {account.name || `Conta ${account.account}`}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(account.balance)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(account.equity)}
                </TableCell>
                <TableCell className="text-right">
                  <div className={`flex items-center justify-end gap-1 font-mono ${
                    isProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isProfit ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{formatCurrency(account.profit)}</span>
                    <span className="text-xs opacity-75">
                      ({formatPercentage(account.profit)})
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    1:{account.leverage}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {account.server}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {account.vps}
                  </Badge>
                </TableCell>
                <TableCell>{account.broker || 'N/A'}</TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${connectionStatus.color}`}
                  >
                    {connectionStatus.icon} {connectionStatus.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditAccount(account)}
                    className="hover:bg-accent"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
