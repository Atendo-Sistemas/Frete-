# Manual de Instalação e Configuração: Elo Log & Gestão de Frota

Este manual descreve o processo completo de instalação, implantação automatizada (1-Click via SSH ou Portainer) e parametrização de banco de dados relacional PostgreSQL e otimização de imagens.

---

## 🚀 Método 1: Instalação Automatizada 1-Click via SSH (Recomendado)

Em sua VPS (Ubuntu / Debian / Rocky / CentOS 22.04+ com Docker e Docker Compose instalados), execute o comando abaixo para realizar a instalação e migração completa de forma totalmente autônoma:

```bash
curl -fsSL https://raw.githubusercontent.com/elolog/elolog/main/install.sh | sudo bash
```

O script acima executa automaticamente:
1. Verificação do ambiente Docker e Docker Compose.
2. Criação da rede isolada e container do **PostgreSQL 16**.
3. Inicialização e migração do schema SQL (`schema.sql`).
4. Build e start do container principal da aplicação Elo Log na porta configurada.

---

## 🐳 Método 2: Instalação Visual via Portainer (Stack)

Se você gerencia sua VPS utilizando o painel **Portainer**:

1. Acesse seu painel Portainer e clique em **Stacks** > **Add stack**.
2. Defina o nome da stack como `elo-log`.
3. Selecione a aba **Web editor** e cole o seguinte conteúdo (`docker-compose.portainer.yml`):

```yaml
version: '3.8'

networks:
  elolog-net:
    driver: bridge

services:
  postgres:
    image: postgres:16-alpine
    container_name: elolog-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: elolog
      POSTGRES_USER: elolog_user
      POSTGRES_PASSWORD: elolog_secret_password_2026
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - elolog-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U elolog_user -d elolog"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: elolog-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=elolog
      - DB_USER=elolog_user
      - DB_PASSWORD=elolog_secret_password_2026
    networks:
      - elolog-net
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

4. Clique no botão inferior **Deploy the stack**.

---

## 🧭 Configuração do Mapbox API & Rastreio de Veículos em Tempo Real

O sistema integra a API do Mapbox GL para renderizar mapas vetoriais interativos e rastreamento GPS de frotas.

### 1. Salvando as Informações no Banco de Dados
1. Acesse o painel com uma conta **Super Admin**.
2. Clique no menu **Super Admin & SaaS** e selecione a aba **Mapbox API & Rastreio**.
3. Insira o seu **Mapbox Public Access Token** (ex: `pk.eyJ1...`).
4. Ative a chave **Ativar Mapbox para Rastreio de Veículos** e clique em **Salvar Configuração do Mapbox**.
5. *O token e os parâmetros de estilo (ruas, satélite, escuro) são salvos de forma persistente e segura no banco de dados da aplicação.*

### 2. Onde Verificar o Mapa de Localização
1. Acesse o menu **Fretes**.
2. Localize um frete ativo e clique no botão de rastreio ou detalhes (ícone **Rastrear Trajeto GPS**).
3. O mapa interativo do Mapbox será renderizado instantaneamente na tela, exibindo:
   - Marcador de **Origem (A)** e **Destino (B)**.
   - Posição em tempo real do **Veículo e Motorista** com telemetria ativa (velocidade, coordenadas e precisão GPS).
   - Linha pontilhada indicando o trajeto completo.

A aplicação suporta bancos relacionais robustos (**PostgreSQL 16+**, **MySQL** e **SQLite**).

### 3. Persistência de Tokens de Autenticação
O sistema implementou persistência de tokens no banco de dados para garantir maior segurança e consistência de sessão. Todos os tokens de autenticação gerados após o login ou registro são gravados na tabela `auth_tokens` com data de expiração, eliminando a dependência exclusiva de armazenamento no navegador.

---

### Acessando o Painel Super Admin
1. Faça login na aplicação com uma conta **Super Admin**.
2. Acesse o menu **Super Admin & SaaS** e selecione a aba **SQL & Instalação VPS**.
3. Nesta aba, você pode:
   - **Testar Conexão**: Verifica a latência e versão do banco configurado em tempo real.
   - **Executar Migração DDL**: Cria automaticamente todas as tabelas (tenants, users, freights, checklists, trip_expenses, etc.) e índices.
   - **Visualizar o Schema DDL (`schema.sql`)**: Inspeciona a estrutura relacional completa.

---

## 🖼️ Otimização e Compressão de Imagens

Para economizar largura de banda e espaço de armazenamento em fotos tiradas pela câmera (Vistorias, CNH, Comprovantes de Despesas e Canhotos):

1. No **Super Admin** > **SQL & Instalação VPS** > **Compressão de Imagens**, ajuste os parâmetros:
   - **Qualidade**: Recomendado 80% (reduz arquivos de 8MB para ~150KB sem perda perceptível de nitidez em textos e documentos).
   - **Resolução Máxima**: 1600x1600 pixels (Full HD Otimizado).
   - **Formato de Saída**: JPEG ou WebP.
2. Utilize o **Testador Interativo de Compressão** na mesma aba para testar qualquer foto do seu computador e visualizar a redução percentual instantaneamente.

---

## 🔍 Verificação e Troubleshooting

### Verificar contêineres ativos
```bash
docker ps
```
*Deve listar `elolog-postgres` e `elolog-app` como "Up".*

### Verificar Logs
```bash
docker logs -f elolog-app
docker logs -f elolog-postgres
```

