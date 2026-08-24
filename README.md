# Elo Log - Plataforma SaaS de Logística & Gestão de Fretes 🚚

O **Elo Log (TransLog Brasil)** é uma plataforma inteligente e moderna para gestão, cotação, publicação e rastreamento de fretes em tempo real. Desenvolvida sob uma arquitetura robusta **Multi-Tenant (SaaS)**, permite que a holding administre múltiplas transportadoras de forma totalmente isolada e segura.

---

## ✨ Funcionalidades Principais Disponíveis

### 1. Painel Super Administrador SaaS (Gestão Global)
O coração da operação SaaS, permitindo parametrização completa de toda a plataforma de ponta a ponta:
* **Gestão de Empresas (Tenants)**: Crie, edite, bloqueie ou aprove transportadoras com isolamento de banco de dados.
* **Branding & Apresentação**: Personalize o nome da plataforma e os dados de suporte oficiais.
* **Planos & Limites Corporativos**: Defina os limites de usuários, frotas e regras comerciais de comissionamento SaaS.
* **Editor de Ajuda Multinível**: Um editor Rich Text (suporte a HTML e imagens) para criar manuais de ajuda personalizados por perfil (Admin, Supervisor, Motorista, Usuário).
* **Integração Gateway WhatsApp**: Parametrização para envio de mensagens OTP corporativas e alertas automatizados em tempo real para os motoristas.
* **Layout & Design**: Ajuste de tipografia global e padrões visuais do sistema.
* **Campos Customizados**: Criação dinâmica de campos extras para os formulários da plataforma.
* **Mapbox API & Rastreio**: Gestão de tokens de GPS e tracking de cargas.
* **Instalação VPS & SQL**: Orientações gerenciais da infraestrutura em nuvem.

### 2. Painel da Empresa (Tenant)
Visão isolada para as transportadoras gerenciarem seu dia a dia operacional:
* **Gestão de Fretes**: Publicação de cargas, precificação, atribuição a motoristas e monitoramento de status (Pendente, Em Trânsito, Concluído).
* **Gestão de Motoristas & Frotas**: Controle de CNH, RNTRC, agregados e vínculos de veículos (Truck, Carreta, Toco, Van, etc).
* **Formulários & Checklists**: Criação de formulários de vistoria de segurança (Pneus, Freios, Lonas) que o motorista precisa preencher ao aceitar uma carga.
* **Prestação de Contas**: Sistema integrado de despesas (combustível, pedágio, manutenção) onde as aprovações financeiras são feitas.
* **Gestão de Usuários**: Convite e administração da equipe interna (Supervisores Operacionais, Analistas, etc).

### 3. Painel do Motorista Autônomo / Agregado
Visão simplificada e otimizada para uso em dispositivos móveis na estrada:
* **Meus Fretes**: Lista de viagens atribuídas, aceite de cargas e checklist de saída.
* **Prestação de Contas Mobile**: Envio de despesas direto pelo celular, com upload de fotos de recibos/comprovantes em tempo real.
* **Meu Perfil**: Atualização de CNH, documentação e veículos atrelados.

### 4. Níveis de Acesso (RBAC)
* **Super Admin SaaS**: Controle global e parametrização.
* **Empresa Admin (Gerente)**: Controle total de uma transportadora (Tenant) específica.
* **Supervisor Operacional**: Responsável pela aprovação de despesas, liberação de veículos e monitoramento de fretes.
* **Motorista**: Acesso apenas às suas próprias viagens e gastos.

---

## 🛠️ Stack Tecnológico

A aplicação foi construída visando escalabilidade e alta performance:
* **Frontend**: React 19 + Vite.
* **Linguagem**: TypeScript.
* **Estilização**: Tailwind CSS.
* **Componentes & Ícones**: Lucide React, React-Quill-New (Editor HTML).
* **Backend**: Express (Node.js) com APIs REST operando na mesma infraestrutura (Full-Stack).
* **Autenticação de Teste**: Barra de ferramentas DevTols inclusa para alternar facilmente entre perfis durante a homologação.

---

## 🚀 Guia de Instalação e Execução

### Pré-requisitos
* Node.js (versão 18 ou superior)
* npm (gerenciador de pacotes)

### 1. Clonar o repositório e instalar dependências
```bash
# Clone o projeto (caso tenha o git) ou extraia o arquivo ZIP
git clone <url-do-repositorio>
cd <nome-da-pasta>

# Instale os pacotes necessários
npm install
```

### 2. Configurar Variáveis de Ambiente
O projeto exige a configuração do `.env`. Se existir um arquivo `.env.example`, crie uma cópia chamada `.env`:
```bash
cp .env.example .env
```
*(As chaves secretas do servidor Express deverão ser populadas lá)*

### 3. Iniciar o Ambiente de Desenvolvimento
Este comando liga o Vite (frontend) e o TSX (backend) com *Hot Module Replacement*:
```bash
npm run dev
```
Acesse no seu navegador: `http://localhost:3000`

### 4. Build de Produção
Para implantar a plataforma em servidores na nuvem (VPS, Cloud Run, Heroku), é necessário fazer o build. Isso compilará o Frontend e encapsulará o Backend em um único arquivo CommonJS seguro:
```bash
npm run build
```

### 5. Executar em Produção
Após o build, inicie o servidor definitivo:
```bash
npm run start
```

---

## 📁 Estrutura de Diretórios Resumida

```text
├── server/
│   ├── api.ts              # Endpoints da API REST e middlewares de rota
│   └── db.ts               # Banco de dados simulado e persistência local
├── src/
│   ├── components/         # Componentes React modularizados
│   │   ├── superadmin/     # ➜ Editor de Ajuda e Configurações SaaS
│   │   ├── common/         # ➜ UI de alertas, navegação e HelpPanel
│   │   ├── freight/        # ➜ Fluxo de fretes
│   │   ├── drivers/        # ➜ Veículos e motoristas
│   │   ├── accountability/ # ➜ Prestação de contas
│   │   └── ...
│   ├── services/
│   │   └── api.ts          # Chamadas de rede do cliente para o Express
│   ├── types.ts            # Interfaces TypeScript compartilhadas
│   ├── App.tsx             # Arquitetura principal de Roteamento
│   └── main.tsx            # Ponto de entrada do sistema
├── package.json            # Dependências (React 19, Tailwind, Express)
└── vite.config.ts          # Configuração de build e plugins
```

---
*Plataforma desenvolvida para alta performance e operação ininterrupta 24/7.*
