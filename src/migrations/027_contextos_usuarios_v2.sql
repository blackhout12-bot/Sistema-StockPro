-- 027_contextos_usuarios_v2.sql
BEGIN TRY
    BEGIN TRANSACTION;

    PRINT 'Iniciando migración 027_contextos_usuarios_v2...';

    -- Verificar si existe la tabla pivote y si le falta la columna nueva
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contextos_Usuarios]') AND type in (N'U'))
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Contextos_Usuarios]') AND name = 'contexto_id')
        BEGIN
            -- 1. Añadir columna contexto_id (permite nulls temporalmente)
            ALTER TABLE [dbo].[Contextos_Usuarios] ADD [contexto_id] INT NULL;

            -- 2. Migrar los IDs cruzando por la base Contextos donde empaten
            EXEC('
                UPDATE cu
                SET cu.contexto_id = c.id
                FROM [dbo].[Contextos_Usuarios] cu
                JOIN [dbo].[Contextos] c ON c.sucursal_id = cu.sucursal_id
            ');

            -- 3. Eliminar Contextos_Usuarios sin contexto posible
            DELETE FROM [dbo].[Contextos_Usuarios] WHERE contexto_id IS NULL;

            -- 4. Alterar a NOT NULL
            ALTER TABLE [dbo].[Contextos_Usuarios] ALTER COLUMN [contexto_id] INT NOT NULL;

            -- 5. Eliminar vieja Unique Constraint
            ALTER TABLE [dbo].[Contextos_Usuarios] DROP CONSTRAINT [UQ_Contexto_Rel];

            -- 6. Eliminar vieja Foreign Key
            ALTER TABLE [dbo].[Contextos_Usuarios] DROP CONSTRAINT [FK_Contexto_Sucursal];

            -- 7. Eliminar columna sucursal_id
            ALTER TABLE [dbo].[Contextos_Usuarios] DROP COLUMN [sucursal_id];

            -- 8. Añadir Foreign Key a Contextos
            ALTER TABLE [dbo].[Contextos_Usuarios] ADD CONSTRAINT [FK_ContextoUser_Contexto] FOREIGN KEY ([contexto_id]) REFERENCES [dbo].[Contextos] ([id]) ON DELETE CASCADE;

            -- 9. Añadir nueva Unique Constraint
            ALTER TABLE [dbo].[Contextos_Usuarios] ADD CONSTRAINT [UQ_ContextoUser_Rel] UNIQUE ([usuario_id], [contexto_id]);

            PRINT 'Migración 027 (Relacional Contextos) finalizada con éxito.';
        END
        ELSE
        BEGIN
            PRINT 'La tabla Contextos_Usuarios ya contiene contexto_id.';
        END
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @Message NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT 'FATAL ERROR (027_Contextos_Usuarios_v2):';
    PRINT @Message;
    THROW;
END CATCH;
