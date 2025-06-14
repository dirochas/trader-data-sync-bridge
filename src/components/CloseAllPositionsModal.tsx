
import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleCloseAll = async () => {
    setIsLoading(true);
    
    try {
      console.log(`📤 Enviando comando CLOSE_ALL para conta ${accountNumber}`);
      
      // Chamar edge function para enviar comando
      const { data, error } = await supabase.functions.invoke('send-command', {
        body: {
          accountNumber,
          commandType: 'CLOSE_ALL',
          commandData: {
            requestedAt: new Date().toISOString(),
            requestedBy: 'web_interface'
          }
        }
      });

      if (error) {
        console.error('❌ Erro ao enviar comando:', error);
        throw new Error(error.message || 'Erro ao enviar comando');
      }

      console.log('✅ Comando enviado:', data);
      
      toast({
        title: "Comando enviado!",
        description: `Comando para fechar todas as ${openTradesCount} posições da conta ${accountName} foi enviado. O EA processará em breve.`,
      });
      
      onClose();
    } catch (error) {
      console.error('❌ Erro ao fechar posições:', error);
      toast({
        title: "Erro ao enviar comando",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar enviar o comando. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fechar todas as posições?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá enviar um comando para fechar todas as <strong>{openTradesCount}</strong> posições abertas da conta{' '}
            <strong>{accountName}</strong> ({accountNumber}).
            <br /><br />
            O comando será processado pelo EA do MetaTrader em alguns segundos.
            <br />
            Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCloseAll}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            {isLoading ? 'Enviando...' : 'Sim, fechar todas'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CloseAllPositionsModal;
