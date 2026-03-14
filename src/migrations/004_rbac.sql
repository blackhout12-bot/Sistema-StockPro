-- 0. Limpiar posibles tablas mal nombradas de intentos previos
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'globalPermisos') DROP TABLE globalPermisos;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'globalRolPermisos') DROP TABLE globalRolPermisos;

-- 1. Tabla de Permisos (Repositorios de acciones del sistema)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'Permisos')
BEGIN
    CREATE TABLE dbo.Permisos (
        id INT PRIMARY KEY IDENTITY(1,1),
        recurso NVARCHAR(50) NOT NULL, -- ej: 'productos', 'facturacion', 'reportes'
        accion NVARCHAR(50) NOT NULL,  -- ej: 'leer', 'crear', 'editar', 'eliminar', 'emitir'
        descripcion NVARCHAR(255),
        CONSTRAINT UQ_Permiso_RecursoAccion UNIQUE (recurso, accion)
    );
END
GO

-- 2. Tabla de Rol_Permisos (Asignación n:m)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'RolPermisos')
BEGIN
    CREATE TABLE dbo.RolPermisos (
        rol_nombre NVARCHAR(50) NOT NULL, -- 'admin', 'vendedor'
        permiso_id INT NOT NULL,
        CONSTRAINT PK_RolPermisos PRIMARY KEY (rol_nombre, permiso_id),
        CONSTRAINT FK_RolPermisos_Permisos FOREIGN KEY (permiso_id) REFERENCES dbo.Permisos(id) ON DELETE CASCADE
    );
END
GO

-- ======================================================================
-- SEED DE PERMISOS INICIALES (Bootstrap)
-- ======================================================================

-- Vaciar temporalmente para reinsertar o refrescar limpiamente. 
-- En producción madura esto usaría MERGE, pero para el initial setup DELETE es seguro si lo cruzamos con RolPermisos
DELETE FROM dbo.RolPermisos;
DELETE FROM dbo.Permisos;
DBCC CHECKIDENT ('dbo.Permisos', RESEED, 0);

-- Insertar Lista Blanca Categórica de Acciones
INSERT INTO dbo.Permisos (recurso, accion, descripcion) VALUES
-- Módulo: Productos e Inventario
('productos', 'leer', 'Ver listado de productos y stock'),
('productos', 'crear', 'Agregar nuevos productos al catálogo'),
('productos', 'editar', 'Modificar precios, nombres o metadatos de productos'),
('productos', 'eliminar', 'Desactivar o eliminar productos del sistema'),
('inventario', 'leer', 'Ver movimientos de stock'),
('inventario', 'ajustar', 'Ajustar stock manualmente / Cargar compras'),

-- Módulo: Facturación (POS)
('facturacion', 'leer', 'Ver historial de facturas'),
('facturacion', 'emitir', 'Emitir nuevas facturas y cobrar'),
('facturacion', 'anular', 'Anular facturas o generar notas de crédito'),

-- Módulo: Clientes
('clientes', 'leer', 'Ver base de clientes'),
('clientes', 'crear', 'Registrar clientes nuevos'),
('clientes', 'editar', 'Modificar datos de clientes'),
('clientes', 'eliminar', 'Eliminar clientes'),

-- Módulo: Empresas, Config y Dashboard Gerencial
('empresa', 'leer', 'Ver perfil de la empresa'),
('empresa', 'editar', 'Cambiar facturación, logo o datos tributarios'),
('dashboard', 'ver', 'Ver métricas financieras, de caja y proyecciones'),
('usuarios', 'administrar', 'Crear usuarios, revocar accesos y cambiar contraseñas'),
('auditoria', 'ver', 'Ver logs inmutables del sistema'),

-- Módulo: Reportes
('reportes', 'leer', 'Ver reportes financieros y de stock'),

-- Módulo: Movimientos (Inventario)
('movimientos', 'leer', 'Ver log de movimientos de stock'),
('movimientos', 'crear', 'Registrar ingresos/egresos manuales de stock');
GO

-- ======================================================================
-- SEED DE ROLES (admin y vendedor)
-- ======================================================================

-- 1. Rol ADMIN: Tiene todos los permisos absolutamete.
INSERT INTO dbo.RolPermisos (rol_nombre, permiso_id)
SELECT 'admin', id FROM dbo.Permisos;

-- 2. Rol VENDEDOR: Permisos limitados operativos (Least Privilege Policy).
INSERT INTO dbo.RolPermisos (rol_nombre, permiso_id)
SELECT 'vendedor', id FROM dbo.Permisos
WHERE (recurso = 'productos' AND accion IN ('leer'))
   OR (recurso = 'facturacion' AND accion IN ('leer', 'emitir'))
   OR (recurso = 'clientes' AND accion IN ('leer', 'crear', 'editar'))
   OR (recurso = 'movimientos' AND accion IN ('leer'))
   OR (recurso = 'dashboard' AND accion IN ('ver'));
GO

PRINT 'Migracion 004 completada: RBAC y roles sembrados exitosamente.';
