# Elo Log - Gestão e Publicação de Fretes 🚚

O **Elo Log** é uma plataforma inteligente e moderna de gestão, cotação, publicação e rastreamento de fretes em tempo real. Desenvolvido com arquitetura robusta Multi-Tenant, o sistema permite que múltiplas transportadoras gerenciem suas frotas, motoristas e fretes de forma totalmente isolada e segura.

---

## ✨ Principais Funcionalidades

### 🏢 Painel do Super Administrador (SaaS Global)
* **Gestão Multi-Tenant**: Visão macro e controle total de todas as transportadoras contratantes cadastradas no sistema.
* **Planos & Limites**: Configuração flexível de planos SaaS (Básico, Profissional, Empresarial) com limites automáticos de usuários, motoristas cadastrados e fretes mensais.
* **Isolamento de Dados**: Garantia de privacidade e segurança com escopo de tenant em nível de banco de dados.

### 👤 Gestão de Motoristas & Frotas
* **Cadastro Completo**: Fluxo de cadastro e edição de motoristas autônomos e agregados, incluindo dados pessoais, CNH, categoria de habilitação (B, C, D, E) e RNTRC.
* **Vínculo de Veículos**: Associação rápida de veículos com especificações de capacidade de carga, tipo de veículo (Truck, Carreta, Bitrem, Toco, Van), marca, modelo e placa (padrão Mercosul).
* **Avaliações & Histórico**: Acompanhamento de viagens concluídas e reputação de cada motorista cadastrado.

### 📦 Publicação de Fretes & Cotações
* **Publicação Inteligente**: Ferramenta dinâmica para cadastrar novos fretes detalhando carga, rota (origem e destino), datas limite, peso, volume e valor orçado.
* **Rastreamento em Tempo Real**: Monitoramento constante do status de cada frete (Aguardando Propostas, Em Trânsito, Concluído, Cancelado).

### 🛡️ Auditoria & Segurança
* **Logs de Auditoria**: Registro transparente de todas as atividades críticas do sistema (criação e atualização de empresas, ações de motoristas e alterações de usuários) para conformidade e segurança.

### 📱 Suporte PWA (Progressive Web App)
* **Instalável**: Suporte nativo a manifesto PWA para instalação instantânea como app de desktop ou mobile.
* **Inicialização Standalone**: Interface de tela cheia livre de barras do navegador, otimizada para o dia a dia na estrada e escritórios de logística.

---

## 🛠️ Stack Tecnológico

A aplicação utiliza as tecnologias mais modernas do mercado para garantir alta performance, responsividade e robustez:

* **Frontend**: [React 18](https://react.dev/) com [Vite](https://vitejs.dev/) para builds ultra-rápidos.
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/) proporcionando tipagem estática forte e segurança de código.
* **Estilização**: [Tailwind CSS](https://tailwindcss.com/) para um design fluido, moderno, consistente e responsivo.
* **Ícones**: [Lucide React](https://lucide.dev/) para uma identidade visual limpa e elegante.
* **Servidor backend**: [Express](https://expressjs.com/) em [Node.js](https://nodejs.org/) para APIs de alta performance com proxies robustos e seguros.

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
* Node.js (versão 18 ou superior)
* npm (gerenciador de pacotes padrão)

### 1. Clonar o repositório e instalar dependências
```bash
# Instalar os pacotes necessários
npm install
```

### 2. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor de desenvolvimento iniciará automaticamente.

### 3. Build de Produção
```bash
# Compila o frontend estático e encapsula o backend TypeScript em CJS
npm run build
```

### 4. Executar em Produção
```bash
npm run start
```

---

## 📁 Estrutura de Diretórios do Projeto

```text
├── server/                 # Código do servidor Node.js/Express
│   └── api.ts              # Endpoints da API REST e lógica de dados mockados
├── src/                    # Código-fonte do frontend React
│   ├── components/         # Componentes modulares reutilizáveis
│   │   ├── audit/          # Painéis de controle de logs e conformidade
│   │   ├── common/         # Badges, alertas e UI compartilhada
│   │   ├── company/        # Dashboard de transportadoras (Tenant View)
│   │   ├── drivers/        # Gerenciamento de motoristas e veículos
│   │   ├── freight/        # Gestão e listagem de fretes
│   │   ├── layout/         # Navbar, Sidebar e estruturas de navegação
│   │   ├── superadmin/     # Dashboard principal para admins globais
│   │   └── users/          # Administração de usuários e convites
│   ├── context/            # Contextos globais (Autenticação, Tema, etc.)
│   ├── services/           # Comunicação e requisições HTTP da API
│   ├── types/              # Definições de tipos TypeScript compartilhados
│   ├── App.tsx             # Componente raiz do React
│   └── main.tsx            # Ponto de entrada do cliente e registro do Service Worker
├── public/                 # Ativos estáticos e manifesto PWA
│   └── manifest.json       # Configuração do Manifesto de Aplicativo Web
└── package.json            # Scripts de automação e dependências do projeto
```

---

## 🔒 Licença

Este projeto é desenvolvido para fins corporativos de gestão e modernização da logística sob a marca **Elo Log**. Todos os direitos reservados.
