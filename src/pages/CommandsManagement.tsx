import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AppLayout } from '@/components/AppLayout';
import { usePagination } from '@/hooks/usePagination';
import { 
  Terminal, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

// Mock data para comandos - depois será substituído por dados reais
const mockCommands = [
  {
    id: 1,
    command: 'CLOSE_ALL_POSITIONS',
    account: '123456789',
    vps: 'VPS-e250738f',
    status: 'executed',
    createdAt: new Date('2025-06-17T15:30:00'),
    executedAt: new Date('2025-06-17T15:30:15'),
    result: 'All positions closed successfully'
  },
  {
    id: 2,
    command: 'SET_LOT_SIZE',
    account: '987654321',
    vps: 'VPS-8bfca44d',
    status: 'pending',
    createdAt: new Date('2025-06-17T16:15:00'),
    executedAt: null,
    result: null,
    parameters: { lot_size: 0.1 }
  },
  {
    id: 3,
    command: 'UPDATE_SETTINGS',
    account: '456789123',
    vps: 'VPS-e250738f',
    status: 'failed',
    createdAt: new Date('2025-06-17T14:45:00'),
    executedAt: new Date('2025-06-17T14:45:30'),
    result: 'Connection timeout'
  },
  {
    id: 4,
    command: 'GET_BALANCE',
    account: '789123456',
    vps: 'VPS-d3390d6d',
    status: 'executed',
    createdAt: new Date('2025-06-17T13:20:00'),
    executedAt: new Date('2025-06-17T13:20:05'),
    result: 'Balance: $15,432.67'
  }
];

const CommandsManagement = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredCommands = selectedStatus === 'all' 
    ? mockCommands 
    : mockCommands.filter(cmd => cmd.status === selectedStatus);

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination(filteredCommands, itemsPerPage);

  const statusCounts = {
    total: mockCommands.length,
    executed: mockCommands.filter(cmd => cmd.status === 'executed').length,
    pending: mockCommands.filter(cmd => cmd.status === 'pending').length,
    failed: mockCommands.filter(cmd => cmd.status === 'failed').length
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredCommands.length);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => goToPage(i)}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => goToPage(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => goToPage(i)}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              isActive={currentPage === totalPages}
              onClick={() => goToPage(totalPages)}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Executed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
            Commands Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerenciamento e monitoramento de comandos enviados para as contas MT4/MT5
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="tech-card tech-card-hover card-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Commands</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/20 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                <Terminal className="h-5 w-5 text-sky-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-gray-900 dark:text-white">{statusCounts.total}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Comandos enviados
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Executed</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-emerald-500">{statusCounts.executed}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Executados com sucesso
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-yellow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-amber-600">{statusCounts.pending}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aguardando execução
              </p>
            </CardContent>
          </Card>

          <Card className="tech-card tech-card-hover card-red">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Failed</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400/20 to-rose-500/20 flex items-center justify-center flex-shrink-0 border border-rose-400/20">
                <XCircle className="h-5 w-5 text-rose-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium text-rose-400">{statusCounts.failed}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Falharam na execução
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commands Table */}
        <Card className="tech-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Recent Commands</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="executed">Executed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Results per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Command</TableHead>
                    <TableHead className="font-medium">Account</TableHead>
                    <TableHead className="font-medium">VPS</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Created</TableHead>
                    <TableHead className="font-medium">Executed</TableHead>
                    <TableHead className="font-medium">Result</TableHead>
                    <TableHead className="font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((command) => (
                    <TableRow key={command.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {command.command}
                      </TableCell>
                      <TableCell className="font-medium">
                        {command.account}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {command.vps}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(command.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {command.createdAt.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {command.executedAt ? command.executedAt.toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-sm max-w-48 truncate">
                        {command.result || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300"
                          >
                            Details
                          </Button>
                          {command.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredCommands.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/20">
                <div className="text-sm text-gray-500">
                  Showing {startIndex} to {endIndex} of {filteredCommands.length} results
                </div>
                
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={previousPage}
                          className={hasPreviousPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={nextPage}
                          className={hasNextPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}

            {filteredCommands.length === 0 && (
              <div className="text-center py-12">
                <Terminal className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {selectedStatus === 'all' ? 'Nenhum comando encontrado' : `Nenhum comando ${selectedStatus} encontrado`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Os comandos aparecerão aqui quando forem enviados para as contas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommandsManagement;
