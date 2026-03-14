-- Archivo: 003_audit_log.sql
-- Descripción: Creación de la tabla dbo.AuditLog para trazabilidad de acciones.

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditLog]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.AuditLog (
        id              BIGINT PRIMARY KEY IDENTITY(1,1),
        empresa_id      INT,
        usuario_id      INT,
        accion          NVARCHAR(100) NOT NULL,
        entidad         NVARCHAR(100),
        entidad_id      NVARCHAR(100),
        payload         NVARCHAR(MAX),  -- JSON
        ip              NVARCHAR(50),
        fecha           DATETIME2 DEFAULT GETUTCDATE()
    );

    PRINT 'Tabla dbo.AuditLog creada correctamente.';
END
ELSE
BEGIN
    PRINT 'La tabla dbo.AuditLog ya existe.';
END
GO
