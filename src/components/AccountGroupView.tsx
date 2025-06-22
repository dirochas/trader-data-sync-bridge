
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, TrendingUp, TrendingDown, Folder, Users, Eye, X } from 'lucide-react';
import { getConnectionStatus } from '@/hooks/useTradingData';
import { useAccountGroups } from '@/hooks/useAccountGroups';
import { usePermissions } from '@/hooks/usePermissions';

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
  dayProfit?: number;
  clientNickname?: string;
}

interface AccountGroupViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onViewAccount?: (accountNumber: string) => void;
  onCloseAllPositions?: (account: Account) => void;
}

export const AccountGroupView = ({ 
  accounts, 
  onEditAccount, 
  onViewAccount,
  onCloseAllPositions 
}: AccountGroupViewProps) => {
  const { data: groups = [] } = useAccountGroups();
  const permissions = usePermissions();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number, balance: number) => {
    if (!balance || balance === 0) return '0.00%';
    const percentage = ((value / balance) * 100);
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getBrokerName = (account: Account) => {
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

  // Agrupar contas por grupo
  const groupedAccounts = accounts.reduce((acc, account) => {
    const groupId = account.group_id || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  // Encontrar informações do grupo
  const getGroupInfo = (groupId: string) => {
    if (groupId === 'ungrouped') {
      return {
        name: 'Contas Sem Grupo',
        description: 'Contas que não foram atribuídas a nenhum grupo',
        color: '#6B7280'
      };
    }
    const group = groups.find(g => g.id === groupId);
    return group || {
      name: 'Grupo Desconhecido',
      description: 'Grupo não encontrado',
      color: '#6B7280'
    };
  };

  // Calcular estatísticas do grupo
  const getGroupStats = (groupAccounts: Account[]) => {
    const totalBalance = groupAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = groupAccounts.reduce((sum, acc) => sum + acc.equity, 0);
    const totalProfit = groupAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    const totalTrades = groupAccounts.reduce((sum, acc) => sum + (acc.openTrades || 0), 0);
    const isProfit = totalProfit >= 0;
    
    return { totalBalance, totalEquity, totalProfit, totalTrades, isProfit };
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedAccounts).map(([groupId, groupAccounts]) => {
        const groupInfo = getGroupInfo(groupId);
        const stats = getGroupStats(groupAccounts);
        
        return (
          <Card key={groupId} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: groupInfo.color }}
                  />
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {groupId === 'ungrouped' ? (
                        <Users className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Folder className="w-5 h-5" />
                      )}
                      {groupInfo.name}
                    </CardTitle>
                    {groupInfo.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {groupInfo.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-sm text-muted-foreground">Total P&L</div>
                    <div className={`font-mono font-semibold flex items-center gap-1 ${
                      stats.isProfit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.isProfit ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatCurrency(stats.totalProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Trades</div>
                    <div className="font-semibold text-blue-600">{stats.totalTrades}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contas</div>
                    <div className="font-semibold">{groupAccounts.length}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {groupAccounts.map((account) => {
                  const connectionStatus = getConnectionStatus(account.updated_at);
                  const isProfit = account.profit >= 0;
                  const isDayProfit = (account.dayProfit || 0) >= 0;
                  const brokerName = getBrokerName(account);
                  
                  return (
                    <div
                      key={account.id}
                      className="grid grid-cols-12 gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors items-center text-sm"
                    >
                      {/* Status */}
                      <div className="col-span-1 flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${connectionStatus.color}`}
                        >
                          {connectionStatus.icon}
                        </Badge>
                      </div>
                      
                      {/* Account Name */}
                      <div className="col-span-2">
                        <div className="font-semibold text-foreground">
                          {account.name || `Account ${account.account}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {account.clientNickname || 'N/A'}
                        </div>
                      </div>
                      
                      {/* Number */}
                      <div className="col-span-1">
                        <div className="font-mono text-xs">{account.account}</div>
                      </div>
                      
                      {/* Client */}
                      <div className="col-span-1">
                        <div className="text-xs">{account.clientNickname || 'N/A'}</div>
                      </div>
                      
                      {/* VPS */}
                      <div className="col-span-1">
                        <Badge variant="secondary" className="text-xs">
                          {account.vps}
                        </Badge>
                      </div>
                      
                      {/* Balance */}
                      <div className="col-span-1 text-right">
                        <div className="font-mono text-xs">
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                      
                      {/* Equity */}
                      <div className="col-span-1 text-right">
                        <div className="font-mono text-xs font-semibold">
                          {formatCurrency(account.equity)}
                        </div>
                      </div>
                      
                      {/* Trades */}
                      <div className="col-span-1 text-center">
                        <div className="font-semibold text-blue-600">
                          {account.openTrades || 0}
                        </div>
                      </div>
                      
                      {/* Open P&L */}
                      <div className="col-span-1 text-right">
                        <div className={`font-mono text-xs ${
                          isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.profit)}
                        </div>
                        <div className={`text-xs opacity-75 ${
                          isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(account.profit, account.balance)}
                        </div>
                      </div>
                      
                      {/* Day P&L */}
                      <div className="col-span-1 text-right">
                        <div className={`font-mono text-xs ${
                          isDayProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.dayProfit || 0)}
                        </div>
                      </div>
                      
                      {/* Server */}
                      <div className="col-span-1">
                        <div className="text-xs">{brokerName}</div>
                        <div className="text-xs text-muted-foreground">
                          1:{account.leverage}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        {permissions.canCloseAllPositions && (account.openTrades || 0) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCloseAllPositions?.(account)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Close All Positions"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {permissions.canEditAccounts && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditAccount(account)}
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Edit Account"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAccount?.(account.account)}
                          className="h-8 w-8 p-0 hover:bg-accent"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
