-- SCHEMA COMPANY --

CREATE TABLE company_db.companias (
                                      nombre character varying NOT NULL,
                                      id_compania uuid NOT NULL DEFAULT gen_random_uuid(),
                                      CONSTRAINT companias_pkey PRIMARY KEY (id_compania)
);
CREATE TABLE company_db.ciudades (
                                     nombre character varying NOT NULL,
                                     id_ciudad uuid NOT NULL DEFAULT gen_random_uuid(),
                                     CONSTRAINT ciudades_pkey PRIMARY KEY (id_ciudad)
);
CREATE TABLE company_db.sucursales (
                                       id_compania uuid,
                                       id_ciudad uuid,
                                       nombre character varying NOT NULL,
                                       direccion character varying,
                                       id_sucursal uuid NOT NULL DEFAULT gen_random_uuid(),
                                       CONSTRAINT sucursales_pkey PRIMARY KEY (id_sucursal),
                                       CONSTRAINT sucursales_id_compania_fkey FOREIGN KEY (id_compania) REFERENCES company_db.companias(id_compania),
                                       CONSTRAINT sucursales_id_ciudad_fkey FOREIGN KEY (id_ciudad) REFERENCES company_db.ciudades(id_ciudad)
);

-- SCHEMA CUSTOMER --

CREATE TABLE customer_db.clientes (
                                      nombre text NOT NULL,
                                      ci text NOT NULL UNIQUE,
                                      email text,
                                      telefono text,
                                      id uuid NOT NULL DEFAULT gen_random_uuid(),
                                      estado text DEFAULT 'ACTIVO'::text,
                                      puntos integer DEFAULT 0,
                                      CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE customer_db.historial_puntos (
                                              id_cliente uuid NOT NULL,
                                              puntos integer NOT NULL,
                                              motivo text,
                                              id uuid NOT NULL DEFAULT gen_random_uuid(),
                                              fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                                              CONSTRAINT historial_puntos_pkey PRIMARY KEY (id)
);

-- SCHEMA INVENTORY --

CREATE TABLE inventory_db.kardex_movimientos (
                                                 id_producto uuid NOT NULL,
                                                 id_sucursal_origen uuid,
                                                 id_sucursal_destino uuid,
                                                 tipo_movimiento character varying NOT NULL,
                                                 cantidad numeric NOT NULL,
                                                 observacion text,
                                                 id_movimiento uuid NOT NULL DEFAULT gen_random_uuid(),
                                                 fecha_movimiento timestamp with time zone DEFAULT now(),
                                                 CONSTRAINT kardex_movimientos_pkey PRIMARY KEY (id_movimiento)
);
CREATE TABLE inventory_db.stock_sucursal (
                                             id_sucursal uuid NOT NULL,
                                             id_producto uuid NOT NULL,
                                             id_stock uuid NOT NULL DEFAULT gen_random_uuid(),
                                             cantidad numeric NOT NULL DEFAULT 0.00,
                                             CONSTRAINT stock_sucursal_pkey PRIMARY KEY (id_stock)
);
CREATE TABLE inventory_db.kardex (
                                     id_sucursal uuid NOT NULL,
                                     id_producto uuid NOT NULL,
                                     tipo_movimiento text NOT NULL,
                                     cantidad numeric NOT NULL,
                                     motivo text,
                                     id_kardex uuid NOT NULL DEFAULT gen_random_uuid(),
                                     fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT kardex_pkey PRIMARY KEY (id_kardex)
);

-- SCHEMA PRODUCT --

CREATE TABLE inventory_db.kardex_movimientos (
                                                 id_producto uuid NOT NULL,
                                                 id_sucursal_origen uuid,
                                                 id_sucursal_destino uuid,
                                                 tipo_movimiento character varying NOT NULL,
                                                 cantidad numeric NOT NULL,
                                                 observacion text,
                                                 id_movimiento uuid NOT NULL DEFAULT gen_random_uuid(),
                                                 fecha_movimiento timestamp with time zone DEFAULT now(),
                                                 CONSTRAINT kardex_movimientos_pkey PRIMARY KEY (id_movimiento)
);
CREATE TABLE inventory_db.stock_sucursal (
                                             id_sucursal uuid NOT NULL,
                                             id_producto uuid NOT NULL,
                                             id_stock uuid NOT NULL DEFAULT gen_random_uuid(),
                                             cantidad numeric NOT NULL DEFAULT 0.00,
                                             CONSTRAINT stock_sucursal_pkey PRIMARY KEY (id_stock)
);
CREATE TABLE inventory_db.kardex (
                                     id_sucursal uuid NOT NULL,
                                     id_producto uuid NOT NULL,
                                     tipo_movimiento text NOT NULL,
                                     cantidad numeric NOT NULL,
                                     motivo text,
                                     id_kardex uuid NOT NULL DEFAULT gen_random_uuid(),
                                     fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT kardex_pkey PRIMARY KEY (id_kardex)
);

-- SCHEMA SALES --

CREATE TABLE inventory_db.kardex_movimientos (
                                                 id_producto uuid NOT NULL,
                                                 id_sucursal_origen uuid,
                                                 id_sucursal_destino uuid,
                                                 tipo_movimiento character varying NOT NULL,
                                                 cantidad numeric NOT NULL,
                                                 observacion text,
                                                 id_movimiento uuid NOT NULL DEFAULT gen_random_uuid(),
                                                 fecha_movimiento timestamp with time zone DEFAULT now(),
                                                 CONSTRAINT kardex_movimientos_pkey PRIMARY KEY (id_movimiento)
);
CREATE TABLE inventory_db.stock_sucursal (
                                             id_sucursal uuid NOT NULL,
                                             id_producto uuid NOT NULL,
                                             id_stock uuid NOT NULL DEFAULT gen_random_uuid(),
                                             cantidad numeric NOT NULL DEFAULT 0.00,
                                             CONSTRAINT stock_sucursal_pkey PRIMARY KEY (id_stock)
);
CREATE TABLE inventory_db.kardex (
                                     id_sucursal uuid NOT NULL,
                                     id_producto uuid NOT NULL,
                                     tipo_movimiento text NOT NULL,
                                     cantidad numeric NOT NULL,
                                     motivo text,
                                     id_kardex uuid NOT NULL DEFAULT gen_random_uuid(),
                                     fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                                     CONSTRAINT kardex_pkey PRIMARY KEY (id_kardex)
);

-- SCHEMA NOTIFICATION --

CREATE TABLE notification_db.registros_notificacion (
                                                        id_venta uuid NOT NULL,
                                                        id_cliente uuid NOT NULL,
                                                        tipo text NOT NULL,
                                                        destinatario text NOT NULL,
                                                        mensaje text NOT NULL,
                                                        estado text NOT NULL,
                                                        id uuid NOT NULL DEFAULT gen_random_uuid(),
                                                        fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                                                        CONSTRAINT registros_notificacion_pkey PRIMARY KEY (id)
);