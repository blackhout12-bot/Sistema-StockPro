-- =======================================================
-- SCRIPT DE MIGRACIÓN: FASE 6 (MULTI-TENANT SAAS)
-- Objetivo: Aislar la información (Usuarios, Clientes, 
-- Productos, etc.) vinculándolos estrictamente a una "Empresa".
-- Instrucciones: Ejecutar este script DENTRO de SSMS.
-- =======================================================

USE StockDB;
GO

-- 1. Asegurar que exista al menos una Empresa para recibir datos huérfanos
IF NOT EXISTS (SELECT 1 FROM Empresa WHERE id = 1)
BEGIN
    INSERT INTO Empresa (nombre, documento_identidad) 
    VALUES ('Mi Empresa Global', '000000000-0');
    PRINT 'Empresa por defecto (ID=1) creada para albergar datos existentes.';
END
GO

-- 2. Modificar Usuarios
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Usuarios' AND COLUMN_NAME = 'empresa_id')
BEGIN
    -- Agregar la columna aceptando nulos temporalmente
    ALTER TABLE Usuarios ADD empresa_id INT;
    
    -- Asignar todos los usuarios existentes a la Empresa 1
    EXEC('UPDATE Usuarios SET empresa_id = 1');
    
    -- Hacer la columna obligatoria y agregar la llave foránea
    EXEC('ALTER TABLE Usuarios ALTER COLUMN empresa_id INT NOT NULL');
    EXEC('ALTER TABLE Usuarios ADD CONSTRAINT FK_Usuario_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)');
    
    PRINT 'Tabla Usuarios alterada hacia esquema Multi-Tenant.';
END
GO

-- 3. Modificar Productos
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Productos' AND COLUMN_NAME = 'empresa_id')
BEGIN
    ALTER TABLE Productos ADD empresa_id INT;
    EXEC('UPDATE Productos SET empresa_id = 1');
    EXEC('ALTER TABLE Productos ALTER COLUMN empresa_id INT NOT NULL');
    EXEC('ALTER TABLE Productos ADD CONSTRAINT FK_Producto_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)');
    PRINT 'Tabla Productos alterada hacia esquema Multi-Tenant.';
END
GO

-- 4. Modificar Clientes
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'empresa_id')
BEGIN
    ALTER TABLE Clientes ADD empresa_id INT;
    EXEC('UPDATE Clientes SET empresa_id = 1');
    EXEC('ALTER TABLE Clientes ALTER COLUMN empresa_id INT NOT NULL');
    EXEC('ALTER TABLE Clientes ADD CONSTRAINT FK_Cliente_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)');
    PRINT 'Tabla Clientes alterada hacia esquema Multi-Tenant.';
END
GO

-- 5. Modificar Facturas (Solo Facturas. Detalle_Facturas pertenece recursivamente a su factura)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Facturas' AND COLUMN_NAME = 'empresa_id')
BEGIN
    ALTER TABLE Facturas ADD empresa_id INT;
    EXEC('UPDATE Facturas SET empresa_id = 1');
    EXEC('ALTER TABLE Facturas ALTER COLUMN empresa_id INT NOT NULL');
    EXEC('ALTER TABLE Facturas ADD CONSTRAINT FK_Factura_Tenant_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)');
    PRINT 'Tabla Facturas alterada hacia esquema Multi-Tenant.';
END
GO

-- 6. Modificar Movimientos (Historial de stock)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Movimientos' AND COLUMN_NAME = 'empresa_id')
BEGIN
    ALTER TABLE Movimientos ADD empresa_id INT;
    EXEC('UPDATE Movimientos SET empresa_id = 1');
    EXEC('ALTER TABLE Movimientos ALTER COLUMN empresa_id INT NOT NULL');
    EXEC('ALTER TABLE Movimientos ADD CONSTRAINT FK_Movimiento_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)');
    PRINT 'Tabla Movimientos alterada hacia esquema Multi-Tenant.';
END
GO

PRINT '==================================================';
PRINT 'MIGRACIÓN MULTI-TENANT FINALIZADA CON ÉXITO.';
PRINT 'Toda la data ahora pertenece a Empresa ID 1.';
PRINT '==================================================';
