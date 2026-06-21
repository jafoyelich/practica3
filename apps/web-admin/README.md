# 💻 ERP / POS - Panel Web Administrativo (Next.js App Router)

Esta es la aplicación Frontend de administración centralizada y Punto de Venta (POS) para la plataforma distribuida de supermercados **"OXXO Bolivia"**. Diseñada de forma profesional con un enfoque moderno, responsivo y de alto rendimiento.

## 🚀 Módulos Implementados

El frontend interactúa de forma síncrona con el **API Gateway** (Puerto 3000) y está estructurado en torno a los siguientes módulos clave de negocio:

1. **🔒 Autenticación y Seguridad (`/login`)**:
   - Acceso seguro mediante validación de credenciales corporativas (`admin@supermarket.bo` / `admin123`).
   - Redirección automatizada mediante ruta protegida en el Layout principal.
   - Integración de cabeceras HTTP dinámicas con interceptores de Axios leyendo de `localStorage`.
   - Botón de autocompletado y micro-animaciones para el control de carga y visibilidad de contraseña.

2. **🏠 Panel Principal / Telemetría de Arquitectura (`/`)**:
   - Resumen analítico de métricas clave (ingresos de ventas, catálogo nacional, sucursales y clientes registrados).
   - **Monitor Dinámico de Infraestructura**: Un sistema de diagnóstico en tiempo real que evalúa de forma reactiva las respuestas de la API. Si un microservicio se cae (error proxy 502) o la base de datos Supabase se pausa (error de conexión 500), el monitor cambia el estado de los componentes a `Desconectado` de forma automática.
   - Acceso rápido a las operaciones recurrentes y feed interactivo de las últimas ventas.

3. **🛒 Punto de Venta POS (`/sales`)**:
   - Selector interactivo de Sucursal y Cliente (requerido para habilitar el carrito).
   - Catálogo lateral de productos con filtrado rápido.
   - Gestión reactiva del carrito utilizando **Zustand** (almacenamiento en el array `detalles` para cumplir con las especificaciones UUID de la base de datos).
   - Verificación de stock en tiempo real por sucursal seleccionada.
   - Comprobante/Factura visual interactiva en formato modal, diseñada con micro-animaciones de entrada y salida fluidas.

4. **🪵 Control de Inventario y Kardex (`/inventory`)**:
   - Cuadrícula nacional de stock consolidado (existencias totales en el país).
   - Listado del Kardex transaccional filtrado por sucursal (entradas por compra, salidas por venta, bajas y transferencias).
   - Modal de carga de inventario masivo (simulación de carga Excel).
   - Modal de transferencia física de stock entre sucursales de la empresa.

5. **🏢 Módulo de Administración Corporativa (`/admin`)**:
   - Pestañas dinámicas para gestionar los catálogos del sistema:
     - **Compañías**: Registro de corporaciones ("OXXO Bolivia").
     - **Sucursales**: Registro de puntos de venta geográficos ("Prado", "El Alto").
     - **Clientes**: Altas para el programa de puntos y fidelización.
     - **Ingresos**: Carga manual individual de inventario inicial.
     - **Bajas/Pérdidas**: Registro formal de mermas físicas por vencimiento o daño.

6. **📊 Reportes Financieros (`/reports`)**:
   - Reporte diario consolidado de ingresos del día.
   - Desglose detallado de ventas cobradas en **Efectivo** vs. ventas cobradas con **Tarjeta**.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router & React Server Components).
- **Librería de Componentes**: [React 19.0](https://react.dev/).
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) para una estética corporativa neutra basada en Slate/Zinc, libre de tonos índigo/violeta, con relieve y bordes suavizados de estilo empresarial.
- **Gestión de Estado**: [Zustand](https://github.com/pmndrs/zustand) (Almacén ligero y reactivo sin sobrecargar el bundle).
- **Cliente HTTP**: [Axios](https://axios-http.com/) con interceptores de solicitud para inyectar dinámicamente el token Bearer JWT.
- **Iconografía**: [Lucide React](https://lucide.dev/).

---

## 📂 Estructura de Directorios

```text
apps/web-admin/
├── public/                    # Archivos estáticos y multimedia
└── src/
    ├── app/                   # Next.js App Router (Páginas y layouts)
    │   ├── (dashboard)/       # Grupo de rutas protegidas bajo el Sidebar
    │   │   ├── admin/         # Módulo de administración (Tablas CRUD)
    │   │   ├── inventory/     # Kardex, saldos y transferencias
    │   │   ├── reports/       # Reportes diarios (Efectivo/Tarjeta)
    │   │   ├── sales/         # Punto de venta (POS) y facturación
    │   │   ├── layout.tsx     # Layout del Dashboard con barra superior móvil y Sidebar
    │   │   └── page.tsx       # Página de inicio unificada (Métricas y telemetría)
    │   ├── login/             # Página de inicio de sesión corporativa
    │   ├── globals.css        # Estilos globales y tokens de Tailwind CSS
    │   └── layout.tsx         # Layout raíz (Inyección de AuthProvider)
    ├── components/            # Componentes compartidos (Sidebar, Topbar, etc.)
    ├── context/               # Proveedores de contexto (AuthContext para JWT)
    ├── lib/                   # Clientes de librerías externas (Axios custom)
    └── store/                 # Almacenes de Zustand (useCartStore)
```

---

## ⚙️ Configuración y Variables de Entorno

Para habilitar la comunicación con el API Gateway, crea un archivo `.env` en la raíz de esta subcarpeta (`apps/web-admin/`):

```env
# URL de conexión al API Gateway unificado de microservicios
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 💻 Comandos de Ejecución

Dentro del directorio `apps/web-admin/`, puedes ejecutar:

### 1. Iniciar Servidor de Desarrollo
Inicia la aplicación en modo desarrollo en el puerto alternativo `4000` (para evitar colisiones con el Gateway):
```bash
npm run dev
```

### 2. Construir la Aplicación para Producción
Compila el proyecto Next.js optimizando los archivos estáticos e inspeccionando los tipos de TypeScript:
```bash
npm run build
```

### 3. Iniciar en Producción
Sirve la compilación optimizada generada en el paso anterior:
```bash
npm run start
```

### 4. Validar Código (Linting)
Ejecuta el linter ESLint para comprobar que el código cumple con las reglas del proyecto:
```bash
npm run lint
```

---

## 🔒 Detalles de Seguridad e Interceptores

El sistema intercepta automáticamente cada petición HTTP realizada a través de `axiosInstance`:
- **Contexto**: El `AuthProvider` montado en el layout raíz maneja el estado de la sesión (`token`, `nombre`, `rol`, `email`) y los guarda en `localStorage` al iniciar sesión.
- **Intercepción de Petición**: El interceptor de Axios (`src/lib/axios.ts`) verifica si existe un token en el navegador e inyecta la cabecera `Authorization: Bearer <token>` de forma síncrona. Si no hay token, utiliza el token de QA de desarrollo para facilitar la integración cruzada.
- **Limpieza en Logout**: Al presionar *"Cerrar Sesión"*, el sistema limpia todos los rastros del navegador (`localStorage.clear()`, `sessionStorage.clear()`), revoca la sesión en el contexto y fuerza una recarga de página para invalidar las rutas protegidas.
