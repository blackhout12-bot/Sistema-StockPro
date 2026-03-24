-- 026_contextos.sql
BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contextos]') AND type in (N'U'))
    BEGIN
        CREATE TABLE [dbo].[Contextos] (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [empresa_id] INT NOT NULL,
            [sucursal_id] INT NOT NULL,
            [nombre] VARCHAR(100) NOT NULL,
            [descripcion] VARCHAR(255) NULL,
            [creado_en] DATETIME DEFAULT GETDATE(),
            CONSTRAINT [FK_Contextos_Empresa] FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[Empresa]([id]),
            CONSTRAINT [FK_Contextos_Sucursal] FOREIGN KEY ([sucursal_id]) REFERENCES [dbo].[Sucursales]([id]),
            CONSTRAINT [UQ_Contextos_Empresa_Sucursal] UNIQUE ([empresa_id], [sucursal_id])
        );
        PRINT 'Tabla Contextos creada exitosamente.';

        -- Auto-generar contextos por defecto basados en las sucursales existentes
        INSERT INTO [dbo].[Contextos] (empresa_id, sucursal_id, nombre, descripcion)
        SELECT empresa_id, id, nombre, 'Contexto auto-generado para ' + nombre
        FROM [dbo].[Sucursales] s
        WHERE NOT EXISTS (SELECT 1 FROM [dbo].[Contextos] c WHERE c.empresa_id = s.empresa_id AND c.sucursal_id = s.id);
        PRINT 'Contextos históricos auto-generados.';
    END
    ELSE
    BEGIN
        PRINT 'Tabla Contextos ya existe.';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @Message NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT 'FATAL ERROR (026_Contextos):';
    PRINT @Message;
    THROW;
END CATCH;
