
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
          color: 'text-yellow-500', 
          bg: 'bg-yellow-500/10',
          icon: Clock 
        };
      case 'executed':
        return { 
          label: 'Executed', 
          color: 'text-green-500', 
          bg: 'bg-green-500/10',
          icon: CheckCircle 
        };
      case 'failed':
        return { 
          label: 'Failed', 
          color: 'text-red-400', 
          bg: 'bg-red-500/10',
          icon: XCircle 
        };
      case 'error':
        return { 
          label: 'Error', 
          color: 'text-red-500', 
          bg: 'bg-red-500/10',
          icon: AlertCircle 
        };
      default:
        return { 
          label: status, 
          color: 'text-gray-400', 
          bg: 'bg-gray-500/10',
          icon: Clock 
        };
    }
  };

  const getCommandTypeInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case 'close_all':
        return { label: 'Close All', color: 'text-red-400', icon: '🔴' };
      case 'close_position':
        return { label: 'Close Position', color: 'text-orange-400', icon: '🟠' };
      case 'open_position':
        return { label: 'Open Position', color: 'text-green-400', icon: '🟢' };
      case 'modify_position':
        return { label: 'Modify Position', color: 'text-blue-400', icon: '🔵' };
      case 'set_ea_params':
        return { label: 'Set EA Params', color: 'text-purple-400', icon: '⚙️' };
      default:
        return { label: type, color: 'text-gray-400', icon: '📝' };
    }
  };

  // Estatísticas dos comandos
  const totalCommands = commands.length;
  const pendingCommands = commands.filter(cmd => cmd.status.toLowerCase() === 'pending').length;
  const executedCommands = commands.filter(cmd => cmd.status.toLowerCase() === 'executed').length;
  const failedCommands = commands.filter(cmd => ['failed', 'error'].includes(cmd.status.toLowerCase())).length;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h1 className="text-display text-2xl md:text-3xl text-white">
            Commands Management
          </h1>
          <p className="text-caption text-muted-foreground/80">
            Gerenciamento de comandos enviados para contas MT4/MT5
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="tech-card tech-card-hover border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Commands</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <Command className="h-7 w-7 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{totalCommands}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Últimos 100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-yellow-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/20">
                <Clock className="h-7 w-7 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-neutral">{pendingCommands}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-slow">
                    Aguardando
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-green-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Executed</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                <CheckCircle className="h-7 w-7 text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-positive">{executedCommands}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-live">
                    Executados
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover border-red-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Failed</CardTitle>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <XCircle className="h-7 w-7 text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-display text-2xl md:text-3xl metric-negative">{failedCommands}</div>
                <div className="flex items-center gap-2">
                  <span className="status-indicator status-disconnected">
                    Com erro
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commands Table */}
        <Card className="tech-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading text-lg md:text-xl text-white">Recent Commands</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-caption">Status</TableHead>
                    <TableHead className="text-caption">Type</TableHead>
                    <TableHead className="text-caption">Account</TableHead>
                    <TableHead className="text-caption">Created</TableHead>
                    <TableHead className="text-caption">Executed</TableHead>
                    <TableHead className="text-caption">Data</TableHead>
                    <TableHead className="text-caption">Error</TableHead>
                    <TableHead className="text-caption">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commands.map((command) => {
                    const statusInfo = getStatusInfo(command.status);
                    const typeInfo = getCommandTypeInfo(command.type);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={command.id} className="table-row-hover border-border/30">
                        <TableCell className="py-4">
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
                        <TableCell className="text-body">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {command.accounts?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {command.accounts?.account || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-body text-muted-foreground">
                          {new Date(command.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-body text-muted-foreground">
                          {command.executed ? new Date(command.executed).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell className="text-body max-w-xs">
                          {command.data && (
                            <div className="text-xs font-mono bg-gray-800/50 p-2 rounded border truncate">
                              {JSON.stringify(command.data, null, 2).slice(0, 50)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-body max-w-xs">
                          {command.error && (
                            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded border truncate">
                              {command.error}
                            </div>
                          )}
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
                            {command.status.toLowerCase() === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="action-button action-button-warning text-xs h-8"
                              >
                                RETRY
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
              <div className="text-center py-12 text-muted-foreground/70">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-body">Nenhum comando encontrado</p>
                <p className="text-caption text-muted-foreground/60 mt-2">
                  Comandos aparecerão aqui quando enviados para contas MT4/MT5
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12 text-muted-foreground/70">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-body">Carregando comandos...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommandsManagement;
