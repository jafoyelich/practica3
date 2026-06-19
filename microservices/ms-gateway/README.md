# API Gateway - ERP SuperMarket Bolivia S.A.

Este es el API Gateway centralizado para el ERP SuperMarket Bolivia S.A. Está construido utilizando **NestJS** y actúa como un proxy inverso de alto rendimiento para enrutar todas las solicitudes del cliente (Frontend `web-admin`) hacia los microservicios correspondientes del backend.

## 🚀 Arquitectura y Enrutamiento

El Gateway escucha en el puerto `3000` y expone las siguientes rutas mapeadas a los microservicios internos:

| Ruta del Gateway | Microservicio Destino | Puerto por Defecto |
| :--- | :--- | :--- |
| `/sales/*` | **ms-sales** (Ventas) | `3001` |
| `/customers/*` | **ms-customer** (Clientes) | `3002` |
| `/inventory/*` | **ms-inventory** (Inventario) | `3003` |
| `/notifications/*` | **ms-notification** (Notificaciones) | `3004` |
| `/products/*` | **ms-product** (Catálogo de Productos) | `3005` |

---

## 🛠️ Características Técnicas

1. **Proxy Transparente**: Utiliza `http-proxy-middleware` para redirigir las solicitudes REST manteniendo los encabezados originales (incluyendo el token de autorización `Authorization: Bearer <token>`), parámetros de consulta y métodos HTTP.
2. **Deshabilitación de BodyParser**: La retransmisión de flujos de datos (data streams) se hace de forma directa (sin pre-procesamiento del cuerpo en NestJS), lo que permite que peticiones pesadas (como la carga de archivos Excel en `ms-inventory`) o llamadas con cuerpo JSON grande se transfieran de forma ultra-rápida y sin errores de buffering.
3. **Manejo de Errores (Bad Gateway)**: Si alguno de los microservicios internos está apagado o no responde, el Gateway captura el error de red y devuelve un mensaje JSON formateado con estado HTTP `502 Bad Gateway` en lugar de una caída cruda del servidor.
4. **CORS Habilitado**: Permitir que el frontend React/Next.js se conecte sin bloqueos de navegador.

---

## 💻 Desarrollo Local

### 1. Variables de Entorno (.env)
Crea un archivo `.env` en la raíz del microservicio con el siguiente formato:

```env
PORT=3000
JWT_SECRET=default-jwt-secret-key-erp-supermarket

# Direcciones de Microservicios Internos
MS_SALES_URL=http://localhost:3001
MS_CUSTOMER_URL=http://localhost:3002
MS_INVENTORY_URL=http://localhost:3003
MS_NOTIFICATION_URL=http://localhost:3004
MS_PRODUCT_URL=http://localhost:3005
```

### 2. Levantar en modo Desarrollo
```bash
npm run start:dev
```

### 3. Compilación e Inicio en Producción
```bash
npm run build
npm run start:prod
```

---

## 🐳 Contenedorización (Docker)
Este microservicio incluye un `Dockerfile` optimizado con compilación multi-etapa. Puedes construir la imagen ejecutando:

```bash
docker build -t erp-api-gateway .
```
