# ==========================================
# ETAPA 1: Construcción (Builder)
# ==========================================
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero los archivos de dependencias
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo las de desarrollo)
RUN npm install

# Copiamos el resto del código fuente (tu src/, tsconfig, etc.)
COPY . .

# Compilamos el código TypeScript de NestJS a JavaScript
RUN npm run build

# ==========================================
# ETAPA 2: Producción (Imagen final liviana)
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Copiamos SOLO lo necesario desde la Etapa 1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# (Opcional) Si en el futuro necesitas un .env por defecto en el contenedor:
# COPY .env ./

# Exponemos el puerto de tu microservicio de Ventas
EXPOSE 3001

# Comando definitivo para arrancar el servidor en producción
CMD ["npm", "run", "start:prod"]