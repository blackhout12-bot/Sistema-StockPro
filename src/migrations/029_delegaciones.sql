-- 029_delegaciones.sql
BEGIN TRY
    BEGIN TRANSACTION;

    PRINT 'Iniciando migración 029_delegaciones...';

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Delegaciones]') AND type in (N'U'))
    BEGIN
        CREATE TABLE [dbo].[Delegaciones] (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [delegante_id] INT NOT NULL,
            [delegado_id] INT NOT NULL,
            [rol_asignado] VARCHAR(50) NOT NULL,
            [fecha_inicio] DATETIME NOT NULL DEFAULT GETDATE(),
            [fecha_fin] DATETIME NOT NULL,
            [estado] VARCHAR(20) DEFAULT 'ACTIVO',
            [creado_en] DATETIME DEFAULT GETDATE(),
            CONSTRAINT [FK_Delegante] FOREIGN KEY ([delegante_id]) REFERENCES [dbo].[Usuarios]([id]) ON DELETE NO ACTION,
            CONSTRAINT [FK_Delegado] FOREIGN KEY ([delegado_id]) REFERENCES [dbo].[Usuarios]([id]) ON DELETE CASCADE,
            CONSTRAINT [CK_Fechas_Delegacion] CHECK ([fecha_fin] > [fecha_inicio]),
            CONSTRAINT [CK_Estado_Delegacion] CHECK ([estado] IN ('ACTIVO', 'REVOCADO', 'EXPIRADO'))
        );
        PRINT 'Tabla Delegaciones construida con éxito.';
    END
    ELSE
    BEGIN
        PRINT 'Tabla Delegaciones ya existe.';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @Message NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT 'FATAL ERROR (029_Delegaciones):';
    PRINT @Message;
    THROW;
END CATCH;
