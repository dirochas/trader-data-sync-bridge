import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Archive, Trash2 } from 'lucide-react';
import { useAccountGroups } from '@/hooks/useAccountGroups';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string | null;
    account: string;
    vps: string | null;
    vps_unique_id: string | null;
    broker: string | null;
    server: string;
    status?: string;
    group_id?: string | null;
  } | null;
  onAccountUpdated: () => void;
}

const EditAccountModal = ({ isOpen, onClose, account, onAccountUpdated }: EditAccountModalProps) => {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    group_id: account?.group_id || 'none',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { data: groups = [], isLoading: groupsLoading } = useAccountGroups();

  React.useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        group_id: account.group_id || 'none',
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: formData.name.trim() || null,
          group_id: formData.group_id === 'none' ? null : formData.group_id,
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Conta atualizada",
        description: "Os dados da conta foram atualizados com sucesso.",
      });

      onAccountUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveAccount = async () => {
    if (!account) return;

    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          status: 'archived',
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Conta arquivada",
        description: "A conta foi arquivada com sucesso. Ela não aparecerá mais no monitor ativo, mas o histórico permanece acessível.",
      });

      onAccountUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao arquivar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível arquivar a conta.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Conta movida para lixeira",
        description: "A conta foi movida para lixeira e será permanentemente deletada em 30 dias. Você pode restaurá-la até lá.",
        variant: "destructive",
      });

      onAccountUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover a conta para lixeira.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        
        {account && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da conta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Grupo</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}
                disabled={groupsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum grupo</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Número da Conta</Label>
              <Input
                id="account"
                value={account.account}
                disabled
                className="bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Este campo não pode ser editado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vps">Nome do VPS (Display)</Label>
              <Input
                id="vps"
                value={account.vps || ''}
                disabled
                className="bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Para editar o nome do VPS, use a página VPS Management - isso atualizará todas as contas deste VPS
              </p>
            </div>

            {account.vps_unique_id && (
              <div className="space-y-2">
                <Label htmlFor="vps_unique_id">ID Único do VPS</Label>
                <Input
                  id="vps_unique_id"
                  value={account.vps_unique_id}
                  disabled
                  className="bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed font-mono text-sm"
                />
                <p className="text-xs text-gray-500">Identificador único interno (não editável)</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="server">Servidor</Label>
              <Input
                id="server"
                value={account.server || 'N/A'}
                disabled
                className="bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed font-mono text-sm"
              />
              <p className="text-xs text-gray-500">Este campo é atualizado automaticamente pelo EA</p>
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              {/* Botão principal de salvar */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Ações Avançadas</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-between space-x-2">
                {/* Botão Arquivar */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 hover:text-amber-800"
                      disabled={isLoading || isArchiving || isDeleting}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Arquivar conta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A conta <strong>{account.name || account.account}</strong> será arquivada e não aparecerá mais no monitor ativo.
                        <br /><br />
                        O histórico de trades e dados permanecerão acessíveis para consulta, mas a conta não estará mais "em trabalho".
                        <br /><br />
                        Você pode reverter esta ação posteriormente se necessário.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleArchiveAccount}
                        disabled={isArchiving}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {isArchiving ? 'Arquivando...' : 'Arquivar Conta'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Botão Deletar */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400 hover:text-red-800"
                      disabled={isLoading || isArchiving || isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mover conta para lixeira?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A conta <strong>{account.name || account.account}</strong> será movida para lixeira.
                        <br /><br />
                        <span className="text-amber-600 font-medium">⚠️ Esta ação pode ser revertida por 30 dias.</span>
                        <br /><br />
                        Após 30 dias, a conta e todos os seus dados (histórico, posições, etc.) serão <strong>permanentemente deletados</strong>.
                        <br /><br />
                        Use esta opção apenas para contas que nunca mais serão utilizadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? 'Movendo...' : 'Mover para Lixeira'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;
