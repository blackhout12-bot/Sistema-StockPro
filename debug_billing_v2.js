const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function debugBilling() {
    try {
        const pool = await connectDB();
        console.log('--- DIAGNÓSTICO PROFUNDO DE FACTURACIÓN ---');

        console.log('\n1. Verificando Tablas Críticas:');
        const tables = ['Facturas', 'Detalle_Facturas', 'Productos', 'Lotes', 'Movimientos', 'ConfigComprobantes', 'Notificaciones'];
        for (const table of tables) {
            const exists = await pool.request().query(`SELECT 1 FROM sys.tables WHERE name = '${table}'`).then(r => r.recordset.length > 0);
            console.log(`- Tabla [${table}]: ${exists ? 'EXISTE' : 'MISSING'}`);
        }

        console.log('\n2. Verificando Columnas en Facturas:');
        const factCols = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Facturas')");
        console.log('Columnas Facturas:', factCols.recordset.map(r => r.name).join(', '));

        console.log('\n3. Verificando Columnas en Detalle_Facturas:');
        const detCols = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('Detalle_Facturas')");
        console.log('Columnas Detalle_Facturas:', detCols.recordset.map(r => r.name).join(', '));

        console.log('\n4. Verificando ConfigComprobantes Activos:');
        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE activo = 1");
        console.log('Configs activas:', configs.recordset.length);
        if (configs.recordset.length > 0) {
            configs.recordset.forEach(c => console.log(`  - Tipo: ${c.tipo_comprobante}, Prefijo: ${c.prefijo}, Próximo: ${c.proximo_nro}`));
        }

        console.log('\n5. Prueba de Query de Inserción (Simulada):');
        // Verificamos si existe la columna cliente_nombre_snapshot por ejemplo
        const hasSnap = factCols.recordset.some(c => c.name === 'cliente_nombre_snapshot');
        console.log('¿Tiene snapshots?:', hasSnap);

        process.exit(0);
    } catch (e) {
        console.error('Error en diagnóstico:', e);
        process.exit(1);
    }
}
debugBilling();
