const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function fixSequences() {
    try {
        const pool = await connectDB();
        console.log('--- RESINCRONIZACIÓN DE SECUENCIAS ---');

        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE activo = 1");

        for (const conf of configs.recordset) {
            console.log(`\nConfig [${conf.id}] - Prefijo: ${conf.prefijo} (Tipo: ${conf.tipo_comprobante})...`);

            // Buscamos el máximo nro usado con este prefijo
            const maxRes = await pool.request()
                .input('prefijo', sql.VarChar, conf.prefijo)
                .query("SELECT MAX(nro_factura) as max_nro FROM Facturas WHERE nro_factura LIKE @prefijo + '%'");

            const maxNroStr = maxRes.recordset[0].max_nro;
            if (maxNroStr) {
                // Extraer parte numérica (asumiendo formato Prefijo + 8 dígitos)
                const numPart = maxNroStr.replace(conf.prefijo, '');
                const currentMax = parseInt(numPart) || 0;
                const newNext = currentMax + 1;

                console.log(`  - Máximo en DB: ${maxNroStr} (Número: ${currentMax})`);
                console.log(`  - Actualizando proximo_nro de ${conf.proximo_nro} a ${newNext}`);

                await pool.request()
                    .input('newNext', sql.Int, newNext)
                    .input('id', sql.Int, conf.id)
                    .query("UPDATE ConfigComprobantes SET proximo_nro = @newNext WHERE id = @id");
            } else {
                console.log('  - No se hallaron facturas para este prefijo.');
            }
        }

        console.log('\nSincronización aplicada exitosamente.');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
fixSequences();
