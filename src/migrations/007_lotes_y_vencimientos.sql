-- Migration: 007_lotes_y_vencimientos
-- Descripción: Agrega soporte para control de Lotes y Vencimientos en los inventarios.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lotes')
BEGIN
    CREATE TABLE Lotes (
        id INT PRIMARY KEY IDENTITY(1,1),
        producto_id INT NOT NULL,
        nro_lote NVARCHAR(100) NOT NULL,
        cantidad INT NOT NULL DEFAULT 0,
        fecha_vto DATE,
        empresa_id INT NOT NULL,
        creado_en DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Lotes_Productos FOREIGN KEY (producto_id) REFERENCES Productos(id),
        CONSTRAINT FK_Lotes_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
END
GO
