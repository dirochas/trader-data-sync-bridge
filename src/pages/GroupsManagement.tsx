import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Folder, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useAccountGroups, useCreateAccountGroup, useUpdateAccountGroup, useDeleteAccountGroup } from '@/hooks/useAccountGroups';
import { useTradingData } from '@/hooks/useTradingData';
import { useToast } from '@/hooks/use-toast';

const GroupsManagement = () => {
  const { data: groups = [], isLoading } = useAccountGroups();
  const { data: accounts = [] } = useTradingData();
  const createGroupMutation = useCreateAccountGroup();
  const updateGroupMutation = useUpdateAccountGroup();
  const deleteGroupMutation = useDeleteAccountGroup();
  const { toast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Função para contar contas por grupo
  const getGroupAccountCount = (groupId: string) => {
    return accounts.filter(account => account.group_id === groupId).length;
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await createGroupMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingGroup) return;

    try {
      await updateGroupMutation.mutateAsync({
        id: editingGroup.id,
        ...formData
      });
      setIsEditModalOpen(false);
      setEditingGroup(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
    } catch (error) {
      console.error('Erro ao remover grupo:', error);
    }
  };

  const openEditModal = (group: any) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color
    });
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
              Groups Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie grupos de contas para melhor organização
            </p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Grupo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome do grupo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Digite uma descrição para o grupo"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-8 rounded border border-gray-300"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Folder className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum grupo criado
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  Crie seu primeiro grupo para organizar suas contas de trading
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => {
              const accountCount = getGroupAccountCount(group.id);
              
              return (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Folder className="w-5 h-5" />
                            {group.name}
                          </CardTitle>
                          {group.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {accountCount} {accountCount === 1 ? 'conta' : 'contas'}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Grupo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o grupo "{group.name}"? 
                                As contas deste grupo não serão removidas, apenas desagrupadas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Grupo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Grupo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome do grupo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição (Opcional)</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Digite uma descrição para o grupo"
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Cor</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="edit-color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-8 rounded border border-gray-300"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateGroupMutation.isPending}>
                  {updateGroupMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingGroup(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default GroupsManagement;
