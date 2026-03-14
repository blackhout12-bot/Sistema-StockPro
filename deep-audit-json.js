const { connectDB, sql } = require('./src/config/db');

async function audit() {
    let pool;
    try {
        pool = await connectDB();
        const report = {};

        report.recentFacturas = (await pool.request().query("SELECT TOP 20 id, nro_factura, tipo_comprobante FROM Facturas ORDER BY id DESC")).recordset;
        report.configs = (await pool.request().query("SELECT * FROM ConfigComprobantes")).recordset;

        const identity = await pool.request().query("SELECT IDENT_CURRENT('Facturas') as current_identity, IDENT_INCR('Facturas') as increment_value");
        report.identity = identity.recordset[0];

        // Ver si el proximo numero colisiona
        report.collisions = [];
        for (const conf of report.configs) {
            const padding = '00000000';
            const numStr = (padding + conf.proximo_nro).slice(-8);
            const letter = (conf.tipo_comprobante || 'F')[0].toUpperCase();
            const predicted = `${letter}${conf.prefijo}-${conf.empresa_id}-${numStr}`;
            
            const collision = await pool.request()
                .input('pred', sql.VarChar, predicted)
                .query('SELECT id FROM Facturas WHERE nro_factura = @pred');
            
            if (collision.recordset.length > 0) {
                report.collisions.push({ configId: conf.id, predicted, existsInFacturaId: collision.recordset[0].id });
            }
        }

        console.log(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

audit();
