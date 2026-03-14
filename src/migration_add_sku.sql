-- Migration: Add SKU column to Productos table
-- Run this script once in SQL Server Management Studio
-- It is safe to run multiple times (checks if column exists first)

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Productos' AND COLUMN_NAME = 'sku'
)
BEGIN
    ALTER TABLE Productos ADD sku VARCHAR(100) NULL;
    PRINT 'Columna sku agregada exitosamente a la tabla Productos';
END
ELSE
BEGIN
    PRINT 'La columna sku ya existe en la tabla Productos (sin cambios)';
END
