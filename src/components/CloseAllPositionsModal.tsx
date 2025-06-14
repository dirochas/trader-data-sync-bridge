
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
import { useToast } from '@/hooks/use-toast';

interface CloseAllPositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountNumber: string;
  accountName: string;
  openTradesCount: number;
}

const CloseAllPositionsModal = ({ 
  isOpen, 
  onClose, 
  accountNumber, 
  accountName, 
  openTradesCount 
}: CloseAllPositionsModalProps) => {
  const { toast } = useToast();

  const handleCloseAll = async () => {
    try {
      // Aqui implementaremos a chamada para a API que fecha todas as posições
      // Por enquanto, vamos simular o fechamento
      console.log(`Fechando todas as ${openTradesCount} posições da conta ${accountNumber}`);
      
      toast({
        title: "Posições fechadas com sucesso!",
        description: `Todas as ${openTradesCount} posições da conta ${accountName} foram fechadas.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao fechar posições:', error);
      toast({
        title: "Erro ao fechar posições",
        description: "Ocorreu um erro ao tentar fechar as posições. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fechar todas as posições?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá fechar todas as <strong>{openTradesCount}</strong> posições abertas da conta{' '}
            <strong>{accountName}</strong> ({accountNumber}).
            <br /><br />
            Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCloseAll}
            className="bg-red-600 hover:bg-red-700"
          >
            Sim, fechar todas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CloseAllPositionsModal;
