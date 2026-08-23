# Guia de Implantação do Elo Log em VPS (Docker & Multi-Sistemas) 🚚

Este guia fornece o passo a passo para implantar a plataforma **Elo Log** em uma VPS (Virtual Private Server) rodando Linux (Ubuntu/Debian) que já possui outros sistemas ou contêineres Docker em execução. 

Para evitar conflitos de portas ou redes, seguiremos uma estratégia modular e isolada com suporte a Proxies Reversos (como Nginx Proxy Manager, Traefik, Caddy ou Nginx nativo).

---

## 📌 Fluxograma de Implantação

1. **Atualização da VPS & Verificação de Dependências** (Preparar o ambiente)
2. **Varredura de Rede & Portas** (Descobrir o que está livre na VPS)
3. **Configuração de Variáveis de Ambiente** (`.env`)
4. **Build e Execução com Docker Compose**
5. **Vinculação ao Proxy Reverso** (Mapeamento de domínio e SSL)
6. **Definição e Validação da URL Final da Aplicação**

---

## 🛠️ Passo 1: Atualização da VPS & Verificação de Dependências

Antes de iniciar, certifique-se de que os pacotes básicos da VPS estão atualizados e que as ferramentas necessárias estão instaladas.

### 1.1. Atualizar Pacotes do Sistema (Debian/Ubuntu)
Execute os comandos abaixo para garantir que a sua VPS tem os patches de segurança e listas de pacotes mais recentes:

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Verificar Ferramentas Essenciais
Verifique se você tem o `curl`, `git` e ferramentas de compressão necessárias para transportar os arquivos da aplicação:

```bash
# Instalar ferramentas auxiliares se não existirem
sudo apt install -y curl git unzip tar
```

### 1.3. Verificar se o Docker está Instalado e Ativo
Execute o comando para verificar a versão instalada:
```bash
docker --version
```

* Se **não estiver instalado**, execute o script oficial do Docker para instalá-lo rapidamente:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  ```
* Se já estiver instalado, verifique se o serviço está ativo e configurado para iniciar junto com a VPS:
  ```bash
  sudo systemctl status docker
  sudo systemctl enable docker
  ```

### 1.4. Verificar Docker Compose
A aplicação usa comandos modernos do Docker Compose (v2). Verifique se está ativo:
```bash
docker compose version
```
*(Se retornar erro, você pode instalar o plugin com: `sudo apt install -y docker-compose-plugin`)*

---

## 🛠️ Passo 2: Varredura de Rede e Portas (Evitar Conflitos)

Como sua VPS já possui outros sistemas rodando, você precisa verificar quais portas estão em uso e quais redes Docker já existem.

### 2.1. Verificar Portas em Uso no Host (VPS)
Execute o seguinte comando no terminal da sua VPS para listar todas as portas que já estão ocupadas:

```bash
sudo ss -tulnp | grep LISTEN
```
*Ou, caso não tenha `ss`:*
```bash
sudo netstat -tulnp | grep LISTEN
```

**O que analisar:**
* A aplicação Elo Log usa por padrão a porta interna **`3000`**.
* Se você encontrar uma linha listando `:3000` na saída (ex: `127.0.0.1:3000` ou `0.0.0.0:3000`), significa que **a porta 3000 já está sendo usada por outro sistema**.
* Escolha uma porta alternativa livre (ex: `3001`, `8080`, `8585`) para mapear no arquivo `.env`.

### 2.2. Identificar Redes Docker Ativas
Se você já possui um Proxy Reverso rodando em Docker (ex: Nginx Proxy Manager ou Traefik), ele costuma usar uma rede compartilhada para que os contêineres conversem entre si sem expor portas publicamente.

Para listar as redes Docker existentes, rode:
```bash
docker network ls
```

**Exemplos comuns de redes de proxy:**
* `nginx-proxy` / `npm_default` (Nginx Proxy Manager)
* `traefik-public` / `web` (Traefik)
* `caddy` (Caddy Server)

Guarde o nome dessa rede! Se ela existir, conectaremos o Elo Log a ela para facilitar o roteamento.

---

## ⚙️ Passo 3: Configuração dos Arquivos na VPS

1. Crie uma pasta para o projeto em sua VPS (ex: `/var/www/elo-log` ou no diretório de preferência):
   ```bash
   mkdir -p /var/www/elo-log
   cd /var/www/elo-log
   ```

2. Transfira os arquivos do projeto para essa pasta (via Git ou ZIP) garantindo que os seguintes arquivos principais estejam na raiz:
   * `Dockerfile`
   * `docker-compose.yml`
   * `package.json`
   * `server.ts`
   * Diretórios `src/`, `server/`, `public/`

3. Crie o arquivo de variáveis de ambiente **`.env`** na raiz do projeto na VPS:
   ```bash
   nano .env
   ```

4. Cole e configure as variáveis de acordo com a varredura do **Passo 2**:
   ```env
   # Porta da VPS que será mapeada para o Elo Log.
   # Se a porta 3000 estiver livre na VPS, mantenha 3000. Caso contrário, altere (ex: 3005).
   APP_PORT=3000

   # Sua chave da API Gemini para inteligência artificial do sistema
   GEMINI_API_KEY=sua_chave_aqui_caso_necessario
   ```

---

## 📦 Passo 4: Build e Inicialização dos Contêineres

Com as variáveis configuradas, execute o build e suba o contêiner em modo de segundo plano (daemon):

```bash
# Executa o build da imagem Docker otimizada e inicia o serviço
docker compose up -d --build
```

### Verificação do Status
Verifique se o contêiner subiu corretamente e se não há erros na inicialização:
```bash
# Ver os contêineres ativos
docker ps

