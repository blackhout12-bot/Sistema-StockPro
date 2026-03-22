-- src/migrations/020_tabla_sucursales.sql

BEGIN TRY
    BEGIN TRANSACTION;

    PRINT 'Iniciando migración 020_tabla_sucursales...';

    -- 1. Crear tabla Sucursales si no existe
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sucursales]') AND type in (N'U'))
    BEGIN
        CREATE TABLE [dbo].[Sucursales](
            [id] [int] IDENTITY(1,1) NOT NULL,
            [empresa_id] [int] NOT NULL,
            [nombre] [varchar](100) NOT NULL,
            [direccion] [varchar](255) NULL,
            [telefono] [varchar](50) NULL,
            [activa] [bit] NULL DEFAULT ((1)),
            [creado_en] [datetime] NULL DEFAULT (getdate()),
            [actualizado_en] [datetime] NULL DEFAULT (getdate()),
            CONSTRAINT [PK_Sucursales] PRIMARY KEY CLUSTERED ([id] ASC),
            CONSTRAINT [FK_Sucursal_Empresa] FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[Empresa] ([id]) ON DELETE CASCADE
        );
        PRINT 'Tabla Sucursales creada.';
    END
    ELSE
    BEGIN
        PRINT 'Tabla Sucursales ya existe.';
    END

    -- 2. Insertar sucursal por defecto para empresas existentes que no tengan
    INSERT INTO [dbo].[Sucursales] (empresa_id, nombre, direccion, activa)
    SELECT e.id, 'Casa Central', e.direccion, 1
    FROM [dbo].[Empresa] e
    WHERE NOT EXISTS (SELECT 1 FROM [dbo].[Sucursales] s WHERE s.empresa_id = e.id);
    PRINT 'Sucursales por defecto insertadas para empresas existentes.';

    -- 3. Añadir sucursal_id a Depositos
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Depositos]') AND name = 'sucursal_id')
    BEGIN
        ALTER TABLE [dbo].[Depositos] ADD sucursal_id INT NULL;
        ALTER TABLE [dbo].[Depositos] ADD CONSTRAINT FK_Deposito_Sucursal FOREIGN KEY (sucursal_id) REFERENCES [dbo].[Sucursales](id);
        PRINT 'Columna sucursal_id añadida a Depositos.';
    END

    -- Asignar la primera sucursal de la empresa a los depósitos existentes
    EXEC('
    UPDATE d
    SET d.sucursal_id = (SELECT TOP 1 id FROM [dbo].[Sucursales] s WHERE s.empresa_id = d.empresa_id ORDER BY s.id)
    FROM [dbo].[Depositos] d
    WHERE d.sucursal_id IS NULL;
    ');

    -- 4. Añadir sucursal_id a POS_Cajas
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[POS_Cajas]') AND name = 'sucursal_id')
    BEGIN
        ALTER TABLE [dbo].[POS_Cajas] ADD sucursal_id INT NULL;
        ALTER TABLE [dbo].[POS_Cajas] ADD CONSTRAINT FK_Caja_Sucursal FOREIGN KEY (sucursal_id) REFERENCES [dbo].[Sucursales](id);
        PRINT 'Columna sucursal_id añadida a POS_Cajas.';
    END

    -- Asignar la primera sucursal de la empresa a las cajas existentes
    EXEC('
    UPDATE c
    SET c.sucursal_id = (SELECT TOP 1 id FROM [dbo].[Sucursales] s WHERE s.empresa_id = c.empresa_id ORDER BY s.id)
    FROM [dbo].[POS_Cajas] c
    WHERE c.sucursal_id IS NULL;
    ');

    -- 5. Añadir sucursal_id a Usuarios
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]') AND name = 'sucursal_id')
    BEGIN
        ALTER TABLE [dbo].[Usuarios] ADD sucursal_id INT NULL;
        ALTER TABLE [dbo].[Usuarios] ADD CONSTRAINT FK_Usuario_Sucursal FOREIGN KEY (sucursal_id) REFERENCES [dbo].[Sucursales](id);
        PRINT 'Columna sucursal_id añadida a Usuarios.';
    END

    -- Asignar la primera sucursal de la empresa a los usuarios existentes
    EXEC('
    UPDATE u
    SET u.sucursal_id = (SELECT TOP 1 id FROM [dbo].[Sucursales] s WHERE s.empresa_id = u.empresa_id ORDER BY s.id)
    FROM [dbo].[Usuarios] u
    WHERE u.sucursal_id IS NULL;
    ');

    COMMIT TRANSACTION;
    PRINT 'Migración 020_tabla_sucursales aplicada exitosamente.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    PRINT 'ERROR en la migración:';
    PRINT @ErrorMessage;
    
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH
