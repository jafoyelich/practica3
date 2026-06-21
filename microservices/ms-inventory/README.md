# 🪵 Inventory Service (ms-inventory)

Este es el microservicio de Inventario e Historial de Movimientos (**Inventory Service**) de la plataforma del ERP **"OXXO Bolivia"**. Gestiona las existencias físicas de productos por sucursal, la bitácora transaccional (Kardex), mermas, transferencias y la importación masiva de lotes iniciales.

---

## 🚀 Reglas Arquitectónicas e Integración

1. **Aislamiento de Almacenamiento**: Las operaciones escriben y consultan de forma aislada en el esquema `inventory_db` de Supabase utilizando el SDK de Supabase.
2. **Caché con Redis**: Integra un motor de caché Redis para almacenar y agilizar las consultas recurrentes de existencias y balances del catálogo nacional.
3. **Seguridad**: Rutas protegidas bajo el guardián [JwtAuthGuard](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-inventory/src/inventory/guards/jwt-auth.guard.ts), exigiendo token Bearer JWT.
4. **Comunicación Híbrida**:
   - **Síncrono (REST)**: El microservicio `ms-sales` realiza una consulta síncrona a este servicio (`GET /inventory/:id_producto/stock?id_sucursal=<uuid>`) para verificar la disponibilidad física de los productos en la sucursal del POS antes de consolidar el cobro.
   - **Asíncrono (RabbitMQ)**: Escucha de forma pasiva la cola `inventory_queue`. Al completarse una venta (`SaleCompleted`), descuenta asíncronamente las unidades del stock y genera un movimiento de tipo `'VENTA'` en el Kardex.

---

## 📬 Consumo de Eventos (RabbitMQ)

El microservicio está suscrito al evento **`SaleCompleted`** y realiza el siguiente proceso:
1. Itera sobre la lista de `detalles` de productos de la venta finalizada.
2. Consulta el stock en la tabla `stock_sucursal` filtrado por producto y sucursal de origen.
3. Resta la cantidad comprada y actualiza la fila de stock de la sucursal.
4. Registra un movimiento de egreso de tipo `'VENTA'` en la tabla `kardex` con referencia al ID de la venta.

---

## 📊 Estructura de Base de Datos

El servicio interactúa con las siguientes tablas dentro del esquema `inventory_db`:

### 1. Tabla `stock_sucursal`
* `id_stock` (UUID, Primary Key)
* `id_sucursal` (UUID)
* `id_producto` (UUID)
* `cantidad` (Numeric)

### 2. Tabla `kardex`
* `id_kardex` (UUID, Primary Key)
* `id_sucursal` (UUID)
* `id_producto` (UUID)
* `tipo_movimiento` (Varchar - ej: 'INGRESO', 'EGRESO', 'TRANSFERENCIA', 'VENTA')
* `cantidad` (Numeric)
* `motivo` (Text - ej: 'Pérdida por vencimiento', 'Venta Nro <id_venta>')
* `fecha` (Timestamp with time zone)

---

## 🛠️ Endpoints REST expuestos (Puerto 3003)

### 1. `POST /inventory/loadExcel`
Permite cargar un lote masivo de inventario base a través de la importación de un archivo Excel.
* **Procesamiento**: Lee el archivo multipart en memoria empleando la librería `xlsx`, actualiza los saldos en `stock_sucursal` y asienta movimientos `'INGRESO'` en Kardex.

### 2. `POST /inventory/input`
Registra un ingreso individual de mercadería de forma manual (lote inicial).
* **Cuerpo de la Petición (DTO: `RegisterInputDto`)**:
  ```json
  {
    "id_sucursal": "5f3a0937-2cfc-4bf0-80d4-1a986c7b3370",
    "id_producto": "b901a1c9-7323-4c91-bf9b-3a52e72bc13d",
    "cantidad": 100
  }
  ```

### 3. `POST /inventory/loss`
Registra una baja o merma de stock físico (ej. producto roto, dañado o vencido).
* **Cuerpo de la Petición (DTO: `RegisterLossDto`)**:
  ```json
  {
    "id_sucursal": "5f3a0937-2cfc-4bf0-80d4-1a986c7b3370",
    "id_producto": "b901a1c9-7323-4c91-bf9b-3a52e72bc13d",
    "cantidad": 5,
    "motivo": "Producto vencido"
  }
  ```

### 4. `POST /inventory/transfer`
Transfiere stock físico de una sucursal de origen a una de destino.
* **Cuerpo de la Petición (DTO: `TransferStockDto`)**:
  ```json
  {
    "id_sucursal_origen": "5f3a0937-2cfc-4bf0-80d4-1a986c7b3370",
    "id_sucursal_destino": "835c2491-b3b4-4e4a-b501-c88f34bc4449",
    "id_producto": "b901a1c9-7323-4c91-bf9b-3a52e72bc13d",
    "cantidad": 50
  }
  ```

### 5. `GET /inventory/:id_producto/stock`
Obtiene las existencias actuales de un producto filtrado por la sucursal provista como query param (`?id_sucursal=<uuid>`).

### 6. `GET /inventory/kardex/:id_sucursal`
Retorna el historial completo de transacciones de inventario (Kardex) de una sucursal ordenadas por fecha.

### 7. `GET /inventory/balance`
Retorna el balance general de stock disponible a nivel nacional.

---

## ⚙️ Configuración e Instalación

### Variables de Entorno (`.env`)
Configura el archivo en la raíz del microservicio:
```env
PORT=3003
JWT_SECRET=default-jwt-secret-key-erp-supermarket
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
SUPABASE_SCHEMA=inventory_db
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://admin:superadmin123@localhost:5672
```

### Ejecutar Localmente
```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run start:dev
```
