-- SQL MIGRATION FOR MANUAL EXECUTION (ADMIN)
-- Copy and run this in SQL Server Management Studio (SSMS) or your preferred SQL tool.

USE StockDB;
GO

-- 1. Table: Productos
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'sku')
    ALTER TABLE dbo.Productos ADD sku NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'stock_min')
    ALTER TABLE dbo.Productos ADD stock_min INT DEFAULT 0;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'stock_max')
    ALTER TABLE dbo.Productos ADD stock_max INT NULL;
GO

-- 2. Table: Movimientos
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Movimientos') AND name = 'nro_lote')
    ALTER TABLE dbo.Movimientos ADD nro_lote NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Movimientos') AND name = 'fecha_vto')
    ALTER TABLE dbo.Movimientos ADD fecha_vto DATE NULL;
GO

-- 3. Table: Facturas (Snapshots + Extended info)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Facturas') AND name = 'tipo_comprobante')
    ALTER TABLE dbo.Facturas ADD tipo_comprobante NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Facturas') AND name = 'metodo_pago')
    ALTER TABLE dbo.Facturas ADD metodo_pago NVARCHAR(50) DEFAULT 'Efectivo';
GO
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

-- 4. Table: Detalle_Facturas
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Detalle_Facturas') AND name = 'producto_nombre_snapshot')
    ALTER TABLE dbo.Detalle_Facturas ADD producto_nombre_snapshot NVARCHAR(150) NULL;
GO

PRINT 'Schema manually fixed successfully.';
