
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { 
  Terminal, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Command,
  Activity,
  Zap
} from 'lucide-react';

const CommandsManagement = () => {
  const { data: commands = [], isLoading } = useQuery({
    queryKey: ['commands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commands')
        .select(`
          *,
          accounts:account_id (
            account,
            name,
            server
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { 
          label: 'Pending', 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: Clock 
        };
      case 'executed':
        return { 
          label: 'Executed', 
          color: 'text-green-600', 
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: CheckCircle 
        };
      case 'failed':
        return { 
          label: 'Failed', 
          color: 'text-red-500', 
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: XCircle 
        };
      case 'error':
        return { 
          label: 'Error', 
          color: 'text-red-600', 
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: AlertCircle 
        };
      default:
        return { 
          label: status, 
          color: 'text-gray-500', 
          bg: 'bg-gray-50 dark:bg-gray-800',
          icon: Clock 
        };
    }
  };

  const getCommandTypeInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case 'close_all':
        return { label: 'Close All', color: 'text-red-600', icon: '🔴' };
      case 'close_position':
        return { label: 'Close Position', color: 'text-orange-500', icon: '🟠' };
      case 'open_position':
        return { label: 'Open Position', color: 'text-green-600', icon: '🟢' };
      case 'modify_position':
        return { label: 'Modify Position', color: 'text-blue-600', icon: '🔵' };
      case 'set_ea_params':
        return { label: 'Set EA Params', color: 'text-purple-600', icon: '⚙️' };
      default:
        return { label: type, color: 'text-gray-500', icon: '📝' };
    }
  };

  // Estatísticas dos comandos
  const totalCommands = commands.length;
  const pendingCommands = commands.filter(cmd => cmd.status.toLowerCase() === 'pending').length;
  const executedCommands = commands.filter(cmd => cmd.status.toLowerCase() === 'executed').length;
  const failedCommands = commands.filter(cmd => ['failed', 'error'].includes(cmd.status.toLowerCase())).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Commands Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerenciamento de comandos enviados para contas MT4/MT5
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Commands</CardTitle>
              <Command className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalCommands}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Últimos 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-yellow-600">{pendingCommands}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aguardando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Executed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">{executedCommands}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Executados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-red-500">{failedCommands}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Com erro
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commands Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Commands</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Executed</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commands.map((command) => {
                    const statusInfo = getStatusInfo(command.status);
                    const typeInfo = getCommandTypeInfo(command.type);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={command.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{typeInfo.icon}</span>
                            <span className={`text-sm font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {command.accounts?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {command.accounts?.account || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(command.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {command.executed ? new Date(command.executed).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {command.data && (
                            <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded border truncate">
                              {JSON.stringify(command.data, null, 2).slice(0, 50)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {command.error && (
                            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded border truncate">
                              {command.error}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {command.status.toLowerCase() === 'failed' && (
                              <Button variant="outline" size="sm">
                                Retry
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {commands.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Terminal className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum comando encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comandos aparecerão aqui quando enviados para contas MT4/MT5
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando comandos...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommandsManagement;
