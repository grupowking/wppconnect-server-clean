# ----- ESTÁGIO 1: BUILDER -----
# MUDANÇA AQUI: Usando a versão Node 20 LTS, mais estável
FROM node:20 AS builder

WORKDIR /usr/src/wpp-server

# --- Invalidador de cache ---
# MUDANÇA AQUI: Alterando o número para garantir um build 100% novo
ARG CACHE_BUSTER=202506131440
RUN echo "Forçando rebuild com cache buster: $CACHE_BUSTER"

# Instala as dependências de sistema para o build (sharp, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*
# NOTA: Imagens Node baseadas em Debian (não Alpine) usam 'apt-get' em vez de 'apk'

# Copia os arquivos de dependência
COPY package.json yarn.lock ./

# Instala TODAS as dependências, incluindo as de desenvolvimento
RUN yarn install --pure-lockfile

# Copia o restante do código-fonte do projeto
COPY . .

# Executa o build para compilar os arquivos .ts em .js na pasta /dist
RUN yarn build


# ----- ESTÁGIO 2: PRODUÇÃO -----
# MUDANÇA AQUI: Usando a versão Node 20-alpine LTS, mais estável e leve
FROM node:20-alpine

WORKDIR /usr/src/wpp-server

# Instala SOMENTE as dependências de sistema necessárias para RODAR a aplicação
RUN apk update && \
    apk add --no-cache \
    chromium \
    && rm -rf /var/cache/apk/*

# Copia os arquivos de definição de pacote
COPY package.json yarn.lock ./

# Instala SOMENTE as dependências de produção
RUN yarn install --production --pure-lockfile

# Limpa o cache do yarn
RUN yarn cache clean

# Copia APENAS a pasta 'dist' (com o código compilado) do estágio 'builder'
COPY --from=builder /usr/src/wpp-server/dist ./dist

# Expõe a porta da aplicação
EXPOSE 21465

# Define o comando para iniciar o servidor
ENTRYPOINT ["node", "dist/server.js"]