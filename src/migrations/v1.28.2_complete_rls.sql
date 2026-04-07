-- =======================================================
-- MIGRACIÓN: v1.28.2 - Completar RLS en todas las tablas críticas
-- Prerequisito: v1.28.1_isolation_and_plans.sql ya ejecutado
-- =======================================================

USE StockDB;
GO

-- Aplicar Security Policy a todas las tablas críticas que tengan empresa_id
-- (Productos ya tiene policy_Productos desde v1.28.1)

DECLARE @sql NVARCHAR(MAX);

-- Tabla: Facturas
IF NOT EXISTS (SELECT * FROM sys.security_policies WHERE name = 'policy_Facturas')
BEGIN
    SET @sql = 'CREATE SECURITY POLICY policy_Facturas
        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Facturas,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Facturas AFTER INSERT,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Facturas AFTER UPDATE;';
    EXEC sp_executesql @sql;
    PRINT '✅ RLS aplicado: Facturas';
END
ELSE PRINT '⚠️ Ya existe: policy_Facturas';
GO

-- Tabla: Clientes
IF NOT EXISTS (SELECT * FROM sys.security_policies WHERE name = 'policy_Clientes')
BEGIN
    DECLARE @sql2 NVARCHAR(MAX) = 'CREATE SECURITY POLICY policy_Clientes
        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Clientes,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Clientes AFTER INSERT,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Clientes AFTER UPDATE;';
    EXEC sp_executesql @sql2;
    PRINT '✅ RLS aplicado: Clientes';
END
ELSE PRINT '⚠️ Ya existe: policy_Clientes';
GO

-- Tabla: Proveedores
IF NOT EXISTS (SELECT * FROM sys.security_policies WHERE name = 'policy_Proveedores')
BEGIN
    DECLARE @sql3 NVARCHAR(MAX) = 'CREATE SECURITY POLICY policy_Proveedores
        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Proveedores,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Proveedores AFTER INSERT,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Proveedores AFTER UPDATE;';
    EXEC sp_executesql @sql3;
    PRINT '✅ RLS aplicado: Proveedores';
END
ELSE PRINT '⚠️ Ya existe: policy_Proveedores';
GO

-- Tabla: Inventario
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Inventario')
    AND NOT EXISTS (SELECT * FROM sys.security_policies WHERE name = 'policy_Inventario')
BEGIN
    DECLARE @sql4 NVARCHAR(MAX) = 'CREATE SECURITY POLICY policy_Inventario
        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Inventario,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Inventario AFTER INSERT,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Inventario AFTER UPDATE;';
    EXEC sp_executesql @sql4;
    PRINT '✅ RLS aplicado: Inventario';
END
GO

-- Tabla: Auditoria
IF NOT EXISTS (SELECT * FROM sys.security_policies WHERE name = 'policy_Auditoria')
BEGIN
    DECLARE @sql5 NVARCHAR(MAX) = 'CREATE SECURITY POLICY policy_Auditoria
        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Auditoria,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Auditoria AFTER INSERT,
        ADD BLOCK PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Auditoria AFTER UPDATE;';
    EXEC sp_executesql @sql5;
    PRINT '✅ RLS aplicado: Auditoria';
END
ELSE PRINT '⚠️ Ya existe: policy_Auditoria';
GO

-- Tabla: Usuarios (solo FILTER, no BLOCK - para no romper el login global)
IF NOT EXISTS (SELECT * FROM sys.security_policies WHERE name = 'policy_Usuarios')
BEGIN
    DECLARE @sql6 NVARCHAR(MAX) = 'CREATE SECURITY POLICY policy_Usuarios
        ADD FILTER PREDICATE Security.fn_securitypredicate(empresa_id) ON dbo.Usuarios;';
    EXEC sp_executesql @sql6;
    PRINT '✅ RLS FILTER aplicado: Usuarios (sin BLOCK para no romper auth)';
END
ELSE PRINT '⚠️ Ya existe: policy_Usuarios';
GO

PRINT '=== Migración v1.28.2 completed - RLS aplicado en todas las tablas críticas ===';
GO
