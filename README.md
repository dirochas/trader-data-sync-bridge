
# TraderLab v1.63 - Professional Trading Management System

**Status**: ✅ STABLE - Production Ready - Expert Advisors Role Management

## 📊 Sobre o Projeto

TraderLab é uma plataforma completa de gerenciamento e monitoramento de contas de trading, desenvolvida com tecnologias modernas para proporcionar uma experiência profissional e segura.

### 🚀 Principais Funcionalidades

- **📈 Monitoramento em Tempo Real**: Acompanhe saldo, equity, margem e posições abertas
- **👥 Gestão Multi-Usuário**: Sistema de roles (Admin, Manager, Cliente) com permissões específicas
- **🔒 Segurança Avançada**: Cada usuário vê apenas suas próprias contas
- **📊 Análise de Trading**: Histórico completo de trades e estatísticas
- **🖥️ Simulador de Hedge**: Ferramenta para análise de estratégias
- **⚡ Integração MetaTrader**: Conexão direta com EAs via API
- **📱 Mobile Responsivo**: Scroll horizontal funcional em todas as tabelas
- **🖥️ Gerenciamento VPS Completo**: Controle total de custos, vencimentos e conexões RDP
- **🔧 Modo Debug Seguro**: Visualização temporária de dados Cliente Trader com auto-desativação
- **🤖 Gerenciamento de Expert Advisors**: Sistema completo de upload e download de EAs com controle de permissões

### 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/UI + Radix UI
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **State Management**: TanStack React Query
- **Build Tool**: Vite

### 🎯 Versão Atual: v1.63 - Expert Advisors Role Management

**Novidades:**
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

## Deploy

O projeto pode ser deployado em qualquer serviço de hospedagem que suporte aplicações React/Vite.
