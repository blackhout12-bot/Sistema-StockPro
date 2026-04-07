-- =======================================================
-- SCRIPT DE MIGRACIÓN: v1.28.1 (ACTIVACIÓN DE MÓDULOS POR PLAN)
-- Objetivo: Implementar lógica de planes para control de acceso dinámico.
-- =======================================================

USE StockDB;
GO

-- 1. Crear Tabla de Planes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Planes')
BEGIN
    CREATE TABLE Planes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL UNIQUE,
        descripcion NVARCHAR(500),
        modulos_json NVARCHAR(MAX) NOT NULL, -- JSON con { "facturacion": true, "productos": true, ... }
        activo BIT DEFAULT 1
    );
    PRINT 'Tabla Planes creada.';
END
GO

-- 2. Crear Tabla ModulosActivos (Para overrides por empresa — opcional pero solicitado)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ModulosActivos')
BEGIN
    CREATE TABLE ModulosActivos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        modulo_id NVARCHAR(100) NOT NULL,
        activo BIT DEFAULT 1,
        CONSTRAINT FK_ModulosActivos_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
    CREATE INDEX IX_ModulosActivos_Empresa ON ModulosActivos(empresa_id);
    PRINT 'Tabla ModulosActivos creada.';
END
GO

-- 3. Agregar plan_id a la Tabla Empresa
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Empresa' AND COLUMN_NAME = 'plan_id')
BEGIN
    ALTER TABLE Empresa ADD plan_id INT NULL;
    PRINT 'Columna plan_id agregada a Empresa.';
END
GO

-- 4. Seed de Planes Iniciales
SET IDENTITY_INSERT Planes ON;

-- Plan Retail Básico
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 1)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (1, 'Retail Básico', 'Inventario, Facturación y Punto de Venta (POS)', 
    '{"productos":true,"categorias":true,"movimientos":true,"facturacion":true,"pos":true,"clientes":true,"reportes":true,"dashboard":true,"notificaciones":true}');
END

-- Plan Logística Avanzada
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 2)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (2, 'Logística Avanzada', 'Gestión de flotas, rutas, depósitos y auditoría completa', 
    '{"productos":true,"categorias":true,"movimientos":true,"sucursales":true,"proveedores":true,"auditoria":true,"rutas":true,"flotas":true,"depositos":true,"reportes":true,"dashboard":true}');
END

-- Plan Manufactura Pro
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 3)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (3, 'Manufactura Pro', 'Producción (MRP), Calidad y Órdenes de Trabajo', 
    '{"productos":true,"categorias":true,"movimientos":true,"produccion":true,"calidad":true,"ordenes_trabajo":true,"kardex":true,"reportes":true,"dashboard":true}');
END

-- Plan Servicios Premium
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 4)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (4, 'Servicios Premium', 'Contratos, Agenda, Tickets y SLA', 
    '{"contratos":true,"agenda":true,"tickets":true,"sla":true,"clientes":true,"reportes":true,"dashboard":true}');
END

-- Plan Full Enterprise
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 5)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (5, 'Full Enterprise', 'Acceso total a todos los módulos y características', 
    '{"*":true}');
END

SET IDENTITY_INSERT Planes OFF;
GO

-- 5. Asignar Plan 1 (Retail Básico) a todas las empresas existentes por defecto
UPDATE Empresa SET plan_id = 1 WHERE plan_id IS NULL;
ALTER TABLE Empresa ALTER COLUMN plan_id INT NOT NULL;
ALTER TABLE Empresa ADD CONSTRAINT FK_Empresa_Plan FOREIGN KEY (plan_id) REFERENCES Planes(id);
GO

PRINT 'Migración v1.28.1 (Planes) finalizada con éxito.';
