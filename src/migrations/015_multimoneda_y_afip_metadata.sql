-- src/migrations/015_multimoneda_y_afip_metadata.sql
-- Objetivo: Soporte para múltiples divisas y preparación para Facturación Electrónica (AFIP)

USE StockDB;
GO

-- 1. Tabla de Monedas
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Monedas')
BEGIN
    CREATE TABLE Monedas (
        id NVARCHAR(3) PRIMARY KEY, -- 'ARS', 'USD', 'EUR', etc.
        nombre NVARCHAR(50) NOT NULL,
        simbolo NVARCHAR(10) NOT NULL,
        es_base BIT DEFAULT 0, -- La moneda local (ej: ARS en Argentina)
        activo BIT DEFAULT 1
    );

    INSERT INTO Monedas (id, nombre, simbolo, es_base) VALUES ('ARS', 'Peso Argentino', '$', 1);
    INSERT INTO Monedas (id, nombre, simbolo, es_base) VALUES ('USD', 'Dólar Estadounidense', 'U$D', 0);
    
    PRINT 'Tabla de Monedas creada y poblada.';
END
GO

-- 2. Actualización de Empresa (Configuración AFIP y Moneda Predeterminada)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Empresa' AND COLUMN_NAME = 'moneda_base_id')
BEGIN
    ALTER TABLE Empresa ADD moneda_base_id NVARCHAR(3) DEFAULT 'ARS';
    ALTER TABLE Empresa ADD CONSTRAINT FK_Empresa_Moneda FOREIGN KEY (moneda_base_id) REFERENCES Monedas(id);
    
    -- Campos AFIP (Metadata)
    ALTER TABLE Empresa ADD afip_cuit NVARCHAR(20);
    ALTER TABLE Empresa ADD afip_punto_venta INT;
    ALTER TABLE Empresa ADD afip_tipo_responsable NVARCHAR(50); -- Responsable Inscripto, Monotributo, etc.
    ALTER TABLE Empresa ADD afip_certificado_path NVARCHAR(1000);
    ALTER TABLE Empresa ADD afip_key_path NVARCHAR(1000);
    
    PRINT 'Campos de Moneda y AFIP añadidos a Empresa.';
END
GO

-- 3. Actualización de Productos (Precio en divisa específica)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Productos' AND COLUMN_NAME = 'moneda_id')
BEGIN
    ALTER TABLE Productos ADD moneda_id NVARCHAR(3) DEFAULT 'ARS';
    ALTER TABLE Productos ADD CONSTRAINT FK_Producto_Moneda FOREIGN KEY (moneda_id) REFERENCES Monedas(id);
    
    PRINT 'Productos actualizados con soporte Multimoneda.';
END
GO

-- 4. Actualización de Facturas (Manejar divisa y cotización histórica)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Facturas' AND COLUMN_NAME = 'moneda_id')
BEGIN
    ALTER TABLE Facturas ADD moneda_id NVARCHAR(3) DEFAULT 'ARS';
    ALTER TABLE Facturas ADD tipo_cambio DECIMAL(18,4) DEFAULT 1.0; -- Cotización al momento de facturar
    ALTER TABLE Facturas ADD afip_cae NVARCHAR(20); -- Código de Autorización Electrónico
    ALTER TABLE Facturas ADD afip_cae_vto DATE; -- Vencimiento CAE
    
    ALTER TABLE Facturas ADD CONSTRAINT FK_Factura_Moneda FOREIGN KEY (moneda_id) REFERENCES Monedas(id);
    
    PRINT 'Facturas actualizadas con soporte Multimoneda y campos AFIP.';
END
GO
