# Invalidador de cache para forçar a reconstrução total
ENV CACHE_BUSTER=202506131415
# ----- ESTÁGIO 1: BUILDER -----
FROM node:22.15.0 AS builder
# ... resto do seu arquivo Dockerfile ...
# ----- ESTÁGIO 1: BUILDER -----
# Usamos uma imagem Node completa para ter acesso a todas as ferramentas de build.
FROM node:22.15.0-alpine AS builder

WORKDIR /usr/src/wpp-server

# Instala as dependências de sistema para o build (sharp, etc.)
RUN apk update && \
    apk add --no-cache \
    vips-dev \
    fftw-dev \
    gcc \
    g++ \
    make \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Copia os arquivos de dependência
COPY package.json yarn.lock ./

# Instala TODAS as dependências, incluindo as de desenvolvimento (typescript, etc.)
RUN yarn install --pure-lockfile

# Copia o restante do código-fonte do projeto
COPY . .

# ---> ETAPA CRUCIAL: Executa o build para compilar os arquivos .ts
RUN yarn build


# ----- ESTÁGIO 2: PRODUÇÃO -----
# Começamos com a mesma imagem base limpa para manter a consistência
FROM node:22.15.0-alpine

WORKDIR /usr/src/wpp-server

# Instala SOMENTE as dependências de sistema necessárias para RODAR a aplicação
RUN apk update && \
    apk add --no-cache \
    libc6-compat \
    chromium \
    && rm -rf /var/cache/apk/*

# Copia os arquivos de dependência novamente
COPY package.json yarn.lock ./

# Instala SOMENTE as dependências de produção, ignorando as de desenvolvimento
RUN yarn install --production --pure-lockfile

# Limpa o cache para reduzir o tamanho da imagem
RUN yarn cache clean

# ---> A MÁGICA ACONTECE AQUI <---
# Copia APENAS a pasta 'dist' (com o código compilado) do estágio 'builder'
COPY --from=builder /usr/src/wpp-server/dist ./dist

# Expõe a porta da aplicação
EXPOSE 21465

# Define o comando para iniciar o servidor, apontando para o arquivo correto
ENTRYPOINT ["node", "dist/server.js"]