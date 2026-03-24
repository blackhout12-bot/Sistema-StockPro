BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'mfa_secret' AND Object_ID = Object_ID(N'dbo.Usuarios'))
    BEGIN
        ALTER TABLE dbo.Usuarios ADD mfa_secret VARCHAR(64) NULL;
        ALTER TABLE dbo.Usuarios ADD mfa_enabled BIT NOT NULL DEFAULT 0;
    END

    PRINT 'Columnas MFA injertadas exitosamente.';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
END CATCH;
