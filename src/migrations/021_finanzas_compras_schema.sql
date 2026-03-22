-- Migración para los módulos de Proveedores, Compras, Cuentas por Pagar, Cuentas por Cobrar y Kardex

-- 1. Tabla Proveedores
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Proveedores' and xtype='U')
BEGIN
    CREATE TABLE Proveedores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        razon_social NVARCHAR(200) NOT NULL,
        cuit NVARCHAR(50),
        condicion_fiscal NVARCHAR(50),
        email NVARCHAR(100),
        telefono NVARCHAR(50),
        direccion NVARCHAR(200),
        estado NVARCHAR(50) DEFAULT 'ACTIVO',
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE(),
        -- Asumiendo que la tabla Empresa existe para la clave foránea
        CONSTRAINT FK_Proveedores_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
END

-- 2. Tabla Compras
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Compras' and xtype='U')
BEGIN
    CREATE TABLE Compras (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        proveedor_id INT NOT NULL,
        numero_comprobante NVARCHAR(100) NOT NULL,
        tipo_comprobante NVARCHAR(50) NOT NULL,
        fecha_compra DATETIME NOT NULL,
        subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
        impuestos DECIMAL(18,2) NOT NULL DEFAULT 0,
        total DECIMAL(18,2) NOT NULL DEFAULT 0,
        estado NVARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, COMPLETADA, CANCELADA
        creado_en DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Compras_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_Compras_Proveedor FOREIGN KEY (proveedor_id) REFERENCES Proveedores(id)
    );
END

-- 3. Tabla Compras_Detalle
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Compras_Detalle' and xtype='U')
BEGIN
    CREATE TABLE Compras_Detalle (
        id INT IDENTITY(1,1) PRIMARY KEY,
        compra_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad DECIMAL(18,2) NOT NULL,
        precio_unitario DECIMAL(18,2) NOT NULL,
        subtotal DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_ComprasDetalle_Compra FOREIGN KEY (compra_id) REFERENCES Compras(id),
        CONSTRAINT FK_ComprasDetalle_Producto FOREIGN KEY (producto_id) REFERENCES Productos(id)
    );
END

-- 4. Tabla Cuentas_Pagar
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Cuentas_Pagar' and xtype='U')
BEGIN
    CREATE TABLE Cuentas_Pagar (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        proveedor_id INT NOT NULL,
        compra_id INT NULL,
        monto_adeudado DECIMAL(18,2) NOT NULL,
        monto_pagado DECIMAL(18,2) NOT NULL DEFAULT 0,
        fecha_vencimiento DATETIME NULL,
        estado NVARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, PARCIAL, PAGADA
        creado_en DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_CuentasPagar_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_CuentasPagar_Proveedor FOREIGN KEY (proveedor_id) REFERENCES Proveedores(id),
        CONSTRAINT FK_CuentasPagar_Compra FOREIGN KEY (compra_id) REFERENCES Compras(id)
    );
END

-- 5. Tabla Pagos (Pagos a Proveedores)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pagos' and xtype='U')
BEGIN
    CREATE TABLE Pagos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        proveedor_id INT NOT NULL,
        cuenta_pagar_id INT NOT NULL,
        monto_pagado DECIMAL(18,2) NOT NULL,
        fecha_pago DATETIME NOT NULL DEFAULT GETDATE(),
        metodo_pago NVARCHAR(50),
        referencia NVARCHAR(100),
        CONSTRAINT FK_Pagos_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_Pagos_Proveedor FOREIGN KEY (proveedor_id) REFERENCES Proveedores(id),
        CONSTRAINT FK_Pagos_CuentaPagar FOREIGN KEY (cuenta_pagar_id) REFERENCES Cuentas_Pagar(id)
    );
END

-- 6. Tabla Cuentas_Cobrar
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Cuentas_Cobrar' and xtype='U')
BEGIN
    CREATE TABLE Cuentas_Cobrar (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        cliente_id INT NOT NULL,
        factura_id INT NULL, -- Referencia a tabla Facturas (creada previamente)
        monto_adeudado DECIMAL(18,2) NOT NULL,
        monto_cobrado DECIMAL(18,2) NOT NULL DEFAULT 0,
        fecha_vencimiento DATETIME NULL,
        estado NVARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, PARCIAL, COBRADA
        creado_en DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_CuentasCobrar_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_CuentasCobrar_Cliente FOREIGN KEY (cliente_id) REFERENCES Clientes(id)
        -- Asumiendo tabla Clientes existe.
    );
END

-- 7. Tabla Cobros (Ingresos de Clientes)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Cobros' and xtype='U')
BEGIN
    CREATE TABLE Cobros (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        cliente_id INT NOT NULL,
        cuenta_cobrar_id INT NOT NULL,
        monto_cobrado DECIMAL(18,2) NOT NULL,
        fecha_cobro DATETIME NOT NULL DEFAULT GETDATE(),
        metodo_pago NVARCHAR(50),
        referencia NVARCHAR(100),
        CONSTRAINT FK_Cobros_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_Cobros_Cliente FOREIGN KEY (cliente_id) REFERENCES Clientes(id),
        CONSTRAINT FK_Cobros_CuentaCobrar FOREIGN KEY (cuenta_cobrar_id) REFERENCES Cuentas_Cobrar(id)
    );
END

-- 8. Tabla Kardex
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Kardex' and xtype='U')
BEGIN
    CREATE TABLE Kardex (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        producto_id INT NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        tipo_movimiento NVARCHAR(50) NOT NULL, -- ENTRADA, SALIDA
        origen NVARCHAR(50) NOT NULL, -- COMPRA, VENTA, AJUSTE, TRANSFERENCIA
        referencia_id INT NULL, -- ID de Compra o ID de Factura
        cantidad DECIMAL(18,2) NOT NULL,
        costo_unitario DECIMAL(18,2) NOT NULL DEFAULT 0,
        costo_total DECIMAL(18,2) NOT NULL DEFAULT 0,
        saldo_cantidad DECIMAL(18,2) NOT NULL,
        saldo_valorado DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_Kardex_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_Kardex_Producto FOREIGN KEY (producto_id) REFERENCES Productos(id)
    );
END
