
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAccountGroup } from '@/hooks/useAccountGroups';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
  });
  const createGroupMutation = useCreateAccountGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createGroupMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
      });
      onClose();
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
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
              onClick={handleClose}
              disabled={createGroupMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createGroupMutation.isPending || !formData.name.trim()}
            >
              {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
