
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateAccountGroup } from '@/hooks/useAccountGroups';
import type { AccountGroup } from '@/hooks/useAccountGroups';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: AccountGroup;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6B7280', // Gray
];

export const EditGroupModal = ({ isOpen, onClose, group }: EditGroupModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  const updateGroupMutation = useUpdateAccountGroup();

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        color: group.color,
      });
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateGroupMutation.mutateAsync({
        id: group.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Pedro Hedge A-B"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito deste grupo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor de Identificação</Label>
            <div className="grid grid-cols-5 gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    formData.color === color 
                      ? 'border-gray-800 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="custom-color" className="text-sm">Cor personalizada:</Label>
              <input
                id="custom-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded border cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateGroupMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateGroupMutation.isPending || !formData.name.trim()}
            >
              {updateGroupMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
