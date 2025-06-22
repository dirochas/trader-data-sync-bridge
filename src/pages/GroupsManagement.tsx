
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useAccountGroups, useDeleteAccountGroup } from '@/hooks/useAccountGroups';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { EditGroupModal } from '@/components/EditGroupModal';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { AccountGroup } from '@/hooks/useAccountGroups';

const GroupsManagement = () => {
  const { data: groups = [], isLoading } = useAccountGroups();
  const deleteGroupMutation = useDeleteAccountGroup();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null);

  const handleDeleteGroup = async (group: AccountGroup) => {
    await deleteGroupMutation.mutateAsync(group.id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups Management</h1>
          <p className="text-muted-foreground">
            Gerencie grupos de contas para organizar hedge pairs e conjuntos de trading
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Criar Grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro grupo para organizar contas relacionadas em hedge pairs ou conjuntos de trading.
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: group.color }}
                    />
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    ID: {group.id.slice(0, 8)}
                  </Badge>
                </div>
                {group.description && (
                  <CardDescription>{group.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGroup(group)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar grupo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O grupo <strong>{group.name}</strong> será deletado permanentemente.
                            <br /><br />
                            As contas que pertencem a este grupo não serão deletadas, apenas desassociadas do grupo.
                            <br /><br />
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGroup(group)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Deletar Grupo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {editingGroup && (
        <EditGroupModal
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
        />
      )}
    </div>
  );
};

export default GroupsManagement;
