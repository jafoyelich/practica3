# 🚀 Guía de Ejecución Sin Docker - ERP SuperMarket Bolivia S.A.

Esta guía está diseñada para los miembros del equipo que tengan problemas técnicos con Docker o Docker Desktop en sus computadoras locales. Es totalmente posible ejecutar toda la plataforma de microservicios y el frontend de forma nativa sin depender de Docker.

Para lograrlo, la base de datos (Supabase) ya corre en la nube, por lo que solo necesitamos resolver dos dependencias de infraestructura locales:
1. **RabbitMQ** (Broker de mensajería para eventos distribuidos).
2. **Redis** (Motor de caché para existencias).

A continuación se presentan las dos alternativas disponibles: **Opción A (Instalación Local)** y **Opción B (Servicios en la Nube - Recomendada para evitar instalaciones)**.

---

## ☁️ Opción A: Servicios en la Nube (Recomendada - Cero Instalación)

Esta es la forma más rápida y limpia, ya que evita tener que compilar o configurar servidores en tu máquina local. Utilizaremos proveedores con capas gratuitas generosas.

### 1. RabbitMQ en la Nube (CloudAMQP)
1. Entra a [CloudAMQP](https://www.cloudamqp.com/) y crea una cuenta gratuita.
2. Crea una nueva instancia de base de datos seleccionando el plan gratuito **"Little Lemur"** (disponible en AWS u otros servidores).
3. Una vez creada la instancia, ve a los detalles y copia la **URL de conexión** (comienza con `amqps://...`).
4. Reemplaza la variable `RABBITMQ_URL` en todos los archivos `.env` de los microservicios con esta URL. Por ejemplo:
   ```env
   RABBITMQ_URL=amqps://usuario:password@hostname.rmq.cloudamqp.com/vhost
   ```

### 2. Redis en la Nube (Upstash)
1. Entra a [Upstash](https://upstash.com/) y crea una cuenta gratuita.
2. Crea una base de datos Redis en la región más cercana a ti.
3. Copia el **Host**, **Puerto** y **Contraseña** proporcionados en la consola.
4. Configura el `.env` de `ms-inventory` con estas variables remotas:
   ```env
   REDIS_HOST=tu-servidor-remoto.upstash.io
   REDIS_PORT=37999 (puerto provisto)
   # (Si el microservicio requiere contraseña, agrégala en la variable correspondiente)
   ```

---

## 💻 Opción B: Instalación de Dependencias Locales

Si prefieres tener el entorno corriendo en tu propia computadora local de forma nativa:

### 🍎 En macOS (Usando Homebrew)
1. Instala **Redis**:
   ```bash
   brew install redis
   brew services start redis
   ```
2. Instala **RabbitMQ**:
   ```bash
   brew install rabbitmq
   # Agrega la ruta de ejecutables a tu terminal si brew te lo solicita
   brew services start rabbitmq
   ```

### 🐧 En Linux (Ubuntu/Debian)
1. Instala **Redis**:
   ```bash
   sudo apt update
   sudo apt install redis-server -y
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```
2. Instala **RabbitMQ**:
   ```bash
   sudo apt install rabbitmq-server -y
   sudo systemctl start rabbitmq-server
   sudo systemctl enable rabbitmq-server
   ```

### 🪟 En Windows
1. **Redis**:
   - Se recomienda instalarlo mediante **WSL (Ubuntu para Windows)** ejecutando en tu terminal de WSL:
     ```bash
     sudo apt update
     sudo apt install redis-server -y
     sudo service redis-server start
     ```
   - O bien descargar el instalador gráfico alternativo para Windows como [Memurai](https://www.memurai.com/) o los puertos antiguos de Redis de Microsoft Archive.
2. **RabbitMQ**:
   - Descarga e instala primero la máquina virtual de [Erlang/OTP (versión recomendada por RabbitMQ)](https://www.erlang.org/downloads).
   - Descarga y ejecuta el instalador oficial de [RabbitMQ para Windows](https://www.rabbitmq.com/install-windows.html).
   - Se levantará automáticamente como un servicio de Windows en segundo plano.

---

## 🏃‍♂️ Configuración y Arranque del Monorepo

Una vez que tengas RabbitMQ y Redis iniciados (ya sea de forma local o en la nube), el proceso de arranque es el siguiente:

### Paso 1: Instalar dependencias en la raíz
Ubícate en la raíz del proyecto y ejecuta:
```bash
npm install
```

### Paso 2: Crear los archivos `.env`
Asegúrate de copiar el `.env.example` a `.env` en cada una de las siguientes carpetas y configurar las variables correspondientes (especialmente la URL de RabbitMQ y las credenciales de Supabase):
* `microservices/ms-gateway/.env`
* `microservices/ms-company/.env`
* `microservices/ms-customer/.env`
* `microservices/ms-inventory/.env`
* `microservices/ms-notification/.env`
* `microservices/ms-product/.env`
* `microservices/ms-sales/.env`
* `apps/web-admin/.env`

### Paso 3: Arrancar el ERP
En lugar del comando que levanta Docker, iniciaremos directamente la ejecución concurrente de los procesos de Node.js. 

En la terminal de la raíz del proyecto, ejecuta:
```bash
# Inicia todos los microservicios y el frontend de manera simultánea en tu local
npm run start:gateway & npm run start:sales & npm run start:customer & npm run start:inventory & npm run start:product & npm run start:notification & npm run start:company & npm run start:frontend
```

*(O de forma más sencilla si tu consola soporta el script raíz modificado):*
```bash
# Ejecutar concurrentemente todos los servicios nativos
npx concurrently -k -p "[{name}]" -n "GATEWAY,SALES,CUSTOMER,INVENTORY,PRODUCT,NOTIFICATION,COMPANY,FRONTEND" -c "magenta,cyan,blue,green,yellow,red,gray,white" "npm run start:gateway" "npm run start:sales" "npm run start:customer" "npm run start:inventory" "npm run start:product" "npm run start:notification" "npm run start:company" "npm run start:frontend"
```

El panel administrativo estará disponible en [http://localhost:4000](http://localhost:4000) y el API Gateway en el puerto `3000`.
