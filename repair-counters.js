const { connectDB, sql } = require('./src/config/db');

async function repair() {
    let pool;
    try {
        pool = await connectDB();
        console.log('--- REPARANDO CONTADORES (Senior Fix) ---');

        // 1. Eliminar duplicaciones en ConfigComprobantes (Quedarnos solo con uno por empresa/tipo)
        console.log('[1] Deduplicando ConfigComprobantes...');
        await pool.request().query(`
            WITH CTE AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY empresa_id, tipo_comprobante ORDER BY id ASC) as rn
                FROM ConfigComprobantes
            )
            DELETE FROM ConfigComprobantes WHERE id IN (SELECT id FROM CTE WHERE rn > 1)
        `);

        // 2. Sincronizar proximo_nro basado en Facturas existentes para cada Config.
        console.log('[2] Sincronizando proximo_nro...');
        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes");
        
        for (const conf of configs.recordset) {
            // Buscamos el mayor número en Facturas que coincida con el patrón de esta configuración
            // Patrón: {Letter}{Prefijo}-{EmpresaID}-XXXXXXXX
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
                
                console.log(`[SYNC] Config ID ${conf.id}: Max detectado ${maxNro} (${lastNum}). Seteando próximo a ${nextNum}`);
                
                await pool.request()
                    .input('cid', sql.Int, conf.id)
                    .input('next', sql.Int, nextNum)
                    .query("UPDATE ConfigComprobantes SET proximo_nro = @next WHERE id = @cid");
            } else {
                console.log(`[SYNC] Config ID ${conf.id}: No se encontraron facturas previas con este patrón. Se mantiene en ${conf.proximo_nro}`);
            }
        }

        console.log('✅ REPARACIÓN COMPLETADA');

    } catch (err) {
        console.error('❌ ERROR DURANTE REPARACIÓN:', err);
    } finally {
        process.exit(0);
    }
}

repair();
