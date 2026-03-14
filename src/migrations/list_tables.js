// Test directo del query de estadísticas
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    const pool = await sql.connect(config);

    // Probar primero si [plan] existe en Empresa
    const colCheck = await pool.request().query(
        "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Empresa') ORDER BY column_id"
    );
    console.log('Columnas de Empresa:', colCheck.recordset.map(c => c.name).join(', '));

    // Probar el query completo con empresa_id = 1
    try {
        const r = await pool.request()
            .input('empresa_id', sql.Int, 1)
            .query(`
                SELECT
                    (SELECT COUNT(*) FROM Productos WHERE empresa_id = @empresa_id) AS total_productos,
                    (SELECT COUNT(*) FROM Usuarios WHERE empresa_id = @empresa_id) AS total_usuarios,
                    (SELECT COUNT(*) FROM Clientes WHERE empresa_id = @empresa_id) AS total_clientes,
                    (SELECT COUNT(*) FROM Facturas WHERE empresa_id = @empresa_id) AS total_facturas,
                    (SELECT ISNULL(SUM(total), 0) FROM Facturas WHERE empresa_id = @empresa_id) AS ventas_totales,
                    (SELECT TOP 1 [plan] FROM Empresa WHERE id = @empresa_id) AS plan_activo,
                    (SELECT TOP 1 fecha_registro FROM Empresa WHERE id = @empresa_id) AS miembro_desde
            `);
        console.log('Query OK:', JSON.stringify(r.recordset[0], null, 2));
    } catch (e) {
        console.error('Error en query:', e.message);

        // Probar si Clientes tiene empresa_id
        try {
            const c2 = await pool.request().query(
                "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') ORDER BY column_id"
            );
            console.log('Columnas de Clientes:', c2.recordset.map(c => c.name).join(', '));
        } catch (e2) { console.error('Error check clientes:', e2.message); }

        try {
            const c3 = await pool.request().query(
                "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas') ORDER BY column_id"
            );
            console.log('Columnas de Facturas:', c3.recordset.map(c => c.name).join(', '));
        } catch (e3) { console.error('Error check facturas:', e3.message); }
    }

    await pool.close();
}

run().catch(e => console.error('Fatal:', e.message));
