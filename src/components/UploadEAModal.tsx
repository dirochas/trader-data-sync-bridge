
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';
import { useCreateExpertAdvisor, CreateExpertAdvisorData } from '@/hooks/useExpertAdvisors';

interface UploadEAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadEAModal = ({ open, onOpenChange }: UploadEAModalProps) => {
  const [formData, setFormData] = useState<CreateExpertAdvisorData>({
    name: '',
    version: '',
    description: '',
  });
  const [ex4File, setEx4File] = useState<File | null>(null);
  const [ex5File, setEx5File] = useState<File | null>(null);

  const createEA = useCreateExpertAdvisor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.version.trim()) {
      return;
    }

    const submitData: CreateExpertAdvisorData = {
      ...formData,
      ex4File: ex4File || undefined,
      ex5File: ex5File || undefined,
    };

    try {
      await createEA.mutateAsync(submitData);
      handleClose();
    } catch (error) {
      console.error('Error creating EA:', error);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', version: '', description: '' });
    setEx4File(null);
    setEx5File(null);
    onOpenChange(false);
  };

  const handleFileSelect = (type: 'ex4' | 'ex5', file: File | null) => {
    if (type === 'ex4') {
      setEx4File(file);
    } else {
      setEx5File(file);
    }
  };

  const FileUploadInput = ({ 
    type, 
    file, 
    onFileChange 
  }: { 
    type: 'ex4' | 'ex5'; 
    file: File | null; 
    onFileChange: (file: File | null) => void; 
  }) => (
    <div className="space-y-2">
      <Label htmlFor={`${type}-file`}>
        Arquivo .{type.toUpperCase()} {type === 'ex4' ? '(MT4)' : '(MT5)'}
      </Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            id={`${type}-file`}
            type="file"
            accept={`.${type}`}
            onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              onFileChange(selectedFile);
            }}
            className="hidden"
          />
          <label
            htmlFor={`${type}-file`}
            className="flex items-center justify-center w-full h-10 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            {file ? file.name : `Selecionar arquivo .${type}`}
          </label>
        </div>
        {file && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFileChange(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {file && (
        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="w-4 h-4 mr-1" />
          {(file.size / 1024).toFixed(1)} KB
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Expert Advisor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do EA *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Trading Bot Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Versão *</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="Ex: 1.0.0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva brevemente o funcionamento do EA..."
              rows={3}
            />
          </div>

          <FileUploadInput
            type="ex4"
            file={ex4File}
            onFileChange={(file) => handleFileSelect('ex4', file)}
          />

          <FileUploadInput
            type="ex5"
            file={ex5File}
            onFileChange={(file) => handleFileSelect('ex5', file)}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEA.isPending}>
              {createEA.isPending ? 'Salvando...' : 'Salvar EA'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
