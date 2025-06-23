
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccountGroups, useCreateAccountGroup } from '@/hooks/useAccountGroups';
import { Plus, Archive, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
  onAccountUpdated: () => void;
}

interface AccountGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export default function EditAccountModal({ isOpen, onClose, account, onAccountUpdated }: EditAccountModalProps) {
  const [accountName, setAccountName] = useState(account?.name || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(account?.group_id || 'none');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: groups = [] } = useAccountGroups();
  const { toast } = useToast();
  const { profile } = useAuth();
  const createGroupMutation = useCreateAccountGroup();

  useEffect(() => {
    if (account) {
      setAccountName(account.name || '');
      setSelectedGroupId(account.group_id || 'none');
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('🔄 Iniciando atualização da conta:', account.id);
      console.log('👤 Usuário atual:', profile?.email, 'Role:', profile?.role);
      
      const updates = {
        name: accountName.trim(),
        group_id: selectedGroupId === "none" ? null : selectedGroupId,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Dados para atualização:', updates);

      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', account.id)
        .select();

      if (error) {
        console.error('❌ Erro na atualização:', error);
        toast({
          title: "Erro de Permissão",
          description: `Não foi possível atualizar a conta. ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Conta atualizada com sucesso:', data);

      toast({
        title: "Conta atualizada",
        description: "A conta foi atualizada com sucesso.",
      });
      
      onAccountUpdated();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      toast({
        title: "Erro",
        description: `Erro inesperado: ${error.message || 'Tente novamente.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveAccount = async () => {
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Conta arquivada",
        description: "A conta foi arquivada com sucesso.",
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
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Conta movida para lixeira",
        description: "A conta foi movida para a lixeira. Você tem 30 dias para restaurá-la.",
        variant: "destructive",
      });

      onAccountUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover a conta para a lixeira.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o grupo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        color: newGroupColor,
      });
      
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupColor('#3B82F6');
      setShowCreateGroup(false);
      
      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso.",
      });
      
      // Aguardar um pouco para o cache ser atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    }
  };

  const handleCancelCreateGroup = () => {
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupColor('#3B82F6');
  };

  return (
    <>
      <Dialog open={isOpen && !showCreateGroup} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Nome da conta"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account">Número da Conta</Label>
              <Input
                id="account"
                value={account?.account || ''}
                placeholder="Este campo não pode ser editado"
                disabled
                style={{ backgroundColor: '#4c4f55', color: '#FFF' }}
                className="cursor-not-allowed border-gray-600"
              />
              <p className="text-xs text-gray-500">Este campo não pode ser editado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Grupo</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedGroupId} 
                  onValueChange={(value) => setSelectedGroupId(value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum grupo</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateGroup(true)}
                  className="px-3"
                  title="Criar novo grupo"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vps_unique_id">ID Único do VPS</Label>
              <Input
                id="vps_unique_id"
                value={account?.vps_unique_id || ''}
                placeholder="Identificador único interno (não editável)"
                disabled
                style={{ backgroundColor: '#4c4f55', color: '#FFF' }}
                className="cursor-not-allowed border-gray-600"
              />
              <p className="text-xs text-gray-500">Identificador único interno (não editável)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="server">Servidor</Label>
              <Input
                id="server"
                value={account?.server || ''}
                placeholder="Este campo é atualizado automaticamente pelo EA"
                disabled
                style={{ backgroundColor: '#4c4f55', color: '#FFF' }}
                className="cursor-not-allowed border-gray-600"
              />
              <p className="text-xs text-gray-500">Este campo é atualizado automaticamente pelo EA</p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>

          {/* Seção de Ações Avançadas */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">AÇÕES AVANÇADAS</h3>
            <div className="flex gap-2">
              {/* Botão Arquivar */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                    disabled={isArchiving || isDeleting}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Arquivar conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A conta <strong>{account?.name || account?.account}</strong> será arquivada e removida do monitor ativo.
                      <br /><br />
                      Você pode restaurar a conta a qualquer momento através da página de gerenciamento de contas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleArchiveAccount}
                      disabled={isArchiving}
                      className="bg-orange-600 hover:bg-orange-700"
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
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isArchiving || isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mover para lixeira?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A conta <strong>{account?.name || account?.account}</strong> será movida para a lixeira.
                      <br /><br />
                      <strong>Você terá 30 dias para restaurar</strong> a conta antes que ela seja permanentemente deletada.
                      <br /><br />
                      Após 30 dias, todos os dados serão perdidos para sempre.
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
                </AlertDialogFooter>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criar Grupo - Separado */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newGroupName">Nome do Grupo</Label>
              <Input
                id="newGroupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nome do grupo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newGroupDescription">Descrição</Label>
              <Input
                id="newGroupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Descrição do grupo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newGroupColor">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="newGroupColor"
                  value={newGroupColor}
                  onChange={(e) => setNewGroupColor(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300"
                />
                <Input
                  value={newGroupColor}
                  onChange={(e) => setNewGroupColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateGroup} className="flex-1">
                Criar Grupo
              </Button>
              <Button variant="outline" onClick={handleCancelCreateGroup} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
