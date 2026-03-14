-- src/migrations/013_depositos_y_transferencias.sql

BEGIN TRANSACTION;

-- 1. Crear tabla de Depósitos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Depositos' AND xtype='U')
BEGIN
    CREATE TABLE Depositos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        nombre NVARCHAR(100) NOT NULL,
        direccion NVARCHAR(255) NULL,
        es_principal BIT DEFAULT 0,
        activo BIT DEFAULT 1,
        creado_en DATETIME2 DEFAULT GETUTCDATE(),
        actualizado_en DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Depositos_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
END

-- 2. Crear tabla puente para Múltiples Depósitos por Producto
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductoDepositos' AND xtype='U')
BEGIN
    CREATE TABLE ProductoDepositos (
        producto_id INT NOT NULL,
        deposito_id INT NOT NULL,
        cantidad DECIMAL(18,2) DEFAULT 0,
        actualizado_en DATETIME2 DEFAULT GETUTCDATE(),
        PRIMARY KEY (producto_id, deposito_id),
        CONSTRAINT FK_ProdDep_Producto FOREIGN KEY (producto_id) REFERENCES Productos(id),
        CONSTRAINT FK_ProdDep_Deposito FOREIGN KEY (deposito_id) REFERENCES Depositos(id)
    );
END

-- 3. Crear tabla log de Transferencias entre depósitos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TransferenciasStock' AND xtype='U')
BEGIN
    CREATE TABLE TransferenciasStock (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        deposito_origen_id INT NOT NULL,
        deposito_destino_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad DECIMAL(18,2) NOT NULL,
        usuario_id INT NOT NULL,
        motivo NVARCHAR(255) NULL,
        creado_en DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Trans_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id),
        CONSTRAINT FK_Trans_DepOrigen FOREIGN KEY (deposito_origen_id) REFERENCES Depositos(id),
        CONSTRAINT FK_Trans_DepDestino FOREIGN KEY (deposito_destino_id) REFERENCES Depositos(id),
        CONSTRAINT FK_Trans_Prod FOREIGN KEY (producto_id) REFERENCES Productos(id),
        CONSTRAINT FK_Trans_User FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
    );
END

-- 4. Alterar Movimientos de Stock actuales para soportar depósitos
IF COL_LENGTH('Movimientos', 'deposito_origen_id') IS NULL
BEGIN
    ALTER TABLE Movimientos ADD deposito_origen_id INT NULL;
    ALTER TABLE Movimientos ADD CONSTRAINT FK_Mov_DepOrigen FOREIGN KEY (deposito_origen_id) REFERENCES Depositos(id);
END

IF COL_LENGTH('Movimientos', 'deposito_destino_id') IS NULL
BEGIN
    ALTER TABLE Movimientos ADD deposito_destino_id INT NULL;
    ALTER TABLE Movimientos ADD CONSTRAINT FK_Mov_DepDestino FOREIGN KEY (deposito_destino_id) REFERENCES Depositos(id);
END

-- 5. Alterar Detalle_Facturas (Opcional: registrar de qué depósito salió en las ventas)
IF COL_LENGTH('Detalle_Facturas', 'deposito_id') IS NULL
BEGIN
    ALTER TABLE Detalle_Facturas ADD deposito_id INT NULL;
    ALTER TABLE Detalle_Facturas ADD CONSTRAINT FK_FacItems_Dep FOREIGN KEY (deposito_id) REFERENCES Depositos(id);
END

-- 6. SEED: Poblar datos históricos para no romper el sistema
PRINT 'Iniciando Seed de Depósitos y Stock Histórico...';

DECLARE @emp_id INT;
DECLARE cur_empresas CURSOR FOR SELECT id FROM Empresa;

OPEN cur_empresas;
FETCH NEXT FROM cur_empresas INTO @emp_id;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @nuevo_deposito_id INT;
    
    -- Si la empresa no tiene depósito principal, lo creamos
    IF NOT EXISTS (SELECT 1 FROM Depositos WHERE empresa_id = @emp_id AND es_principal = 1)
    BEGIN
        INSERT INTO Depositos (empresa_id, nombre, direccion, es_principal)
        VALUES (@emp_id, 'Depósito Principal', 'Sede Central', 1);
        SET @nuevo_deposito_id = SCOPE_IDENTITY();
        PRINT 'Creado Depósito Principal para la empresa: ' + CAST(@emp_id AS VARCHAR);
    END
    ELSE
    BEGIN
        SELECT TOP 1 @nuevo_deposito_id = id FROM Depositos WHERE empresa_id = @emp_id AND es_principal = 1;
    END

    -- Migrar stock actual a la tabla puente (ProductoDepositos) solo si el producto no existe ahí
    INSERT INTO ProductoDepositos (producto_id, deposito_id, cantidad)
    SELECT p.id, @nuevo_deposito_id, ISNULL(p.stock, 0)
    FROM Productos p
    WHERE p.empresa_id = @emp_id
      AND NOT EXISTS (
          SELECT 1 FROM ProductoDepositos pd 
          WHERE pd.producto_id = p.id AND pd.deposito_id = @nuevo_deposito_id
      );

    FETCH NEXT FROM cur_empresas INTO @emp_id;
END;

CLOSE cur_empresas;
DEALLOCATE cur_empresas;

PRINT 'Seed Completado.';

COMMIT TRANSACTION;

