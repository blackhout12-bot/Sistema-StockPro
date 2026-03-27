const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT * FROM Empresas");
    console.log('Empresas:', JSON.stringify(res.recordset, null, 2));
    
    const res2 = await pool.request().query("SELECT * FROM Sucursales");
    console.log('Sucursales:', JSON.stringify(res2.recordset, null, 2));

    const res3 = await pool.request().query("SELECT d.id, d.nombre, d.sucursal_id, s.nombre as sucursal_nombre FROM Depositos d LEFT JOIN Sucursales s ON d.sucursal_id = s.id");
    console.log('Depositos vinculados:', JSON.stringify(res3.recordset, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
