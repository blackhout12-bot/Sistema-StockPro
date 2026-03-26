const { connectDB, sql } = require('./src/config/db');
const authRepository = require('./src/repositories/auth.repository');

async function simulate() {
    const usuario_id = 16;
    const empresa_id = 1;

    try {
        const pool = await connectDB();
        const uRes = await pool.request()
            .input('uid', sql.Int, usuario_id)
            .query('SELECT id, nombre, email, empresa_id, rol FROM Usuarios WHERE id = @uid');
        const usuario = uRes.recordset[0];
        console.log('USUARIO:', JSON.stringify(usuario));

        const membresia = await authRepository.obtenerMembresia(usuario_id, empresa_id);
        console.log('MEMBRESIA:', JSON.stringify(membresia));

        if (!membresia || !membresia.activo) {
            console.log('FAIL: !membresia || !membresia.activo');
        } else {
            console.log('SUCCESS: Access Granted');
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

simulate();
