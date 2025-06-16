
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string | null;
    account: string;
    vps: string | null;
    broker: string | null;
    server: string;
  } | null;
  onAccountUpdated: () => void;
}

const EditAccountModal = ({ isOpen, onClose, account, onAccountUpdated }: EditAccountModalProps) => {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    vps: account?.vps || '',
    broker: account?.broker || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        vps: account.vps || '',
        broker: account.broker || '',
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: formData.name.trim() || null,
          vps: formData.vps.trim() || null,
          broker: formData.broker.trim() || null,
        })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Conta atualizada",
        description: "Os dados da conta foram atualizados com sucesso.",
      });

      onAccountUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        
        {account && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Número da Conta</Label>
              <Input
                id="account"
                value={account.account}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Este campo não pode ser editado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da conta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vps">Nome do VPS</Label>
              <Input
                id="vps"
                value={formData.vps}
                onChange={(e) => setFormData(prev => ({ ...prev, vps: e.target.value }))}
                placeholder="Digite o nome do VPS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broker">Broker</Label>
              <Input
                id="broker"
                value={formData.broker}
                onChange={(e) => setFormData(prev => ({ ...prev, broker: e.target.value }))}
                placeholder="Digite o nome do broker"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server">Servidor</Label>
              <Input
                id="server"
                value={account.server}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Este campo é atualizado automaticamente pelo EA</p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountModal;
