const { connectDB } = require('./src/config/db');

async function syncInvoices() {
    try {
        const pool = await connectDB();
        console.log('--- SINCRONIZANDO NUMERACIÓN DE COMPROBANTES ---');

        const configs = await pool.request().query("SELECT id, prefijo, empresa_id FROM ConfigComprobantes WHERE activo = 1");

        for (const config of configs.recordset) {
            const { id, prefijo, empresa_id } = config;

            // Buscar la factura más alta con ese prefijo para esa empresa
            // El formato es PREFIJO + 8 dígitos correlativos
            const result = await pool.request()
                .input('prefijo', prefijo)
                .input('emp_id', empresa_id)
                .query(`
                    SELECT MAX(CAST(SUBSTRING(nro_factura, LEN(@prefijo) + 1, 8) AS INT)) as max_nro 
                    FROM Facturas 
                    WHERE empresa_id = @emp_id AND nro_factura LIKE @prefijo + '%'
                `);

            let nextNro = 1;
            if (result.recordset[0] && result.recordset[0].max_nro) {
                nextNro = result.recordset[0].max_nro + 1;
            }

            console.log(`Empresa ${empresa_id}, Config ${id}, Prefijo ${prefijo} -> Proximo Nro Sugerido: ${nextNro}`);

            await pool.request()
                .input('id', id)
                .input('next', nextNro)
                .query("UPDATE ConfigComprobantes SET proximo_nro = @next WHERE id = @id");
        }

        console.log('Sincronización completada.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

syncInvoices();
