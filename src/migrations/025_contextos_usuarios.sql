-- src/migrations/025_contextos_usuarios.sql
-- Inyección de proxy relacional para escalar a un modelo Múltiples Sucursales (v1.21.0)
BEGIN TRY
    BEGIN TRANSACTION;

    PRINT 'Iniciando migración 025_contextos_usuarios...';

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contextos_Usuarios]') AND type in (N'U'))
    BEGIN
        CREATE TABLE [dbo].[Contextos_Usuarios](
            [id] [int] IDENTITY(1,1) NOT NULL,
            [usuario_id] [int] NOT NULL,
            [sucursal_id] [int] NOT NULL,
            [rol_local] [varchar](50) NULL,
            [creado_en] [datetime] NULL DEFAULT (getdate()),
            CONSTRAINT [PK_Contexto_User] PRIMARY KEY CLUSTERED ([id] ASC),
            CONSTRAINT [FK_Contexto_Usuario] FOREIGN KEY ([usuario_id]) REFERENCES [dbo].[Usuarios] ([id]) ON DELETE CASCADE,
            CONSTRAINT [FK_Contexto_Sucursal] FOREIGN KEY ([sucursal_id]) REFERENCES [dbo].[Sucursales] ([id]) ON DELETE CASCADE,
            CONSTRAINT [UQ_Contexto_Rel] UNIQUE ([usuario_id], [sucursal_id])
        );
        PRINT 'Tabla Contextos_Usuarios creada exitosamente.';
    END
    ELSE
    BEGIN
        PRINT 'Tabla Contextos_Usuarios ya existe.';
    END

    -- Copiar contextos originarios (de Usuario a Contextos_Usuarios) 
    PRINT 'Sincronizando contextos actuales a tabla pivote...';
    EXEC('
        INSERT INTO [dbo].[Contextos_Usuarios] (usuario_id, sucursal_id, rol_local)
        SELECT u.id, u.sucursal_id, u.rol
        FROM [dbo].[Usuarios] u
        WHERE u.sucursal_id IS NOT NULL 
          AND NOT EXISTS (
              SELECT 1 FROM [dbo].[Contextos_Usuarios] cu 
              WHERE cu.usuario_id = u.id AND cu.sucursal_id = u.sucursal_id
          );
    ');

    COMMIT TRANSACTION;
    PRINT 'Migración 025_contextos_usuarios finalizada y sellada.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @Message NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @Severity INT = ERROR_SEVERITY();
    DECLARE @State INT = ERROR_STATE();
    PRINT 'FATAL ERROR (025_Contextos):';
    PRINT @Message;
    RAISERROR (@Message, @Severity, @State);
END CATCH
