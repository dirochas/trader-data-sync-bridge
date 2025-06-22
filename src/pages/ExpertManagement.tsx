
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { useExpertAdvisors, ExpertAdvisor } from '@/hooks/useExpertAdvisors';
import { usePermissions } from '@/hooks/usePermissions';
import { UploadEAModal } from '@/components/UploadEAModal';
import { ExpertAdvisorCard } from '@/components/ExpertAdvisorCard';

const ExpertManagement = () => {
  const { data: expertAdvisors, isLoading, error } = useExpertAdvisors();
  const permissions = usePermissions();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingEA, setEditingEA] = useState<ExpertAdvisor | null>(null);

  const handleEdit = (ea: ExpertAdvisor) => {
    setEditingEA(ea);
    setShowUploadModal(true);
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setEditingEA(null);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando Expert Advisors...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Erro ao carregar Expert Advisors</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Expert Management</h1>
            <p className="text-muted-foreground">
              {permissions.isAdminOrManager 
                ? 'Gerenciamento de Expert Advisors, estratégias e backtests'
                : 'Acesso aos Expert Advisors disponíveis para download'
              }
            </p>
          </div>
          
          {permissions.isAdminOrManager && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload EA
            </Button>
          )}
        </div>

        {/* Lista de Expert Advisors */}
        {expertAdvisors && expertAdvisors.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Expert Advisors Disponíveis</h2>
              <div className="text-sm text-muted-foreground">
                {expertAdvisors.length} EA{expertAdvisors.length !== 1 ? 's' : ''} disponível{expertAdvisors.length !== 1 ? 'eis' : ''}
              </div>
            </div>
            
            <div className="space-y-3">
              {expertAdvisors.map((ea) => (
                <ExpertAdvisorCard 
                  key={ea.id} 
                  ea={ea} 
                  onEdit={permissions.isAdminOrManager ? handleEdit : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {permissions.isAdminOrManager 
                  ? 'Nenhum Expert Advisor Cadastrado'
                  : 'Nenhum Expert Advisor Disponível'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {permissions.isAdminOrManager 
                    ? 'Comece a Gerenciar EAs'
                    : 'Aguarde Expert Advisors'
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {permissions.isAdminOrManager 
                    ? 'Faça upload do primeiro Expert Advisor para começar.' 
                    : 'Aguarde os administradores adicionarem Expert Advisors para download.'}
                </p>
                
                {permissions.isAdminOrManager && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro EA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Upload/Edição - apenas para Admin/Manager */}
        {permissions.isAdminOrManager && (
          <UploadEAModal 
            open={showUploadModal} 
            onOpenChange={handleCloseModal}
            editingEA={editingEA}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default ExpertManagement;
