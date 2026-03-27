const { connectDB } = require('./src/config/db');
async function run() {
  try {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT id, nombre, email, activo FROM Usuarios WHERE email = 'prueba2@prueba.com'");
    console.log('User Info:', JSON.stringify(res.recordset, null, 2));
    
    if (res.recordset.length > 0) {
      const userId = res.recordset[0].id;
      const res2 = await pool.request().input('userId', userId).query("SELECT * FROM UsuarioEmpresas WHERE usuario_id = @userId");
      console.log('User Companies:', JSON.stringify(res2.recordset, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
