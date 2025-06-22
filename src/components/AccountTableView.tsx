
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { getConnectionStatus } from '@/hooks/useTradingData';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

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
  openTrades?: number;
  openPnL?: number;
  dayProfit?: number;
  clientNickname?: string;
}

interface AccountTableViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
}

export const AccountTableView = ({ accounts, onEditAccount }: AccountTableViewProps) => {
  const permissions = usePermissions();
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return `US$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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

  const handleViewAccount = (accountNumber: string) => {
    navigate(`/account/${accountNumber}`);
  };

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead className="text-center">Number</TableHead>
            <TableHead className="text-center">Client</TableHead>
            <TableHead className="text-center">VPS</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Equity</TableHead>
            <TableHead className="text-center">Trades</TableHead>
            <TableHead className="text-right">Open P&L</TableHead>
            <TableHead className="text-right">Day P&L</TableHead>
            <TableHead>Server</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const connectionStatus = getConnectionStatus(account.updated_at);
            const isOpenPnLProfit = (account.openPnL || 0) >= 0;
            const isDayPnLProfit = (account.dayProfit || 0) >= 0;
            
            return (
              <TableRow key={account.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${connectionStatus.color} border-0`}
                  >
                    {connectionStatus.icon} {connectionStatus.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {account.name || `Account ${account.account}`}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {account.account}
                </TableCell>
                <TableCell className="text-center">
                  {permissions.isAdminOrManager ? (account.clientNickname || 'N/A') : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {account.vps}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(account.balance)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(account.equity)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {account.openTrades || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`flex items-center justify-end gap-1 font-mono ${
                    isOpenPnLProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isOpenPnLProfit ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{formatCurrency(account.openPnL || 0)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={`flex items-center justify-end gap-1 font-mono ${
                    isDayPnLProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(account.dayProfit || 0)}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="max-w-[150px] truncate" title={account.server}>
                    {getBrokerName(account)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}} // Close All placeholder
                      className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                      disabled={!permissions.canCloseAllPositions}
                    >
                      Close All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAccount(account)}
                      className="text-xs"
                      disabled={!permissions.canEditAccounts}
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAccount(account.account)}
                      className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
