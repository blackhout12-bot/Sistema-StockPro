-- rebuild.sql
BEGIN TRY
    BEGIN TRANSACTION;
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Delegaciones]') AND type in (N'U'))
    BEGIN
        DROP TABLE [dbo].[Delegaciones];
    END

    CREATE TABLE Delegaciones (
         id INT PRIMARY KEY IDENTITY,
         delegante_id INT NOT NULL,
         delegado_id INT NOT NULL,
         rol_asignado NVARCHAR(50) NOT NULL,
         fecha_inicio DATETIME DEFAULT GETDATE(),
         fecha_fin DATETIME NULL,
         FOREIGN KEY (delegante_id) REFERENCES Usuarios(id),
         FOREIGN KEY (delegado_id) REFERENCES Usuarios(id)
    );
    PRINT 'Tabla adherida puramente al User Prompt.';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
END CATCH;
