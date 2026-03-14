-- Migration: 008_notificaciones
-- Descripción: Tabla para almacenar alertas y notificaciones internas para los usuarios.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notificaciones')
BEGIN
    CREATE TABLE Notificaciones (
        id INT PRIMARY KEY IDENTITY(1,1),
        empresa_id INT NOT NULL,
        usuario_id INT, -- NULL si es para todos los admins de la empresa
        titulo NVARCHAR(200) NOT NULL,
        mensaje NVARCHAR(MAX) NOT NULL,
        tipo NVARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
        leido BIT DEFAULT 0,
        creado_en DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Notificaciones_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
END
GO
