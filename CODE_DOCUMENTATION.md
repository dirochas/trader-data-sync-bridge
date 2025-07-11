
# TraderLab - Documentação do Código

## 📋 Índice
- [Estrutura Geral](#estrutura-geral)
- [Componentes UI](#componentes-ui)
- [Componentes de Negócio](#componentes-de-negócio)
- [Páginas](#páginas)
- [Hooks e Utilitários](#hooks-e-utilitários)
- [Configurações](#configurações)

---

## 🏗️ Estrutura Geral

### `README.md`
- **Propósito**: Documentação principal do projeto
- **Conteúdo**: Histórico de versões, funcionalidades, tecnologias utilizadas
- **Status**: Sempre atualizado com as mudanças da versão atual

---

## 🎨 Componentes UI (`src/components/ui/`)

### `badge.tsx`, `button.tsx`, `card.tsx`, `table.tsx`
- **Propósito**: Componentes base do Shadcn/UI
- **Função**: Elementos visuais reutilizáveis (botões, cartões, tabelas, badges)
- **Padrão**: Seguem design system consistente

### `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`
- **Propósito**: Componentes de overlay e interação
- **Função**: Modais, menus suspensos, tooltips
- **Uso**: Interfaces de confirmação e seleção

### `form.tsx`, `input.tsx`, `label.tsx`, `select.tsx`
- **Propósito**: Componentes de formulário
- **Função**: Entrada de dados, validação, seleção
- **Integração**: React Hook Form + Zod

### `pagination.tsx`, `scroll-area.tsx`, `resizable.tsx`
- **Propósito**: Componentes de navegação e layout
- **Função**: Paginação de dados, scroll customizado, painéis redimensionáveis
- **Performance**: Otimizados para grandes conjuntos de dados

### `progress.tsx`, `hover-card.tsx`, `navigation-menu.tsx`
- **Propósito**: Componentes de feedback e navegação
- **Função**: Barras de progresso, cards flutuantes, menus de navegação
- **UX**: Melhoram experiência do usuário

### `radio-group.tsx`, `input-otp.tsx`, `drawer.tsx`
- **Propósito**: Componentes especializados
- **Função**: Botões de rádio, entrada OTP, gavetas laterais
- **Casos**: Formulários específicos e interfaces mobile

---

## 🧩 Componentes de Negócio (`src/components/`)

### `AccountGroupView.tsx` ⚠️ **403 linhas - REFATORAR**
- **Propósito**: Visualização de contas organizadas por grupos
- **Função**: Lista contas, calcula estatísticas por grupo, ordenação
- **Recursos**: Cores personalizadas, badges de status, ações por conta
- **Status**: Arquivo muito longo, precisa ser dividido em componentes menores

### `AccountInfo.tsx`
- **Propósito**: Exibe informações detalhadas de uma conta específica
- **Função**: Dados da conta, broker, servidor, leverage
- **Integração**: Hook `useTradingData` para dados em tempo real

### `MarginInfo.tsx`
- **Propósito**: Informações de margem da conta
- **Função**: Margem usada, livre, nível de margem
- **Visual**: Barra de progresso para uso de margem

### `OpenPositions.tsx`
- **Propósito**: Lista posições abertas da conta
- **Função**: Tabela com tickets, símbolos, tipos, lucros
- **Paginação**: Sistema de paginação integrado

### `TradeHistory.tsx`
- **Propósito**: Histórico de trades fechados
- **Função**: Tabela com dados históricos de trades
- **Performance**: Paginação para grandes volumes de dados

### `TradingHeader.tsx`
- **Propósito**: Cabeçalho das páginas de trading
- **Função**: Navegação, título, última atualização
- **Estado**: Detecta página atual para navegação contextual

### `AppLayout.tsx`
- **Propósito**: Layout principal da aplicação
- **Função**: Sidebar, header, área de conteúdo
- **Responsivo**: Design adaptável para mobile/desktop

### `ThemeProvider.tsx` & `ThemeToggle.tsx`
- **Propósito**: Sistema de temas da aplicação
- **Função**: Alternância entre light/dark/system
- **Persistência**: Salva preferência do usuário

### `ProtectedRoute.tsx`
- **Propósito**: Controle de acesso por rotas
- **Função**: Verifica autenticação e permissões por role
- **Segurança**: Redireciona usuários não autorizados

---

## 📄 Páginas (`src/pages/`)

### `AccountDetails.tsx`
- **Propósito**: Página detalhada de uma conta específica
- **Função**: 4 cards de estatísticas + componentes de informações
- **Layout**: Grid responsivo com AccountInfo, MarginInfo, Positions, History
- **Real-time**: Atualizações automáticas via WebSocket

### `ExpertManagement.tsx`
- **Propósito**: Gerenciamento de Expert Advisors
- **Função**: Upload, download, listagem de EAs
- **Permissões**: Admin/Manager podem gerenciar, Clientes só visualizam
- **Arquivos**: Suporte a .ex4 e .ex5 com validação

---

## 🔧 Hooks e Utilitários

### Hooks de Trading (`src/hooks/useTradingData.ts`)
- **Propósito**: Integração com dados de trading MT4/MT5
- **Funções**: 
  - `useRealtimeUpdates()`: Atualizações em tempo real
  - `useAccountInfo()`: Dados da conta
  - `useMarginInfo()`: Informações de margem
  - `useOpenPositions()`: Posições abertas
  - `useTradeHistory()`: Histórico de trades
  - `getConnectionStatus()`: Status de conexão

### Hooks de Autenticação (`src/hooks/useAuth.ts`)
- **Propósito**: Gerenciamento de autenticação
- **Função**: Login, logout, perfil do usuário
- **Integração**: Supabase Auth

### Hooks de Permissões (`src/hooks/usePermissions.ts`)
- **Propósito**: Sistema de permissões por role
- **Roles**: Admin, Manager, Client Trader
- **Função**: Controla acesso a funcionalidades específicas

### Hooks de Grupos (`src/hooks/useAccountGroups.ts`)
- **Propósito**: Gerenciamento de grupos de contas
- **Função**: CRUD de grupos, associação de contas
- **Cache**: TanStack Query para otimização

### Hooks de Expert Advisors (`src/hooks/useExpertAdvisors.ts`)
- **Propósito**: Gerenciamento de EAs
- **Função**: Upload, download, listagem
- **Segurança**: Validação de arquivos e permissões

### Hook de Paginação (`src/hooks/usePagination.ts`)
- **Propósito**: Paginação reutilizável
- **Função**: Controle de páginas, navegação
- **Performance**: Otimizado para grandes datasets

---

## ⚙️ Configurações

### `src/integrations/supabase/`
- **Propósito**: Configuração do Supabase
- **Função**: Cliente, tipos TypeScript, queries
- **Segurança**: Row Level Security (RLS) implementado

### `tailwind.config.js`
- **Propósito**: Configuração do Tailwind CSS
- **Função**: Temas, cores, animações personalizadas
- **Design System**: Cores consistentes para grupos e status

### `vite.config.ts`
- **Propósito**: Configuração do bundler Vite
- **Função**: Build, dev server, plugins
- **Performance**: Otimizações de build

---

## 🚨 Pontos de Atenção

### Arquivos que Precisam de Refatoração:
1. **`AccountGroupView.tsx`** (403 linhas) - Dividir em:
   - `GroupCard.tsx` - Card individual do grupo
   - `GroupStats.tsx` - Estatísticas do grupo
   - `AccountRow.tsx` - Linha individual da conta
   - `GroupSorting.tsx` - Lógica de ordenação

### Melhorias Sugeridas:
1. **Criar hooks específicos** para lógicas complexas
2. **Extrair constantes** para configurações repetidas
3. **Adicionar testes unitários** para componentes críticos
4. **Implementar Error Boundaries** para melhor UX

---

## 📊 Métricas do Projeto

- **Total de Componentes UI**: ~20 componentes
- **Componentes de Negócio**: ~10 componentes
- **Páginas**: 2 páginas principais
- **Hooks Customizados**: ~6 hooks
- **Maior Arquivo**: AccountGroupView.tsx (403 linhas)
- **Padrão de Arquitetura**: Component-Hook-Service

---

*Documentação atualizada em: Janeiro 2025*
*Versão do TraderLab: v1.8.3*
