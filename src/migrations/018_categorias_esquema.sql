-- 018_categorias_esquema.sql
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categorias_Esquemas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categorias_Esquemas] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [empresa_id] INT NOT NULL,
        [nombre_rubro] VARCHAR(100) NOT NULL,
        [icon] VARCHAR(10) NULL,
        [esquema_json] NVARCHAR(MAX) NOT NULL DEFAULT '{}',
        [activo] BIT NOT NULL DEFAULT 1,
        [fecha_creacion] DATETIME DEFAULT GETDATE(),
        FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[Empresa]([id]) ON DELETE CASCADE
    );
END
GO
