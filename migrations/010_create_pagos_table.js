const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

async function migrate() {
  console.log('Iniciando migración de tabla Pagos...');
  try {
    const pool = await sql.connect(dbConfig);
    
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pagos' AND xtype='U')
      CREATE TABLE Pagos (
        id INT PRIMARY KEY IDENTITY(1,1),
        usuario_id INT NOT NULL,
        empresa_id INT NOT NULL,
        monto DECIMAL(18,2) NOT NULL,
        moneda VARCHAR(10) DEFAULT 'ARS',
        estado VARCHAR(50) NOT NULL, -- pending, approved, rejected
        referencia_externa VARCHAR(255),
        metodo_pago VARCHAR(50), -- mercadopago, stripe
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Pagos_Usuarios FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
        CONSTRAINT FK_Pagos_Empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
      );
    `;
    
    await pool.request().query(query);
    console.log('✅ Tabla Pagos creada o ya existente.');
    await pool.close();
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  }
}

migrate();
