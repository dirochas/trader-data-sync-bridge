
# 🛡️ Guia de Segurança - TraderLab

## 📋 Sobre este Sistema

Este sistema de segurança foi criado para sanitizar dados e validar arquivos de forma consistente em todo o projeto. As funções são reutilizáveis e podem ser aplicadas gradualmente em novas páginas.

## 🔧 Funções Disponíveis

### `sanitizeText(text: string, maxLength?: number)`
Remove scripts maliciosos e caracteres de controle de textos.

```typescript
import { sanitizeText } from '@/utils/security';

const cleanText = sanitizeText(userInput, 100);
```

### `sanitizeFormData(data: object, fieldLimits?: object)`
Sanitiza todos os campos de texto de um formulário.

```typescript
import { sanitizeFormData, SECURITY_CONFIG } from '@/utils/security';

const cleanData = sanitizeFormData(formData, {
  name: SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME,
  description: SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION
});
```

### `validateEAFile(file: File)`
Valida arquivos de Expert Advisor (.ex4/.ex5).

```typescript
import { validateEAFile } from '@/utils/security';

const validation = validateEAFile(selectedFile);
if (!validation.isValid) {
  console.error(validation.error);
}
```

### `validateAndSanitizeEAForm(formData)`
Validação completa para formulários de EA.

```typescript
import { validateAndSanitizeEAForm } from '@/utils/security';

const result = validateAndSanitizeEAForm(formData);
if (!result.isValid) {
  setErrors(result.errors);
} else {
  // Usar result.sanitizedData
}
```

## 📏 Configurações de Segurança

### Tamanhos Máximos
```typescript
SECURITY_CONFIG.MAX_FILE_SIZE // 2MB
SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME // 100 chars
SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION // 1000 chars
```

### Tipos de Arquivo Permitidos
```typescript
SECURITY_CONFIG.ALLOWED_FILE_TYPES.EA_FILES // ['.ex4', '.ex5']
```

## 🚀 Como Aplicar em Novas Páginas

### 1. Para Formulários de Texto
```typescript
import { sanitizeFormData, SECURITY_CONFIG } from '@/utils/security';

const handleSubmit = (data) => {
  const cleanData = sanitizeFormData(data, {
    title: SECURITY_CONFIG.MAX_TEXT_LENGTH.NAME,
    content: SECURITY_CONFIG.MAX_TEXT_LENGTH.DESCRIPTION
  });
  
  // Enviar cleanData para o backend
};
```

### 2. Para Upload de Arquivos
```typescript
import { validateEAFile } from '@/utils/security';

const handleFileUpload = (file) => {
  const validation = validateEAFile(file);
  if (!validation.isValid) {
    setError(validation.error);
    return;
  }
  
  // Prosseguir com upload
};
```

### 3. Para Validação em Tempo Real
```typescript
const [errors, setErrors] = useState([]);

useEffect(() => {
  // Validar dados conforme usuário digita
  const validation = validateAndSanitizeForm(formData);
  setErrors(validation.errors);
}, [formData]);
```

## 📝 Próximos Passos

1. **Aplicar gradualmente**: Implementar em cada página nova criada
2. **Refatoração futura**: Voltar e aplicar em páginas existentes
3. **Logging**: Expandir sistema de auditoria de segurança
4. **Rate Limiting**: Implementar limites de requisição por usuário

## ⚠️ Importante

- **Sempre** use essas funções antes de enviar dados para o backend
- **Valide** arquivos no frontend E backend
- **Registre** eventos de segurança para auditoria
- **Teste** validações com dados maliciosos

## 🔍 Auditoria

O sistema registra eventos de segurança com `logSecurityEvent()`:
- Uploads bem-sucedidos e falhados
- Tentativas de validação
- Detecção de dados suspeitos

Estes logs podem ser expandidos para um sistema de monitoramento completo no futuro.
