
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTradingAccounts } from '@/hooks/useTradingData';
import { AppLayout } from '@/components/AppLayout';
import { 
  Server, 
  Plus, 
  Monitor,
  Wifi,
  WifiOff,
  Users,
  Activity
} from 'lucide-react';

const VPSManagement = () => {
  const { data: accounts = [] } = useTradingAccounts();
  
  // Agrupar contas por VPS
  const vpsGroups = accounts.reduce((acc, account) => {
    const vpsName = account.vps || 'Unknown VPS';
    if (!acc[vpsName]) {
      acc[vpsName] = {
        vpsName,
        accounts: [],
        totalAccounts: 0,
        connectedAccounts: 0,
        totalBalance: 0,
        totalEquity: 0,
        lastUpdate: new Date(0)
      };
    }
    
    acc[vpsName].accounts.push(account);
    acc[vpsName].totalAccounts++;
    acc[vpsName].totalBalance += Number(account.balance) || 0;
    acc[vpsName].totalEquity += Number(account.equity) || 0;
    
    const accountUpdate = new Date(account.updated_at);
    if (accountUpdate > acc[vpsName].lastUpdate) {
      acc[vpsName].lastUpdate = accountUpdate;
    }
    
    // Conta como conectada se foi atualizada nos últimos 2 minutos
    const now = new Date();
    const diffInMinutes = (now.getTime() - accountUpdate.getTime()) / (1000 * 60);
    if (diffInMinutes <= 2) {
      acc[vpsName].connectedAccounts++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const vpsData = Object.values(vpsGroups);
  
  const getVPSStatus = (vps: any) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - vps.lastUpdate.getTime()) / (1000 * 60);
    
    if (diffInMinutes <= 2) {
      return { status: 'Online', color: 'text-green-500', icon: Wifi };
    } else if (diffInMinutes <= 10) {
      return { status: 'Delayed', color: 'text-yellow-500', icon: Wifi };
    } else {
      return { status: 'Offline', color: 'text-red-400', icon: WifiOff };
    }
  };

  const totalVPS = vpsData.length;
  const onlineVPS = vpsData.filter(vps => getVPSStatus(vps).status === 'Online').length;
  const totalAccountsAcrossVPS = vpsData.reduce((sum, vps) => sum + vps.totalAccounts, 0);
  const totalEquityAcrossVPS = vpsData.reduce((sum, vps) => sum + vps.totalEquity, 0);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h1 className="text-display text-2xl md:text-3xl text-white">
            VPS Management
          </h1>
          <p className="text-caption text-muted-foreground/80">
            Gerenciamento de servidores VPS e infraestrutura de trading
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="tech-card tech-card-hover border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total VPS</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <Server className="h-7 w-7 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{totalVPS}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    {onlineVPS} online
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-green-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Online VPS</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                <Wifi className="h-7 w-7 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-positive">{onlineVPS}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    {((onlineVPS / totalVPS) * 100).toFixed(0)}% uptime
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Accounts</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Users className="h-7 w-7 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{totalAccountsAcrossVPS}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Distribuídas nos VPS
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-amber-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Equity</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <Activity className="h-7 w-7 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-lg md:text-2xl metric-positive">
                  US$ {totalEquityAcrossVPS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Equity total
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* VPS Table */}
        <Card className="tech-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading text-lg md:text-xl text-white">VPS Servers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-caption">Status</TableHead>
                    <TableHead className="text-caption">VPS Name</TableHead>
                    <TableHead className="text-caption text-right">Accounts</TableHead>
                    <TableHead className="text-caption text-right">Connected</TableHead>
                    <TableHead className="text-caption text-right">Total Balance</TableHead>
                    <TableHead className="text-caption text-right">Total Equity</TableHead>
                    <TableHead className="text-caption">Last Update</TableHead>
                    <TableHead className="text-caption">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vpsData.map((vps) => {
                    const status = getVPSStatus(vps);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={vps.vpsName} className="table-row-hover border-border/30">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-body font-medium">{vps.vpsName}</TableCell>
                        <TableCell className="text-right text-body font-bold">
                          {vps.totalAccounts}
                        </TableCell>
                        <TableCell className="text-right text-body">
                          <span className={vps.connectedAccounts > 0 ? 'metric-positive' : 'metric-negative'}>
                            {vps.connectedAccounts}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-body font-mono metric-neutral">
                          US$ {vps.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-body font-mono metric-neutral">
                          US$ {vps.totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-body text-muted-foreground">
                          {vps.lastUpdate.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="action-button action-button-primary text-xs h-8"
                            >
                              VIEW
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="action-button action-button-warning text-xs h-8"
                            >
                              EDIT
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {vpsData.length === 0 && (
              <div className="text-center py-12 text-muted-foreground/70">
                <div className="text-4xl mb-4">🖥️</div>
                <p className="text-body">Nenhum VPS detectado</p>
                <p className="text-caption text-muted-foreground/60 mt-2">
                  Conecte seus EAs para começar a detectar VPS automaticamente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VPSManagement;
