const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT p.id, p.nombre, p.stock, pd.deposito_id, pd.cantidad as stock_deposito FROM Productos p LEFT JOIN ProductoDepositos pd ON p.id = pd.producto_id WHERE p.nombre LIKE '%GALLETITAS%'");
    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
