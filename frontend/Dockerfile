# Build stage
FROM node:24.13.1-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y construir
COPY . .
RUN npm run build

# Producción stage con Nginx
FROM nginx:alpine

# Copiar configuración customizada de Nginx si es necesario (e.g. para React Router)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build de React
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto 80 (el Ingress Controller manejará SSL/443)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
