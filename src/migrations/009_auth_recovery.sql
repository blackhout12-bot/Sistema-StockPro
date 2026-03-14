-- Migration: 009_auth_recovery
-- Descripción: Agrega campos para el token de recuperación de contraseña.

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'reset_token')
BEGIN
    ALTER TABLE Usuarios ADD reset_token NVARCHAR(255) NULL;
    ALTER TABLE Usuarios ADD reset_token_exp DATETIME2 NULL;
    PRINT 'Campos de recuperación agregados a la tabla Usuarios.';
END
GO
