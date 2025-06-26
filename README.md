# TraderLab v1.8.6 - Stable Multi-Level Sorting & Enhanced UX

**Status**: ✅ STABLE - Production Ready - Dual Group Visualization System + Stable Sorting

## 📊 Sobre o Projeto

TraderLab é uma plataforma completa de gerenciamento e monitoramento de contas de trading, desenvolvida com tecnologias modernas para proporcionar uma experiência profissional e segura.

### 🚀 Principais Funcionalidades

- **📈 Monitoramento em Tempo Real**: Acompanhe saldo, equity, margem e posições abertas
- **👥 Gestão Multi-Usuário**: Sistema de roles (Admin, Manager, Cliente) com permissões específicas
- **🔒 Segurança Avançada**: Cada usuário vê apenas suas próprias contas e simulações
- **📊 Análise de Trading**: Histórico completo de trades e estatísticas
- **🖥️ Simulador de Hedge**: Ferramenta para análise de estratégias com isolamento por usuário
- **⚡ Integração MetaTrader**: Conexão direta com EAs via API
- **📱 Mobile Responsivo**: Scroll horizontal funcional em todas as tabelas
- **🖥️ Gerenciamento VPS Completo**: Controle total de custos, vencimentos e conexões RDP com paginação avançada
- **🔧 Modo Debug Seguro**: Visualização temporária de dados Cliente Trader com auto-desativação
- **🤖 Gerenciamento de Expert Advisors**: Sistema completo de upload e download de EAs com controle de permissões
- **🛡️ Sistema de Segurança Global**: Sanitização automática de dados e validação de arquivos
- **📁 Groups Management**: Sistema completo de organização de contas em grupos com cores personalizadas
- **🔐 Row Level Security**: Políticas de segurança implementadas para isolamento total de dados
- **📊 Vista de Grupos Dual**: Duas versões de visualização - Completa (V1) e Compacta (V2) com toggle dinâmico
- **🎯 Ordenação Estável Multi-Nível**: Sistema de sorting hierárquico que elimina oscilação de posições
- **🎨 Identificação Visual**: Bordas coloridas nos cards dos grupos para melhor organização visual
- **📄 Paginação Inteligente**: Sistema de paginação completo em todas as páginas de listagem

### 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/UI + Radix UI
- **Backend**: Supabase (Database + Auth + Edge Functions + RLS)
- **State Management**: TanStack React Query
- **Security**: DOMPurify + Custom Validation System + Row Level Security
- **Build Tool**: Vite

### 🎯 Versão Atual: v1.8.6 - Stable Multi-Level Sorting & Enhanced UX

**Novidades v1.8.6:**
- ✅ Sistema de ordenação multi-nível completamente estável
- ✅ Implementação de 5 níveis hierárquicos de desempate para eliminar oscilação
- ✅ Função `createStableSorter` para ordenação consistente em todas as colunas
- ✅ Tie-breaker inteligente: Critério do Usuário → Nº Conta → Nome → ID → Status
- ✅ Ordenação numérica correta para números de conta
- ✅ Status de conexão com prioridade hierárquica (Live > Slow > Delayed > Offline)
- ✅ Eliminação completa da instabilidade visual na tabela de contas
- ✅ Performance otimizada com memoização de dados de ordenação
- ✅ Compatibilidade total com paginação e filtros existentes

**Histórico v1.8.5:**
- ✅ Sistema dual de visualização de grupos: V1 (Completa) e V2 (Compacta)
- ✅ Toggle dinâmico para alternar entre as duas versões no modo grupos
- ✅ AccountGroupView2: layout ultra-compacto focado em informações essenciais
- ✅ Grid responsivo com até 3 colunas para acomodar mais grupos na tela
- ✅ Cards miniaturizados com foco em status, trades abertos e P&L
- ✅ Interface otimizada para grandes quantidades de grupos
- ✅ Melhor aproveitamento do espaço horizontal da tela
- ✅ Controles intuitivos para comparação entre as duas versões
- ✅ Transição suave entre modos de visualização
- ✅ Padronização de cores P&L: verde claro (rgb(42 176 91)) para lucro e vermelho claro (rgb(211 147 147)) para prejuízo
- ✅ Redesign moderno da página de login com identidade visual TraderLab e tema escuro profissional
- ✅ Correção de cores do novo design da página de login com gradientes personalizados

