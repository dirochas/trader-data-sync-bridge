
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
      return { status: 'Online', color: 'text-green-600', icon: Wifi };
    } else if (diffInMinutes <= 10) {
      return { status: 'Delayed', color: 'text-yellow-600', icon: Wifi };
    } else {
      return { status: 'Offline', color: 'text-red-500', icon: WifiOff };
    }
  };

  const totalVPS = vpsData.length;
  const onlineVPS = vpsData.filter(vps => getVPSStatus(vps).status === 'Online').length;
  const totalAccountsAcrossVPS = vpsData.reduce((sum, vps) => sum + vps.totalAccounts, 0);
  const totalEquityAcrossVPS = vpsData.reduce((sum, vps) => sum + vps.totalEquity, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            VPS Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerenciamento de servidores VPS e infraestrutura de trading
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total VPS</CardTitle>
              <Server className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalVPS}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {onlineVPS} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Online VPS</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">{onlineVPS}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {((onlineVPS / totalVPS) * 100).toFixed(0)}% uptime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Accounts</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalAccountsAcrossVPS}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Distribuídas nos VPS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Equity</CardTitle>
              <Activity className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                US$ {totalEquityAcrossVPS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Equity total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* VPS Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">VPS Servers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>VPS Name</TableHead>
                    <TableHead className="text-right">Accounts</TableHead>
                    <TableHead className="text-right">Connected</TableHead>
                    <TableHead className="text-right">Total Balance</TableHead>
                    <TableHead className="text-right">Total Equity</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vpsData.map((vps) => {
                    const status = getVPSStatus(vps);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={vps.vpsName}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{vps.vpsName}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {vps.totalAccounts}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={vps.connectedAccounts > 0 ? 'text-green-600' : 'text-red-500'}>
                            {vps.connectedAccounts}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          US$ {vps.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          US$ {vps.totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {vps.lastUpdate.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit
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
              <div className="text-center py-12">
                <Server className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum VPS detectado</h3>
                <p className="mt-1 text-sm text-gray-500">
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
