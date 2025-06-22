
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Edit, Trash2, FileText, Calendar, User } from 'lucide-react';
import { ExpertAdvisor, downloadFile, useIncrementDownloadCount, useDeleteExpertAdvisor } from '@/hooks/useExpertAdvisors';
import { usePermissions, getRoleDisplayName } from '@/hooks/usePermissions';
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

  const handleEdit = () => {
    if (onEdit) {
      onEdit(ea);
    }
  };

  // Usar diretamente a coluna uploader_role armazenada no banco
  const uploaderRoleDisplay = ea.uploader_role 
    ? getRoleDisplayName(ea.uploader_role as any)
    : 'Usuário';

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
                Postado por: {uploaderRoleDisplay}
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

          {/* Botões de Download */}
          <div className="flex items-center gap-2 ml-4">
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
          </div>
        </div>

        {/* Indicadores de arquivos disponíveis */}
        <div className="flex items-center justify-between">
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

          {/* Botões de Admin/Manager - apenas para usuários com permissão */}
          {permissions.isAdminOrManager && onEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs"
              >
                <Edit className="w-3 h-3" />
                Editar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteEA.isPending}
                className="flex items-center gap-1 text-xs"
                style={{ 
                  borderColor: 'hsl(11.6deg 58.8% 47.2%)', 
                  color: 'hsl(11.6deg 58.8% 47.2%)' 
                }}
              >
                <Trash2 className="w-3 h-3" />
                Deletar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
