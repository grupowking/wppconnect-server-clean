# ----- ESTÁGIO 1: BUILDER -----
FROM node:22.15.0 AS builder

WORKDIR /usr/src/wpp-server

# --- NOVO TRUQUE PARA INVALIDAR O CACHE ---
# Altere o número abaixo para forçar uma nova construção do zero.
ARG CACHE_BUSTER=202506131430
RUN echo "Forçando rebuild com cache buster: $CACHE_BUSTER"

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

# Executa o build para compilar os arquivos .ts em .js na pasta /dist
RUN yarn build


# ----- ESTÁGIO 2: PRODUÇÃO -----
FROM node:22.15.0-alpine

WORKDIR /usr/src/wpp-server

# Instala SOMENTE as dependências de sistema necessárias para RODAR a aplicação
RUN apk update && \
    apk add --no-cache \
    libc6-compat \
    chromium \
    && rm -rf /var/cache/apk/*

# Copia os arquivos de definição de pacote
COPY package.json yarn.lock ./

# Instala SOMENTE as dependências de produção
RUN yarn install --production --pure-lockfile

# Limpa o cache do yarn
RUN yarn cache clean

# A MÁGICA: Copia APENAS a pasta 'dist' (com o código compilado) do estágio 'builder'
COPY --from=builder /usr/src/wpp-server/dist ./dist

# Expõe a porta da aplicação
EXPOSE 21465

# Define o comando para iniciar o servidor, apontando para o arquivo correto
ENTRYPOINT ["node", "dist/server.js"]