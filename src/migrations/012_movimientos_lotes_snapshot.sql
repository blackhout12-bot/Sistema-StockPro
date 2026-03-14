-- Migration: 012_movimientos_lotes_snapshot
-- Descripción: Agrega columnas para snapshot de Lote y Vencimiento en Historial de Movimientos

USE StockDB;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Movimientos') AND name = 'nro_lote')
BEGIN
    ALTER TABLE dbo.Movimientos ADD nro_lote NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Movimientos') AND name = 'fecha_vto')
BEGIN
    ALTER TABLE dbo.Movimientos ADD fecha_vto DATE NULL;
END
GO

PRINT 'Migración 012 aplicada: Movimientos ahora soportan snapshot de lote y vencimiento.';
