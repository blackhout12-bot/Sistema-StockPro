-- 019_pos_cajas_sesiones.sql
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[POS_Cajas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[POS_Cajas] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [empresa_id] INT NOT NULL,
        [sucursal_id] INT NULL,
        [nombre] VARCHAR(100) NOT NULL,
        [activa] BIT NOT NULL DEFAULT 1
        -- FOREIGN KEY ([empresa_id]) REFERENCES [dbo].[Empresa]([id]) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[POS_Sesiones]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[POS_Sesiones] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [caja_id] INT NOT NULL,
        [usuario_id] INT NOT NULL,
        [monto_inicial] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [fecha_apertura] DATETIME DEFAULT GETDATE(),
        [fecha_cierre] DATETIME NULL,
        [monto_cierre] DECIMAL(18,2) NULL,
        [estado] VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
        FOREIGN KEY ([caja_id]) REFERENCES [dbo].[POS_Cajas]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([usuario_id]) REFERENCES [dbo].[Usuarios]([id])
    );
END
GO
