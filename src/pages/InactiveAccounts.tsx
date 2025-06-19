
import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Archive, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useTradingAccounts } from '@/hooks/useTradingData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getConnectionStatus } from '@/hooks/useTradingData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InactiveAccounts = () => {
  const [showArchived, setShowArchived] = useState(true);
  const [showDeleted, setShowDeleted] = useState(true);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Buscar contas arquivadas e deletadas
  const { data: accounts, isLoading, refetch } = useTradingAccounts(showArchived, showDeleted);

  // Filtrar apenas contas não-ativas
  const inactiveAccounts = accounts?.filter(account => 
    account.status === 'archived' || account.status === 'deleted'
  ) || [];

  const archivedAccounts = inactiveAccounts.filter(account => account.status === 'archived');
  const deletedAccounts = inactiveAccounts.filter(account => account.status === 'deleted');

  const handleRestoreAccount = async (accountId: string, accountName: string) => {
    setIsRestoring(accountId);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          status: 'active',
          deleted_at: null,
        })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Conta restaurada",
        description: `A conta ${accountName} foi restaurada e voltou para o monitor ativo.`,
      });

      refetch();
    } catch (error) {
      console.error('Erro ao restaurar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar a conta.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(null);
    }
  };

  const handlePermanentDelete = async (accountId: string, accountName: string) => {
    setIsPermanentDeleting(accountId);
    try {
      // Deletar dados relacionados primeiro
      await supabase.from('positions').delete().eq('account_id', accountId);
      await supabase.from('history').delete().eq('account_id', accountId);
      await supabase.from('margin').delete().eq('account_id', accountId);
      await supabase.from('commands').delete().eq('account_id', accountId);
      
      // Deletar a conta
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Conta permanentemente deletada",
        description: `A conta ${accountName} e todos os seus dados foram permanentemente removidos.`,
        variant: "destructive",
      });

      refetch();
    } catch (error) {
      console.error('Erro ao deletar permanentemente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar permanentemente a conta.",
        variant: "destructive",
      });
    } finally {
      setIsPermanentDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'archived':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50">Arquivada</Badge>;
      case 'deleted':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50">Lixeira</Badge>;
      default:
        return <Badge variant="default">Ativa</Badge>;
    }
  };

  const getDaysUntilPermanentDeletion = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysPassed;
    return Math.max(0, daysRemaining);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-display text-white">Contas Inativas</h1>
            <p className="text-caption mt-1">Gerencie contas arquivadas e na lixeira</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 ${
                showArchived 
                  ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600" 
                  : "text-orange-400 border-orange-400/50 hover:bg-orange-400/10 hover:border-orange-400"
              }`}
            >
              {showArchived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Arquivadas ({archivedAccounts.length})
            </Button>
            <Button
              variant={showDeleted ? "default" : "outline"}
              onClick={() => setShowDeleted(!showDeleted)}
              className={`flex items-center gap-2 ${
                showDeleted 
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                  : "text-red-400 border-red-400/50 hover:bg-red-400/10 hover:border-red-400"
              }`}
            >
              {showDeleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Lixeira ({deletedAccounts.length})
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="tech-card tech-card-hover card-blue">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-200">Total Inativas</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/20">
                <Archive className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{inactiveAccounts.length}</div>
              <p className="text-xs text-gray-400 mt-1">Contas não-ativas</p>
            </CardContent>
          </Card>
          
          <Card className="tech-card tech-card-hover card-yellow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-200">Arquivadas</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center border border-orange-500/20">
                <Archive className="h-5 w-5 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{archivedAccounts.length}</div>
              <p className="text-xs text-gray-400 mt-1">Podem ser restauradas</p>
            </CardContent>
          </Card>
          
          <Card className="tech-card tech-card-hover card-red">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-gray-200">Na Lixeira</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center border border-red-500/20">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{deletedAccounts.length}</div>
              <p className="text-xs text-gray-400 mt-1">30 dias para deleção</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de contas */}
        {inactiveAccounts.length > 0 ? (
          <Card className="tech-card tech-card-hover">
            <CardHeader>
              <CardTitle className="text-heading text-white">Contas Inativas</CardTitle>
              <CardDescription className="text-gray-400">
                Contas arquivadas e na lixeira disponíveis para gerenciamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="font-medium text-gray-300">Conta</TableHead>
                    <TableHead className="font-medium text-gray-300">Nome</TableHead>
                    <TableHead className="font-medium text-gray-300">VPS</TableHead>
                    <TableHead className="font-medium text-gray-300">Status</TableHead>
                    <TableHead className="font-medium text-gray-300">Última Atualização</TableHead>
                    <TableHead className="font-medium text-gray-300">Conexão</TableHead>
                    <TableHead className="font-medium text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveAccounts
                    .filter(account => {
                      if (!showArchived && account.status === 'archived') return false;
                      if (!showDeleted && account.status === 'deleted') return false;
                      return true;
                    })
                    .map((account) => {
                      const connectionStatus = getConnectionStatus(account.updated_at);
                      const daysUntilDeletion = account.deleted_at ? getDaysUntilPermanentDeletion(account.deleted_at) : null;
                      
                      return (
                        <TableRow key={account.id} className="border-gray-700 hover:bg-gray-800/30 transition-colors">
                          <TableCell className="font-mono font-medium text-gray-200">
                            {account.account}
                          </TableCell>
                          <TableCell className="font-medium text-gray-200">
                            {account.name || <span className="text-gray-500 italic">Sem nome</span>}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-300">
                            {account.vps || account.vps_unique_id || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(account.status)}
                              {account.status === 'deleted' && daysUntilDeletion !== null && (
                                <span className="text-xs text-red-400 font-medium">
                                  {daysUntilDeletion > 0 
                                    ? `${daysUntilDeletion} dias restantes`
                                    : 'Será deletada hoje'
                                  }
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {formatDistanceToNow(new Date(account.updated_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${connectionStatus.color}`}>
                              {connectionStatus.icon} {connectionStatus.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* Botão Restaurar */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-400 border-orange-400/50 hover:bg-orange-400/10 hover:border-orange-400 transition-colors"
                                    disabled={isRestoring === account.id || isPermanentDeleting === account.id}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Restaurar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-gray-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Restaurar conta?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-300">
                                      A conta <strong>{account.name || account.account}</strong> será restaurada e voltará para o monitor ativo.
                                      <br /><br />
                                      Ela aparecerá novamente na lista de contas ativas e poderá receber dados do EA.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRestoreAccount(account.id, account.name || account.account)}
                                      disabled={isRestoring === account.id}
                                      className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                      {isRestoring === account.id ? 'Restaurando...' : 'Restaurar Conta'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {/* Botão Deletar Permanentemente - só aparece para contas na lixeira */}
                              {account.status === 'deleted' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-400 border-red-400/50 hover:bg-red-400/10 hover:border-red-400 transition-colors"
                                      disabled={isRestoring === account.id || isPermanentDeleting === account.id}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Deletar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">Deletar permanentemente?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-300">
                                        <span className="text-red-400 font-bold">⚠️ AÇÃO IRREVERSÍVEL!</span>
                                        <br /><br />
                                        A conta <strong>{account.name || account.account}</strong> e TODOS os seus dados serão permanentemente deletados:
                                        <br />
                                        • Histórico de trades
                                        • Posições abertas
                                        • Dados de margem
                                        • Comandos
                                        <br /><br />
                                        <strong>Esta ação NÃO pode ser desfeita!</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600">Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handlePermanentDelete(account.id, account.name || account.account)}
                                        disabled={isPermanentDeleting === account.id}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                      >
                                        {isPermanentDeleting === account.id ? 'Deletando...' : 'Deletar Permanentemente'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="tech-card tech-card-hover">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Archive className="h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-heading text-white mb-2">Nenhuma conta inativa</h3>
              <p className="text-gray-400 text-center">
                Não há contas arquivadas ou na lixeira no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default InactiveAccounts;
