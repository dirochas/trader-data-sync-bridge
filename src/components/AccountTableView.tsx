
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ExternalLink, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  onCloseAllPositions: (account: Account) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' | null } | null;
  onSort?: (key: string) => void;
}

export const AccountTableView = ({ accounts, onEditAccount, onCloseAllPositions, sortConfig, onSort }: AccountTableViewProps) => {
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

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <span className="text-xs opacity-60 ml-1">↕️</span>;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 opacity-60" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1 opacity-60" />;
  };

  const createSortableHeader = (label: string, sortKey: string, className: string = "") => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onSort) {
        onSort(sortKey);
      }
    };

    return (
      <TableHead 
        className={`cursor-pointer select-none font-medium ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center">
          {label}
          {getSortIcon(sortKey)}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {createSortableHeader("Status", "status", "w-[80px]")}
            {createSortableHeader("Account Name", "name")}
            {createSortableHeader("Number", "account", "text-center")}
            {createSortableHeader("Client", "clientNickname", "text-center")}
            {createSortableHeader("VPS", "vps", "text-center")}
            {createSortableHeader("Balance", "balance", "text-right")}
            {createSortableHeader("Equity", "equity", "text-right")}
            {createSortableHeader("Trades", "openTrades", "text-center")}
            {createSortableHeader("Open P&L", "openPnL", "text-right")}
            {createSortableHeader("Day P&L", "dayProfit", "text-right")}
            {createSortableHeader("Server", "server")}
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const connectionStatus = getConnectionStatus(account.updated_at);
            const isOpenPnLProfit = (account.openPnL || 0) >= 0;
            const isDayPnLProfit = (account.dayProfit || 0) >= 0;
            const hasOpenTrades = (account.openTrades || 0) > 0;
            
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
                    isOpenPnLProfit ? 'text-green-600' : 'text-red-300'
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
                    isDayPnLProfit ? 'text-green-600' : 'text-red-300'
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
                      onClick={() => onCloseAllPositions(account)}
                      className="text-xs text-red-400 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!permissions.canCloseAllPositions || !hasOpenTrades}
                    >
                      Close All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAccount(account)}
                      className="text-xs text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      disabled={!permissions.canEditAccounts}
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAccount(account.account)}
                      className="text-xs text-sky-500 border-sky-300 hover:bg-sky-50 hover:border-sky-400 transition-colors"
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
