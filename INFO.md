## **Contexto**

La empresa **Abuelita Serafina SuperMarket Bolivia S.A.** es una corporación que posee múltiples supermercados distribuidos en diferentes ciudades del país.

Cada supermercado posee una o varias sucursales y todas pertenecen a la misma compañía.

La empresa desea modernizar completamente su plataforma tecnológica migrando de un sistema monolítico hacia una **Arquitectura de Microservicios**, permitiendo:

- crecimiento independiente de cada módulo
- alta disponibilidad
- integración mediante APIs
- comunicación mediante eventos
- escalabilidad horizontal
- despliegue independiente

El proyecto contempla exclusivamente el desarrollo del **Backend**, y **FrontEND** gráfica, y todas las pruebas.

# **Objetivos de Aprendizaje**

Al finalizar la práctica, el estudiante será capaz de:

- Diseñar una arquitectura basada en microservicios.
- Aplicar principios de Domain Driven Design.
- Diseñar APIs REST.
- Implementar comunicación síncrona entre microservicios.
- Implementar comunicación asíncrona mediante mensajería.(email, WP, Telegram o lo que gusten)
- Desplegar múltiples microservicios independientes (Opcional).

# **Arquitectura Esperada**

- Base de datos propia (o lo que su arquitecto defina)
- API REST
- Swagger
- Docker

# **Microservicios (Propuesta)**

## **Equipo 1 Product Service**

Responsabilidades

- CRUD Productos
- Categorías
- Marcas
- Código de barras
- Precio base
- Estado
- Endpoints mínimos
    - POST /products
    - GET /products
    - GET /products/{id}
    - PUT /products/{id}
    - DELETE /products/{id}
    - GET /categories
- Eventos publicados
    - ProductCreated
    - ProductUpdated
    - ProductDeleted

## **Equipo 2 Inventory Service**

Responsabilidades

- Stock por sucursal
- Ingreso de mercadería
- Baja
- Transferencias
- Kardex

Debe importar inventario desde Excel.

- Endpoints
    - POST /inventory/loadExcel
    - POST /inventory/input
    - POST /inventory/output
    - POST /inventory/transfer
    - GET /inventory/{product}
    - GET /inventory/balance
- Eventos
    - InventoryLoaded
    - InventoryUpdated
    - TransferCompleted
    - StockLow

## **Equipo 3: Sales Service**

Responsabilidades

- Registrar ventas.
    - Consultar productos.
    - Consultar stock.
    - Descontar inventario.
    - Registrar pago.
    - Generar comprobante.
- Endpoints
    - POST /sales
    - GET /sales
    - GET /sales/{id}
- Eventos
    - SaleCreated
    - SaleCancelled
    - SaleCompleted

## **Equipo 4: Customer Service**

Responsabilidades

- Clientes.
    - Programa de fidelización.
    - Puntos.(Contador de Compras++)
    - Historial.
    - Descuentos.
- Endpoints
    - POST/customers
    - GET /customers
    - GET /customers/{id}
    - GET /customers/{id}/history
    - POST /customers/{id}/points
- Eventos
    - CustomerCreated
    - PointsAssigned
    - CustomerUpdated

## **Equipo 5: Notification Service**

Responsabilidades: Escuchar eventos y generar notificaciones.

Puede simular ( 1 de estos ) :

- Correo
- SMS
- WhatsApp / Telegram
- Push Notification
- No es necesario enviar realmente el mensaje.

Solo registrar:

- Fecha
- Cliente
- Tipo
- Contenido

Eventos consumidos

- SaleCompleted
- TransferCompleted
- PointsAssigned
- PromotionCreated

# **Microservicios Compartidos**

Estos pueden ser desarrollados por un equipo adicional o proporcionados por el docente.

## **Company Service**

Administra

- Compañías
- Sucursales
    - Ciudades
- Ejemplo
    - Empresa
    - SuperMarket Bolivia
    - Sucursal Cochabamba Norte
    - Sucursal Cochabamba Sur
    - Sucursal La Paz
    - Sucursal Santa Cruz

# **Comunicación**

## **REST**

Para operaciones de consulta.

Ejemplo

Ventas

↓

Consulta Inventario

↓

Consulta Productos

↓

Consulta Cliente

## **Mensajería**

Para eventos.

Ejemplo

Venta realizada

↓

Evento

↓

Inventario actualiza stock

