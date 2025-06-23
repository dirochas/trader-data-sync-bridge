
# TraderLab v1.8 - Professional Trading Management System

**Status**: ✅ STABLE - Production Ready - Groups Management & Modal Fixes

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
- **🖥️ Gerenciamento VPS Completo**: Controle total de custos, vencimentos e conexões RDP
- **🔧 Modo Debug Seguro**: Visualização temporária de dados Cliente Trader com auto-desativação
- **🤖 Gerenciamento de Expert Advisors**: Sistema completo de upload e download de EAs com controle de permissões
- **🛡️ Sistema de Segurança Global**: Sanitização automática de dados e validação de arquivos
- **📁 Groups Management**: Sistema completo de organização de contas em grupos com cores personalizadas

### 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/UI + Radix UI
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **State Management**: TanStack React Query
- **Security**: DOMPurify + Custom Validation System
- **Build Tool**: Vite

### 🎯 Versão Atual: v1.8 - Groups Management & Modal Fixes

**Novidades v1.8:**
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

- **Sanitização de Texto**: Proteção contra XSS e caracteres maliciosos
- **Validação de Arquivos**: Controle de tamanho e tipo de arquivo
- **Logging de Segurança**: Auditoria de eventos críticos
- **Implementação Gradual**: Sistema modular para aplicação em novas páginas
- **Isolamento de Usuários**: Cada usuário vê apenas seus próprios dados

Consulte `src/utils/SECURITY_GUIDE.md` para implementação em novas funcionalidades.

## 📁 Sistema de Grupos

Nova funcionalidade para organização de contas:

- **Criação de Grupos**: Interface intuitiva para criar grupos personalizados
- **Cores Customizadas**: Sistema de cores para identificação visual
- **Gestão de Contas**: Associação fácil de contas aos grupos
- **Permissões Específicas**: Apenas Admin e Manager podem gerenciar grupos
- **Interface Responsiva**: Modais e formulários otimizados para todas as telas

## Deploy

O projeto pode ser deployado em qualquer serviço de hospedagem que suporte aplicações React/Vite.