**Histórico v1.8.4:**
- ✅ Sistema completo de paginação na página VPS Management
- ✅ Seletor de itens por página (5, 10, 25, 50, 100 VPS por página)
- ✅ Navegação por páginas com botões Previous/Next e números de página
- ✅ Indicador de progresso mostrando "X de Y VPS" na parte inferior
- ✅ Interface otimizada para grandes quantidades de servidores VPS
- ✅ Performance melhorada com carregamento paginado de dados
- ✅ Controles de paginação responsivos e intuitivos
- ✅ Integração completa com o hook `usePagination` personalizado
- ✅ Correção das cores do sidebar para manter consistência visual com o tema dark
- ✅ Restauração da cor azul clara (sky-400) para links ativos no sidebar

**Histórico v1.8.3:**
- ✅ Correção definitiva da oscilação de posições dos grupos no Account Monitor
- ✅ Implementação de ordenação estável usando o hook `useSorting` otimizado
- ✅ Sistema de tie-breaker por `groupId` para garantir posições consistentes
- ✅ Ordenação padrão por P&L total (decrescente) com desempate automático
- ✅ Correção de tipos TypeScript no `GroupData` interface (description opcional)
- ✅ Melhoria na estabilidade visual da interface de grupos
- ✅ Sistema de cache inteligente para evitar reorganizações desnecessárias
- ✅ Ajustes visuais nas bordas dos grupos com cores personalizadas e opacidade otimizada

