# 📘 Guía Rápida: Desarrollo de Microservicios con NestJS (Práctica 3)

Este documento contiene los lineamientos técnicos obligatorios para el Grupo 10 y una serie de *prompts* recomendados para generar el código base de cada microservicio de manera estandarizada.

---

## 🔑 Puntos Claves de NestJS para nuestra Arquitectura

Para cumplir con los requerimientos del docente, todos los microservicios deben seguir estos principios:

1. **Controladores Duales (REST + Eventos):**
    * Usaremos **Controladores HTTP** (`@Controller`) para las consultas síncronas requeridas (ej. `GET /products`, `GET /inventory/balance`).
    * Usaremos **Controladores de Microservicio** (`@EventPattern`) para escuchar eventos asíncronos desde RabbitMQ (ej. escuchar `SaleCompleted`).

2. **Validación y DTOs (Data Transfer Objects):**
    * Mantengan el código limpio con la configuración de ESLint y tipen estrictamente todos los datos de entrada y salida usando TypeScript.
    * Utilicen `class-validator` y `class-transformer` en sus DTOs para evitar que entre basura a los endpoints.

3. **Seguridad Obligatoria (JWT Guards):**
    * **Ningún endpoint debe estar público** (excepto el login en el Auth Service).
    * Implementen un `AuthGuard` global o a nivel de controlador (`@UseGuards(JwtAuthGuard)`) en cada microservicio para validar el token antes de procesar la petición.

4. **Conexión Aislada a Supabase:**
    * Cada microservicio debe apuntar **exclusivamente a su propio esquema** en Supabase. Prohibido hacer consultas SQL (o usar el SDK) apuntando a tablas de otros equipos.

5. **Emisión de Eventos a RabbitMQ:**
    * Usaremos el `ClientProxy` de NestJS. Cuando una acción modifique el estado (como registrar una venta), el servicio debe emitir el evento en lugar de llamar directamente a la API de otro servicio.
   ```typescript
   this.rabbitClient.emit('SaleCompleted', { id_venta: venta.id, detalles: venta.detalles });