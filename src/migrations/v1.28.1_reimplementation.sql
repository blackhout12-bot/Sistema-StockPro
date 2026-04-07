-- =======================================================
-- SCRIPT DE REIMPLICACIÓN: v1.28.1-fixed
-- Objetivo: Activar/Desactivar módulos por plan de suscripción.
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
        roles_permitidos_json NVARCHAR(MAX) NULL -- JSON con roles permitidos por el plan
    );
END
GO

-- 2. Crear Tabla ModulosActivos (Para overrides manuales por empresa)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ModulosActivos')
BEGIN
    CREATE TABLE ModulosActivos (
        empresa_id INT NOT NULL,
        modulo_id NVARCHAR(100) NOT NULL,
        activo BIT DEFAULT 1,
        PRIMARY KEY (empresa_id, modulo_id),
        CONSTRAINT FK_ModulosActivos_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
END
GO

-- 3. Vincular Empresa a Planes
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Empresa' AND COLUMN_NAME = 'plan_id')
BEGIN
    ALTER TABLE Empresa ADD plan_id INT NULL;
END
GO

-- 4. Seed de Planes (Según Requerimiento v1.28.1-fixed)
SET IDENTITY_INSERT Planes ON;

-- Plan Retail Básico: Inventario, Facturación, POS
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 1)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (1, 'Retail Básico', 'Inventario, Facturación y POS', 
    '{"productos":true,"categorias":true,"movimientos":true,"facturacion":true,"pos":true,"clientes":true,"dashboard":true,"notificaciones":true}');
END

-- Plan Logística Avanzada: Flotas, Rutas, Depósitos, Auditoría
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 2)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (2, 'Logística Avanzada', 'Gestión de flotas, rutas, depósitos y auditoría', 
    '{"sucursales":true,"proveedores":true,"auditoria":true,"depositos":true,"flotas":true,"rutas":true,"movimientos":true,"productos":true,"dashboard":true}');
END

-- Plan Manufactura Pro: Producción (MRP), Calidad, Órdenes de trabajo
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 3)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (3, 'Manufactura Pro', 'Producción (MRP), Calidad y Órdenes de trabajo', 
    '{"produccion":true,"calidad":true,"ordenes_trabajo":true,"kardex":true,"productos":true,"categorias":true,"movimientos":true,"dashboard":true}');
END

-- Plan Servicios Premium: Contratos, Agenda, Tickets, SLA
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 4)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (4, 'Servicios Premium', 'Contratos, Agenda, Tickets y SLA', 
    '{"contratos":true,"agenda":true,"tickets":true,"sla":true,"clientes":true,"dashboard":true}');
END

-- Plan Full Enterprise: Todos los módulos
IF NOT EXISTS (SELECT 1 FROM Planes WHERE id = 5)
BEGIN
    INSERT INTO Planes (id, nombre, descripcion, modulos_json)
    VALUES (5, 'Full Enterprise', 'Acceso total a todos los módulos', '{"*":true}');
END

SET IDENTITY_INSERT Planes OFF;
GO

-- 5. Asignar Plan 1 (Retail) por defecto a todas las empresas
UPDATE Empresa SET plan_id = 1 WHERE plan_id IS NULL;
ALTER TABLE Empresa ALTER COLUMN plan_id INT NOT NULL;
GO

PRINT 'Migración v1.28.1-fixed (Planes) completada.';
