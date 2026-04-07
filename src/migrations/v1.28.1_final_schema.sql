-- v1.28.1-final: Aislamiento de Datos y Gestión de Planes
-- 1. Crear Tablas de Planes y Configuración
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Planes')
BEGIN
    CREATE TABLE Planes (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre NVARCHAR(50) NOT NULL,
        descripcion NVARCHAR(255),
        modulos_json NVARCHAR(MAX) NOT NULL, -- JSON con { modulo_id: true/false }
        limite_usuarios INT DEFAULT 5,
        created_at DATETIME DEFAULT GETDATE()
    );

    -- Insertar Planes por Defecto
    SET IDENTITY_INSERT Planes ON;
    INSERT INTO Planes (id, nombre, descripcion, modulos_json, limite_usuarios)
    VALUES 
    (1, 'Básico', 'Plan inicial para pequeños negocios', '{"dashboard":true,"productos":true,"clientes":true,"facturacion":true,"reportes":true}', 3),
    (2, 'Profesional', 'Plan completo para mayoristas', '{"dashboard":true,"productos":true,"clientes":true,"facturacion":true,"reportes":true,"movimientos":true,"proveedores":true,"kardex":true}', 10),
    (3, 'Enterprise', 'Control total y auditoría', '{"dashboard":true,"productos":true,"clientes":true,"facturacion":true,"reportes":true,"movimientos":true,"proveedores":true,"kardex":true,"usuarios":true,"auditoria":true,"sucursales":true}', 50),
    (4, 'Full + IA', 'Todo el sistema más módulos inteligentes', '{"*": true}', 100);
    SET IDENTITY_INSERT Planes OFF;
END

-- 2. Asegurar que las Empresas tienen plan_id
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Empresas') AND name = 'plan_id')
BEGIN
    ALTER TABLE Empresas ADD plan_id INT DEFAULT 1;
    -- Actualizar empresas existentes al plan básico
    EXEC('UPDATE Empresas SET plan_id = 1');
END

-- 3. Tabla de Excepciones/Módulos Activos por Empresa
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ModulosActivos')
BEGIN
    CREATE TABLE ModulosActivos (
        empresa_id INT NOT NULL,
        modulo_id NVARCHAR(50) NOT NULL,
        activo BIT DEFAULT 1,
        PRIMARY KEY (empresa_id, modulo_id)
    );
END

-- 4. Aislamiento de Datos (RLS)
-- Asegurar empresa_id en todas las tablas de negocio
DECLARE @TableName NVARCHAR(255);
DECLARE @Sql NVARCHAR(MAX);

DECLARE table_cursor CURSOR FOR 
SELECT name FROM sys.tables 
WHERE name IN ('Facturas', 'Clientes', 'Productos', 'Categorias', 'Proveedores', 'MovimientosStock', 'CuentasCobrar', 'CuentasPagar', 'AuditoriaLog', 'POS_Sesiones', 'Monedas');

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- 4a. Agregar columna empresa_id si no existe
    SET @Sql = 'IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(''' + @TableName + ''') AND name = ''empresa_id'') ' +
               'ALTER TABLE ' + @TableName + ' ADD empresa_id INT DEFAULT 1';
    EXEC sp_executesql @Sql;

    -- 4b. Crear índice para performance
    SET @Sql = 'IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @TableName + '_Empresa'') ' +
               'CREATE INDEX IX_' + @TableName + '_Empresa ON ' + @TableName + '(empresa_id)';
    EXEC sp_executesql @Sql;

    FETCH NEXT FROM table_cursor INTO @TableName;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;

-- 5. Crear Función de Predicado y Política de Seguridad
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Security')
    EXEC('CREATE SCHEMA Security');
GO

CREATE OR ALTER FUNCTION Security.fn_securitypredicate(@empresa_id AS int)
    RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_securitypredicate_result
    WHERE @empresa_id = CAST(SESSION_CONTEXT(N'empresa_id') AS int)
       OR IS_SRVROLEMEMBER('sysadmin') = 1; -- Bypass para sysadmin de SQL
GO

-- Aplicar a tablas (Ejemplo: Facturas)
IF EXISTS (SELECT * FROM sys.security_policies WHERE name = 'DataIsolationPolicy')
    DROP SECURITY POLICY DataIsolationPolicy;
GO

CREATE SECURITY POLICY DataIsolationPolicy
ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Facturas,
ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Facturas,
ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Clientes,
ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Clientes,
ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Productos,
ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Productos,
ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Categorias,
ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Categorias,
ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.MovimientosStock,
ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.MovimientosStock;
-- Nota: En producción aplicar a todas las tablas de negocio.
GO
