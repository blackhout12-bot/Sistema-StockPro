-- ======================================================================
-- MIGRACIÓN 006: Configuración de Empresa Extendida (Roadmap Sección 9)
-- Inventario, Comprobantes, Regional, Branding, Integraciones y Dashboard
-- ======================================================================

USE StockDB;
GO

-- 1. Agregar columnas extendidas a la tabla Empresa (Sección 9)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'inv_stock_max_global')
BEGIN
    ALTER TABLE dbo.Empresa ADD 
        -- Inventario
        inv_stock_max_global INT NULL,
        inv_alertas_habilitadas BIT DEFAULT 1,
        inv_alertas_canal NVARCHAR(50) DEFAULT 'inapp', -- 'email', 'inapp', 'both'
        inv_control_lotes BIT DEFAULT 0,
        inv_control_vencimientos BIT DEFAULT 0,
        
        -- Comprobantes extendidos
        config_tipos_comprobantes NVARCHAR(MAX) NULL, -- JSON con tipos habilitados
        config_pie_comprobante NVARCHAR(MAX) NULL,
        
        -- Regional extendida
        regional_idioma NVARCHAR(10) DEFAULT 'es-AR',
        regional_zona_horaria NVARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires',
        
        -- Branding extendido
        branding_nombre_fantasia NVARCHAR(255) NULL,
        
        -- Integraciones extendidas
        int_afip_cert_path NVARCHAR(500) NULL,
        int_mercadopago_token NVARCHAR(500) NULL,
        int_mercadolibre_token NVARCHAR(500) NULL,
        
        -- Dashboard extendido
        dash_kpis_visibles NVARCHAR(MAX) DEFAULT '["ventas_hoy", "stock_bajo", "clientes_nuevos"]',
        dash_rango_default NVARCHAR(50) DEFAULT 'mes_actual',
        dash_refresco_segundos INT DEFAULT 300;
END
GO

PRINT 'Migracion 006 completada: Estructura para Configuracion Integral lista.';
GO
