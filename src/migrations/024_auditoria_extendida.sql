-- src/migrations/024_auditoria_extendida.sql
-- 1. Crear nueva tabla Auditoria
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Auditoria]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.Auditoria (
        id INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id INT NULL,
        ip NVARCHAR(50) NULL,
        timestamp DATETIME DEFAULT GETDATE(),
        accion NVARCHAR(100) NOT NULL,
        entidad NVARCHAR(100) NOT NULL,
        entidad_id INT NULL,
        valor_anterior NVARCHAR(MAX) NULL,
        valor_nuevo NVARCHAR(MAX) NULL,
        empresa_id INT NOT NULL
    );
    PRINT 'Tabla dbo.Auditoria creada.';
END
GO

-- 2. Migrar datos de AuditLog (si existe)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditLog]') AND type in (N'U'))
BEGIN
    INSERT INTO dbo.Auditoria (usuario_id, ip, timestamp, accion, entidad, entidad_id, valor_nuevo, empresa_id)
    SELECT usuario_id, ip, ISNULL(fecha, GETDATE()), ISNULL(accion, 'UNKNOWN'), ISNULL(entidad, 'UNKNOWN'), entidad_id, payload, ISNULL(empresa_id, 1)
    FROM dbo.AuditLog;
    
    DROP TABLE dbo.AuditLog;
    PRINT 'Datos migrados y tabla AuditLog eliminada.';
END
GO

-- 3. Trigger para Productos
CREATE OR ALTER TRIGGER trg_audit_Productos ON Productos
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Productos', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            i.empresa_id
        FROM inserted i;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Productos', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            d.empresa_id
        FROM deleted d;
END
GO

-- 4. Trigger para Facturas
CREATE OR ALTER TRIGGER trg_audit_Facturas ON Facturas
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT i.usuario_id, @accion, 'Facturas', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            i.empresa_id
        FROM inserted i;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT d.usuario_id, @accion, 'Facturas', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            d.empresa_id
        FROM deleted d;
END
GO

-- 5. Trigger para Compras
CREATE OR ALTER TRIGGER trg_audit_Compras ON Compras
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Compras', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            i.empresa_id
        FROM inserted i;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Compras', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            d.empresa_id
        FROM deleted d;
END
GO

-- 6. Trigger para Proveedores
CREATE OR ALTER TRIGGER trg_audit_Proveedores ON Proveedores
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Proveedores', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            i.empresa_id
        FROM inserted i;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Proveedores', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            d.empresa_id
        FROM deleted d;
END
GO

-- 7. Trigger para Usuarios
CREATE OR ALTER TRIGGER trg_audit_Usuarios ON Usuarios
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Usuarios', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            i.empresa_id
        FROM inserted i;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Usuarios', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            d.empresa_id
        FROM deleted d;
END
GO

-- 8. Trigger para Roles
CREATE OR ALTER TRIGGER trg_audit_Roles ON Roles
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Roles', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            i.empresa_id
        FROM inserted i;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT @accion, 'Roles', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            d.empresa_id
        FROM deleted d;
END
GO

-- 9. Trigger para PreciosSucursal
CREATE OR ALTER TRIGGER trg_audit_PreciosSucursal ON PreciosSucursal
AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @accion NVARCHAR(100);
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted) SET @accion = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted) SET @accion = 'INSERT';
    ELSE SET @accion = 'DELETE';

    -- Need to join with Productos to get empresa_id
    IF @accion IN ('INSERT', 'UPDATE')
        INSERT INTO Auditoria (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT i.actualizado_por, @accion, 'PreciosSucursal', i.id, 
            (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted r WHERE r.id = i.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            p.empresa_id
        FROM inserted i
        JOIN Productos p ON i.producto_id = p.id;

    IF @accion = 'DELETE'
        INSERT INTO Auditoria (usuario_id, accion, entidad, entidad_id, valor_anterior, valor_nuevo, empresa_id)
        SELECT d.actualizado_por, @accion, 'PreciosSucursal', d.id, 
            (SELECT * FROM deleted r WHERE r.id = d.id FOR JSON AUTO, WITHOUT_ARRAY_WRAPPER),
            NULL,
            p.empresa_id
        FROM deleted d
        JOIN Productos p ON d.producto_id = p.id;
END
GO

PRINT 'Triggers de auditoria generados correctamente.';
