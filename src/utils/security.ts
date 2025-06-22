
import DOMPurify from 'dompurify';

/**
 * Configurações de segurança globais
 */
export const SECURITY_CONFIG = {
  // Tamanhos máximos de arquivo (em bytes)
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  
  // Tipos de arquivo permitidos
  ALLOWED_FILE_TYPES: {
    EA_FILES: ['.ex4', '.ex5'],
    MIME_TYPES: ['application/octet-stream', 'application/x-msdownload']
  },
  
  // Configurações de texto
  MAX_TEXT_LENGTH: {
    NAME: 100,
    VERSION: 20,
    DESCRIPTION: 1000,
    GENERAL: 500
  }
} as const;

/**
 * Sanitiza texto removendo scripts maliciosos e limitando tamanho
 */
export const sanitizeText = (text: string, maxLength?: number): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove caracteres de controle e normaliza
  let cleaned = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
    .trim();
  
  // Usa DOMPurify para remover HTML/scripts maliciosos
  cleaned = DOMPurify.sanitize(cleaned, { 
    ALLOWED_TAGS: [], // Remove todas as tags HTML
    ALLOWED_ATTR: [] // Remove todos os atributos
  });
  
  // Aplica limite de tamanho se especificado
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  return cleaned;
};

/**
 * Sanitiza dados de formulário
 */
export const sanitizeFormData = <T extends Record<string, any>>(
  data: T,
  fieldLimits?: Partial<Record<keyof T, number>>
): T => {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const maxLength = fieldLimits?.[key as keyof T];
      sanitized[key as keyof T] = sanitizeText(value, maxLength) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
};

/**
 * Valida arquivo de Expert Advisor
 */
export const validateEAFile = (file: File): { isValid: boolean; error?: string } => {
  // Verifica se o arquivo existe
  if (!file) {
    return { isValid: false, error: 'Nenhum arquivo selecionado' };
  }
  
  // Verifica tamanho
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    return { 
      isValid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB` 
    };
  }
  
  // Verifica extensão
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.EA_FILES.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: 'Tipo de arquivo não permitido. Use apenas .ex4 ou .ex5' 
    };
  }
  
  // Verifica nome do arquivo
  const sanitizedName = sanitizeText(file.name, 100);
  if (sanitizedName !== file.name) {
    return { 
      isValid: false, 
      error: 'Nome do arquivo contém caracteres inválidos' 
    };
  }
  
  return { isValid: true };
};

/**
 * Utilitário para validação de formulários antes do envio
 */
export const validateAndSanitizeEAForm = (formData: {
  name: string;
  version: string;
  description?: string;
  ex4File?: File;
  ex5File?: File;
}): {
  isValid: boolean;
  sanitizedData: typeof formData;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Sanitiza os dados de texto
  const sanitizedData = {
    ...formData,
    name: sanitizeText(formData.name, SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME),
    version: sanitizeText(formData.version, SECURITY_CONFIG.MAX_TEXT_LENGTH.VERSION),
    description: formData.description 
      ? sanitizeText(formData.description, SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION)
      : undefined,
  };
  
  // Validações obrigatórias
  if (!sanitizedData.name.trim()) {
    errors.push('Nome é obrigatório');
  }
  
  if (!sanitizedData.version.trim()) {
    errors.push('Versão é obrigatória');
  }
  
  // Valida arquivos se fornecidos
  if (formData.ex4File) {
    const ex4Validation = validateEAFile(formData.ex4File);
    if (!ex4Validation.isValid) {
      errors.push(`Arquivo EX4: ${ex4Validation.error}`);
    }
  }
  
  if (formData.ex5File) {
    const ex5Validation = validateEAFile(formData.ex5File);
    if (!ex5Validation.isValid) {
      errors.push(`Arquivo EX5: ${ex5Validation.error}`);
    }
  }
  
  // Verifica se pelo menos um arquivo foi fornecido (para novos EAs)
  if (!formData.ex4File && !formData.ex5File) {
    errors.push('Pelo menos um arquivo (.ex4 ou .ex5) deve ser fornecido');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors
  };
};

/**
 * Hook de logging de segurança (para auditoria futura)
 */
export const logSecurityEvent = (event: string, details?: any) => {
  console.log(`[SECURITY] ${event}`, details);
  // Aqui poderia ser implementado um sistema de logging mais robusto no futuro
};