**Histórico v1.8.2:**
- ✅ Correção de erros de sintaxe JSX no EditAccountModal
- ✅ Restauração dos botões de arquivar e deletar conta com confirmações modais
- ✅ Melhoria na visibilidade de campos desabilitados (background #4c4f55 com texto branco)
- ✅ Remoção definitiva do campo "Broker" (campo desnecessário)
- ✅ Desabilitação correta de campos coletados pelo EA (número da conta, VPS ID, servidor)
- ✅ Combinação das melhores funcionalidades das versões anteriores
- ✅ Interface mais limpa e profissional para edição de contas
- ✅ Validação aprimorada de formulários com feedback visual
- ✅ Otimização da vista de grupos com melhor distribuição de colunas e cabeçalhos informativos

**Histórico v1.8.1:**
- ✅ Implementação completa de Row Level Security (RLS) na tabela accounts
- ✅ Políticas de segurança por roles: Admin/Manager veem todas as contas, Clientes veem apenas as suas
- ✅ Correção do erro de coluna 'vps' inexistente no EditAccountModal
- ✅ Sistema de permissões refinado para operações CRUD em contas
- ✅ Logs de debug melhorados para troubleshooting
- ✅ Tratamento de erros aprimorado com mensagens específicas
- ✅ Validação de campos obrigatórios e trimming automático
- ✅ Estado de submissão para prevenir múltiplos envios

**Histórico v1.8:**
- ✅ Sistema completo de Groups Management implementado
- ✅ Página dedicada para criação e edição de grupos (`/groups`)
- ✅ Integração de grupos no EditAccountModal
- ✅ Correção definitiva do erro Radix UI Select.Item
- ✅ Sistema de cores personalizadas para grupos
- ✅ Modal profissional para confirmação de exclusão de grupos
- ✅ Organização visual melhorada com badges e indicadores
- ✅ Permissões específicas para gerenciamento de grupos (Admin/Manager)

**Histórico v1.7:**
- ✅ Alinhamento perfeito entre sidebar e header (4.3rem de altura)
- ✅ Modal profissional para confirmação de exclusão de Expert Advisors
- ✅ Substituição de window.confirm() por AlertDialog moderno
- ✅ Interface mais polida e consistente
- ✅ Melhor experiência do usuário em operações críticas

**Histórico v1.63.2:**
- ✅ Correção definitiva do isolamento de usuários nas simulações hedge
- ✅ Implementação do campo `user_email` na tabela `hedge_simulations`
- ✅ Filtros por email funcionando corretamente para usuários não-admin
- ✅ Cada usuário agora vê apenas suas próprias simulações
- ✅ Sistema de permissões alinhado com o padrão das contas

**Histórico v1.63.1:**
- ✅ Sistema global de segurança implementado
- ✅ Sanitização automática de texto com proteção XSS
- ✅ Validação robusta de arquivos (.ex4/.ex5, limite 2MB)
- ✅ Funções reutilizáveis para formulários seguros
- ✅ Logging de eventos de segurança para auditoria
- ✅ Correções de TypeScript para validação de tipos
- ✅ Guia de implementação gradual de segurança

**Histórico v1.63:**
- ✅ Sistema completo de gerenciamento de Expert Advisors
- ✅ Upload e download seguro de arquivos .ex4 e .ex5
- ✅ Controle de permissões por roles (Admin/Manager podem gerenciar, Clientes podem apenas baixar)
- ✅ Armazenamento correto do cargo do uploader na base de dados
- ✅ Interface otimizada para visualização do histórico de uploads
- ✅ Contador de downloads por EA
- ✅ Sistema de versionamento para Expert Advisors
- ✅ Descrições detalhadas e metadados dos EAs

## 🎯 Sistema de Ordenação Multi-Nível

Nova implementação de sorting estável com 5 níveis hierárquicos de desempate:

### 📊 Hierarquia de Ordenação

```typescript
// Função de ordenação multi-nível estável
const createStableSorter = (primaryKey: string, primaryDirection: 'asc' | 'desc') => {
  return (a: any, b: any) => {
    // 1º nível: Critério principal escolhido pelo usuário
    let comparison = getPrimaryComparison(a, b, primaryKey);
    
    if (comparison === 0) {
      // 2º nível: Número da conta (numérico)
      comparison = getAccountNumberComparison(a, b);
      
      if (comparison === 0) {
        // 3º nível: Nome da conta (alfabético)
        comparison = getAccountNameComparison(a, b);
        
        if (comparison === 0) {
          // 4º nível: ID único (garantia de unicidade)
          comparison = getUniqueIdComparison(a, b);
          
          if (comparison === 0) {
            // 5º nível: Status da conexão (Live > Slow > Delayed > Offline)
            comparison = getConnectionStatusComparison(a, b);
          }
        }
      }
    }
    
    return primaryDirection === 'desc' ? -comparison : comparison;
  };
};
```

### 🎯 Benefícios da Ordenação Multi-Nível

- **🔒 Estabilidade Total**: Elimina oscilação de posições na tabela
- **📊 Critério Principal**: Usuário define o campo de ordenação primário
- **🔢 Desempate Numérico**: Números de conta ordenados corretamente (2, 10, 20 não 10, 2, 20)
- **📝 Desempate Alfabético**: Nomes de conta em ordem alfabética quando P&L é igual
- **🆔 Garantia de Unicidade**: ID único previne empates impossíveis
- **🌐 Prioridade de Status**: Live > Slow Connection > Delayed > Offline

### 🔄 Equivalência SQL

```sql
-- Ordenação multi-nível equivalente em SQL
SELECT * FROM trading_accounts 
ORDER BY 
  balance DESC,                   -- 1º: Critério do usuário (ex: Balance)
  CAST(account AS INTEGER) ASC,   -- 2º: Número da conta (numérico)
  name ASC,                       -- 3º: Nome da conta (alfabético)
  id ASC,                         -- 4º: ID único (garantia final)
  CASE status                     -- 5º: Status da conexão
    WHEN 'Live' THEN 1
    WHEN 'Slow Connection' THEN 2
    WHEN 'Delayed' THEN 3
    WHEN 'Offline' THEN 4
    ELSE 5
  END ASC;
```

### 🛠️ Implementação Técnica

- **Hook Personalizado**: `useSorting` otimizado com tie-breakers
- **Memoização Inteligente**: Cache de dados para performance
- **Validação de Tipos**: Garantia de tipos consistentes (números vs strings)
- **Fallback Seguro**: Tratamento de valores nulos/undefined
- **Compatibilidade**: Funciona com paginação e filtros existentes

## Instalação e Desenvolvimento

Para rodar o projeto localmente:

```sh
# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue para o diretório do projeto
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm i

# Inicie o servidor de desenvolvimento
npm run dev
```

## Tecnologias Utilizadas

Este projeto foi desenvolvido com:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase
- DOMPurify (Segurança)

## 🛡️ Sistema de Segurança

O projeto agora conta com um sistema robusto de segurança:

- **Row Level Security (RLS)**: Isolamento completo de dados por usuário e role
- **Sanitização de Texto**: Proteção contra XSS e caracteres maliciosos
- **Validação de Arquivos**: Controle de tamanho e tipo de arquivo
- **Logging de Segurança**: Auditoria de eventos críticos
- **Implementação Gradual**: Sistema modular para aplicação em novas páginas
- **Isolamento de Usuários**: Cada usuário vê apenas seus próprios dados

Consulte `src/utils/SECURITY_GUIDE.md` para implementação em novas funcionalidades.

## 📁 Sistema de Grupos Dual

Nova funcionalidade com duas versões de visualização:

### 🎨 Group View V1 (Completa)
- **Layout Detalhado**: Informações completas de cada grupo e conta
- **Cards Expandidos**: Dados extensivos de performance e status
- **Ideal Para**: Análise detalhada e monitoramento profundo

### ⚡ Group View V2 (Compacta)
- **Layout Miniaturizado**: Foco em informações essenciais
- **Grid Responsivo**: Até 3 colunas para melhor aproveitamento da tela
- **Dados Essenciais**: Status (bolinha colorida), trades abertos e P&L
- **Ideal Para**: Visão geral rápida de muitos grupos simultaneamente

### 🔄 Toggle Dinâmico
- **Troca Instantânea**: Alternância entre V1 e V2 sem recarregar dados
- **Memória de Preferência**: Sistema lembra da última escolha do usuário
- **Interface Intuitiva**: Controles claros com labels V1/V2

## 🔐 Políticas de Segurança

O sistema implementa políticas RLS rigorosas:

- **SELECT**: Usuários veem apenas suas contas; Admin/Manager veem todas
- **INSERT**: Apenas Admin/Manager podem criar novas contas
- **UPDATE**: Admin/Manager editam todas; Traders editam apenas as suas
- **DELETE**: Apenas Admin/Manager podem deletar contas

## ✏️ Edição de Contas

Sistema robusto de edição com:

- **Campos Editáveis**: Apenas nome da conta e grupo podem ser modificados
- **Campos Protegidos**: Número da conta, VPS ID e servidor são somente leitura
- **Validação Visual**: Campos desabilitados com contraste adequado
- **Ações Avançadas**: Arquivar e deletar contas com confirmações modais
- **Feedback Imediato**: Toasts informativos para todas as operações

## 🎯 Sistema de Ordenação Inteligente

Nova implementação de sorting estável:

- **Ordenação Padrão**: P&L total decrescente (maiores lucros primeiro)
- **Tie-breaker Automático**: Usa groupId para evitar oscilação de posições
- **Cache Inteligente**: Sistema que detecta dados temporariamente instáveis
- **Estabilidade Visual**: Interface consistente sem reorganizações desnecessárias
- **Performance Otimizada**: Hook reutilizável com memoização eficiente

## Deploy

O projeto pode ser deployado em qualquer serviço de hospedagem que suporte aplicações React/Vite.

## 🖥️ Gerenciamento VPS Avançado

Sistema completo para controle de infraestrutura VPS:

- **📊 Dashboard VPS**: Visão geral com cards de resumo (Total VPS, Online, Contas, Custos)
- **📄 Paginação Inteligente**: Navegação eficiente através de grandes listas de VPS
- **🔍 Controle de Visualização**: Seletor para mostrar 5, 10, 25, 50 ou 100 VPS por página
- **🖥️ Conexão RDP**: Download automático de arquivos .rdp para conexão remota
- **💰 Controle de Custos**: Monitoramento de custos mensais e datas de vencimento
- **📡 Status em Tempo Real**: Indicadores de conexão (Online, Delayed, Offline)
- **⚙️ Configuração Completa**: Edição de dados de conexão, custos e informações do servidor
- **👥 Gestão de Contas**: Visualização de contas por VPS com contadores de conexões ativas

### 📄 Sistema de Paginação Universal

Implementação consistente em todas as páginas de listagem:

- **Hook Personalizado**: `usePagination` reutilizável para todas as tabelas
- **Controles Intuitivos**: Botões Previous/Next com desabilitação automática
- **Navegação por Números**: Clique direto em números de página específicos
- **Seletor de Itens**: Dropdown para escolher quantos itens mostrar por página
- **Indicadores de Progresso**: Contador "Mostrando X a Y de Z itens"
- **Performance Otimizada**: Renderização apenas dos itens visíveis na página atual
- **Responsividade**: Interface adaptável para diferentes tamanhos de tela
