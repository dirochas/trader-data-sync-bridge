
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExpertAdvisor } from '@/hooks/useExpertAdvisors';

interface DeleteEAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ea: ExpertAdvisor | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteEAModal = ({ 
  open, 
  onOpenChange, 
  ea, 
  onConfirm, 
  isDeleting = false 
}: DeleteEAModalProps) => {
  if (!ea) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o Expert Advisor <strong>"{ea.name}"</strong> versão <strong>{ea.version}</strong>?
            <br /><br />
            Esta ação não pode ser desfeita. Todos os arquivos associados (.ex4 e .ex5) também serão removidos permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deletando...' : 'Deletar EA'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
