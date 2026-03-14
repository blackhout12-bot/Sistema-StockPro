-- ======================================================================
-- MIGRACIÓN 011: Facturación Extendida
-- Agrega columnas para soportar múltiples tipos de comprobantes y métodos de pago
-- ======================================================================

USE StockDB;
GO

-- 1. Agregar columnas a Facturas para trazabilidad del tipo y método de pago
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Facturas') AND name = 'tipo_comprobante')
BEGIN
    ALTER TABLE dbo.Facturas ADD tipo_comprobante NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Facturas') AND name = 'metodo_pago')
BEGIN
    ALTER TABLE dbo.Facturas ADD metodo_pago NVARCHAR(50) DEFAULT 'Efectivo';
END
GO

-- 2. Asegurar que las columnas de snapshot existan (por si acaso quedaron pendientes)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Facturas') AND name = 'cliente_nombre_snapshot')
BEGIN
    ALTER TABLE dbo.Facturas ADD 
        cliente_nombre_snapshot NVARCHAR(150) NULL,
        cliente_doc_snapshot NVARCHAR(50) NULL,
        vendedor_nombre_snapshot NVARCHAR(150) NULL,
        empresa_nombre_snapshot NVARCHAR(150) NULL,
        empresa_nit_snapshot NVARCHAR(50) NULL,
        empresa_direccion_snapshot NVARCHAR(255) NULL,
        empresa_telefono_snapshot NVARCHAR(50) NULL;
END
GO

PRINT 'Migración 011 aplicada correctamente: Facturación extendida activa.';
