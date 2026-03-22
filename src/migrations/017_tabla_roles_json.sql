-- ============================================================
-- Migración 017: Tabla de Roles dinámicos con JSON de permisos
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'Roles') AND type = N'U')
BEGIN
    CREATE TABLE Roles (
        id            INT           NOT NULL IDENTITY(1,1),
        empresa_id    INT           NOT NULL,
        nombre        NVARCHAR(100) NOT NULL,
        codigo_rol    NVARCHAR(50)  NOT NULL, -- ej. 'admin', 'cajero', 'custom_1'
        permisos      NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON {"facturacion":["read","create"]}
        es_sistema    BIT           NOT NULL DEFAULT 0, -- 1 para roles inborrables
        activo        BIT           NOT NULL DEFAULT 1,
        created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_Roles PRIMARY KEY (id),
        CONSTRAINT UQ_Roles_empresa_codigo UNIQUE (empresa_id, codigo_rol),
        CONSTRAINT FK_Roles_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE
    );
    PRINT 'Tabla Roles creada exitosamente.';

    -- Sembrar roles por defecto para empresas existentes
    INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema)
    SELECT id, 'Administrador', 'admin', '{"*":["read","create","update","delete","export"]}', 1 FROM Empresa;

    INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema)
    SELECT id, 'Gerente', 'gerente', '{"dashboard":["read"],"facturacion":["read","create","export"],"movimientos":["read","create","update","export"],"productos":["read","create","update","export"],"clientes":["read","create","update","export"],"reportes":["read","export"],"marketplace":["read","create","update"],"produccion":["read","create","update"],"fidelizacion":["read","create","update"]}', 1 FROM Empresa;

    INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema)
    SELECT id, 'Supervisor', 'supervisor', '{"dashboard":["read"],"facturacion":["read","create"],"movimientos":["read","create","update"],"productos":["read","create","update"],"clientes":["read","create","update"],"reportes":["read"],"produccion":["read","create"],"fidelizacion":["read","update"]}', 1 FROM Empresa;

    INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema)
    SELECT id, 'Cajero', 'cajero', '{"dashboard":["read"],"facturacion":["read","create"],"clientes":["read","create"],"movimientos":["read"]}', 1 FROM Empresa;

    INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema)
    SELECT id, 'Gestor Producción', 'gestor_produccion', '{"dashboard":["read"],"movimientos":["read","create","update"],"productos":["read","update"],"produccion":["read","create","update","delete"]}', 1 FROM Empresa;

    INSERT INTO Roles (empresa_id, nombre, codigo_rol, permisos, es_sistema)
    SELECT id, 'Gestor Fidelización', 'gestor_fidelizacion', '{"dashboard":["read"],"clientes":["read","update"],"fidelizacion":["read","create","update"]}', 1 FROM Empresa;

    PRINT 'Roles del sistema sembrados por defecto.';
END
ELSE
BEGIN
    PRINT 'La tabla Roles ya existe.';
END
