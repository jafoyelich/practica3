# 🛒 ERP Supermercado - Arquitectura de Microservicios (Grupo 10)

Bienvenido al repositorio central del ERP/POS para la cadena de supermercados. Este proyecto utiliza una arquitectura de **Microservicios** y está gestionado como un **Monorepo**.

## 🛠️ Stack Tecnológico
* **Frontend (Panel Web):** Next.js (TypeScript, Tailwind CSS)
* **Frontend (Punto de Venta / POS):** Flutter
* **Backend (Microservicios):** NestJS
* **Base de Datos:** Supabase (PostgreSQL) usando Schemas separados.
* **Mensajería Asíncrona:** RabbitMQ
* **Caché:** Redis
* **Infraestructura Local:** Docker & Docker Compose

---

## 📂 Estructura del Proyecto

El repositorio está dividido en dos directorios principales para mantener separadas las dependencias de las interfaces gráficas y las APIs:

```text
erp-supermercado/
├── apps/                    # Aplicaciones Cliente
│   ├── web-admin/           # Panel administrativo (Next.js)
│   └── pos-app/             # Aplicación de cajeras y almacén (Flutter)
├── microservices/           # Backend e Infraestructura
│   ├── api-gateway/         # Puerta de enlace (NestJS)
│   ├── ms-ventas/           # MS de Ventas y Facturación (NestJS)
│   ├── ms-inventario/       # MS de Inventario y Almacenes (NestJS)
│   ├── ms-compras/          # MS de Compras y Proveedores (NestJS)
│   ├── ms-finanzas/         # MS Financiero y Pagos (NestJS)
│   └── ms-rrhh/             # MS de Recursos Humanos (NestJS)
├── docker-compose.yml       # Orquestación de infraestructura local
├── .env.example             # Plantilla de variables de entorno
└── README.md                # Este archivo
```

---

## 🚀 1. Configuración Inicial (Para todos los miembros)

### Prerrequisitos
Antes de empezar, asegúrate de tener instalados:
* [Node.js](https://nodejs.org/) (v18+)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Asegúrate de que el motor de Docker esté activo).
* [Flutter SDK](https://docs.flutter.dev/get-started/install) (Solo para quienes desarrollen la aplicación POS).

### Clonar y Configurar Variables
1. Clona este repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd erp-supermercado
   ```
2. Crea un archivo `.env` en la raíz del proyecto basándote en el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
   *(Solicita las credenciales de conexión de Supabase al administrador de la base de datos para agregarlas a tu `.env`).*

---

## 🐳 2. Levantar la Infraestructura (Docker)

Para que los microservicios puedan comunicarse de manera asíncrona y gestionar la caché, necesitamos levantar **RabbitMQ** y **Redis** localmente.

En la raíz del proyecto, ejecuta el siguiente comando:
```bash
docker-compose up -d
```
* **RabbitMQ Panel:** Disponible en `http://localhost:15672` (Usuario: `admin` | Pass: `superadmin123`)
* **Redis:** Corriendo localmente en el puerto `6379`.

Para detener los servicios al finalizar tu jornada de desarrollo ejecuta: `docker-compose down`.

---

## 🏗️ 3. Guía: Cómo crear y configurar un nuevo Microservicio

Si eres el encargado de un dominio y tu carpeta en `microservices/` aún no ha sido inicializada, sigue estos pasos:

1. Navega a la carpeta de microservicios desde la raíz:
   ```bash
   cd microservices
   ```
2. Genera el esqueleto del proyecto usando el CLI de NestJS (reemplaza `ms-tu-modulo` con el nombre asignado, por ejemplo, `ms-inventario`):
   ```bash
   npx @nestjs/cli new ms-tu-modulo
   ```
   *(Selecciona `npm` cuando te pregunte qué gestor de paquetes usar para mantener la homogeneidad).*
3. **Modificación Obligatoria del Puerto:**
   Por defecto, NestJS intenta levantar la aplicación en el puerto `3000`. Para evitar conflictos con los demás servicios corriendo en simultáneo, edita el archivo `src/main.ts` de tu nuevo módulo y asigna el puerto que le corresponde según el archivo de variables de entorno:
   ```typescript
   // Ejemplo en microservices/ms-inventario/src/main.ts
   await app.listen(process.env.PORT || 3002);
   ```

---

## ▶️ 4. Cómo ejecutar los proyectos en local

Abre una terminal independiente para cada servicio que requieras inicializar en tu entorno local.

### 🟢 Backend (NestJS)
Navega a la carpeta del microservicio específico y arrácalo en modo de desarrollo con recarga automática (*watch mode*):
```bash
cd microservices/ms-ventas
npm run start:dev
```

### 🔵 Frontend Web (Next.js)
Navega a la carpeta de la interfaz administrativa y levanta el servidor de desarrollo:
```bash
cd apps/web-admin
npm run dev
```
La aplicación estará disponible para interactuar en `http://localhost:3000`.

### 📱 Frontend POS (Flutter)
Navega a la carpeta del Punto de Venta y compila/ejecuta la aplicación:
```bash
cd apps/pos-app
flutter run
```

---

## 🌿 5. Reglas de Git (Flujo de Trabajo)

Para asegurar la estabilidad del proyecto y facilitar las tareas de integración y QA:
1. **NUNCA** realices commits directos sobre la rama `main`.
2. Crea ramas de trabajo descriptivas y estructuradas según su propósito:
    * `feat/nombre-feature` (ej: `feat/cobro-qr-ventas`)
    * `fix/nombre-bug` (ej: `fix/calculo-costo-compras`)
3. Aplica el estándar de **Conventional Commits**: `feat: añade endpoint para registrar venta`.
4. Abre un **Pull Request (PR)** hacia la rama `main` y solicita la revisión de tus compañeros antes de realizar el merge.