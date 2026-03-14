-- =======================================================
-- MIGRACIÓN: SNAPSHOTS DE AUDITORÍA PARA FACTURACIÓN
-- Objetivo: Almacenar datos críticos (Nombres, Documentos) 
-- permanentemente para evitar cambios históricos si el 
-- maestro original cambia.
-- =======================================================

USE StockDB;
GO

-- 1. Agregar columnas de Snapshot a Facturas (Cabecera)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Facturas' AND COLUMN_NAME = 'cliente_nombre_snapshot')
BEGIN
    ALTER TABLE Facturas ADD 
        cliente_nombre_snapshot VARCHAR(100),
        cliente_doc_snapshot VARCHAR(50),
        vendedor_nombre_snapshot VARCHAR(100),
        empresa_nombre_snapshot VARCHAR(100),
        empresa_nit_snapshot VARCHAR(50),
        empresa_direccion_snapshot VARCHAR(255),
        empresa_telefono_snapshot VARCHAR(50);
    PRINT 'Columnas de snapshot agregadas a la tabla Facturas.';
END
GO

-- 2. Agregar columna de Snapshot a Detalle_Facturas (Líneas)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Detalle_Facturas' AND COLUMN_NAME = 'producto_nombre_snapshot')
BEGIN
    ALTER TABLE Detalle_Facturas ADD 
        producto_nombre_snapshot VARCHAR(150);
    PRINT 'Columna producto_nombre_snapshot agregada a Detalle_Facturas.';
END
GO

-- 3. (Opcional) Poblar datos retroactivamente para facturas existentes
-- Solo si es necesario para consistencia en desarrollo
UPDATE f
SET f.cliente_nombre_snapshot = c.nombre,
    f.cliente_doc_snapshot = c.documento_identidad,
    f.vendedor_nombre_snapshot = u.nombre,
    f.empresa_nombre_snapshot = e.nombre,
    f.empresa_nit_snapshot = e.documento_identidad
FROM Facturas f
JOIN Clientes c ON f.cliente_id = c.id
JOIN Usuarios u ON f.usuario_id = u.id
JOIN Empresa e ON f.empresa_id = e.id
WHERE f.cliente_nombre_snapshot IS NULL;

UPDATE df
SET df.producto_nombre_snapshot = p.nombre
FROM Detalle_Facturas df
JOIN Productos p ON df.producto_id = p.id
WHERE df.producto_nombre_snapshot IS NULL;

PRINT 'Migración Senior Invoicing finalizada.';