↓

Cliente gana puntos

↓

Notificación envía mensaje

Los estudiantes podrán utilizar:

- RabbitMQ
- Kafka
- Azure Service Bus
- Redis Streams
- cualquier broker equivalente

# **Seguridad (Opcional)**

Cada API deberá protegerse mediante JWT.

Los microservicios deberán validar el token antes de atender cualquier petición.

# **Base de Datos**

Cada microservicio debe poseer su propia base de datos (a diseño de su arquitecto).

Está prohibido compartir tablas entre servicios.

Ejemplo

- ProductDB
- InventoryDB
- SalesDB
- CustomerDB
- NotificationDB

# **Flujo de Demostración Final**

Durante la defensa, el sistema deberá demostrar el siguiente flujo completo:

## **Paso 1** Crear una compañía

SuperMarket Bolivia

## **Paso 2** Crear dos sucursales

- Central
- Zona Norte

## **Paso 3** Registrar productos

- Arroz
- Leche
- Aceite
- Azúcar

## **Paso 4** Importar inventario desde un archivo Excel

Ejemplo:

- Código
- Producto
- Sucursal
- Cantidad
- Costo
- Precio

## **Paso 5** Consultar existencias

## **Paso 6:** Registrar un cliente

## **Paso 7** Realizar una venta

Debe verificarse:

- existencia
- stock
- actualización de inventario
- generación de comprobante
- asignación de puntos
- envío de notificación

## **Paso 8** Registrar una baja por pérdida o vencimiento

## **Paso 9** Transferir inventario entre sucursales

## **Paso 10** Consultar el saldo final del inventario por sucursal

# **Requisitos Técnicos**

Cada microservicio puede incluir:

- API REST
- Swagger/OpenAPI
- Dockerfile
- archivo docker-compose (opcional)
- JWT
- Validaciones
- Manejo de excepciones
- Logs
- Base de datos independiente
- Variables de entorno
- Colección Postman o equivalente
- Informe "Conclusión del trabajo" (máximo **media plana 100% redactada por ustedes**, acompañen con cualquier cantidad de páginas anexas con capturas de pantalla, diagramas entidad relación, diccionarios, esquemas …. )

# **Revisión**

- **Registrar** un nuevo supermercado con el nombre **"OXXO Bolivia"**. (Posman /UI)
- **Crear** dos sucursales para el supermercado registrado: (Postman /UI)

**Sucursal Prado**

**Sucursal El Alto**

- **Registrar** un lote inicial de **100 unidades del Producto X**, con un **precio de venta de Bs 18,50 por unidad**, asignándole al inventario de la **Sucursal Prado**. (UI)
- **Realizar** una venta al cliente **"Juanito Pérez"**, registrando la compra de **2 unidades del Producto X** y **emitiendo la factura correspondiente**.(UI)
- **Transferir** **50 unidades del Producto X** desde la **Sucursal Prado** hacia la **Sucursal El Alto**, verificando la actualización correcta del inventario en ambas sucursales. (UI)
- **Registrar** una nueva venta de **1 unidad del Producto X** al cliente **"Juanito Pérez"**, utilizando **cualquier sucursal perteneciente a otro supermercado** registrado en el sistema. (UI)
- **Generar** un reporte consolidado que muestre el **saldo total disponible del Producto X**, sumando las existencias de **todas las sucursales** registradas en el sistema. (Posman /UI)

Producto: Leche Pil 980cc

Hipermaxi

Sucursal 1 18 Bolsas

IC Norte

Melchor Perez 85 Bolsas

OXXO Bolivia

El Prado 48 Bolsas

El Alto 50 Bolsas

- **Consultar** el reporte de ventas del día para determinar **el monto total de ingresos obtenidos durante la jornada

Ingresos : 2026-06-17 **495.50**

Ventas Efectivo

Leche Pil 980cc 3 x 18.50 55.50

Ventas Tarjeta

Mayonesa Cris 120 x 2 240

# **Criterios de Evaluación (100 puntos)**

| **Criterio**                                                   | **Puntaje** |
| -------------------------------------------------------------- | ----------- |
| Correcta descomposición en microservicios                      | 25          |
| ---                                                            | ---         |
| Diseño de APIs REST , Comunicación entre microservicios (REST) | 25          |
| ---                                                            | ---         |
| UI, UX                                                         | 50          |
| ---                                                            | ---         |