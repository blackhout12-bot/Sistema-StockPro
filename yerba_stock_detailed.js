const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const query = `
      SELECT p.id, p.nombre, p.empresa_id, pd.deposito_id, pd.cantidad, d.nombre as deposito_nombre
      FROM Productos p
      LEFT JOIN ProductoDepositos pd ON p.id = pd.producto_id
      LEFT JOIN Depositos d ON pd.deposito_id = d.id
      WHERE p.nombre LIKE '%YERBA%'
    `;
    const res = await pool.request().query(query);
    console.log('Yerba Stock Detailed:', JSON.stringify(res.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
