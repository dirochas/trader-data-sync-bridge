
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { useCreateExpertAdvisor, CreateExpertAdvisorData, ExpertAdvisor } from '@/hooks/useExpertAdvisors';
import { validateEAFile, sanitizeText, SECURITY_CONFIG } from '@/utils/security';

interface UploadEAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEA?: ExpertAdvisor | null;
}

export const UploadEAModal = ({ open, onOpenChange, editingEA }: UploadEAModalProps) => {
  const [formData, setFormData] = useState<CreateExpertAdvisorData>({
    name: '',
    version: '',
    description: '',
  });
  const [ex4File, setEx4File] = useState<File | null>(null);
  const [ex5File, setEx5File] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const createEA = useCreateExpertAdvisor();

  // Pre-populate form when editing
  useEffect(() => {
    if (editingEA) {
      setFormData({
        name: editingEA.name,
        version: editingEA.version,
        description: editingEA.description || '',
      });
    } else {
      setFormData({ name: '', version: '', description: '' });
    }
    setEx4File(null);
    setEx5File(null);
    setValidationErrors([]);
  }, [editingEA, open]);

  // Validação em tempo real
  useEffect(() => {
    const errors: string[] = [];
    
    // Validar arquivos
    if (ex4File) {
      const ex4Validation = validateEAFile(ex4File);
      if (!ex4Validation.isValid) {
        errors.push(`EX4: ${ex4Validation.error}`);
      }
    }
    
    if (ex5File) {
      const ex5Validation = validateEAFile(ex5File);
      if (!ex5Validation.isValid) {
        errors.push(`EX5: ${ex5Validation.error}`);
      }
    }
    
    // Validar campos obrigatórios
    if (!formData.name.trim()) {
      errors.push('Nome é obrigatório');
    }
    
    if (!formData.version.trim()) {
      errors.push('Versão é obrigatória');
    }
    
    if (!editingEA && !ex4File && !ex5File) {
      errors.push('Pelo menos um arquivo deve ser selecionado');
    }
    
    setValidationErrors(errors);
  }, [formData, ex4File, ex5File, editingEA]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
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
    setValidationErrors([]);
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof CreateExpertAdvisorData, value: string) => {
    let maxLength: number;
    
    switch (field) {
      case 'name':
        maxLength = SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME;
        break;
      case 'version':
        maxLength = SECURITY_CONFIG.MAX_TEXT_LENGTH.VERSION;
        break;
      case 'description':
        maxLength = SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION;
        break;
      default:
        maxLength = SECURITY_CONFIG.MAX_TEXT_LENGTH.GENERAL;
    }
    
    const sanitizedValue = sanitizeText(value, maxLength);
    setFormData({ ...formData, [field]: sanitizedValue });
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
  }) => {
    const validation = file ? validateEAFile(file) : null;
    const hasError = validation && !validation.isValid;

    return (
      <div className="space-y-2">
        <Label htmlFor={`${type}-file`}>
          Arquivo .{type.toUpperCase()} {type === 'ex4' ? '(MT4)' : '(MT5)'}
          <span className="text-xs text-muted-foreground ml-2">
            (Máximo: {SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)
          </span>
          {editingEA && (
            <span className="text-xs text-muted-foreground ml-2">
              {type === 'ex4' && editingEA.ex4_file_path && '(arquivo atual disponível)'}
              {type === 'ex5' && editingEA.ex5_file_path && '(arquivo atual disponível)'}
            </span>
          )}
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
              className={`flex items-center justify-center w-full h-10 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors ${
                hasError ? 'border-destructive' : ''
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              {file ? file.name : `${editingEA ? 'Substituir' : 'Selecionar'} arquivo .${type}`}
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
            {hasError && (
              <span className="text-destructive ml-2 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {validation?.error}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const isFormValid = validationErrors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingEA ? 'Editar Expert Advisor' : 'Upload Expert Advisor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do EA * 
              <span className="text-xs text-muted-foreground">
                ({formData.name.length}/{SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME})
              </span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Trading Bot Pro"
              required
              maxLength={SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">
              Versão * 
              <span className="text-xs text-muted-foreground">
                ({formData.version.length}/{SECURITY_CONFIG.MAX_TEXT_LENGTH.VERSION})
              </span>
            </Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              placeholder="Ex: 1.0.0"
              required
              maxLength={SECURITY_CONFIG.MAX_TEXT_LENGTH.VERSION}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição
              <span className="text-xs text-muted-foreground">
                ({(formData.description || '').length}/{SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION})
              </span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva brevemente o funcionamento do EA..."
              rows={3}
              maxLength={SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION}
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

          {/* Exibir erros de validação */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-center text-destructive text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Corrija os seguintes problemas:
              </div>
              <ul className="text-sm text-destructive space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {editingEA && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Nota:</strong> Ao editar, você pode alterar as informações e opcionalmente substituir os arquivos. 
              Se não selecionar novos arquivos, os arquivos atuais serão mantidos.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createEA.isPending || !isFormValid}
            >
              {createEA.isPending ? 'Salvando...' : editingEA ? 'Atualizar EA' : 'Salvar EA'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
