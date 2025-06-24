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
  groupSortConfig?: { key: string; direction: 'asc' | 'desc' | null };
}

interface GroupData {
  groupId: string;
  groupInfo: {
    name: string;
    description?: string;
    color: string;
  };
  accounts: Account[];
  stats: {
    totalBalance: number;
    totalEquity: number;
    totalProfit: number;
    totalTrades: number;
    isProfit: boolean;
  };
}

export const AccountGroupView = ({ 
  accounts, 
  onEditAccount, 
  onViewAccount,
  onCloseAllPositions,
  groupSortConfig 
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

  const getGroupStats = (groupAccounts: Account[]) => {
    const totalBalance = groupAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = groupAccounts.reduce((sum, acc) => sum + acc.equity, 0);
    const totalProfit = groupAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    const totalTrades = groupAccounts.reduce((sum, acc) => sum + (acc.openTrades || 0), 0);
    const isProfit = totalProfit >= 0;
    
    return { totalBalance, totalEquity, totalProfit, totalTrades, isProfit };
  };

  const groupsData: GroupData[] = React.useMemo(() => {
    const groupedAccounts = accounts.reduce((acc, account) => {
      const groupId = account.group_id || 'ungrouped';
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(account);
      return acc;
    }, {} as Record<string, Account[]>);

    return Object.entries(groupedAccounts).map(([groupId, groupAccounts]) => ({
      groupId,
      groupInfo: getGroupInfo(groupId),
      accounts: groupAccounts,
      stats: getGroupStats(groupAccounts)
    }));
  }, [accounts, groups]);

  const sortedGroups = React.useMemo(() => {
    if (!groupSortConfig || !groupSortConfig.key) {
      // Ordenação padrão estável por nome do grupo
      return [...groupsData].sort((a, b) => {
        const comparison = a.groupInfo.name.localeCompare(b.groupInfo.name);
        if (comparison === 0) {
          return a.groupId.localeCompare(b.groupId);
        }
        return comparison;
      });
    }

    return [...groupsData].sort((a, b) => {
      let comparison = 0;
      
      switch (groupSortConfig.key) {
        case 'name':
          comparison = a.groupInfo.name.localeCompare(b.groupInfo.name);
          break;
        case 'totalProfit':
          comparison = b.stats.totalProfit - a.stats.totalProfit;
          break;
        case 'totalTrades':
          comparison = b.stats.totalTrades - a.stats.totalTrades;
          break;
        default:
          comparison = a.groupInfo.name.localeCompare(b.groupInfo.name);
      }
      
      // Tie-breaker SEMPRE aplicado para estabilidade
      if (comparison === 0) {
        comparison = a.groupId.localeCompare(b.groupId);
      }
      
      return groupSortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [groupsData, groupSortConfig]);

  return (
    <div className="space-y-6">
      {/* Lista de Grupos */}
      {sortedGroups.map((groupData) => {
        const { groupId, groupInfo, accounts: groupAccounts, stats } = groupData;
        
        // Ordenar contas dentro do grupo por número da conta para estabilidade
        const sortedGroupAccounts = [...groupAccounts].sort((a, b) => {
          return a.account.localeCompare(b.account);
        });
        
        return (
          <Card 
            key={groupId} 
            className="overflow-hidden border"
            style={{ 
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: `${groupInfo.color}80` // Adding 80 for 50% opacity in hex
            }}
          >
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
              {/* Cabeçalho das Colunas - Distribuição otimizada */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-border/30 bg-muted/20 text-xs font-medium text-muted-foreground">
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Account Name</div>
                <div className="col-span-1">Client</div>
                <div className="col-span-1">VPS</div>
                <div className="col-span-1 text-right">Balance</div>
                <div className="col-span-1 text-right">Equity</div>
                <div className="col-span-1 text-center">Trades</div>
                <div className="col-span-1 text-right">Open P&L</div>
                <div className="col-span-1 text-right">Day P&L</div>
                <div className="col-span-1">Server</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              <div className="space-y-2">
                {sortedGroupAccounts.map((account) => {
                  const connectionStatus = getConnectionStatus(account.updated_at);
                  const isProfit = account.profit >= 0;
                  const isDayProfit = (account.dayProfit || 0) >= 0;
                  const brokerName = getBrokerName(account);
                  
                  return (
                    <div
                      key={account.id}
                      className="grid grid-cols-12 gap-3 p-4 rounded-lg border bg-card/50 hover:bg-muted/30 transition-colors items-center text-sm"
                    >
                      {/* Status */}
                      <div className="col-span-1 flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${connectionStatus.color} border-0`}
                        >
                          {connectionStatus.icon}
                        </Badge>
                      </div>
                      
                      {/* Account Name */}
                      <div className="col-span-2">
                        <div className="font-medium text-foreground">
                          {account.name || `Account ${account.account}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {account.clientNickname || 'N/A'}
                        </div>
                      </div>
                      
                      {/* Client */}
                      <div className="col-span-1">
                        <div className="text-xs">{permissions.isAdminOrManager ? (account.clientNickname || 'N/A') : 'N/A'}</div>
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
                        <Badge variant="outline" className="font-mono">
                          {account.openTrades || 0}
                        </Badge>
                      </div>
                      
                      {/* Open P&L */}
                      <div className="col-span-1 text-right">
                        <div className={`flex items-center justify-end gap-1 font-mono text-xs ${
                          isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isProfit ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{formatCurrency(account.profit)}</span>
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
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        {permissions.canCloseAllPositions && (account.openTrades || 0) > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCloseAllPositions?.(account)}
                            className="text-xs text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-colors px-2"
                            title="Close All Positions"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {permissions.canEditAccounts && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditAccount(account)}
                            className="text-xs text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors px-2"
                            title="Edit Account"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewAccount?.(account.account)}
                          className="text-xs text-sky-500 border-sky-300 hover:bg-sky-50 hover:border-sky-400 transition-colors px-2"
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
