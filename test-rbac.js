require('dotenv').config();
require('./src/config/db').connectDB().then(pool => pool.request().query("UPDATE UsuarioEmpresas SET rol='admin' WHERE usuario_id=1 AND empresa_id=1").then(r => {console.log('Filas Afectadas:', r.rowsAffected); process.exit(0)})).catch(console.error);
