
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Edit, Trash2, FileText, Calendar, User } from 'lucide-react';
import { ExpertAdvisor, downloadFile, useIncrementDownloadCount, useDeleteExpertAdvisor } from '@/hooks/useExpertAdvisors';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpertAdvisorCardProps {
  ea: ExpertAdvisor;
  onEdit?: (ea: ExpertAdvisor) => void;
}

export const ExpertAdvisorCard = ({ ea, onEdit }: ExpertAdvisorCardProps) => {
  const permissions = usePermissions();
  const incrementDownload = useIncrementDownloadCount();
  const deleteEA = useDeleteExpertAdvisor();

  const handleDownload = async (filePath: string, fileType: 'ex4' | 'ex5') => {
    const fileName = `${ea.name}_v${ea.version}.${fileType}`;
    const success = await downloadFile(filePath, fileName);
    
    if (success) {
      incrementDownload.mutate(ea.id);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja deletar o EA "${ea.name}"?`)) {
      deleteEA.mutate(ea);
    }
  };

  const uploaderName = ea.uploader_profile?.first_name && ea.uploader_profile?.last_name
    ? `${ea.uploader_profile.first_name} ${ea.uploader_profile.last_name}`
    : ea.uploader_profile?.email || 'Usuário não encontrado';

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{ea.name}</h3>
              <Badge variant="secondary">v{ea.version}</Badge>
            </div>
            
            {ea.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {ea.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {uploaderName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(ea.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {ea.download_count} downloads
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Botões de Download */}
            {ea.ex4_file_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(ea.ex4_file_path!, 'ex4')}
                className="flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                .EX4
              </Button>
            )}

            {ea.ex5_file_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(ea.ex5_file_path!, 'ex5')}
                className="flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                .EX5
              </Button>
            )}

            {/* Botões de Admin/Manager */}
            {permissions.isAdminOrManager && (
              <>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(ea)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteEA.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Indicadores de arquivos disponíveis */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Disponível para:</span>
          {ea.ex4_file_path && (
            <Badge variant="outline" className="text-xs">MT4</Badge>
          )}
          {ea.ex5_file_path && (
            <Badge variant="outline" className="text-xs">MT5</Badge>
          )}
          {!ea.ex4_file_path && !ea.ex5_file_path && (
            <Badge variant="destructive" className="text-xs">Nenhum arquivo</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
