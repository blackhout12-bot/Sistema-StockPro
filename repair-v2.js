const { connectDB, sql } = require('./src/config/db');

async function repair() {
    let pool;
    try {
        pool = await connectDB();
        console.log('--- REPARACIÓN DEFINITIVA DE CONTADORES ---');

        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes WHERE activo = 1");
        
        for (const conf of configs.recordset) {
            const letter = (conf.tipo_comprobante || 'F')[0].toUpperCase();
            const pattern = `${letter}${conf.prefijo}-${conf.empresa_id}-%`;
            
            const maxResult = await pool.request()
                .input('pattern', sql.VarChar, pattern)
                .query(`
                    SELECT MAX(nro_factura) as max_nro 
                    FROM Facturas 
                    WHERE nro_factura LIKE @pattern
                `);
            
            const maxNro = maxResult.recordset[0].max_nro;
            if (maxNro) {
                // Extraer los últimos 8 dígitos
                const lastPart = maxNro.split('-').pop();
                const lastNum = parseInt(lastPart) || 0;
                const nextNum = lastNum + 1;
                
                console.log(`[REPAIR] Config ID ${conf.id} (${conf.tipo_comprobante}): Actual ${conf.proximo_nro} -> Seteando a ${nextNum} (Max detectado: ${maxNro})`);
                
                await pool.request()
                    .input('cid', sql.Int, conf.id)
                    .input('next', sql.Int, nextNum)
                    .query("UPDATE ConfigComprobantes SET proximo_nro = @next WHERE id = @cid");
            } else {
                console.log(`[SKIP] Config ID ${conf.id}: No pre-existing invoices for pattern ${pattern}`);
            }
        }

        console.log('✅ REPARACIÓN COMPLETADA');

    } catch (err) {
        console.error('❌ ERROR:', err);
    } finally {
        process.exit(0);
    }
}

repair();
