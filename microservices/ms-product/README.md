# 📦 Product Catalog Service (ms-product)

Este es el microservicio del Catálogo de Productos (**Product Catalog Service**) de la plataforma del ERP **"OXXO Bolivia"**. Gestiona la definición de los productos, sus precios base de venta, marcas, categorías y códigos de barra globales.

---

## 🚀 Reglas Arquitectónicas e Integración

1. **Aislamiento de Almacenamiento**: Las operaciones escriben y leen exclusivamente del esquema `product_db` en Supabase de forma aislada.
2. **Seguridad**: Todos los endpoints REST se encuentran protegidos bajo [JwtAuthGuard](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-product/src/product/guards/jwt-auth.guard.ts), exigiendo token Bearer JWT.
3. **Mapeo de Compatibilidad de Precios**:
   * En Supabase, la tabla almacena el precio del producto en la columna `precio_base`.
   * Para asegurar la compatibilidad con el microservicio de ventas (`ms-sales`) durante las consultas síncronas de facturación, los endpoints de consulta de este microservicio mapean automáticamente la propiedad `precio_base` al campo `precio_unitario`.
   * El POS de ventas realiza una consulta síncrona `GET /products/:id` para validar el precio unitario oficial de cada ítem antes de registrar el cobro.

---

## 📊 Estructura de Base de Datos

El servicio interactúa con las siguientes tablas dentro del esquema `product_db`:

### 1. Tabla `productos`
* `id` (UUID, Primary Key)
* `nombre` (Varchar)
* `codigo_barras` (Varchar, Unique)
* `precio_base` (Numeric)
* `id_categoria` (UUID, Foreign Key)
* `id_marca` (UUID, Foreign Key)

### 2. Tabla `categorias`
* `id_categoria` (UUID, Primary Key)
* `nombre` (Varchar)

### 3. Tabla `marcas`
* `id_marca` (UUID, Primary Key)
* `nombre` (Varchar)

---

## 🛠️ Endpoints REST expuestos (Puerto 3005)

Todos los endpoints requieren la cabecera `Authorization: Bearer <token>`.

### 1. `GET /products`
Retorna el catálogo completo de productos mapeando `precio_base` hacia `precio_unitario` en el JSON resultante.

### 2. `GET /products/:id`
Busca un producto por su ID único (UUID v4) y retorna sus especificaciones completas (usado síncronamente por ms-sales).

### 3. `POST /products`
Registra un nuevo producto en el catálogo unificado de la corporación.
* **Cuerpo de la Petición (DTO: `CreateProductDto`)**:
  ```json
  {
    "nombre": "Aceite Fino 1Lt",
    "codigo_barras": "7771234567890",
    "precio_base": 12.50,
    "id_categoria": "5f3a0937-2cfc-4bf0-80d4-1a986c7b3370",
    "id_marca": "a1c49929-1065-4f36-96b6-f5ffb6a37885"
  }
  ```

### 4. `PUT /products/:id`
Actualiza parcialmente los datos de un producto (DTO: `UpdateProductDto`).

### 5. `DELETE /products/:id`
Remueve físicamente un producto del catálogo del ERP.

### 6. `GET /categories`
Retorna el listado de categorías disponibles.

---

## ⚙️ Configuración e Instalación

### Variables de Entorno (`.env`)
Configura el archivo en la raíz del microservicio:
```env
PORT=3005
JWT_SECRET=default-jwt-secret-key-erp-supermarket
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
SUPABASE_SCHEMA=product_db
```

### Ejecutar Localmente
```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run start:dev
```