# Ver os logs em tempo real da aplicação
docker logs -f elo-log-app
```

Você deverá ver a mensagem indicando sucesso:
`🚚 Portal de Fretes SaaS Server running on http://0.0.0.0:3000`

---

## 🔗 Passo 5: Integração com o seu Proxy Reverso Existente

Para que a sua aplicação receba acessos de fora de forma segura (HTTPS) e possa funcionar como um **PWA (Progressive Web App)** instalável, você precisa conectá-la a um domínio por meio de um Proxy Reverso.

Escolha o método compatível com a sua VPS:

### Opção A: Nginx Proxy Manager (Recomendado / Interface Gráfica)
Se você gerencia múltiplos sites na VPS com o Nginx Proxy Manager (NPM):

1. **Ajuste de Rede (Opcional, mas recomendado para segurança)**:
   Se o NPM estiver em uma rede Docker chamada `npm_default`, configure seu `docker-compose.yml` para se juntar a ela descomentando o bloco de redes:
   ```yaml
   # No docker-compose.yml do elo-log:
   networks:
     - npm_default
   ```
2. No painel web do **Nginx Proxy Manager**:
   * Clique em **Hosts** -> **Proxy Hosts** -> **Add Proxy Host**.
   * **Domain Names**: Insira o seu domínio (ex: `log.suaempresa.com.br`).
   * **Scheme**: `http`
   * **Forward Name/IP**: `elo-log-app` (se estiverem na mesma rede Docker) ou o IP interno da VPS (`172.17.0.1` ou seu IP público).
   * **Forward Port**: A porta que você configurou no `.env` (ex: `3000`).
   * Marque **Websockets Support** (necessário para atualizações rápidas).
   * Na aba **SSL**, selecione **Request a new SSL Certificate** (Let's Encrypt) e marque **Force SSL** para ativar o HTTPS.

### Opção B: Nginx Nativo (Diretamente instalado na VPS)
Se você possui o Nginx rodando diretamente na máquina (sem Docker), crie um arquivo de configuração de bloco de servidor:

```bash
sudo nano /etc/nginx/sites-available/elo-log
```

Cole a configuração abaixo (substituindo pelo seu domínio e porta configurada):

```nginx
server {
    listen 80;
    server_name log.suaempresa.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000; # Substitua 3000 pela porta escolhida em APP_PORT
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/elo-log /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Obtenha o certificado SSL gratuito com o Certbot:
```bash
sudo certbot --nginx -d log.suaempresa.com.br
```

---

## 🌐 Passo 6: Definição e Validação da URL da Aplicação

Após configurar o proxy reverso e obter o certificado SSL, sua aplicação estará acessível sob uma URL final segura (HTTPS).

### 5.1. Configurar e Publicar a URL
Insira a URL que você configurou no Proxy Reverso (ex: `https://log.suaempresa.com.br`) nos canais de distribuição para os seus usuários (motoristas, clientes e frotistas).

### 5.2. Validação Offline & PWA
Como a plataforma é um **Progressive Web App (PWA)**, ela precisa obrigatoriamente de **HTTPS** para habilitar a instalação e o funcionamento Offline (Service Worker).

**Como testar na URL Final:**
1. Abra o navegador (ex: Google Chrome ou Microsoft Edge) e acesse a sua URL (ex: `https://log.suaempresa.com.br`).
2. Verifique se o ícone de instalação (um monitor com uma seta para baixo) aparece no canto superior direito da barra de endereços.
3. Clique em instalar para rodar o **Elo Log** de forma standalone e offline-ready em seu computador ou smartphone!
