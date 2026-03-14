-- ============================================================
-- Migración 002: Tabla junction UsuarioEmpresas (multi-empresa multi-rol)
-- Ejecutar en: StockDB
-- Idempotente: seguro para re-ejecutar
-- ============================================================

-- 1. Agregar columna 'activo' a Usuarios (si no existe)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'activo')
    ALTER TABLE Usuarios ADD activo BIT NOT NULL CONSTRAINT DF_Usuarios_activo DEFAULT 1;

-- 2. Agregar columna 'activo' a Usuarios si el constraint ya existe (sin fallback)
-- (el IF NOT EXISTS arriba lo maneja)

-- 3. Crear tabla UsuarioEmpresas si no existe
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'UsuarioEmpresas') AND type = N'U')
BEGIN
    CREATE TABLE UsuarioEmpresas (
        id            INT           NOT NULL IDENTITY(1,1),
        usuario_id    INT           NOT NULL,
        empresa_id    INT           NOT NULL,
        rol           NVARCHAR(50)  NOT NULL DEFAULT 'vendedor',
        activo        BIT           NOT NULL DEFAULT 1,
        fecha_union   DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_UsuarioEmpresas PRIMARY KEY (id),
        CONSTRAINT UQ_UsuarioEmpresas_userEmpresa UNIQUE (usuario_id, empresa_id),
        CONSTRAINT FK_UsuarioEmpresas_usuario FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
        CONSTRAINT FK_UsuarioEmpresas_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE
    );
    PRINT 'Tabla UsuarioEmpresas creada.';
END
ELSE
    PRINT 'Tabla UsuarioEmpresas ya existe — saltando creación.';

-- 4. Migrar datos existentes de Usuarios hacia UsuarioEmpresas
-- Solo inserta los que todavía no tienen membresía registrada
INSERT INTO UsuarioEmpresas (usuario_id, empresa_id, rol, activo, fecha_union)
SELECT 
    u.id,
    u.empresa_id,
    ISNULL(u.rol, 'vendedor'),
    1,
    ISNULL(u.creado_en, GETDATE())
FROM Usuarios u
WHERE u.empresa_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM UsuarioEmpresas ue 
      WHERE ue.usuario_id = u.id AND ue.empresa_id = u.empresa_id
  );

PRINT 'Migración 002 completada.';
