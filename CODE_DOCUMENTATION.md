
# TraderLab - Documentação Completa do Código

## 📋 Índice
- [Visão Geral do Projeto](#visão-geral-do-projeto)
- [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Componentes UI](#componentes-ui)
- [Componentes de Negócio](#componentes-de-negócio)
- [Páginas da Aplicação](#páginas-da-aplicação)
- [Hooks Customizados](#hooks-customizados)
- [Integração Supabase](#integração-supabase)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Sistema de Permissões](#sistema-de-permissões)
- [Configurações](#configurações)
- [Pontos de Atenção](#pontos-de-atenção)

---

## 🎯 Visão Geral do Projeto

O **TraderLab** é uma plataforma completa de gerenciamento de contas de trading MT4/MT5 com funcionalidades de:
- Monitoramento em tempo real de contas
- Gerenciamento de Expert Advisors (EAs)
- Sistema de grupos para organização
- Simulações de hedge
- Dashboard administrativo
- Sistema de permissões multi-nível

---

## 🏗️ Arquitetura e Tecnologias

### Stack Principal
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Estado**: TanStack Query (React Query)
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod
- **Autenticação**: Supabase Auth

### Padrões Arquiteturais
- **Component-Hook-Service**: Separação clara de responsabilidades
- **Custom Hooks**: Lógica de negócio reutilizável
- **Row Level Security (RLS)**: Segurança a nível de banco
- **Real-time Updates**: WebSocket via Supabase Realtime

---

## 📁 Estrutura de Diretórios

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base Shadcn/UI
│   └── [business]      # Componentes específicos do domínio
├── pages/              # Páginas da aplicação
├── hooks/              # Hooks customizados
├── integrations/       # Integrações externas
│   └── supabase/      # Cliente e tipos Supabase
├── lib/               # Utilitários e helpers
├── services/          # Lógica de negócio
└── utils/             # Funções auxiliares
```

---

## 🎨 Componentes UI (`src/components/ui/`)

### Componentes Base Shadcn/UI
- **`button.tsx`**: Botões com variantes (primary, secondary, outline, ghost)
- **`card.tsx`**: Containers com header, content e footer
- **`table.tsx`**: Tabelas responsivas com sorting
- **`badge.tsx`**: Indicadores de status e categorias
- **`dialog.tsx`**: Modais e overlays
- **`form.tsx`**: Sistema de formulários com validação
- **`input.tsx`**: Campos de entrada padronizados
- **`select.tsx`**: Dropdowns e seletores
- **`toast.tsx`**: Notificações e feedbacks
- **`sidebar.tsx`**: Navegação lateral colapsável

### Componentes de Layout
- **`pagination.tsx`**: Navegação entre páginas
- **`scroll-area.tsx`**: Scroll customizado
- **`resizable.tsx`**: Painéis redimensionáveis
- **`separator.tsx`**: Divisores visuais

### Componentes de Interação
- **`dropdown-menu.tsx`**: Menus contextuais
- **`popover.tsx`**: Tooltips e hints
- **`hover-card.tsx`**: Cards flutuantes
- **`tooltip.tsx`**: Dicas contextuais

---

## 🧩 Componentes de Negócio (`src/components/`)

### Visualização de Contas
- **`AccountGroupView.tsx`** ⚠️ **(403 linhas - REFATORAR)**
  - Visualização de contas organizadas por grupos
  - Cálculo de estatísticas agregadas
  - Sistema de ordenação customizável
  - Ações em lote por grupo

- **`AccountGroupView2.tsx`** 
  - Versão alternativa da visualização em grupos
  - Layout otimizado para diferentes densidades

- **`AccountTableView.tsx`**
  - Visualização tabular tradicional
  - Sorting por colunas
  - Ações individuais por conta

### Informações Detalhadas
- **`AccountInfo.tsx`**
  - Dados completos da conta (broker, servidor, leverage)
  - Status de conexão em tempo real
  - Informações do cliente

- **`MarginInfo.tsx`**
  - Margem usada, livre e nível
  - Barra de progresso visual
  - Alertas de risco

- **`OpenPositions.tsx`**
  - Lista de posições abertas
  - Cálculo de P&L em tempo real
  - Paginação integrada

- **`TradeHistory.tsx`**
  - Histórico de trades fechados
  - Filtros por período
  - Estatísticas de performance

### Layout e Navegação
- **`AppLayout.tsx`**
  - Layout principal responsivo
  - Sidebar colapsável
  - Header com informações do usuário

- **`AppSidebar.tsx`**
  - Menu de navegação lateral
  - Itens baseados em permissões
  - Indicador de página ativa

- **`TradingHeader.tsx`**
  - Cabeçalho das páginas de trading
  - Breadcrumbs contextuais
  - Última atualização

### Sistema de Temas
- **`ThemeProvider.tsx`**
  - Provider do sistema de temas
  - Persistência da preferência

- **`ThemeToggle.tsx`**
  - Alternador light/dark/system
  - Animações suaves

### Segurança
- **`ProtectedRoute.tsx`**
  - Controle de acesso por rotas
  - Verificação de permissões
  - Redirecionamento automático

### Modais Especializados
- **`EditAccountModal.tsx`**: Edição de contas
- **`EditVPSModal.tsx`**: Configuração de VPS
- **`UploadEAModal.tsx`**: Upload de Expert Advisors
- **`DeleteEAModal.tsx`**: Confirmação de exclusão
- **`CloseAllPositionsModal.tsx`**: Fechamento em lote
- **`UserFormModal.tsx`**: Gestão de usuários

### Widgets Especiais
- **`ConnectionStatus.tsx`**: Status da conexão MT4/MT5
- **`SystemDiagnostics.tsx`**: Diagnósticos do sistema
- **`HedgeSimulator.tsx`**: Simulador de hedge
- **`ExpertAdvisorCard.tsx`**: Card de EA

---

## 📄 Páginas da Aplicação (`src/pages/`)

### Dashboard e Monitoramento
- **`Dashboard.tsx`**
  - Página inicial com métricas gerais
  - Cards de resumo
  - Gráficos de performance

- **`AccountMonitor.tsx`** 
  - Monitoramento principal de contas
  - Alternância entre visualizações (grupo/tabela)
  - Sistema de ordenação avançado
  - Filtros em tempo real

- **`AccountDetails.tsx`**
  - Detalhes específicos de uma conta
  - 4 cards de estatísticas
  - Componentes de informação integrados
  - Atualizações WebSocket

### Gestão de Recursos
- **`AccountsManagement.tsx`**
  - CRUD completo de contas
  - Associação com grupos e VPS
  - Importação em lote

- **`GroupsManagement.tsx`**
  - Gestão de grupos de contas
  - Cores personalizadas
  - Estatísticas por grupo

- **`VPSManagement.tsx`**
  - Gerenciamento de servidores VPS
  - Credenciais de acesso
  - Monitoramento de custos

- **`ExpertManagement.tsx`**
  - Upload/Download de Expert Advisors
  - Versionamento de arquivos
  - Controle de permissões

### Operações e Comandos
- **`CommandsManagement.tsx`**
  - Fila de comandos MT4/MT5
  - Status de execução
  - Histórico de operações

- **`SimulationManagement.tsx`**
  - Simulações de hedge
  - Cálculos automáticos
  - Projeções de lucro

### Administração
- **`UserManagement.tsx`**
  - Gestão de usuários
  - Atribuição de roles
  - Controle de acesso

- **`Settings.tsx`**
  - Configurações do sistema
  - Modo debug
  - Parâmetros globais

- **`SystemDiagnosticsPage.tsx`**
  - Diagnósticos técnicos
  - Logs do sistema
  - Health checks

### Páginas Especiais
- **`Auth.tsx`**: Login e registro
- **`Index.tsx`**: Página inicial
- **`InactiveAccounts.tsx`**: Contas arquivadas
- **`Unauthorized.tsx`**: Acesso negado
- **`NotFound.tsx`**: Página não encontrada

---

## 🔧 Hooks Customizados (`src/hooks/`)

### Trading e Dados
- **`useTradingData.ts`** ⚠️ **(413 linhas - REFATORAR)**
  - **`useTradingAccounts()`**: Lista todas as contas com filtros
  - **`useTradingAccount()`**: Dados de uma conta específica
  - **`useMarginInfo()`**: Informações de margem
  - **`useOpenPositions()`**: Posições abertas
  - **`useTradeHistory()`**: Histórico de trades
  - **`useRealtimeUpdates()`**: WebSocket para atualizações
  - **`getConnectionStatus()`**: Status da conexão MT4/MT5

### Autenticação e Permissões
- **`useAuth.tsx`**
  - Contexto de autenticação
  - Login/logout
  - Perfil do usuário
  - Integração Supabase Auth

- **`usePermissions.ts`**
  - Sistema de permissões por role
  - Verificação de acesso
  - Utilitários de role (Admin, Manager, Client Trader, Client Investor)

### Gestão de Dados
- **`useAccountGroups.ts`**
  - CRUD de grupos de contas
  - Cache otimizado
  - Mutations com feedback

- **`useExpertAdvisors.ts`**
  - Gestão de Expert Advisors
  - Upload para Supabase Storage
  - Validação de arquivos

- **`useHedgeSimulations.ts`**
  - Simulações de hedge
  - Cálculos automáticos
  - Persistência de dados

- **`useUserManagement.ts`**
  - Gestão de usuários
  - CRUD com permissões
  - Validação de roles

### Sistema e Configurações
- **`useSystemSettings.ts`**
  - Configurações globais
  - Modo debug
  - Persistência de preferências

- **`useAutoDisableDebugMode.ts`**
  - Auto-desativação do modo debug
  - Timer automático
  - Notificações

### Utilitários
- **`usePagination.ts`**
  - Paginação reutilizável
  - Navegação otimizada
  - Cálculos automáticos

- **`useSorting.ts`**
  - Sistema de ordenação genérico
  - Múltiplas colunas
  - Direções customizáveis

- **`use-toast.ts`**
  - Sistema de notificações
  - Fila de toasts
  - Auto-dismiss

- **`use-mobile.tsx`**
  - Detecção de dispositivos mobile
  - Breakpoints responsivos

---

## 🗄️ Integração Supabase (`src/integrations/supabase/`)

### Cliente e Configuração
- **`client.ts`**
  - Cliente Supabase configurado
  - Configurações de ambiente
  - Interceptors e middlewares

- **`types.ts`** (Somente Leitura)
  - Tipos TypeScript gerados automaticamente
  - Schemas das tabelas
  - Enums e relacionamentos

### Tabelas Principais
- **`accounts`**: Contas de trading MT4/MT5
- **`account_groups`**: Grupos de organização
- **`positions`**: Posições abertas em tempo real
- **`history`**: Histórico de trades
- **`margin`**: Informações de margem
- **`expert_advisors`**: Expert Advisors
- **`hedge_simulations`**: Simulações de hedge
- **`commands`**: Fila de comandos
- **`vps_servers`**: Servidores VPS
- **`profiles`**: Perfis de usuários
- **`system_settings`**: Configurações globais

### Edge Functions
- **`trading-data`**: Recepção de dados MT4/MT5
- **`send-command`**: Envio de comandos
- **`get-commands`**: Recuperação de comandos
- **`update-command-status`**: Atualização de status

### Políticas RLS
- Acesso baseado em roles
- Filtragem por usuário
- Segurança a nível de linha

---

## 🔐 Sistema de Autenticação

### Roles e Permissões
- **Admin**: Acesso completo ao sistema
- **Manager**: Gestão operacional
- **Client Trader**: Acesso a suas próprias contas
- **Client Investor**: Visualização apenas

### Fluxo de Autenticação
1. Login via Supabase Auth
2. Criação automática de perfil
3. Verificação de role
4. Redirecionamento baseado em permissões

### Segurança
- Row Level Security (RLS) ativo
- Tokens JWT seguros
- Session management automático

---

## ⚙️ Sistema de Permissões

### Hierarquia de Acesso
```
Admin > Manager > Client Trader > Client Investor
```

### Controles por Funcionalidade
- **Contas**: Visualização filtrada por role
- **Expert Advisors**: Admin/Manager podem gerenciar
- **Comandos**: Baseado em propriedade da conta
- **Usuários**: Apenas Admin
- **Configurações**: Apenas Admin

---

## 🛠️ Configurações (`*.config.*`)

### Tailwind CSS (`tailwind.config.ts`)
- Tema personalizado
- Cores semanticas
- Animações customizadas
- Design system consistente

### Vite (`vite.config.ts`)
- Build otimizado
- Aliases de importação
- Plugins essenciais
- Configurações de dev

### TypeScript (`tsconfig.json`)
- Strict mode ativo
- Path mapping configurado
- Tipos rigorosos

### Supabase (`supabase/config.toml`)
- Configurações do projeto
- Edge functions
- Storage buckets

---

## 🚨 Pontos de Atenção e Refatoração

### Arquivos Críticos para Refatoração

1. **`useTradingData.ts`** (413 linhas)
   - Dividir em hooks específicos:
     - `useAccountsData.ts`
     - `usePositionsData.ts`
     - `useHistoryData.ts`
     - `useRealtimeConnection.ts`

2. **`AccountGroupView.tsx`** (403 linhas)
   - Dividir em componentes menores:
     - `GroupCard.tsx`
     - `GroupStats.tsx`
     - `AccountRow.tsx`
     - `GroupSorting.tsx`

### Melhorias Prioritárias

1. **Performance**
   - Implementar React.memo em componentes pesados
   - Lazy loading para páginas
   - Virtualização para listas grandes

2. **Testing**
   - Testes unitários para hooks críticos
   - Testes de integração para fluxos principais
   - Testes E2E para cenários críticos

3. **Error Handling**
   - Error Boundaries globais
   - Fallbacks para componentes
   - Logs estruturados

4. **Acessibilidade**
   - ARIA labels adequados
   - Navegação por teclado
   - Contraste de cores

### Padrões de Código
- Hooks customizados para lógica complexa
- Componentes pequenos e focados
- Separação clara de responsabilidades
- Nomenclatura consistente
- TypeScript strict

---

## 📊 Métricas do Projeto (Atualizado)

- **Total de Páginas**: 17 páginas
- **Componentes UI**: 35+ componentes Shadcn/UI
- **Componentes de Negócio**: 25+ componentes customizados
- **Hooks Customizados**: 12 hooks principais
- **Tabelas Supabase**: 10 tabelas principais
- **Edge Functions**: 4 functions ativas
- **Maior Arquivo**: useTradingData.ts (413 linhas)
- **Segundo Maior**: AccountGroupView.tsx (403 linhas)
- **Padrão de Arquitetura**: Component-Hook-Service
- **Cobertura TypeScript**: 100%

---

## 🔄 Histórico de Versões Recentes

### v1.8.3 (Atual)
- ✅ Sistema de ordenação aprimorado
- ✅ Toggle ASC/DESC funcional
- ✅ Botões de ordenação otimizados
- ✅ Performance melhorada

### Próximas Funcionalidades
- [ ] Refatoração dos arquivos grandes
- [ ] Testes automatizados
- [ ] Dashboard de analytics
- [ ] Notificações push
- [ ] API pública

---

*Documentação completamente atualizada em: Janeiro 2025*  
*Versão do TraderLab: v1.8.3*  
*Última revisão: Sistema de ordenação com toggle ASC/DESC*  

---

**👽 Para ETs, IAs e outros seres**: Esta documentação mapeia TODO o projeto TraderLab. Cada arquivo tem sua função bem definida. Nunca se percam! 🛸
