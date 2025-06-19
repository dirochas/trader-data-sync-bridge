
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface EditVPSModalProps {
  isOpen: boolean;
  onClose: () => void;
  vps: {
    vpsUniqueId: string;
    displayName: string;
  } | null;
  onVPSUpdated: () => void;
}

const EditVPSModal = ({ isOpen, onClose, vps, onVPSUpdated }: EditVPSModalProps) => {
  const [formData, setFormData] = useState({
    displayName: vps?.displayName || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (vps) {
      setFormData({
        displayName: vps.displayName || '',
      });
    }
  }, [vps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vps) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vps_servers')
        .upsert({
          vps_unique_id: vps.vpsUniqueId,
          display_name: formData.displayName.trim() || vps.vpsUniqueId,
        }, {
          onConflict: 'vps_unique_id'
        });

      if (error) throw error;

      toast({
        title: "VPS atualizado",
        description: "O nome do VPS foi atualizado com sucesso. Todas as contas deste VPS agora mostram o novo nome.",
      });

      // Invalidar todas as queries relacionadas para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
      
      onVPSUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar VPS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome do VPS.",
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
          <DialogTitle>Editar Nome do VPS</DialogTitle>
        </DialogHeader>
        
        {vps && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vpsUniqueId">ID Único do VPS</Label>
              <Input
                id="vpsUniqueId"
                value={vps.vpsUniqueId}
                disabled
                className="bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed font-mono text-sm"
              />
              <p className="text-xs text-gray-500">Identificador único interno (não editável)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Ex: VPS-João, VPS_7110"
              />
              <p className="text-xs text-gray-500">
                Este nome será aplicado a todas as contas que usam este VPS
              </p>
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

export default EditVPSModal;
