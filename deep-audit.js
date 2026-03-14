const { connectDB, sql } = require('./src/config/db');

async function audit() {
    let pool;
    try {
        pool = await connectDB();
        
        console.log('--- AUDITORÍA PROFUNDA DE NUMERACIÓN ---');

        // 1. Ver todas las Facturas recientes
        const facturas = await pool.request().query("SELECT TOP 20 id, nro_factura, tipo_comprobante FROM Facturas ORDER BY id DESC");
        console.log('\n[1] Últimas 20 facturas:');
        console.table(facturas.recordset);

        // 2. Ver todas las configuraciones
        const configs = await pool.request().query("SELECT * FROM ConfigComprobantes");
        console.log('\n[2] Configuraciones actuales:');
        console.table(configs.recordset);

        // 3. Simular la lógica de generación de número
        console.log('\n[3] Simulación de colisiones:');
        for (const conf of configs.recordset) {
            const padding = '00000000';
            const numStr = (padding + conf.proximo_nro).slice(-8);
            const letter = (conf.tipo_comprobante || 'F')[0].toUpperCase();
            const predicted = `${letter}${conf.prefijo}-${conf.empresa_id}-${numStr}`;
            
            const collision = await pool.request()
                .input('pred', sql.VarChar, predicted)
                .query('SELECT id FROM Facturas WHERE nro_factura = @pred');
            
            if (collision.recordset.length > 0) {
                console.log(`❌ COLISIÓN: El próximo nro ${predicted} ya existe (Config ID: ${conf.id})`);
            } else {
                console.log(`✅ DISPONIBLE: El próximo nro ${predicted} está libre (Config ID: ${conf.id})`);
            }
        }

        // 4. Verificar ID de Facturas (Identity)
        const identity = await pool.request().query("SELECT IDENT_CURRENT('Facturas') as current_identity, IDENT_INCR('Facturas') as increment_value");
        console.log('\n[4] Identity Seed (Facturas):');
        console.table(identity.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

audit();
