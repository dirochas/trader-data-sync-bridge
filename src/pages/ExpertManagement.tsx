
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { useExpertAdvisors } from '@/hooks/useExpertAdvisors';
import { usePermissions } from '@/hooks/usePermissions';
import { UploadEAModal } from '@/components/UploadEAModal';
import { ExpertAdvisorCard } from '@/components/ExpertAdvisorCard';

const ExpertManagement = () => {
  const { data: expertAdvisors, isLoading, error } = useExpertAdvisors();
  const permissions = usePermissions();
  const [showUploadModal, setShowUploadModal] = useState(false);

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
              Gerenciamento de Expert Advisors, estratégias e backtests
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
                {expertAdvisors.length} EA{expertAdvisors.length !== 1 ? 's' : ''} cadastrado{expertAdvisors.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-3">
              {expertAdvisors.map((ea) => (
                <ExpertAdvisorCard key={ea.id} ea={ea} />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Nenhum Expert Advisor Cadastrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comece a Gerenciar EAs</h3>
                <p className="text-muted-foreground mb-6">
                  {permissions.isAdminOrManager 
                    ? 'Faça upload do primeiro Expert Advisor para começar.' 
                    : 'Aguarde os administradores adicionarem Expert Advisors.'}
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

        {/* Modal de Upload */}
        <UploadEAModal 
          open={showUploadModal} 
          onOpenChange={setShowUploadModal} 
        />
      </div>
    </AppLayout>
  );
};

export default ExpertManagement;
