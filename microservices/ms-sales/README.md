# Sales Service (ms-sales)

Este es el microservicio de Ventas (**Sales Service**) de un sistema ERP para supermercados basado en una arquitectura de microservicios. Está construido utilizando **NestJS**, **TypeScript**, el SDK oficial de **Supabase** y **RabbitMQ** para mensajería asíncrona.

---

## 🚀 Características y Reglas Arquitectónicas

1. **Base de Datos Aislada**: Las consultas apuntan estrictamente al esquema `sales_db` de Supabase utilizando `@supabase/supabase-js`. No se utiliza TypeORM ni Prisma.
2. **Seguridad**: Todos los endpoints REST están protegidos a través de la validación del header de autorización por medio de un [JwtAuthGuard](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-sales/src/sales/guards/jwt-auth.guard.ts) real.
3. **Comunicación Síncrona (REST)**: Antes de procesar y registrar una venta, el servicio realiza llamadas REST HTTP a otros microservicios del ERP para validar la existencia de la información:
   - **Customer Service**: Valida el estado del cliente.
   - **Product Service**: Obtiene los precios vigentes de los productos.
   - **Inventory Service**: Valida las existencias y la disponibilidad del stock.
4. **Comunicación Asíncrona (RabbitMQ)**: Emite eventos basados en el estado del procesamiento de la venta a través de un `ClientProxy` inyectado por NestJS.

---

## 📊 Estructura de Base de Datos (Esquema: `sales_db`)

El servicio interactúa con las siguientes tablas dentro del esquema aislado `sales_db`:

### 1. Tabla `ventas`
* `id_venta` (UUID, Primary Key)
* `id_sucursal` (UUID)
* `id_cliente` (UUID)
* `fecha` (Timestamp con zona horaria)
* `subtotal` (Numeric)
* `total` (Numeric)
* `estado` (Varchar - ej. 'COMPLETADA', 'PENDIENTE')

### 2. Tabla `detalle_venta`
* `id_detalle` (UUID, Primary Key)
* `id_venta` (UUID, Foreign Key ref `ventas.id_venta`)
* `id_producto` (UUID)
* `cantidad` (Numeric)
* `precio_unitario_cobrado` (Numeric)
* `subtotal` (Numeric)

### 3. Tabla `comprobantes`
* `id_comprobante` (UUID, Primary Key)
* `id_venta` (UUID, Foreign Key ref `ventas.id_venta`)
* `nro_comprobante` (Serial / Autoincrementable)
* `fecha_emision` (Timestamp con zona horaria)

---

## 🛠️ Endpoints y DTOs

### 1. `POST /sales`
Registra una venta procesada. Valida síncronamente los datos con los microservicios externos y si todo es correcto, persiste la venta, sus detalles y emite el comprobante correspondiente en Supabase.

* **Protección**: Requiere JWT Token (Cabecera `Authorization: Bearer <token>`).
* **Cuerpo de la Petición (DTO de validación: [CreateSaleDto](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-sales/src/sales/dto/create-sale.dto.ts))**:
  ```json
  {
    "id_sucursal": "5f3a0937-2cfc-4bf0-80d4-1a986c7b3370",
    "id_cliente": "a1c49929-1065-4f36-96b6-f5ffb6a37885",
    "detalles": [
      {
        "id_producto": "b901a1c9-7323-4c91-bf9b-3a52e72bc13d",
        "cantidad": 5
      }
    ]
  }
  ```

* **Flujo de Eventos de RabbitMQ**:
  * Emite `'SaleCreated'` al iniciar la transacción y validaciones.
  * Emite `'SaleCompleted'` pasando el payload completo tras la persistencia exitosa.
  * En caso de error en cualquier punto de las validaciones u operaciones en base de datos, emite `'SaleCancelled'` y realiza un rollback manual de los registros creados antes de retornar el error `HttpException` al cliente.

### 2. `GET /sales`
Retorna el listado de todas las ventas del ERP registradas en el esquema `sales_db`.
* **Protección**: Requiere JWT Token.

### 3. `GET /sales/{id}`
Obtiene el detalle completo de una venta en específico, incluyendo la información de la cabecera, un arreglo de sus productos comprados (`detalle_venta`) y el comprobante de pago emitido (`comprobantes`).
* **Protección**: Requiere JWT Token.
* **Validación**: El parámetro `{id}` debe ser un UUID v4 válido (valida a través de `ParseUUIDPipe`).

---

## 📬 Sistema de Eventos (RabbitMQ)

El cliente de RabbitMQ se configura mediante `ClientsModule` en el archivo [sales.module.ts](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-sales/src/sales/sales.module.ts). Los eventos que publica el microservicio son:

* **`SaleCreated`**: Publicado al momento de validar síncronamente al cliente, stock y precios unitarios.
* **`SaleCompleted`**: Publicado una vez confirmadas las transacciones en Supabase (cabecera, detalles e invoice persistidos con éxito).
* **`SaleCancelled`**: Publicado ante cualquier error de red, validación o base de datos. Detalla la razón del fallo y el DTO recibido.

---

## ⚙️ Configuración e Instalación

### Requisitos Previos
* Node.js v18 o superior.
* Servidor de RabbitMQ corriendo localmente o en la nube.
* Base de datos Supabase habilitada con el esquema `sales_db` creado.

### Instalación de dependencias
```bash
npm install
```

### Variables de Entorno (.env)
Configura un archivo `.env` en la raíz del proyecto:
```env
PORT=3000
JWT_SECRET=tu-clave-secreta-compartida-del-erp
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-o-service-role-key
RABBITMQ_URL=amqp://localhost:5672

# URLs de otros servicios
CUSTOMER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
INVENTORY_SERVICE_URL=http://localhost:3003
```

### Ejecutar la Aplicación

```bash
# Modo desarrollo (watch)
npm run start:dev

# Compilación de producción
npm run build

# Iniciar servidor en producción
npm run start:prod
```

---

## 🧪 Pruebas
```bash
npm run test
```
