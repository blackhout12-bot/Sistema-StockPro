const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT id, nombre, empresa_id, stock FROM Productos WHERE nombre LIKE '%YERBA%'");
    console.log('Productos Yerba:', JSON.stringify(res.recordset, null, 2));
    
    const res2 = await pool.request().query("SELECT id, nombre, empresa_id FROM Sucursales WHERE id = 59");
    console.log('Sucursal 59:', JSON.stringify(res2.recordset, null, 2));

    const res3 = await pool.request().query("SELECT TOP 1 * FROM Empresa");
    console.log('Empresa:', JSON.stringify(res3.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
