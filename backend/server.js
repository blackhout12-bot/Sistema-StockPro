const express = require('express');
const cors = require('cors');
const sql = require('mssql');

require('dotenv').config({ path: '../.env' }); // Load .env from root

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de conexión a SQL Server
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// GET: obtener productos
app.get('/api/products', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request().query(`
      SELECT id, nombre, descripcion, precio, stock_actual, creado_en
      FROM Productos
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en GET /api/products:', err);
    res.status(500).send('Error al obtener productos');
  }
});

// POST: agregar producto
app.post('/api/products', async (req, res) => {
  const { nombre, descripcion, precio, stock_actual } = req.body;
  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .input('nombre', sql.NVarChar(150), nombre)
      .input('descripcion', sql.NVarChar(255), descripcion || null)
      .input('precio', sql.Decimal(10, 2), precio)
      .input('stock_actual', sql.Int, stock_actual || 0)
      .query(`
        INSERT INTO Productos (nombre, descripcion, precio, stock_actual)
        OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.descripcion, INSERTED.precio, INSERTED.stock_actual, INSERTED.creado_en
        VALUES (@nombre, @descripcion, @precio, @stock_actual)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error en POST /api/products:', err);
    res.status(500).send('Error al agregar producto');
  }
});

app.listen(5000, () => {
  console.log('Servidor backend corriendo en http://localhost:5000');
});
