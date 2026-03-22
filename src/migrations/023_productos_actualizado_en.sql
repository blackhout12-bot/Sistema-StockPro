-- Migración para añadir columna actualizado_en a Productos
IF COL_LENGTH('Productos', 'actualizado_en') IS NULL
BEGIN
    ALTER TABLE Productos ADD actualizado_en DATETIME NULL;
END
