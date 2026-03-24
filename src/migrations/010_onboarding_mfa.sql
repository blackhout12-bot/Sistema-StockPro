// src/migrations/010_onboarding_mfa.sql
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Usuarios') AND name = 'onboarding_completed'
)
BEGIN
    ALTER TABLE Usuarios ADD onboarding_completed BIT DEFAULT 0 NOT NULL;
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Usuarios') AND name = 'mfa_enabled'
)
BEGIN
    ALTER TABLE Usuarios ADD mfa_enabled BIT DEFAULT 0 NOT NULL;
    ALTER TABLE Usuarios ADD totp_secret NVARCHAR(255) NULL;
END
