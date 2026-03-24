-- 028_fix_contextos_usuarios.sql
BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contextos_Usuarios]') AND type in (N'U'))
    BEGIN
        CREATE TABLE [dbo].[Contextos_Usuarios] (
            [id] INT PRIMARY KEY IDENTITY(1,1),
            [contexto_id] INT NOT NULL,
            [usuario_id] INT NOT NULL,
            [rol_local] VARCHAR(50) NULL,
            [fecha_asignacion] DATETIME DEFAULT GETDATE(),
            CONSTRAINT [FK_CU_Contextos] FOREIGN KEY ([contexto_id]) REFERENCES [dbo].[Contextos]([id]) ON DELETE CASCADE,
            CONSTRAINT [FK_CU_Usuarios] FOREIGN KEY ([usuario_id]) REFERENCES [dbo].[Usuarios]([id]) ON DELETE CASCADE,
            CONSTRAINT [UQ_CU_Relacion] UNIQUE ([usuario_id], [contexto_id])
        );

        PRINT 'Tabla Contextos_Usuarios (M:N) creada exitosamente sobre BD activa.';
        
        -- Opcional: Auto-poblar para usuarios que ya tenían sucursal_id = alguna sucursal_id ligada a un contexto
        INSERT INTO [dbo].[Contextos_Usuarios] (contexto_id, usuario_id, rol_local)
        SELECT c.id, u.id, u.rol
        FROM [dbo].[Usuarios] u
        JOIN [dbo].[Contextos] c ON c.sucursal_id = u.sucursal_id
        WHERE u.sucursal_id IS NOT NULL;
        
        PRINT 'Perfiles legados auto-sincronizados hacia la tabla pivote.';
    END
    ELSE
    BEGIN
        PRINT 'Tabla Contextos_Usuarios ya existe.';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @Message NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT 'FATAL ERROR (028_Fix_Contextos):';
    PRINT @Message;
    THROW;
END CATCH;
