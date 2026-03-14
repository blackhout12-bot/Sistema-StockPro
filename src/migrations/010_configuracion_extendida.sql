-- src/migrations/010_configuracion_extendida.sql

-- Agregar columnas faltantes a la tabla Empresa para configuración extendida
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'regional_formato_hora')
    ALTER TABLE dbo.Empresa ADD regional_formato_hora NVARCHAR(20) DEFAULT '24h';
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'config_condicion_fiscal')
    ALTER TABLE dbo.Empresa ADD config_condicion_fiscal NVARCHAR(100);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'config_percepciones_json')
    ALTER TABLE dbo.Empresa ADD config_percepciones_json NVARCHAR(MAX);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'config_retenciones_json')
    ALTER TABLE dbo.Empresa ADD config_retenciones_json NVARCHAR(MAX);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'comp_plantilla_json')
    ALTER TABLE dbo.Empresa ADD comp_plantilla_json NVARCHAR(MAX);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'int_ecommerce_url')
    ALTER TABLE dbo.Empresa ADD int_ecommerce_url NVARCHAR(500);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'int_ecommerce_secret')
    ALTER TABLE dbo.Empresa ADD int_ecommerce_secret NVARCHAR(500);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'int_erp_key')
    ALTER TABLE dbo.Empresa ADD int_erp_key NVARCHAR(500);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'dash_widgets_visibles')
    ALTER TABLE dbo.Empresa ADD dash_widgets_visibles NVARCHAR(MAX) DEFAULT '[]';
GO
-- Asegurar que las columnas existentes tengan valores por defecto si es necesario
UPDATE dbo.Empresa SET regional_formato_hora = '24h' WHERE regional_formato_hora IS NULL;
UPDATE dbo.Empresa SET dash_widgets_visibles = '[]' WHERE dash_widgets_visibles IS NULL;
UPDATE dbo.Empresa SET dash_kpis_visibles = '["total_productos", "stock_bajo", "valor_inventario", "ventas_mes"]' WHERE dash_kpis_visibles IS NULL;
GO
