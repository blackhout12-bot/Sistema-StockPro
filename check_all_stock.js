const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT p.nombre, d.nombre as deposito, pd.cantidad as stock_en_deposito FROM Productos p INNER JOIN ProductoDepositos pd ON p.id = pd.producto_id INNER JOIN Depositos d ON pd.deposito_id = d.id WHERE p.nombre LIKE '%GALLETITAS%'");
    console.log(JSON.stringify(res.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
