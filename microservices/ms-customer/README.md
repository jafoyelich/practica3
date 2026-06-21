# 👥 Customer Service (ms-customer)

Este es el microservicio de Clientes y Fidelización (**Customer Service**) de la plataforma del ERP **"OXXO Bolivia"**. Está diseñado bajo una arquitectura de servicio híbrida, atendiendo consultas síncronas vía API REST y reaccionando de forma asíncrona a eventos de ventas propagados a través de **RabbitMQ**.

---

## 🚀 Reglas Arquitectónicas e Integración

1. **Aislamiento de Almacenamiento**: Las operaciones leen y escriben únicamente en el esquema `customer_db` de Supabase utilizando el SDK oficial.
2. **Seguridad**: Los endpoints REST se encuentran protegidos bajo [JwtAuthGuard](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-customer/src/customer/guards/jwt-auth.guard.ts), exigiendo el token de cabecera Bearer JWT.
3. **Comunicación Híbrida**:
   - **Síncrono (REST)**: El microservicio `ms-sales` llama a este servicio (`GET /customers/:id`) al procesar una venta para validar que el cliente exista y esté en estado `ACTIVO`.
   - **Asíncrono (RabbitMQ)**: Escucha la cola `customer_queue` y procesa eventos de ventas concretadas para acreditar de manera diferida los puntos de fidelización del cliente.

---

## 📬 Consumo de Eventos (RabbitMQ)

El microservicio está suscrito al evento **`SaleCompleted`** y reacciona de la siguiente manera:
1. Recibe el payload de la venta (incluye el `id_cliente` y el `total` facturado).
2. Calcula los puntos asignados basándose en la regla corporativa (ej: **1 punto por cada Bs 10.00** de compra).
3. Actualiza el balance de puntos del cliente en la tabla `clientes`.
4. Asienta un registro en la tabla `historial_puntos`. En caso de que falle, se ejecuta una reversión (rollback manual) de los puntos del cliente en base de datos para mantener la consistencia transaccional.

---

## 📊 Estructura de Base de Datos

El servicio interactúa con las siguientes tablas dentro del esquema `customer_db`:

### 1. Tabla `clientes`
* `id` (UUID, Primary Key)
* `nombre` (Text)
* `ci` (Text, Unique)
* `email` (Text)
* `telefono` (Text)
* `estado` (Text - ej: 'ACTIVO', 'INACTIVO')
* `puntos` (Integer)

### 2. Tabla `historial_puntos`
* `id` (UUID, Primary Key)
* `id_cliente` (UUID, Foreign Key)
* `puntos` (Integer - puntos sumados o restados)
* `motivo` (Text - ej: 'Acumulación por Venta <id_venta>')
* `fecha` (Timestamp with time zone)

---

## 🛠️ Endpoints REST expuestos (Puerto 3002)

### 1. `POST /customers`
Registra un nuevo cliente en el programa de fidelización del ERP.
* **Cuerpo de la Petición (DTO: `CreateCustomerDto`)**:
  ```json
  {
    "nombre": "Juanito Pérez",
    "ci": "1234567 LP",
    "email": "juanito@mail.com",
    "telefono": "77777777"
  }
  ```

### 2. `GET /customers`
Retorna el listado de todos los clientes del sistema.

### 3. `GET /customers/:id`
Busca un cliente por su ID único (UUID v4). Retorna sus datos y su balance de puntos.

### 4. `GET /customers/:id/history`
Retorna el historial completo de movimientos de puntos de un cliente.

### 5. `POST /customers/:id/points`
Acredita o descuenta puntos a un cliente de forma manual desde el panel de control.
* **Cuerpo de la Petición**:
  ```json
  {
    "puntos": 50,
    "motivo": "Acreditación manual por cortesía de atención"
  }
  ```

---

## ⚙️ Configuración e Instalación

### Variables de Entorno (`.env`)
Configura el archivo en la raíz del microservicio:
```env
PORT=3002
JWT_SECRET=default-jwt-secret-key-erp-supermarket
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
SUPABASE_SCHEMA=customer_db
RABBITMQ_URL=amqp://admin:superadmin123@localhost:5672
```

### Ejecutar Localmente
```bash
# Instalar dependencias
npm install

# Modo desarrollo (Inicia servidor HTTP y suscriptor de RabbitMQ)
npm run start:dev
```
