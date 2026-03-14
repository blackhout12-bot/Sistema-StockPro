const { connectDB } = require('./src/config/db');
const sql = require('mssql');

async function fixSequences() {
    try {
        const pool = await connectDB();
        console.log('--- CORRIGIENDO SECUENCIAS DE COMPROBANTES ---');

        // Obtener todos los configuradores
        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE activo = 1");

        for (const conf of configs.recordset) {
            console.log(`Procesando prefix: ${conf.prefijo} (Empresa: ${conf.empresa_id})...`);

            // Buscar el máximo número usado para este prefijo en Facturas
            // OJO: nro_factura es VARCHAR, buscamos los que empiezan con el prefijo
            const maxRes = await pool.request()
                .input('prefijo', sql.VarChar, conf.prefijo)
                .query("SELECT MAX(nro_factura) as max_nro FROM Facturas WHERE nro_factura LIKE @prefijo + '%'");

            const maxNroStr = maxRes.recordset[0].max_nro;
            if (maxNroStr) {
                // Extraer la parte numérica (asumimos que los últimos 8 son el número según la lógica del repo)
                const numPart = maxNroStr.replace(conf.prefijo, '');
                const currentMax = parseInt(numPart) || 0;
                const newNext = currentMax + 1;

                console.log(`  - Máximo actual encontrado: ${maxNroStr} -> Número: ${currentMax}`);
                console.log(`  - Actualizando proximo_nro a: ${newNext}`);

                await pool.request()
                    .input('newNext', sql.Int, newNext)
                    .input('id', sql.Int, conf.id)
                    .query("UPDATE ConfigComprobantes SET proximo_nro = @newNext WHERE id = @id");
            } else {
                console.log('  - No se encontraron facturas con este prefijo. Manteniendo secuencia.');
            }
        }

        console.log('Sincronización finalizada.');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
fixSequences();
