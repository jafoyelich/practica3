# 🔔 Notification Service (ms-notification)

Este es el microservicio de Notificaciones y Comprobantes (**Notification Service**) de la plataforma del ERP **"OXXO Bolivia"**. Actúa principalmente como consumidor de eventos asíncronos distribuidos a través del broker de mensajería **RabbitMQ** y expone un endpoint REST para auditar el historial de alertas emitidas.

---

## 🚀 Reglas Arquitectónicas e Integración

1. **Aislamiento de Almacenamiento**: Las operaciones escriben y leen del esquema de datos `notification_db` en Supabase de forma exclusiva.
2. **Seguridad**: El endpoint de historial REST está protegido por [JwtAuthGuard](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-notification/src/notification/guards/jwt-auth.guard.ts), requiriendo un token portador Bearer JWT válido.
3. **Comunicación Híbrida**:
   - **Síncrono (REST)**: Expone endpoints de consulta segura para auditar los mensajes emitidos.
   - **Asíncrono (RabbitMQ)**: Escucha de forma activa la cola `notification_queue` y procesa eventos de ventas, transferencias y fidelización para generar logs simulados de alertas de mensajería (SMS, WhatsApp, Correo).

---

## 📬 Suscripción y Consumo de Eventos (RabbitMQ)

El microservicio escucha los siguientes patrones en la cola `notification_queue`:

### 1. Evento `SaleCompleted`
* **Acción**: Genera la alerta de cobro de factura y envío del comprobante al cliente.
* **Log Persistido**: Se registra en base de datos especificando el canal ('WhatsApp' o 'Correo'), el destinatario y el desglose de la venta.

### 2. Evento `TransferCompleted`
* **Acción**: Registra una notificación indicando el traslado de stock exitoso entre sucursales de la empresa para fines logísticos.

### 3. Evento `PointsAssigned`
* **Acción**: Genera una alerta informativa para el cliente con la cantidad de puntos de fidelización recién ganados y su saldo acumulado en el sistema.

---

## 📊 Estructura de Base de Datos

El servicio interactúa con las siguientes tablas dentro del esquema `notification_db`:

### 1. Tabla `registros_notificacion`
* `id` (UUID, Primary Key)
* `id_venta` (UUID, nullable)
* `id_cliente` (UUID)
* `tipo` (Text - ej: 'COMPROBANTE_VENTA', 'PUNTOS_FIDELIZACION', 'LOGISTICA')
* `destinatario` (Text - correo o teléfono del cliente)
* `mensaje` (Text - cuerpo del mensaje simulado)
* `estado` (Text - ej: 'ENVIADO', 'PENDIENTE', 'ERROR')
* `fecha` (Timestamp with time zone)

---

## 🛠️ Endpoints REST expuestos (Puerto 3004)

### 1. `GET /notifications/history/:id_cliente`
Obtiene la lista cronológica de todas las notificaciones simuladas que han sido enviadas a un cliente.
* **Parámetro**: `:id_cliente` (UUID v4 del cliente).
* **Protección**: Requiere cabecera de autenticación Bearer JWT.

---

## ⚙️ Configuración e Instalación

### Variables de Entorno (`.env`)
Configura el archivo en la raíz del microservicio:
```env
PORT=3004
JWT_SECRET=default-jwt-secret-key-erp-supermarket
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
SUPABASE_SCHEMA=notification_db
RABBITMQ_URL=amqp://admin:superadmin123@localhost:5672
```

### Ejecutar Localmente
```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run start:dev
```
