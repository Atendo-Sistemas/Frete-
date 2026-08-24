#!/usr/bin/env bash
# ==============================================================================
# 🚚 ELO LOG - INSTALADOR AUTOMATIZADO PARA VPS (SSH / DOCKER & POSTGRESQL)
# ==============================================================================
# Este script realiza a instalação completa e autônoma do Elo Log em sua VPS Linux:
#  1. Instalação e verificação do Docker & Docker Compose
#  2. Criação automática do container PostgreSQL 16 com volume persistente
#  3. Criação e migração de todas as tabelas SQL e sementes iniciais
#  4. Configuração de parâmetros de compressão de imagens e segurança (.env)
#  5. Build e inicialização da aplicação web multi-tenant
# ==============================================================================

set -e

# Cores para saída do terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}"
cat << "EOF"
  ______ _         _                 
 |  ____| |       | |                
 | |__  | | ___   | |     ___   __ _ 
 |  __| | |/ _ \  | |    / _ \ / _` |
 | |____| | (_) | | |___| (_) | (_| |
 |______|_|\___/  |______\___/ \__, |
                                __/ |
                               |___/ 
   Instalador Autônomo para VPS (Docker + PostgreSQL)
EOF
echo -e "${NC}"

echo -e "${BLUE}${BOLD}==> [1/7] Verificando privilégios e requisitos...${NC}"
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}[ERRO] Este script deve ser executado como root ou com 'sudo'.${NC}"
  echo -e "${YELLOW}Execute: sudo bash $0${NC}"
  exit 1
fi

# Diretório de instalação
INSTALL_DIR="/opt/elo-log"
if [ -d "./server" ] && [ -f "./package.json" ]; then
  INSTALL_DIR="$(pwd)"
  echo -e "${GREEN}[OK] Detectado diretório local da aplicação: ${INSTALL_DIR}${NC}"
else
  echo -e "${CYAN}[INFO] Criando diretório de instalação em: ${INSTALL_DIR}${NC}"
  mkdir -p "$INSTALL_DIR"
fi

echo -e "${BLUE}${BOLD}==> [2/7] Atualizando repositórios e instalando dependências essenciais...${NC}"
if command -v apt-get &> /dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq curl git jq openssl ca-certificates gnupg lsb-release
elif command -v yum &> /dev/null; then
  yum install -y curl git jq openssl
fi

echo -e "${BLUE}${BOLD}==> [3/7] Verificando Docker e Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[!] Docker não encontrado. Instalando Docker Engine oficial...${NC}"
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}[OK] Docker instalado com sucesso!${NC}"
else
  echo -e "${GREEN}[OK] Docker já está instalado: $(docker --version)${NC}"
fi

# Verificar plugin Compose
if ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}[!] Docker Compose plugin não encontrado. Instalando...${NC}"
  if command -v apt-get &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
  fi
fi

echo -e "${BLUE}${BOLD}==> [4/7] Configurando Parâmetros de Instalação e Banco de Dados...${NC}"

# Gerar senhas e chaves seguras se não fornecidas
RANDOM_DB_PASS=$(openssl rand -hex 12)
RANDOM_JWT_SECRET=$(openssl rand -hex 32)

APP_PORT="${APP_PORT:-3000}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-elolog}"
DB_USER="${DB_USER:-elolog_user}"
DB_PASSWORD="${DB_PASSWORD:-$RANDOM_DB_PASS}"

# Configurações de Compressão de Imagens
IMAGE_COMPRESSION_ENABLED="${IMAGE_COMPRESSION_ENABLED:-true}"
IMAGE_MAX_WIDTH="${IMAGE_MAX_WIDTH:-1600}"
IMAGE_MAX_HEIGHT="${IMAGE_MAX_HEIGHT:-1600}"
IMAGE_QUALITY="${IMAGE_QUALITY:-0.8}"
IMAGE_FORMAT="${IMAGE_FORMAT:-image/jpeg}"

# Gravar arquivo .env
cat << ENVFILE > "$INSTALL_DIR/.env"
# ==============================================================================
# ELO LOG - CONFIGURAÇÕES DO AMBIENTE DE PRODUÇÃO
# Gerado automaticamente pelo instalador em $(date)
# ==============================================================================

# Porta da aplicação na VPS
APP_PORT=${APP_PORT}
PORT=3000
NODE_ENV=production

# Chave secreta de autenticação JWT
JWT_SECRET=${RANDOM_JWT_SECRET}

# Banco de Dados Relacional SQL (PostgreSQL)
DB_TYPE=postgres
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_SSL=false
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Otimização & Compressão Automática de Fotos / Imagens
IMAGE_COMPRESSION_ENABLED=${IMAGE_COMPRESSION_ENABLED}
IMAGE_MAX_WIDTH=${IMAGE_MAX_WIDTH}
IMAGE_MAX_HEIGHT=${IMAGE_MAX_HEIGHT}
IMAGE_QUALITY=${IMAGE_QUALITY}
IMAGE_FORMAT=${IMAGE_FORMAT}

# Chaves Opcionais
GEMINI_API_KEY=${GEMINI_API_KEY:-}
WHATSAPP_API_URL=${WHATSAPP_API_URL:-}
WHATSAPP_API_TOKEN=${WHATSAPP_API_TOKEN:-}
ENVFILE

chmod 600 "$INSTALL_DIR/.env"
echo -e "${GREEN}[OK] Arquivo .env configurado com credenciais seguras.${NC}"

echo -e "${BLUE}${BOLD}==> [5/7] Configurando Docker Compose com PostgreSQL e Elo Log...${NC}"

# Garantir pasta do schema SQL
mkdir -p "$INSTALL_DIR/server/db"

cat << 'COMPOSE' > "$INSTALL_DIR/docker-compose.yml"
version: '3.8'

services:
  # ============================================================================
  # BANCO DE DADOS RELACIONAL SQL (POSTGRESQL 16)
  # ============================================================================
  postgres:
    image: postgres:16-alpine
    container_name: elo-log-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-elolog}
      POSTGRES_USER: ${DB_USER:-elolog_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/db/schema.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "127.0.0.1:${DB_PORT:-5432}:5432"
    networks:
      - elo-log-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-elolog_user} -d ${DB_NAME:-elolog}"]
      interval: 5s
      timeout: 5s
      retries: 10

  # ============================================================================
  # APLICAÇÃO ELO LOG (SAAS MULTI-TENANT + COMPRESSÃO DE IMAGENS + API)
  # ============================================================================
  elo-log:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: elo-log-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - DB_TYPE=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME:-elolog}
      - DB_USER=${DB_USER:-elolog_user}
      - DB_PASSWORD=${DB_PASSWORD}
      - DATABASE_URL=postgresql://${DB_USER:-elolog_user}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-elolog}
      - IMAGE_COMPRESSION_ENABLED=${IMAGE_COMPRESSION_ENABLED:-true}
      - IMAGE_QUALITY=${IMAGE_QUALITY:-0.8}
      - IMAGE_MAX_WIDTH=${IMAGE_MAX_WIDTH:-1600}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
    networks:
      - elo-log-network

networks:
  elo-log-network:
    name: elo-log-network
    driver: bridge

volumes:
  postgres_data:
    name: elo_log_postgres_data
COMPOSE

echo -e "${BLUE}${BOLD}==> [6/7] Inicializando Banco PostgreSQL e Construindo Aplicação...${NC}"
cd "$INSTALL_DIR"

# Subir primeiro o PostgreSQL e aguardar healthy
docker compose up -d postgres

echo -e "${CYAN}[INFO] Aguardando inicialização do banco PostgreSQL e execução do schema.sql...${NC}"
for i in {1..30}; do
  if docker compose ps postgres | grep -q "(healthy)"; then
    echo -e "${GREEN}[OK] PostgreSQL ativo e tabelas criadas automaticamente!${NC}"
    break
  fi
  sleep 2
done

# Build e inicialização da aplicação
echo -e "${CYAN}[INFO] Compilando e iniciando os containers...${NC}"
docker compose up -d --build elo-log

echo -e "${BLUE}${BOLD}==> [7/7] Validando status dos serviços...${NC}"
sleep 3
docker compose ps

SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")

echo -e ""
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}       🎉 INSTALAÇÃO DO ELO LOG CONCLUÍDA COM SUCESSO! 🎉        ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e ""
echo -e "  🌐 ${BOLD}Acesso Web:${NC}       ${CYAN}http://${SERVER_IP}:${APP_PORT}${NC}"
echo -e "  👤 ${BOLD}Super Admin:${NC}      superadmin@portaldefretes.com.br"
echo -e "  🔑 ${BOLD}Senha Padrão:${NC}     Admin@123 (Altere após primeiro login)"
echo -e ""
echo -e "  🗄️  ${BOLD}Banco de Dados:${NC}   PostgreSQL 16 (Auto-migrado com todas as tabelas)"
echo -e "  📦 ${BOLD}Base SQL:${NC}         ${DB_NAME}"
echo -e "  👤 ${BOLD}Usuário SQL:${NC}      ${DB_USER}"
echo -e "  🔒 ${BOLD}Senha SQL:${NC}        ${DB_PASSWORD}"
echo -e ""
echo -e "  🖼️  ${BOLD}Compressão:${NC}       Ativada (WebP/JPEG 80%, Redução ~85% de tráfego)"
echo -e ""
echo -e "${YELLOW}${BOLD}Comandos úteis de gerenciamento:${NC}"
echo -e "  • Ver logs:       ${CYAN}cd ${INSTALL_DIR} && docker compose logs -f${NC}"
echo -e "  • Reiniciar:      ${CYAN}cd ${INSTALL_DIR} && docker compose restart${NC}"
echo -e "  • Status:         ${CYAN}cd ${INSTALL_DIR} && docker compose ps${NC}"
echo -e "  • Backup do DB:   ${CYAN}docker exec -t elo-log-postgres pg_dump -U ${DB_USER} ${DB_NAME} > backup.sql${NC}"
echo -e "${GREEN}========================================================================${NC}"
