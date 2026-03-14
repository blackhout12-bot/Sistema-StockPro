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
  },
  connectTimeout: 5000 // 5 segundos para fallar rápido
};

async function test() {
  console.log('Intentando conectar a SQL Server:', dbConfig.server);
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Conexión exitosa');
    const result = await pool.request().query('SELECT TOP 1 1 as ok');
    console.log('✅ Query exitosa:', result.recordset);
    await pool.close();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    if (err.code === 'ETIMEOUT') console.log('Sugerencia: Verificar que SQL Server esté corriendo y acepte conexiones TCP/IP.');
  }
}

test();
