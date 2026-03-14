-- ======================================================================
-- MIGRACIÓN 005: Módulo de Configuración Avanzada
-- Empresa: Branding, Regional, Inventario, Impuestos e Integraciones
-- ======================================================================

USE StockDB;
GO

-- 1. Agregar columnas extendidas a la tabla Empresa (si no existen)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empresa') AND name = 'regional_formato_fecha')
BEGIN
    ALTER TABLE dbo.Empresa ADD 
        regional_formato_fecha NVARCHAR(20) DEFAULT 'DD/MM/YYYY',
        regional_separador_decimal NVARCHAR(1) DEFAULT '.',
        branding_color_primario NVARCHAR(7) DEFAULT '#3b82f6',
        branding_color_secundario NVARCHAR(7) DEFAULT '#1e40af',
        branding_eslogan NVARCHAR(255) NULL,
        config_iva_defecto DECIMAL(5,2) DEFAULT 21.00,
        config_cuit_cuil NVARCHAR(20) NULL,
        inv_stock_critico_global INT DEFAULT 5,
        inv_permitir_negativo BIT DEFAULT 0,
        int_email_host NVARCHAR(255) NULL,
        int_email_port INT NULL;
END
GO

-- 2. Crear Tabla de Configuración de Comprobantes (Series de facturación)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'ConfigComprobantes')
BEGIN
    CREATE TABLE dbo.ConfigComprobantes (
        id INT PRIMARY KEY IDENTITY(1,1),
        empresa_id INT NOT NULL,
        tipo_comprobante NVARCHAR(50) NOT NULL, -- 'Factura A', 'Factura B', 'Ticket', etc.
        prefijo NVARCHAR(10) DEFAULT '0001',
        proximo_nro INT DEFAULT 1,
        activo BIT DEFAULT 1,
        CONSTRAINT FK_ConfigComprobantes_Empresa FOREIGN KEY (empresa_id) REFERENCES dbo.Empresa(id) ON DELETE CASCADE
    );
END
GO

-- 3. Seed inicial de comprobantes para empresas existentes
INSERT INTO dbo.ConfigComprobantes (empresa_id, tipo_comprobante, prefijo, proximo_nro)
SELECT id, 'Factura', '0001', 1 
FROM dbo.Empresa e
WHERE NOT EXISTS (SELECT 1 FROM dbo.ConfigComprobantes cc WHERE cc.empresa_id = e.id);
GO

PRINT 'Migracion 005 completada: Parametrizaciones de Empresa y Comprobantes listas.';
