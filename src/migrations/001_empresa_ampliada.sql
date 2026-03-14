-- ============================================================
-- Migración 001: Ampliación de la tabla Empresa (multi-tenant)
-- Ejecutar en: StockDB
-- ============================================================

-- 1. Identidad visual
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'logo_url')
    ALTER TABLE Empresa ADD logo_url NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'sitio_web')
    ALTER TABLE Empresa ADD sitio_web NVARCHAR(255) NULL;

-- 2. Datos fiscales extendidos
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'pais')
    ALTER TABLE Empresa ADD pais NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'ciudad')
    ALTER TABLE Empresa ADD ciudad NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'codigo_postal')
    ALTER TABLE Empresa ADD codigo_postal NVARCHAR(20) NULL;

-- 3. Configuración regional / operativa
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'moneda')
    ALTER TABLE Empresa ADD moneda NVARCHAR(10) NOT NULL CONSTRAINT DF_Empresa_moneda DEFAULT 'ARS';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'simbolo_moneda')
    ALTER TABLE Empresa ADD simbolo_moneda NVARCHAR(5) NOT NULL CONSTRAINT DF_Empresa_simbolo DEFAULT '$';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'zona_horaria')
    ALTER TABLE Empresa ADD zona_horaria NVARCHAR(100) NOT NULL CONSTRAINT DF_Empresa_zona DEFAULT 'America/Argentina/Buenos_Aires';

-- 4. Meta del tenant
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'fecha_registro')
    ALTER TABLE Empresa ADD fecha_registro DATETIME NOT NULL CONSTRAINT DF_Empresa_fecha DEFAULT GETDATE();

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'activo')
    ALTER TABLE Empresa ADD activo BIT NOT NULL CONSTRAINT DF_Empresa_activo DEFAULT 1;

-- NOTA: 'plan' es palabra reservada en T-SQL — usar [plan] con corchetes
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') AND name = 'plan')
    ALTER TABLE Empresa ADD [plan] NVARCHAR(50) NOT NULL CONSTRAINT DF_Empresa_plan DEFAULT 'starter';

PRINT 'Migración 001 aplicada correctamente.';
