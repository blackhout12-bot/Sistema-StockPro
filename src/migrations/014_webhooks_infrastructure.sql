-- src/migrations/014_webhooks_infrastructure.sql
-- Objetivo: Crear la infraestructura para suscripciones a eventos externos (Webhooks)

USE StockDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Webhooks')
BEGIN
    CREATE TABLE Webhooks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        empresa_id INT NOT NULL,
        url_destino NVARCHAR(1000) NOT NULL,
        evento NVARCHAR(100) NOT NULL, -- Ej: 'stock.updated', 'factura.created', 'cliente.created'
        secret_token NVARCHAR(255),    -- Para que el cliente valide que el POST viene de nosotros
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT FK_Webhooks_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    );
    
    CREATE INDEX IX_Webhooks_Empresa_Evento ON Webhooks(empresa_id, evento);
    
    PRINT 'Tabla de Webhooks creada exitosamente.';
END
GO
