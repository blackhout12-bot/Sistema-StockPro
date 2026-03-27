const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT id, nombre, empresa_id FROM Sucursales WHERE id = 59");
    console.log('Sucursal 59 Info:', res.recordset[0]);
    
    const res2 = await pool.request().query("SELECT id, nombre, empresa_id FROM Productos WHERE nombre LIKE '%YERBA%'");
    console.log('Productos Yerba:', res2.recordset);

    const res3 = await pool.request().query("SELECT * FROM Empresa");
    console.log('Empresas en DB:', res3.recordset);

    const res4 = await pool.request().query("SELECT u.id, u.nombre, ue.empresa_id FROM Usuarios u JOIN UsuarioEmpresas ue ON u.id = ue.usuario_id WHERE u.nombre LIKE '%Edprueba2%'");
    console.log('Usuario Contexto:', res4.recordset);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
