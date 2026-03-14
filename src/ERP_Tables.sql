-- =======================================================
-- SCRIPT DE MIGRACIÓN: FASE 5 (ERP EXPANSION)
-- Modulos: Empresa, Clientes, Facturación
-- Instrucciones: Ejecutar este script usando un administrador
-- o el usuario 'sa' en SQL Server Management Studio (SSMS)
-- =======================================================

USE StockDB;
GO

-- 1. Crear Tabla Empresa
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Empresa' and xtype='U')
BEGIN
    CREATE TABLE Empresa (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        documento_identidad VARCHAR(50) NOT NULL,
        direccion VARCHAR(255),
        telefono VARCHAR(50),
        email VARCHAR(100)
    );
    
    INSERT INTO Empresa (nombre, documento_identidad, direccion, telefono, email) 
    VALUES ('Mi Empresa S.A.', '123456789-0', 'Calle Principal 123', '+56 9 1234 5678', 'contacto@miempresa.com');

    PRINT 'Tabla Empresa creada y poblada.';
END
GO

-- 2. Crear Tabla Clientes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' and xtype='U')
BEGIN
    CREATE TABLE Clientes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        documento_identidad VARCHAR(50) NOT NULL,
        email VARCHAR(100),
        telefono VARCHAR(50),
        direccion VARCHAR(255),
        fecha_creacion DATETIME DEFAULT GETDATE()
    );

    PRINT 'Tabla Clientes creada.';
END
GO

-- 3. Crear Tabla Facturas (Cabecera)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Facturas' and xtype='U')
BEGIN
    CREATE TABLE Facturas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nro_factura VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INT NOT NULL,
        usuario_id INT NOT NULL,  -- Vendedor
        fecha_emision DATETIME DEFAULT GETDATE(),
        total DECIMAL(10,2) NOT NULL,
        estado VARCHAR(20) DEFAULT 'Emitida', -- Emitida, Anulada
        
        CONSTRAINT FK_Factura_Cliente FOREIGN KEY (cliente_id) REFERENCES Clientes(id),
        CONSTRAINT FK_Factura_Usuario FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
    );

    PRINT 'Tabla Facturas creada.';
END
GO

-- 4. Crear Tabla Detalle_Facturas (Líneas)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Detalle_Facturas' and xtype='U')
BEGIN
    CREATE TABLE Detalle_Facturas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        factura_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,

        CONSTRAINT FK_Detalle_Factura FOREIGN KEY (factura_id) REFERENCES Facturas(id),
        CONSTRAINT FK_Detalle_Producto FOREIGN KEY (producto_id) REFERENCES Productos(id)
    );

    PRINT 'Tabla Detalle_Facturas creada.';
END
GO
