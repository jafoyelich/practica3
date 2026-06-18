# 🛒 ERP SuperMarket Bolivia S.A. - Práctica 3 (Grupo 10)

Bienvenido al repositorio central de la plataforma distribuida para la cadena de supermercados "Abuelita Serafina SuperMarket Bolivia S.A.". Este proyecto implementa una **Arquitectura de Microservicios orientada a eventos** (Event-Driven Architecture) gestionada como un Monorepo.

## 🛠️ Stack Tecnológico
* **Frontend (Panel y POS):** Next.js (Web) y Flutter (Escritorio/Móvil)
* **Backend (Microservicios):** NestJS (TypeScript)
* **API Gateway:** NestJS
* **Base de Datos:** Supabase (PostgreSQL) con aislamiento total mediante `SCHEMAS` independientes por servicio.
* **Comunicación Síncrona:** API REST (Exclusivo para consultas `GET` y validaciones cruzadas).
* **Comunicación Asíncrona (Mensajería):** RabbitMQ (Para propagación de eventos y modificaciones de estado).
* **Seguridad:** Tokens JWT (Obligatorio en todos los endpoints).
* **Infraestructura Local:** Docker & Docker Compose

---

## 📂 Estructura de Microservicios (Equipos)

La arquitectura está dividida estrictamente según los requerimientos del dominio. **Está prohibido compartir tablas entre servicios**.

```text
erp-supermercado/
├── apps/                          # Aplicaciones Cliente
│   ├── web-admin/                 # Panel administrativo (Next.js)
│   └── pos-app/                   # Aplicación de Punto de Venta (Flutter)
├── microservices/                 # Backend e Infraestructura
│   ├── api-gateway/               # Puerta de enlace pública
│   ├── auth-service/              # Shared: JWT, Usuarios, Roles y Permisos
│   ├── company-service/           # Shared: Compañías, Sucursales y Ciudades
│   ├── product-service/           # Equipo 1: Catálogo, Categorías y Marcas
│   ├── inventory-service/         # Equipo 2: Stock, Ingresos, Kardex y Carga Excel
│   ├── sales-service/             # Equipo 3: Transacciones, Pagos y Comprobantes
│   ├── customer-service/          # Equipo 4: Clientes, Historial y Fidelización
│   └── notification-service/      # Equipo 5: Simulador de envíos (WhatsApp, SMS, Correo)
├── docker-compose.yml             # Orquestación de infraestructura local
├── .env.example                   # Plantilla de variables de entorno
└── README.md                      # Este archivo
```

---

## 🚀 1. Configuración Inicial y Arranque Local

### Prerrequisitos
* Node.js (v18+)
* Docker Desktop (Activo en segundo plano)
* Flutter SDK (Para el desarrollo del POS)

### Levantar Infraestructura Base
Para que los microservicios puedan comunicarse mediante eventos asíncronos, necesitamos levantar RabbitMQ localmente.

```bash
docker-compose up -d
```
* **Panel RabbitMQ:** `http://localhost:15672` (Usuario: `admin` | Pass: `superadmin123`)

### Inicializar un Microservicio
1. Duplica el archivo `.env.example` y renómbralo a `.env` en la raíz de tu microservicio. Solicita las credenciales de Supabase al administrador.
2. Navega a la carpeta de tu servicio asignado: `cd microservices/sales-service`
3. Instala las dependencias: `npm install`
4. Levanta el servidor en modo desarrollo: `npm run start:dev`

---

## 🔒 2. Reglas de Arquitectura Obligatorias

Todo código subido a este repositorio debe cumplir los siguientes criterios de evaluación:

1. **Protección JWT:** Todos los controladores (excepto el login en `auth-service`) deben estar protegidos por un `JwtAuthGuard`. Se debe validar el rol del usuario (Ej: Cajero, Administrador).
2. **Comunicación Híbrida:** * Usa peticiones HTTP (REST) **solo para consultar información** a otros servicios.
   * Usa RabbitMQ (Eventos) **para modificar datos** en otros servicios (Ej: Emitir `SaleCompleted` para que Inventario descuente el stock).
3. **Aislamiento de BD:** Cada microservicio debe apuntar en su conexión única y exclusivamente a su esquema en Supabase (Ej: `sales_db`, `inventory_db`).

---

## 🧪 3. Checklist de Pruebas QA (Flujo de Demostración Final)

El equipo de QA debe asegurar que el sistema pueda completar este flujo de 10 pasos exactos mediante Swagger o Postman:

- [ ] **Paso 1:** Crear una compañía ("SuperMarket Bolivia").
- [ ] **Paso 2:** Crear dos sucursales (Norte y Central).
- [ ] **Paso 3:** Registrar productos (Arroz, Leche, Aceite).
- [ ] **Paso 4:** Importar inventario base desde un archivo Excel (`POST /inventory/load_Excel`).
- [ ] **Paso 5:** Consultar existencias.
- [ ] **Paso 6:** Registrar un cliente en el sistema de fidelización.
- [ ] **Paso 7:** Realizar una venta verificando existencia, descuento de stock, generación de comprobante, asignación de puntos y envío de notificación asíncrona.
- [ ] **Paso 8:** Registrar una baja de inventario por vencimiento/pérdida.
- [ ] **Paso 9:** Transferir stock de un producto entre dos sucursales.
- [ ] **Paso 10:** Consultar el saldo final y el Kardex del inventario por sucursal.

---

## 🌿 4. Convenciones de Git
* No hacer commits directos a `main`.
* Usa ramas descriptivas: `feat/sales-endpoint`, `fix/jwt-validation`.
* Revisa el código con al menos un compañero (Pull Request) antes de fusionarlo.