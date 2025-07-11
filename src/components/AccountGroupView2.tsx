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

interface AccountGroupView2Props {
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

export const AccountGroupView2 = ({ 
  accounts, 
  onEditAccount, 
  onViewAccount,
  onCloseAllPositions,
  groupSortConfig 
}: AccountGroupView2Props) => {
  const { data: groups = [] } = useAccountGroups();
  const permissions = usePermissions();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getGroupInfo = (groupId: string) => {
    if (groupId === 'ungrouped') {
      return {
        name: 'Sem Grupo',
        description: 'Contas sem grupo',
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
          comparison = a.stats.totalProfit - b.stats.totalProfit;
          break;
        case 'totalTrades':
          comparison = a.stats.totalTrades - b.stats.totalTrades;
          break;
        default:
          comparison = a.groupInfo.name.localeCompare(b.groupInfo.name);
      }
      
      if (comparison === 0) {
        comparison = a.groupId.localeCompare(b.groupId);
      }
      
      return groupSortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [groupsData, groupSortConfig]);

  return (
    <div className="space-y-6">
      {/* Layout responsivo em grid para os grupos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedGroups.map((groupData) => {
          const { groupId, groupInfo, accounts: groupAccounts, stats } = groupData;
          
          const sortedGroupAccounts = [...groupAccounts].sort((a, b) => {
            return a.account.localeCompare(b.account);
          });
          
          return (
            <Card 
              key={groupId} 
              className="overflow-hidden border-l-4 hover:shadow-md transition-shadow"
              style={{ 
                borderLeftColor: groupInfo.color
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupInfo.color }}
                    />
                    <CardTitle className="text-base flex items-center gap-2">
                      {groupId === 'ungrouped' ? (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                      {groupInfo.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {groupAccounts.length}
                  </Badge>
                </div>
                
                {/* Stats compactos do grupo */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {stats.totalTrades}
                    </Badge>
                    <span className="text-xs text-muted-foreground">trades</span>
                  </div>
                  <div className={`font-mono text-sm font-semibold flex items-center gap-1`}
                       style={{ color: stats.isProfit ? 'rgb(42 176 91)' : 'rgb(211 147 147)' }}>
                    {stats.isProfit ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatCurrency(stats.totalProfit)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Lista compacta de contas */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sortedGroupAccounts.map((account) => {
                    const connectionStatus = getConnectionStatus(account.updated_at);
                    const isProfit = account.profit >= 0;
                    
                    return (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-2 rounded border bg-card/30 hover:bg-muted/50 transition-colors"
                      >
                        {/* Status + Nome */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="text-lg" title={connectionStatus.status}>
                            {connectionStatus.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {account.name || `Account ${account.account}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {account.account}
                            </div>
                          </div>
                        </div>
                        
                        {/* Trades + P&L */}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {account.openTrades || 0}
                          </Badge>
                          <div className={`font-mono text-xs font-semibold flex items-center gap-1`}
                               style={{ color: isProfit ? 'rgb(42 176 91)' : 'rgb(211 147 147)' }}>
                            {isProfit ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">
                              {formatCurrency(account.profit)}
                            </span>
                            <span className="sm:hidden">
                              {Math.abs(account.profit) > 1000 
                                ? `${isProfit ? '+' : '-'}${Math.abs(account.profit / 1000).toFixed(1)}k`
                                : formatCurrency(account.profit)
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Ações compactas */}
                        <div className="flex items-center gap-1 ml-2">
                          {permissions.canCloseAllPositions && (account.openTrades || 0) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCloseAllPositions?.(account)}
                              className="text-xs text-red-600 border-red-300 hover:bg-red-50 p-1 h-6 w-6"
                              title="Close All"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {permissions.canEditAccounts && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditAccount(account)}
                              className="text-xs text-gray-600 border-gray-300 hover:bg-gray-50 p-1 h-6 w-6"
                              title="Edit"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewAccount?.(account.account)}
                            className="text-xs text-sky-500 border-sky-300 hover:bg-sky-50 p-1 h-6 w-6"
                            title="View"
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
    </div>
  );
};
