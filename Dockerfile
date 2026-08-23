# Multi-stage build para otimização de imagem (NodeJS + Express + Vite)
# --- Estágio 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia manifestos e instala dependências
COPY package*.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Executa compilação (Gera os arquivos estáticos na /dist e compila o server.ts com esbuild)
RUN npm run build

# --- Estágio 2: Execução ---
FROM node:18-alpine

WORKDIR /app

# Define ambiente como produção
ENV NODE_ENV=production

# Copia os manifestos e instala apenas dependências de produção para manter a imagem leve
COPY package*.json ./
RUN npm ci --omit=dev

# Copia os arquivos compilados do estágio de build
COPY --from=builder /app/dist ./dist

# Expõe a porta interna da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "run", "start"]
