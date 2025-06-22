
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, TrendingUp, TrendingDown, Folder, Users } from 'lucide-react';
import { getConnectionStatus } from '@/hooks/useTradingData';
import { useAccountGroups } from '@/hooks/useAccountGroups';

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

interface AccountGroupViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
}

export const AccountGroupView = ({ accounts, onEditAccount }: AccountGroupViewProps) => {
  const { data: groups = [] } = useAccountGroups();
  
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
    const isProfit = totalProfit >= 0;
    
    return { totalBalance, totalEquity, totalProfit, isProfit };
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
                
                <div className="flex items-center gap-4 text-right">
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
                    <div className="text-sm text-muted-foreground">Contas</div>
                    <div className="font-semibold">{groupAccounts.length}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {groupAccounts.map((account) => {
                  const connectionStatus = getConnectionStatus(account.updated_at);
                  const isProfit = account.profit >= 0;
                  
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-mono font-semibold text-sm">
                            {account.account}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {account.name || `Conta ${account.account}`}
                          </div>
                        </div>
                        
                        <div className="hidden sm:flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {account.vps}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-xs">
                            1:{account.leverage}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatCurrency(account.equity)}
                          </div>
                          <div className={`font-mono text-xs flex items-center gap-1 ${
                            isProfit ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(account.profit)}
                            <span className="opacity-75">
                              ({formatPercentage(account.profit)})
                            </span>
                          </div>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${connectionStatus.color}`}
                        >
                          {connectionStatus.icon}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditAccount(account)}
                          className="hover:bg-accent"
                        >
                          <Edit className="w-4 h-4" />
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
