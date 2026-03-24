-- src/migrations/011_precios_sucursal.sql
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PreciosSucursal' AND xtype='U')
BEGIN
    CREATE TABLE PreciosSucursal (
        id INT IDENTITY(1,1) PRIMARY KEY,
        producto_id INT NOT NULL,
        sucursal_id INT NOT NULL,
        precio DECIMAL(18,2) NOT NULL,
        actualizado_en DATETIME DEFAULT GETDATE(),
        actualizado_por INT NULL,
        FOREIGN KEY (producto_id) REFERENCES Productos(id) ON DELETE CASCADE,
        FOREIGN KEY (sucursal_id) REFERENCES Sucursales(id) ON DELETE CASCADE,
        FOREIGN KEY (actualizado_por) REFERENCES Usuarios(id)
    );

    -- Aseguramos que solo haya un precio máximo por sucursal para un mismo producto
    CREATE UNIQUE NONCLUSTERED INDEX UQ_PreciosSucursal_ProductoSucursal
    ON PreciosSucursal(producto_id, sucursal_id);
END
GO
