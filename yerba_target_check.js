const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT p.id, p.nombre, pd.cantidad FROM Productos p LEFT JOIN ProductoDepositos pd ON p.id = pd.producto_id WHERE pd.deposito_id = 59 AND p.nombre LIKE '%YERBA%'");
    console.log('Stock Yerba en Depo 59:', JSON.stringify(res.recordset, null, 2));
    
    const res2 = await pool.request().query("SELECT p.id, p.nombre, p.stock as stock_global FROM Productos p WHERE p.empresa_id = 59 AND p.nombre LIKE '%YERBA%'");
    console.log('Todos los productos Yerba (Empresa 59):', JSON.stringify(res2.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
