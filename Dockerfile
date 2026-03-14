# Backend Dockerfile

# Build stage
FROM node:24.13.1-alpine AS builder

WORKDIR /app

# Instalar dependencias primero para aprovechar caché de capas
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Producción stage
FROM node:24.13.1-alpine

WORKDIR /app

# Copiar solo lo estrictamente necesario desde la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Variable de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000

# Exponer puerto
EXPOSE 5000

# Comando para iniciar
CMD ["node", "src/server.js"]
