# 🏢 Company Service (ms-company)

Este es el microservicio de administración corporativa (**Company Service**) de la plataforma distribuida de supermercados **"OXXO Bolivia"**. Está construido utilizando **NestJS**, **TypeScript** y el SDK oficial de **Supabase** para interactuar con la base de datos aislada.

---

## 🚀 Reglas Arquitectónicas e Integración

1. **Base de Datos Aislada**: Las consultas apuntan estrictamente al esquema `company_db` (o `public` según configuración) de Supabase utilizando `@supabase/supabase-js`. Está prohibida la comunicación con tablas de otros servicios.
2. **Seguridad**: Todos los endpoints REST están protegidos por el guardián de autorización [JwtAuthGuard](file:///Users/jafetquiroga/arquitectura_software/practica3/microservices/ms-company/src/branch/guards/jwt-auth.guard.ts) que valida los tokens portadores del cliente.
3. **Rol en la Defensa**: Permite crear la compañía corporativa principal y definir los puntos geográficos de las sucursales donde se venderá y transferirá mercadería (Pasos 1 y 2 del flujo de defensa).

---

## 📊 Estructura de Base de Datos

El servicio interactúa con las siguientes tablas dentro de la base de datos:

### 1. Tabla `companias`
* `id_compania` (UUID, Primary Key)
* `nombre` (Varchar)

### 2. Tabla `ciudades`
* `id_ciudad` (UUID, Primary Key)
* `nombre` (Varchar)

### 3. Tabla `sucursales`
* `id_sucursal` (UUID, Primary Key)
* `id_compania` (UUID, Foreign Key)
* `id_ciudad` (UUID, Foreign Key)
* `nombre` (Varchar)
* `direccion` (Varchar)

---

## 🛠️ Endpoints REST expuestos (Puerto 3006)

Todos los endpoints requieren un token JWT válido en la cabecera `Authorization: Bearer <token>`.

### 1. `GET /companies`
Retorna el listado de compañías registradas en el sistema.

### 2. `GET /cities`
Retorna el listado de ciudades operativas.

### 3. `GET /branches`
Retorna la lista de todas las sucursales registradas a nivel nacional.

### 4. `POST /branches`
Crea una nueva sucursal asignada a una compañía y a una ciudad.
* **Cuerpo de la Petición (DTO: `CreateBranchDto`)**:
  ```json
  {
    "id_compania": "a1c49929-1065-4f36-96b6-f5ffb6a37885",
    "id_ciudad": "5f3a0937-2cfc-4bf0-80d4-1a986c7b3370",
    "nombre": "Sucursal Prado",
    "direccion": "Av. 16 de Julio (El Prado), La Paz"
  }
  ```

### 5. `PUT /branches/:id`
Actualiza parcialmente los datos de una sucursal existente.
* **Parámetro**: `:id` (UUID v4 de la sucursal).
* **Cuerpo de la Petición (DTO: `UpdateBranchDto`)**:
  ```json
  {
    "nombre": "Sucursal Prado Renovada",
    "direccion": "Av. 16 de Julio Nro 123, La Paz"
  }
  ```

---

## ⚙️ Configuración e Instalación

### Variables de Entorno (`.env`)
Configura las variables de conexión en la raíz del microservicio:
```env
PORT=3006
JWT_SECRET=default-jwt-secret-key-erp-supermarket
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-o-anon-key
SUPABASE_SCHEMA=company_db
```

### Ejecutar Localmente
```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run start:dev

# Compilación y producción
npm run build
npm run start:prod
```
