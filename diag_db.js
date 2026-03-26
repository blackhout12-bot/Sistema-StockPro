const { connectDB, sql } = require('./src/config/db');

async function checkData() {
    try {
        console.log('--- Iniciando Diagnóstico de Datos ---');
        const pool = await connectDB();
        console.log('Conexión a DB: OK');

        const tables = await pool.query("SELECT name FROM sys.tables");
        console.log('Tablas encontradas:', tables.recordset.map(t => t.name).join(', '));

        const counts = {};
        if (tables.recordset.some(t => t.name === 'Usuarios')) {
            const res = await pool.query("SELECT COUNT(*) as count FROM Usuarios");
            counts.Usuarios = res.recordset[0].count;
        }
        if (tables.recordset.some(t => t.name === 'Empresa')) {
            const res = await pool.query("SELECT COUNT(*) as count FROM Empresa");
            counts.Empresa = res.recordset[0].count;
        }
        if (tables.recordset.some(t => t.name === 'Productos')) {
            const res = await pool.query("SELECT empresa_id, COUNT(*) as count FROM Productos GROUP BY empresa_id");
            console.log('Productos por empresa_id:', res.recordset);
        }

        console.log('Conteo de registros:', counts);
        process.exit(0);
    } catch (err) {
        console.error('ERROR de Diagnóstico:', err.message);
        process.exit(1);
    }
}

checkData();
